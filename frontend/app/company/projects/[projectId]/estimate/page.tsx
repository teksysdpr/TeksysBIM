"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  GitCompare,
  IndianRupee,
  Layers,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import {
  type BoqLineItem,
  type ComparisonLine,
  type CreateEstimateResult,
  type EstimateAuditEvent,
  type EstimateComparison,
  type EstimateRevision,
  type EstimateSummary,
  AUDIT_ACTION_COLORS,
  AUDIT_ACTION_LABELS,
  CHANGE_TYPE_COLORS,
  CHANGE_TYPE_LABELS,
  CHANGE_TYPE_ROW_BG,
  ESTIMATE_STATUS_COLORS,
  ESTIMATE_STATUS_LABELS,
  createEstimate,
  fetchBoqLineItems,
  fetchEstimateComparison,
  fetchEstimateHistory,
  fetchEstimateSummary,
  fetchEstimates,
  updateEstimateStatus,
} from "@/app/services/costingService";
import {
  DISCIPLINE_BG,
  DISCIPLINE_COLORS,
  DISCIPLINE_LABELS,
  ELEMENT_TYPE_LABELS,
  fetchTakeoffRevisions,
} from "@/app/services/takeoffService";
import {
  BimPageHeader,
  BimPanel,
  BimButton,
  BimStateBox,
} from "@/app/components/company/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

type ActiveTab      = "boq" | "compare" | "history";
type CompareFilter  = "all" | "changed" | "added" | "removed" | "unchanged";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}

function fmtQty(qty: number): string {
  return qty % 1 === 0 ? qty.toString() : qty.toFixed(2);
}

function fmtRate(rate: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(rate);
}

function fmtDelta(val: number | null, type: "amount" | "rate" | "qty"): string {
  if (val === null) return "—";
  if (val === 0)   return "0";
  const sign = val > 0 ? "+" : "";
  if (type === "amount") return sign + fmtINR(val);
  if (type === "rate")   return sign + fmtRate(val);
  return sign + fmtQty(val);
}

function deltaAmountColor(val: number | null): string {
  if (!val) return "text-[#8a6e4e]";
  return val > 0 ? "text-red-400" : "text-[#34d399]";
}

function deltaRateColor(val: number | null): string {
  if (!val) return "text-[#8a6e4e]";
  return val > 0 ? "text-red-400" : "text-[#34d399]";
}

function groupByDiscipline(lines: BoqLineItem[]): Map<string, BoqLineItem[]> {
  const map = new Map<string, BoqLineItem[]>();
  for (const line of lines) {
    const arr = map.get(line.discipline);
    if (arr) arr.push(line); else map.set(line.discipline, [line]);
  }
  return map;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EstimateStatusBadge({ status }: { status: EstimateRevision["status"] }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-current/20 ${ESTIMATE_STATUS_COLORS[status]}`}>
      {ESTIMATE_STATUS_LABELS[status]}
    </span>
  );
}

function SummaryCard({
  icon: Icon, label, value, sub, highlight = false,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-[#34d399]/30 bg-[#34d399]/10" : "border-[#2b1e12] bg-[#110e0a]"}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${highlight ? "text-[#34d399]" : "text-[#8a6e4e]"}`} />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#8a6e4e]">{label}</span>
      </div>
      <p className={`mt-2 text-lg font-black ${highlight ? "text-[#34d399]" : "text-[#f0e6d4]"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-[#8a6e4e]">{sub}</p>}
    </div>
  );
}

function DeltaCard({
  label, delta, currency = false,
}: {
  label: string;
  delta: number;
  currency?: boolean;
}) {
  const color = delta === 0 ? "text-[#8a6e4e]" : delta > 0 ? "text-red-400" : "text-[#34d399]";
  const sign  = delta > 0 ? "+" : "";
  const value = currency ? sign + fmtINR(delta) : `${sign}${delta}`;
  return (
    <div className="rounded-2xl border border-[#2b1e12] bg-[#110e0a] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#8a6e4e]">{label}</p>
      <p className={`mt-2 text-lg font-black ${color}`}>{value}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EstimatePage() {
  const { projectId } = useParams<{ projectId: string }>();

  // ── BOQ state ──────────────────────────────────────────────────────────────
  const [estimates, setEstimates]               = useState<EstimateRevision[]>([]);
  const [selectedEstId, setSelectedEstId]       = useState<string>("");
  const [lines, setLines]                       = useState<BoqLineItem[]>([]);
  const [summary, setSummary]                   = useState<EstimateSummary | null>(null);
  const [loadingEstimates, setLoadingEstimates] = useState(true);
  const [loadingLines, setLoadingLines]         = useState(false);
  const [creating, setCreating]                 = useState(false);
  const [expandedGroups, setExpandedGroups]     = useState<Set<string>>(new Set());
  const [createResult, setCreateResult]         = useState<CreateEstimateResult | null>(null);
  const [error, setError]                       = useState<string | null>(null);

  // ── Tab + compare + history state ──────────────────────────────────────────
  const [activeTab, setActiveTab]               = useState<ActiveTab>("boq");
  const [compareAgainstId, setCompareAgainstId] = useState<string>("");
  const [comparison, setComparison]             = useState<EstimateComparison | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [compareFilter, setCompareFilter]       = useState<CompareFilter>("all");
  const [history, setHistory]                   = useState<EstimateAuditEvent[]>([]);
  const [loadingHistory, setLoadingHistory]     = useState(false);
  const [showExportMenu, setShowExportMenu]     = useState(false);

  // ── Load estimates on mount ────────────────────────────────────────────────
  useEffect(() => {
    setLoadingEstimates(true);
    fetchEstimates(projectId)
      .then((data) => {
        setEstimates(data);
        if (data.length > 0) setSelectedEstId(data[0].id);
        if (data.length > 1) setCompareAgainstId(data[1].id);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load estimates"))
      .finally(() => setLoadingEstimates(false));
  }, [projectId]);

  // ── When selected estimate changes, update compare target ─────────────────
  useEffect(() => {
    if (estimates.length < 2) return;
    const others = estimates.filter((e) => e.id !== selectedEstId);
    if (others.length > 0 && !compareAgainstId) setCompareAgainstId(others[0].id);
  }, [selectedEstId, estimates, compareAgainstId]);

  // ── Load BOQ lines + summary when selected estimate changes ───────────────
  useEffect(() => {
    if (!selectedEstId) { setLines([]); setSummary(null); return; }
    setLoadingLines(true);
    setError(null);
    Promise.all([fetchBoqLineItems(selectedEstId), fetchEstimateSummary(selectedEstId)])
      .then(([linesData, summaryData]) => {
        setLines(linesData);
        setSummary(summaryData);
        setExpandedGroups(new Set(linesData.map((l) => l.discipline)));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load estimate"))
      .finally(() => setLoadingLines(false));
  }, [selectedEstId]);

  // ── Load comparison when compare tab active and both selectors set ─────────
  useEffect(() => {
    if (activeTab !== "compare") return;
    if (!selectedEstId || !compareAgainstId || selectedEstId === compareAgainstId) return;
    setLoadingComparison(true);
    setComparison(null);
    fetchEstimateComparison(selectedEstId, compareAgainstId)
      .then(setComparison)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load comparison"))
      .finally(() => setLoadingComparison(false));
  }, [activeTab, selectedEstId, compareAgainstId]);

  // ── Load history when history tab active ──────────────────────────────────
  useEffect(() => {
    if (activeTab !== "history" || !selectedEstId) return;
    setLoadingHistory(true);
    setHistory([]);
    fetchEstimateHistory(selectedEstId)
      .then(setHistory)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load history"))
      .finally(() => setLoadingHistory(false));
  }, [activeTab, selectedEstId]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const grouped    = useMemo(() => groupByDiscipline(lines), [lines]);
  const selectedEst = useMemo(() => estimates.find((e) => e.id === selectedEstId), [estimates, selectedEstId]);

  const filteredComparisonLines = useMemo(() => {
    if (!comparison) return [];
    if (compareFilter === "all") return comparison.lines;
    return comparison.lines.filter((l) => l.changeType === compareFilter);
  }, [comparison, compareFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    setCreateResult(null);
    try {
      const takeoffRevs = await fetchTakeoffRevisions(projectId);
      const issued = takeoffRevs.filter((r) => r.status === "issued");
      if (issued.length === 0) {
        setError("No issued takeoff revision found. Please issue a takeoff revision first.");
        return;
      }
      const result = await createEstimate({ projectId, takeoffRevisionId: issued[0].id, createdBy: "BIM Manager" });
      setCreateResult(result);
      const updated = await fetchEstimates(projectId);
      setEstimates(updated);
      setSelectedEstId(result.estimate.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create estimate");
    } finally {
      setCreating(false);
    }
  }, [projectId, creating]);

  const handleStatusTransition = useCallback(async (newStatus: EstimateRevision["status"]) => {
    if (!selectedEstId) return;
    try {
      const updated = await updateEstimateStatus(selectedEstId, newStatus);
      setEstimates((prev) => prev.map((e) => (e.id === selectedEstId ? updated : e)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Status update failed");
    }
  }, [selectedEstId]);

  const handleExportBOQ = useCallback(() => {
    if (!lines.length) return;
    const header = "Discipline,Level,Zone,Element Type,Description,Unit,Quantity,Rate/Unit (INR),Amount (INR)\n";
    const rows = lines.map((l) =>
      [l.discipline, l.level, l.zone, ELEMENT_TYPE_LABELS[l.elementType] ?? l.elementType,
       `"${l.description.replace(/"/g, '""')}"`, l.unit, l.quantity, l.ratePerUnit, l.amount].join(",")
    );
    downloadCSV(header + rows.join("\n"), `BOQ-${selectedEst?.label ?? selectedEstId}`);
  }, [lines, selectedEst, selectedEstId]);

  const handleExportSummary = useCallback(() => {
    if (!summary) return;
    const rows = [
      `"${selectedEst?.label ?? ""}",,`,
      `Item,Amount (INR),`,
      `Subtotal,${summary.subtotal},`,
      `Contingency (${summary.contingencyPct}%),${summary.contingency},`,
      `Overhead (${summary.overheadPct}%),${summary.overhead},`,
      `Profit (${summary.profitPct}%),${summary.profit},`,
      `Grand Total,${summary.grandTotal},`,
      ``,
      `Discipline,Lines,Amount (INR)`,
      ...Object.entries(summary.byDiscipline).map(
        ([d, s]) => `${DISCIPLINE_LABELS[d] ?? d},${s.lineCount},${s.amount}`
      ),
    ];
    downloadCSV(rows.join("\n"), `Summary-${selectedEst?.label ?? selectedEstId}`);
  }, [summary, selectedEst, selectedEstId]);

  const handleExportComparison = useCallback(() => {
    if (!comparison) return;
    const header = "Change,Description,Level,Zone,Unit,Base Qty,Cmp Qty,Qty Δ,Base Rate,Cmp Rate,Rate Δ,Base Amt (INR),Cmp Amt (INR),Amt Δ (INR)\n";
    const rows = comparison.lines.map((l) =>
      [
        CHANGE_TYPE_LABELS[l.changeType],
        `"${l.description.replace(/"/g, '""')}"`,
        l.level, l.zone, l.unit,
        l.baseQty ?? "—",    l.compareQty ?? "—",    l.qtyDelta    ?? "—",
        l.baseRate ?? "—",   l.compareRate ?? "—",   l.rateDelta   ?? "—",
        l.baseAmount ?? "—", l.compareAmount ?? "—", l.amountDelta ?? "—",
      ].join(",")
    );
    downloadCSV(header + rows.join("\n"), `Compare-${comparison.baseLabel}-vs-${comparison.compareLabel}`);
  }, [comparison]);

  const toggleGroup = useCallback((disc: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(disc)) next.delete(disc); else next.add(disc);
      return next;
    });
  }, []);

  // ── Render helpers ─────────────────────────────────────────────────────────

  function downloadCSV(content: string, name: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── BOQ Tab ────────────────────────────────────────────────────────────────

  function renderBOQTab() {
    if (loadingLines) return <BimStateBox type="loading" message="Loading BOQ lines…" />;
    if (!summary || !lines.length) return null;
    return (
      <div className="space-y-5">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard icon={IndianRupee} label="Subtotal"                             value={fmtINR(summary.subtotal)} />
          <SummaryCard icon={Calculator}  label={`Contingency ${summary.contingencyPct}%`} value={fmtINR(summary.contingency)} />
          <SummaryCard icon={Calculator}  label={`Overhead ${summary.overheadPct}%`}  value={fmtINR(summary.overhead)} />
          <SummaryCard icon={Calculator}  label={`Profit ${summary.profitPct}%`}      value={fmtINR(summary.profit)} />
          <SummaryCard icon={IndianRupee} label="Grand Total"                          value={fmtINR(summary.grandTotal)} highlight />
        </div>

        {/* Discipline cards */}
        {Object.keys(summary.byDiscipline).length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(summary.byDiscipline).map(([disc, stat]) => (
              <div key={disc} className={`rounded-2xl border p-4 ${DISCIPLINE_BG[disc] ?? "border-[#2b1e12] bg-[#110e0a]"}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${DISCIPLINE_COLORS[disc] ?? "text-[#8a6e4e]"}`}>
                  {DISCIPLINE_LABELS[disc] ?? disc}
                </p>
                <p className="mt-2 text-xl font-black text-[#f0e6d4]">{fmtINR(stat.amount)}</p>
                <p className="mt-0.5 text-xs text-[#8a6e4e]">{stat.lineCount} BOQ line{stat.lineCount !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        )}

        {/* BOQ table */}
        <div className="overflow-x-auto rounded-2xl border border-[#2b1e12]">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="border-b border-[#2b1e12] bg-[#110e0a]">
                {["Description", "Level / Zone", "Unit", "Qty", "Rate (INR)", "Amount (INR)"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 font-black uppercase tracking-widest text-[#8a6e4e] ${i === 0 ? "text-left" : i === 1 ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(grouped.entries()).map(([disc, discLines]) => {
                const isExpanded = expandedGroups.has(disc);
                const discTotal  = discLines.reduce((s, l) => s + l.amount, 0);
                return (
                  <Fragment key={disc}>
                    <tr onClick={() => toggleGroup(disc)} className="cursor-pointer border-b border-[#2b1e12] bg-[#0f0905] transition hover:bg-[#160f08]">
                      <td colSpan={5} className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-[#8a6e4e]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#8a6e4e]" />}
                          <span className={`text-[10px] font-black uppercase tracking-widest ${DISCIPLINE_COLORS[disc] ?? "text-[#8a6e4e]"}`}>{DISCIPLINE_LABELS[disc] ?? disc}</span>
                          <span className="text-[10px] text-[#8a6e4e]">({discLines.length} item{discLines.length !== 1 ? "s" : ""})</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-[#34d399]">{fmtINR(discTotal)}</td>
                    </tr>
                    {isExpanded && discLines.map((line) => (
                      <tr key={line.id} className="border-b border-[#2b1e12] bg-[#0f0905] transition hover:bg-[#160f08]">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-[#f0e6d4]">{line.description}</p>
                          <p className="mt-0.5 text-[10px] text-[#8a6e4e]">{ELEMENT_TYPE_LABELS[line.elementType] ?? line.elementType}</p>
                        </td>
                        <td className="px-3 py-2.5 text-[#8a6e4e]">{line.level} / {line.zone}</td>
                        <td className="px-3 py-2.5 text-right text-[#8a6e4e]">{line.unit}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-[#f0e6d4]">{fmtQty(line.quantity)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-[#d4933c]">{fmtRate(line.ratePerUnit)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-[#f0e6d4]">{fmtINR(line.amount)}</td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#2b1e12] bg-[#110e0a]">
                <td colSpan={5} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#8a6e4e]">Subtotal</td>
                <td className="px-4 py-3 text-right font-mono font-black text-[#f0e6d4]">{fmtINR(summary.subtotal)}</td>
              </tr>
              {[
                [`Contingency (${summary.contingencyPct}%)`, summary.contingency],
                [`Overhead (${summary.overheadPct}%)`, summary.overhead],
                [`Profit (${summary.profitPct}%)`, summary.profit],
              ].map(([label, val]) => (
                <tr key={String(label)} className="border-t border-[#2b1e12] bg-[#0f0905]">
                  <td colSpan={5} className="px-4 py-2.5 text-xs text-[#8a6e4e]">{String(label)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#8a6e4e]">{fmtINR(Number(val))}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#6b3e14] bg-[#110e0a]">
                <td colSpan={5} className="px-4 py-3 text-sm font-black uppercase tracking-widest text-[#f0e6d4]">Grand Total</td>
                <td className="px-4 py-3 text-right font-mono text-lg font-black text-[#34d399]">{fmtINR(summary.grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  // ── Compare Tab ────────────────────────────────────────────────────────────

  function renderCompareTab() {
    const otherEstimates = estimates.filter((e) => e.id !== selectedEstId);

    return (
      <div className="space-y-5">
        {/* Selector row */}
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-[#2b1e12] bg-[#110e0a] px-4 py-3">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8a6e4e]">Base</p>
            <p className="text-xs font-bold text-[#f0e6d4]">{selectedEst?.label ?? "—"}</p>
          </div>
          <GitCompare className="h-4 w-4 shrink-0 text-[#8a6e4e]" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8a6e4e]">Compare Against</p>
            {otherEstimates.length > 0 ? (
              <select
                value={compareAgainstId}
                onChange={(e) => setCompareAgainstId(e.target.value)}
                className="rounded-xl border border-[#2b1e12] bg-[#0f0905] px-3 py-1.5 text-xs font-bold text-[#f0e6d4] focus:outline-none focus:ring-1 focus:ring-[#6b3e14]"
              >
                {otherEstimates.map((e) => (
                  <option key={e.id} value={e.id}>{e.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-[#8a6e4e]">No other estimates available</p>
            )}
          </div>
        </div>

        {/* Loading */}
        {loadingComparison && <BimStateBox type="loading" message="Loading comparison…" />}

        {/* Empty — no other estimate */}
        {!loadingComparison && otherEstimates.length === 0 && (
          <BimPanel className="py-8 text-center">
            <p className="text-sm font-bold text-[#f0e6d4]">No estimates to compare</p>
            <p className="mt-1 text-xs text-[#8a6e4e]">Create a second estimate revision to enable comparison.</p>
          </BimPanel>
        )}

        {/* Comparison results */}
        {!loadingComparison && comparison && (
          <div className="space-y-5">
            {/* Delta summary cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <DeltaCard label="Grand Total Δ" delta={comparison.grandTotalDelta} currency />
              <DeltaCard label="Subtotal Δ"    delta={comparison.subtotalDelta}   currency />
              <DeltaCard label="Changed Lines" delta={comparison.changedCount} />
              <DeltaCard label="Added Lines"   delta={comparison.addedCount} />
              <DeltaCard label="Removed Lines" delta={comparison.removedCount} />
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              {(["all", "changed", "added", "removed", "unchanged"] as CompareFilter[]).map((f) => {
                const count = f === "all"
                  ? comparison.lines.length
                  : f === "changed"   ? comparison.changedCount
                  : f === "added"     ? comparison.addedCount
                  : f === "removed"   ? comparison.removedCount
                  : comparison.unchangedCount;
                return (
                  <button
                    key={f}
                    onClick={() => setCompareFilter(f)}
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition ${
                      compareFilter === f
                        ? "bg-[#5a3e22] text-[#f0e6d4]"
                        : "border border-[#2b1e12] text-[#8a6e4e] hover:border-[#6b3e14]"
                    }`}
                  >
                    {f === "all" ? "All" : CHANGE_TYPE_LABELS[f]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Comparison table */}
            <BimPanel noPad className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-xs">
                <thead>
                  <tr className="border-b border-[#2b1e12] bg-[#110e0a]">
                    <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-[#8a6e4e]">Description</th>
                    <th className="px-3 py-3 text-left font-black uppercase tracking-widest text-[#8a6e4e]">Level / Zone</th>
                    <th className="px-2 py-3 text-right font-black uppercase tracking-widest text-[#8a6e4e]">Unit</th>
                    <th className="px-2 py-3 text-right font-black uppercase tracking-widest text-[#8a6e4e]">Base Qty</th>
                    <th className="px-2 py-3 text-right font-black uppercase tracking-widest text-[#8a6e4e]">Cmp Qty</th>
                    <th className="px-2 py-3 text-right font-black uppercase tracking-widest text-[#8a6e4e]">Qty Δ</th>
                    <th className="px-2 py-3 text-right font-black uppercase tracking-widest text-[#8a6e4e]">Base Rate</th>
                    <th className="px-2 py-3 text-right font-black uppercase tracking-widest text-[#8a6e4e]">Cmp Rate</th>
                    <th className="px-2 py-3 text-right font-black uppercase tracking-widest text-[#8a6e4e]">Rate Δ</th>
                    <th className="px-2 py-3 text-right font-black uppercase tracking-widest text-[#8a6e4e]">Base Amt</th>
                    <th className="px-2 py-3 text-right font-black uppercase tracking-widest text-[#8a6e4e]">Cmp Amt</th>
                    <th className="px-3 py-3 text-right font-black uppercase tracking-widest text-[#8a6e4e]">Amt Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComparisonLines.map((line) => renderComparisonRow(line))}
                </tbody>
              </table>
              {filteredComparisonLines.length === 0 && (
                <p className="py-8 text-center text-xs text-[#8a6e4e]">No lines match the current filter.</p>
              )}
            </BimPanel>
          </div>
        )}
      </div>
    );
  }

  function renderComparisonRow(line: ComparisonLine) {
    const rowBg = CHANGE_TYPE_ROW_BG[line.changeType];
    return (
      <tr key={line.quantityRecordId} className={`border-b ${rowBg} transition`}>
        <td className="px-4 py-2.5">
          <p className="font-medium text-[#f0e6d4]">{line.description}</p>
          <span className={`text-[10px] font-black uppercase tracking-widest ${CHANGE_TYPE_COLORS[line.changeType]}`}>
            {CHANGE_TYPE_LABELS[line.changeType]}
          </span>
        </td>
        <td className="px-3 py-2.5 text-[#8a6e4e]">{line.level} / {line.zone}</td>
        <td className="px-2 py-2.5 text-right text-[#8a6e4e]">{line.unit}</td>
        {/* Qty columns */}
        <td className="px-2 py-2.5 text-right font-mono text-[#8a6e4e]">{line.baseQty    != null ? fmtQty(line.baseQty)    : "—"}</td>
        <td className="px-2 py-2.5 text-right font-mono text-[#f0e6d4]">{line.compareQty != null ? fmtQty(line.compareQty) : "—"}</td>
        <td className={`px-2 py-2.5 text-right font-mono font-bold ${line.qtyDelta !== 0 ? "text-[#d4933c]" : "text-[#8a6e4e]"}`}>
          {fmtDelta(line.qtyDelta, "qty")}
        </td>
        {/* Rate columns */}
        <td className="px-2 py-2.5 text-right font-mono text-[#8a6e4e]">{line.baseRate    != null ? fmtRate(line.baseRate)    : "—"}</td>
        <td className="px-2 py-2.5 text-right font-mono text-[#f0e6d4]">{line.compareRate != null ? fmtRate(line.compareRate) : "—"}</td>
        <td className={`px-2 py-2.5 text-right font-mono font-bold ${deltaRateColor(line.rateDelta)}`}>
          {fmtDelta(line.rateDelta, "rate")}
        </td>
        {/* Amount columns */}
        <td className="px-2 py-2.5 text-right font-mono text-[#8a6e4e]">{line.baseAmount    != null ? fmtINR(line.baseAmount)    : "—"}</td>
        <td className="px-2 py-2.5 text-right font-mono text-[#f0e6d4]">{line.compareAmount != null ? fmtINR(line.compareAmount) : "—"}</td>
        <td className={`px-3 py-2.5 text-right font-mono font-bold ${deltaAmountColor(line.amountDelta)}`}>
          {fmtDelta(line.amountDelta, "amount")}
        </td>
      </tr>
    );
  }

  // ── History Tab ────────────────────────────────────────────────────────────

  function renderHistoryTab() {
    if (loadingHistory) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#8a6e4e]" /></div>;
    if (!history.length) return (
      <div className="rounded-2xl border border-[#2b1e12] bg-[#110e0a] py-12 text-center">
        <Clock className="mx-auto h-8 w-8 text-[#8a6e4e]" />
        <p className="mt-3 text-sm font-bold text-[#f0e6d4]">No history recorded</p>
        <p className="mt-1 text-xs text-[#8a6e4e]">Audit events will appear here as the estimate is updated.</p>
      </div>
    );
    return (
      <div className="space-y-2">
        {history.map((evt) => (
          <div key={evt.id} className="rounded-xl border border-[#2b1e12] bg-[#110e0a] px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${AUDIT_ACTION_COLORS[evt.action]}`}>
                {AUDIT_ACTION_LABELS[evt.action]}
              </span>
              <span className="text-[10px] text-[#8a6e4e]">by {evt.actor}</span>
              <span className="ml-auto text-[10px] text-[#8a6e4e]">
                {new Date(evt.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {" "}
                {new Date(evt.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {evt.note && <p className="mt-1.5 text-xs text-[#f0e6d4]">{evt.note}</p>}
            {(evt.before || evt.after) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {evt.before && Object.entries(evt.before).map(([k, v]) => (
                  <span key={`b-${k}`} className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-400">
                    {k}: {String(v)}
                  </span>
                ))}
                {evt.after && Object.entries(evt.after).map(([k, v]) => (
                  <span key={`a-${k}`} className="rounded-md border border-[#34d399]/20 bg-[#34d399]/10 px-2 py-0.5 font-mono text-[10px] text-[#34d399]">
                    {k}: {String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── Root render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <BimPageHeader
        eyebrow="Project Workspace"
        title="Cost Estimate"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {estimates.length > 0 && (
              <select
                value={selectedEstId}
                onChange={(e) => { setSelectedEstId(e.target.value); setActiveTab("boq"); }}
                className="rounded-xl border border-[#2b1e12] bg-[#110e0a] px-3 py-2 text-xs font-bold text-[#f0e6d4] focus:outline-none focus:ring-1 focus:ring-[#6b3e14]"
              >
                {estimates.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            )}

            {/* Export dropdown */}
            {(lines.length > 0 || comparison) && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu((v) => !v)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#2b1e12] bg-[#110e0a] px-3 py-2 text-xs font-bold text-[#d4933c] transition hover:border-[#6b3e14]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-[#2b1e12] bg-[#110e0a] py-1 shadow-xl">
                    {lines.length > 0 && (
                      <button onClick={() => { handleExportBOQ(); setShowExportMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-[#f0e6d4] hover:bg-[#160f08]">
                        BOQ CSV
                      </button>
                    )}
                    {summary && (
                      <button onClick={() => { handleExportSummary(); setShowExportMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-[#f0e6d4] hover:bg-[#160f08]">
                        Summary CSV
                      </button>
                    )}
                    {comparison && (
                      <button onClick={() => { handleExportComparison(); setShowExportMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-[#f0e6d4] hover:bg-[#160f08]">
                        Comparison CSV
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <BimButton
              variant="primary"
              size="sm"
              icon={creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? "Creating…" : "Create Estimate"}
            </BimButton>
          </div>
        }
      />

      {/* Banners */}
      {createResult && (
        <div className="flex items-center gap-2 rounded-xl border border-[#34d399]/20 bg-[#34d399]/10 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#34d399]" />
          <span className="text-xs font-bold text-[#34d399]">Estimate created — {createResult.linesGenerated} BOQ lines mapped from takeoff.</span>
          <button onClick={() => setCreateResult(null)} className="ml-auto text-[#34d399] opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span className="text-xs font-bold text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Loading */}
      {loadingEstimates && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#8a6e4e]" /></div>}

      {/* Empty state */}
      {!loadingEstimates && estimates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#2b1e12] bg-[#110e0a] py-16 text-center">
          <BarChart3 className="h-10 w-10 text-[#8a6e4e]" />
          <p className="mt-4 text-sm font-bold text-[#f0e6d4]">No estimates yet</p>
          <p className="mt-1 max-w-xs text-xs text-[#8a6e4e]">
            Click &quot;Create Estimate&quot; to auto-map BIM quantities to rates and generate a project BOQ.
          </p>
        </div>
      )}

      {/* Main content */}
      {!loadingEstimates && selectedEst && (
        <div className="space-y-5">

          {/* Estimate info strip + status action */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[#2b1e12] bg-[#110e0a] px-4 py-3">
            <EstimateStatusBadge status={selectedEst.status} />
            <span className="text-xs font-bold text-[#f0e6d4]">{selectedEst.label}</span>
            <span className="text-xs text-[#8a6e4e]">
              Takeoff: <span className="font-medium text-[#d4933c]">{selectedEst.takeoffRevisionId}</span>
            </span>
            <span className="text-xs text-[#8a6e4e]">
              {selectedEst.createdBy} · {new Date(selectedEst.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {/* Status transition shortcut */}
            {selectedEst.status === "draft" && (
              <button onClick={() => handleStatusTransition("submitted")}
                className="ml-auto rounded-lg border border-[#60a5fa]/30 bg-[#60a5fa]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#60a5fa] transition hover:bg-[#60a5fa]/20">
                Submit
              </button>
            )}
            {selectedEst.status === "submitted" && (
              <button onClick={() => handleStatusTransition("approved")}
                className="ml-auto rounded-lg border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#34d399] transition hover:bg-[#34d399]/20">
                Approve
              </button>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 rounded-xl border border-[#2b1e12] bg-[#0f0905] p-1">
            {([
              { key: "boq",     label: "BOQ",     icon: Layers },
              { key: "compare", label: "Compare", icon: GitCompare },
              { key: "history", label: "History", icon: Clock },
            ] as { key: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest transition ${
                  activeTab === key ? "bg-[#5a3e22] text-[#f0e6d4]" : "text-[#8a6e4e] hover:text-[#d0b894]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "boq"     && renderBOQTab()}
          {activeTab === "compare" && renderCompareTab()}
          {activeTab === "history" && renderHistoryTab()}
        </div>
      )}
    </div>
  );
}
