export const COMPANY_LOGO_VERSION_KEY = "dpr-company-logo-version";
export const COMPANY_LOGO_CHANGED_EVENT = "dpr-company-logo-changed";

export function readCompanyLogoVersion(): number {
  if (typeof window === "undefined") return Date.now();
  try {
    const raw = window.localStorage.getItem(COMPANY_LOGO_VERSION_KEY);
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  } catch {
    // ignore
  }
  return Date.now();
}

export function bumpCompanyLogoVersion(): number {
  const version = Date.now();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(COMPANY_LOGO_VERSION_KEY, String(version));
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(new Event(COMPANY_LOGO_CHANGED_EVENT));
    } catch {
      // ignore
    }
  }
  return version;
}

export function buildVersionedLogoUrl(
  logoUrl: string | null | undefined,
  version: number
): string | null {
  if (!logoUrl) return null;
  return `${logoUrl}${logoUrl.includes("?") ? "&" : "?"}v=${version}`;
}
