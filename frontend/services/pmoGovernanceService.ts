import { apiFetch } from "@/lib/api";

export type PMOGovernanceOverview = {
  activity_library_count: number;
  wbs_template_count: number;
  delay_reason_count: number;
  hindrance_master_count: number;
};

export type PMOActivityLibraryRow = {
  id: number;
  code: string;
  name: string;
  project_domain?: string | null;
  uom?: string | null;
  default_productivity?: number | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PMOWBSTemplateItemRow = {
  id: number;
  sequence_no: number;
  activity_code?: string | null;
  activity_name: string;
  uom?: string | null;
  weight_pct?: number | null;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PMOWBSTemplateRow = {
  id: number;
  template_code: string;
  template_name: string;
  project_domain?: string | null;
  structure_type?: string | null;
  description?: string | null;
  is_active: boolean;
  item_count: number;
  created_at: string;
  updated_at: string;
  items: PMOWBSTemplateItemRow[];
};

export type PMODelayReasonRow = {
  id: number;
  reason_code: string;
  reason_name: string;
  severity?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PMOHindranceMasterRow = {
  id: number;
  hindrance_code: string;
  hindrance_name: string;
  category?: string | null;
  severity_default?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ListResponse<T> = {
  ok: boolean;
  total: number;
  rows: T[];
};

export async function getPMOGovernanceOverview(token: string) {
  return apiFetch<{ ok: boolean; summary: PMOGovernanceOverview }>(
    "/company/pmo/governance/overview",
    {
      method: "GET",
      token,
    }
  );
}

export async function listPMOActivityLibrary(token: string) {
  return apiFetch<ListResponse<PMOActivityLibraryRow>>(
    "/company/pmo/governance/activity-library",
    {
      method: "GET",
      token,
    }
  );
}

export async function createPMOActivityLibrary(
  token: string,
  payload: Partial<PMOActivityLibraryRow>
) {
  return apiFetch<PMOActivityLibraryRow>("/company/pmo/governance/activity-library", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updatePMOActivityLibrary(
  token: string,
  id: number,
  payload: Partial<PMOActivityLibraryRow>
) {
  return apiFetch<PMOActivityLibraryRow>(`/company/pmo/governance/activity-library/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deletePMOActivityLibrary(token: string, id: number) {
  return apiFetch<{ ok: boolean; message: string }>(
    `/company/pmo/governance/activity-library/${id}`,
    {
      method: "DELETE",
      token,
    }
  );
}

export async function listPMOWBSTemplates(token: string) {
  return apiFetch<ListResponse<PMOWBSTemplateRow>>(
    "/company/pmo/governance/wbs-templates",
    {
      method: "GET",
      token,
    }
  );
}

export async function getPMOWBSTemplate(token: string, id: number) {
  return apiFetch<PMOWBSTemplateRow>(`/company/pmo/governance/wbs-templates/${id}`, {
    method: "GET",
    token,
  });
}

export async function createPMOWBSTemplate(token: string, payload: Record<string, unknown>) {
  return apiFetch<PMOWBSTemplateRow>("/company/pmo/governance/wbs-templates", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updatePMOWBSTemplate(
  token: string,
  id: number,
  payload: Record<string, unknown>
) {
  return apiFetch<PMOWBSTemplateRow>(`/company/pmo/governance/wbs-templates/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deletePMOWBSTemplate(token: string, id: number) {
  return apiFetch<{ ok: boolean; message: string }>(
    `/company/pmo/governance/wbs-templates/${id}`,
    {
      method: "DELETE",
      token,
    }
  );
}

export async function listPMODelayReasons(token: string) {
  return apiFetch<ListResponse<PMODelayReasonRow>>(
    "/company/pmo/governance/delay-reasons",
    {
      method: "GET",
      token,
    }
  );
}

export async function createPMODelayReason(token: string, payload: Record<string, unknown>) {
  return apiFetch<PMODelayReasonRow>("/company/pmo/governance/delay-reasons", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updatePMODelayReason(
  token: string,
  id: number,
  payload: Record<string, unknown>
) {
  return apiFetch<PMODelayReasonRow>(`/company/pmo/governance/delay-reasons/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deletePMODelayReason(token: string, id: number) {
  return apiFetch<{ ok: boolean; message: string }>(
    `/company/pmo/governance/delay-reasons/${id}`,
    {
      method: "DELETE",
      token,
    }
  );
}

export async function listPMOHindranceMasters(token: string) {
  return apiFetch<ListResponse<PMOHindranceMasterRow>>(
    "/company/pmo/governance/hindrance-master",
    {
      method: "GET",
      token,
    }
  );
}

export async function createPMOHindranceMaster(token: string, payload: Record<string, unknown>) {
  return apiFetch<PMOHindranceMasterRow>("/company/pmo/governance/hindrance-master", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updatePMOHindranceMaster(
  token: string,
  id: number,
  payload: Record<string, unknown>
) {
  return apiFetch<PMOHindranceMasterRow>(`/company/pmo/governance/hindrance-master/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deletePMOHindranceMaster(token: string, id: number) {
  return apiFetch<{ ok: boolean; message: string }>(
    `/company/pmo/governance/hindrance-master/${id}`,
    {
      method: "DELETE",
      token,
    }
  );
}

