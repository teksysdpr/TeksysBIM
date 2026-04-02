"use client";

import { useState } from "react";
import {
  Box,
  Building2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FolderOpen,
  Layers,
  MapPin,
} from "lucide-react";
import { useSceneStore } from "../../stores/sceneStore";
import { useWorkbenchStore } from "../../stores/workbenchStore";
import type { BimEntity, EntityType } from "../../types/model";

// ── Icon per type ─────────────────────────────────────────────────────────────

const TYPE_ICON: Record<EntityType, React.FC<{ className?: string }>> = {
  PROJECT:  FolderOpen,
  SITE:     MapPin,
  BUILDING: Building2,
  LEVEL:    Layers,
  ZONE:     FolderOpen,
  ELEMENT:  Box,
};

const TYPE_COLOR: Record<EntityType, string> = {
  PROJECT:  "text-[#d4933c]",
  SITE:     "text-[#fbbf24]",
  BUILDING: "text-[#60a5fa]",
  LEVEL:    "text-[#34d399]",
  ZONE:     "text-[#a78bfa]",
  ELEMENT:  "text-[#9ca3af]",
};

// ── Tree node ─────────────────────────────────────────────────────────────────

function TreeNode({ id, depth = 0 }: { id: string; depth?: number }) {
  const entities  = useSceneStore((s) => s.entities);
  const { setVisibility } = useSceneStore();
  const { selectedIds, setSelection, toggleSelection } = useWorkbenchStore();

  const [expanded, setExpanded] = useState(depth < 3);

  const entity = entities[id];
  if (!entity) return null;

  const hasChildren = entity.childIds.length > 0;
  const isSelected  = selectedIds.includes(id);
  const Icon        = TYPE_ICON[entity.type] ?? Box;
  const iconColor   = TYPE_COLOR[entity.type] ?? "text-[#9ca3af]";

  function handleClick(e: React.MouseEvent) {
    if (e.shiftKey) {
      toggleSelection(id);
    } else {
      setSelection([id]);
    }
  }

  return (
    <div>
      <div
        className={[
          "group flex cursor-pointer items-center gap-1 rounded-lg py-0.5 pr-2 transition",
          isSelected
            ? "bg-[#d4933c]/10 text-[#e8c080]"
            : "text-[#8a6e4e] hover:bg-[#1a1208] hover:text-[#c0956a]",
        ].join(" ")}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={handleClick}
      >
        {/* Expand toggle */}
        <button
          type="button"
          className="flex h-4 w-4 flex-none items-center justify-center"
          onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}
        >
          {hasChildren
            ? expanded
              ? <ChevronDown className="h-3 w-3" />
              : <ChevronRight className="h-3 w-3" />
            : <span className="h-3 w-3" />}
        </button>

        {/* Entity icon */}
        <Icon className={`h-3.5 w-3.5 flex-none ${isSelected ? "text-[#d4933c]" : iconColor}`} />

        {/* Name */}
        <span className="min-w-0 flex-1 truncate text-xs">{entity.name}</span>

        {/* Visibility toggle — only on hover */}
        <button
          type="button"
          className="ml-auto h-4 w-4 flex-none opacity-0 transition group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); setVisibility(id, !entity.visible); }}
          title={entity.visible ? "Hide" : "Show"}
        >
          {entity.visible
            ? <Eye className="h-3 w-3" />
            : <EyeOff className="h-3 w-3 text-[#5a3e22]" />}
        </button>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {entity.childIds.map((cid) => (
            <TreeNode key={cid} id={cid} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hierarchy panel ───────────────────────────────────────────────────────────

export default function HierarchyPanel() {
  const { rootIds, entities } = useSceneStore();
  const selectedIds = useWorkbenchStore((s) => s.selectedIds);

  const totalEntities = Object.keys(entities).length;

  return (
    <div className="flex h-full w-60 flex-none flex-col border-r border-[#1e1610] bg-[#0d0a07]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e1610] px-3 py-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-[#4a2e10]">
          Scene Hierarchy
        </p>
        <span className="rounded bg-[#1a1208] px-1.5 py-0.5 font-mono text-[9px] text-[#5a3e22]">
          {totalEntities}
        </span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-1">
        {rootIds.length === 0 ? (
          <p className="p-3 text-[10px] text-[#3a2410]">No scene loaded</p>
        ) : (
          rootIds.map((id) => <TreeNode key={id} id={id} depth={0} />)
        )}
      </div>

      {/* Selection summary */}
      {selectedIds.length > 0 && (
        <div className="border-t border-[#1e1610] px-3 py-1.5">
          <p className="text-[9px] text-[#5a3e22]">
            {selectedIds.length} selected
          </p>
        </div>
      )}
    </div>
  );
}
