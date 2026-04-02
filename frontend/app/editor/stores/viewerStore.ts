// ── Viewer store ──────────────────────────────────────────────────────────────
// Camera settings, render options, view mode.
// Does NOT hold scene data — that is sceneStore's concern.

import { create } from "zustand";
import type { ViewMode, RenderMode, CameraMode } from "../types/tools";

interface ViewerState {
  // ── View modes ──────────────────────────────────────────────────────────
  viewMode: ViewMode;

  /** Active level ID for SOLO mode. Null = show all. */
  activeLevelId: string | null;

  /** Explode spacing multiplier (used in EXPLODED mode) */
  explodeSpacing: number;

  // ── Render options ──────────────────────────────────────────────────────
  renderMode: RenderMode;
  cameraMode: CameraMode;
  showGrid: boolean;
  showAxes: boolean;
  showLevelLabels: boolean;
  showElementLabels: boolean;

  // ── Panel state ─────────────────────────────────────────────────────────
  bottomPanelOpen: boolean;
  bottomPanelTab: "HISTORY" | "ISSUES" | "CONSOLE";

  // ── Actions ─────────────────────────────────────────────────────────────
  setViewMode: (mode: ViewMode) => void;
  setActiveLevelId: (id: string | null) => void;
  setExplodeSpacing: (v: number) => void;
  setRenderMode: (mode: RenderMode) => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
  toggleLevelLabels: () => void;
  setBottomPanelOpen: (open: boolean) => void;
  setBottomPanelTab: (tab: "HISTORY" | "ISSUES" | "CONSOLE") => void;
}

export const useViewerStore = create<ViewerState>()((set) => ({
  viewMode: "STACKED",
  activeLevelId: null,
  explodeSpacing: 2.5,

  renderMode: "SOLID",
  cameraMode: "PERSPECTIVE",
  showGrid: true,
  showAxes: true,
  showLevelLabels: true,
  showElementLabels: false,

  bottomPanelOpen: true,
  bottomPanelTab: "HISTORY",

  setViewMode: (viewMode) => set({ viewMode }),
  setActiveLevelId: (activeLevelId) => set({ activeLevelId }),
  setExplodeSpacing: (explodeSpacing) => set({ explodeSpacing }),
  setRenderMode: (renderMode) => set({ renderMode }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleAxes: () => set((s) => ({ showAxes: !s.showAxes })),
  toggleLevelLabels: () => set((s) => ({ showLevelLabels: !s.showLevelLabels })),
  setBottomPanelOpen: (bottomPanelOpen) => set({ bottomPanelOpen }),
  setBottomPanelTab: (bottomPanelTab) => set({ bottomPanelTab }),
}));
