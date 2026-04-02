// ── BIM entity type hierarchy ─────────────────────────────────────────────────
// Follows IFC spatial decomposition:
//   Project → Site → Building → Level → Zone → Element

export type EntityType =
  | "PROJECT"
  | "SITE"
  | "BUILDING"
  | "LEVEL"
  | "ZONE"
  | "ELEMENT";

export type ElementCategory =
  | "WALL"
  | "SLAB"
  | "COLUMN"
  | "BEAM"
  | "DOOR"
  | "WINDOW"
  | "ROOF"
  | "STAIR"
  | "RAMP"
  | "SPACE"
  | "CURTAIN_WALL"
  | "RAILING"
  | "GENERIC";

export type DisciplineTag =
  | "ARCHITECTURE"
  | "STRUCTURE"
  | "MEP_MECHANICAL"
  | "MEP_ELECTRICAL"
  | "MEP_PLUMBING"
  | "CIVIL"
  | "LANDSCAPE";

// ── Geometry reference ────────────────────────────────────────────────────────
// Phase 3: box primitives only.
// Future: extrusion profiles, mesh URLs, IFC GlobalId references.

export type GeometryPrimitive = "BOX" | "EXTRUSION" | "MESH_URL" | "IFC_GUID";

export interface Transform {
  position: [number, number, number];   // x, y, z in metres
  rotation: [number, number, number];   // euler XYZ in radians
  scale: [number, number, number];      // uniform or per-axis
}

export interface BoxGeometry {
  primitive: "BOX";
  width: number;
  depth: number;
  height: number;
}

export interface ExtrusionGeometry {
  primitive: "EXTRUSION";
  profile: Array<[number, number]>;     // 2D outline points (XZ plane)
  extrusionHeight: number;
}

export interface MeshUrlGeometry {
  primitive: "MESH_URL";
  url: string;
  format: "GLB" | "GLTF" | "OBJ";
}

export interface IfcGuidGeometry {
  primitive: "IFC_GUID";
  ifcGlobalId: string;
  sourceFileId?: string;
}

export type GeometryDef =
  | BoxGeometry
  | ExtrusionGeometry
  | MeshUrlGeometry
  | IfcGuidGeometry;

export interface GeometryRef {
  def: GeometryDef;
  transform: Transform;
}

// ── Core entity ───────────────────────────────────────────────────────────────
// Normalised: the store holds entities flat in a Record<id, BimEntity>.
// Children are referenced by ID only — the scene mesh is never the source of truth.

export interface BimEntity {
  id: string;
  type: EntityType;
  name: string;
  parentId: string | null;
  childIds: string[];

  // Spatial / classification
  category?: ElementCategory;
  discipline?: DisciplineTag;

  // Arbitrary BIM property bag (mirrors IFC Pset concept)
  properties: Record<string, string | number | boolean | null>;

  // Geometry: only present on spatial leaf nodes (ELEMENT, ZONE boundary, LEVEL slab)
  geometry?: GeometryRef;

  // Display state
  visible: boolean;
  locked: boolean;

  // Dirty flag: true when local state differs from persisted/server state
  dirty: boolean;
}

// ── Derived / computed types ─────────────────────────────────────────────────

export interface LevelMeta {
  id: string;
  name: string;
  elevation: number;    // metres above project datum
  height: number;       // storey height in metres
  number: string;       // "00", "01", "02" etc.
}

export interface BuildingMeta {
  id: string;
  name: string;
  footprintWidth: number;   // metres
  footprintDepth: number;
}

// ── Helper guards ─────────────────────────────────────────────────────────────

export function isLevel(e: BimEntity): boolean {
  return e.type === "LEVEL";
}

export function isElement(e: BimEntity): boolean {
  return e.type === "ELEMENT";
}

export function hasGeometry(e: BimEntity): e is BimEntity & { geometry: GeometryRef } {
  return e.geometry !== undefined;
}
