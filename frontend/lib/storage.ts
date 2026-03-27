const ACCESS_TOKEN_KEY = "dpr_access_token";
const LOGIN_ID_KEY = "dpr_login_id";
const SELECTED_CATEGORY_KEY = "dpr_selected_category";
const USER_KEY = "dpr_user";

function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event("dpr-auth-changed"));
  } catch {}
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveLoginInit(loginId: number, selectedCategory: string) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(LOGIN_ID_KEY, String(loginId));
    localStorage.setItem(SELECTED_CATEGORY_KEY, selectedCategory);
  } catch {}
}

export function getLoginId(): number | null {
  if (!canUseStorage()) return null;
  try {
    const value = localStorage.getItem(LOGIN_ID_KEY);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

export function getSelectedCategory(): string | null {
  if (!canUseStorage()) return null;
  try {
    return localStorage.getItem(SELECTED_CATEGORY_KEY);
  } catch {
    return null;
  }
}

export function saveVerifiedSession(payload: {
  accessToken: string;
  user: unknown;
}) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
    localStorage.setItem("dpr_token", payload.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    notifyAuthChanged();
  } catch {}
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  try {
    return (
      localStorage.getItem(ACCESS_TOKEN_KEY) ||
      localStorage.getItem("dpr_token")
    );
  } catch {
    return null;
  }
}

export function getStoredUser() {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem("dpr_token");
    localStorage.removeItem(LOGIN_ID_KEY);
    localStorage.removeItem(SELECTED_CATEGORY_KEY);
    localStorage.removeItem(USER_KEY);
    notifyAuthChanged();
  } catch {}
}
