import { apiFetch } from "@/lib/api";

export type CompanySettingsResponse = {
  timezone: string;
  date_format: string;
  currency_code: string;
  logo_url: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_mobile: string | null;
  otp_required_for_project_team: boolean;
  is_active: boolean;
  id: number;
  company_id: number;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRow = {
  company_id: number;
  subscription_plan_id: number;
  start_date: string;
  end_date: string;
  status: string;
  billing_cycle: string;
  amount: string;
  currency_code: string;
  auto_renew: boolean;
  is_active: boolean;
  id: number;
  created_at: string;
  updated_at: string;
};

export type CompanySubscriptionResponse = {
  ok: boolean;
  total: number;
  rows: SubscriptionRow[];
};

export type SubscriptionAllocationRow = {
  id: number;
  company_subscription_id: number;
  metric: string;
  allocated_value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionAllocationListResponse = {
  ok: boolean;
  total: number;
  rows: SubscriptionAllocationRow[];
};

export type SubscriptionUsageRow = {
  id: number;
  company_subscription_id: number;
  metric: string;
  used_value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionUsageListResponse = {
  ok: boolean;
  total: number;
  rows: SubscriptionUsageRow[];
};

export async function getCompanySettings(token: string) {
  return apiFetch<CompanySettingsResponse>("/company/settings", {
    method: "GET",
    token,
  });
}

export async function getCompanySubscription(token: string) {
  return apiFetch<CompanySubscriptionResponse>("/company/subscription", {
    method: "GET",
    token,
  });
}

export async function getCompanySubscriptionAllocations(token: string) {
  return apiFetch<SubscriptionAllocationListResponse>(
    "/company/subscription/allocations",
    {
      method: "GET",
      token,
    }
  );
}

export async function getCompanySubscriptionUsage(token: string) {
  return apiFetch<SubscriptionUsageListResponse>("/company/subscription/usage", {
    method: "GET",
    token,
  });
}

export type CompanyProjectRow = {
  id: number;
  company_id: number;
  project_code: string;
  name: string;
  project_name?: string;
  location: string | null;
  category: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CompanyProjectListResponse = {
  ok: boolean;
  total: number;
  rows: CompanyProjectRow[];
};

export type CompanyProjectCreatePayload = {
  project_code: string;
  name: string;
  location?: string | null;
  category: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  is_active?: boolean;
};

export type CompanyProjectUpdatePayload = Partial<CompanyProjectCreatePayload>;

export async function getCompanyProjects(token: string) {
  return apiFetch<CompanyProjectListResponse>("/company/projects", {
    method: "GET",
    token,
  });
}

export async function createCompanyProject(
  token: string,
  payload: CompanyProjectCreatePayload
) {
  return apiFetch<CompanyProjectRow>("/company/projects", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateCompanyProject(
  token: string,
  projectId: number,
  payload: CompanyProjectUpdatePayload
) {
  return apiFetch<CompanyProjectRow>(`/company/projects/${projectId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}


export type CompanyProjectStructureRow = {
  id: number;
  project_id: number;
  parent_structure_id: number | null;
  structure_code: string;
  name: string;
  structure_type: string;
  sequence_no: number;
  tracking_status: string;
  is_billable: boolean;
  billing_start_date: string | null;
  billing_end_date: string | null;
  remarks: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CompanyProjectStructureListResponse = {
  ok: boolean;
  total: number;
  rows: CompanyProjectStructureRow[];
};

export type CompanyProjectStructureCreatePayload = {
  parent_structure_id?: number | null;
  structure_code: string;
  name: string;
  structure_type: string;
  sequence_no?: number;
  tracking_status?: string;
  is_billable?: boolean;
  billing_start_date?: string | null;
  billing_end_date?: string | null;
  remarks?: string | null;
  is_active?: boolean;
};

export type CompanyProjectStructureUpdatePayload =
  Partial<CompanyProjectStructureCreatePayload>;

export async function getCompanyProjectStructures(
  token: string,
  projectId: number
) {
  return apiFetch<CompanyProjectStructureListResponse>(
    `/company/projects/${projectId}/structures`,
    {
      method: "GET",
      token,
    }
  );
}

export async function createCompanyProjectStructure(
  token: string,
  projectId: number,
  payload: CompanyProjectStructureCreatePayload
) {
  return apiFetch<CompanyProjectStructureRow>(
    `/company/projects/${projectId}/structures`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
}

export async function updateCompanyProjectStructure(
  token: string,
  projectId: number,
  structureId: number,
  payload: CompanyProjectStructureUpdatePayload
) {
  return apiFetch<CompanyProjectStructureRow>(
    `/company/projects/${projectId}/structures/${structureId}`,
    {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    }
  );
}

export type CompanyProjectsSummary = {
  total_projects: number;
  active_projects: number;
  inactive_projects: number;
  total_structures: number;
  active_structures: number;
  billable_structures: number;
  non_billable_structures: number;
};

export type CompanyProjectsSummaryResponse = {
  ok: boolean;
  summary: CompanyProjectsSummary;
};

export type CompanyProjectStructuresSummary = {
  project_id: number;
  project_name: string;
  total_structures: number;
  active_structures: number;
  inactive_structures: number;
  billable_structures: number;
  non_billable_structures: number;
  paused_structures: number;
};

export type CompanyProjectStructuresSummaryResponse = {
  ok: boolean;
  summary: CompanyProjectStructuresSummary;
};

export type SubscriptionAlertRow = {
  metric: string;
  allocated_value: number;
  used_value: number;
  available_value: number;
  usage_pct: number;
  status: string;
};

export type SubscriptionAlertsResponse = {
  ok: boolean;
  alerts: SubscriptionAlertRow[];
};

export async function getCompanyProjectsSummary(token: string) {
  return apiFetch<CompanyProjectsSummaryResponse>("/company/projects/summary", {
    method: "GET",
    token,
  });
}

export async function getCompanySubscriptionAlerts(token: string) {
  return apiFetch<SubscriptionAlertsResponse>("/company/subscription/alerts", {
    method: "GET",
    token,
  });
}

export async function getCompanyProjectStructuresSummary(
  token: string,
  projectId: number
) {
  return apiFetch<CompanyProjectStructuresSummaryResponse>(
    `/company/projects/${projectId}/structures/summary`,
    {
      method: "GET",
      token,
    }
  );
}

export async function makeCompanyStructureBillable(
  token: string,
  structureId: number
) {
  return apiFetch<{ ok: boolean; message: string; row: CompanyProjectStructureRow }>(
    `/company/structures/${structureId}/make-billable`,
    {
      method: "PATCH",
      token,
    }
  );
}

export async function makeCompanyStructureNonBillable(
  token: string,
  structureId: number
) {
  return apiFetch<{ ok: boolean; message: string; row: CompanyProjectStructureRow }>(
    `/company/structures/${structureId}/make-non-billable`,
    {
      method: "PATCH",
      token,
    }
  );
}
