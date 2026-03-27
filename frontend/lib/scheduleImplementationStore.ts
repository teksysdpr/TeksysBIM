import { promises as fs } from "fs";
import path from "path";
import type {
  ScheduleImplementationLine,
  ScheduleImplementationListFilters,
  ScheduleImplementationRecord,
  ScheduleImplementationSaveInput,
  ScheduleImplementationStatus,
  ScheduleImplementationStore,
} from "@/lib/scheduleImplementationTypes";

const STORE_DIR = "/tmp/dpr-web-data";
const STORE_FILE = path.join(STORE_DIR, "schedule-implementation.json");
const DEFAULT_STORE: ScheduleImplementationStore = {
  sequence: 0,
  line_sequence: 0,
  rows: [],
};

let writeChain: Promise<unknown> = Promise.resolve();

type ErrorCode = "VALIDATION" | "NOT_FOUND" | "READ_ONLY" | "BAD_REQUEST";

export class ScheduleImplementationStoreError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeStatus(value: unknown): ScheduleImplementationStatus {
  const status = String(value || "")
    .trim()
    .toUpperCase();
  if (status === "SUBMITTED") return "SUBMITTED";
  if (status === "APPROVED") return "APPROVED";
  if (status === "REJECTED") return "REJECTED";
  return "DRAFT";
}

async function ensureStoreFile() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
  }
}

async function readStore(): Promise<ScheduleImplementationStore> {
  await ensureStoreFile();
  const raw = await fs.readFile(STORE_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as ScheduleImplementationStore;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.rows)) {
      return { ...DEFAULT_STORE };
    }
    return parsed;
  } catch {
    return { ...DEFAULT_STORE };
  }
}

async function writeStore(store: ScheduleImplementationStore) {
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

async function withStoreWrite<T>(
  handler: (store: ScheduleImplementationStore) => Promise<T>
): Promise<T> {
  const task = writeChain.then(async () => {
    const store = await readStore();
    const result = await handler(store);
    await writeStore(store);
    return result;
  });
  writeChain = task.catch(() => undefined);
  return task;
}

function getNextId(store: ScheduleImplementationStore): number {
  store.sequence += 1;
  return store.sequence;
}

function getNextLineId(store: ScheduleImplementationStore): number {
  store.line_sequence += 1;
  return store.line_sequence;
}

function validateSaveInput(input: Partial<ScheduleImplementationSaveInput>) {
  const errors: string[] = [];
  if (!toNumber(input.project_id)) errors.push("Project is required.");
  if (!String(input.schedule_id || "").trim()) errors.push("Schedule is required.");
  if (!toNumber(input.baseline_id)) errors.push("Baseline is required.");
  if (!toNumber(input.baseline_no)) errors.push("Baseline number is required.");
  if (!String(input.implementation_date || "").trim()) {
    errors.push("Implementation date is required.");
  }
  const rows = Array.isArray(input.rows) ? input.rows : [];
  if (!rows.length) errors.push("At least one activity row is required.");
  rows.forEach((row, index) => {
    const label = `Row ${index + 1}`;
    if (!String(row?.activity_name || "").trim()) errors.push(`${label}: Activity is required.`);
    if (toNumber(row?.project_qty) < 0) errors.push(`${label}: Project qty cannot be negative.`);
    if (toNumber(row?.completed_qty_before_start) < 0) {
      errors.push(`${label}: Completed qty cannot be negative.`);
    }
  });
  return errors;
}

function filterRows(
  rows: ScheduleImplementationRecord[],
  filters: ScheduleImplementationListFilters
) {
  const normalizedStatus = filters.status ? normalizeStatus(filters.status) : null;
  return rows.filter((row) => {
    if (typeof filters.project_id === "number" && row.project_id !== filters.project_id) return false;
    if (filters.schedule_id && row.schedule_id !== filters.schedule_id) return false;
    if (typeof filters.baseline_id === "number" && row.baseline_id !== filters.baseline_id) return false;
    if (normalizedStatus && row.status !== normalizedStatus) return false;
    return true;
  });
}

function toLineRecord(
  store: ScheduleImplementationStore,
  recordId: number,
  row: any,
  index: number,
  now: string
): ScheduleImplementationLine {
  return {
    id: toNumber(row?.id) || getNextLineId(store),
    implementation_id: recordId,
    sr_no: index + 1,
    activity_id: toNumber(row?.activity_id) || null,
    wbs_code: String(row?.wbs_code || "").trim(),
    activity_name: String(row?.activity_name || "").trim(),
    start_date: String(row?.start_date || "").trim(),
    end_date: String(row?.end_date || "").trim(),
    unit: String(row?.unit || "").trim(),
    project_qty: Math.max(0, toNumber(row?.project_qty)),
    completed_qty_before_start: Math.max(0, toNumber(row?.completed_qty_before_start)),
    created_at: String(row?.created_at || now),
    updated_at: now,
  };
}

export async function listScheduleImplementationRecords(
  filters: ScheduleImplementationListFilters = {}
) {
  const store = await readStore();
  const rows = filterRows(store.rows, filters).sort((a, b) => {
    if (a.updated_at !== b.updated_at) return a.updated_at < b.updated_at ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });
  return {
    ok: true,
    total: rows.length,
    rows,
  };
}

export async function getScheduleImplementationById(id: number) {
  const store = await readStore();
  const row = store.rows.find((item) => item.id === id);
  if (!row) {
    throw new ScheduleImplementationStoreError("NOT_FOUND", "Implementation record not found.");
  }
  return row;
}

export async function saveScheduleImplementationDraft(
  input: Partial<ScheduleImplementationSaveInput>
) {
  const errors = validateSaveInput(input);
  if (errors.length) {
    throw new ScheduleImplementationStoreError("VALIDATION", errors.join(" "));
  }

  return withStoreWrite(async (store) => {
    const now = nowIso();
    const projectId = toNumber(input.project_id);
    const scheduleId = String(input.schedule_id || "").trim();
    const baselineId = toNumber(input.baseline_id);

    let index = -1;
    const payloadId = toNumber(input.id);
    if (payloadId > 0) {
      index = store.rows.findIndex((row) => row.id === payloadId);
    }
    if (index < 0) {
      index = store.rows.findIndex(
        (row) =>
          row.project_id === projectId &&
          row.schedule_id === scheduleId &&
          row.baseline_id === baselineId
      );
    }

    if (index >= 0 && store.rows[index].status === "APPROVED") {
      throw new ScheduleImplementationStoreError(
        "READ_ONLY",
        "Final approved implementation is read-only."
      );
    }

    const id = index >= 0 ? store.rows[index].id : getNextId(store);
    const previous = index >= 0 ? store.rows[index] : null;
    const lineRows = Array.isArray(input.rows) ? input.rows : [];
    const rows = lineRows.map((row, idx) => toLineRecord(store, id, row, idx, now));

    const record: ScheduleImplementationRecord = {
      id,
      project_id: projectId,
      project_name: String(input.project_name || previous?.project_name || ""),
      schedule_id: scheduleId,
      schedule_name: String(input.schedule_name || previous?.schedule_name || ""),
      baseline_id: baselineId,
      baseline_no: toNumber(input.baseline_no),
      implementation_date: String(input.implementation_date || "").slice(0, 10),
      status: previous?.status === "REJECTED" ? "REJECTED" : "DRAFT",
      note: String(input.note || previous?.note || ""),
      submitted_at: previous?.submitted_at || null,
      submitted_by: previous?.submitted_by || null,
      approved_at: previous?.approved_at || null,
      approved_by: previous?.approved_by || null,
      rejected_at: previous?.rejected_at || null,
      rejected_by: previous?.rejected_by || null,
      created_at: previous?.created_at || now,
      updated_at: now,
      rows,
    };

    if (index >= 0) {
      store.rows[index] = record;
    } else {
      store.rows.push(record);
    }

    return record;
  });
}

export async function submitScheduleImplementation(
  id: number,
  payload: { actor?: string; note?: string } = {}
) {
  return withStoreWrite(async (store) => {
    const index = store.rows.findIndex((row) => row.id === id);
    if (index < 0) {
      throw new ScheduleImplementationStoreError("NOT_FOUND", "Implementation record not found.");
    }
    const current = store.rows[index];
    if (current.status === "APPROVED") {
      throw new ScheduleImplementationStoreError("READ_ONLY", "Already final approved.");
    }
    if (current.status === "SUBMITTED") return current;

    const now = nowIso();
    const updated: ScheduleImplementationRecord = {
      ...current,
      status: "SUBMITTED",
      note: String(payload.note || current.note || ""),
      submitted_at: now,
      submitted_by: String(payload.actor || "").trim() || current.submitted_by || null,
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      updated_at: now,
    };
    store.rows[index] = updated;
    return updated;
  });
}

export async function approveScheduleImplementation(
  id: number,
  payload: { actor?: string; note?: string } = {}
) {
  return withStoreWrite(async (store) => {
    const index = store.rows.findIndex((row) => row.id === id);
    if (index < 0) {
      throw new ScheduleImplementationStoreError("NOT_FOUND", "Implementation record not found.");
    }
    const current = store.rows[index];
    if (current.status !== "SUBMITTED") {
      throw new ScheduleImplementationStoreError(
        "BAD_REQUEST",
        "Only SUBMITTED implementation can be final approved."
      );
    }

    const now = nowIso();
    const updated: ScheduleImplementationRecord = {
      ...current,
      status: "APPROVED",
      note: String(payload.note || current.note || ""),
      approved_at: now,
      approved_by: String(payload.actor || "").trim() || null,
      rejected_at: null,
      rejected_by: null,
      updated_at: now,
    };
    store.rows[index] = updated;
    return updated;
  });
}

export async function rejectScheduleImplementation(
  id: number,
  payload: { actor?: string; note?: string } = {}
) {
  return withStoreWrite(async (store) => {
    const index = store.rows.findIndex((row) => row.id === id);
    if (index < 0) {
      throw new ScheduleImplementationStoreError("NOT_FOUND", "Implementation record not found.");
    }
    const current = store.rows[index];
    if (current.status !== "SUBMITTED") {
      throw new ScheduleImplementationStoreError(
        "BAD_REQUEST",
        "Only SUBMITTED implementation can be rejected."
      );
    }

    const now = nowIso();
    const updated: ScheduleImplementationRecord = {
      ...current,
      status: "REJECTED",
      note: String(payload.note || current.note || ""),
      rejected_at: now,
      rejected_by: String(payload.actor || "").trim() || null,
      approved_at: null,
      approved_by: null,
      updated_at: now,
    };
    store.rows[index] = updated;
    return updated;
  });
}
