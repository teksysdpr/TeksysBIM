"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileBox,
  Filter,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import {
  fetchDeliverables,
  DELIVERABLE_STATUS_LABELS,
  DELIVERABLE_STATUS_STYLES,
  DELIVERABLE_TYPE_LABELS,
  formatDate,
  type Deliverable,
  type DeliverableStatus,
  type DeliverableType,
} from "@/app/services/deliverablesService";
import {
  fetchProjects,
  type ProjectListItem,
} from "@/app/services/projectsService";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";

// ── Helpers ───────────────────────────────────────────────────────────────────

type StatusFilter = "ALL" | DeliverableStatus;
type TypeFilter   = "ALL" | DeliverableType;

const TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: "ALL",                label: "All Types"   },
  { value: "IFC",                label: "IFC"         },
  { value: "RVT",                label: "RVT"         },
  { value: "DWG",                label: "DWG"         },
  { value: "PDF",                label: "PDF"         },
  { value: "NWC",                label: "NWC"         },
  { value: "COORDINATION_MODEL", label: "Coord. Model"},
];

const TYPE_COLORS: Record<DeliverableType, string> = {
  IFC:                "text-[#60a5fa] bg-[#60a5fa]/10 border-[#1e3a5f]",
  RVT:                "text-[#a78bfa] bg-[#a78bfa]/10 border-[#3b1f6b]",
  DWG:                "text-[#fbbf24] bg-[#fbbf24]/10 border-[#78350f]",
  PDF:                "text-[#f87171] bg-[#f87171]/10 border-[#7f1d1d]",
  NWC:                "text-[#34d399] bg-[#34d399]/10 border-[#064e3b]",
  COORDINATION_MODEL: "text-[#f0c27e] bg-[#f0c27e]/10 border-[#7c4a1a]",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [projectMap,   setProjectMap]   = useState<Map<string, string>>(new Map());
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, allProjects] = await Promise.all([
        fetchDeliverables(),
        fetchProjects(),
      ]);
      setDeliverables(data);
      setProjectMap(new Map(allProjects.map((p: ProjectListItem) => [p.id, p.name])));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = deliverables.filter((d) => {
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    const matchType   = typeFilter   === "ALL" || d.deliverableType === typeFilter;
    return matchStatus && matchType;
  });

  const counts = {
    total:     deliverables.length,
    draft:     deliverables.filter((d) => d.status === "DRAFT").length,
    submitted: deliverables.filter((d) => d.status === "SUBMITTED").length,
    approved:  deliverables.filter((d) => d.status === "APPROVED").length,
    rejected:  deliverables.filter((d) => d.status === "REJECTED").length,
  };

  const STATUS_FILTERS: Array<{ value: StatusFilter; label: string; count: number }> = [
    { value: "ALL",       label: "All",       count: counts.total     },
    { value: "DRAFT",     label: "Draft",     count: counts.draft     },
    { value: "SUBMITTED", label: "Submitted", count: counts.submitted },
    { value: "APPROVED",  label: "Approved",  count: counts.approved  },
    { value: "REJECTED",  label: "Rejected",  count: counts.rejected  },
  ];

  const StatusIcon = ({ status }: { status: DeliverableStatus }) => {
    if (status === "APPROVED")  return <CheckCircle2 className="h-3.5 w-3.5 text-[#34d399]" />;
    if (status === "REJECTED")  return <XCircle      className="h-3.5 w-3.5 text-[#f87171]" />;
    if (status === "SUBMITTED") return <Clock        className="h-3.5 w-3.5 text-[#60a5fa]" />;
    return                             <FileBox      className="h-3.5 w-3.5 text-[#9a7d5e]" />;
  };

  return (
    <main className="min-h-[calc(100vh-88px)] bg-[#090603] px-4 py-8 text-[#f4e2c8] md:px-6 lg:px-8">
      <CompanyPageHeader />
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#fff3de]">BIM Deliverables</h1>
            <p className="mt-1 text-sm text-[#a08060]">Model submissions, approvals, and revision tracking</p>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total",     value: counts.total,     color: "text-[#f0c27e]" },
              { label: "Submitted", value: counts.submitted, color: "text-[#60a5fa]" },
              { label: "Approved",  value: counts.approved,  color: "text-[#34d399]" },
              { label: "Rejected",  value: counts.rejected,  color: "text-[#f87171]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-[#3f2d1a] bg-[#0f0905] p-4">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="mt-0.5 text-xs text-[#7a5e3e]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3">
          {/* Status filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#7a5e3e]">
              <Filter className="h-3.5 w-3.5" />
              Status:
            </span>
            {STATUS_FILTERS.map(({ value, label }) => {
              const active = statusFilter === value;
              const s = value !== "ALL" ? DELIVERABLE_STATUS_STYLES[value as DeliverableStatus] : null;
              return (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? s
                        ? `${s.text} ${s.bg} ${s.border}`
                        : "border-[#f0c27e]/40 bg-[#f0c27e]/10 text-[#f0c27e]"
                      : "border-[#3f2d1a] bg-[#0f0905] text-[#7a5e3e] hover:border-[#5a3d24] hover:text-[#d0b894]"
                  }`}
                >
                  {label}
                  {value !== "ALL" && (
                    <span className="ml-1.5 opacity-70">
                      ({deliverables.filter((d) => d.status === value).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#7a5e3e]">Type:</span>
            {TYPE_OPTIONS.map(({ value, label }) => {
              const active = typeFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? value !== "ALL"
                        ? TYPE_COLORS[value as DeliverableType]
                        : "border-[#f0c27e]/40 bg-[#f0c27e]/10 text-[#f0c27e]"
                      : "border-[#3f2d1a] bg-[#0f0905] text-[#7a5e3e] hover:border-[#5a3d24] hover:text-[#d0b894]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            {(statusFilter !== "ALL" || typeFilter !== "ALL") && (
              <button
                onClick={() => { setStatusFilter("ALL"); setTypeFilter("ALL"); }}
                className="flex items-center gap-1 rounded-full border border-[#3f2d1a] bg-[#0f0905] px-2 py-1 text-xs text-[#7a5e3e] transition hover:text-[#f87171]"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
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
            <FileBox className="h-10 w-10 text-[#3f2d1a]" />
            <p className="text-sm text-[#7a5e3e]">No deliverables found for the selected filters.</p>
          </div>
        )}

        {/* Deliverables list */}
        {!loading && !error && displayed.length > 0 && (
          <div className="space-y-3">
            {displayed.map((d) => {
              const ss      = DELIVERABLE_STATUS_STYLES[d.status];
              const projName = projectMap.get(d.projectId) ?? d.projectId;
              return (
                <div
                  key={d.id}
                  className="rounded-2xl border border-[#3f2d1a] bg-[#0f0905] p-5 transition hover:border-[#5a3d24]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <StatusIcon status={d.status} />
                      <div>
                        <h3 className="font-semibold text-[#f4e2c8]">{d.title}</h3>
                        <p className="mt-0.5 text-xs text-[#7a5e3e]">
                          {projName}
                          {d.conversionJobId && (
                            <span className="ml-2 text-[#5a3d24]">· Job {d.conversionJobId}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type */}
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${TYPE_COLORS[d.deliverableType]}`}>
                        {DELIVERABLE_TYPE_LABELS[d.deliverableType]}
                      </span>
                      {/* Version */}
                      <span className="rounded-full border border-[#3f2d1a] bg-[#1a120b] px-2.5 py-0.5 text-xs text-[#a08060]">
                        {d.version}
                      </span>
                      {/* Status */}
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ss.text} ${ss.bg} ${ss.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ss.dot}`} />
                        {DELIVERABLE_STATUS_LABELS[d.status]}
                      </span>
                    </div>
                  </div>

                  {d.description && (
                    <p className="mt-3 text-sm leading-6 text-[#a08060]">{d.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#7a5e3e]">
                    <span>Submitted by <span className="text-[#a08060]">{d.submittedBy}</span></span>
                    {d.submittedAt && (
                      <span>Submitted <span className="text-[#a08060]">{formatDate(d.submittedAt)}</span></span>
                    )}
                    {d.reviewedBy && (
                      <span>Reviewed by <span className="text-[#a08060]">{d.reviewedBy}</span></span>
                    )}
                    {d.reviewedAt && (
                      <span>on <span className="text-[#a08060]">{formatDate(d.reviewedAt)}</span></span>
                    )}
                  </div>

                  {d.reviewComments && (
                    <div className={`mt-3 rounded-xl border px-4 py-2.5 text-sm leading-6 ${
                      d.status === "REJECTED"
                        ? "border-[#7f1d1d]/40 bg-[#f87171]/5 text-[#f87171]"
                        : "border-[#064e3b]/40 bg-[#34d399]/5 text-[#34d399]"
                    }`}>
                      <span className="font-semibold">Review note: </span>
                      {d.reviewComments}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
