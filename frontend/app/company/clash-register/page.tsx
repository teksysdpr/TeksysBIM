"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  Shield,
  X,
  Zap,
} from "lucide-react";
import {
  fetchClashReports,
  fetchClashReportDetail,
  CLASH_SEVERITY_LABELS,
  CLASH_SEVERITY_STYLES,
  CLASH_STATUS_LABELS,
  CLASH_STATUS_STYLES,
  formatDate,
  isOverdue,
  type ClashReport,
  type ClashReportDetail,
  type ClashSeverity,
  type ClashIssueStatus,
  type ClashIssue,
} from "@/app/services/deliverablesService";
import {
  fetchProjects,
  type ProjectListItem,
} from "@/app/services/projectsService";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";

// ── Helpers ───────────────────────────────────────────────────────────────────

type SeverityFilter = "ALL" | ClashSeverity;
type StatusFilter   = "ALL" | ClashIssueStatus;

interface ReportWithDetail {
  report: ClashReport;
  detail?: ClashReportDetail;
  expanded: boolean;
  loading: boolean;
}

const SeverityIcon = ({ severity }: { severity: ClashSeverity }) => {
  if (severity === "CRITICAL") return <Zap          className="h-3.5 w-3.5" />;
  if (severity === "HIGH")     return <AlertTriangle className="h-3.5 w-3.5" />;
  if (severity === "MEDIUM")   return <AlertCircle  className="h-3.5 w-3.5" />;
  return                              <Shield        className="h-3.5 w-3.5" />;
};

function filterIssues(
  issues: ClashIssue[],
  severityFilter: SeverityFilter,
  statusFilter: StatusFilter
): ClashIssue[] {
  return issues.filter((i) => {
    const matchSeverity = severityFilter === "ALL" || i.severity === severityFilter;
    const matchStatus   = statusFilter   === "ALL" || i.status   === statusFilter;
    return matchSeverity && matchStatus;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClashRegisterPage() {
  const [reports,        setReports]        = useState<ReportWithDetail[]>([]);
  const [projectMap,     setProjectMap]     = useState<Map<string, string>>(new Map());
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clashReports, allProjects] = await Promise.all([
        fetchClashReports(),
        fetchProjects(),
      ]);
      setProjectMap(new Map(allProjects.map((p: ProjectListItem) => [p.id, p.name])));
      setReports(clashReports.map((report) => ({
        report,
        detail:   undefined,
        expanded: false,
        loading:  false,
      })));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleReport = useCallback(async (reportId: string) => {
    setReports((prev) => prev.map((r) => {
      if (r.report.id !== reportId) return r;
      if (r.expanded) return { ...r, expanded: false };
      if (r.detail)   return { ...r, expanded: true  };
      return { ...r, expanded: true, loading: true };
    }));

    // Fetch detail if not loaded
    const row = reports.find((r) => r.report.id === reportId);
    if (row && !row.detail) {
      try {
        const detail = await fetchClashReportDetail(reportId);
        setReports((prev) => prev.map((r) =>
          r.report.id === reportId ? { ...r, detail, loading: false } : r
        ));
      } catch {
        setReports((prev) => prev.map((r) =>
          r.report.id === reportId ? { ...r, expanded: false, loading: false } : r
        ));
      }
    }
  }, [reports]);

  // Aggregate stats across all reports
  const allIssues = reports.flatMap((r) => r.detail?.issues ?? []);
  const stats = {
    totalReports:  reports.length,
    totalIssues:   reports.reduce((s, r) => s + r.report.totalIssues, 0),
    openIssues:    reports.reduce((s, r) => s + r.report.openIssues + r.report.inProgressIssues, 0),
    criticalHigh:  reports.reduce((s, r) => s + r.report.criticalCount + r.report.highCount, 0),
    resolved:      reports.reduce((s, r) => s + r.report.resolvedIssues, 0),
  };

  const SEVERITY_OPTIONS: Array<{ value: SeverityFilter; label: string }> = [
    { value: "ALL",      label: "All Severity" },
    { value: "CRITICAL", label: "Critical"     },
    { value: "HIGH",     label: "High"         },
    { value: "MEDIUM",   label: "Medium"       },
    { value: "LOW",      label: "Low"          },
  ];

  const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
    { value: "ALL",         label: "All Status"   },
    { value: "OPEN",        label: "Open"         },
    { value: "IN_PROGRESS", label: "In Progress"  },
    { value: "RESOLVED",    label: "Resolved"     },
    { value: "WAIVED",      label: "Waived"       },
  ];

  return (
    <main className="min-h-[calc(100vh-88px)] bg-[#090603] px-4 py-8 text-[#f4e2c8] md:px-6 lg:px-8">
      <CompanyPageHeader />
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#fff3de]">Clash Detection Register</h1>
            <p className="mt-1 text-sm text-[#a08060]">
              Interdisciplinary clashes — severity, ownership, and closure status
            </p>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Reports",        value: stats.totalReports, color: "text-[#f0c27e]" },
              { label: "Total Issues",   value: stats.totalIssues,  color: "text-[#d0b894]" },
              { label: "Open / Active",  value: stats.openIssues,   color: "text-[#fbbf24]" },
              { label: "Critical + High",value: stats.criticalHigh, color: "text-[#f87171]" },
              { label: "Resolved",       value: stats.resolved,     color: "text-[#34d399]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-[#3f2d1a] bg-[#0f0905] p-4">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="mt-0.5 text-xs text-[#7a5e3e]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#7a5e3e]">
              <Filter className="h-3.5 w-3.5" /> Severity:
            </span>
            {SEVERITY_OPTIONS.map(({ value, label }) => {
              const active = severityFilter === value;
              const s = value !== "ALL" ? CLASH_SEVERITY_STYLES[value as ClashSeverity] : null;
              return (
                <button
                  key={value}
                  onClick={() => setSeverityFilter(value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? s
                        ? `${s.text} ${s.bg} ${s.border}`
                        : "border-[#f0c27e]/40 bg-[#f0c27e]/10 text-[#f0c27e]"
                      : "border-[#3f2d1a] bg-[#0f0905] text-[#7a5e3e] hover:border-[#5a3d24] hover:text-[#d0b894]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#7a5e3e]">Status:</span>
            {STATUS_OPTIONS.map(({ value, label }) => {
              const active = statusFilter === value;
              const s = value !== "ALL" ? CLASH_STATUS_STYLES[value as ClashIssueStatus] : null;
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
                </button>
              );
            })}
            {(severityFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                onClick={() => { setSeverityFilter("ALL"); setStatusFilter("ALL"); }}
                className="flex items-center gap-1 rounded-full border border-[#3f2d1a] bg-[#0f0905] px-2 py-1 text-xs text-[#7a5e3e] transition hover:text-[#f87171]"
              >
                <X className="h-3 w-3" /> Clear
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
        {!loading && !error && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Shield className="h-10 w-10 text-[#3f2d1a]" />
            <p className="text-sm text-[#7a5e3e]">No clash reports found.</p>
          </div>
        )}

        {/* Clash Reports */}
        {!loading && !error && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map(({ report, detail, expanded, loading: rLoading }) => {
              const projName = projectMap.get(report.projectId) ?? report.projectId;
              const issues   = detail ? filterIssues(detail.issues, severityFilter, statusFilter) : [];

              return (
                <div
                  key={report.id}
                  className="overflow-hidden rounded-2xl border border-[#3f2d1a] bg-[#0f0905]"
                >
                  {/* Report header */}
                  <button
                    onClick={() => toggleReport(report.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#1a120b]"
                  >
                    <div className="flex items-center gap-3">
                      {expanded
                        ? <ChevronDown  className="h-4 w-4 text-[#7a5e3e]" />
                        : <ChevronRight className="h-4 w-4 text-[#7a5e3e]" />
                      }
                      <div>
                        <p className="font-semibold text-[#f4e2c8]">{report.title}</p>
                        <p className="mt-0.5 text-xs text-[#7a5e3e]">
                          {projName} · {report.disciplineA} vs {report.disciplineB}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {report.criticalCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full border border-[#7f1d1d] bg-[#f87171]/10 px-2.5 py-1 font-semibold text-[#f87171]">
                          <Zap className="h-3 w-3" /> {report.criticalCount} Critical
                        </span>
                      )}
                      {report.highCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full border border-[#7c2d12] bg-[#f97316]/10 px-2.5 py-1 font-semibold text-[#f97316]">
                          <AlertTriangle className="h-3 w-3" /> {report.highCount} High
                        </span>
                      )}
                      <span className="rounded-full border border-[#78350f] bg-[#fbbf24]/10 px-2.5 py-1 font-semibold text-[#fbbf24]">
                        {report.openIssues + report.inProgressIssues} Open
                      </span>
                      <span className="rounded-full border border-[#064e3b] bg-[#34d399]/10 px-2.5 py-1 font-semibold text-[#34d399]">
                        {report.resolvedIssues} Resolved
                      </span>
                      <span className="rounded-full border border-[#3f2d1a] bg-[#1a120b] px-2.5 py-1 text-[#7a5e3e]">
                        {report.totalIssues} total
                      </span>
                    </div>
                  </button>

                  {/* Issues */}
                  {expanded && (
                    <div className="border-t border-[#2a1d10]">
                      {rLoading && (
                        <div className="flex items-center justify-center py-8 text-[#7a5e3e]">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      )}

                      {!rLoading && issues.length === 0 && (
                        <div className="px-5 py-6 text-center text-sm text-[#7a5e3e]">
                          No issues match the current filters.
                        </div>
                      )}

                      {!rLoading && issues.length > 0 && (
                        <div className="divide-y divide-[#2a1d10]">
                          {issues.map((issue) => {
                            const sev = CLASH_SEVERITY_STYLES[issue.severity];
                            const sts = CLASH_STATUS_STYLES[issue.status];
                            const overdue = issue.status === "OPEN" || issue.status === "IN_PROGRESS"
                              ? isOverdue(issue.targetDate)
                              : false;

                            return (
                              <div key={issue.id} className="px-5 py-4 transition hover:bg-[#120c07]">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <span className={`mt-0.5 ${sev.text}`}>
                                      <SeverityIcon severity={issue.severity} />
                                    </span>
                                    <div>
                                      <p className="font-semibold text-[#f4e2c8]">{issue.title}</p>
                                      <p className="mt-1 max-w-xl text-sm leading-6 text-[#a08060]">
                                        {issue.description}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Severity */}
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sev.text} ${sev.bg} ${sev.border}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                                      {CLASH_SEVERITY_LABELS[issue.severity]}
                                    </span>
                                    {/* Status */}
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sts.text} ${sts.bg} ${sts.border}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${sts.dot}`} />
                                      {CLASH_STATUS_LABELS[issue.status]}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7a5e3e]">
                                  <span>
                                    {issue.disciplineA} vs {issue.disciplineB}
                                  </span>
                                  {issue.assignedTo && (
                                    <span>
                                      Assigned: <span className="text-[#a08060]">{issue.assignedTo}</span>
                                    </span>
                                  )}
                                  {issue.targetDate && (
                                    <span className={overdue ? "text-[#f87171]" : ""}>
                                      {overdue && "⚠ "}Target: {formatDate(issue.targetDate)}
                                    </span>
                                  )}
                                  {issue.resolvedAt && (
                                    <span className="text-[#34d399]">
                                      Resolved: {formatDate(issue.resolvedAt)}
                                    </span>
                                  )}
                                </div>

                                {issue.resolutionNote && (
                                  <div className="mt-2 rounded-lg border border-[#064e3b]/40 bg-[#34d399]/5 px-3 py-2 text-xs text-[#34d399]">
                                    <span className="font-semibold">Resolution: </span>
                                    {issue.resolutionNote}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
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
