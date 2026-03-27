import { apiFetch } from "@/lib/api";

export type PasswordLoginRequest = {
  email: string;
  password: string;
  selected_category?: string;
};

export type PasswordLoginResponse = {
  ok?: boolean;
  access_token: string;
  token_type: string;
  user?: VerifiedUser;
  landing_path?: string;
};

export type LoginInitRequest = {
  identifier: string;
  password: string;
  selected_category: string;
};

export type LoginInitResponse = {
  ok: boolean;
  login_id: number;
};

export type VerifyOtpRequest = {
  login_id: number;
  otp: string;
  selected_category?: string;
};

export type VerifiedUser = {
  id: number;
  email: string;
  full_name: string;
  company_id: number;
  category: string;
  role?: string;
  must_change_password: boolean;
  project_ids?: number[];
  projects?: Array<{ id?: number; name?: string }>;
};

export type VerifyOtpResponse = {
  ok: boolean;
  access_token: string;
  user: VerifiedUser;
  landing_path: string;
};

export type AuthMeResponse = {
  ok?: boolean;
  user?: VerifiedUser;
  id?: number;
  email?: string;
  full_name?: string;
  company_id?: number;
  category?: string;
  role?: string;
  must_change_password?: boolean;
  project_ids?: number[];
  projects?: Array<{ id?: number; name?: string }>;
};

export async function loginWithPassword(payload: PasswordLoginRequest) {
  return apiFetch<PasswordLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginInit(payload: LoginInitRequest) {
  return apiFetch<LoginInitResponse>("/auth/login/init", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyOtp(payload: VerifyOtpRequest) {
  return apiFetch<VerifyOtpResponse>("/auth/login/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAuthMe(accessToken: string) {
  return apiFetch<AuthMeResponse>("/auth/me", {
    method: "GET",
    token: accessToken,
  });
}
