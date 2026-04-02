/**
 * Takeoff Controller
 *
 * Quantity takeoff workspace — Phase 1 (Costing Phase 1).
 *
 * Provides endpoints for reading quantity records extracted from BIM model
 * elements and conversion candidates, grouped by discipline / level / zone /
 * element type. Also handles generating a new takeoff revision and returning
 * per-revision summaries.
 *
 * Does NOT contain rate/BOQ engine — that is Costing Phase 2.
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../common/middleware/auth.js";
import { requireRoles } from "../../common/middleware/rbac.js";
import {
  mockTakeoffRevisions,
  mockQuantityRecords,
  mockBimElements,
} from "../../data/mock.js";
import type { TakeoffRevision, QuantityRecord } from "../../types.js";

export const takeoffRouter = Router();

// ── LIST REVISIONS  GET /takeoff/revisions?projectId= ─────────────────────────

takeoffRouter.get("/revisions", requireAuth, (req, res) => {
  const { projectId } = req.query;
  let revisions = mockTakeoffRevisions.slice();
  if (projectId && typeof projectId === "string") {
    revisions = revisions.filter((r) => r.projectId === projectId);
  }
  // Sort descending by revisionNumber
  revisions.sort((a, b) => b.revisionNumber - a.revisionNumber);
  res.json({ data: revisions, total: revisions.length });
});

// ── LIST QUANTITIES  GET /takeoff/quantities?revisionId=&discipline=&level=&zone=&elementType= ─

takeoffRouter.get("/quantities", requireAuth, (req, res) => {
  const { revisionId, discipline, level, zone, elementType } = req.query;

  let rows = mockQuantityRecords.slice();

  if (revisionId   && typeof revisionId   === "string") rows = rows.filter((r) => r.revisionId   === revisionId);
  if (discipline   && typeof discipline   === "string") rows = rows.filter((r) => r.discipline   === discipline);
  if (level        && typeof level        === "string") rows = rows.filter((r) => r.level        === level);
  if (zone         && typeof zone         === "string") rows = rows.filter((r) => r.zone         === zone);
  if (elementType  && typeof elementType  === "string") rows = rows.filter((r) => r.elementType  === elementType);

  // Sort: discipline → level → elementType → id
  rows.sort((a, b) =>
    a.discipline.localeCompare(b.discipline) ||
    a.level.localeCompare(b.level) ||
    a.elementType.localeCompare(b.elementType) ||
    a.id.localeCompare(b.id)
  );

  res.json({ data: rows, total: rows.length });
});

// ── SUMMARY  GET /takeoff/summary?revisionId= ────────────────────────────────

takeoffRouter.get("/summary", requireAuth, (req, res) => {
  const { revisionId } = req.query;
  if (!revisionId || typeof revisionId !== "string") {
    res.status(400).json({ message: "revisionId is required" });
    return;
  }

  const rows = mockQuantityRecords.filter((r) => r.revisionId === revisionId);

  const byDiscipline: Record<string, { count: number; units: Record<string, number> }> = {};
  const byElementType: Record<string, number> = {};
  const byLevel: Record<string, number> = {};

  for (const row of rows) {
    // byDiscipline
    if (!byDiscipline[row.discipline]) byDiscipline[row.discipline] = { count: 0, units: {} };
    byDiscipline[row.discipline].count += 1;
    const existing = byDiscipline[row.discipline].units[row.unit] ?? 0;
    byDiscipline[row.discipline].units[row.unit] = existing + row.quantity;

    // byElementType
    byElementType[row.elementType] = (byElementType[row.elementType] ?? 0) + 1;

    // byLevel
    byLevel[row.level] = (byLevel[row.level] ?? 0) + 1;
  }

  res.json({
    data: {
      revisionId,
      totalRecords: rows.length,
      byDiscipline,
      byElementType,
      byLevel,
    },
  });
});

// ── GENERATE  POST /takeoff/generate ─────────────────────────────────────────
// Simulates extracting quantities from committed BIM elements.
// Creates a new "draft" revision for the project and seeds quantity records
// from mockBimElements (if any exist) or synthesises demo records.

const generateSchema = z.object({
  projectId: z.string().min(1),
  notes: z.string().optional(),
  generatedBy: z.string().optional(),
});

takeoffRouter.post(
  "/generate",
  requireAuth,
  requireRoles("ADMIN", "BIM_MANAGER", "BIM_ENGINEER"),
  (req, res) => {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
      return;
    }

    const { projectId, notes, generatedBy = "BIM Manager" } = parsed.data;

    // Determine next revision number
    const existing = mockTakeoffRevisions.filter((r) => r.projectId === projectId);
    const nextNum = existing.length > 0 ? Math.max(...existing.map((r) => r.revisionNumber)) + 1 : 1;

    const now = new Date().toISOString();
    const revId = `tr-${Date.now()}`;

    const newRevision: TakeoffRevision = {
      id: revId,
      projectId,
      revisionNumber: nextNum,
      label: `Rev-${String(nextNum).padStart(2, "0")} — Generated ${now.slice(0, 10)}`,
      generatedBy,
      generatedAt: now,
      status: "draft",
      notes: notes ?? null,
      createdAt: now,
    };

    mockTakeoffRevisions.push(newRevision);

    // Generate quantity records from committed BIM elements for this project
    const elements = mockBimElements.filter(
      (el) => el.projectId === projectId && el.status === "active"
    );

    const newRecords: QuantityRecord[] = elements.map((el, i) => ({
      id: `qr-gen-${Date.now()}-${i}`,
      revisionId: revId,
      projectId,
      bimElementId: el.id,
      conversionJobId: el.conversionJobId,
      discipline: el.discipline,
      level: (el.properties?.level as string) ?? "G",
      zone: (el.properties?.zone as string) ?? "Zone-A",
      elementType: el.elementType,
      description: el.label,
      unit: deriveUnit(el.elementType),
      quantity: deriveQuantity(el),
      sourceLayerRef: el.sourceLayerRef,
      sourceFileId: el.sourceFileId,
      extractedBy: generatedBy,
      createdAt: now,
    }));

    mockQuantityRecords.push(...newRecords);

    res.status(201).json({
      data: {
        revision: newRevision,
        recordsGenerated: newRecords.length,
      },
    });
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveUnit(elementType: string): string {
  const map: Record<string, string> = {
    wall: "m²", slab: "m²", opening: "m²",
    door: "nos", window: "nos", equipment: "nos",
    column: "m³", beam: "m³", footing: "m³",
    duct: "m", pipe: "m", cable_tray: "m",
    building: "nos", level: "nos", zone: "nos",
  };
  return map[elementType] ?? "nos";
}

function deriveQuantity(el: { elementType: string; properties: Record<string, string | number> }): number {
  const qty = el.properties?.quantity ?? el.properties?.area ?? el.properties?.volume ?? el.properties?.length;
  if (typeof qty === "number") return Math.round(qty * 100) / 100;
  // Fallback synthetic quantities for demo data
  const defaults: Record<string, number> = {
    wall: 120, slab: 250, door: 8, window: 12, column: 14.4,
    beam: 16.8, footing: 22.5, duct: 40, pipe: 60,
    cable_tray: 45, equipment: 1, opening: 6, building: 1, level: 1, zone: 1,
  };
  return defaults[el.elementType] ?? 1;
}
