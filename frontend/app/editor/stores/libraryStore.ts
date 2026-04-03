// ── Library store ──────────────────────────────────────────────────────────────
//
// Unified Zustand store for all BIM library entities.
//
// All library sections (categories, families, types, materials, assemblies,
// finish systems, profiles, variants) live here so editor tools can consume
// a single, consistent source of truth.
//
// Persistence: in-memory only for now.  Backend sync will be layered on later
// via the existing BIM backend API without needing to change this store's shape.
//
// Usage:
//   const categories = useLibraryStore(librarySelectors.activeCategories);
//   const { addMaterial, archiveType } = useLibraryStore();

"use client";

import { create } from "zustand";
import type { LibraryScope, LibraryEntityStatus } from "../types/libraryBase";
import type {
  ElementCategory,
  ElementFamily,
  ElementType,
  FinishSystem,
  ProfileSection,
  DesignVariant,
  LibraryCollection,
  Material,
  LayerAssembly,
} from "../types/libraryTypes";

// ── Helper types ───────────────────────────────────────────────────────────────

export type AnyLibraryEntity =
  | ElementCategory
  | ElementFamily
  | ElementType
  | Material
  | LayerAssembly
  | FinishSystem
  | ProfileSection
  | DesignVariant;

/** Input for add/update actions — id is assigned by the store */
export type LibraryEntityInput<T extends AnyLibraryEntity> = Omit<
  T,
  "id" | "createdAt" | "updatedAt"
> &
  Partial<Pick<T, "id">>;

// ── Active selection ───────────────────────────────────────────────────────────

export interface LibrarySelection {
  categoryId: string | null;
  familyId: string | null;
  typeId: string | null;
  materialId: string | null;
  assemblyId: string | null;
  finishSystemId: string | null;
  profileId: string | null;
  variantId: string | null;
}

// ── Store shape ────────────────────────────────────────────────────────────────

export interface LibraryState {
  // ── Data ──────────────────────────────────────────────────────────────────
  categories: ElementCategory[];
  families: ElementFamily[];
  types: ElementType[];
  materials: Material[];
  assemblies: LayerAssembly[];
  finishSystems: FinishSystem[];
  profiles: ProfileSection[];
  variants: DesignVariant[];

  // ── UI selection ──────────────────────────────────────────────────────────
  selection: LibrarySelection;

  // ── Actions: categories ───────────────────────────────────────────────────
  addCategory: (input: LibraryEntityInput<ElementCategory>) => ElementCategory;
  updateCategory: (id: string, patch: Partial<ElementCategory>) => void;
  archiveCategory: (id: string) => void;
  restoreCategory: (id: string) => void;
  cloneCategory: (id: string, overrides?: Partial<ElementCategory>) => ElementCategory;

  // ── Actions: families ─────────────────────────────────────────────────────
  addFamily: (input: LibraryEntityInput<ElementFamily>) => ElementFamily;
  updateFamily: (id: string, patch: Partial<ElementFamily>) => void;
  archiveFamily: (id: string) => void;
  restoreFamily: (id: string) => void;
  cloneFamily: (id: string, overrides?: Partial<ElementFamily>) => ElementFamily;

  // ── Actions: types ────────────────────────────────────────────────────────
  addType: (input: LibraryEntityInput<ElementType>) => ElementType;
  updateType: (id: string, patch: Partial<ElementType>) => void;
  archiveType: (id: string) => void;
  restoreType: (id: string) => void;
  cloneType: (id: string, overrides?: Partial<ElementType>) => ElementType;

  // ── Actions: materials ────────────────────────────────────────────────────
  addMaterial: (input: LibraryEntityInput<Material>) => Material;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  archiveMaterial: (id: string) => void;
  restoreMaterial: (id: string) => void;
  cloneMaterial: (id: string, overrides?: Partial<Material>) => Material;

  // ── Actions: assemblies ───────────────────────────────────────────────────
  addAssembly: (input: LibraryEntityInput<LayerAssembly>) => LayerAssembly;
  updateAssembly: (id: string, patch: Partial<LayerAssembly>) => void;
  archiveAssembly: (id: string) => void;
  restoreAssembly: (id: string) => void;
  cloneAssembly: (id: string, overrides?: Partial<LayerAssembly>) => LayerAssembly;

  // ── Actions: finish systems ───────────────────────────────────────────────
  addFinishSystem: (input: LibraryEntityInput<FinishSystem>) => FinishSystem;
  updateFinishSystem: (id: string, patch: Partial<FinishSystem>) => void;
  archiveFinishSystem: (id: string) => void;
  restoreFinishSystem: (id: string) => void;
  cloneFinishSystem: (id: string, overrides?: Partial<FinishSystem>) => FinishSystem;

  // ── Actions: profiles ─────────────────────────────────────────────────────
  addProfile: (input: LibraryEntityInput<ProfileSection>) => ProfileSection;
  updateProfile: (id: string, patch: Partial<ProfileSection>) => void;
  archiveProfile: (id: string) => void;
  restoreProfile: (id: string) => void;
  cloneProfile: (id: string, overrides?: Partial<ProfileSection>) => ProfileSection;

  // ── Actions: variants ─────────────────────────────────────────────────────
  addVariant: (input: LibraryEntityInput<DesignVariant>) => DesignVariant;
  updateVariant: (id: string, patch: Partial<DesignVariant>) => void;
  archiveVariant: (id: string) => void;
  restoreVariant: (id: string) => void;
  cloneVariant: (id: string, overrides?: Partial<DesignVariant>) => DesignVariant;

  // ── Bulk ──────────────────────────────────────────────────────────────────
  /** Load a full LibraryCollection, replacing existing entries with same ids */
  loadCollection: (collection: LibraryCollection) => void;
  /** Reset the store to empty (used for project switch) */
  clearLibrary: () => void;

  // ── Selection ─────────────────────────────────────────────────────────────
  setSelection: (patch: Partial<LibrarySelection>) => void;
  clearSelection: () => void;
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function now(): string {
  return new Date().toISOString();
}

/**
 * Upsert an entity into an array by id.
 * If an entity with the same id exists it is replaced; otherwise appended.
 */
function upsert<T extends { id: string }>(arr: T[], entity: T): T[] {
  const idx = arr.findIndex((e) => e.id === entity.id);
  if (idx === -1) return [...arr, entity];
  const next = [...arr];
  next[idx] = entity;
  return next;
}

/** Set status on the entity with matching id */
function setStatus<T extends { id: string; status: LibraryEntityStatus }>(
  arr: T[],
  id: string,
  status: LibraryEntityStatus
): T[] {
  return arr.map((e) =>
    e.id === id ? { ...e, status, updatedAt: now() } : e
  );
}

/**
 * Generic clone: copies an entity, assigns a new id/code, marks it non-builtIn,
 * and applies any provided overrides.
 */
function cloneEntity<T extends AnyLibraryEntity>(
  source: T,
  idPrefix: string,
  overrides?: Partial<T>
): T {
  const ts = now();
  return {
    ...source,
    ...overrides,
    id: nextId(idPrefix),
    code: `${source.code}-COPY`,
    isBuiltIn: false,
    status: "DRAFT" as LibraryEntityStatus,
    createdAt: ts,
    updatedAt: ts,
  };
}

const EMPTY_SELECTION: LibrarySelection = {
  categoryId: null,
  familyId: null,
  typeId: null,
  materialId: null,
  assemblyId: null,
  finishSystemId: null,
  profileId: null,
  variantId: null,
};

// ── Store factory ──────────────────────────────────────────────────────────────

function makeActions(
  set: (
    updater: (state: LibraryState) => Partial<LibraryState>
  ) => void,
  get: () => LibraryState
) {
  // ── Generic add helper ─────────────────────────────────────────────────────
  function addEntity<T extends AnyLibraryEntity>(
    key: keyof Pick<
      LibraryState,
      | "categories"
      | "families"
      | "types"
      | "materials"
      | "assemblies"
      | "finishSystems"
      | "profiles"
      | "variants"
    >,
    idPrefix: string,
    input: LibraryEntityInput<T>
  ): T {
    const ts = now();
    const entity: T = {
      ...(input as unknown as T),
      id: input.id ?? nextId(idPrefix),
      createdAt: ts,
      updatedAt: ts,
    };
    set((s) => ({
      [key]: upsert(s[key] as T[], entity),
    }));
    return entity;
  }

  // ── Generic patch helper ───────────────────────────────────────────────────
  function patchEntity<T extends AnyLibraryEntity>(
    key: keyof Pick<
      LibraryState,
      | "categories"
      | "families"
      | "types"
      | "materials"
      | "assemblies"
      | "finishSystems"
      | "profiles"
      | "variants"
    >,
    id: string,
    patch: Partial<T>
  ): void {
    set((s) => ({
      [key]: (s[key] as T[]).map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: now() } : e
      ),
    }));
  }

  return {
    // Categories
    addCategory: (input: LibraryEntityInput<ElementCategory>) =>
      addEntity<ElementCategory>("categories", "CAT", input),
    updateCategory: (id: string, patch: Partial<ElementCategory>) =>
      patchEntity<ElementCategory>("categories", id, patch),
    archiveCategory: (id: string) =>
      set((s) => ({ categories: setStatus(s.categories, id, "ARCHIVED") })),
    restoreCategory: (id: string) =>
      set((s) => ({ categories: setStatus(s.categories, id, "ACTIVE") })),
    cloneCategory: (id: string, overrides?: Partial<ElementCategory>) => {
      const source = get().categories.find((c) => c.id === id);
      if (!source) throw new Error(`Category not found: ${id}`);
      return addEntity<ElementCategory>(
        "categories",
        "CAT",
        cloneEntity(source, "CAT", overrides)
      );
    },

    // Families
    addFamily: (input: LibraryEntityInput<ElementFamily>) =>
      addEntity<ElementFamily>("families", "FAM", input),
    updateFamily: (id: string, patch: Partial<ElementFamily>) =>
      patchEntity<ElementFamily>("families", id, patch),
    archiveFamily: (id: string) =>
      set((s) => ({ families: setStatus(s.families, id, "ARCHIVED") })),
    restoreFamily: (id: string) =>
      set((s) => ({ families: setStatus(s.families, id, "ACTIVE") })),
    cloneFamily: (id: string, overrides?: Partial<ElementFamily>) => {
      const source = get().families.find((f) => f.id === id);
      if (!source) throw new Error(`Family not found: ${id}`);
      return addEntity<ElementFamily>(
        "families",
        "FAM",
        cloneEntity(source, "FAM", overrides)
      );
    },

    // Types
    addType: (input: LibraryEntityInput<ElementType>) =>
      addEntity<ElementType>("types", "TYP", input),
    updateType: (id: string, patch: Partial<ElementType>) =>
      patchEntity<ElementType>("types", id, patch),
    archiveType: (id: string) =>
      set((s) => ({ types: setStatus(s.types, id, "ARCHIVED") })),
    restoreType: (id: string) =>
      set((s) => ({ types: setStatus(s.types, id, "ACTIVE") })),
    cloneType: (id: string, overrides?: Partial<ElementType>) => {
      const source = get().types.find((t) => t.id === id);
      if (!source) throw new Error(`Type not found: ${id}`);
      return addEntity<ElementType>(
        "types",
        "TYP",
        cloneEntity(source, "TYP", overrides)
      );
    },

    // Materials
    addMaterial: (input: LibraryEntityInput<Material>) =>
      addEntity<Material>("materials", "MAT", input),
    updateMaterial: (id: string, patch: Partial<Material>) =>
      patchEntity<Material>("materials", id, patch),
    archiveMaterial: (id: string) =>
      set((s) => ({ materials: setStatus(s.materials, id, "ARCHIVED") })),
    restoreMaterial: (id: string) =>
      set((s) => ({ materials: setStatus(s.materials, id, "ACTIVE") })),
    cloneMaterial: (id: string, overrides?: Partial<Material>) => {
      const source = get().materials.find((m) => m.id === id);
      if (!source) throw new Error(`Material not found: ${id}`);
      return addEntity<Material>(
        "materials",
        "MAT",
        cloneEntity(source, "MAT", overrides)
      );
    },

    // Assemblies
    addAssembly: (input: LibraryEntityInput<LayerAssembly>) =>
      addEntity<LayerAssembly>("assemblies", "ASM", input),
    updateAssembly: (id: string, patch: Partial<LayerAssembly>) =>
      patchEntity<LayerAssembly>("assemblies", id, patch),
    archiveAssembly: (id: string) =>
      set((s) => ({ assemblies: setStatus(s.assemblies, id, "ARCHIVED") })),
    restoreAssembly: (id: string) =>
      set((s) => ({ assemblies: setStatus(s.assemblies, id, "ACTIVE") })),
    cloneAssembly: (id: string, overrides?: Partial<LayerAssembly>) => {
      const source = get().assemblies.find((a) => a.id === id);
      if (!source) throw new Error(`Assembly not found: ${id}`);
      return addEntity<LayerAssembly>(
        "assemblies",
        "ASM",
        cloneEntity(source, "ASM", overrides)
      );
    },

    // Finish Systems
    addFinishSystem: (input: LibraryEntityInput<FinishSystem>) =>
      addEntity<FinishSystem>("finishSystems", "FIN", input),
    updateFinishSystem: (id: string, patch: Partial<FinishSystem>) =>
      patchEntity<FinishSystem>("finishSystems", id, patch),
    archiveFinishSystem: (id: string) =>
      set((s) => ({
        finishSystems: setStatus(s.finishSystems, id, "ARCHIVED"),
      })),
    restoreFinishSystem: (id: string) =>
      set((s) => ({
        finishSystems: setStatus(s.finishSystems, id, "ACTIVE"),
      })),
    cloneFinishSystem: (id: string, overrides?: Partial<FinishSystem>) => {
      const source = get().finishSystems.find((f) => f.id === id);
      if (!source) throw new Error(`FinishSystem not found: ${id}`);
      return addEntity<FinishSystem>(
        "finishSystems",
        "FIN",
        cloneEntity(source, "FIN", overrides)
      );
    },

    // Profiles
    addProfile: (input: LibraryEntityInput<ProfileSection>) =>
      addEntity<ProfileSection>("profiles", "PRF", input),
    updateProfile: (id: string, patch: Partial<ProfileSection>) =>
      patchEntity<ProfileSection>("profiles", id, patch),
    archiveProfile: (id: string) =>
      set((s) => ({ profiles: setStatus(s.profiles, id, "ARCHIVED") })),
    restoreProfile: (id: string) =>
      set((s) => ({ profiles: setStatus(s.profiles, id, "ACTIVE") })),
    cloneProfile: (id: string, overrides?: Partial<ProfileSection>) => {
      const source = get().profiles.find((p) => p.id === id);
      if (!source) throw new Error(`Profile not found: ${id}`);
      return addEntity<ProfileSection>(
        "profiles",
        "PRF",
        cloneEntity(source, "PRF", overrides)
      );
    },

    // Variants
    addVariant: (input: LibraryEntityInput<DesignVariant>) =>
      addEntity<DesignVariant>("variants", "VAR", input),
    updateVariant: (id: string, patch: Partial<DesignVariant>) =>
      patchEntity<DesignVariant>("variants", id, patch),
    archiveVariant: (id: string) =>
      set((s) => ({ variants: setStatus(s.variants, id, "ARCHIVED") })),
    restoreVariant: (id: string) =>
      set((s) => ({ variants: setStatus(s.variants, id, "ACTIVE") })),
    cloneVariant: (id: string, overrides?: Partial<DesignVariant>) => {
      const source = get().variants.find((v) => v.id === id);
      if (!source) throw new Error(`Variant not found: ${id}`);
      return addEntity<DesignVariant>(
        "variants",
        "VAR",
        cloneEntity(source, "VAR", overrides)
      );
    },

    // Bulk
    loadCollection: (collection: LibraryCollection) => {
      set((s) => ({
        categories: collection.categories.reduce(
          (acc, e) => upsert(acc, e),
          s.categories
        ),
        families: collection.families.reduce(
          (acc, e) => upsert(acc, e),
          s.families
        ),
        types: collection.types.reduce((acc, e) => upsert(acc, e), s.types),
        materials: collection.materials.reduce(
          (acc, e) => upsert(acc, e),
          s.materials
        ),
        assemblies: collection.assemblies.reduce(
          (acc, e) => upsert(acc, e),
          s.assemblies
        ),
        finishSystems: collection.finishSystems.reduce(
          (acc, e) => upsert(acc, e),
          s.finishSystems
        ),
        profiles: collection.profiles.reduce(
          (acc, e) => upsert(acc, e),
          s.profiles
        ),
        variants: collection.variants.reduce(
          (acc, e) => upsert(acc, e),
          s.variants
        ),
      }));
    },

    clearLibrary: () =>
      set(() => ({
        categories: [],
        families: [],
        types: [],
        materials: [],
        assemblies: [],
        finishSystems: [],
        profiles: [],
        variants: [],
        selection: { ...EMPTY_SELECTION },
      })),

    // Selection
    setSelection: (patch: Partial<LibrarySelection>) =>
      set((s) => ({ selection: { ...s.selection, ...patch } })),
    clearSelection: () => set(() => ({ selection: { ...EMPTY_SELECTION } })),
  };
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useLibraryStore = create<LibraryState>((set, get) => ({
  // initial data
  categories: [],
  families: [],
  types: [],
  materials: [],
  assemblies: [],
  finishSystems: [],
  profiles: [],
  variants: [],
  selection: { ...EMPTY_SELECTION },

  // actions
  ...makeActions(
    (updater) => set((s) => updater(s) as LibraryState),
    get
  ),
}));

// ── Selectors ──────────────────────────────────────────────────────────────────
// Pre-built selector functions for use with useLibraryStore(selector).
// Keeping selectors outside the store avoids re-creating them on every render.

export const librarySelectors = {
  // ── Categories ─────────────────────────────────────────────────────────────
  allCategories: (s: LibraryState) => s.categories,
  activeCategories: (s: LibraryState) =>
    s.categories.filter((c) => c.status === "ACTIVE"),
  archivedCategories: (s: LibraryState) =>
    s.categories.filter((c) => c.status === "ARCHIVED"),
  categoriesByScope:
    (scope: LibraryScope) => (s: LibraryState) =>
      s.categories.filter((c) => c.scope === scope),
  categoryById: (id: string) => (s: LibraryState) =>
    s.categories.find((c) => c.id === id),

  // ── Families ───────────────────────────────────────────────────────────────
  allFamilies: (s: LibraryState) => s.families,
  activeFamilies: (s: LibraryState) =>
    s.families.filter((f) => f.status === "ACTIVE"),
  familiesByCategory: (categoryId: string) => (s: LibraryState) =>
    s.families.filter(
      (f) => f.categoryId === categoryId && f.status === "ACTIVE"
    ),
  familiesByScope:
    (scope: LibraryScope) => (s: LibraryState) =>
      s.families.filter((f) => f.scope === scope),
  familyById: (id: string) => (s: LibraryState) =>
    s.families.find((f) => f.id === id),

  // ── Types ──────────────────────────────────────────────────────────────────
  allTypes: (s: LibraryState) => s.types,
  activeTypes: (s: LibraryState) =>
    s.types.filter((t) => t.status === "ACTIVE"),
  typesByFamily: (familyId: string) => (s: LibraryState) =>
    s.types.filter(
      (t) => t.familyId === familyId && t.status === "ACTIVE"
    ),
  typesByScope:
    (scope: LibraryScope) => (s: LibraryState) =>
      s.types.filter((t) => t.scope === scope),
  typeById: (id: string) => (s: LibraryState) =>
    s.types.find((t) => t.id === id),

  // ── Materials ──────────────────────────────────────────────────────────────
  allMaterials: (s: LibraryState) => s.materials,
  activeMaterials: (s: LibraryState) =>
    s.materials.filter((m) => m.status === "ACTIVE"),
  materialsByCategory:
    (category: import("../types/wallTypes").MaterialCategory) =>
    (s: LibraryState) =>
      s.materials.filter(
        (m) => m.category === category && m.status === "ACTIVE"
      ),
  materialsByScope:
    (scope: LibraryScope) => (s: LibraryState) =>
      s.materials.filter((m) => m.scope === scope),
  materialById: (id: string) => (s: LibraryState) =>
    s.materials.find((m) => m.id === id),

  // ── Assemblies ─────────────────────────────────────────────────────────────
  allAssemblies: (s: LibraryState) => s.assemblies,
  activeAssemblies: (s: LibraryState) =>
    s.assemblies.filter((a) => a.status === "ACTIVE"),
  assembliesForCategory: (categoryCode: string) => (s: LibraryState) =>
    s.assemblies.filter(
      (a) =>
        a.status === "ACTIVE" &&
        (a.applicableCategories.length === 0 ||
          a.applicableCategories.includes(categoryCode))
    ),
  assemblyById: (id: string) => (s: LibraryState) =>
    s.assemblies.find((a) => a.id === id),

  // ── Finish systems ─────────────────────────────────────────────────────────
  allFinishSystems: (s: LibraryState) => s.finishSystems,
  activeFinishSystems: (s: LibraryState) =>
    s.finishSystems.filter((f) => f.status === "ACTIVE"),
  finishSystemsBySurface:
    (surface: import("../types/libraryTypes").FinishSurface) =>
    (s: LibraryState) =>
      s.finishSystems.filter(
        (f) =>
          f.status === "ACTIVE" &&
          (f.surface === surface || f.surface === "ANY")
      ),
  finishSystemById: (id: string) => (s: LibraryState) =>
    s.finishSystems.find((f) => f.id === id),

  // ── Profiles ───────────────────────────────────────────────────────────────
  allProfiles: (s: LibraryState) => s.profiles,
  activeProfiles: (s: LibraryState) =>
    s.profiles.filter((p) => p.status === "ACTIVE"),
  profilesByType:
    (sectionType: import("../types/libraryTypes").SectionType) =>
    (s: LibraryState) =>
      s.profiles.filter(
        (p) => p.sectionType === sectionType && p.status === "ACTIVE"
      ),
  profileById: (id: string) => (s: LibraryState) =>
    s.profiles.find((p) => p.id === id),

  // ── Variants ───────────────────────────────────────────────────────────────
  allVariants: (s: LibraryState) => s.variants,
  activeVariants: (s: LibraryState) =>
    s.variants.filter((v) => v.status === "ACTIVE"),
  variantsByType: (elementTypeId: string) => (s: LibraryState) =>
    s.variants.filter(
      (v) => v.elementTypeId === elementTypeId && v.status === "ACTIVE"
    ),
  defaultVariantForType: (elementTypeId: string) => (s: LibraryState) =>
    s.variants.find(
      (v) =>
        v.elementTypeId === elementTypeId &&
        v.isDefault &&
        v.status === "ACTIVE"
    ),
  variantById: (id: string) => (s: LibraryState) =>
    s.variants.find((v) => v.id === id),

  // ── Selection ──────────────────────────────────────────────────────────────
  selection: (s: LibraryState) => s.selection,
  selectedCategory: (s: LibraryState) =>
    s.selection.categoryId
      ? s.categories.find((c) => c.id === s.selection.categoryId)
      : null,
  selectedFamily: (s: LibraryState) =>
    s.selection.familyId
      ? s.families.find((f) => f.id === s.selection.familyId)
      : null,
  selectedType: (s: LibraryState) =>
    s.selection.typeId
      ? s.types.find((t) => t.id === s.selection.typeId)
      : null,
};
