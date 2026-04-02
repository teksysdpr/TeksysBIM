"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Filter,
  IndianRupee,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import {
  fetchEstimates,
  fetchEstimateSummary,
  ESTIMATE_STATUS_LABELS,
  ESTIMATE_STATUS_COLORS,
  type EstimateRevision,
  type EstimateSummary,
  type EstimateStatus,
} from "@/app/services/costingService";
import {
  fetchProjects,
  type ProjectListItem,
} from "@/app/services/projectsService";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style:    "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

type StatusFilter = "ALL" | EstimateStatus;

interface EstimateRow {
  estimate: EstimateRevision;
  summary?: EstimateSummary;
}

const STATUS_STYLES: Record<EstimateStatus, { text: string; bg: string; border: string; dot: string }> = {
  draft:      { text: "text-[#fbbf24]",  bg: "bg-[#fbbf24]/10",  border: "border-[#78350f]",  dot: "bg-[#fbbf24]"  },
  submitted:  { text: "text-[#60a5fa]",  bg: "bg-[#60a5fa]/10",  border: "border-[#1e3a5f]",  dot: "bg-[#60a5fa]"  },
  approved:   { text: "text-[#34d399]",  bg: "bg-[#34d399]/10",  border: "border-[#064e3b]",  dot: "bg-[#34d399]"  },
  superseded: { text: "text-[#6b7280]",  bg: "bg-white/5",        border: "border-white/10",   dot: "bg-[#6b7280]"  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CostEstimationPage() {
  const [rows,       setRows]       = useState<EstimateRow[]>([]);
  const [projectMap, setProjectMap] = useState<Map<string, string>>(new Map());
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [filter,     setFilter]     = useState<StatusFilter>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [estimates, allProjects] = await Promise.all([
        fetchEstimates(""),
        fetchProjects(),
      ]);

      setProjectMap(new Map(allProjects.map((p: ProjectListItem) => [p.id, p.name])));

      // Fetch summaries in parallel (best-effort — no failure if one is missing)
      const summaries = await Promise.allSettled(
        estimates.map((e) => fetchEstimateSummary(e.id))
      );

      const combined: EstimateRow[] = estimates.map((estimate, i) => ({
        estimate,
        summary: summaries[i].status === "fulfilled" ? (summaries[i] as PromiseFulfilledResult<EstimateSummary>).value : undefined,
      }));
      setRows(combined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = filter === "ALL"
    ? rows
    : rows.filter((r) => r.estimate.status === filter);

  const totalGrand = rows.reduce((s, r) => s + (r.summary?.grandTotal ?? 0), 0);
  const counts = {
    total:      rows.length,
    draft:      rows.filter((r) => r.estimate.status === "draft").length,
    submitted:  rows.filter((r) => r.estimate.status === "submitted").length,
    approved:   rows.filter((r) => r.estimate.status === "approved").length,
  };

  const FILTERS: Array<{ value: StatusFilter; label: string }> = [
    { value: "ALL",       label: "All"       },
    { value: "draft",     label: "Draft"     },
    { value: "submitted", label: "Submitted" },
    { value: "approved",  label: "Approved"  },
    { value: "superseded",label: "Superseded"},
  ];

  return (
    <main className="min-h-[calc(100vh-88px)] bg-[#090603] px-4 py-8 text-[#f4e2c8] md:px-6 lg:px-8">
      <CompanyPageHeader />
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#fff3de]">Cost Estimation</h1>
            <p className="mt-1 text-sm text-[#a08060]">All estimate revisions across projects</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#3f2d1a] bg-[#1a120b] px-3 py-2 text-xs font-semibold text-[#f0c27e] transition hover:bg-[#25180d] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Total Estimates", value: counts.total,     color: "text-[#f0c27e]" },
              { label: "Draft",           value: counts.draft,     color: "text-[#fbbf24]" },
              { label: "Submitted",       value: counts.submitted, color: "text-[#60a5fa]" },
              { label: "Approved",        value: counts.approved,  color: "text-[#34d399]" },
              {
                label: "Portfolio Value",
                value: fmtINR(totalGrand),
                color: "text-[#f0c27e] text-base",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-[#3f2d1a] bg-[#0f0905] p-4">
                <p className={`font-black ${color} ${typeof value === "string" ? "text-base" : "text-2xl"}`}>
                  {value}
                </p>
                <p className="mt-0.5 text-xs text-[#7a5e3e]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#7a5e3e]">
            <Filter className="h-3.5 w-3.5" />
            Status:
          </span>
          {FILTERS.map(({ value, label }) => {
            const active = filter === value;
            const style  = value !== "ALL" ? STATUS_STYLES[value as EstimateStatus] : null;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  active
                    ? style
                      ? `${style.text} ${style.bg} ${style.border}`
                      : "border-[#f0c27e]/40 bg-[#f0c27e]/10 text-[#f0c27e]"
                    : "border-[#3f2d1a] bg-[#0f0905] text-[#7a5e3e] hover:border-[#5a3d24] hover:text-[#d0b894]"
                }`}
              >
                {label}
                {value !== "ALL" && (
                  <span className="ml-1.5 opacity-70">
                    ({rows.filter((r) => r.estimate.status === value).length})
                  </span>
                )}
              </button>
            );
          })}
          {filter !== "ALL" && (
            <button
              onClick={() => setFilter("ALL")}
              className="flex items-center gap-1 rounded-full border border-[#3f2d1a] bg-[#0f0905] px-2 py-1 text-xs text-[#7a5e3e] transition hover:text-[#f87171]"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-[#7a5e3e]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <BarChart3 className="h-10 w-10 text-[#3f2d1a]" />
            <p className="text-sm text-[#7a5e3e]">
              {filter === "ALL" ? "No estimates found." : `No estimates with status: ${ESTIMATE_STATUS_LABELS[filter as EstimateStatus]}`}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && displayed.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[#3f2d1a] bg-[#0f0905]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a1d10] text-left text-xs font-semibold uppercase tracking-widest text-[#7a5e3e]">
                    <th className="px-5 py-3">Estimate</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-right">Grand Total</th>
                    <th className="px-4 py-3">By</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(({ estimate, summary }, i) => {
                    const s    = STATUS_STYLES[estimate.status];
                    const proj = projectMap.get(estimate.projectId) ?? estimate.projectId;
                    return (
                      <tr
                        key={estimate.id}
                        className={`border-b border-[#2a1d10]/60 transition hover:bg-[#1a120b] ${
                          i === displayed.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <p className="max-w-[200px] truncate font-semibold text-[#f4e2c8]">
                            {estimate.label}
                          </p>
                          <p className="mt-0.5 text-xs text-[#7a5e3e]">Rev #{estimate.revisionNumber}</p>
                        </td>
                        <td className="px-4 py-3.5 text-[#d0b894]">{proj}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.text} ${s.bg} ${s.border}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                            {ESTIMATE_STATUS_LABELS[estimate.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-[#a08060]">
                          {summary ? fmtINR(summary.subtotal) : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-[#f0c27e]">
                          {summary ? fmtINR(summary.grandTotal) : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-[#a08060]">{estimate.createdBy}</td>
                        <td className="px-4 py-3.5 text-xs text-[#7a5e3e]">
                          {fmtDate(estimate.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/company/projects/${estimate.projectId}/estimate`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#3f2d1a] bg-[#1a120b] px-3 py-1.5 text-xs font-semibold text-[#f0c27e] transition hover:bg-[#25180d]"
                          >
                            Open <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer total */}
            {displayed.length > 1 && (
              <div className="flex items-center justify-end gap-3 border-t border-[#2a1d10] px-5 py-3">
                <span className="text-xs text-[#7a5e3e]">
                  Showing {displayed.length} estimate{displayed.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1 rounded-lg border border-[#3f2d1a] bg-[#1a120b] px-3 py-1.5 font-mono text-sm font-bold text-[#f0c27e]">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {fmtINR(displayed.reduce((s, r) => s + (r.summary?.grandTotal ?? 0), 0))}
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
