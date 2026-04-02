// ── Scene store ───────────────────────────────────────────────────────────────
// Normalised flat record of all BIM entities.
// The scene mesh is NOT the source of truth — this store is.
// Three.js objects are derived from this state on render.

import { create } from "zustand";
import type { BimEntity } from "../types/model";
import { buildMockScene } from "../lib/mockScene";

interface SceneState {
  // Flat entity record — indexed by entity ID
  entities: Record<string, BimEntity>;

  // Top-level root IDs (PROJECT nodes)
  rootIds: string[];

  // Which project is loaded
  activeProjectId: string | null;

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Replace entire entity map (e.g. on API load) */
  loadEntities: (entities: Record<string, BimEntity>, rootIds: string[]) => void;

  /** Load the built-in demo scene */
  loadMockScene: () => void;

  /** Patch a single entity's fields */
  patchEntity: (id: string, patch: Partial<BimEntity>) => void;

  /** Toggle entity visibility */
  setVisibility: (id: string, visible: boolean) => void;

  /** Toggle lock */
  setLocked: (id: string, locked: boolean) => void;

  /** Mark entity as dirty */
  markDirty: (id: string) => void;

  /** Clear dirty flag (after save) */
  clearDirty: (id: string) => void;

  /** Clear all entities */
  clearScene: () => void;
}

export const useSceneStore = create<SceneState>()((set) => ({
  entities: {},
  rootIds: [],
  activeProjectId: null,

  loadEntities: (entities, rootIds) =>
    set({ entities, rootIds, activeProjectId: rootIds[0] ?? null }),

  loadMockScene: () => {
    const { entities, rootIds } = buildMockScene();
    set({ entities, rootIds, activeProjectId: rootIds[0] ?? null });
  },

  patchEntity: (id, patch) =>
    set((s) => {
      if (!s.entities[id]) return s;
      return {
        entities: {
          ...s.entities,
          [id]: { ...s.entities[id], ...patch },
        },
      };
    }),

  setVisibility: (id, visible) =>
    set((s) => {
      if (!s.entities[id]) return s;
      return {
        entities: { ...s.entities, [id]: { ...s.entities[id], visible } },
      };
    }),

  setLocked: (id, locked) =>
    set((s) => {
      if (!s.entities[id]) return s;
      return {
        entities: { ...s.entities, [id]: { ...s.entities[id], locked } },
      };
    }),

  markDirty: (id) =>
    set((s) => {
      if (!s.entities[id]) return s;
      return {
        entities: { ...s.entities, [id]: { ...s.entities[id], dirty: true } },
      };
    }),

  clearDirty: (id) =>
    set((s) => {
      if (!s.entities[id]) return s;
      return {
        entities: { ...s.entities, [id]: { ...s.entities[id], dirty: false } },
      };
    }),

  clearScene: () => set({ entities: {}, rootIds: [], activeProjectId: null }),
}));

// ── Selectors ─────────────────────────────────────────────────────────────────

export function selectEntity(entities: Record<string, BimEntity>, id: string): BimEntity | undefined {
  return entities[id];
}

export function selectChildren(entities: Record<string, BimEntity>, parentId: string): BimEntity[] {
  const parent = entities[parentId];
  if (!parent) return [];
  return parent.childIds.map((cid) => entities[cid]).filter(Boolean) as BimEntity[];
}

export function selectLevels(entities: Record<string, BimEntity>): BimEntity[] {
  return Object.values(entities).filter((e) => e.type === "LEVEL");
}

export function selectElementsForLevel(
  entities: Record<string, BimEntity>,
  levelId: string
): BimEntity[] {
  const level = entities[levelId];
  if (!level) return [];
  return level.childIds
    .flatMap((cid) => {
      const child = entities[cid];
      if (!child) return [];
      if (child.type === "ELEMENT") return [child];
      // Recurse into ZONE
      if (child.type === "ZONE") {
        return child.childIds
          .map((eid) => entities[eid])
          .filter((e): e is BimEntity => !!e && e.type === "ELEMENT");
      }
      return [];
    });
}
