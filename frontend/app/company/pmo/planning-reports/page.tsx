"use client";

import { useEffect, useMemo, useState } from "react";
import { getProjects, ProjectRow } from "@/app/services/projectControlService";
import { getProjectPlannerRows } from "@/lib/pmoPlanner";
import type { PlannerRow } from "@/lib/pmoPlanner";

type ReportTab =
  | "planning"
  | "monitoring"
  | "baseline"
  | "lookahead"
  | "export";

const tabs: Array<{ id: ReportTab; label: string }> = [
  { id: "planning", label: "Planning Reports" },
  { id: "monitoring", label: "Monitoring Reports" },
  { id: "baseline", label: "Baseline Reports" },
  { id: "lookahead", label: "Look-Ahead Reports" },
  { id: "export", label: "Export Center" },
];

function dayDiff(from: string, to: string): number | null {
  if (!from || !to) return null;
  const a = new Date(`${from}T00:00:00Z`);
  const b = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PMOPlanningReportsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [rows, setRows] = useState<PlannerRow[]>([]);
  const [activeTab, setActiveTab] = useState<ReportTab>("planning");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setRows([]);
      return;
    }
    setRows(getProjectPlannerRows(selectedProjectId));
  }, [selectedProjectId]);

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");
      const res = await getProjects();
      const list = res.rows || [];
      setProjects(list);
      if (list.length) setSelectedProjectId(list[0].id);
    } catch (err: any) {
      setError(err?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  const taskRows = useMemo(() => rows.filter((row) => row.activityType !== "SUMMARY"), [rows]);

  const reportMetrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const delayed = taskRows.filter((row) => {
      const variance = row.baseline1Finish && row.finishDate ? dayDiff(row.baseline1Finish, row.finishDate) : null;
      return variance != null && variance > 0;
    }).length;
    const notStarted = taskRows.filter(
      (row) => !["ACTIVE", "COMPLETED"].includes(String(row.status || "").toUpperCase())
    ).length;
    const inProgress = taskRows.filter((row) => String(row.status || "").toUpperCase() === "ACTIVE").length;
    const completed = taskRows.filter((row) => String(row.status || "").toUpperCase() === "COMPLETED").length;
    const lookAhead = taskRows.filter((row) => {
      if (!row.finishDate || String(row.status || "").toUpperCase() === "COMPLETED") return false;
      const delta = dayDiff(today, row.finishDate);
      return delta != null && delta >= 0 && delta <= 15;
    }).length;
    return { delayed, notStarted, inProgress, completed, lookAhead };
  }, [taskRows]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-xl font-black text-slate-900">Reports</h3>
        <p className="mt-2 text-sm text-slate-600">
          Unified PMO reporting workspace combining planning, monitoring, baseline, variance, DPR,
          and target-oriented report views.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={selectedProjectId || ""}
            onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
            disabled={loading}
          >
            {projects.length === 0 ? <option value="">No projects</option> : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.project_code} - {project.project_name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => selectedProjectId && setRows(getProjectPlannerRows(selectedProjectId))}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
          >
            Refresh Report Data
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Delayed" value={reportMetrics.delayed} tone="danger" />
        <MetricCard label="In Progress" value={reportMetrics.inProgress} />
        <MetricCard label="Completed" value={reportMetrics.completed} tone="good" />
        <MetricCard label="Not Started" value={reportMetrics.notStarted} />
        <MetricCard label="Look-Ahead (15d)" value={reportMetrics.lookAhead} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? "rounded border border-[#6d4b37] bg-[#6d4b37] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white"
                  : "rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-900"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        {activeTab === "planning" ? (
          <ReportTable
            title="Planning Report"
            headers={["WBS", "Activity", "Segment", "Duration", "Start", "Finish", "Predecessors"]}
            rows={taskRows.map((row) => [
              row.wbsCode,
              row.activityName,
              row.segment || "-",
              String(row.durationDays),
              row.startDate || "-",
              row.finishDate || "-",
              row.predecessors || "-",
            ])}
          />
        ) : null}

        {activeTab === "monitoring" ? (
          <ReportTable
            title="Monitoring Report"
            headers={["WBS", "Activity", "Status", "% Complete", "Actual Start", "Actual Finish"]}
            rows={taskRows.map((row) => [
              row.wbsCode,
              row.activityName,
              row.status,
              `${row.percentComplete}%`,
              row.actualStart || "-",
              row.actualFinish || "-",
            ])}
          />
        ) : null}

        {activeTab === "baseline" ? (
          <ReportTable
            title="Baseline Comparison Report (B1)"
            headers={["WBS", "Activity", "B1 Finish", "Current Finish", "Variance (Days)"]}
            rows={taskRows.map((row) => {
              const variance =
                row.baseline1Finish && row.finishDate ? dayDiff(row.baseline1Finish, row.finishDate) : null;
              return [
                row.wbsCode,
                row.activityName,
                row.baseline1Finish || "-",
                row.finishDate || "-",
                variance == null ? "-" : String(variance),
              ];
            })}
          />
        ) : null}

        {activeTab === "lookahead" ? (
          <ReportTable
            title="Look-Ahead Report (15 Days)"
            headers={["WBS", "Activity", "Finish Date", "Status"]}
            rows={taskRows
              .filter((row) => {
                if (!row.finishDate || String(row.status || "").toUpperCase() === "COMPLETED") return false;
                const delta = dayDiff(new Date().toISOString().slice(0, 10), row.finishDate);
                return delta != null && delta >= 0 && delta <= 15;
              })
              .map((row) => [row.wbsCode, row.activityName, row.finishDate || "-", row.status])}
          />
        ) : null}

        {activeTab === "export" ? (
          <div className="space-y-3">
            <h4 className="text-base font-black text-slate-900">Export Center</h4>
            <p className="text-sm text-slate-600">
              Export actions are currently prepared at UI level. Next backend step: generate Excel,
              PDF, and print-ready report files from this dataset.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <button className="rounded border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                Export Excel
              </button>
              <button className="rounded border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                Export PDF
              </button>
              <button className="rounded border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                Print View
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "good" | "danger";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-700"
      : tone === "danger"
        ? "text-red-700"
        : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function ReportTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-base font-black text-slate-900">{title}</h4>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
              {headers.map((header) => (
                <th key={header} className="px-3 py-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-3 py-3 text-sm text-slate-600">
                  No records available for this report.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-[#efe2d8] text-slate-900">
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
