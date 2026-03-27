import type { DprReportInput, DprReportRecord, DprStatus } from "@/lib/dprTypes";

export type DprListResponse = {
  ok: boolean;
  total: number;
  rows: DprReportRecord[];
};

type DprApiResponse<T> = {
  ok: boolean;
  message?: string;
  row?: T;
  rows?: T[];
  total?: number;
};

type DprListFilters = {
  project_id?: number;
  dpr_date?: string;
  status?: DprStatus;
  include_rows?: boolean;
};

type DprMutateOptions = {
  allow_duplicate?: boolean;
  allow_edit_submitted?: boolean;
  inclusive_hindrance_days?: boolean;
};

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && (payload.message || payload.detail)
        ? String(payload.message || payload.detail)
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function listDprReports(filters: DprListFilters = {}): Promise<DprListResponse> {
  const query = buildQuery({
    project_id: filters.project_id,
    dpr_date: filters.dpr_date,
    status: filters.status,
    include_rows: filters.include_rows ? 1 : 0,
  });
  const data = await requestJson<DprApiResponse<DprReportRecord>>(`/api/dpr/reports${query}`);
  return {
    ok: Boolean(data.ok),
    total: Number(data.total || 0),
    rows: Array.isArray(data.rows) ? data.rows : [],
  };
}

export async function getDprReport(id: number): Promise<DprReportRecord> {
  const data = await requestJson<DprApiResponse<DprReportRecord>>(`/api/dpr/reports/${id}`);
  if (!data.row) throw new Error("DPR not found.");
  return data.row;
}

export async function createDprReport(
  payload: DprReportInput,
  options: DprMutateOptions = {}
): Promise<DprReportRecord> {
  const query = buildQuery({
    allow_duplicate: options.allow_duplicate ? 1 : 0,
    inclusive_hindrance_days: options.inclusive_hindrance_days === false ? 0 : 1,
  });
  const data = await requestJson<DprApiResponse<DprReportRecord>>(`/api/dpr/reports${query}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!data.row) throw new Error("Unable to create DPR.");
  return data.row;
}

export async function updateDprReport(
  id: number,
  payload: Partial<DprReportInput>,
  options: DprMutateOptions = {}
): Promise<DprReportRecord> {
  const query = buildQuery({
    allow_duplicate: options.allow_duplicate ? 1 : 0,
    allow_edit_submitted: options.allow_edit_submitted ? 1 : 0,
    inclusive_hindrance_days: options.inclusive_hindrance_days === false ? 0 : 1,
  });
  const data = await requestJson<DprApiResponse<DprReportRecord>>(`/api/dpr/reports/${id}${query}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!data.row) throw new Error("Unable to update DPR.");
  return data.row;
}

export async function submitDprReport(id: number): Promise<DprReportRecord> {
  const data = await requestJson<DprApiResponse<DprReportRecord>>(`/api/dpr/reports/${id}/submit`, {
    method: "POST",
  });
  if (!data.row) throw new Error("Unable to submit DPR.");
  return data.row;
}

