import { apiRequest } from "@/lib/apiClient";
import type { ScheduleRow } from "@/app/services/projectControlService";

export type ProjectExecutionDprSummary = {
  source: "dashboard_api" | "task_progress" | "none";
  reporting_date: string;
  entries_today: number;
  draft_count: number;
  submitted_count: number;
  reviewed_count: number;
  approved_count: number;
  returned_count: number;
  pending_approval_count: number;
  missing_last_7_days: number;
  manpower_skilled: number;
  manpower_unskilled: number;
  manpower_total: number;
  machinery_hours: number;
  material_shortage_count: number;
  risk_hurdle_count: number;
  last_updated_at: string | null;
};

export type ProjectExecutionDprRegisterRow = {
  reporting_date: string;
  entries: number;
  draft_count: number;
  submitted_count: number;
  reviewed_count: number;
  approved_count: number;
  returned_count: number;
  manpower_skilled: number;
  manpower_unskilled: number;
  manpower_total: number;
  machinery_hours: number;
  material_shortage_count: number;
  risk_hurdle_count: number;
  last_updated_at: string | null;
};

export type ProjectExecutionDprInsights = {
  summary: ProjectExecutionDprSummary;
  register_rows: ProjectExecutionDprRegisterRow[];
  register_source: "dashboard_api" | "task_progress" | "none";
};

const EMPTY_SUMMARY: ProjectExecutionDprSummary = {
  source: "none",
  reporting_date: "",
  entries_today: 0,
  draft_count: 0,
  submitted_count: 0,
  reviewed_count: 0,
  approved_count: 0,
  returned_count: 0,
  pending_approval_count: 0,
  missing_last_7_days: 7,
  manpower_skilled: 0,
  manpower_unskilled: 0,
  manpower_total: 0,
  machinery_hours: 0,
  material_shortage_count: 0,
  risk_hurdle_count: 0,
  last_updated_at: null,
};

const MAX_SCHEDULES_FOR_PROGRESS = 6;
const MAX_TASKS_FOR_PROGRESS = 120;
const REGISTER_LOOKBACK_DAYS = 7;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateOnly(value: unknown): string | null {
  if (!value) return null;
  const dt = new Date(String(value));
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

function parseRows(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.entries)) return payload.entries;
  if (payload && typeof payload === "object" && (payload.entry_date || payload.date)) {
    return [payload];
  }
  return [];
}

function pickStatus(raw: unknown): string {
  const text = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  if (!text) return "SUBMITTED";
  if (text.includes("RETURN")) return "RETURNED";
  if (text.includes("REJECT")) return "RETURNED";
  if (text.includes("APPROV")) return "APPROVED";
  if (text.includes("REVIEW")) return "REVIEWED";
  if (text.includes("DRAFT")) return "DRAFT";
  if (text.includes("PENDING")) return "SUBMITTED";
  if (text.includes("SUBMIT")) return "SUBMITTED";
  return "SUBMITTED";
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function maxIso(a: string | null, b: unknown): string | null {
  const next = b ? String(b) : null;
  if (!next) return a;
  if (!a) return next;
  return next > a ? next : a;
}

function getDateSeries(endDate: string, days: number): string[] {
  const normalized = toDateOnly(endDate) || new Date().toISOString().slice(0, 10);
  const base = new Date(`${normalized}T00:00:00Z`);
  const out: string[] = [];
  for (let i = 0; i < days; i += 1) {
    const probe = new Date(base);
    probe.setUTCDate(base.getUTCDate() - i);
    out.push(probe.toISOString().slice(0, 10));
  }
  return out;
}

function createEmptyRegisterRow(date: string): ProjectExecutionDprRegisterRow {
  return {
    reporting_date: date,
    entries: 0,
    draft_count: 0,
    submitted_count: 0,
    reviewed_count: 0,
    approved_count: 0,
    returned_count: 0,
    manpower_skilled: 0,
    manpower_unskilled: 0,
    manpower_total: 0,
    machinery_hours: 0,
    material_shortage_count: 0,
    risk_hurdle_count: 0,
    last_updated_at: null,
  };
}

function buildEmptyRegisterRows(reportingDate: string): ProjectExecutionDprRegisterRow[] {
  return getDateSeries(reportingDate, REGISTER_LOOKBACK_DAYS).map((date) =>
    createEmptyRegisterRow(date)
  );
}

function hasSignalInRegisterRows(rows: ProjectExecutionDprRegisterRow[]): boolean {
  return rows.some(
    (row) =>
      row.entries > 0 ||
      row.draft_count > 0 ||
      row.submitted_count > 0 ||
      row.reviewed_count > 0 ||
      row.approved_count > 0 ||
      row.returned_count > 0 ||
      row.manpower_total > 0 ||
      row.machinery_hours > 0 ||
      row.material_shortage_count > 0 ||
      row.risk_hurdle_count > 0
  );
}

function aggregateRegisterRowsFromEntries(
  rows: any[],
  reportingDate: string
): ProjectExecutionDprRegisterRow[] {
  const dateSeries = getDateSeries(reportingDate, REGISTER_LOOKBACK_DAYS);
  const byDate = new Map<string, ProjectExecutionDprRegisterRow>();
  dateSeries.forEach((date) => {
    byDate.set(date, createEmptyRegisterRow(date));
  });

  rows.forEach((row) => {
    const date =
      toDateOnly(row.reporting_date) ||
      toDateOnly(row.entry_date) ||
      toDateOnly(row.date) ||
      toDateOnly(row.progress_date) ||
      toDateOnly(row.created_at) ||
      toDateOnly(row.updated_at);
    if (!date || !byDate.has(date)) return;

    const target = byDate.get(date);
    if (!target) return;

    const draftFromRow = toNumber(row.draft_count ?? row.draft ?? row.drafts);
    const submittedFromRow = toNumber(
      row.submitted_count ?? row.submitted ?? row.pending_review ?? row.pending
    );
    const reviewedFromRow = toNumber(row.reviewed_count ?? row.reviewed ?? row.under_review);
    const approvedFromRow = toNumber(row.approved_count ?? row.approved);
    const returnedFromRow = toNumber(row.returned_count ?? row.returned ?? row.rejected);

    const hasBucketCounts =
      draftFromRow + submittedFromRow + reviewedFromRow + approvedFromRow + returnedFromRow > 0;

    if (hasBucketCounts) {
      const rowEntries = toNumber(
        row.entries ??
          row.entry_count ??
          row.total_entries ??
          row.entries_today ??
          draftFromRow +
            submittedFromRow +
            reviewedFromRow +
            approvedFromRow +
            returnedFromRow
      );
      target.entries += rowEntries;
      target.draft_count += draftFromRow;
      target.submitted_count += submittedFromRow;
      target.reviewed_count += reviewedFromRow;
      target.approved_count += approvedFromRow;
      target.returned_count += returnedFromRow;
    } else {
      const rowWeight = Math.max(
        1,
        toNumber(row.count ?? row.entry_count ?? row.entries ?? row.total_entries ?? 1)
      );
      target.entries += rowWeight;
      const status = pickStatus(
        row.status || row.dpr_status || row.approval_status || row.workflow_status
      );
      if (status === "DRAFT") target.draft_count += rowWeight;
      else if (status === "REVIEWED") target.reviewed_count += rowWeight;
      else if (status === "APPROVED") target.approved_count += rowWeight;
      else if (status === "RETURNED") target.returned_count += rowWeight;
      else target.submitted_count += rowWeight;
    }

    target.manpower_skilled += toNumber(row.manpower_skilled ?? row.total_skilled);
    target.manpower_unskilled += toNumber(row.manpower_unskilled ?? row.total_unskilled);
    const rowManpowerTotal = toNumber(
      row.manpower_total ??
        row.total_manpower ??
        (toNumber(row.manpower_skilled) + toNumber(row.manpower_unskilled))
    );
    target.manpower_total += rowManpowerTotal;
    target.machinery_hours = round2(
      target.machinery_hours +
        toNumber(row.machinery_hours ?? row.equipment_hours ?? row.machine_hours)
    );

    const shortageCount = toNumber(row.material_shortage_count ?? row.material_alerts);
    if (shortageCount > 0) {
      target.material_shortage_count += shortageCount;
    } else {
      const materialIssue = String(
        row.material_status || row.material_issue || row.shortfall_reason_code || ""
      )
        .toLowerCase()
        .includes("material");
      if (materialIssue || row.material_shortage === true) {
        target.material_shortage_count += 1;
      }
    }

    const riskCount = toNumber(row.risk_hurdle_count ?? row.risk_count ?? row.hurdle_count);
    if (riskCount > 0) {
      target.risk_hurdle_count += riskCount;
    } else {
      const riskIssue =
        Boolean(row.shortfall_reason_code) ||
        Boolean(row.shortfall_notes) ||
        Boolean(row.risk_level) ||
        Boolean(row.hurdle);
      if (riskIssue) target.risk_hurdle_count += 1;
    }

    target.last_updated_at = maxIso(
      target.last_updated_at,
      row.updated_at || row.created_at || row.last_updated_at
    );
  });

  return dateSeries
    .map((date) => byDate.get(date) || createEmptyRegisterRow(date))
    .map((row) => ({
      ...row,
      manpower_total:
        row.manpower_total > 0
          ? row.manpower_total
          : row.manpower_skilled + row.manpower_unskilled,
    }));
}

function summarizeFromRegisterRows(
  reportingDate: string,
  registerRows: ProjectExecutionDprRegisterRow[],
  source: "dashboard_api" | "task_progress" | "none"
): ProjectExecutionDprSummary {
  const normalizedDate = toDateOnly(reportingDate) || reportingDate;
  const today = registerRows.find((row) => row.reporting_date === normalizedDate);
  const missingLast7Days = registerRows.filter((row) => row.entries === 0).length;
  const todayRow = today || createEmptyRegisterRow(normalizedDate);

  return {
    source,
    reporting_date: normalizedDate,
    entries_today: todayRow.entries,
    draft_count: todayRow.draft_count,
    submitted_count: todayRow.submitted_count,
    reviewed_count: todayRow.reviewed_count,
    approved_count: todayRow.approved_count,
    returned_count: todayRow.returned_count,
    pending_approval_count: todayRow.submitted_count + todayRow.reviewed_count,
    missing_last_7_days: missingLast7Days,
    manpower_skilled: todayRow.manpower_skilled,
    manpower_unskilled: todayRow.manpower_unskilled,
    manpower_total: todayRow.manpower_total,
    machinery_hours: todayRow.machinery_hours,
    material_shortage_count: todayRow.material_shortage_count,
    risk_hurdle_count: todayRow.risk_hurdle_count,
    last_updated_at: todayRow.last_updated_at,
  };
}

function mapSummaryFromPayload(
  payload: any,
  reportingDate: string
): ProjectExecutionDprSummary | null {
  if (!payload || typeof payload !== "object") return null;

  const data = payload.summary && typeof payload.summary === "object" ? payload.summary : payload;

  const entriesToday = toNumber(
    data.entries_today ?? data.today_entries ?? data.total_entries_today ?? data.total_today
  );

  const draftCount = toNumber(data.draft_count ?? data.draft ?? data.drafts);
  const submittedCount = toNumber(
    data.submitted_count ?? data.submitted ?? data.pending_review ?? data.pending
  );
  const reviewedCount = toNumber(data.reviewed_count ?? data.reviewed ?? data.under_review);
  const approvedCount = toNumber(data.approved_count ?? data.approved);
  const returnedCount = toNumber(data.returned_count ?? data.returned ?? data.rejected);
  const pendingApprovalCount = toNumber(
    data.pending_approval_count ??
      data.pending_approvals ??
      data.approval_pending ??
      data.pending_for_approval
  );

  const manpowerSkilled = toNumber(data.manpower_skilled ?? data.total_skilled);
  const manpowerUnskilled = toNumber(data.manpower_unskilled ?? data.total_unskilled);
  const manpowerTotal = toNumber(
    data.manpower_total ?? manpowerSkilled + manpowerUnskilled
  );
  const machineryHours = toNumber(
    data.machinery_hours ?? data.total_machinery_hours ?? data.equipment_hours
  );
  const materialShortageCount = toNumber(
    data.material_shortage_count ?? data.material_shortages ?? data.material_alerts
  );
  const riskHurdleCount = toNumber(
    data.risk_hurdle_count ?? data.risk_count ?? data.hurdle_count
  );

  const missingLast7Days = toNumber(
    data.missing_last_7_days ?? data.missing_dpr_last_7_days ?? data.missing_days
  );

  const updatedAt =
    data.last_updated_at || data.updated_at || data.latest_updated_at || null;

  const hasSignal =
    entriesToday > 0 ||
    draftCount > 0 ||
    submittedCount > 0 ||
    reviewedCount > 0 ||
    approvedCount > 0 ||
    returnedCount > 0 ||
    pendingApprovalCount > 0 ||
    manpowerTotal > 0 ||
    machineryHours > 0 ||
    materialShortageCount > 0 ||
    riskHurdleCount > 0 ||
    updatedAt;

  if (!hasSignal) return null;

  return {
    source: "dashboard_api",
    reporting_date: reportingDate,
    entries_today: entriesToday,
    draft_count: draftCount,
    submitted_count: submittedCount,
    reviewed_count: reviewedCount,
    approved_count: approvedCount,
    returned_count: returnedCount,
    pending_approval_count: pendingApprovalCount,
    missing_last_7_days: missingLast7Days,
    manpower_skilled: manpowerSkilled,
    manpower_unskilled: manpowerUnskilled,
    manpower_total: manpowerTotal,
    machinery_hours: machineryHours,
    material_shortage_count: materialShortageCount,
    risk_hurdle_count: riskHurdleCount,
    last_updated_at: updatedAt ? String(updatedAt) : null,
  };
}

async function tryFetchDprSummaryFromDashboardApi(
  projectId: number,
  reportingDate: string
): Promise<ProjectExecutionDprSummary | null> {
  const endpoints = [
    `/company/projects/${projectId}/dpr/dashboard?reporting_date=${reportingDate}`,
    `/company/projects/${projectId}/dpr/summary?date=${reportingDate}`,
    `/company/projects/${projectId}/dpr/status?date=${reportingDate}`,
    `/company/projects/${projectId}/dpr/register?date=${reportingDate}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await apiRequest<any>(endpoint);
      const mapped = mapSummaryFromPayload(payload, reportingDate);
      if (mapped) return mapped;
    } catch {
      continue;
    }
  }

  return null;
}

async function tryFetchDprRegisterFromDashboardApi(
  projectId: number,
  reportingDate: string
): Promise<ProjectExecutionDprRegisterRow[] | null> {
  const endpoints = [
    `/company/projects/${projectId}/dpr/register?date_to=${reportingDate}&days=${REGISTER_LOOKBACK_DAYS}`,
    `/company/projects/${projectId}/dpr/register?date=${reportingDate}`,
    `/company/projects/${projectId}/dpr/entries?date_to=${reportingDate}&days=${REGISTER_LOOKBACK_DAYS}`,
    `/company/projects/${projectId}/dpr/status-history?date=${reportingDate}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await apiRequest<any>(endpoint);
      const rows = parseRows(payload);
      if (!rows.length) continue;
      const aggregated = aggregateRegisterRowsFromEntries(rows, reportingDate);
      if (hasSignalInRegisterRows(aggregated)) return aggregated;
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchScheduleTasks(scheduleId: number): Promise<any[]> {
  try {
    const payload = await apiRequest<any>(`/schedules/${scheduleId}/tasks`);
    return parseRows(payload);
  } catch {
    return [];
  }
}

async function fetchTaskProgress(taskId: number): Promise<any[]> {
  try {
    const payload = await apiRequest<any>(`/tasks/${taskId}/progress`);
    return parseRows(payload).map((row) => ({ ...row, task_id: taskId }));
  } catch {
    return [];
  }
}

async function collectTaskProgressRows(schedules: ScheduleRow[]): Promise<any[]> {
  const scheduleIds = schedules.slice(0, MAX_SCHEDULES_FOR_PROGRESS).map((row) => row.id);
  if (!scheduleIds.length) return [];

  const tasksBySchedule = await Promise.all(scheduleIds.map((id) => fetchScheduleTasks(id)));
  const taskIds = Array.from(
    new Set(
      tasksBySchedule
        .flat()
        .map((row) => toNumber(row.id))
        .filter((id) => id > 0)
    )
  ).slice(0, MAX_TASKS_FOR_PROGRESS);

  if (!taskIds.length) return [];

  const progressByTask = await Promise.all(taskIds.map((taskId) => fetchTaskProgress(taskId)));
  return progressByTask.flat();
}

export async function getProjectExecutionDprInsights(
  projectId: number,
  reportingDate: string,
  schedules: ScheduleRow[]
): Promise<ProjectExecutionDprInsights> {
  const normalizedDate = toDateOnly(reportingDate) || reportingDate;

  const [dashboardSummary, dashboardRegister] = await Promise.all([
    tryFetchDprSummaryFromDashboardApi(projectId, normalizedDate),
    tryFetchDprRegisterFromDashboardApi(projectId, normalizedDate),
  ]);

  let registerRows =
    dashboardRegister && dashboardRegister.length
      ? dashboardRegister
      : buildEmptyRegisterRows(normalizedDate);
  let registerSource: "dashboard_api" | "task_progress" | "none" =
    dashboardRegister && dashboardRegister.length ? "dashboard_api" : "none";

  let fallbackTaskProgressRows: any[] | null = null;

  if (!dashboardRegister || !dashboardRegister.length || !dashboardSummary) {
    fallbackTaskProgressRows = await collectTaskProgressRows(schedules);
    if ((!dashboardRegister || !dashboardRegister.length) && fallbackTaskProgressRows.length) {
      registerRows = aggregateRegisterRowsFromEntries(fallbackTaskProgressRows, normalizedDate);
      registerSource = hasSignalInRegisterRows(registerRows) ? "task_progress" : "none";
    }
  }

  let summary = dashboardSummary;
  if (!summary) {
    if (registerSource !== "none" && hasSignalInRegisterRows(registerRows)) {
      summary = summarizeFromRegisterRows(
        normalizedDate,
        registerRows,
        registerSource === "dashboard_api" ? "dashboard_api" : "task_progress"
      );
    } else if (fallbackTaskProgressRows && fallbackTaskProgressRows.length) {
      const taskRegister = aggregateRegisterRowsFromEntries(
        fallbackTaskProgressRows,
        normalizedDate
      );
      summary = summarizeFromRegisterRows(normalizedDate, taskRegister, "task_progress");
      registerRows = taskRegister;
      registerSource = hasSignalInRegisterRows(taskRegister) ? "task_progress" : "none";
    }
  }

  return {
    summary: summary || { ...EMPTY_SUMMARY, reporting_date: normalizedDate },
    register_rows: registerRows,
    register_source: registerSource,
  };
}

export async function getProjectExecutionDprSummary(
  projectId: number,
  reportingDate: string,
  schedules: ScheduleRow[]
): Promise<ProjectExecutionDprSummary> {
  const insights = await getProjectExecutionDprInsights(projectId, reportingDate, schedules);
  return insights.summary;
}
