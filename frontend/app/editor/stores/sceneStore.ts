"use client";

import { create } from "zustand";
import type { BimEntity } from "../types/model";
import type { SceneEntity, WallInstance } from "../types/sceneTypes";
import { buildMockScene } from "../lib/mockScene";

interface SceneState {
  entities: Record<string, BimEntity>;
  placedEntities: SceneEntity[];
  rootIds: string[];
  activeProjectId: string | null;
  loadEntities: (entities: Record<string, BimEntity>, rootIds: string[]) => void;
  loadMockScene: () => void;
  patchEntity: (id: string, patch: Partial<BimEntity>) => void;
  setVisibility: (id: string, visible: boolean) => void;
  setLocked: (id: string, locked: boolean) => void;
  markDirty: (id: string) => void;
  clearDirty: (id: string) => void;
  addWall: (wall: WallInstance) => void;
  removeEntity: (id: string) => void;
  clearScene: () => void;
  setEntities: (entities: SceneEntity[]) => void;
}

export const useSceneStore = create<SceneState>()((set) => ({
  entities: {},
  placedEntities: [],
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

  addWall: (wall) =>
    set((s) => ({
      placedEntities: [...s.placedEntities, { kind: "WALL", data: wall }],
    })),

  removeEntity: (id) =>
    set((s) => ({
      placedEntities: s.placedEntities.filter((entity) => {
        if (entity.kind === "WALL") return entity.data.id !== id;
        return true;
      }),
    })),

  clearScene: () =>
    set({
      entities: {},
      placedEntities: [],
      rootIds: [],
      activeProjectId: null,
    }),

  setEntities: (placedEntities) => set({ placedEntities }),
}));

export function selectEntity(
  entities: Record<string, BimEntity>,
  id: string
): BimEntity | undefined {
  return entities[id];
}

export function selectChildren(
  entities: Record<string, BimEntity>,
  parentId: string
): BimEntity[] {
  const parent = entities[parentId];
  if (!parent) return [];
  return parent.childIds.map((cid) => entities[cid]).filter(Boolean) as BimEntity[];
}

export function selectLevels(entities: Record<string, BimEntity>): BimEntity[] {
  return Object.values(entities).filter((entity) => entity.type === "LEVEL");
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
      if (child.type === "ZONE") {
        return child.childIds
          .map((eid) => entities[eid])
          .filter((entity): entity is BimEntity => !!entity && entity.type === "ELEMENT");
      }
      return [];
    });
}

export const sceneSelectors = {
  walls: (state: SceneState): WallInstance[] =>
    state.placedEntities
      .filter((entity): entity is { kind: "WALL"; data: WallInstance } => entity.kind === "WALL")
      .map((entity) => entity.data),
  entityCount: (state: SceneState) => state.placedEntities.length,
};
