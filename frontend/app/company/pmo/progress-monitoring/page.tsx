"use client";

import { useEffect, useMemo, useState } from "react";
import { getProjects, ProjectRow } from "@/app/services/projectControlService";
import { getProjectPlannerRows } from "@/lib/pmoPlanner";
import type { PlannerRow } from "@/lib/pmoPlanner";

function dayDiff(from: string, to: string): number | null {
  if (!from || !to) return null;
  const a = new Date(`${from}T00:00:00Z`);
  const b = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PMOProgressMonitoringPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [rows, setRows] = useState<PlannerRow[]>([]);
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

  const metrics = useMemo(() => {
    const taskRows = rows.filter((row) => row.activityType !== "SUMMARY");
    let delayed = 0;
    let inProgress = 0;
    let completed = 0;
    let notStarted = 0;

    taskRows.forEach((row) => {
      const status = String(row.status || "").toUpperCase();
      if (status === "COMPLETED") completed += 1;
      else if (status === "ACTIVE") inProgress += 1;
      else notStarted += 1;

      const variance = row.baseline1Finish && row.finishDate ? dayDiff(row.baseline1Finish, row.finishDate) : null;
      if (variance != null && variance > 0) delayed += 1;
    });

    return {
      totalTasks: taskRows.length,
      delayed,
      inProgress,
      completed,
      notStarted,
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-xl font-black text-slate-900">Progress Monitoring</h3>
        <p className="mt-2 text-sm text-slate-600">
          Monitor schedule-linked execution progress from the unified Schedule Builder dataset.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#a67652]"
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
            Refresh
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total Tasks" value={metrics.totalTasks} />
        <MetricCard label="Delayed" value={metrics.delayed} tone="danger" />
        <MetricCard label="In Progress" value={metrics.inProgress} />
        <MetricCard label="Completed" value={metrics.completed} tone="good" />
        <MetricCard label="Not Started" value={metrics.notStarted} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-base font-black text-slate-900">Activity Progress Grid</h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[1100px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2">WBS</th>
                <th className="px-3 py-2">Activity</th>
                <th className="px-3 py-2">Segment</th>
                <th className="px-3 py-2">Plan Start</th>
                <th className="px-3 py-2">Plan Finish</th>
                <th className="px-3 py-2">Actual Start</th>
                <th className="px-3 py-2">Actual Finish</th>
                <th className="px-3 py-2">% Complete</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Delay (B1)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-3 text-sm text-slate-600">
                    No planning rows available for this project.
                  </td>
                </tr>
              ) : (
                rows
                  .filter((row) => row.activityType !== "SUMMARY")
                  .map((row) => {
                    const variance =
                      row.baseline1Finish && row.finishDate
                        ? dayDiff(row.baseline1Finish, row.finishDate)
                        : null;
                    return (
                      <tr key={row.uid} className="border-t border-[#efe2d8] text-slate-900">
                        <td className="px-3 py-2">{row.wbsCode}</td>
                        <td className="px-3 py-2">{row.activityName}</td>
                        <td className="px-3 py-2">{row.segment || "-"}</td>
                        <td className="px-3 py-2">{row.startDate || "-"}</td>
                        <td className="px-3 py-2">{row.finishDate || "-"}</td>
                        <td className="px-3 py-2">{row.actualStart || "-"}</td>
                        <td className="px-3 py-2">{row.actualFinish || "-"}</td>
                        <td className="px-3 py-2">{row.percentComplete}%</td>
                        <td className="px-3 py-2">{row.status}</td>
                        <td
                          className={
                            variance == null
                              ? "px-3 py-2"
                              : variance > 0
                                ? "px-3 py-2 font-bold text-red-700"
                                : variance < 0
                                  ? "px-3 py-2 font-bold text-emerald-700"
                                  : "px-3 py-2"
                          }
                        >
                          {variance == null ? "-" : variance}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
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
