import { apiRequest } from "@/lib/apiClient";

// ── Enums ─────────────────────────────────────────────────────────────────────

export type ProjectStatus = "DRAFT" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT:     "Draft",
  ACTIVE:    "Active",
  ON_HOLD:   "On Hold",
  COMPLETED: "Completed",
  ARCHIVED:  "Archived",
};

export const PROJECT_STATUS_STYLES: Record<ProjectStatus, { badge: string; dot: string }> = {
  DRAFT:     { badge: "border-white/15 bg-white/5 text-[#9a7d5e]",              dot: "bg-[#9a7d5e]" },
  ACTIVE:    { badge: "border-[#064e3b]/60 bg-[#064e3b]/30 text-[#34d399]",     dot: "bg-[#34d399]" },
  ON_HOLD:   { badge: "border-[#78350f]/60 bg-[#78350f]/30 text-[#fbbf24]",     dot: "bg-[#fbbf24]" },
  COMPLETED: { badge: "border-[#1e3a5f]/60 bg-[#1e3a5f]/30 text-[#60a5fa]",    dot: "bg-[#60a5fa]" },
  ARCHIVED:  { badge: "border-white/10 bg-white/5 text-[#6b4f30]",             dot: "bg-[#6b4f30]" },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectMemberSummary {
  id: string;
  fullName: string;
  email: string;
  title?: string;
}

export type ProjectModule = "BIM_DESIGN" | "CAD2BIM" | "COSTING";

export const PROJECT_MODULE_LABELS: Record<ProjectModule, string> = {
  BIM_DESIGN: "BIM Design",
  CAD2BIM:    "2D CAD2BIM",
  COSTING:    "Costing",
};

export interface ProjectListItem {
  id: string;
  name: string;
  code: string;
  location?: string;
  status: ProjectStatus;
  module?: ProjectModule;
  clientName?: string;
  clientOrgId?: string;
  startDate?: string | null;
  endDate?: string | null;
  updatedAt: string;
  createdAt: string;
  _count?: {
    files?: number;
    conversionRequests?: number;
    members?: number;
    clashReports?: number;
    costEstimations?: number;
    tasks?: number;
    deliverables?: number;
  };
}

export interface ProjectDetail extends ProjectListItem {
  description?: string;
  members?: ProjectMemberSummary[];
}

export interface ProjectStats {
  totalFiles: number;
  openConversions: number;
  memberCount: number;
  openClashes: number;
  activeEstimates: number;
  openTasks: number;
  deliverables: number;
  recentExports: number;
}

export interface CreateProjectPayload {
  name: string;
  code: string;
  location?: string;
  description?: string;
  clientOrgId?: string;
  startDate?: string;
  endDate?: string;
  module?: ProjectModule;
  clientName?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseList<T>(result: T[] | { items: T[] } | { data: T[] }): T[] {
  if (Array.isArray(result)) return result;
  if ("items" in result && Array.isArray(result.items)) return result.items;
  if ("data" in result && Array.isArray(result.data)) return result.data;
  return [];
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function fetchProjects(params?: {
  status?: ProjectStatus;
  module?: ProjectModule;
  limit?: number;
  search?: string;
}): Promise<ProjectListItem[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.module) qs.set("module", params.module);
  if (params?.limit)  qs.set("limit", String(params.limit));
  if (params?.search) qs.set("q", params.search);
  const query = qs.toString();
  const result = await apiRequest<ProjectListItem[] | { items: ProjectListItem[] } | { data: ProjectListItem[] }>(
    `/projects${query ? `?${query}` : ""}`
  );
  return normaliseList(result);
}

export async function fetchProject(id: string): Promise<ProjectDetail> {
  const result = await apiRequest<{ data: ProjectDetail }>(`/projects/${id}`);
  return result.data;
}

export async function fetchProjectStats(id: string): Promise<ProjectStats> {
  const result = await apiRequest<{ data: ProjectStats }>(`/projects/${id}/stats`);
  return result.data;
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectDetail> {
  const result = await apiRequest<{ data: ProjectDetail }>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.data;
}

// ── Derived helpers ───────────────────────────────────────────────────────────

export function formatProjectDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}
