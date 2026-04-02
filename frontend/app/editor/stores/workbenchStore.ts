// ── Workbench store ───────────────────────────────────────────────────────────
// Active tool, selection state, hover, dirty-node tracking.
// This is the "cursor/interaction" layer — separate from scene data.

import { create } from "zustand";
import type { ToolType } from "../types/tools";

interface WorkbenchState {
  // ── Tool ────────────────────────────────────────────────────────────────
  activeTool: ToolType;

  // ── Selection ───────────────────────────────────────────────────────────
  selectedIds: string[];
  hoveredId: string | null;

  // ── Edit state ──────────────────────────────────────────────────────────
  /** Whether any unsaved changes exist in the scene */
  isSceneDirty: boolean;

  /** IDs of entities modified since last save — used for partial saves */
  dirtyEntityIds: string[];

  // ── Status line ─────────────────────────────────────────────────────────
  statusMessage: string;

  // ── Actions ─────────────────────────────────────────────────────────────
  setActiveTool: (tool: ToolType) => void;

  /** Replace selection with a new set */
  setSelection: (ids: string[]) => void;

  /** Add single ID to selection */
  addToSelection: (id: string) => void;

  /** Remove single ID from selection */
  removeFromSelection: (id: string) => void;

  /** Toggle single ID in selection */
  toggleSelection: (id: string) => void;

  clearSelection: () => void;

  setHovered: (id: string | null) => void;

  markEntityDirty: (id: string) => void;
  clearEntityDirty: (id: string) => void;
  clearAllDirty: () => void;

  setStatus: (msg: string) => void;
}

export const useWorkbenchStore = create<WorkbenchState>()((set) => ({
  activeTool: "SELECT",
  selectedIds: [],
  hoveredId: null,
  isSceneDirty: false,
  dirtyEntityIds: [],
  statusMessage: "Ready",

  setActiveTool: (activeTool) => set({ activeTool }),

  setSelection: (selectedIds) => set({ selectedIds }),

  addToSelection: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id) ? s.selectedIds : [...s.selectedIds, id],
    })),

  removeFromSelection: (id) =>
    set((s) => ({ selectedIds: s.selectedIds.filter((x) => x !== id) })),

  toggleSelection: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),

  clearSelection: () => set({ selectedIds: [] }),

  setHovered: (hoveredId) => set({ hoveredId }),

  markEntityDirty: (id) =>
    set((s) => ({
      isSceneDirty: true,
      dirtyEntityIds: s.dirtyEntityIds.includes(id)
        ? s.dirtyEntityIds
        : [...s.dirtyEntityIds, id],
    })),

  clearEntityDirty: (id) =>
    set((s) => {
      const dirtyEntityIds = s.dirtyEntityIds.filter((x) => x !== id);
      return { dirtyEntityIds, isSceneDirty: dirtyEntityIds.length > 0 };
    }),

  clearAllDirty: () => set({ isSceneDirty: false, dirtyEntityIds: [] }),

  setStatus: (statusMessage) => set({ statusMessage }),
}));
