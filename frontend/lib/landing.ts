const ADMIN_LANDING_PATH = "/company/dashboard";
const PLANNING_LANDING_PATH = "/company/pmo";
const CONTRACT_LANDING_PATH = "/company/contract";
const ACCOUNTS_LANDING_PATH = "/company/accounts";
const PURCHASE_LANDING_PATH = "/company/purchase";
const SITE_LANDING_PATH = "/company/project-team";

export type AuthCategory =
  | "ADMIN"
  | "PLANNING"
  | "CONTRACT"
  | "ACCOUNTS"
  | "PURCHASE"
  | "SITE";

function normalizeToken(value?: string | null): string {
  return String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

function resolveTokenToCategory(token?: string | null): AuthCategory | null {
  const normalized = normalizeToken(token);
  if (!normalized) return null;

  if (normalized === "ADMIN" || normalized === "COMPANY_ADMIN" || normalized === "COMPANYADMIN") {
    return "ADMIN";
  }

  if (
    normalized === "PLANNING" ||
    normalized === "PLANNER" ||
    normalized === "PMO" ||
    normalized === "PMO_MANAGER"
  ) {
    return "PLANNING";
  }

  if (
    normalized === "CONTRACT" ||
    normalized === "CONTRACT_MANAGER" ||
    normalized === "CONTRACTMANAGER"
  ) {
    return "CONTRACT";
  }

  if (
    normalized === "ACCOUNTS" ||
    normalized === "ACCOUNTS" ||
    normalized === "FINANCE" ||
    normalized === "ACCOUNTS_MANAGER" ||
    normalized === "ACCOUNTS_MANAGER" ||
    normalized === "FINANCE_MANAGER"
  ) {
    return "ACCOUNTS";
  }

  if (
    normalized === "PURCHASE" ||
    normalized === "PROCUREMENT" ||
    normalized === "PURCHASE_MANAGER" ||
    normalized === "PURCHASEMANAGER"
  ) {
    return "PURCHASE";
  }

  if (
    normalized === "SITE" ||
    normalized === "PROJECT_TEAM" ||
    normalized === "PROJECTTEAM" ||
    normalized === "SITE_TEAM" ||
    normalized === "SITETEAM"
  ) {
    return "SITE";
  }

  if (normalized.includes("ADMIN")) return "ADMIN";
  if (normalized.includes("PLANN") || normalized.includes("PMO")) return "PLANNING";
  if (normalized.includes("CONTRACT")) return "CONTRACT";
  if (normalized.includes("ACCOUNT") || normalized.includes("FINANCE")) return "ACCOUNTS";
  if (normalized.includes("PURCH") || normalized.includes("PROCURE")) return "PURCHASE";
  if (normalized.includes("SITE") || normalized.includes("PROJECT_TEAM")) return "SITE";

  return null;
}

export function getLandingPathByCategory(category?: string | null): string {
  const normalized = resolveTokenToCategory(category);
  if (normalized === "PLANNING") return PLANNING_LANDING_PATH;
  if (normalized === "CONTRACT") return CONTRACT_LANDING_PATH;
  if (normalized === "ACCOUNTS") return ACCOUNTS_LANDING_PATH;
  if (normalized === "PURCHASE") return PURCHASE_LANDING_PATH;
  if (normalized === "SITE") return SITE_LANDING_PATH;
  return ADMIN_LANDING_PATH;
}

export function resolveAuthCategory(params: {
  category?: string | null;
  role?: string | null;
}): AuthCategory {
  return (
    resolveTokenToCategory(params.category) ||
    resolveTokenToCategory(params.role) ||
    "ADMIN"
  );
}

export function getLandingPathFromAuthContext(params: {
  category?: string | null;
  role?: string | null;
  landingPath?: string | null;
}): string {
  const explicit = String(params.landingPath || "").trim();
  if (explicit) return explicit;
  return getLandingPathByCategory(resolveAuthCategory(params));
}

export const LANDING_PATHS = {
  admin: ADMIN_LANDING_PATH,
  planning: PLANNING_LANDING_PATH,
  contract: CONTRACT_LANDING_PATH,
  accounts: ACCOUNTS_LANDING_PATH,
  purchase: PURCHASE_LANDING_PATH,
  site: SITE_LANDING_PATH,
} as const;
