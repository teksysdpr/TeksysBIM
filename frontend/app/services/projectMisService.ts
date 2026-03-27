import type {
  MisStatus,
  ProjectMisDailyReport,
  ProjectMisDailyReportInput,
  ProjectMisMasterInputRow,
  ProjectMisMasterRow,
} from "@/lib/projectMisTypes";

type ApiList<T> = {
  ok: boolean;
  total: number;
  rows: T[];
  message?: string;
};

type ApiOne<T> = {
  ok: boolean;
  row?: T;
  message?: string;
};

type MasterFilters = {
  project_id?: number;
  schedule_id?: string;
};

type DailyFilters = {
  project_id?: number;
  schedule_id?: string;
  report_date?: string;
  status?: MisStatus;
  include_lines?: boolean;
};

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
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

export async function listProjectMisMasterRows(
  filters: MasterFilters = {}
): Promise<ApiList<ProjectMisMasterRow>> {
  const query = buildQuery({
    project_id: filters.project_id,
    schedule_id: filters.schedule_id,
  });
  return requestJson<ApiList<ProjectMisMasterRow>>(`/api/mis/master${query}`);
}

export async function saveProjectMisMasterRows(payload: {
  project_id: number;
  schedule_id: string;
  rows: Array<Partial<ProjectMisMasterInputRow> & { id?: number | null }>;
  reference_date?: string;
}): Promise<ApiList<ProjectMisMasterRow>> {
  return requestJson<ApiList<ProjectMisMasterRow>>("/api/mis/master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listProjectMisDailyReports(
  filters: DailyFilters = {}
): Promise<ApiList<ProjectMisDailyReport>> {
  const query = buildQuery({
    project_id: filters.project_id,
    schedule_id: filters.schedule_id,
    report_date: filters.report_date,
    status: filters.status,
    include_lines: filters.include_lines ? 1 : 0,
  });
  return requestJson<ApiList<ProjectMisDailyReport>>(`/api/mis/daily${query}`);
}

export async function getProjectMisDailyReport(id: number): Promise<ProjectMisDailyReport> {
  const data = await requestJson<ApiOne<ProjectMisDailyReport>>(`/api/mis/daily/${id}`);
  if (!data.row) throw new Error("MIS report not found.");
  return data.row;
}

export async function saveProjectMisDailyReport(
  payload: ProjectMisDailyReportInput
): Promise<ProjectMisDailyReport> {
  const data = await requestJson<ApiOne<ProjectMisDailyReport>>("/api/mis/daily", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!data.row) throw new Error("Unable to save MIS report.");
  return data.row;
}

export async function submitProjectMisDailyReport(
  id: number,
  approved_by = ""
): Promise<ProjectMisDailyReport> {
  const data = await requestJson<ApiOne<ProjectMisDailyReport>>(`/api/mis/daily/${id}/submit`, {
    method: "POST",
    body: JSON.stringify({ approved_by }),
  });
  if (!data.row) throw new Error("Unable to submit MIS report.");
  return data.row;
}

