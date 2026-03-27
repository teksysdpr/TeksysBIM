"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquare, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { getAccessToken, getStoredUser } from "@/lib/storage";
import { getLandingPathFromAuthContext, resolveAuthCategory } from "@/lib/landing";
import {
  approveBaseline,
  listBaselineApprovalQueue,
  revokeBaseline,
  type PMOBaselineRow,
} from "@/app/services/pmoScheduleApprovalService";
import {
  approveScheduleImplementation,
  listScheduleImplementationRecords,
  rejectScheduleImplementation,
} from "@/app/services/scheduleImplementationService";
import type { ScheduleImplementationRecord } from "@/lib/scheduleImplementationTypes";

const statusClassMap: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
};

export default function ScheduleApprovalsPage() {
  const [rows, setRows] = useState<PMOBaselineRow[]>([]);
  const [implementationRows, setImplementationRows] = useState<ScheduleImplementationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [implementationLoading, setImplementationLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [implementationBusyId, setImplementationBusyId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revokeModalRow, setRevokeModalRow] = useState<PMOBaselineRow | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { window.location.href = "/login"; return; }

    const storedUser = getStoredUser() as { category?: string | null; role?: string | null } | null;
    const category = resolveAuthCategory({ category: storedUser?.category, role: storedUser?.role });

    if (!category || category !== "ADMIN") {
      const redirectPath = getLandingPathFromAuthContext({ category: storedUser?.category, role: storedUser?.role });
      window.alert("Access denied: Schedule approval is only for Company Admin.");
      window.location.href = redirectPath;
      return;
    }

    void loadQueue(statusFilter);
    void loadImplementationQueue();
  }, [statusFilter]);

  async function loadQueue(status: string) {
    try {
      setLoading(true);
      setError("");
      const res = await listBaselineApprovalQueue(status);
      setRows(res.rows || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load schedule approval queue");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadImplementationQueue() {
    try {
      setImplementationLoading(true);
      const res = await listScheduleImplementationRecords();
      setImplementationRows(res.rows || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load schedule implementation queue");
      setImplementationRows([]);
    } finally {
      setImplementationLoading(false);
    }
  }

  async function handleApprove(row: PMOBaselineRow) {
    try {
      setBusyId(row.id);
      setError("");
      await approveBaseline(row.id);
      setNotice(`Baseline B${row.baseline_no} approved.`);
      await loadQueue(statusFilter);
    } catch (err: any) {
      setError(err?.message || "Failed to approve baseline");
    } finally {
      setBusyId(null);
    }
  }

  function openRevokeAction(row: PMOBaselineRow) {
    const status = String(row.status || "").toUpperCase();
    const rrs = String(row.revoke_request_status || "NONE").toUpperCase();
    if (status === "APPROVED" && rrs === "PENDING") {
      setRevokeModalRow(row);
    } else {
      void handleRevokeConfirmed(row);
    }
  }

  async function handleRevokeConfirmed(row: PMOBaselineRow) {
    try {
      setBusyId(row.id);
      setError("");
      const statusBefore = String(row.status || "").toUpperCase();
      await revokeBaseline(row.id);
      setRevokeModalRow(null);
      setNotice(
        statusBefore === "APPROVED"
          ? `Revoke approved — Baseline B${row.baseline_no} moved back to Draft. PMO can now edit the schedule.`
          : `Baseline B${row.baseline_no} moved back to Draft.`
      );
      await loadQueue(statusFilter);
    } catch (err: any) {
      setError(err?.message || "Failed to approve revoke request");
    } finally {
      setBusyId(null);
    }
  }

  async function handleApproveImplementation(row: ScheduleImplementationRecord) {
    try {
      setImplementationBusyId(row.id);
      setError("");
      await approveScheduleImplementation(row.id, { actor: "Company Admin", note: "Final approval granted by Company Admin." });
      setNotice(`Schedule implementation for ${row.schedule_name || row.schedule_id} (B${row.baseline_no}) final approved.`);
      await loadImplementationQueue();
    } catch (err: any) {
      setError(err?.message || "Failed to final-approve schedule implementation");
    } finally {
      setImplementationBusyId(null);
    }
  }

  async function handleRejectImplementation(row: ScheduleImplementationRecord) {
    try {
      setImplementationBusyId(row.id);
      setError("");
      await rejectScheduleImplementation(row.id, { actor: "Company Admin", note: "Sent back for correction by Company Admin." });
      setNotice(`Schedule implementation for ${row.schedule_name || row.schedule_id} returned for correction.`);
      await loadImplementationQueue();
    } catch (err: any) {
      setError(err?.message || "Failed to reject schedule implementation");
    } finally {
      setImplementationBusyId(null);
    }
  }

  const metrics = useMemo(() => {
    let submitted = 0, approved = 0, draft = 0;
    rows.forEach((row) => {
      const s = String(row.status || "").toUpperCase();
      if (s === "SUBMITTED") submitted += 1;
      else if (s === "APPROVED") approved += 1;
      else if (s === "DRAFT") draft += 1;
    });
    return { total: rows.length, submitted, approved, draft };
  }, [rows]);

  const pendingRevokeRows = useMemo(
    () => rows.filter(
      (r) => String(r.status || "").toUpperCase() === "APPROVED" &&
             String(r.revoke_request_status || "NONE").toUpperCase() === "PENDING"
    ),
    [rows]
  );

  const implementationMetrics = useMemo(() => {
    let submitted = 0, approved = 0, rejected = 0, draft = 0;
    implementationRows.forEach((row) => {
      const s = String(row.status || "").toUpperCase();
      if (s === "SUBMITTED") submitted += 1;
      else if (s === "APPROVED") approved += 1;
      else if (s === "REJECTED") rejected += 1;
      else draft += 1;
    });
    return { total: implementationRows.length, submitted, approved, rejected, draft };
  }, [implementationRows]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-900">Schedule Approval Center</h3>
            <p className="mt-1 text-sm text-slate-600">
              Approve or revoke PMO baseline submissions from one queue.
            </p>
          </div>
          <Link href="/company/dashboard" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900">
            Back to Dashboard
          </Link>
        </div>
      </section>

      {/* Pending Revoke Alert Panel */}
      {!loading && pendingRevokeRows.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-600" />
            <h4 className="text-sm font-black text-amber-800">
              {pendingRevokeRows.length} Pending Revoke Request{pendingRevokeRows.length > 1 ? "s" : ""} — Action Required
            </h4>
          </div>
          <p className="mb-3 text-xs text-amber-700">
            The following pre-approved schedules have revoke requests submitted by the PMO team.
            Review the message and approve to move the schedule back to Draft for editing.
          </p>
          <div className="space-y-2">
            {pendingRevokeRows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    {row.project_name || `Project ${row.project_id}`} &mdash;{" "}
                    {row.schedule_name || `Schedule ${row.project_schedule_id}`} &mdash;{" "}
                    <span className="text-amber-700">B{row.baseline_no}</span>
                  </p>
                  {(row as any).revoke_request_note && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600 italic">
                      &ldquo;{(row as any).revoke_request_note}&rdquo;
                    </p>
                  )}
                  {(row as any).revoke_requested_at && (
                    <p className="mt-0.5 text-[11px] text-amber-600">
                      Requested: {new Date((row as any).revoke_requested_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setRevokeModalRow(row)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Review &amp; Approve Revoke
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Submitted" value={metrics.submitted} tone="info" />
        <MetricCard label="Approved" value={metrics.approved} tone="good" />
        <MetricCard label="Draft" value={metrics.draft} tone="warn" />
      </section>

      {/* Filter */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Status Filter</label>
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </section>

      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Baseline Queue */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-black text-slate-900">Baseline Approval Queue</h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[1020px] text-xs">
            <thead>
              <tr className="bg-slate-50 text-left font-bold uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Schedule</th>
                <th className="px-3 py-2">Baseline</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Revoke Request</th>
                <th className="px-3 py-2">Submitted At</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-4 text-sm text-slate-600">Loading approval queue...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-4 text-sm text-slate-600">No baseline records found for the selected filter.</td></tr>
              ) : rows.map((row) => {
                const status = String(row.status || "DRAFT").toUpperCase();
                const rrs = String(row.revoke_request_status || "NONE").toUpperCase();
                const statusClass = statusClassMap[status] || "bg-slate-100 text-slate-700";
                const isBusy = busyId === row.id;
                const canApprove = status === "SUBMITTED";
                const canRevoke = status === "SUBMITTED" || (status === "APPROVED" && rrs === "PENDING");
                const isPendingRevoke = status === "APPROVED" && rrs === "PENDING";
                return (
                  <tr key={row.id} className={`border-t border-[#efe2d8] text-slate-900${isPendingRevoke ? " bg-amber-50/40" : ""}`}>
                    <td className="px-3 py-2">{row.project_name || `Project ${row.project_id}`}</td>
                    <td className="px-3 py-2">{row.schedule_name || `Schedule ${row.project_schedule_id}`}</td>
                    <td className="px-3 py-2 font-semibold">B{row.baseline_no}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClass}`}>{status}</span>
                    </td>
                    <td className="px-3 py-2">
                      {rrs === "PENDING" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                          <MessageSquare className="h-3 w-3" /> Pending Review
                        </span>
                      ) : rrs === "APPROVED" ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">Approved</span>
                      ) : (
                        <span className="text-[11px] text-slate-600">None</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleApprove(row)} disabled={!canApprove || isBusy}
                          className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 disabled:opacity-50">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button type="button" onClick={() => openRevokeAction(row)} disabled={!canRevoke || isBusy}
                          className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold disabled:opacity-50 ${isPendingRevoke ? "border-amber-400 bg-amber-100 text-amber-800" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                          {isPendingRevoke ? <MessageSquare className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          {isPendingRevoke ? "Review Revoke" : "Revoke"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Final Approval Queue */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-lg font-black text-slate-900">Final Approval Queue</h3>
          <p className="mt-1 text-sm text-slate-600">Schedule implementation submissions from PMO after pre-approved baseline quantity seeding.</p>
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Total" value={implementationMetrics.total} />
          <MetricCard label="Submitted" value={implementationMetrics.submitted} tone="info" />
          <MetricCard label="Approved" value={implementationMetrics.approved} tone="good" />
          <MetricCard label="Rejected" value={implementationMetrics.rejected} tone="warn" />
          <MetricCard label="Draft" value={implementationMetrics.draft} />
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[1020px] text-xs">
            <thead>
              <tr className="bg-slate-50 text-left font-bold uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Schedule</th>
                <th className="px-3 py-2">Baseline</th>
                <th className="px-3 py-2">Implementation Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Submitted At</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {implementationLoading ? (
                <tr><td colSpan={7} className="px-3 py-4 text-sm text-slate-600">Loading final approval queue...</td></tr>
              ) : implementationRows.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-4 text-sm text-slate-600">No schedule implementation records available.</td></tr>
              ) : implementationRows.map((row) => {
                const status = String(row.status || "DRAFT").toUpperCase();
                const isBusy = implementationBusyId === row.id;
                const canApprove = status === "SUBMITTED";
                const statusClass = status === "APPROVED" ? "bg-emerald-100 text-emerald-700"
                  : status === "SUBMITTED" ? "bg-blue-100 text-blue-700"
                  : status === "REJECTED" ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-700";
                return (
                  <tr key={row.id} className="border-t border-[#efe2d8] text-slate-900">
                    <td className="px-3 py-2">{row.project_name || `Project ${row.project_id}`}</td>
                    <td className="px-3 py-2">{row.schedule_name || `Schedule ${row.schedule_id}`}</td>
                    <td className="px-3 py-2 font-semibold">B{row.baseline_no}</td>
                    <td className="px-3 py-2">{row.implementation_date || "-"}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClass}`}>{status}</span></td>
                    <td className="px-3 py-2">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleApproveImplementation(row)} disabled={!canApprove || isBusy}
                          className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 disabled:opacity-50">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Final Approve
                        </button>
                        <button type="button" onClick={() => handleRejectImplementation(row)} disabled={!canApprove || isBusy}
                          className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 disabled:opacity-50">
                          <RotateCcw className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Revoke Review Modal */}
      {revokeModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-amber-300 bg-white p-6 shadow-[0_24px_60px_rgba(18,9,5,0.4)]">
            <div className="mb-1 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-600" />
              <h4 className="text-lg font-black text-slate-900">Review Revoke Request</h4>
            </div>
            <p className="text-sm text-slate-600">
              The PMO team has requested to revoke this pre-approved schedule. Review their message
              and approve to move the schedule back to Draft for editing.
            </p>

            {/* Baseline info */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-900">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div><span className="font-bold uppercase tracking-wide text-slate-500">Project: </span>{revokeModalRow.project_name || `Project ${revokeModalRow.project_id}`}</div>
                <div><span className="font-bold uppercase tracking-wide text-slate-500">Baseline: </span>B{revokeModalRow.baseline_no}</div>
                <div className="col-span-2"><span className="font-bold uppercase tracking-wide text-slate-500">Schedule: </span>{revokeModalRow.schedule_name || `Schedule ${revokeModalRow.project_schedule_id}`}</div>
                {(revokeModalRow as any).revoke_requested_at && (
                  <div className="col-span-2">
                    <span className="font-bold uppercase tracking-wide text-slate-500">Requested At: </span>
                    {new Date((revokeModalRow as any).revoke_requested_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* PMO message */}
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">Message from PMO Team</p>
              {(revokeModalRow as any).revoke_request_note ? (
                <div className="min-h-[80px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-slate-900 whitespace-pre-wrap">
                  {(revokeModalRow as any).revoke_request_note}
                </div>
              ) : (
                <div className="flex min-h-[60px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm italic text-slate-400">
                  No message provided.
                </div>
              )}
            </div>

            {/* Outcome note */}
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Approving this request will move <strong>B{revokeModalRow.baseline_no}</strong> back to{" "}
              <strong>Draft</strong>. A revision log entry will be created and the PMO team will be
              able to edit and re-submit the schedule.
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setRevokeModalRow(null)} disabled={busyId === revokeModalRow.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#cdb8a8] bg-white px-4 py-2 text-xs font-semibold text-slate-900 disabled:opacity-50">
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </button>
              <button type="button" onClick={() => handleRevokeConfirmed(revokeModalRow)} disabled={busyId === revokeModalRow.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500 bg-gradient-to-b from-amber-400 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-[0_3px_0_#92400e] disabled:opacity-50">
                <RotateCcw className="h-3.5 w-3.5" />
                {busyId === revokeModalRow.id ? "Processing..." : "Approve Revoke — Move to Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "good" | "warn" | "info" }) {
  const toneClass = tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : tone === "info" ? "text-blue-700" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${toneClass}`}>{value}</p>
      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5" /> Admin Governance
      </div>
    </div>
  );
}
