"use client";

import {
  ChevronDown,
  Grid2X2,
  Layers,
  Maximize2,
  MousePointer2,
  Move,
  PenLine,
  Redo2,
  Ruler,
  Save,
  Square,
  Undo2,
} from "lucide-react";
import { useWorkbenchStore } from "../../stores/workbenchStore";
import { useViewerStore } from "../../stores/viewerStore";
import { useHistoryStore } from "../../stores/historyStore";
import { useSceneStore, selectLevels } from "../../stores/sceneStore";
import { VIEW_MODE_LABELS, RENDER_MODE_LABELS, type ToolType, type ViewMode, type RenderMode } from "../../types/tools";

// ── Tool button ───────────────────────────────────────────────────────────────

function ToolBtn({
  tool,
  icon: Icon,
  label,
  active,
  phase,
}: {
  tool: ToolType;
  icon: React.FC<{ className?: string }>;
  label: string;
  active: boolean;
  phase: number;
}) {
  const { setActiveTool } = useWorkbenchStore();
  const disabled = phase > 3;
  return (
    <button
      type="button"
      title={`${label} (Phase ${phase})`}
      disabled={disabled}
      onClick={() => !disabled && setActiveTool(tool)}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-lg border transition",
        active
          ? "border-[#d4933c] bg-[#d4933c]/15 text-[#d4933c]"
          : disabled
          ? "border-transparent text-[#3a2410] cursor-not-allowed"
          : "border-transparent text-[#7a5e3e] hover:border-[#3a2410] hover:bg-[#1a1208] hover:text-[#c0956a]",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="mx-1.5 h-5 w-px bg-[#2b1e12]" />;
}

// ── CommandBar ────────────────────────────────────────────────────────────────

interface Props {
  projectName?: string;
}

export default function CommandBar({ projectName }: Props) {
  const activeTool     = useWorkbenchStore((s) => s.activeTool);
  const isSceneDirty   = useWorkbenchStore((s) => s.isSceneDirty);
  const statusMessage  = useWorkbenchStore((s) => s.statusMessage);

  const viewMode  = useViewerStore((s) => s.viewMode);
  const renderMode = useViewerStore((s) => s.renderMode);
  const showGrid  = useViewerStore((s) => s.showGrid);
  const showAxes  = useViewerStore((s) => s.showAxes);
  const { setViewMode, setRenderMode, toggleGrid, toggleAxes, activeLevelId, setActiveLevelId } = useViewerStore();

  const { canUndo, canRedo, undo, redo } = useHistoryStore();

  const entities = useSceneStore((s) => s.entities);
  const levels   = selectLevels(entities);

  return (
    <div className="flex h-11 flex-none items-center gap-1 border-b border-[#1e1610] bg-[#0d0a07] px-3">

      {/* Portal name */}
      <span className="mr-2 text-[10px] font-black uppercase tracking-widest text-[#3a2410]">
        BIM Editor
      </span>
      {projectName && (
        <>
          <span className="text-[#2b1e12]">/</span>
          <span className="ml-1.5 max-w-[120px] truncate text-xs font-semibold text-[#6b4820]">
            {projectName}
          </span>
        </>
      )}

      <Divider />

      {/* Tools */}
      <ToolBtn tool="SELECT"  icon={MousePointer2} label="Select"  active={activeTool === "SELECT"}  phase={3} />
      <ToolBtn tool="MOVE"    icon={Move}          label="Move"    active={activeTool === "MOVE"}    phase={4} />
      <ToolBtn tool="WALL"    icon={PenLine}       label="Wall"    active={activeTool === "WALL"}    phase={4} />
      <ToolBtn tool="SLAB"    icon={Square}        label="Slab"    active={activeTool === "SLAB"}    phase={4} />
      <ToolBtn tool="ZONE"    icon={Grid2X2}       label="Zone"    active={activeTool === "ZONE"}    phase={4} />
      <ToolBtn tool="MEASURE" icon={Ruler}         label="Measure" active={activeTool === "MEASURE"} phase={4} />

      <Divider />

      {/* View mode */}
      <div className="relative">
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as ViewMode)}
          className="h-7 cursor-pointer appearance-none rounded-lg border border-[#2b1e12] bg-[#110e0a] pl-2 pr-6 text-[10px] font-bold text-[#9a7d5e] focus:outline-none"
        >
          {(["STACKED", "EXPLODED", "SOLO"] as ViewMode[]).map((m) => (
            <option key={m} value={m}>{VIEW_MODE_LABELS[m]}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#5a3e22]" />
      </div>

      {/* Level selector (SOLO mode) */}
      {viewMode === "SOLO" && levels.length > 0 && (
        <div className="relative">
          <select
            value={activeLevelId ?? ""}
            onChange={(e) => setActiveLevelId(e.target.value || null)}
            className="h-7 cursor-pointer appearance-none rounded-lg border border-[#2b1e12] bg-[#110e0a] pl-2 pr-6 text-[10px] font-bold text-[#9a7d5e] focus:outline-none"
          >
            <option value="">All levels</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#5a3e22]" />
        </div>
      )}

      {/* Render mode */}
      <div className="relative">
        <select
          value={renderMode}
          onChange={(e) => setRenderMode(e.target.value as RenderMode)}
          className="h-7 cursor-pointer appearance-none rounded-lg border border-[#2b1e12] bg-[#110e0a] pl-2 pr-6 text-[10px] font-bold text-[#9a7d5e] focus:outline-none"
        >
          {(["SOLID", "WIREFRAME", "EDGES"] as RenderMode[]).map((m) => (
            <option key={m} value={m}>{RENDER_MODE_LABELS[m]}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#5a3e22]" />
      </div>

      <Divider />

      {/* Toggle grid / axes */}
      <button
        type="button"
        title="Toggle grid"
        onClick={toggleGrid}
        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${showGrid ? "border-[#4a2e10] bg-[#1a0f06] text-[#d4933c]" : "border-transparent text-[#4a2e10] hover:text-[#7a5e3e]"}`}
      >
        <Layers className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Toggle axes"
        onClick={toggleAxes}
        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${showAxes ? "border-[#4a2e10] bg-[#1a0f06] text-[#d4933c]" : "border-transparent text-[#4a2e10] hover:text-[#7a5e3e]"}`}
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>

      <Divider />

      {/* Status */}
      <span className="flex-1 truncate text-[9px] text-[#4a2e10]">{statusMessage}</span>

      {/* Undo / Redo */}
      <button
        type="button"
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        onClick={undo}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-[#4a2e10] transition hover:border-[#2b1e12] hover:text-[#7a5e3e] disabled:opacity-30"
      >
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Redo (Ctrl+Y)"
        disabled={!canRedo}
        onClick={redo}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-[#4a2e10] transition hover:border-[#2b1e12] hover:text-[#7a5e3e] disabled:opacity-30"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </button>

      <Divider />

      {/* Save */}
      <button
        type="button"
        className={[
          "flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-bold transition",
          isSceneDirty
            ? "border-[#d4933c] bg-[#d4933c]/10 text-[#d4933c] hover:bg-[#d4933c]/20"
            : "border-[#2b1e12] bg-transparent text-[#4a2e10] cursor-not-allowed",
        ].join(" ")}
        disabled={!isSceneDirty}
      >
        <Save className="h-3 w-3" />
        {isSceneDirty ? "Save*" : "Saved"}
      </button>
    </div>
  );
}
