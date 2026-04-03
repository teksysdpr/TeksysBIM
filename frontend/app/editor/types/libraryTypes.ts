// ── Generic library types ──────────────────────────────────────────────────────
//
// Defines the element-hierarchy (Category → Family → Type) and supporting
// library entities (FinishSystem, ProfileSection, DesignVariant) that make
// the library architecture element-agnostic.
//
// Wall types are a first-class citizen here but the same structure supports
// slabs, doors, windows, grills, lifts, finishes, structural members, etc.
//
// Circular-import-safe: imports from libraryBase and wallTypes only.

import type { LibraryEntityBase } from "./libraryBase";
import type { MaterialLayer } from "./wallTypes";

// ── ElementCategory ────────────────────────────────────────────────────────────
// Top-level grouping for BIM elements.
// e.g. WALL, SLAB, DOOR, WINDOW, GRILL, LIFT, COLUMN, BEAM, STAIR, RAMP

export interface ElementCategory extends LibraryEntityBase {
  /** Icon identifier for UI rendering (lucide name or asset path) */
  icon?: string;
  /** Numeric sort order for display in pickers */
  sortOrder: number;
  /** True if elements of this category have a cross-section layer assembly */
  supportsAssembly: boolean;
  /** True if elements of this category are defined by parameters (door, window) */
  isParametric: boolean;
  /** True if this category supports finish systems (floor, wall surfaces) */
  supportsFinish: boolean;
  /** IFC entity class for export, e.g. "IfcWall", "IfcSlab", "IfcDoor" */
  ifcClass?: string;
}

// ── ElementFamily ──────────────────────────────────────────────────────────────
// Mid-level grouping within a category.
// e.g.  Category: WALL  → Families: Brick Wall, Concrete Wall, Dry Wall
//       Category: DOOR  → Families: Flush Door, Panel Door, Glass Door

export interface ElementFamily extends LibraryEntityBase {
  /** Parent ElementCategory id */
  categoryId: string;
  /** Icon identifier for UI rendering */
  icon?: string;
  /** Numeric sort order within the category */
  sortOrder: number;
  /** Optional thumbnail asset path for the family card */
  thumbnailPath?: string;
}

// ── ElementType ────────────────────────────────────────────────────────────────
// Leaf-level element definition used to place instances in a model.
// e.g.  Family: Brick Wall → Types: 230mm Brick (Plastered), 115mm Brick (Fair Face)
//       Family: Flush Door → Types: FD 900×2100, FD 1200×2100

export interface ElementType extends LibraryEntityBase {
  /** Parent ElementFamily id */
  familyId: string;
  /**
   * Optional reference to a LayerAssembly.
   * Present for layered elements (walls, slabs, roofs).
   */
  assemblyId?: string;
  /** Nominal width / thickness in mm */
  nominalThickness?: number;
  /** Nominal height in mm; 0 = storey height */
  nominalHeight?: number;
  /** Nominal depth in mm (slabs, beams, etc.) */
  nominalDepth?: number;
  /** True if type participates in structural load paths */
  isStructural?: boolean;
  /** True if type carries a fire-resistance rating */
  isFireRated?: boolean;
  /** Fire resistance rating string */
  fireRating?: string;
  /** IFC type name for export */
  ifcTypeName?: string;
  /**
   * Parametric dimensions and properties.
   * Keys are parameter names; values are defaults.
   * e.g. { "width": 900, "height": 2100, "leafCount": 1 }
   */
  parameters?: Record<string, string | number | boolean>;
  /** Optional list of accepted finish system ids for this element type */
  finishSystemIds?: string[];
}

// ── FinishSystem ───────────────────────────────────────────────────────────────
// A reusable surface-finish specification (floor screed + tile, wall plaster,
// external cladding, etc.).

export type FinishSurface = "FLOOR" | "WALL" | "CEILING" | "EXTERNAL" | "ANY";

export interface FinishSystem extends LibraryEntityBase {
  /** Which surface(s) this system applies to */
  surface: FinishSurface;
  /** Ordered finish layers from substrate to exposed face */
  layers: MaterialLayer[];
  /** Total build-up thickness in mm */
  totalThickness: number;
  /** Element category codes this finish can be applied to */
  applicableCategories: string[];
  /** Surface texture / roughness description */
  texture?: string;
  /** Slip resistance class (for floors), e.g. "R10", "R11" */
  slipResistance?: string;
  /** Optional warranty period in years */
  warrantyYears?: number;
}

// ── ProfileSection ─────────────────────────────────────────────────────────────
// Structural section definitions for columns, beams, lintels, etc.

export type SectionType =
  | "RECTANGULAR"
  | "CIRCULAR"
  | "I_SECTION"
  | "C_SECTION"
  | "T_SECTION"
  | "L_SECTION"
  | "HOLLOW_RECTANGULAR"
  | "HOLLOW_CIRCULAR"
  | "CUSTOM";

export interface ProfileDimensions {
  /** Overall width in mm */
  width?: number;
  /** Overall height / depth in mm */
  height?: number;
  /** Flange thickness in mm (I, C, T, L sections) */
  flangeThickness?: number;
  /** Web thickness in mm (I, C, T sections) */
  webThickness?: number;
  /** Wall thickness in mm (hollow sections) */
  wallThickness?: number;
  /** Outer diameter in mm (circular sections) */
  diameter?: number;
  /** Leg width in mm (second leg, L-sections) */
  legWidth?: number;
}

export interface ProfileSection extends LibraryEntityBase {
  /** Cross-section shape */
  sectionType: SectionType;
  /** Reference material id (concrete, steel grade, timber, etc.) */
  materialId?: string;
  /** Defining dimensions */
  dimensions: ProfileDimensions;
  /** Gross cross-section area in mm² */
  area?: number;
  /** Second moment of area about major axis in mm⁴ */
  momentOfInertiaX?: number;
  /** Second moment of area about minor axis in mm⁴ */
  momentOfInertiaY?: number;
  /** Plastic section modulus about major axis in mm³ */
  plasticModulusX?: number;
  /** Section classification per applicable standard */
  sectionClass?: string;
}

// ── DesignVariant ──────────────────────────────────────────────────────────────
// A named variation of an ElementType that overrides specific parameters,
// finishes, or visual appearance while sharing the parent type's geometry logic.
// e.g.  ElementType: FD 900×2100  →  Variants: Teak Wood, HDF Board, Flush Steel

export interface DesignVariant extends LibraryEntityBase {
  /** The ElementType this variant specialises */
  elementTypeId: string;
  /** Parameter values that override the parent ElementType.parameters */
  parameterOverrides: Record<string, string | number | boolean>;
  /** Optional finish system id applied on top of the base type */
  finishSystemId?: string;
  /** Optional hex colour override for 3-D shading */
  colourOverride?: string;
  /** True if this variant is shown first / selected by default */
  isDefault: boolean;
  /** Optional reference to a product SKU or catalogue item */
  productReference?: string;
  /** Estimated unit cost for cost-estimation module */
  unitCost?: number;
  /** Currency code for unitCost, e.g. "INR" */
  currency?: string;
}

// ── LibraryCollection ──────────────────────────────────────────────────────────
// Aggregates all library entity arrays.
// Used for bulk import/export, system library initialisation, and
// project-level library snapshots.

export interface LibraryCollection {
  categories: ElementCategory[];
  families: ElementFamily[];
  types: ElementType[];
  materials: import("./wallTypes").Material[];
  assemblies: import("./wallTypes").LayerAssembly[];
  finishSystems: FinishSystem[];
  profiles: ProfileSection[];
  variants: DesignVariant[];
}

// Re-export wall types so consumers only need to import from libraryTypes
export type {
  Material,
  MaterialPhase,
  MaterialCategory,
  MaterialLayer,
  LayerFunction,
  LayerAssembly,
  WallType,
  WallCategory,
} from "./wallTypes";
