import { apiRequest } from "@/lib/apiClient";

export type ProjectSummary = {
  total_projects: number;
  active_projects: number;
  on_hold_projects: number;
  completed_projects: number;
};

export type ProjectRow = {
  id: number;
  project_name: string;
  project_code: string;
  client_name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  remarks: string | null;
  status: string;
  can_edit: boolean;
  can_delete: boolean;
  can_display_schedules: boolean;
  company_id: number;
  created_at: string;
  updated_at: string;
};

export type ProjectListResponse = {
  ok: boolean;
  total: number;
  rows: ProjectRow[];
};

export type ProjectPayload = {
  project_name: string;
  project_code: string;
  client_name?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  remarks?: string | null;
  status: string;
};

export type ScheduleRow = {
  id: number;
  schedule_name: string;
  structure_id: number | null;
  structure_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_billable: boolean;
  billable_label: string;
  remarks: string | null;
  is_active: boolean;
  is_locked: boolean;
  locked_reason: string | null;
  can_edit: boolean;
  can_delete: boolean;
  can_quick_action: boolean;
  can_print: boolean;
};

export type ScheduleListResponse = {
  ok: boolean;
  total: number;
  rows: ScheduleRow[];
};

export type ScheduleSummary = {
  total_schedules: number;
  active: number;
  paused: number;
  completed: number;
  stopped: number;
  billable: number;
  non_billable: number;
};

export type SchedulePayload = {
  schedule_name: string;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  is_billable: boolean;
  remarks?: string | null;
};

export type DeleteProjectResponse = {
  ok: boolean;
  code?: string;
  message?: string;
};

export type DeleteScheduleResponse = {
  ok: boolean;
  code?: string;
  message?: string;
};

export async function getProjectSummary(): Promise<ProjectSummary> {
  return apiRequest("/company/projects/summary");
}

export async function getProjects(): Promise<ProjectListResponse> {
  return apiRequest("/company/projects");
}

export async function createProject(payload: ProjectPayload): Promise<ProjectRow> {
  return apiRequest("/company/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProject(projectId: number, payload: Partial<ProjectPayload>): Promise<ProjectRow> {
  return apiRequest(`/company/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(projectId: number): Promise<DeleteProjectResponse> {
  return apiRequest(`/company/projects/${projectId}`, {
    method: "DELETE",
  });
}

export async function getSchedules(projectId: number): Promise<ScheduleListResponse> {
  return apiRequest(`/company/projects/${projectId}/schedules`);
}

export async function getScheduleSummary(projectId: number): Promise<ScheduleSummary> {
  return apiRequest(`/company/projects/${projectId}/schedules/summary`);
}

export async function createSchedule(projectId: number, payload: SchedulePayload): Promise<ScheduleRow> {
  return apiRequest(`/company/projects/${projectId}/schedules`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSchedule(
  projectId: number,
  scheduleId: number,
  payload: Partial<SchedulePayload>
): Promise<ScheduleRow> {
  return apiRequest(`/company/projects/${projectId}/schedules/${scheduleId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteSchedule(
  projectId: number,
  scheduleId: number
): Promise<DeleteScheduleResponse> {
  return apiRequest(`/company/projects/${projectId}/schedules/${scheduleId}`, {
    method: "DELETE",
  });
}

export function formatProjectStatus(status: string): string {
  if (status === "ACTIVE") return "Active";
  if (status === "ON_HOLD") return "On-Hold";
  if (status === "COMPLETED") return "Completed";
  return status;
}

export function toBackendProjectStatus(status: string): string {
  if (status === "ACTIVE") return "Active";
  if (status === "ON_HOLD") return "On-Hold";
  if (status === "COMPLETED") return "Completed";
  return status;
}

export function formatScheduleStatus(status: string): string {
  if (status === "ACTIVE") return "Active";
  if (status === "PAUSED") return "Paused";
  if (status === "COMPLETED") return "Completed";
  if (status === "STOPPED") return "Stopped";
  return status;
}

export function toBackendScheduleStatus(status: string): string {
  if (status === "ACTIVE") return "Active";
  if (status === "PAUSED") return "Paused";
  if (status === "COMPLETED") return "Completed";
  if (status === "STOPPED") return "Stopped";
  return status;
}
