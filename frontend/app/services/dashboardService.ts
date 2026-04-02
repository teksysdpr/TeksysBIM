import { apiRequest } from "@/lib/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  activeProjects: number;
  openConversions: number;
  pendingApprovals: number;
  openClashItems: number;
  estimationJobs: number;
  activeUsers: number;
  storageUsedMb: number;
  storageLimitMb: number;
  planName: string;
  recentExports: number;
}

export interface ActiveProject {
  id: string;
  name: string;
  code: string;
  status: string;
  clientName?: string;
  openConversions: number;
  openClashes: number;
  lastUpdated: string;
}

export interface ConversionJob {
  id: string;
  title: string;
  projectName?: string;
  stage: string;
  dueDate?: string | null;
  assignedEngineer?: string | null;
}

export interface DashboardAlert {
  id: string;
  type: "warning" | "error" | "info";
  title: string;
  message: string;
  link?: string;
}

// ── Stage display helpers ─────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  UPLOADED: "Uploaded",
  UNDER_REVIEW: "Under Review",
  SCOPE_APPROVED: "Scope Approved",
  IN_CONVERSION: "In Conversion",
  QA_CHECK: "QA Check",
  CLASH_REVIEW: "Clash Review",
  COST_ESTIMATION: "Cost Estimation",
  DELIVERED: "Delivered",
  REVISION_REQUESTED: "Revision Req.",
  CLOSED: "Closed",
};

export function conversionStageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>("/dashboard/summary");
}

type RawProject = Record<string, unknown>;

function toActiveProject(raw: RawProject): ActiveProject {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    code: String(raw.code ?? ""),
    status: String(raw.status ?? ""),
    clientName: raw.clientName != null ? String(raw.clientName) : undefined,
    openConversions: typeof raw.openConversions === "number" ? raw.openConversions : 0,
    openClashes: typeof raw.openClashes === "number" ? raw.openClashes : 0,
    lastUpdated: String(raw.lastUpdated ?? raw.updatedAt ?? raw.createdAt ?? ""),
  };
}

export async function fetchActiveProjects(): Promise<ActiveProject[]> {
  const result = await apiRequest<RawProject[] | { data: RawProject[] } | { items: RawProject[] }>(
    "/projects?status=ACTIVE&pageSize=5"
  );
  let rows: RawProject[] = [];
  if (Array.isArray(result)) rows = result;
  else if ("data" in result && Array.isArray(result.data)) rows = result.data;
  else if ("items" in result && Array.isArray(result.items)) rows = result.items;
  return rows.map(toActiveProject);
}

type RawConversion = Record<string, unknown>;

function toConversionJob(raw: RawConversion): ConversionJob {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    projectName: raw.projectName != null ? String(raw.projectName) : undefined,
    stage: String(raw.stage ?? ""),
    dueDate: raw.dueDate != null ? String(raw.dueDate) : null,
    assignedEngineer:
      raw.assignedEngineer != null
        ? String(raw.assignedEngineer)
        : raw.assignee != null
        ? String(raw.assignee)
        : null,
  };
}

export async function fetchConversionJobs(): Promise<ConversionJob[]> {
  const result = await apiRequest<RawConversion[] | { data: RawConversion[] } | { items: RawConversion[] }>(
    "/conversion-requests?pageSize=6"
  );
  let rows: RawConversion[] = [];
  if (Array.isArray(result)) rows = result;
  else if ("data" in result && Array.isArray(result.data)) rows = result.data;
  else if ("items" in result && Array.isArray(result.items)) rows = result.items;
  return rows.map(toConversionJob);
}

export async function fetchDashboardAlerts(): Promise<DashboardAlert[]> {
  const result = await apiRequest<
    DashboardAlert[] | { data: DashboardAlert[] } | { items: DashboardAlert[] }
  >("/notifications?limit=5");
  if (Array.isArray(result)) return result;
  if ("data" in result && Array.isArray(result.data)) return result.data;
  if ("items" in result && Array.isArray(result.items)) return result.items;
  return [];
}
