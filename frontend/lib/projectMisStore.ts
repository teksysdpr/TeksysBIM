import { promises as fs } from "fs";
import path from "path";
import {
  applyDailyLineCalculations,
  applyMasterCalculations,
} from "@/lib/projectMisCalculator";
import type {
  MisStatus,
  ProjectMisDailyLineInput,
  ProjectMisDailyListFilters,
  ProjectMisDailyReport,
  ProjectMisDailyReportInput,
  ProjectMisDailyReportLine,
  ProjectMisMasterInputRow,
  ProjectMisMasterListFilters,
  ProjectMisMasterRow,
  ProjectMisStore,
} from "@/lib/projectMisTypes";

const STORE_DIR = "/tmp/dpr-web-data";
const STORE_FILE = path.join(STORE_DIR, "project-mis.json");
const DEFAULT_STORE: ProjectMisStore = {
  master_sequence: 0,
  daily_sequence: 0,
  daily_line_sequence: 0,
  masters: [],
  daily_reports: [],
};

let writeChain: Promise<unknown> = Promise.resolve();

type ErrorCode = "VALIDATION" | "DUPLICATE" | "NOT_FOUND" | "READ_ONLY" | "BAD_REQUEST";

export class ProjectMisStoreError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function monthFromDate(date: string): string {
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function normalizeStatus(value: unknown): MisStatus {
  const status = String(value || "")
    .trim()
    .toLowerCase();
  if (status === "submitted") return "submitted";
  if (status === "approved") return "approved";
  return "draft";
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function ensureStoreFile() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
  }
}

async function readStore(): Promise<ProjectMisStore> {
  await ensureStoreFile();
  const raw = await fs.readFile(STORE_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as ProjectMisStore;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.masters) ||
      !Array.isArray(parsed.daily_reports)
    ) {
      return { ...DEFAULT_STORE };
    }
    return parsed;
  } catch {
    return { ...DEFAULT_STORE };
  }
}

async function writeStore(store: ProjectMisStore) {
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

async function withStoreWrite<T>(handler: (store: ProjectMisStore) => Promise<T>): Promise<T> {
  const task = writeChain.then(async () => {
    const store = await readStore();
    const result = await handler(store);
    await writeStore(store);
    return result;
  });
  writeChain = task.catch(() => undefined);
  return task;
}

function validateMasterRows(rows: Array<Partial<ProjectMisMasterInputRow>>) {
  const errors: string[] = [];
  rows.forEach((row, idx) => {
    const label = `Row ${idx + 1}`;
    if (!String(row.sub_activity || "").trim()) {
      errors.push(`${label}: Sub-activity is required.`);
    }
    if (toNumber(row.project_qty) < 0) {
      errors.push(`${label}: Project qty cannot be negative.`);
    }
    if (row.revised_start_date && row.revised_end_date) {
      if (new Date(row.revised_end_date) < new Date(row.revised_start_date)) {
        errors.push(`${label}: Revised end date cannot be before revised start date.`);
      }
    }
    if (row.actual_start_date && row.actual_end_date) {
      if (new Date(row.actual_end_date) < new Date(row.actual_start_date)) {
        errors.push(`${label}: Actual end date cannot be before actual start date.`);
      }
    }
  });
  return errors;
}

function validateDailyInput(input: ProjectMisDailyReportInput) {
  const errors: string[] = [];
  if (!input.project_id || input.project_id <= 0) errors.push("Project is required.");
  if (!String(input.report_date || "").trim()) errors.push("Report date is required.");
  if (!String(input.schedule_id || "").trim()) errors.push("Schedule is required.");
  input.lines.forEach((line, idx) => {
    const label = `Line ${idx + 1}`;
    if (toNumber(line.done_today) < 0) {
      errors.push(`${label}: Done today must be non-negative.`);
    }
  });
  return errors;
}

function getNextMasterId(store: ProjectMisStore): number {
  store.master_sequence += 1;
  return store.master_sequence;
}

function getNextDailyId(store: ProjectMisStore): number {
  store.daily_sequence += 1;
  return store.daily_sequence;
}

function getNextDailyLineId(store: ProjectMisStore): number {
  store.daily_line_sequence += 1;
  return store.daily_line_sequence;
}

function toMasterInputRow(row: Partial<ProjectMisMasterInputRow>): ProjectMisMasterInputRow {
  return {
    activity: String(row.activity || "").trim(),
    sub_activity: String(row.sub_activity || "").trim(),
    msp_start_date: String(row.msp_start_date || ""),
    msp_end_date: String(row.msp_end_date || ""),
    revised_start_date: String(row.revised_start_date || ""),
    revised_end_date: String(row.revised_end_date || ""),
    actual_start_date: String(row.actual_start_date || ""),
    actual_end_date: String(row.actual_end_date || ""),
    unit: String(row.unit || "").trim(),
    project_qty: toNumber(row.project_qty),
    total_qty_done_till_last_month: toNumber(row.total_qty_done_till_last_month),
    monthly_target_taken: toNumber(row.monthly_target_taken),
    schedule_id: String(row.schedule_id || ""),
  };
}

function toDailyLineRecord(
  store: ProjectMisStore,
  dailyReportId: number,
  srNo: number,
  input: ProjectMisDailyLineInput,
  existingLine?: ProjectMisDailyReportLine
): ProjectMisDailyReportLine {
  const now = nowIso();
  const perDayTarget = toNumber(input.per_day_target);
  const doneToday = toNumber(input.done_today);
  const calc = applyDailyLineCalculations({
    ...(existingLine as ProjectMisDailyReportLine),
    id: existingLine?.id || 0,
    daily_report_id: dailyReportId,
    master_activity_id: input.master_activity_id,
    sr_no: srNo,
    sub_activity: String(input.sub_activity || ""),
    unit: String(input.unit || ""),
    per_day_target: perDayTarget,
    done_today: doneToday,
    reason_for_poor_output_today: String(input.reason_for_poor_output_today || ""),
    specify_reasons_in_detail: String(input.specify_reasons_in_detail || ""),
    available_skilled_manpower_on_site: toNumber(input.available_skilled_manpower_on_site),
    additional_skilled_manpower_requirement: toNumber(input.additional_skilled_manpower_requirement),
    created_at: existingLine?.created_at || now,
    updated_at: now,
  });
  return {
    id: existingLine?.id || getNextDailyLineId(store),
    daily_report_id: dailyReportId,
    master_activity_id: input.master_activity_id,
    sr_no: srNo,
    sub_activity: String(input.sub_activity || ""),
    unit: String(input.unit || ""),
    per_day_target: perDayTarget,
    done_today: doneToday,
    deviation: calc.deviation,
    days_performance: calc.days_performance,
    reason_for_poor_output_today: String(input.reason_for_poor_output_today || ""),
    specify_reasons_in_detail: String(input.specify_reasons_in_detail || ""),
    available_skilled_manpower_on_site: toNumber(input.available_skilled_manpower_on_site),
    additional_skilled_manpower_requirement: toNumber(input.additional_skilled_manpower_requirement),
    created_at: existingLine?.created_at || now,
    updated_at: now,
  };
}

function filterDailyReports(
  reports: ProjectMisDailyReport[],
  filters: ProjectMisDailyListFilters
): ProjectMisDailyReport[] {
  const normalizedStatus = filters.status ? normalizeStatus(filters.status) : null;
  return reports.filter((row) => {
    if (typeof filters.project_id === "number" && row.project_id !== filters.project_id) return false;
    if (filters.schedule_id && row.schedule_id !== filters.schedule_id) return false;
    if (filters.report_date && row.report_date !== filters.report_date) return false;
    if (normalizedStatus && row.status !== normalizedStatus) return false;
    return true;
  });
}

function mapDailyReportForList(
  row: ProjectMisDailyReport,
  includeLines: boolean
): ProjectMisDailyReport {
  if (includeLines) return row;
  return {
    ...row,
    lines: [],
  };
}

function syncMasterRowsFor(
  store: ProjectMisStore,
  projectId: number,
  scheduleId: string,
  referenceDate?: string
) {
  const dailyReports = store.daily_reports.filter(
    (row) => row.project_id === projectId && row.schedule_id === scheduleId
  );
  store.masters = store.masters.map((row) => {
    if (row.project_id !== projectId || row.schedule_id !== scheduleId) return row;
    return applyMasterCalculations(
      {
        activity: row.activity,
        sub_activity: row.sub_activity,
        msp_start_date: row.msp_start_date,
        msp_end_date: row.msp_end_date,
        revised_start_date: row.revised_start_date,
        revised_end_date: row.revised_end_date,
        actual_start_date: row.actual_start_date,
        actual_end_date: row.actual_end_date,
        unit: row.unit,
        project_qty: row.project_qty,
        total_qty_done_till_last_month: row.total_qty_done_till_last_month,
        monthly_target_taken: row.monthly_target_taken,
        schedule_id: row.schedule_id,
      },
      {
        id: row.id,
        project_id: row.project_id,
        schedule_id: row.schedule_id,
        sr_no: row.sr_no,
        created_at: row.created_at,
        updated_at: nowIso(),
        daily_reports: dailyReports,
        reference_date: referenceDate,
      }
    );
  });
}

export async function listProjectMisMasterRows(filters: ProjectMisMasterListFilters = {}) {
  const store = await readStore();
  const rows = store.masters
    .filter((row) => {
      if (typeof filters.project_id === "number" && row.project_id !== filters.project_id) return false;
      if (filters.schedule_id && row.schedule_id !== filters.schedule_id) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.project_id !== b.project_id) return a.project_id - b.project_id;
      if (a.schedule_id !== b.schedule_id) return a.schedule_id.localeCompare(b.schedule_id);
      return a.sr_no - b.sr_no;
    });

  return {
    ok: true,
    total: rows.length,
    rows,
  };
}

export async function saveProjectMisMasterRows(payload: {
  project_id: number;
  schedule_id: string;
  rows: Array<Partial<ProjectMisMasterInputRow> & { id?: number | null }>;
  reference_date?: string;
}) {
  return withStoreWrite(async (store) => {
    const projectId = Number(payload.project_id);
    const scheduleId = String(payload.schedule_id || "").trim();
    if (!Number.isFinite(projectId) || projectId <= 0) {
      throw new ProjectMisStoreError("VALIDATION", "Project is required.");
    }
    if (!scheduleId) {
      throw new ProjectMisStoreError("VALIDATION", "Schedule is required.");
    }

    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const validationErrors = validateMasterRows(rows);
    if (validationErrors.length) {
      throw new ProjectMisStoreError("VALIDATION", validationErrors.join(" "));
    }

    const now = nowIso();
    const existing = store.masters.filter(
      (row) => row.project_id === projectId && row.schedule_id === scheduleId
    );
    const existingMap = new Map<number, ProjectMisMasterRow>();
    existing.forEach((row) => existingMap.set(row.id, row));

    const dailyReports = store.daily_reports.filter(
      (report) => report.project_id === projectId && report.schedule_id === scheduleId
    );

    const nextRows: ProjectMisMasterRow[] = rows.map((row, idx) => {
      const input = toMasterInputRow(row);
      const rowId = Number(row.id);
      const existingRow = Number.isFinite(rowId) && rowId > 0 ? existingMap.get(rowId) : undefined;
      const id = existingRow?.id || getNextMasterId(store);
      const createdAt = existingRow?.created_at || now;
      return applyMasterCalculations(input, {
        id,
        project_id: projectId,
        schedule_id: scheduleId,
        sr_no: idx + 1,
        created_at: createdAt,
        updated_at: now,
        daily_reports: dailyReports,
        reference_date: payload.reference_date,
      });
    });

    store.masters = store.masters.filter(
      (row) => !(row.project_id === projectId && row.schedule_id === scheduleId)
    );
    store.masters.push(...nextRows);

    return {
      ok: true,
      total: nextRows.length,
      rows: nextRows,
    };
  });
}

export async function listProjectMisDailyReports(filters: ProjectMisDailyListFilters = {}) {
  const store = await readStore();
  const rows = filterDailyReports(store.daily_reports, filters)
    .sort((a, b) => {
      if (a.report_date !== b.report_date) return a.report_date < b.report_date ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    })
    .map((row) => mapDailyReportForList(row, Boolean(filters.include_lines)));

  return {
    ok: true,
    total: rows.length,
    rows,
  };
}

export async function getProjectMisDailyReportById(id: number): Promise<ProjectMisDailyReport> {
  const store = await readStore();
  const row = store.daily_reports.find((item) => item.id === id);
  if (!row) throw new ProjectMisStoreError("NOT_FOUND", "Daily MIS report not found.");
  return row;
}

export async function saveProjectMisDailyReport(
  payload: ProjectMisDailyReportInput
): Promise<ProjectMisDailyReport> {
  return withStoreWrite(async (store) => {
    const errors = validateDailyInput(payload);
    if (errors.length) {
      throw new ProjectMisStoreError("VALIDATION", errors.join(" "));
    }

    const reportDate = String(payload.report_date || "").slice(0, 10);
    const reportMonth = payload.report_month || monthFromDate(reportDate);
    if (!reportMonth) {
      throw new ProjectMisStoreError("VALIDATION", "Invalid report date.");
    }

    const existingByUnique = store.daily_reports.find(
      (row) =>
        row.project_id === payload.project_id &&
        row.schedule_id === payload.schedule_id &&
        row.report_date === reportDate
    );

    const providedId = Number(payload.id || 0);
    const existing = Number.isFinite(providedId) && providedId > 0
      ? store.daily_reports.find((row) => row.id === providedId) || null
      : existingByUnique || null;

    if (!existing && existingByUnique) {
      throw new ProjectMisStoreError(
        "DUPLICATE",
        "MIS report already exists for selected project, schedule, and date."
      );
    }
    if (existing?.status === "submitted" || existing?.status === "approved") {
      throw new ProjectMisStoreError("READ_ONLY", "Submitted MIS report is read-only.");
    }

    const now = nowIso();
    const reportId = existing?.id || getNextDailyId(store);
    const status = normalizeStatus(payload.status || "draft");
    const lines = (Array.isArray(payload.lines) ? payload.lines : []).map((line, idx) => {
      const existingLine = existing?.lines.find((row) => row.id === Number((line as any).id || 0));
      return toDailyLineRecord(store, reportId, idx + 1, line, existingLine);
    });

    const nextReport: ProjectMisDailyReport = {
      id: reportId,
      project_id: payload.project_id,
      project_name: String(payload.project_name || ""),
      schedule_id: String(payload.schedule_id || ""),
      schedule_name: String(payload.schedule_name || ""),
      report_date: reportDate,
      report_month: reportMonth,
      building_or_tower: String(payload.building_or_tower || ""),
      status,
      created_by: String(payload.created_by || existing?.created_by || "planning_team"),
      approved_by: String(payload.approved_by || existing?.approved_by || ""),
      lines,
      created_at: existing?.created_at || now,
      updated_at: now,
    };

    if (existing) {
      const index = store.daily_reports.findIndex((row) => row.id === existing.id);
      if (index >= 0) store.daily_reports[index] = nextReport;
      else store.daily_reports.push(nextReport);
    } else {
      store.daily_reports.push(nextReport);
    }

    syncMasterRowsFor(store, nextReport.project_id, nextReport.schedule_id, nextReport.report_date);
    return nextReport;
  });
}

export async function submitProjectMisDailyReport(id: number, approvedBy = "") {
  return withStoreWrite(async (store) => {
    const index = store.daily_reports.findIndex((row) => row.id === id);
    if (index < 0) {
      throw new ProjectMisStoreError("NOT_FOUND", "Daily MIS report not found.");
    }
    const now = nowIso();
    const current = store.daily_reports[index];
    const next: ProjectMisDailyReport = {
      ...current,
      status: "submitted",
      approved_by: String(approvedBy || current.approved_by || ""),
      updated_at: now,
    };
    store.daily_reports[index] = next;

    syncMasterRowsFor(store, next.project_id, next.schedule_id, next.report_date);
    return next;
  });
}

