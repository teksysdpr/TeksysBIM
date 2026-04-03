// ── BIM Scene Service ─────────────────────────────────────────────────────────
//
// Handles save and load of per-project BIM editor scene state.
//
// Persistence strategy (layered, most-to-least resilient):
//  1. localStorage  — survives page refresh, browser session, server restarts
//  2. Backend API   — authoritative for multi-device / server-side record keeping
//
// On save:   writes localStorage first (guaranteed), then syncs to backend.
// On load:   tries backend first (most recent); falls back to localStorage.
//
// The localStorage key `bim_scene_<projectId>` is namespaced per project,
// satisfying the project-isolation requirement.

import { apiRequest } from "@/lib/apiClient";
import type { SceneEntity } from "@/app/editor/types/sceneTypes";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BimScenePalette {
  categoryId: string | null;
  familyId: string | null;
  typeId: string | null;
  assemblyId: string | null;
  materialId: string | null;
}

/**
 * The persisted shape of a BIM scene.
 * The `version` field enables forward-compatible migration.
 * `entities` is the placed-element array from sceneStore — opaque to the backend.
 */
export interface BimSceneData {
  version: 1;
  projectId: string;
  savedAt: string; // ISO-8601
  palette: BimScenePalette;
  activeTool: string | null;
  /** Placed scene entities (walls, slabs, etc.) from sceneStore. */
  entities: SceneEntity[];
}

/** What the caller provides; the service fills in savedAt. */
export type BimSceneSavePayload = Omit<BimSceneData, "savedAt">;

// ── localStorage helpers ───────────────────────────────────────────────────────

const lsKey = (projectId: string) => `bim_scene_${projectId}`;

function readFromLocalStorage(projectId: string): BimSceneData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(lsKey(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic shape validation
    if (parsed?.version !== 1 || parsed?.projectId !== projectId) return null;
    return parsed as BimSceneData;
  } catch {
    return null;
  }
}

function writeToLocalStorage(data: BimSceneData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(lsKey(data.projectId), JSON.stringify(data));
  } catch {
    // Storage quota exceeded or private browsing — safe to ignore
  }
}

// ── Backend helpers ────────────────────────────────────────────────────────────

async function fetchFromBackend(projectId: string): Promise<BimSceneData | null> {
  const resp = await apiRequest<{ ok: boolean; data: BimSceneData }>(
    `/bim/scene/${encodeURIComponent(projectId)}`
  );
  if (resp?.ok && resp.data?.version === 1) return resp.data;
  return null;
}

async function saveToBackend(payload: BimSceneData): Promise<BimSceneData | null> {
  const resp = await apiRequest<{ ok: boolean; data: BimSceneData }>(
    `/bim/scene/${encodeURIComponent(payload.projectId)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
  if (resp?.ok && resp.data?.version === 1) return resp.data;
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Loads the saved BIM scene for a project.
 *
 * Tries the backend first (canonical, multi-device).
 * Falls back to localStorage if the backend is unavailable or returns 404.
 * Returns null if no scene has been saved yet for this project.
 */
export async function fetchProjectScene(
  projectId: string
): Promise<BimSceneData | null> {
  // 1. Try backend
  try {
    const remote = await fetchFromBackend(projectId);
    if (remote) {
      // Warm the local cache in case the backend goes away later
      writeToLocalStorage(remote);
      return remote;
    }
  } catch {
    // Backend unavailable or 404 — not an error
  }

  // 2. Fallback: localStorage
  return readFromLocalStorage(projectId);
}

/**
 * Saves the current BIM scene state for a project.
 *
 * Always writes to localStorage first (guarantees refresh-persistence).
 * Then syncs to the backend. The backend's savedAt timestamp is used when
 * available; otherwise the locally-generated timestamp is kept.
 *
 * Returns the final BimSceneData record (with the authoritative savedAt).
 */
export async function saveProjectScene(
  projectId: string,
  payload: BimSceneSavePayload
): Promise<BimSceneData> {
  const localRecord: BimSceneData = {
    ...payload,
    savedAt: new Date().toISOString(),
  };

  // 1. Write to localStorage immediately
  writeToLocalStorage(localRecord);

  // 2. Sync to backend (use server's savedAt if available)
  try {
    const remote = await saveToBackend(localRecord);
    if (remote) {
      // Update localStorage with the server's authoritative timestamp
      writeToLocalStorage(remote);
      return remote;
    }
  } catch {
    // Backend unavailable — localStorage save is sufficient for this session
  }

  return localRecord;
}

/**
 * Removes any locally-cached scene for a project.
 * Called when the user explicitly discards all unsaved changes.
 * Does not delete the backend record.
 */
export function clearLocalScene(projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(lsKey(projectId));
  } catch {
    // ignore
  }
}
