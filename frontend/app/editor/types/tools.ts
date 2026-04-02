// ── Tool types ────────────────────────────────────────────────────────────────
// Phase 3: SELECT only is active. Others are scaffolded for Phase 4+.

export type ToolType =
  | "SELECT"       // Click/drag to select entities
  | "MOVE"         // Translate selected entities
  | "WALL"         // Draw wall by two points
  | "SLAB"         // Draw slab by boundary points
  | "ZONE"         // Draw zone boundary
  | "MEASURE"      // Distance / area measurement
  | "SECTION_CUT"  // Define cutting plane
  | "ANNOTATE";    // Place text annotation

export interface ToolConfig {
  id: ToolType;
  label: string;
  shortcut: string;
  icon: string;       // lucide icon name
  phase: 3 | 4 | 5;  // which phase implements this tool
  cursor: string;     // CSS cursor value
}

export const TOOLS: Record<ToolType, ToolConfig> = {
  SELECT:      { id: "SELECT",      label: "Select",      shortcut: "V", icon: "MousePointer2", phase: 3, cursor: "default" },
  MOVE:        { id: "MOVE",        label: "Move",        shortcut: "M", icon: "Move",          phase: 4, cursor: "move" },
  WALL:        { id: "WALL",        label: "Wall",        shortcut: "W", icon: "PenLine",        phase: 4, cursor: "crosshair" },
  SLAB:        { id: "SLAB",        label: "Slab",        shortcut: "S", icon: "Square",         phase: 4, cursor: "crosshair" },
  ZONE:        { id: "ZONE",        label: "Zone",        shortcut: "Z", icon: "Grid2X2",        phase: 4, cursor: "crosshair" },
  MEASURE:     { id: "MEASURE",     label: "Measure",     shortcut: "E", icon: "Ruler",          phase: 4, cursor: "crosshair" },
  SECTION_CUT: { id: "SECTION_CUT", label: "Section Cut", shortcut: "C", icon: "Scissors",       phase: 5, cursor: "crosshair" },
  ANNOTATE:    { id: "ANNOTATE",    label: "Annotate",    shortcut: "A", icon: "MessageSquare",  phase: 5, cursor: "text" },
};

// ── View modes ────────────────────────────────────────────────────────────────

export type ViewMode = "STACKED" | "EXPLODED" | "SOLO";

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  STACKED:  "Stacked",
  EXPLODED: "Exploded",
  SOLO:     "Solo Level",
};

// ── Render modes ──────────────────────────────────────────────────────────────

export type RenderMode = "SOLID" | "WIREFRAME" | "EDGES";

export const RENDER_MODE_LABELS: Record<RenderMode, string> = {
  SOLID:     "Solid",
  WIREFRAME: "Wireframe",
  EDGES:     "Solid + Edges",
};

// ── Camera modes ──────────────────────────────────────────────────────────────

export type CameraMode = "PERSPECTIVE" | "ORTHOGRAPHIC";
