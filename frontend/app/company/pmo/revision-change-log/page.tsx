"use client";

import { useEffect, useMemo, useState } from "react";
import { getProjects, getSchedules, ProjectRow, ScheduleRow } from "@/app/services/projectControlService";
import {
  listScheduleRevisionLog,
  type PMORevisionLogRow,
} from "@/app/services/pmoScheduleApprovalService";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#a67652]";

export default function PMORevisionChangeLogPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [logs, setLogs] = useState<PMORevisionLogRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setSchedules([]);
      setSelectedScheduleId(null);
      setLogs([]);
      return;
    }
    void loadSchedules(selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId || !selectedScheduleId) {
      setLogs([]);
      return;
    }
    void loadLogs(selectedProjectId, selectedScheduleId);
  }, [selectedProjectId, selectedScheduleId]);

  async function loadProjects() {
    try {
      setLoadingProjects(true);
      setError("");
      const res = await getProjects();
      const projectRows = res.rows || [];
      setProjects(projectRows);
      if (projectRows.length) setSelectedProjectId(projectRows[0].id);
    } catch (err: any) {
      setError(err?.message || "Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }

  async function loadSchedules(projectId: number) {
    try {
      setLoadingSchedules(true);
      setError("");
      const res = await getSchedules(projectId);
      const scheduleRows = res.rows || [];
      setSchedules(scheduleRows);
      if (scheduleRows.length) setSelectedScheduleId(scheduleRows[0].id);
      else setSelectedScheduleId(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load schedules");
      setSchedules([]);
      setSelectedScheduleId(null);
    } finally {
      setLoadingSchedules(false);
    }
  }

  async function loadLogs(projectId: number, scheduleId: number) {
    try {
      setLoadingLogs(true);
      setError("");
      const res = await listScheduleRevisionLog(projectId, scheduleId);
      setLogs(res.rows || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load revision log");
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }

  const metrics = useMemo(() => {
    const total = logs.length;
    const latest = logs[0];
    const latestBaseline = latest ? `B${latest.baseline_no}` : "-";
    const snapshotRows = logs.reduce((sum, row) => sum + Number(row.row_count || 0), 0);
    return {
      total,
      latestBaseline,
      latestEventDate: latest?.created_at ? new Date(latest.created_at).toLocaleString() : "-",
      snapshotRows,
    };
  }, [logs]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-xl font-black text-slate-900">Revision &amp; Change Log</h3>
        <p className="mt-2 text-sm text-slate-600">
          Read-only revision records. Entries are auto-created when an approved baseline is revoked
          for editing.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Select Project
            </label>
            <select
              className={inputClass}
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingProjects}
            >
              {projects.length === 0 ? <option value="">No projects</option> : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_code} - {project.project_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Select Schedule
            </label>
            <select
              className={inputClass}
              value={selectedScheduleId || ""}
              onChange={(e) => setSelectedScheduleId(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingSchedules || !selectedProjectId}
            >
              {schedules.length === 0 ? <option value="">No schedules</option> : null}
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.schedule_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Log Entries" value={String(metrics.total)} />
        <MetricCard label="Latest Baseline" value={metrics.latestBaseline} />
        <MetricCard label="Latest Log Time" value={metrics.latestEventDate} />
        <MetricCard label="Snapshot Rows" value={String(metrics.snapshotRows)} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-base font-black text-slate-900">Revision Register (Read Only)</h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2">Baseline</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Status Transition</th>
                <th className="px-3 py-2">Rows</th>
                <th className="px-3 py-2">Created On</th>
                <th className="px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {loadingLogs ? (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-sm text-slate-600">
                    Loading revision logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-sm text-slate-600">
                    No revision logs found for the selected project and schedule.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <tr key={entry.id} className="border-t border-[#efe2d8] text-slate-900">
                    <td className="px-3 py-2 font-semibold">B{entry.baseline_no}</td>
                    <td className="px-3 py-2">{entry.event_type}</td>
                    <td className="px-3 py-2">
                      {entry.from_status} to {entry.to_status}
                    </td>
                    <td className="px-3 py-2">{entry.row_count || 0}</td>
                    <td className="px-3 py-2">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2">{entry.note || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}
