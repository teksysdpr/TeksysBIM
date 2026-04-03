"use client";

import { create } from "zustand";
import type { ToolType } from "../types/tools";

export type ToolId =
  | ToolType
  | "PAN"
  | "DOOR"
  | "WINDOW"
  | "COLUMN"
  | "BEAM"
  | "STAIR";

export const TOOL_CATEGORY_MAP: Partial<Record<ToolId, string>> = {
  WALL: "WALL",
  SLAB: "SLAB",
  DOOR: "DOOR",
  WINDOW: "WINDOW",
  COLUMN: "COLUMN",
  BEAM: "BEAM",
  STAIR: "STAIR",
};

export const CATEGORY_TOOL_MAP: Partial<Record<string, ToolId>> = {
  WALL: "WALL",
  SLAB: "SLAB",
  DOOR: "DOOR",
  WINDOW: "WINDOW",
  COLUMN: "COLUMN",
  BEAM: "BEAM",
  STAIR: "STAIR",
};

export interface PaletteSelection {
  categoryId: string | null;
  familyId: string | null;
  typeId: string | null;
  assemblyId: string | null;
  materialId: string | null;
}

const EMPTY_PALETTE: PaletteSelection = {
  categoryId: null,
  familyId: null,
  typeId: null,
  assemblyId: null,
  materialId: null,
};

export interface WorkbenchState {
  activeTool: ToolId | null;
  selectedIds: string[];
  hoveredId: string | null;
  isSceneDirty: boolean;
  dirtyEntityIds: string[];
  statusMessage: string;
  projectId: string | null;
  palette: PaletteSelection;
  savedAt: string | null;
  isDirty: boolean;
  setActiveTool: (tool: ToolId | null) => void;
  setSelection: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  markEntityDirty: (id: string) => void;
  clearEntityDirty: (id: string) => void;
  clearAllDirty: () => void;
  setStatus: (msg: string) => void;
  setProjectId: (id: string) => void;
  setPalette: (patch: Partial<PaletteSelection>) => void;
  resetPalette: () => void;
  hydrateFromScene: (
    palette: PaletteSelection,
    activeTool: ToolId | null,
    savedAt: string
  ) => void;
  setSavedAt: (ts: string) => void;
  setDirty: (dirty: boolean) => void;
  resetForProject: (projectId: string) => void;
}

export const useWorkbenchStore = create<WorkbenchState>()((set) => ({
  activeTool: "SELECT",
  selectedIds: [],
  hoveredId: null,
  isSceneDirty: false,
  dirtyEntityIds: [],
  statusMessage: "Ready",
  projectId: null,
  palette: { ...EMPTY_PALETTE },
  savedAt: null,
  isDirty: false,

  setActiveTool: (activeTool) => set({ activeTool, isDirty: true }),

  setSelection: (selectedIds) => set({ selectedIds }),

  addToSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id) ? state.selectedIds : [...state.selectedIds, id],
    })),

  removeFromSelection: (id) =>
    set((state) => ({ selectedIds: state.selectedIds.filter((value) => value !== id) })),

  toggleSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((value) => value !== id)
        : [...state.selectedIds, id],
    })),

  clearSelection: () => set({ selectedIds: [] }),

  setHovered: (hoveredId) => set({ hoveredId }),

  markEntityDirty: (id) =>
    set((state) => ({
      isSceneDirty: true,
      isDirty: true,
      dirtyEntityIds: state.dirtyEntityIds.includes(id)
        ? state.dirtyEntityIds
        : [...state.dirtyEntityIds, id],
    })),

  clearEntityDirty: (id) =>
    set((state) => {
      const dirtyEntityIds = state.dirtyEntityIds.filter((value) => value !== id);
      return {
        dirtyEntityIds,
        isSceneDirty: dirtyEntityIds.length > 0,
      };
    }),

  clearAllDirty: () => set({ isSceneDirty: false, dirtyEntityIds: [], isDirty: false }),

  setStatus: (statusMessage) => set({ statusMessage }),

  setProjectId: (projectId) => set({ projectId }),

  setPalette: (patch) =>
    set((state) => ({ palette: { ...state.palette, ...patch }, isDirty: true })),

  resetPalette: () => set({ palette: { ...EMPTY_PALETTE } }),

  hydrateFromScene: (palette, activeTool, savedAt) =>
    set({ palette, activeTool, savedAt, isDirty: false }),

  setSavedAt: (savedAt) => set({ savedAt, isDirty: false }),

  setDirty: (isDirty) => set({ isDirty }),

  resetForProject: (projectId) =>
    set({
      projectId,
      activeTool: null,
      selectedIds: [],
      hoveredId: null,
      isSceneDirty: false,
      dirtyEntityIds: [],
      statusMessage: "Ready",
      palette: { ...EMPTY_PALETTE },
      savedAt: null,
      isDirty: false,
    }),
}));

export const workbenchSelectors = {
  projectId: (state: WorkbenchState) => state.projectId,
  activeTool: (state: WorkbenchState) => state.activeTool,
  palette: (state: WorkbenchState) => state.palette,
  activeTypeId: (state: WorkbenchState) => state.palette.typeId,
  activeCategoryId: (state: WorkbenchState) => state.palette.categoryId,
  activeFamilyId: (state: WorkbenchState) => state.palette.familyId,
};
