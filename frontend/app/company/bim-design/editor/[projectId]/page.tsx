"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlignHorizontalJustifyStart,
  ArrowLeft,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Columns3,
  DoorOpen,
  Layers,
  LayoutGrid,
  Loader2,
  MousePointer2,
  Move,
  Ruler,
  Save,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useWorkbenchStore,
  workbenchSelectors,
  TOOL_CATEGORY_MAP,
  CATEGORY_TOOL_MAP,
  type ToolId,
} from "@/app/editor/stores/workbenchStore";
import { useLibraryStore, librarySelectors } from "@/app/editor/stores/libraryStore";
import { useSceneStore } from "@/app/editor/stores/sceneStore";
import { SYSTEM_LIBRARY } from "@/app/editor/data/systemLibrary";
import type { ElementCategory, ElementFamily, ElementType } from "@/app/editor/types/libraryTypes";
import type { SceneEntity } from "@/app/editor/types/sceneTypes";
import {
  fetchProjectScene,
  saveProjectScene,
} from "@/app/services/bimSceneService";
import EditorCanvas from "./EditorCanvas";

// ── Tool definitions ───────────────────────────────────────────────────────────

interface ToolDef {
  id: ToolId;
  label: string;
  icon: LucideIcon;
  group: "nav" | "place" | "utility";
}

const TOOL_DEFS: ToolDef[] = [
  { id: "SELECT", label: "Select", icon: MousePointer2, group: "nav" },
  { id: "PAN", label: "Pan", icon: Move, group: "nav" },
  { id: "WALL", label: "Wall", icon: Layers, group: "place" },
  { id: "SLAB", label: "Slab", icon: LayoutGrid, group: "place" },
  { id: "COLUMN", label: "Column", icon: Columns3, group: "place" },
  { id: "BEAM", label: "Beam", icon: AlignHorizontalJustifyStart, group: "place" },
  { id: "DOOR", label: "Door", icon: DoorOpen, group: "place" },
  { id: "STAIR", label: "Stair", icon: TrendingUp, group: "place" },
  { id: "MEASURE", label: "Measure", icon: Ruler, group: "utility" },
];

// ── Category icon mapping ──────────────────────────────────────────────────────

const CAT_ICON: Record<string, LucideIcon> = {
  WALL: Layers,
  SLAB: LayoutGrid,
  COLUMN: Columns3,
  BEAM: AlignHorizontalJustifyStart,
  DOOR: DoorOpen,
  WINDOW: Box,
  STAIR: TrendingUp,
  RAMP: TrendingUp,
  GRILL: Box,
  LIFT: Box,
};

function catIcon(code: string): LucideIcon {
  return CAT_ICON[code.toUpperCase()] ?? Box;
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId ?? "demo";

  // ── Save status local state ────────────────────────────────────────────────
  type SaveStatus = "idle" | "saving" | "saved" | "error";
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Phase 3B/3C: reset + hydrate workbench and scene on project change ────
  useEffect(() => {
    // Full workbench state reset — no tool, no palette selection
    useWorkbenchStore.getState().resetForProject(projectId);
    // Clear placed entities so no stale geometry leaks from a previous project
    useSceneStore.getState().clearScene();
    // Clear library UI selection state
    useLibraryStore.getState().clearSelection();
    // Seed system library if not already loaded
    useLibraryStore.getState().loadCollection(SYSTEM_LIBRARY);

    // Phase 3C: try to restore the last saved scene for this project
    let cancelled = false;
    fetchProjectScene(projectId).then((scene) => {
      if (cancelled || !scene) return;
      // Validate activeTool is a known ToolId before hydrating
      const knownTools: Array<ToolId> = [
        "SELECT", "PAN", "WALL", "SLAB", "DOOR", "WINDOW", "COLUMN", "BEAM", "STAIR", "MEASURE",
      ];
      const tool = knownTools.includes(scene.activeTool as ToolId)
        ? (scene.activeTool as ToolId)
        : null;
      useWorkbenchStore.getState().hydrateFromScene(scene.palette, tool, scene.savedAt);
      // Hydrate placed entities into sceneStore
      useSceneStore.getState().setEntities(
        Array.isArray(scene.entities) ? (scene.entities as SceneEntity[]) : []
      );
    });

    return () => { cancelled = true; };
  }, [projectId]);

  // ── Workbench state ────────────────────────────────────────────────────────
  const activeTool = useWorkbenchStore(workbenchSelectors.activeTool);
  const palette = useWorkbenchStore(workbenchSelectors.palette);
  const isDirty = useWorkbenchStore((s) => s.isDirty);
  const savedAt = useWorkbenchStore((s) => s.savedAt);

  // ── Library data (all active, all scopes — palette is for using, not managing) ─
  const allCategories = useLibraryStore(librarySelectors.activeCategories);
  const allFamilies = useLibraryStore(librarySelectors.activeFamilies);
  const allTypes = useLibraryStore(librarySelectors.activeTypes);

  // ── Derived: resolve active type/family/category objects ──────────────────
  const activeType: ElementType | null =
    palette.typeId ? allTypes.find((t) => t.id === palette.typeId) ?? null : null;
  const activeFamily: ElementFamily | null =
    palette.familyId
      ? allFamilies.find((f) => f.id === palette.familyId) ?? null
      : null;
  const activeCat: ElementCategory | null =
    palette.categoryId
      ? allCategories.find((c) => c.id === palette.categoryId) ?? null
      : null;

  // ── Palette accordion local state ──────────────────────────────────────────
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function familiesForCat(catId: string): ElementFamily[] {
    return allFamilies.filter((f) => f.categoryId === catId);
  }

  function typesForFamily(famId: string): ElementType[] {
    return allTypes.filter((t) => t.familyId === famId);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleToolClick(toolId: ToolId) {
    const store = useWorkbenchStore.getState();
    // Toggle: clicking the active tool deactivates it
    const next = activeTool === toolId ? null : toolId;
    store.setActiveTool(next);

    // Auto-expand matching category in palette when activating a placement tool
    if (next) {
      const catCode = TOOL_CATEGORY_MAP[next];
      if (catCode && !palette.typeId) {
        const cat = allCategories.find((c) => c.code === catCode);
        if (cat && expandedCategoryId !== cat.id) {
          setExpandedCategoryId(cat.id);
          setExpandedFamilyId(null);
          store.setPalette({ categoryId: cat.id });
        }
      }
    }
  }

  function handleCategoryClick(cat: ElementCategory) {
    const isOpen = expandedCategoryId === cat.id;
    setExpandedCategoryId(isOpen ? null : cat.id);
    setExpandedFamilyId(null);
    if (!isOpen) {
      useWorkbenchStore.getState().setPalette({ categoryId: cat.id });
    }
  }

  function handleFamilyClick(fam: ElementFamily) {
    const isOpen = expandedFamilyId === fam.id;
    setExpandedFamilyId(isOpen ? null : fam.id);
    useWorkbenchStore.getState().setPalette({ familyId: fam.id });
  }

  function handleTypeSelect(type: ElementType) {
    const store = useWorkbenchStore.getState();
    // Resolve the parent family and category for context
    const fam = allFamilies.find((f) => f.id === type.familyId);
    const cat = fam ? allCategories.find((c) => c.id === fam.categoryId) : null;

    store.setPalette({
      categoryId: cat?.id ?? palette.categoryId,
      familyId: fam?.id ?? palette.familyId,
      typeId: type.id,
      assemblyId: type.assemblyId ?? null,
    });

    // Auto-activate the matching tool if none is active
    if (!activeTool && cat) {
      const toolForCat = CATEGORY_TOOL_MAP[cat.code];
      if (toolForCat) store.setActiveTool(toolForCat);
    }
  }

  function handleClearType() {
    useWorkbenchStore.getState().setPalette({
      typeId: null,
      assemblyId: null,
    });
  }

  // ── Save handler ───────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (saveStatus === "saving") return;
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    const store = useWorkbenchStore.getState();
    const entities = useSceneStore.getState().placedEntities;
    try {
      const result = await saveProjectScene(projectId, {
        version: 1,
        projectId,
        palette: store.palette,
        activeTool: store.activeTool,
        entities,
      });
      store.setSavedAt(result.savedAt);
      setSaveStatus("saved");
      saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 4000);
    }
  }, [projectId, saveStatus]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[calc(100vh-280px)] flex-col">
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <header className="flex h-11 shrink-0 items-center gap-0 border-b border-slate-200 bg-white px-3">
        {/* Back */}
        <Link
          href="/company/bim-design"
          className="mr-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BIM Design
        </Link>

        <div className="mr-3 h-5 w-px bg-slate-200" />

        {/* Tool groups */}
        {(["nav", "place", "utility"] as const).map((group, gi) => (
          <div key={group} className="flex items-center">
            {gi > 0 && <div className="mx-2 h-5 w-px bg-slate-200" />}
            <div className="flex items-center gap-0.5 rounded-lg bg-slate-50 p-0.5">
              {TOOL_DEFS.filter((t) => t.group === group).map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool.id)}
                    title={tool.label}
                    className={[
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition",
                      isActive
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm",
                    ].join(" ")}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mx-3 h-5 w-px bg-slate-200" />

        {/* Active type chip */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {activeType ? (
            <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1">
              <span className="text-[10px] font-black uppercase tracking-wide text-teal-600">
                Active
              </span>
              <span className="text-xs font-bold text-teal-800">
                {activeType.name}
              </span>
              <code className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
                {activeType.code}
              </code>
              {activeType.nominalThickness != null && (
                <span className="text-[10px] text-teal-600">
                  {activeType.nominalThickness}mm
                </span>
              )}
              <button
                onClick={handleClearType}
                className="rounded p-0.5 text-teal-400 hover:text-teal-700"
                title="Clear active type"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              No element type selected — choose from the palette
            </span>
          )}
        </div>

        {/* Save status + Save button */}
        <div className="ml-3 flex shrink-0 items-center gap-2">
          {/* Dirty / saved indicator */}
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-[10px] text-teal-600">
              <CheckCircle2 className="h-3 w-3" />
              Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-[10px] font-semibold text-red-500">
              Save failed
            </span>
          )}
          {saveStatus === "idle" && isDirty && (
            <span className="text-[10px] text-amber-600">Unsaved changes</span>
          )}
          {saveStatus === "idle" && !isDirty && savedAt && (
            <span className="text-[10px] text-slate-400">
              Saved {new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saveStatus === "saving" || (!isDirty && saveStatus === "idle")}
            className={[
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition",
              isDirty || saveStatus === "error"
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "border border-slate-200 bg-slate-50 text-slate-400 cursor-default",
            ].join(" ")}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>

          {/* Save Draft — same payload as Save; separate entry point for future draft flow */}
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            Draft
          </button>
        </div>

        {/* Project badge */}
        <div className="ml-2 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Project: {projectId}
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* ── Authoring Palette panel ────────────────────────────────────── */}
        <aside className="flex w-64 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-50/60">
          <div className="shrink-0 border-b border-slate-200 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Authoring Palette
            </p>
          </div>

          {/* Active type banner */}
          {activeType && (
            <div className="shrink-0 border-b border-teal-200 bg-teal-50 px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-wide text-teal-600">
                Active Element Type
              </p>
              <p className="mt-0.5 text-sm font-black text-teal-900 leading-tight">
                {activeType.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
                  {activeType.code}
                </code>
                {activeCat && (
                  <span className="text-[10px] text-teal-600">
                    {activeCat.name}
                  </span>
                )}
                {activeType.nominalThickness != null && (
                  <span className="text-[10px] text-teal-600">
                    {activeType.nominalThickness}mm
                  </span>
                )}
              </div>
              <button
                onClick={handleClearType}
                className="mt-2 text-[10px] font-semibold text-teal-500 hover:text-teal-700"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Category accordion */}
          <div className="flex-1 overflow-y-auto py-1">
            {allCategories
              .slice()
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((cat) => {
                const CatIcon = catIcon(cat.code);
                const families = familiesForCat(cat.id);
                const isCatOpen = expandedCategoryId === cat.id;
                const totalTypes = families.reduce(
                  (n, f) => n + typesForFamily(f.id).length,
                  0
                );

                return (
                  <div key={cat.id}>
                    {/* Category row */}
                    <button
                      onClick={() => handleCategoryClick(cat)}
                      className={[
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
                        isCatOpen
                          ? "bg-teal-50 font-semibold text-teal-800"
                          : "text-slate-600 hover:bg-white hover:text-slate-900",
                      ].join(" ")}
                    >
                      <CatIcon
                        className={[
                          "h-4 w-4 shrink-0",
                          isCatOpen ? "text-teal-600" : "text-slate-400",
                        ].join(" ")}
                      />
                      <span className="flex-1 truncate">{cat.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {totalTypes}
                      </span>
                      {families.length > 0 ? (
                        isCatOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        )
                      ) : null}
                    </button>

                    {/* Families within expanded category */}
                    {isCatOpen && families.length > 0 && (
                      <div className="border-l-2 border-teal-100 ml-5">
                        {families.map((fam) => {
                          const types = typesForFamily(fam.id);
                          const isFamOpen = expandedFamilyId === fam.id;

                          return (
                            <div key={fam.id}>
                              {/* Family row */}
                              <button
                                onClick={() => handleFamilyClick(fam)}
                                className={[
                                  "flex w-full items-center gap-2 py-1.5 pl-3 pr-3 text-left text-xs transition",
                                  isFamOpen
                                    ? "font-semibold text-slate-800"
                                    : "text-slate-500 hover:text-slate-800",
                                ].join(" ")}
                              >
                                <span className="flex-1 truncate">
                                  {fam.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {types.length}
                                </span>
                                {types.length > 0 ? (
                                  isFamOpen ? (
                                    <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
                                  )
                                ) : null}
                              </button>

                              {/* Types within expanded family */}
                              {isFamOpen && types.length > 0 && (
                                <div className="space-y-0.5 pb-1 pl-2 pr-2">
                                  {types.map((type) => {
                                    const isSelected =
                                      palette.typeId === type.id;
                                    return (
                                      <button
                                        key={type.id}
                                        onClick={() => handleTypeSelect(type)}
                                        className={[
                                          "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition",
                                          isSelected
                                            ? "border border-teal-300 bg-teal-50 ring-1 ring-teal-200"
                                            : "border border-transparent bg-white hover:border-slate-200 hover:shadow-sm",
                                        ].join(" ")}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <p
                                            className={[
                                              "truncate font-semibold leading-tight",
                                              isSelected
                                                ? "text-teal-900"
                                                : "text-slate-800",
                                            ].join(" ")}
                                          >
                                            {type.name}
                                          </p>
                                          <div className="mt-0.5 flex items-center gap-2">
                                            <code className="rounded bg-slate-100 px-1 text-[9px] font-bold text-slate-500">
                                              {type.code}
                                            </code>
                                            {type.nominalThickness != null && (
                                              <span className="text-[10px] text-slate-400">
                                                {type.nominalThickness}mm
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {isSelected && (
                                          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {isFamOpen && types.length === 0 && (
                                <p className="px-4 py-2 text-[10px] text-slate-400">
                                  No types in this family yet.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isCatOpen && families.length === 0 && (
                      <p className="px-5 py-2 text-[10px] text-slate-400">
                        No families in this category.
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </aside>

        {/* ── Canvas area — plan-mode authoring surface ─────────────────── */}
        <main className="relative flex-1 overflow-hidden">
          <EditorCanvas />
        </main>
      </div>

      {/* ── Status bar ────────────────────────────────────────────────────── */}
      <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-slate-200 bg-white px-4">
        <span className="text-[10px] text-slate-400">
          Project:{" "}
          <span className="font-semibold text-slate-600">{projectId}</span>
        </span>
        <span className="h-3 w-px bg-slate-200" />
        <span className="text-[10px] text-slate-400">
          Tool:{" "}
          <span
            className={
              activeTool
                ? "font-semibold text-teal-700"
                : "text-slate-400"
            }
          >
            {activeTool ?? "None"}
          </span>
        </span>
        <span className="h-3 w-px bg-slate-200" />
        <span className="text-[10px] text-slate-400">
          {activeType ? (
            <>
              Active:{" "}
              <span className="font-semibold text-slate-700">
                {activeType.name}
              </span>
              {activeType.nominalThickness != null && (
                <span className="text-slate-400">
                  {" "}
                  · {activeType.nominalThickness}mm
                </span>
              )}
            </>
          ) : (
            "No type selected"
          )}
        </span>
        <span className="ml-auto text-[10px] text-slate-300">
          BIM Editor · Phase 3C-3
        </span>
      </footer>
    </div>
  );
}
