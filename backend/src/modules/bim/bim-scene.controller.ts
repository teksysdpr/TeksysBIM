import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../common/middleware/auth.js";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BimScenePalette {
  categoryId: string | null;
  familyId: string | null;
  typeId: string | null;
  assemblyId: string | null;
  materialId: string | null;
}

interface BimSceneRecord {
  version: 1;
  projectId: string;
  savedAt: string;
  palette: BimScenePalette;
  activeTool: string | null;
  /**
   * Opaque array of placed scene entities (WallInstance, etc.).
   * The backend stores and returns this blob without inspecting its contents.
   * Schema is owned by the frontend's SceneEntity discriminated union.
   */
  entities: unknown[];
}

// ── In-memory store ────────────────────────────────────────────────────────────
//
// Session-persistent (survives requests within one server process).
// Not database-persisted — that migration is Phase 5 (backend persistence sprint).
// When the server restarts, scenes reset. The frontend's localStorage layer
// ensures the editor can still hydrate from the last browser-side save.

const sceneStore = new Map<string, BimSceneRecord>();

// ── Validation schema ──────────────────────────────────────────────────────────

const paletteSchema = z.object({
  categoryId: z.string().nullable(),
  familyId: z.string().nullable(),
  typeId: z.string().nullable(),
  assemblyId: z.string().nullable(),
  materialId: z.string().nullable(),
});

const sceneBodySchema = z.object({
  version: z.literal(1),
  projectId: z.string().min(1),
  palette: paletteSchema,
  activeTool: z.string().nullable(),
  // savedAt is intentionally ignored — server always sets its own timestamp
  // entities: opaque blob; backend stores/returns as-is without deep validation
  entities: z.array(z.unknown()).optional().default([]),
});

// ── Router ─────────────────────────────────────────────────────────────────────

export const bimRouter = Router();

/**
 * GET /api/bim/scene/:projectId
 * Returns the saved BIM scene state for the given project.
 * 404 when no scene has been saved yet.
 */
bimRouter.get("/scene/:projectId", requireAuth, (req, res) => {
  const { projectId } = req.params;
  const record = sceneStore.get(projectId);

  if (!record) {
    res.status(404).json({
      ok: false,
      message: "No saved scene found for this project.",
    });
    return;
  }

  res.json({ ok: true, data: record });
});

/**
 * PUT /api/bim/scene/:projectId
 * Saves (or replaces) the BIM scene state for the given project.
 * The server always overrides savedAt with the authoritative server timestamp.
 */
bimRouter.put("/scene/:projectId", requireAuth, (req, res) => {
  const { projectId } = req.params;

  const parsed = sceneBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      message: "Invalid scene payload.",
      errors: parsed.error.flatten(),
    });
    return;
  }

  if (parsed.data.projectId !== projectId) {
    res.status(400).json({
      ok: false,
      message: "projectId in body does not match the route parameter.",
    });
    return;
  }

  const record: BimSceneRecord = {
    version: 1,
    projectId,
    savedAt: new Date().toISOString(),
    palette: parsed.data.palette,
    activeTool: parsed.data.activeTool,
    entities: parsed.data.entities,
  };

  sceneStore.set(projectId, record);
  res.json({ ok: true, data: record });
});
