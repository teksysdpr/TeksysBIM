import { apiRequest } from "@/lib/apiClient";

export type PMOBaselineStatus = "DRAFT" | "SUBMITTED" | "APPROVED";

export type PMOBaselineRow = {
  id: number;
  project_id: number;
  project_schedule_id: number;
  baseline_no: number;
  title: string;
  status: PMOBaselineStatus;
  submit_note?: string | null;
  submitted_at?: string | null;
  submitted_by?: number | null;
  approved_at?: string | null;
  approved_by?: number | null;
  revoked_at?: string | null;
  revoked_by?: number | null;
  revoke_request_status?: "NONE" | "PENDING" | "APPROVED" | "REJECTED" | null;
  revoke_request_note?: string | null;
  revoke_requested_at?: string | null;
  revoke_requested_by?: number | null;
  revoke_request_decided_at?: string | null;
  revoke_request_decided_by?: number | null;
  row_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
  project_name?: string | null;
  schedule_name?: string | null;
};

export type PMOBaselineListResponse = {
  ok: boolean;
  total: number;
  rows: PMOBaselineRow[];
};

export type PMOBaselineDetailResponse = {
  ok: boolean;
  row: PMOBaselineRow;
  rows: Record<string, any>[];
};

export type PMOBaselineMutationResponse = {
  ok: boolean;
  row: PMOBaselineRow;
};

export type PMORevisionLogRow = {
  id: number;
  project_id: number;
  project_schedule_id: number;
  baseline_id: number;
  baseline_no: number;
  event_type: string;
  from_status: string;
  to_status: string;
  note?: string | null;
  row_count?: number;
  rows?: Record<string, any>[];
  created_by?: number | null;
  created_at?: string | null;
};

export type PMORevisionLogListResponse = {
  ok: boolean;
  total: number;
  rows: PMORevisionLogRow[];
};

export type PMORevisionChangeLineRow = {
  id: number;
  project_id: number;
  project_schedule_id: number;
  baseline_id: number;
  baseline_no: number;
  activity_id?: number | null;
  activity_name?: string | null;
  field_key?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  description: string;
  changed_at?: string | null;
  changed_by?: number | null;
};

export type PMORevisionChangeLineListResponse = {
  ok: boolean;
  total: number;
  rows: PMORevisionChangeLineRow[];
};

export async function listScheduleBaselines(projectId: number, scheduleId: number) {
  return apiRequest<PMOBaselineListResponse>(
    `/company/pmo/schedule-approvals/projects/${projectId}/schedules/${scheduleId}/baselines`
  );
}

export async function createNextBaseline(
  projectId: number,
  scheduleId: number,
  payload: { title?: string } = {}
) {
  return apiRequest<PMOBaselineMutationResponse>(
    `/company/pmo/schedule-approvals/projects/${projectId}/schedules/${scheduleId}/baselines`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function getBaselineDetail(baselineId: number) {
  return apiRequest<PMOBaselineDetailResponse>(
    `/company/pmo/schedule-approvals/baselines/${baselineId}`
  );
}

export async function saveBaselineDraft(
  baselineId: number,
  payload: { title?: string; rows: Record<string, any>[] }
) {
  return apiRequest<PMOBaselineMutationResponse>(
    `/company/pmo/schedule-approvals/baselines/${baselineId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export async function submitBaselineForApproval(
  baselineId: number,
  payload: { note?: string } = {}
) {
  return apiRequest<PMOBaselineMutationResponse>(
    `/company/pmo/schedule-approvals/baselines/${baselineId}/submit`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function approveBaseline(
  baselineId: number,
  payload: { note?: string } = {}
) {
  return apiRequest<PMOBaselineMutationResponse>(
    `/company/pmo/schedule-approvals/baselines/${baselineId}/approve`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function revokeBaseline(
  baselineId: number,
  payload: { note?: string } = {}
) {
  return apiRequest<PMOBaselineMutationResponse>(
    `/company/pmo/schedule-approvals/baselines/${baselineId}/revoke`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function requestBaselineRevoke(
  baselineId: number,
  payload: { note?: string } = {}
) {
  return apiRequest<PMOBaselineMutationResponse>(
    `/company/pmo/schedule-approvals/baselines/${baselineId}/request-revoke`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function listBaselineApprovalQueue(status = "SUBMITTED", projectId?: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (projectId) params.set("project_id", String(projectId));
  return apiRequest<PMOBaselineListResponse>(
    `/company/pmo/schedule-approvals/queue?${params.toString()}`
  );
}

export async function listScheduleRevisionLog(projectId: number, scheduleId: number) {
  return apiRequest<PMORevisionLogListResponse>(
    `/company/pmo/schedule-approvals/projects/${projectId}/schedules/${scheduleId}/revision-log`
  );
}

export async function listBaselineRevisionLines(baselineId: number) {
  return apiRequest<PMORevisionChangeLineListResponse>(
    `/company/pmo/schedule-approvals/baselines/${baselineId}/revision-lines`
  );
}
