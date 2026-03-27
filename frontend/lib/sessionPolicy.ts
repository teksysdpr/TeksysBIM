const DEFAULT_TIME_ZONE = "Asia/Kolkata";
const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 21;
const DEFAULT_MAX_HOURS = 12;
const DEFAULT_ENFORCE_TIME_WINDOW = false;

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const SESSION_POLICY = {
  timeZone: process.env.NEXT_PUBLIC_SESSION_TIME_ZONE || DEFAULT_TIME_ZONE,
  startHour: toNumber(process.env.NEXT_PUBLIC_SESSION_START_HOUR, DEFAULT_START_HOUR),
  endHour: toNumber(process.env.NEXT_PUBLIC_SESSION_END_HOUR, DEFAULT_END_HOUR),
  maxHours: toNumber(process.env.NEXT_PUBLIC_SESSION_MAX_HOURS, DEFAULT_MAX_HOURS),
  enforceTimeWindow:
    process.env.NEXT_PUBLIC_ENFORCE_SESSION_TIME_WINDOW === "true" ||
    DEFAULT_ENFORCE_TIME_WINDOW,
};

export type SessionPolicyReason =
  | "missing_token"
  | "invalid_token"
  | "outside_allowed_hours"
  | "session_max_age_exceeded";

type SessionPolicyResult = {
  valid: boolean;
  reason?: SessionPolicyReason;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2 || !parts[1]) return null;
    if (typeof window === "undefined" || typeof window.atob !== "function") return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = window.atob(padded);
    const payload = JSON.parse(json);
    if (!payload || typeof payload !== "object") return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getHourInTimeZone(now: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone,
    }).formatToParts(now);
    const hourValue = parts.find((part) => part.type === "hour")?.value;
    const hour = Number(hourValue);
    return Number.isFinite(hour) ? hour : NaN;
  } catch {
    return NaN;
  }
}

export function isWithinAllowedSessionWindow(now: Date = new Date()): boolean {
  if (!SESSION_POLICY.enforceTimeWindow) return true;
  const hour = getHourInTimeZone(now, SESSION_POLICY.timeZone);
  if (!Number.isFinite(hour)) return true;
  return hour >= SESSION_POLICY.startHour && hour < SESSION_POLICY.endHour;
}

export function isLoginAllowedNow(now: Date = new Date()): boolean {
  return isWithinAllowedSessionWindow(now);
}

export function evaluateSessionToken(token: string | null, now: Date = new Date()): SessionPolicyResult {
  if (!token) return { valid: false, reason: "missing_token" };

  const payload = decodeJwtPayload(token);
  if (!payload) return { valid: false, reason: "invalid_token" };

  const issuedAt = Number(payload.iat);
  const nowSec = Math.floor(now.getTime() / 1000);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) {
    return { valid: false, reason: "invalid_token" };
  }

  if (nowSec - issuedAt >= SESSION_POLICY.maxHours * 3600) {
    return { valid: false, reason: "session_max_age_exceeded" };
  }

  if (!isWithinAllowedSessionWindow(now)) {
    return { valid: false, reason: "outside_allowed_hours" };
  }

  return { valid: true };
}

export function sessionPolicyMessage(reason: SessionPolicyReason | undefined) {
  if (reason === "outside_allowed_hours") {
    return `Login/session access is allowed only between ${SESSION_POLICY.startHour}:00 and ${SESSION_POLICY.endHour}:00 (${SESSION_POLICY.timeZone}).`;
  }
  if (reason === "session_max_age_exceeded") {
    return `Session expired after ${SESSION_POLICY.maxHours} hours. Please login again.`;
  }
  return "Session is invalid. Please login again.";
}
