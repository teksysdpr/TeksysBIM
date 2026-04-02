"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Layers,
  Loader2,
  RefreshCw,
  Ruler,
  X,
} from "lucide-react";
import {
  type GenerateResult,
  type QuantityRecord,
  type TakeoffRevision,
  type TakeoffSummary,
  DISCIPLINE_BG,
  DISCIPLINE_COLORS,
  DISCIPLINE_LABELS,
  ELEMENT_TYPE_LABELS,
  REVISION_STATUS_COLORS,
  fetchQuantityRecords,
  fetchTakeoffRevisions,
  fetchTakeoffSummary,
  generateTakeoff,
} from "@/app/services/takeoffService";
import {
  BimPageHeader,
  BimPanel,
  BimButton,
  BimStateBox,
} from "@/app/components/company/ui";

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_ORDER = ["Foundation", "B1", "G", "L1", "L2", "L3", "Roof"];

function sortedLevels(levels: string[]): string[] {
  return [...levels].sort((a, b) => {
    const ia = LEVEL_ORDER.indexOf(a);
    const ib = LEVEL_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}

function fmtQty(n: number): string {
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
}

function groupByDisciplineAndType(
  records: QuantityRecord[]
): Map<string, Map<string, QuantityRecord[]>> {
  const outer = new Map<string, Map<string, QuantityRecord[]>>();
  for (const r of records) {
    if (!outer.has(r.discipline)) outer.set(r.discipline, new Map());
    const inner = outer.get(r.discipline)!;
    if (!inner.has(r.elementType)) inner.set(r.elementType, []);
    inner.get(r.elementType)!.push(r);
  }
  return outer;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RevisionBadge({ status }: { status: TakeoffRevision["status"] }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-widest ${REVISION_STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
}

function DisciplineBadge({ discipline }: { discipline: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${DISCIPLINE_BG[discipline] ?? "bg-[#2b1e12]/30 border-[#6b4820]/20"} ${DISCIPLINE_COLORS[discipline] ?? "text-[#f0e6d4]"}`}
    >
      {DISCIPLINE_LABELS[discipline] ?? discipline}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <BimPanel noPad className="flex flex-col gap-1 p-4">
      <div className="flex items-center gap-2 text-[#8a6e4e] text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-black text-[#f0e6d4] leading-none">{value}</div>
      {sub && <div className="text-[11px] text-[#8a6e4e]">{sub}</div>}
    </BimPanel>
  );
}

interface FilterBarProps {
  disciplines: string[];
  levels: string[];
  zones: string[];
  elementTypes: string[];
  filter: ActiveFilter;
  onChange: (f: ActiveFilter) => void;
  onClear: () => void;
}

interface ActiveFilter {
  discipline: string;
  level: string;
  zone: string;
  elementType: string;
}

function FilterBar({
  disciplines,
  levels,
  zones,
  elementTypes,
  filter,
  onChange,
  onClear,
}: FilterBarProps) {
  const hasActive = Object.values(filter).some(Boolean);

  const sel =
    "rounded border border-[#2b1e12] bg-[#0f0905] px-2 py-1 text-xs text-[#f0e6d4] focus:outline-none focus:border-[#d4933c]/50 appearance-none cursor-pointer";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 text-[#8a6e4e] text-xs">
        <Filter className="h-3.5 w-3.5" />
        <span>Filter:</span>
      </div>

      <select className={sel} value={filter.discipline} onChange={(e) => onChange({ ...filter, discipline: e.target.value })}>
        <option value="">All disciplines</option>
        {disciplines.map((d) => (
          <option key={d} value={d}>{DISCIPLINE_LABELS[d] ?? d}</option>
        ))}
      </select>

      <select className={sel} value={filter.level} onChange={(e) => onChange({ ...filter, level: e.target.value })}>
        <option value="">All levels</option>
        {sortedLevels(levels).map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <select className={sel} value={filter.zone} onChange={(e) => onChange({ ...filter, zone: e.target.value })}>
        <option value="">All zones</option>
        {zones.map((z) => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>

      <select className={sel} value={filter.elementType} onChange={(e) => onChange({ ...filter, elementType: e.target.value })}>
        <option value="">All element types</option>
        {elementTypes.map((t) => (
          <option key={t} value={t}>{ELEMENT_TYPE_LABELS[t] ?? t}</option>
        ))}
      </select>

      {hasActive && (
        <BimButton
          variant="danger"
          size="sm"
          icon={<X className="h-3 w-3" />}
          onClick={onClear}
        >
          Clear
        </BimButton>
      )}
    </div>
  );
}

// ── Quantity table group row ──────────────────────────────────────────────────

function TypeGroupRow({
  discipline,
  elementType,
  records,
  expanded,
  onToggle,
}: {
  discipline: string;
  elementType: string;
  records: QuantityRecord[];
  expanded: boolean;
  onToggle: () => void;
}) {
  // Compute subtotals per unit
  const unitTotals: Record<string, number> = {};
  for (const r of records) {
    unitTotals[r.unit] = (unitTotals[r.unit] ?? 0) + r.quantity;
  }
  const subtotalStr = Object.entries(unitTotals)
    .map(([unit, qty]) => `${fmtQty(qty)} ${unit}`)
    .join(" · ");

  return (
    <>
      {/* Group header */}
      <tr
        className="cursor-pointer select-none hover:bg-[#160f08] transition-colors"
        onClick={onToggle}
      >
        <td colSpan={6} className="px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-[#8a6e4e]">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
            <DisciplineBadge discipline={discipline} />
            <span className="text-sm font-black text-[#f0e6d4]">
              {ELEMENT_TYPE_LABELS[elementType] ?? elementType}
            </span>
            <span className="text-xs text-[#8a6e4e]">
              {records.length} {records.length === 1 ? "record" : "records"}
            </span>
            <span className="ml-auto text-xs font-mono text-[#d4933c]">{subtotalStr}</span>
          </div>
        </td>
      </tr>

      {/* Detail rows */}
      {expanded &&
        records.map((r) => (
          <tr
            key={r.id}
            className="border-t border-[#2b1e12] hover:bg-[#160f08] transition-colors"
          >
            <td className="pl-12 pr-4 py-2 text-xs text-[#8a6e4e] font-mono">{r.level}</td>
            <td className="px-4 py-2 text-xs text-[#8a6e4e]">{r.zone}</td>
            <td className="px-4 py-2 text-xs text-[#d0b894] max-w-xs truncate" title={r.description}>
              {r.description}
            </td>
            <td className="px-4 py-2 text-xs text-right font-mono text-[#f0e6d4]">
              {fmtQty(r.quantity)}
            </td>
            <td className="px-4 py-2 text-xs text-[#8a6e4e]">{r.unit}</td>
            <td className="px-4 py-2 text-xs text-[#8a6e4e] font-mono">
              {r.sourceLayerRef ?? "—"}
            </td>
          </tr>
        ))}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TakeoffPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  // ── Data state ──────────────────────────────────────────────────────────────
  const [revisions, setRevisions] = useState<TakeoffRevision[]>([]);
  const [selectedRevId, setSelectedRevId] = useState<string>("");
  const [records, setRecords] = useState<QuantityRecord[]>([]);
  const [summary, setSummary] = useState<TakeoffSummary | null>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loadingRevisions, setLoadingRevisions] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActiveFilter>({
    discipline: "",
    level: "",
    zone: "",
    elementType: "",
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);

  // ── Load revisions on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    setLoadingRevisions(true);
    fetchTakeoffRevisions(projectId)
      .then((data) => {
        setRevisions(data);
        if (data.length > 0) setSelectedRevId(data[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingRevisions(false));
  }, [projectId]);

  // ── Load records when revision changes ───────────────────────────────────────
  const loadRecords = useCallback(
    async (revId: string) => {
      if (!revId) return;
      setLoadingRecords(true);
      setError(null);
      try {
        const [recs, sum] = await Promise.all([
          fetchQuantityRecords({ revisionId: revId }),
          fetchTakeoffSummary(revId),
        ]);
        setRecords(recs);
        setSummary(sum);
        setExpandedGroups(new Set());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setLoadingRecords(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedRevId) loadRecords(selectedRevId);
  }, [selectedRevId, loadRecords]);

  // ── Derived filter options ───────────────────────────────────────────────────
  const filterOptions = useMemo(() => {
    const disciplines = [...new Set(records.map((r) => r.discipline))].sort();
    const levels = [...new Set(records.map((r) => r.level))];
    const zones = [...new Set(records.map((r) => r.zone))].sort();
    const elementTypes = [...new Set(records.map((r) => r.elementType))].sort();
    return { disciplines, levels, zones, elementTypes };
  }, [records]);

  // ── Filtered + grouped records ───────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filter.discipline && r.discipline !== filter.discipline) return false;
      if (filter.level && r.level !== filter.level) return false;
      if (filter.zone && r.zone !== filter.zone) return false;
      if (filter.elementType && r.elementType !== filter.elementType) return false;
      return true;
    });
  }, [records, filter]);

  const groupedRecords = useMemo(
    () => groupByDisciplineAndType(filteredRecords),
    [filteredRecords]
  );

  // ── Generate handler ─────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!projectId) return;
    setGenerating(true);
    setGenerateResult(null);
    setError(null);
    try {
      const result = await generateTakeoff({
        projectId,
        generatedBy: "BIM Manager",
        notes: `Generated from BIM model on ${new Date().toLocaleDateString()}`,
      });
      setGenerateResult(result);
      // Reload revisions list and auto-select the new one
      const updated = await fetchTakeoffRevisions(projectId);
      setRevisions(updated);
      setSelectedRevId(result.revision.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate takeoff");
    } finally {
      setGenerating(false);
    }
  }, [projectId]);

  // ── Export CSV ───────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    if (!filteredRecords.length) return;
    const header = "Discipline,Level,Zone,Element Type,Description,Quantity,Unit,Source Layer,Extracted By\n";
    const rows = filteredRecords.map((r) =>
      [
        r.discipline, r.level, r.zone, r.elementType,
        `"${r.description.replace(/"/g, '""')}"`,
        r.quantity, r.unit,
        r.sourceLayerRef ?? "",
        r.extractedBy,
      ].join(",")
    );
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const rev = revisions.find((r) => r.id === selectedRevId);
    a.download = `takeoff-${rev?.label.replace(/[^a-zA-Z0-9-]/g, "_") ?? selectedRevId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredRecords, revisions, selectedRevId]);

  // ── Toggle group expand ───────────────────────────────────────────────────────
  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectedRevision = revisions.find((r) => r.id === selectedRevId) ?? null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <BimPageHeader
        eyebrow="Project Workspace"
        title="Quantity Takeoff"
        subtitle="Quantities extracted from BIM model elements"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {revisions.length > 0 && (
              <select
                value={selectedRevId}
                onChange={(e) => setSelectedRevId(e.target.value)}
                className="rounded-lg border border-[#3f2d1a] bg-[#1a120b] px-3 py-1.5 text-xs font-semibold text-[#f0c27e] focus:outline-none focus:border-[#d4933c]/50 cursor-pointer"
              >
                {revisions.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            )}
            <BimButton
              variant="secondary"
              size="sm"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={handleExport}
              disabled={!filteredRecords.length}
            >
              Export CSV
            </BimButton>
            <BimButton
              variant="primary"
              size="sm"
              icon={generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "Generating…" : "Generate New"}
            </BimButton>
          </div>
        }
      />

      {/* ── Generate result banner ── */}
      {generateResult && (
        <div className="flex items-start gap-3 rounded-lg border border-[#34d399]/20 bg-[#34d399]/5 px-4 py-3">
          <RefreshCw className="h-4 w-4 text-[#34d399] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#34d399]">
            <span className="font-semibold">{generateResult.revision.label}</span> created —{" "}
            {generateResult.recordsGenerated} quantity record
            {generateResult.recordsGenerated !== 1 ? "s" : ""} extracted from BIM model elements.
          </div>
          <button
            onClick={() => setGenerateResult(null)}
            className="ml-auto text-[#34d399]/60 hover:text-[#34d399]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {error && <BimStateBox type="error" message={error} />}

      {/* ── Loading revisions ── */}
      {loadingRevisions && <BimStateBox type="loading" message="Loading revisions…" />}

      {/* ── Empty state — no revisions yet ── */}
      {!loadingRevisions && revisions.length === 0 && !error && (
        <BimPanel className="flex flex-col items-center py-12 text-center gap-4">
          <Layers className="h-10 w-10 text-[#6b4820]" />
          <div>
            <p className="text-sm font-black text-[#d0b894]">No takeoff revisions yet</p>
            <p className="text-xs text-[#8a6e4e] mt-1">
              Click <span className="font-black text-[#d4933c]">Generate New</span> to extract
              quantities from committed BIM model elements.
            </p>
          </div>
          <BimButton
            variant="primary"
            size="md"
            icon={generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Generating…" : "Generate Takeoff"}
          </BimButton>
        </BimPanel>
      )}

      {/* ── Main content ── */}
      {!loadingRevisions && selectedRevision && (
        <>
          {/* ── Revision meta strip ── */}
          <BimPanel noPad className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
            <RevisionBadge status={selectedRevision.status} />
            <span className="text-xs text-[#8a6e4e]">
              Generated by{" "}
              <span className="text-[#d0b894]">{selectedRevision.generatedBy}</span>
              {" · "}
              {new Date(selectedRevision.generatedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {selectedRevision.notes && (
              <span className="text-xs text-[#8a6e4e] italic">&ldquo;{selectedRevision.notes}&rdquo;</span>
            )}
          </BimPanel>

          {/* ── Summary cards ── */}
          {summary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard
                label="Total records"
                value={summary.totalRecords}
                icon={<Layers className="h-3.5 w-3.5" />}
              />
              <SummaryCard
                label="Disciplines"
                value={Object.keys(summary.byDiscipline).length}
                sub={Object.keys(summary.byDiscipline)
                  .map((d) => DISCIPLINE_LABELS[d] ?? d)
                  .join(", ")}
                icon={<Filter className="h-3.5 w-3.5" />}
              />
              <SummaryCard
                label="Element types"
                value={Object.keys(summary.byElementType).length}
                icon={<Ruler className="h-3.5 w-3.5" />}
              />
              <SummaryCard
                label="Levels covered"
                value={Object.keys(summary.byLevel).length}
                sub={sortedLevels(Object.keys(summary.byLevel)).join(", ")}
                icon={<Layers className="h-3.5 w-3.5" />}
              />
            </div>
          )}

          {/* ── Discipline breakdown cards ── */}
          {summary && Object.keys(summary.byDiscipline).length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Object.entries(summary.byDiscipline).map(([disc, data]) => (
                <div
                  key={disc}
                  className={`rounded-2xl border p-4 ${DISCIPLINE_BG[disc] ?? "bg-[#2b1e12]/20 border-[#2b1e12]"}`}
                >
                  <div className={`text-xs font-black uppercase tracking-widest mb-2 ${DISCIPLINE_COLORS[disc] ?? "text-[#f0e6d4]"}`}>
                    {DISCIPLINE_LABELS[disc] ?? disc}
                  </div>
                  <div className="text-2xl font-black text-[#f0e6d4] leading-none mb-1">
                    {data.count}
                    <span className="text-xs font-normal text-[#8a6e4e] ml-1">records</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(data.units).map(([unit, qty]) => (
                      <span
                        key={unit}
                        className="rounded bg-[#110e0a] px-1.5 py-0.5 text-[10px] font-mono text-[#d0b894]"
                      >
                        {fmtQty(qty)} {unit}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Filter bar ── */}
          <FilterBar
            disciplines={filterOptions.disciplines}
            levels={filterOptions.levels}
            zones={filterOptions.zones}
            elementTypes={filterOptions.elementTypes}
            filter={filter}
            onChange={setFilter}
            onClear={() => setFilter({ discipline: "", level: "", zone: "", elementType: "" })}
          />

          {/* ── Quantity table ── */}
          {loadingRecords ? (
            <BimStateBox type="loading" message="Loading quantity records…" />
          ) : filteredRecords.length === 0 ? (
            <BimStateBox
              type="empty"
              icon={<Layers className="h-8 w-8" />}
              message={records.length === 0 ? "No quantity records in this revision." : "No records match the current filters."}
            />
          ) : (
            <BimPanel noPad className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#2b1e12] bg-[#110e0a]">
                      <th className="pl-4 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#8a6e4e]">
                        Level
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#8a6e4e]">
                        Zone
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#8a6e4e]">
                        Description
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#8a6e4e] text-right">
                        Qty
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#8a6e4e]">
                        Unit
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#8a6e4e]">
                        Source Layer
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2b1e12]">
                    {[...groupedRecords.entries()].map(([discipline, typeMap]) =>
                      [...typeMap.entries()].map(([elementType, recs]) => {
                        const key = `${discipline}:${elementType}`;
                        return (
                          <TypeGroupRow
                            key={key}
                            discipline={discipline}
                            elementType={elementType}
                            records={recs}
                            expanded={expandedGroups.has(key)}
                            onToggle={() => toggleGroup(key)}
                          />
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="flex items-center justify-between border-t border-[#2b1e12] bg-[#110e0a] px-4 py-2">
                <span className="text-xs text-[#8a6e4e]">
                  {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
                  {filteredRecords.length !== records.length && (
                    <> (filtered from {records.length})</>
                  )}
                </span>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1 text-xs text-[#8a6e4e] hover:text-[#d4933c] transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Export CSV
                </button>
              </div>
            </BimPanel>
          )}
        </>
      )}
    </div>
  );
}
