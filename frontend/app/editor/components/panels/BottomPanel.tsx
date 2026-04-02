"use client";

import { Clock, Terminal, TriangleAlert } from "lucide-react";
import { useViewerStore } from "../../stores/viewerStore";
import { useHistoryStore, selectRecentEntries } from "../../stores/historyStore";
import { useWorkbenchStore } from "../../stores/workbenchStore";

// ── Tab button ────────────────────────────────────────────────────────────────

type PanelTab = "HISTORY" | "ISSUES" | "CONSOLE";

function TabBtn({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: PanelTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition",
        active
          ? "border-[#d4933c] text-[#e8c080]"
          : "border-transparent text-[#4a2e10] hover:text-[#7a5e3e]",
      ].join(" ")}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

// ── History tab ───────────────────────────────────────────────────────────────

function HistoryTab() {
  const entries = useHistoryStore((s) => s.entries);
  const cursor  = useHistoryStore((s) => s.cursor);
  const recent  = selectRecentEntries(entries, cursor, 30);

  if (recent.length === 0) {
    return (
      <p className="p-3 text-[10px] text-[#3a2410]">No history yet. Interact with the scene to log actions.</p>
    );
  }

  return (
    <div className="divide-y divide-[#180f08]">
      {recent.map((e) => (
        <div key={e.id} className="flex items-center gap-3 px-3 py-1">
          <span className="w-16 flex-none font-mono text-[9px] text-[#3a2410]">
            {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <span className="rounded bg-[#1a1208] px-1.5 py-0.5 font-mono text-[9px] text-[#5a3e22]">
            {e.type}
          </span>
          <span className="min-w-0 flex-1 truncate text-[10px] text-[#8a6e4e]">
            {e.description}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Issues tab ────────────────────────────────────────────────────────────────

function IssuesTab() {
  return (
    <div className="flex items-center gap-2 p-3">
      <TriangleAlert className="h-3.5 w-3.5 text-[#3a2410]" />
      <p className="text-[10px] text-[#3a2410]">
        Clash detection and model issues will appear here in Phase 5.
      </p>
    </div>
  );
}

// ── Console tab ───────────────────────────────────────────────────────────────

function ConsoleTab() {
  const statusMessage = useWorkbenchStore((s) => s.statusMessage);

  return (
    <div className="p-3 font-mono text-[10px] text-[#5a3e22]">
      <span className="text-[#3a2410]">&gt;</span>{" "}
      {statusMessage || "Ready."}
    </div>
  );
}

// ── Bottom panel ──────────────────────────────────────────────────────────────

export default function BottomPanel() {
  const bottomPanelTab = useViewerStore((s) => s.bottomPanelTab) as PanelTab;
  const { setBottomPanelTab } = useViewerStore();

  return (
    <div className="flex h-44 flex-none flex-col border-t border-[#1e1610] bg-[#0d0a07]">
      {/* Tab bar */}
      <div className="flex flex-none items-center border-b border-[#1a1208] px-2">
        <TabBtn id="HISTORY" label="History" icon={Clock}         active={bottomPanelTab === "HISTORY"} onClick={() => setBottomPanelTab("HISTORY")} />
        <TabBtn id="ISSUES"  label="Issues"  icon={TriangleAlert} active={bottomPanelTab === "ISSUES"}  onClick={() => setBottomPanelTab("ISSUES")} />
        <TabBtn id="CONSOLE" label="Console" icon={Terminal}      active={bottomPanelTab === "CONSOLE"} onClick={() => setBottomPanelTab("CONSOLE")} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {bottomPanelTab === "HISTORY" && <HistoryTab />}
        {bottomPanelTab === "ISSUES"  && <IssuesTab />}
        {bottomPanelTab === "CONSOLE" && <ConsoleTab />}
      </div>
    </div>
  );
}
