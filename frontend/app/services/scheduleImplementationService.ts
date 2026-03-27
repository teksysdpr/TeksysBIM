import type {
  ScheduleImplementationRecord,
  ScheduleImplementationSaveInput,
  ScheduleImplementationStatus,
} from "@/lib/scheduleImplementationTypes";

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

function buildQuery(params: Record<string, string | number | undefined>): string {
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

export async function listScheduleImplementationRecords(filters: {
  project_id?: number;
  schedule_id?: string;
  baseline_id?: number;
  status?: ScheduleImplementationStatus;
} = {}) {
  const query = buildQuery({
    project_id: filters.project_id,
    schedule_id: filters.schedule_id,
    baseline_id: filters.baseline_id,
    status: filters.status,
  });
  return requestJson<ApiList<ScheduleImplementationRecord>>(`/api/schedule-implementation${query}`);
}

export async function getScheduleImplementationById(id: number) {
  const data = await requestJson<ApiOne<ScheduleImplementationRecord>>(
    `/api/schedule-implementation/${id}`
  );
  if (!data.row) throw new Error("Implementation record not found.");
  return data.row;
}

export async function saveScheduleImplementationDraft(payload: ScheduleImplementationSaveInput) {
  const data = await requestJson<ApiOne<ScheduleImplementationRecord>>("/api/schedule-implementation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!data.row) throw new Error("Unable to save implementation draft.");
  return data.row;
}

export async function submitScheduleImplementation(
  id: number,
  payload: { actor?: string; note?: string } = {}
) {
  const data = await requestJson<ApiOne<ScheduleImplementationRecord>>(
    `/api/schedule-implementation/${id}/submit`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  if (!data.row) throw new Error("Unable to submit implementation.");
  return data.row;
}

export async function approveScheduleImplementation(
  id: number,
  payload: { actor?: string; note?: string } = {}
) {
  const data = await requestJson<ApiOne<ScheduleImplementationRecord>>(
    `/api/schedule-implementation/${id}/approve`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  if (!data.row) throw new Error("Unable to approve implementation.");
  return data.row;
}

export async function rejectScheduleImplementation(
  id: number,
  payload: { actor?: string; note?: string } = {}
) {
  const data = await requestJson<ApiOne<ScheduleImplementationRecord>>(
    `/api/schedule-implementation/${id}/reject`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  if (!data.row) throw new Error("Unable to reject implementation.");
  return data.row;
}
