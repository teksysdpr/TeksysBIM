import { apiFetch } from "@/lib/api";

export type CompanyProfileResponse = {
  company_id: number;
  settings_id: number;
  company_name: string;
  company_code: string;
  company_email: string | null;
  company_mobile: string | null;
  company_address: string | null;
  company_is_active: boolean;
  timezone: string;
  date_format: string;
  currency_code: string;
  logo_url: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_mobile: string | null;
  otp_required_for_project_team: boolean;
  settings_is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CompanyProfileUpdate = Partial<{
  company_name: string;
  company_email: string;
  company_mobile: string;
  company_address: string;
  company_is_active: boolean;
  timezone: string;
  date_format: string;
  currency_code: string;
  logo_url: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_mobile: string;
  otp_required_for_project_team: boolean;
  settings_is_active: boolean;
}>;

export async function getCompanyProfile(token: string) {
  return apiFetch<CompanyProfileResponse>("/company/profile", {
    method: "GET",
    token,
  });
}

export async function updateCompanyProfile(token: string, payload: CompanyProfileUpdate) {
  return apiFetch<CompanyProfileResponse>("/company/profile", {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}
