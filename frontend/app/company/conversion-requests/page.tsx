"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Layers,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import {
  fetchConversionJobs,
  STAGE_LABELS,
  STAGE_ORDER,
  STAGE_STYLES,
  TERMINAL_STAGES,
  ACTIVE_STAGES,
  formatConversionDate,
  isOverdue,
  type ConversionJob,
  type ConversionStage,
} from "@/app/services/conversionService";
import {
  fetchProjects,
  type ProjectListItem,
} from "@/app/services/projectsService";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";

// ── Helpers ───────────────────────────────────────────────────────────────────

type StageFilter = "ALL" | ConversionStage;

function buildProjectMap(projects: ProjectListItem[]): Map<string, string> {
  return new Map(projects.map((p) => [p.id, p.name]));
}

interface Stats {
  total: number;
  active: number;
  pendingReview: number;
  delivered: number;
  overdue: number;
}

function computeStats(jobs: ConversionJob[]): Stats {
  return {
    total:         jobs.length,
    active:        jobs.filter((j) => ACTIVE_STAGES.includes(j.stage)).length,
    pendingReview: jobs.filter((j) => ["UNDER_REVIEW", "QA_CHECK", "CLASH_REVIEW"].includes(j.stage)).length,
    delivered:     jobs.filter((j) => j.stage === "DELIVERED" || j.stage === "CLOSED").length,
    overdue:       jobs.filter((j) => !TERMINAL_STAGES.includes(j.stage) && isOverdue(j.dueDate)).length,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConversionRequestsPage() {
  const [jobs,       setJobs]       = useState<ConversionJob[]>([]);
  const [projectMap, setProjectMap] = useState<Map<string, string>>(new Map());
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [filter,     setFilter]     = useState<StageFilter>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allJobs, allProjects] = await Promise.all([
        fetchConversionJobs(""),
        fetchProjects(),
      ]);
      setJobs(allJobs);
      setProjectMap(buildProjectMap(allProjects));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = filter === "ALL" ? jobs : jobs.filter((j) => j.stage === filter);
  const stats     = computeStats(jobs);

  const FILTER_OPTIONS: Array<{ value: StageFilter; label: string }> = [
    { value: "ALL",                label: "All Jobs"        },
    { value: "UPLOADED",           label: "Uploaded"        },
    { value: "UNDER_REVIEW",       label: "Under Review"    },
    { value: "SCOPE_APPROVED",     label: "Scope Approved"  },
    { value: "IN_CONVERSION",      label: "In Conversion"   },
    { value: "QA_CHECK",           label: "QA Check"        },
    { value: "CLASH_REVIEW",       label: "Clash Review"    },
    { value: "COST_ESTIMATION",    label: "Cost Est."       },
    { value: "REVISION_REQUESTED", label: "Revision Req."   },
    { value: "DELIVERED",          label: "Delivered"       },
    { value: "CLOSED",             label: "Closed"          },
  ];

  return (
    <main className="min-h-[calc(100vh-88px)] bg-[#090603] px-4 py-8 text-[#f4e2c8] md:px-6 lg:px-8">
      <CompanyPageHeader />
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#fff3de]">Conversion Requests</h1>
            <p className="mt-1 text-sm text-[#a08060]">All CAD2BIM jobs across projects</p>
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
              { label: "Total Jobs",      value: stats.total,         color: "text-[#f0c27e]" },
              { label: "Active",          value: stats.active,        color: "text-[#a78bfa]" },
              { label: "Needs Review",    value: stats.pendingReview, color: "text-[#fbbf24]" },
              { label: "Delivered",       value: stats.delivered,     color: "text-[#34d399]" },
              { label: "Overdue",         value: stats.overdue,       color: "text-[#f87171]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-[#3f2d1a] bg-[#0f0905] p-4">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="mt-0.5 text-xs text-[#7a5e3e]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Stage filter */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#7a5e3e]">
            <Filter className="h-3.5 w-3.5" />
            Stage:
          </span>
          {FILTER_OPTIONS.map(({ value, label }) => {
            const active = filter === value;
            const style  = value !== "ALL" ? STAGE_STYLES[value as ConversionStage] : null;
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
                    ({jobs.filter((j) => j.stage === value).length})
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
            <Layers className="h-10 w-10 text-[#3f2d1a]" />
            <p className="text-sm text-[#7a5e3e]">
              {filter === "ALL" ? "No conversion requests found." : `No jobs at stage: ${STAGE_LABELS[filter as ConversionStage]}`}
            </p>
          </div>
        )}

        {/* Jobs table */}
        {!loading && !error && displayed.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[#3f2d1a] bg-[#0f0905]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a1d10] text-left text-xs font-semibold uppercase tracking-widest text-[#7a5e3e]">
                    <th className="px-5 py-3">Job</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((job, i) => {
                    const stageStyle = STAGE_STYLES[job.stage];
                    const overdue    = !TERMINAL_STAGES.includes(job.stage) && isOverdue(job.dueDate);
                    const projectName = projectMap.get(job.projectId) ?? job.projectId;

                    return (
                      <tr
                        key={job.id}
                        className={`border-b border-[#2a1d10]/60 transition hover:bg-[#1a120b] ${
                          i === displayed.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        {/* Job title */}
                        <td className="px-5 py-3.5">
                          <p className="max-w-[220px] truncate font-semibold text-[#f4e2c8]">
                            {job.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[#7a5e3e]">{job.id}</p>
                        </td>

                        {/* Project */}
                        <td className="px-4 py-3.5">
                          <span className="max-w-[180px] truncate text-[#d0b894]">
                            {projectName}
                          </span>
                        </td>

                        {/* Stage */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${stageStyle.text} ${stageStyle.bg} ${stageStyle.border}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${stageStyle.dot}`} />
                            {STAGE_LABELS[job.stage]}
                          </span>
                        </td>

                        {/* Assignee */}
                        <td className="px-4 py-3.5 text-[#a08060]">
                          {job.assignee ?? "—"}
                        </td>

                        {/* Due date */}
                        <td className="px-4 py-3.5">
                          {job.dueDate ? (
                            <span className={`flex items-center gap-1 text-xs ${overdue ? "text-[#f87171]" : "text-[#a08060]"}`}>
                              {overdue && <AlertTriangle className="h-3 w-3" />}
                              {formatConversionDate(job.dueDate)}
                            </span>
                          ) : (
                            <span className="text-xs text-[#3f2d1a]">—</span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3.5 text-xs text-[#7a5e3e]">
                          {formatConversionDate(job.createdAt)}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/company/projects/${job.projectId}/conversion/${job.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#3f2d1a] bg-[#1a120b] px-3 py-1.5 text-xs font-semibold text-[#f0c27e] transition hover:bg-[#25180d]"
                          >
                            View <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stage pipeline legend */}
        {!loading && !error && (
          <div className="rounded-2xl border border-[#3f2d1a] bg-[#0f0905] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#7a5e3e]">
              Stage Pipeline
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {STAGE_ORDER.map((stage, i) => {
                const s     = STAGE_STYLES[stage];
                const count = jobs.filter((j) => j.stage === stage).length;
                return (
                  <div key={stage} className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFilter(stage)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition hover:opacity-80 ${s.text} ${s.bg} ${s.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {STAGE_LABELS[stage]}
                      {count > 0 && (
                        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">
                          {count}
                        </span>
                      )}
                    </button>
                    {i < STAGE_ORDER.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-[#3f2d1a]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
