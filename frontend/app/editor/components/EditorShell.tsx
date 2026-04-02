"use client";

import CommandBar    from "./panels/CommandBar";
import HierarchyPanel from "./panels/HierarchyPanel";
import PropertiesPanel from "./panels/PropertiesPanel";
import BottomPanel   from "./panels/BottomPanel";
import BimCanvas     from "./viewport/BimCanvas";

// ── Editor shell ──────────────────────────────────────────────────────────────
// Full-bleed layout:
//   [CommandBar h-11]
//   [Main: HierarchyPanel | BimCanvas | PropertiesPanel]  flex-1
//   [BottomPanel h-44]

interface Props {
  projectName?: string;
}

export default function EditorShell({ projectName }: Props) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#050302]">
      {/* Top bar */}
      <CommandBar projectName={projectName} />

      {/* Main work area */}
      <div className="flex min-h-0 flex-1">
        <HierarchyPanel />
        <div className="relative flex-1">
          <BimCanvas />
        </div>
        <PropertiesPanel />
      </div>

      {/* Bottom panel */}
      <BottomPanel />
    </div>
  );
}
