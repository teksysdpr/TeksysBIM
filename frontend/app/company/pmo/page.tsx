"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  ClipboardCheck,
  FileText,
  History,
  Layers3,
  LineChart,
  Target,
  type LucideIcon
} from "lucide-react";
import { getProjects, ProjectRow } from "@/app/services/projectControlService";
import { getProjectPlannerRows } from "@/lib/pmoPlanner";
import type { PlannerRow } from "@/lib/pmoPlanner";
import { getStoredUser } from "@/lib/storage";
import { resolveAuthCategory } from "@/lib/landing";

function dayDiff(from: string, to: string): number | null {
  if (!from || !to) return null;
  const a = new Date(`${from}T00:00:00Z`);
  const b = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PMODashboardPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [rows, setRows] = useState<PlannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser() as
      | { category?: string | null; role?: string | null }
      | null;
    const category = resolveAuthCategory({
      category: storedUser?.category,
      role: storedUser?.role,
    });
    setIsCompanyAdmin(category === "ADMIN");
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const res = await getProjects();
      const projectRows = res.rows || [];
      setProjects(projectRows);
      const allRows = projectRows.flatMap((project) => getProjectPlannerRows(project.id));
      setRows(allRows);
    } catch (err: any) {
      setError(err?.message || "Failed to load PMO data");
    } finally {
      setLoading(false);
    }
  }

  const tileMetrics = useMemo(() => {
    const taskRows = rows.filter((row) => row.activityType !== "SUMMARY");
    const today = new Date().toISOString().slice(0, 10);
    const revisedActivities = taskRows.filter((row) => row.baseline2Finish || row.baseline3Finish).length;

    const delayed = taskRows.filter((row) => {
      const variance = row.baseline1Finish && row.finishDate ? dayDiff(row.baseline1Finish, row.finishDate) : null;
      return variance != null && variance > 0;
    }).length;
    const inProgress = taskRows.filter((row) => String(row.status || "").toUpperCase() === "ACTIVE").length;
    const milestoneRisk = taskRows.filter((row) => {
      if (row.activityType !== "MILESTONE") return false;
      if (!row.finishDate) return false;
      if (String(row.status || "").toUpperCase() === "COMPLETED") return false;
      const delta = dayDiff(today, row.finishDate);
      return delta != null && delta >= 0 && delta <= 7;
    }).length;
    const baselineReady = taskRows.filter((row) => !!row.baseline1Finish).length;

    return {
      schedule: {
        totalActivities: taskRows.length,
        baselineReady,
        revisedActivities,
      },
      monitoring: {
        delayed,
        inProgress,
        milestoneRisk,
      },
      reports: {
        projects: projects.length,
        totalRows: taskRows.length,
        delayed,
      },
      revision: {
        changesToday: 0,
        totalRevisions: revisedActivities,
        lastUpdate: "-",
      },
    };
  }, [rows, projects.length]);

  const summaryCards = useMemo<
    Array<{ title: string; value: number; helper: string; icon: LucideIcon }>
  >(
    () => [
      {
        title: "Total Projects",
        value: projects.length,
        helper: "Planning scope",
        icon: CalendarRange,
      },
      {
        title: "Total Activities",
        value: tileMetrics.schedule.totalActivities,
        helper: "Planner workload",
        icon: Layers3,
      },
      {
        title: "In Progress",
        value: tileMetrics.monitoring.inProgress,
        helper: "Active execution",
        icon: Activity,
      },
      {
        title: "Delayed Activities",
        value: tileMetrics.monitoring.delayed,
        helper: "Need recovery",
        icon: AlertTriangle,
      },
      {
        title: "Milestones At Risk",
        value: tileMetrics.monitoring.milestoneRisk,
        helper: "Due in 7 days",
        icon: Target,
      },
      {
        title: "Revised Activities",
        value: tileMetrics.revision.totalRevisions,
        helper: "Baseline 2/3",
        icon: History,
      },
    ],
    [projects.length, tileMetrics]
  );

  return (
    <div className="space-y-6">
      {isCompanyAdmin ? (
        <section className="flex flex-wrap items-center gap-2">
          <Link
            href="/company/dashboard"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-white"
          >
            Back to Company Dashboard
          </Link>
          <Link
            href="/company/project-team"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-white"
          >
            Go to Project Portfolio
          </Link>
        </section>
      ) : null}

      <section className="relative overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-br from-[#0B1120]/95 via-[#172554]/90 to-[#0F172A]/95 p-6 text-white shadow-[0_22px_58px_rgba(15,23,42,0.22)] md:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#f0c98f]/15 blur-2xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-wide text-[#fff5e8] md:text-4xl">
              PMO Dashboard
            </h1>
            <p className="max-w-3xl text-sm text-white/85 md:text-base">
              Central planning control workspace with KPI visibility and five focused PMO modules.
            </p>
          </div>
          <Link
            href="/company/pmo/schedule-builder"
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20 lg:self-auto"
          >
            Open Schedule Builder
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="group rounded-2xl border border-[#e7d4c6] bg-white p-4 shadow-[0_10px_28px_rgba(32,15,8,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(32,15,8,0.28)]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="rounded-xl bg-slate-900 p-2 text-white">
                <card.icon className="h-4 w-4" />
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500/80">
                {card.helper}
              </div>
            </div>

            <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {card.title}
            </div>
            <div className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">
              {card.value.toLocaleString()}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(32,15,8,0.2)] md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black tracking-wide text-slate-900">PMO Modules</h2>
          <span className="rounded-full border border-[#d8c1ae] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
            5 modules
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <TileCard
            icon={CalendarRange}
            title="Schedule Builder"
            description="MSP-style inline schedule creation and control."
            metrics={[
              `Total Activities: ${tileMetrics.schedule.totalActivities}`,
              `Baseline Ready: ${tileMetrics.schedule.baselineReady}`,
              `Revised Activities: ${tileMetrics.schedule.revisedActivities}`,
            ]}
            href="/company/pmo/schedule-builder"
            disabled={loading}
          />

          <TileCard
            icon={ClipboardCheck}
            title="Schedule Implementation"
            description="Capture completed qty before go-live and submit for final approval."
            metrics={[
              `Baseline Ready Activities: ${tileMetrics.schedule.baselineReady}`,
              `Projects in Scope: ${tileMetrics.reports.projects}`,
              "Final Approval Queue: Track in Admin",
            ]}
            href="/company/pmo/schedule-implementation"
            disabled={loading}
          />

          <TileCard
            icon={LineChart}
            title="Progress Monitoring"
            description="Planned vs actual monitoring and slippage control."
            metrics={[
              `Delayed Activities: ${tileMetrics.monitoring.delayed}`,
              `In Progress: ${tileMetrics.monitoring.inProgress}`,
              `Milestones at Risk: ${tileMetrics.monitoring.milestoneRisk}`,
            ]}
            href="/company/pmo/progress-monitoring"
            disabled={loading}
          />

          <TileCard
            icon={FileText}
            title="Reports"
            description="Planning, baseline, variance, and output reports."
            metrics={[
              `Projects: ${tileMetrics.reports.projects}`,
              `Report Rows: ${tileMetrics.reports.totalRows}`,
              `Delayed Report Items: ${tileMetrics.reports.delayed}`,
            ]}
            href="/company/pmo/planning-reports"
            disabled={loading}
          />

          <TileCard
            icon={History}
            title="Revision & Change Log"
            description="Revision history and planning traceability."
            metrics={[
              `Changes Today: ${tileMetrics.revision.changesToday}`,
              `Total Revisions: ${tileMetrics.revision.totalRevisions}`,
              `Last Update: ${tileMetrics.revision.lastUpdate}`,
            ]}
            href="/company/pmo/revision-change-log"
            disabled={loading}
          />
        </div>
      </section>
    </div>
  );
}

function TileCard({
  icon: Icon,
  title,
  description,
  metrics,
  href,
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  metrics: string[];
  href: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div className="inline-flex rounded-xl bg-[#f4e5d9] p-2 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <h4 className="mt-3 text-base font-black text-slate-900">{title}</h4>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <div className="mt-3 grid gap-1">
        {metrics.map((metric) => (
          <p key={metric} className="text-xs font-semibold text-[#6d4b37]">
            {metric}
          </p>
        ))}
      </div>
      <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#6d4b37]">
        Open Module
        <ArrowRight className="h-3.5 w-3.5" />
      </p>
    </>
  );

  if (disabled) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 opacity-75">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-[#e7d4c6] bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#14B8A6]" />
      {content}
    </Link>
  );
}
