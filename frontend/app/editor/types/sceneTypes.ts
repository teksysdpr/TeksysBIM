// ── Scene entity types ─────────────────────────────────────────────────────────
//
// Runtime placed instances — distinct from library types.
// A WallInstance is one placed occurrence of an ElementType / WallType
// in a specific project scene.
//
// All world coordinates are in millimetres (mm).
// Plan view: [x, y] — x right, y up, origin (0, 0) at scene origin.

// ── Wall instance ──────────────────────────────────────────────────────────────

export interface WallInstance {
  /** Unique scene entity ID */
  id: string;
  /**
   * ElementType.id that was active in the authoring palette when placed.
   * Re-resolve type properties at render time via libraryStore.
   */
  wallTypeId: string;
  /**
   * LayerAssembly.id — cached from ElementType.assemblyId at placement time.
   * Cached so the instance can render even if the type definition changes later.
   */
  assemblyId: string | null;
  /** Start point in world coordinates [x, y] (mm) */
  startPoint: [number, number];
  /** End point in world coordinates [x, y] (mm) */
  endPoint: [number, number];
  /**
   * Wall height in mm.
   * 0 = storey-derived height (not yet implemented — use the 3000mm default).
   */
  height: number;
  /**
   * Wall thickness in mm — cached from assembly.totalThickness or
   * ElementType.nominalThickness at placement time.
   */
  thickness: number;
  /** ISO-8601 placement timestamp */
  createdAt: string;
}

// ── Discriminated scene entity union ──────────────────────────────────────────
// Extend with SLAB, COLUMN, etc. in future phases.

export type SceneEntity = { kind: "WALL"; data: WallInstance };
