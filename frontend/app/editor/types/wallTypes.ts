// ── Wall types ─────────────────────────────────────────────────────────────────
//
// Concrete BIM types for wall construction elements.
// All interfaces extend LibraryEntityBase so they fit into the generic
// library architecture alongside slabs, doors, windows, etc.
//
// Import order per libraryBase.ts header:
//   libraryBase  ← wallTypes  ← libraryTypes
//                              ← libraryStore
//                              ← systemLibrary

import type { LibraryEntityBase } from "./libraryBase";

// ── Material ───────────────────────────────────────────────────────────────────

export type MaterialPhase = "SOLID" | "LIQUID" | "GAS" | "COMPOSITE";

export type MaterialCategory =
  | "MASONRY"
  | "CONCRETE"
  | "METAL"
  | "WOOD"
  | "INSULATION"
  | "MEMBRANE"
  | "FINISH"
  | "GLASS"
  | "EARTH"
  | "OTHER";

export interface Material extends LibraryEntityBase {
  /** Material category for grouping in pickers */
  category: MaterialCategory;
  /** Physical phase */
  phase: MaterialPhase;
  /** Hex colour used for hatch fills in plan/section views, e.g. "#C8B49A" */
  colour: string;
  /** Fill/hatch pattern identifier for plan/section rendering */
  hatchPattern?: string;
  /** Density in kg/m³ */
  density?: number;
  /** Thermal conductivity λ in W/(m·K) */
  thermalConductivity?: number;
  /** Vapour resistance factor μ (dimensionless) */
  vapourResistance?: number;
  /** Compressive strength in MPa */
  compressiveStrength?: number;
  /** Elastic modulus in MPa */
  elasticModulus?: number;
  /** IFC material name for IFC export compatibility */
  ifcMaterialName?: string;
}

// ── Layer function ─────────────────────────────────────────────────────────────

export type LayerFunction =
  | "FINISH"       // final surface coat, paint, tile, stone cladding
  | "SUBSTRATE"    // rendering/plaster base coat
  | "STRUCTURE"    // primary load-bearing core
  | "INSULATION"   // thermal or acoustic insulation
  | "MEMBRANE"     // damp-proof, vapour control
  | "AIR_GAP"      // cavity / ventilation gap
  | "LINING"       // internal dry lining, board
  | "OTHER";

// ── MaterialLayer ──────────────────────────────────────────────────────────────
// A single layer within a LayerAssembly or FinishSystem.
// Not a LibraryEntityBase — it is always embedded inside an assembly.

export interface MaterialLayer {
  /** Reference to the Material.id used for this layer */
  materialId: string;
  /** Layer thickness in mm */
  thickness: number;
  /** Functional role of this layer */
  function: LayerFunction;
  /** Display order within the assembly (0 = outermost / exterior face) */
  order: number;
  /** True if this layer contributes to structural load paths */
  isStructural: boolean;
  /** True if thickness can vary (e.g. render on rough masonry) */
  isVariable?: boolean;
  /** Optional label that overrides material name in this assembly's BOM */
  name?: string;
}

// ── LayerAssembly ──────────────────────────────────────────────────────────────
// A reusable cross-section stack of material layers.
// Used by WallType, ElementType (slab, roof, etc.) and FinishSystem.

export interface LayerAssembly extends LibraryEntityBase {
  /** Ordered layers from exterior (index 0) to interior */
  layers: MaterialLayer[];
  /** Total thickness in mm — should equal sum of layer thicknesses */
  totalThickness: number;
  /**
   * Element category codes this assembly is applicable for.
   * Empty array means unrestricted.
   * e.g. ["WALL", "SLAB"]
   */
  applicableCategories: string[];
  /** Overall thermal resistance R = Σ(d/λ) in m²·K/W */
  thermalResistance?: number;
  /** Weighted sound reduction index Rw in dB */
  soundReductionIndex?: number;
  /** Fire resistance rating, e.g. "REI 60", "EI 120", "2H" */
  fireRating?: string;
}

// ── WallCategory ───────────────────────────────────────────────────────────────

export type WallCategory =
  | "EXTERNAL"    // outer envelope wall
  | "INTERNAL"    // room-separating wall
  | "PARTITION"   // lightweight non-structural partition
  | "RETAINING"   // basement / retaining structure
  | "PARAPET"     // parapet / upstand above roof
  | "COMPOUND";   // compound boundary wall

// ── WallType ───────────────────────────────────────────────────────────────────
// The leaf-level wall definition placed in a model.
// WallType IS-A LibraryEntityBase so it participates in the generic
// ElementType hierarchy as well (via familyId linkage in ElementType).

export interface WallType extends LibraryEntityBase {
  /** The LayerAssembly that defines this wall's cross-section */
  assemblyId: string;
  /** Sub-classification of the wall */
  wallCategory: WallCategory;
  /** Nominal thickness in mm (should match assembly.totalThickness) */
  thickness: number;
  /** Default height in mm; 0 means extend to storey height */
  defaultHeight: number;
  /** True if the wall participates in vertical load transfer */
  isLoadBearing: boolean;
  /** True if the wall has a fire-resistance rating */
  isFireRated: boolean;
  /** Fire resistance rating string, e.g. "REI 120" */
  fireRating?: string;
  /** IFC wall type for IFC export */
  ifcWallType?: string;
}
