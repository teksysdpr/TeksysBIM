"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Building2,
  ChevronRight,
  Columns3,
  Copy,
  DoorOpen,
  Globe,
  Layers,
  Layers3,
  LayoutGrid,
  Lock,
  Package,
  Palette,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  SquareStack,
  Tag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useLibraryStore, librarySelectors } from "@/app/editor/stores/libraryStore";
import { SYSTEM_LIBRARY } from "@/app/editor/data/systemLibrary";
import type { LibraryScope } from "@/app/editor/types/libraryBase";
import type {
  ElementCategory,
  ElementFamily,
  ElementType,
  Material,
  LayerAssembly,
  MaterialCategory,
} from "@/app/editor/types/libraryTypes";
import MaterialFormModal from "./MaterialFormModal";
import ElementTypeFormModal from "./ElementTypeFormModal";

// ── Types ──────────────────────────────────────────────────────────────────────

type LibTab = "elements" | "materials" | "assemblies" | "finishes" | "profiles";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: { id: LibTab; label: string; icon: LucideIcon }[] = [
  { id: "elements", label: "Elements", icon: Layers },
  { id: "materials", label: "Materials", icon: Palette },
  { id: "assemblies", label: "Assemblies", icon: SquareStack },
  { id: "finishes", label: "Finishes", icon: PenLine },
  { id: "profiles", label: "Profiles", icon: Settings2 },
];

const SCOPE_CONFIG: {
  value: LibraryScope;
  label: string;
  icon: LucideIcon;
  hint: string;
}[] = [
  {
    value: "SYSTEM",
    label: "System",
    icon: Globe,
    hint: "Built-in read-only library",
  },
  {
    value: "COMPANY",
    label: "Company",
    icon: Building2,
    hint: "Shared across all projects",
  },
  {
    value: "PROJECT",
    label: "Project",
    icon: Package,
    hint: "Private to this project",
  },
];

const MATERIAL_CATEGORIES: { value: MaterialCategory | "ALL"; label: string }[] =
  [
    { value: "ALL", label: "All Materials" },
    { value: "MASONRY", label: "Masonry" },
    { value: "CONCRETE", label: "Concrete" },
    { value: "METAL", label: "Metal" },
    { value: "WOOD", label: "Wood" },
    { value: "INSULATION", label: "Insulation" },
    { value: "MEMBRANE", label: "Membrane" },
    { value: "FINISH", label: "Finish" },
    { value: "GLASS", label: "Glass" },
    { value: "EARTH", label: "Earth" },
    { value: "OTHER", label: "Other" },
  ];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Items visible under a given scope (scope hierarchy: PROJECT > COMPANY > SYSTEM) */
function matchesScope(itemScope: LibraryScope, viewScope: LibraryScope): boolean {
  if (viewScope === "SYSTEM") return itemScope === "SYSTEM";
  if (viewScope === "COMPANY") return itemScope === "SYSTEM" || itemScope === "COMPANY";
  return true; // PROJECT sees all
}

function scopeBadge(scope: LibraryScope) {
  if (scope === "SYSTEM")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        <Lock className="h-2.5 w-2.5" />
        System
      </span>
    );
  if (scope === "COMPANY")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
        <Building2 className="h-2.5 w-2.5" />
        Company
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-600">
      <Package className="h-2.5 w-2.5" />
      Project
    </span>
  );
}

function statusDot(status: string) {
  if (status === "ACTIVE")
    return <span className="h-2 w-2 rounded-full bg-emerald-400" />;
  if (status === "ARCHIVED")
    return <span className="h-2 w-2 rounded-full bg-slate-300" />;
  return <span className="h-2 w-2 rounded-full bg-amber-400" />;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
        <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-xs text-slate-400">
          Switch to Company or Project scope to add items.
        </p>
      </div>
    </div>
  );
}

function DetailPanelPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <div className="rounded-2xl border border-dashed border-slate-200 p-6">
        <Columns3 className="mx-auto h-7 w-7 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-500">
          Select an item
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Click any card to view
          <br />
          properties and details.
        </p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function LibraryManagerPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [scope, setScope] = useState<LibraryScope>("SYSTEM");
  const [activeTab, setActiveTab] = useState<LibTab>("elements");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedMatCategory, setSelectedMatCategory] = useState<
    MaterialCategory | "ALL"
  >("ALL");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // ── Modal state ────────────────────────────────────────────────────────────
  type ModalConfig =
    | { kind: "material-create"; initial?: Material }
    | { kind: "material-edit"; item: Material }
    | { kind: "type-create"; initial?: ElementType }
    | { kind: "type-edit"; item: ElementType }
    | { kind: "type-clone"; item: ElementType };
  const [modal, setModal] = useState<ModalConfig | null>(null);

  // ── Seed system library once ───────────────────────────────────────────────
  useEffect(() => {
    useLibraryStore.getState().loadCollection(SYSTEM_LIBRARY);
  }, []);

  // ── Store selectors ────────────────────────────────────────────────────────
  const allCategories = useLibraryStore(librarySelectors.activeCategories);
  const allFamilies = useLibraryStore(librarySelectors.activeFamilies);
  const allTypes = useLibraryStore(librarySelectors.activeTypes);
  const allMaterials = useLibraryStore(librarySelectors.activeMaterials);
  const allAssemblies = useLibraryStore(librarySelectors.activeAssemblies);
  const allFinishSystems = useLibraryStore(librarySelectors.activeFinishSystems);
  const allProfiles = useLibraryStore(librarySelectors.activeProfiles);
  // Full (including archived) for lookups and detail panel
  const allMaterialsFull = useLibraryStore(librarySelectors.allMaterials);
  const allTypesFull = useLibraryStore(librarySelectors.allTypes);
  const allAssembliesFull = useLibraryStore(librarySelectors.allAssemblies);

  // ── Derived data ───────────────────────────────────────────────────────────
  const visibleCategories = useMemo(
    () => allCategories.filter((c) => matchesScope(c.scope, scope)),
    [allCategories, scope]
  );

  const visibleFamilies = useMemo(
    () => allFamilies.filter((f) => matchesScope(f.scope, scope)),
    [allFamilies, scope]
  );

  const visibleTypes = useMemo(() => {
    const source = showArchived ? allTypesFull : allTypes;
    return source.filter((t) => matchesScope(t.scope, scope));
  }, [allTypes, allTypesFull, showArchived, scope]);

  const visibleMaterials = useMemo(() => {
    const source = showArchived ? allMaterialsFull : allMaterials;
    let items = source.filter((m) => matchesScope(m.scope, scope));
    if (selectedMatCategory !== "ALL")
      items = items.filter((m) => m.category === selectedMatCategory);
    if (search)
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.code.toLowerCase().includes(search.toLowerCase())
      );
    return items;
  }, [allMaterials, allMaterialsFull, showArchived, scope, selectedMatCategory, search]);

  const visibleAssemblies = useMemo(() => {
    const source = showArchived ? allAssembliesFull : allAssemblies;
    let items = source.filter((a) => matchesScope(a.scope, scope));
    if (search)
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.code.toLowerCase().includes(search.toLowerCase())
      );
    return items;
  }, [allAssemblies, allAssembliesFull, showArchived, scope, search]);

  // Types visible in the main grid (filtered by selected family or all)
  const mainTypes = useMemo(() => {
    let items = visibleTypes;
    if (selectedFamilyId)
      items = items.filter((t) => t.familyId === selectedFamilyId);
    if (search)
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.code.toLowerCase().includes(search.toLowerCase())
      );
    return items;
  }, [visibleTypes, selectedFamilyId, search]);

  // Selected item — use Full variants so archived items remain selectable in detail panel
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return (
      allTypesFull.find((t) => t.id === selectedItemId) ||
      allMaterialsFull.find((m) => m.id === selectedItemId) ||
      allAssembliesFull.find((a) => a.id === selectedItemId) ||
      null
    );
  }, [selectedItemId, allTypesFull, allMaterialsFull, allAssembliesFull]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleScopeChange(s: LibraryScope) {
    setScope(s);
    setSelectedItemId(null);
    setSelectedFamilyId(null);
    setSelectedCategoryId(null);
    setSearch("");
  }

  function handleTabChange(tab: LibTab) {
    setActiveTab(tab);
    setSelectedItemId(null);
    setSelectedFamilyId(null);
    setSelectedCategoryId(null);
    setSearch("");
  }

  function handleCategoryClick(catId: string) {
    const isExpanding = expandedCategoryId !== catId;
    setExpandedCategoryId(isExpanding ? catId : null);
    setSelectedCategoryId(isExpanding ? catId : null);
    setSelectedFamilyId(null);
    setSelectedItemId(null);
  }

  function handleFamilyClick(famId: string) {
    setSelectedFamilyId(famId === selectedFamilyId ? null : famId);
    setSelectedItemId(null);
  }

  // ── Detail panel action handlers ───────────────────────────────────────────
  function handleDetailArchive() {
    if (!selectedItem) return;
    const store = useLibraryStore.getState();
    if ("familyId" in selectedItem) store.archiveType(selectedItem.id);
    else if ("colour" in selectedItem) store.archiveMaterial(selectedItem.id);
    else if ("layers" in selectedItem) store.archiveAssembly(selectedItem.id);
    setSelectedItemId(null);
  }

  function handleDetailRestore() {
    if (!selectedItem) return;
    const store = useLibraryStore.getState();
    if ("familyId" in selectedItem) store.restoreType(selectedItem.id);
    else if ("colour" in selectedItem) store.restoreMaterial(selectedItem.id);
    else if ("layers" in selectedItem) store.restoreAssembly(selectedItem.id);
  }

  function handleDetailEdit() {
    if (!selectedItem) return;
    if ("colour" in selectedItem)
      setModal({ kind: "material-edit", item: selectedItem as Material });
    else if ("familyId" in selectedItem)
      setModal({ kind: "type-edit", item: selectedItem as ElementType });
  }

  function handleDetailClone() {
    if (!selectedItem) return;
    if ("colour" in selectedItem)
      setModal({ kind: "material-create", initial: selectedItem as Material });
    else if ("familyId" in selectedItem)
      setModal({ kind: "type-clone", item: selectedItem as ElementType });
  }

  // ── Render helpers ─────────────────────────────────────────────────────────
  function familiesFor(catId: string) {
    return visibleFamilies.filter((f) => f.categoryId === catId);
  }

  function typesFor(famId: string) {
    return visibleTypes.filter((t) => t.familyId === famId);
  }

  // ── Left panel content ─────────────────────────────────────────────────────
  function renderLeftNav() {
    if (activeTab === "elements") {
      return (
        <nav className="space-y-0.5">
          <button
            onClick={() => { setSelectedCategoryId(null); setExpandedCategoryId(null); setSelectedFamilyId(null); }}
            className={[
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
              !selectedCategoryId
                ? "bg-teal-50 font-semibold text-teal-800"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            ].join(" ")}
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">All Categories</span>
            <span className="text-xs text-slate-400">{visibleCategories.length}</span>
          </button>

          {visibleCategories.map((cat) => {
            const families = familiesFor(cat.id);
            const isExpanded = expandedCategoryId === cat.id;
            return (
              <div key={cat.id}>
                <button
                  onClick={() => handleCategoryClick(cat.id)}
                  className={[
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                    selectedCategoryId === cat.id
                      ? "bg-teal-50 font-semibold text-teal-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Layers className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="flex-1 text-left">{cat.name}</span>
                  {families.length > 0 && (
                    <ChevronRight
                      className={[
                        "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform",
                        isExpanded ? "rotate-90" : "",
                      ].join(" ")}
                    />
                  )}
                </button>

                {isExpanded && families.length > 0 && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-100 pl-3">
                    {families.map((fam) => {
                      const count = typesFor(fam.id).length;
                      return (
                        <button
                          key={fam.id}
                          onClick={() => handleFamilyClick(fam.id)}
                          className={[
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition",
                            selectedFamilyId === fam.id
                              ? "bg-teal-50 font-semibold text-teal-700"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                          ].join(" ")}
                        >
                          <span className="flex-1 text-left">{fam.name}</span>
                          <span className="text-slate-400">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      );
    }

    if (activeTab === "materials") {
      return (
        <nav className="space-y-0.5">
          {MATERIAL_CATEGORIES.map((mc) => {
            const count =
              mc.value === "ALL"
                ? allMaterials.filter((m) => matchesScope(m.scope, scope)).length
                : allMaterials.filter(
                    (m) => matchesScope(m.scope, scope) && m.category === mc.value
                  ).length;
            return (
              <button
                key={mc.value}
                onClick={() => setSelectedMatCategory(mc.value)}
                className={[
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  selectedMatCategory === mc.value
                    ? "bg-teal-50 font-semibold text-teal-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
              >
                <span className="flex-1 text-left">{mc.label}</span>
                <span className="text-xs text-slate-400">{count}</span>
              </button>
            );
          })}
        </nav>
      );
    }

    if (activeTab === "assemblies") {
      const wallCount = allAssemblies.filter(
        (a) =>
          matchesScope(a.scope, scope) &&
          a.applicableCategories.includes("WALL")
      ).length;
      const slabCount = allAssemblies.filter(
        (a) =>
          matchesScope(a.scope, scope) &&
          a.applicableCategories.includes("SLAB")
      ).length;
      return (
        <nav className="space-y-0.5">
          {[
            { label: "All Assemblies", filter: "ALL", count: visibleAssemblies.length },
            { label: "Wall", filter: "WALL", count: wallCount },
            { label: "Slab", filter: "SLAB", count: slabCount },
          ].map((item) => (
            <button
              key={item.label}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="flex-1 text-left">{item.label}</span>
              <span className="text-xs text-slate-400">{item.count}</span>
            </button>
          ))}
        </nav>
      );
    }

    if (activeTab === "finishes") {
      return (
        <nav className="space-y-0.5">
          {["All Finishes", "Floor", "Wall", "Ceiling", "External"].map((s) => (
            <button
              key={s}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="flex-1 text-left">{s}</span>
              <span className="text-xs text-slate-400">0</span>
            </button>
          ))}
        </nav>
      );
    }

    if (activeTab === "profiles") {
      return (
        <nav className="space-y-0.5">
          {[
            "All Profiles",
            "Rectangular",
            "Circular",
            "I-Section",
            "C-Section",
            "T-Section",
            "L-Section",
            "Hollow Rect.",
            "Custom",
          ].map((s) => (
            <button
              key={s}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="flex-1 text-left">{s}</span>
              <span className="text-xs text-slate-400">0</span>
            </button>
          ))}
        </nav>
      );
    }

    return null;
  }

  // ── Main content ───────────────────────────────────────────────────────────
  function renderMainContent() {
    if (activeTab === "elements") {
      // If no family selected → show category cards
      if (!selectedCategoryId) {
        return (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCategories.map((cat) => {
              const families = familiesFor(cat.id);
              const typeCount = families.reduce(
                (sum, f) => sum + typesFor(f.id).length,
                0
              );
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="group rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="inline-flex rounded-xl bg-teal-50 p-2.5 text-teal-600">
                      <Layers className="h-5 w-5" />
                    </div>
                    {scopeBadge(cat.scope)}
                  </div>
                  <h4 className="mt-3 font-black text-slate-900">{cat.name}</h4>
                  {cat.description && (
                    <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                    <span>{families.length} families</span>
                    <span>·</span>
                    <span>{typeCount} types</span>
                  </div>
                </button>
              );
            })}
          </div>
        );
      }

      // Category selected → show families if no family picked
      const activeFamilies = familiesFor(selectedCategoryId);
      if (!selectedFamilyId) {
        if (activeFamilies.length === 0) {
          return (
            <EmptyState label="No families in this category yet." />
          );
        }
        return (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {activeFamilies.map((fam) => {
              const count = typesFor(fam.id).length;
              return (
                <button
                  key={fam.id}
                  onClick={() => handleFamilyClick(fam.id)}
                  className="group rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="inline-flex rounded-xl bg-slate-100 p-2.5 text-slate-600">
                      <Tag className="h-5 w-5" />
                    </div>
                    {scopeBadge(fam.scope)}
                  </div>
                  <h4 className="mt-3 font-black text-slate-900">{fam.name}</h4>
                  {fam.description && (
                    <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-2">
                      {fam.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-slate-400">{count} types</p>
                </button>
              );
            })}
          </div>
        );
      }

      // Family selected → show types
      if (mainTypes.length === 0)
        return <EmptyState label="No element types in this family yet." />;

      return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {mainTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedItemId(t.id === selectedItemId ? null : t.id)}
              className={[
                "group rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                selectedItemId === t.id
                  ? "border-teal-300 bg-teal-50/60 ring-1 ring-teal-200"
                  : "border-slate-100 bg-white hover:border-teal-200",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {statusDot(t.status)}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {t.code}
                  </code>
                </div>
                {scopeBadge(t.scope)}
              </div>
              <h4 className="mt-2.5 text-sm font-black text-slate-900 leading-snug">
                {t.name}
              </h4>
              {t.description && (
                <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-2">
                  {t.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                {t.nominalThickness != null && (
                  <span>{t.nominalThickness}mm thick</span>
                )}
                {t.isStructural && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    Structural
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (activeTab === "materials") {
      if (visibleMaterials.length === 0)
        return <EmptyState label="No materials found." />;

      return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleMaterials.map((mat) => (
            <button
              key={mat.id}
              onClick={() => setSelectedItemId(mat.id === selectedItemId ? null : mat.id)}
              className={[
                "group rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                selectedItemId === mat.id
                  ? "border-teal-300 bg-teal-50/60 ring-1 ring-teal-200"
                  : "border-slate-100 bg-white hover:border-teal-200",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Colour swatch */}
                  <span
                    className="h-5 w-5 shrink-0 rounded-md border border-black/10 shadow-sm"
                    style={{ backgroundColor: mat.colour }}
                  />
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {mat.code}
                  </code>
                </div>
                {scopeBadge(mat.scope)}
              </div>
              <h4 className="mt-2.5 text-sm font-black text-slate-900">
                {mat.name}
              </h4>
              {mat.description && (
                <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-2">
                  {mat.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 uppercase text-[10px] font-semibold">
                  {mat.category}
                </span>
                {mat.density && <span>{mat.density} kg/m³</span>}
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (activeTab === "assemblies") {
      if (visibleAssemblies.length === 0)
        return <EmptyState label="No assemblies found." />;

      return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleAssemblies.map((asm) => (
            <button
              key={asm.id}
              onClick={() =>
                setSelectedItemId(asm.id === selectedItemId ? null : asm.id)
              }
              className={[
                "group rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                selectedItemId === asm.id
                  ? "border-teal-300 bg-teal-50/60 ring-1 ring-teal-200"
                  : "border-slate-100 bg-white hover:border-teal-200",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {statusDot(asm.status)}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {asm.code}
                  </code>
                </div>
                {scopeBadge(asm.scope)}
              </div>
              <h4 className="mt-2.5 text-sm font-black text-slate-900 leading-snug">
                {asm.name}
              </h4>
              {asm.description && (
                <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-2">
                  {asm.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span>{asm.totalThickness}mm total</span>
                <span>·</span>
                <span>{asm.layers.length} layers</span>
                {asm.fireRating && (
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-600 text-[10px] font-semibold">
                    {asm.fireRating}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (activeTab === "finishes") {
      return <EmptyState label="No finish systems defined yet." />;
    }

    if (activeTab === "profiles") {
      return <EmptyState label="No structural profiles defined yet." />;
    }

    return null;
  }

  // ── Right panel ────────────────────────────────────────────────────────────
  function renderDetailPanel() {
    if (!selectedItem) return <DetailPanelPlaceholder />;
    const item = selectedItem;
    const isArchived = item.status === "ARCHIVED";
    const canClone = "colour" in item || "familyId" in item;

    return (
      <div className="space-y-4 p-1">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {statusDot(item.status)}
            {scopeBadge(item.scope)}
            {isArchived && (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Archived
              </span>
            )}
          </div>
          <h3 className="text-base font-black leading-snug text-slate-900">
            {item.name}
          </h3>
          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
            {item.code}
          </code>
        </div>

        {item.description && (
          <p className="text-xs leading-5 text-slate-500">{item.description}</p>
        )}

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Material-specific panel ─────────────────────────────────────── */}
        {"colour" in item && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="h-10 w-10 shrink-0 rounded-xl border border-black/10 shadow-sm"
                style={{ backgroundColor: (item as Material).colour }}
              />
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  {(item as Material).category}
                </p>
                <p className="text-[10px] text-slate-400">
                  {(item as Material).phase}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">
                Physical Properties
              </p>
              <dl className="space-y-1.5">
                {(item as Material).density != null && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">Density</dt>
                    <dd className="font-semibold text-slate-800">
                      {(item as Material).density} kg/m³
                    </dd>
                  </div>
                )}
                {(item as Material).thermalConductivity != null && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">λ (W/m·K)</dt>
                    <dd className="font-semibold text-slate-800">
                      {(item as Material).thermalConductivity}
                    </dd>
                  </div>
                )}
                {(item as Material).compressiveStrength != null && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">Comp. Strength</dt>
                    <dd className="font-semibold text-slate-800">
                      {(item as Material).compressiveStrength} MPa
                    </dd>
                  </div>
                )}
                {(item as Material).vapourResistance != null && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">μ Vapour</dt>
                    <dd className="font-semibold text-slate-800">
                      {(item as Material).vapourResistance}
                    </dd>
                  </div>
                )}
                {(item as Material).ifcMaterialName && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">IFC Name</dt>
                    <dd className="truncate max-w-[8rem] font-semibold text-slate-800">
                      {(item as Material).ifcMaterialName}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* ── Assembly-specific panel (layer stack) ───────────────────────── */}
        {"layers" in item && (
          <div className="space-y-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">
                Assembly
              </p>
              <dl className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <dt className="text-slate-500">Total Thickness</dt>
                  <dd className="font-semibold text-slate-800">
                    {(item as LayerAssembly).totalThickness}mm
                  </dd>
                </div>
                {(item as LayerAssembly).thermalResistance != null && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">R-Value (m²K/W)</dt>
                    <dd className="font-semibold text-slate-800">
                      {(item as LayerAssembly).thermalResistance}
                    </dd>
                  </div>
                )}
                {(item as LayerAssembly).soundReductionIndex != null && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">Sound Rw</dt>
                    <dd className="font-semibold text-slate-800">
                      {(item as LayerAssembly).soundReductionIndex} dB
                    </dd>
                  </div>
                )}
                {(item as LayerAssembly).fireRating && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">Fire Rating</dt>
                    <dd className="font-semibold text-orange-700">
                      {(item as LayerAssembly).fireRating}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Layer Stack (exterior → interior)
            </p>
            <div className="space-y-1">
              {[...(item as LayerAssembly).layers]
                .sort((a, b) => a.order - b.order)
                .map((layer, i) => {
                  const mat = allMaterialsFull.find(
                    (m) => m.id === layer.materialId
                  );
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2"
                    >
                      <span
                        className="h-4 w-4 shrink-0 rounded border border-black/10"
                        style={{ backgroundColor: mat?.colour ?? "#ccc" }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {mat?.name ?? layer.name ?? "Unknown material"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {layer.function} · {layer.thickness}mm
                          {layer.isStructural ? " · structural" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Element type-specific panel ─────────────────────────────────── */}
        {"familyId" in item && (
          <div className="space-y-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">
                Properties
              </p>
              <dl className="space-y-1.5">
                {(item as ElementType).nominalThickness != null && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">Thickness</dt>
                    <dd className="font-semibold text-slate-800">
                      {(item as ElementType).nominalThickness}mm
                    </dd>
                  </div>
                )}
                {(item as ElementType).nominalHeight != null && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">Height</dt>
                    <dd className="font-semibold text-slate-800">
                      {(item as ElementType).nominalHeight}mm
                    </dd>
                  </div>
                )}
                {(item as ElementType).isStructural != null && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">Structural</dt>
                    <dd className="font-semibold text-slate-800">
                      {(item as ElementType).isStructural ? "Yes" : "No"}
                    </dd>
                  </div>
                )}
                {(item as ElementType).isFireRated && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">Fire Rating</dt>
                    <dd className="font-semibold text-orange-700">
                      {(item as ElementType).fireRating ?? "Rated"}
                    </dd>
                  </div>
                )}
                {(item as ElementType).ifcTypeName && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500">IFC Type</dt>
                    <dd className="truncate max-w-[8rem] font-semibold text-slate-800">
                      {(item as ElementType).ifcTypeName}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Linked assembly summary */}
            {(item as ElementType).assemblyId && (() => {
              const asm = allAssembliesFull.find(
                (a) => a.id === (item as ElementType).assemblyId
              );
              if (!asm) return null;
              return (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">
                    Layer Assembly
                  </p>
                  <p className="text-xs font-semibold text-slate-800">{asm.name}</p>
                  <p className="mb-2 text-[10px] text-slate-500">
                    {asm.totalThickness}mm · {asm.layers.length} layers
                  </p>
                  <div className="space-y-1">
                    {[...asm.layers]
                      .sort((a, b) => a.order - b.order)
                      .map((layer, i) => {
                        const mat = allMaterialsFull.find(
                          (m) => m.id === layer.materialId
                        );
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 shrink-0 rounded border border-black/10"
                              style={{ backgroundColor: mat?.colour ?? "#ccc" }}
                            />
                            <span className="truncate text-[10px] text-slate-600">
                              {mat?.name ?? "Unknown"} · {layer.thickness}mm
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Built-in notice ─────────────────────────────────────────────── */}
        {item.isBuiltIn && (
          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <p className="text-xs leading-5 text-slate-500">
              System built-in item. Clone to{" "}
              <span className="font-semibold">Company</span> or{" "}
              <span className="font-semibold">Project</span> library to customise.
            </p>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="space-y-2 pt-1">
          {/* Edit + Clone row (only for non-assembly items) */}
          {canClone && !item.isBuiltIn && (
            <div className="flex gap-2">
              <button
                onClick={handleDetailEdit}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                onClick={handleDetailClone}
                title="Clone"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Clone for built-in items (scope can be system, result goes to company) */}
          {canClone && item.isBuiltIn && (
            <button
              onClick={handleDetailClone}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-100"
            >
              <Copy className="h-3.5 w-3.5" />
              Clone to{" "}
              {scope === "PROJECT" ? "Project" : "Company"} Library
            </button>
          )}

          {/* Archive / Restore — only for non-built-in editable items */}
          {!item.isBuiltIn && (
            <>
              {!isArchived ? (
                <button
                  onClick={handleDetailArchive}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
              ) : (
                <button
                  onClick={handleDetailRestore}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Breadcrumb label ───────────────────────────────────────────────────────
  const breadcrumbParts = useMemo(() => {
    const parts: string[] = [];
    if (selectedCategoryId) {
      const cat = allCategories.find((c) => c.id === selectedCategoryId);
      if (cat) parts.push(cat.name);
    }
    if (selectedFamilyId) {
      const fam = allFamilies.find((f) => f.id === selectedFamilyId);
      if (fam) parts.push(fam.name);
    }
    return parts;
  }, [selectedCategoryId, selectedFamilyId, allCategories, allFamilies]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-[calc(100vh-260px)] flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white px-5 py-3.5">
        <Link
          href="/company/bim-design"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BIM Design
        </Link>

        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <BookOpen className="h-4 w-4 text-teal-500" />
          <span className="font-black text-slate-900">Element Library</span>
          {breadcrumbParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-slate-600">{part}</span>
            </span>
          ))}
        </div>

        {/* Spacer */}
        <div className="ml-auto flex items-center gap-2">
          {/* Scope switcher */}
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {SCOPE_CONFIG.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                title={SCOPE_CONFIG.find((s) => s.value === value)?.hint}
                onClick={() => handleScopeChange(value)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  scope === value
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Add button */}
          {scope !== "SYSTEM" &&
            (activeTab === "materials" || activeTab === "elements") && (
              <button
                onClick={() => {
                  if (activeTab === "materials")
                    setModal({ kind: "material-create" });
                  else setModal({ kind: "type-create" });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            )}
        </div>
      </header>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 border-b border-slate-100 bg-white px-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={[
              "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition",
              activeTab === id
                ? "border-teal-500 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-800",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Three-panel body ─────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left nav */}
        <aside className="hidden w-52 shrink-0 overflow-y-auto border-r border-slate-100 bg-slate-50/60 p-3 md:block xl:w-56">
          <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
            {activeTab === "elements" && "Categories"}
            {activeTab === "materials" && "Filter by type"}
            {activeTab === "assemblies" && "Filter by use"}
            {activeTab === "finishes" && "Surface type"}
            {activeTab === "profiles" && "Section type"}
          </p>
          {renderLeftNav()}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-white">
          {/* Search bar */}
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {activeTab === "elements" &&
                  !selectedFamilyId &&
                  !selectedCategoryId &&
                  `${visibleCategories.length} categories`}
                {activeTab === "elements" &&
                  selectedCategoryId &&
                  !selectedFamilyId &&
                  `${familiesFor(selectedCategoryId).length} families`}
                {activeTab === "elements" &&
                  selectedFamilyId &&
                  `${mainTypes.length} types`}
                {activeTab === "materials" &&
                  `${visibleMaterials.length} materials`}
                {activeTab === "assemblies" &&
                  `${visibleAssemblies.length} assemblies`}
                {(activeTab === "finishes" || activeTab === "profiles") && "0 items"}
              </span>
              {(activeTab === "elements" ||
                activeTab === "materials" ||
                activeTab === "assemblies") && (
                <button
                  onClick={() => setShowArchived((p) => !p)}
                  title={
                    showArchived ? "Hide archived items" : "Show archived items"
                  }
                  className={[
                    "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition",
                    showArchived
                      ? "border-slate-300 bg-slate-100 text-slate-700"
                      : "border-slate-200 bg-white text-slate-400 hover:text-slate-600",
                  ].join(" ")}
                >
                  <Archive className="h-3.5 w-3.5" />
                  {showArchived ? "Archived on" : "Archived"}
                </button>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="p-5">{renderMainContent()}</div>
        </main>

        {/* Right detail panel */}
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-l border-slate-100 bg-white p-4 xl:block xl:w-72">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-slate-400">
            Item Details
          </p>
          {renderDetailPanel()}
        </aside>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {modal?.kind === "material-create" && (
        <MaterialFormModal
          mode="create"
          scope={scope === "SYSTEM" ? "COMPANY" : scope}
          initial={modal.initial}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "material-edit" && (
        <MaterialFormModal
          mode="edit"
          scope={modal.item.scope}
          initial={modal.item}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "type-create" && (
        <ElementTypeFormModal
          mode="create"
          scope={scope === "SYSTEM" ? "COMPANY" : scope}
          initial={modal.initial}
          defaultFamilyId={selectedFamilyId ?? undefined}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "type-edit" && (
        <ElementTypeFormModal
          mode="edit"
          scope={modal.item.scope}
          initial={modal.item}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "type-clone" && (
        <ElementTypeFormModal
          mode="clone"
          scope={scope === "SYSTEM" ? "COMPANY" : scope}
          initial={modal.item}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
