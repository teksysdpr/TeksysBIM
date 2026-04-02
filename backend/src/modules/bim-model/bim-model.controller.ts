/**
 * BIM Model Controller
 *
 * Manages the BIM model metadata layer — the destination for approved
 * conversion candidates.
 *
 * BIM elements are the canonical model-side representation of converted objects.
 * Each element carries a reference back to its source candidate and conversion job,
 * enabling full lineage tracing from raw file → processed candidate → model element.
 *
 * Supported element types:
 *   Spatial:     building, level, zone
 *   Architectural: wall, slab, opening, door, window
 *   Structural:  column, beam, footing
 *   MEP:         duct, pipe, cable_tray, equipment
 *
 * In Phase 4 / geometric commit these elements will carry actual geometry
 * (coordinates, orientation, IFC GUIDs). For now they carry property metadata.
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../common/middleware/auth.js";
import { mockAuditEvents, mockBimElements } from "../../data/mock.js";
import { requireRoles } from "../../common/middleware/rbac.js";
import type { BimElementStatus } from "../../types.js";

// ── Validation ────────────────────────────────────────────────────────────────

const updateBimElementSchema = z.object({
  status: z.enum(["active", "superseded", "deleted"] as [BimElementStatus, ...BimElementStatus[]]).optional(),
  note:   z.string().optional(),
});

// ── Router ────────────────────────────────────────────────────────────────────

export const bimModelRouter = Router();

// LIST  GET /bim-elements?projectId=&conversionJobId=
bimModelRouter.get("/", requireAuth, (req, res) => {
  let rows = mockBimElements.slice();

  const { projectId, conversionJobId, discipline, elementType, status } = req.query;
  if (projectId      && typeof projectId      === "string") rows = rows.filter((e) => e.projectId      === projectId);
  if (conversionJobId && typeof conversionJobId === "string") rows = rows.filter((e) => e.conversionJobId === conversionJobId);
  if (discipline     && typeof discipline     === "string") rows = rows.filter((e) => e.discipline     === discipline);
  if (elementType    && typeof elementType    === "string") rows = rows.filter((e) => e.elementType    === elementType);
  if (status         && typeof status         === "string") rows = rows.filter((e) => e.status         === status);

  // Default: exclude deleted
  if (!status) rows = rows.filter((e) => e.status !== "deleted");

  res.json({ data: rows, total: rows.length });
});

// SUMMARY  GET /bim-elements/summary/:projectId
// NOTE: Must be declared BEFORE /:id to avoid "summary" being matched as an element id.
// Returns a flat count summary for a project's BIM model.
bimModelRouter.get("/summary/:projectId", requireAuth, (req, res) => {
  const elements = mockBimElements.filter(
    (e) => e.projectId === req.params.projectId && e.status === "active"
  );

  const byDiscipline: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const el of elements) {
    byDiscipline[el.discipline] = (byDiscipline[el.discipline] ?? 0) + 1;
    byType[el.elementType]      = (byType[el.elementType]      ?? 0) + 1;
  }

  res.json({
    data: {
      projectId: req.params.projectId,
      total:     elements.length,
      byDiscipline,
      byType,
    },
  });
});

// GET SINGLE  GET /bim-elements/:id
bimModelRouter.get("/:id", requireAuth, (req, res) => {
  const element = mockBimElements.find((e) => e.id === req.params.id);
  if (!element) {
    res.status(404).json({ message: "BIM element not found" });
    return;
  }
  res.json({ data: element });
});

// UPDATE STATUS  PATCH /bim-elements/:id
// Used to supersede or delete BIM elements (e.g. after revision).
bimModelRouter.patch(
  "/:id",
  requireAuth,
  requireRoles("ADMIN", "BIM_MANAGER", "BIM_ENGINEER"),
  (req, res) => {
    const element = mockBimElements.find((e) => e.id === req.params.id);
    if (!element) {
      res.status(404).json({ message: "BIM element not found" });
      return;
    }

    const parsed = updateBimElementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
      return;
    }

    const now    = new Date().toISOString();
    const before = { status: element.status };

    if (parsed.data.status !== undefined) element.status = parsed.data.status;
    element.updatedAt = now;

    if (parsed.data.status === "superseded" || parsed.data.status === "deleted") {
      mockAuditEvents.push({
        id:              `ae-${Date.now()}`,
        conversionJobId: element.conversionJobId,
        entityId:        element.id,
        entityType:      "bim_element",
        action:          "MODEL_ELEMENT_SUPERSEDED",
        actor:           "BIM Manager",
        before,
        after:           { status: parsed.data.status },
        note:            parsed.data.note ?? null,
        timestamp:       now,
      });
    }

    res.json({ data: element });
  }
);
