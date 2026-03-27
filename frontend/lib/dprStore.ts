import { promises as fs } from "fs";
import path from "path";
import { applyDprCalculations } from "@/lib/dprCalculator";
import { validateDprInput } from "@/lib/dprValidation";
import type {
  DprListFilters,
  DprMutationOptions,
  DprReportInput,
  DprReportRecord,
  DprStatus,
  DprStore,
} from "@/lib/dprTypes";

const STORE_DIR = "/tmp/dpr-web-data";
const STORE_FILE = path.join(STORE_DIR, "dpr-reports.json");
const DEFAULT_STORE: DprStore = {
  sequence: 0,
  row_sequence: 0,
  reports: [],
};

let writeChain: Promise<unknown> = Promise.resolve();

type ErrorCode =
  | "VALIDATION"
  | "DUPLICATE_DPR"
  | "NOT_FOUND"
  | "READ_ONLY"
  | "BAD_REQUEST";

export class DprStoreError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

async function ensureStoreFile() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
  }
}

async function readStore(): Promise<DprStore> {
  await ensureStoreFile();
  const raw = await fs.readFile(STORE_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as DprStore;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.reports) ||
      typeof parsed.sequence !== "number" ||
      typeof parsed.row_sequence !== "number"
    ) {
      return { ...DEFAULT_STORE };
    }
    return parsed;
  } catch {
    return { ...DEFAULT_STORE };
  }
}

async function writeStore(store: DprStore) {
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

async function withStoreWrite<T>(handler: (store: DprStore) => Promise<T>): Promise<T> {
  const task = writeChain.then(async () => {
    const store = await readStore();
    const out = await handler(store);
    await writeStore(store);
    return out;
  });
  writeChain = task.catch(() => undefined);
  return task;
}

function nowIso(): string {
  return new Date().toISOString();
}

function getNextReportId(store: DprStore): number {
  store.sequence += 1;
  return store.sequence;
}

function getNextRowId(store: DprStore): number {
  store.row_sequence += 1;
  return store.row_sequence;
}

function assignChildRowMetadata(
  store: DprStore,
  reportId: number,
  now: string,
  input: DprReportInput
): DprReportInput {
  const assign = <T extends { id: number | null; dpr_report_id: number | null; sr_no: number; created_at: string | null; updated_at: string | null }>(
    rows: T[]
  ) =>
    rows.map((row, index) => ({
      ...row,
      id: row.id || getNextRowId(store),
      dpr_report_id: reportId,
      sr_no: index + 1,
      created_at: row.created_at || now,
      updated_at: now,
    }));

  return {
    ...input,
    daily_work_progress_items: assign(input.daily_work_progress_items),
    manpower_deployment_items: assign(input.manpower_deployment_items),
    machinery_equipment_items: assign(input.machinery_equipment_items),
    material_procurement_items: assign(input.material_procurement_items),
    material_issue_consumption_items: assign(input.material_issue_consumption_items),
    deviation_report_items: assign(input.deviation_report_items),
    risk_management_items: assign(input.risk_management_items),
    hindrance_report_items: assign(input.hindrance_report_items),
  };
}

function isDuplicateReport(
  reports: DprReportRecord[],
  candidate: { project_id: number | null; dpr_date: string; id?: number | null }
): boolean {
  return reports.some(
    (row) =>
      row.project_id === candidate.project_id &&
      row.dpr_date === candidate.dpr_date &&
      row.id !== candidate.id
  );
}

function mapReportForList(row: DprReportRecord, includeRows: boolean): DprReportRecord | object {
  if (includeRows) return row;
  return {
    id: row.id,
    project_id: row.project_id,
    project_name: row.project_name,
    schedule_id: row.schedule_id,
    schedule_name: row.schedule_name,
    dpr_date: row.dpr_date,
    day_name: row.day_name,
    weather: row.weather,
    weather_impact_details: row.weather_impact_details,
    total_manpower_sum: row.total_manpower_sum,
    status: row.status,
    site_engineer_name: row.site_engineer_name,
    site_engineer_designation: row.site_engineer_designation || "",
    project_manager_name: row.project_manager_name,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listDprReports(filters: DprListFilters = {}) {
  const store = await readStore();
  const includeRows = filters.include_rows ?? false;
  const normalizedStatus = filters.status ? String(filters.status).toLowerCase() : "";

  const rows = store.reports
    .filter((row) => {
      if (typeof filters.project_id === "number" && row.project_id !== filters.project_id) return false;
      if (filters.dpr_date && row.dpr_date !== filters.dpr_date) return false;
      if (normalizedStatus && row.status !== normalizedStatus) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.dpr_date !== b.dpr_date) return a.dpr_date < b.dpr_date ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    })
    .map((row) => mapReportForList(row, includeRows));

  return {
    ok: true,
    total: rows.length,
    rows,
  };
}

export async function getDprReportById(id: number): Promise<DprReportRecord> {
  const store = await readStore();
  const found = store.reports.find((row) => row.id === id);
  if (!found) {
    throw new DprStoreError("NOT_FOUND", "DPR not found.");
  }
  return found;
}

export async function createDprReport(
  rawInput: Partial<DprReportInput>,
  options: DprMutationOptions = {}
): Promise<DprReportRecord> {
  return withStoreWrite(async (store) => {
    const validation = validateDprInput(rawInput, {
      inclusive_hindrance_days: options.inclusive_hindrance_days,
    });
    if (!validation.ok) {
      throw new DprStoreError("VALIDATION", validation.errors.join(" "));
    }

    const normalized = applyDprCalculations(rawInput, {
      inclusive_hindrance_days: options.inclusive_hindrance_days,
    });

    if (!options.allow_duplicate && isDuplicateReport(store.reports, normalized)) {
      throw new DprStoreError(
        "DUPLICATE_DPR",
        "DPR already exists for the selected project and date."
      );
    }

    const id = getNextReportId(store);
    const now = nowIso();
    const withRows = assignChildRowMetadata(store, id, now, normalized);

    const record: DprReportRecord = {
      ...(withRows as DprReportInput),
      id,
      status: withRows.status || "draft",
      created_at: now,
      updated_at: now,
    };

    store.reports.push(record);
    return record;
  });
}

export async function updateDprReport(
  id: number,
  rawInput: Partial<DprReportInput>,
  options: DprMutationOptions = {}
): Promise<DprReportRecord> {
  return withStoreWrite(async (store) => {
    const index = store.reports.findIndex((row) => row.id === id);
    if (index < 0) throw new DprStoreError("NOT_FOUND", "DPR not found.");

    const current = store.reports[index];
    if (current.status === "approved") {
      throw new DprStoreError("READ_ONLY", "Approved DPR is read-only.");
    }
    if (current.status === "submitted" && !options.allow_edit_submitted) {
      throw new DprStoreError("READ_ONLY", "Submitted DPR is read-only for this user.");
    }

    const mergedInput: DprReportInput = {
      ...current,
      ...rawInput,
      id: current.id,
      status: (rawInput.status || current.status || "draft") as DprStatus,
    };

    const validation = validateDprInput(mergedInput, {
      inclusive_hindrance_days: options.inclusive_hindrance_days,
    });
    if (!validation.ok) {
      throw new DprStoreError("VALIDATION", validation.errors.join(" "));
    }

    const normalized = applyDprCalculations(mergedInput, {
      inclusive_hindrance_days: options.inclusive_hindrance_days,
    });

    if (!options.allow_duplicate && isDuplicateReport(store.reports, { ...normalized, id })) {
      throw new DprStoreError(
        "DUPLICATE_DPR",
        "DPR already exists for the selected project and date."
      );
    }

    const now = nowIso();
    const withRows = assignChildRowMetadata(store, id, now, normalized);
    const next: DprReportRecord = {
      ...(withRows as DprReportInput),
      id,
      created_at: current.created_at,
      updated_at: now,
    };

    store.reports[index] = next;
    return next;
  });
}

export async function submitDprReport(
  id: number,
  options: DprMutationOptions = {}
): Promise<DprReportRecord> {
  return withStoreWrite(async (store) => {
    const index = store.reports.findIndex((row) => row.id === id);
    if (index < 0) throw new DprStoreError("NOT_FOUND", "DPR not found.");

    const current = store.reports[index];
    const validation = validateDprInput(current, {
      requireForSubmit: true,
      inclusive_hindrance_days: options.inclusive_hindrance_days,
    });
    if (!validation.ok) {
      throw new DprStoreError("VALIDATION", validation.errors.join(" "));
    }

    const now = nowIso();
    const next: DprReportRecord = {
      ...current,
      status: "submitted",
      updated_at: now,
    };
    store.reports[index] = next;
    return next;
  });
}
