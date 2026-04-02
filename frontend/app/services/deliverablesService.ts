// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:8101";

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("dpr_access_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

function jsonHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({})) as unknown;
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}

// ── Types — Deliverables ──────────────────────────────────────────────────────

export type DeliverableStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type DeliverableType   = "IFC" | "RVT" | "DWG" | "PDF" | "NWC" | "COORDINATION_MODEL";

export interface Deliverable {
  id: string;
  projectId: string;
  conversionJobId: string | null;
  title: string;
  deliverableType: DeliverableType;
  version: string;
  status: DeliverableStatus;
  submittedBy: string;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewComments: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  DRAFT:     "Draft",
  SUBMITTED: "Submitted",
  APPROVED:  "Approved",
  REJECTED:  "Rejected",
};

export const DELIVERABLE_STATUS_STYLES: Record<DeliverableStatus, { text: string; bg: string; border: string; dot: string }> = {
  DRAFT:     { text: "text-[#9a7d5e]",  bg: "bg-white/5",          border: "border-white/10",    dot: "bg-[#9a7d5e]"  },
  SUBMITTED: { text: "text-[#60a5fa]",  bg: "bg-[#60a5fa]/10",     border: "border-[#1e3a5f]",   dot: "bg-[#60a5fa]"  },
  APPROVED:  { text: "text-[#34d399]",  bg: "bg-[#34d399]/10",     border: "border-[#064e3b]",   dot: "bg-[#34d399]"  },
  REJECTED:  { text: "text-[#f87171]",  bg: "bg-[#f87171]/10",     border: "border-[#7f1d1d]",   dot: "bg-[#f87171]"  },
};

export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  IFC:                 "IFC",
  RVT:                 "RVT",
  DWG:                 "DWG",
  PDF:                 "PDF",
  NWC:                 "NWC",
  COORDINATION_MODEL:  "Coord. Model",
};

// ── Types — Clash ─────────────────────────────────────────────────────────────

export type ClashSeverity    = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ClashIssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "WAIVED";

export interface ClashReport {
  id: string;
  projectId: string;
  title: string;
  disciplineA: string;
  disciplineB: string;
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  waivedIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClashIssue {
  id: string;
  reportId: string;
  projectId: string;
  title: string;
  description: string;
  disciplineA: string;
  disciplineB: string;
  severity: ClashSeverity;
  status: ClashIssueStatus;
  assignedTo: string | null;
  targetDate: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClashReportDetail extends ClashReport {
  issues: ClashIssue[];
}

export const CLASH_SEVERITY_LABELS: Record<ClashSeverity, string> = {
  LOW:      "Low",
  MEDIUM:   "Medium",
  HIGH:     "High",
  CRITICAL: "Critical",
};

export const CLASH_SEVERITY_STYLES: Record<ClashSeverity, { text: string; bg: string; border: string; dot: string }> = {
  LOW:      { text: "text-[#6b7280]",  bg: "bg-white/5",          border: "border-white/10",    dot: "bg-[#6b7280]"  },
  MEDIUM:   { text: "text-[#fbbf24]",  bg: "bg-[#fbbf24]/10",     border: "border-[#78350f]",   dot: "bg-[#fbbf24]"  },
  HIGH:     { text: "text-[#f97316]",  bg: "bg-[#f97316]/10",     border: "border-[#7c2d12]",   dot: "bg-[#f97316]"  },
  CRITICAL: { text: "text-[#f87171]",  bg: "bg-[#f87171]/10",     border: "border-[#7f1d1d]",   dot: "bg-[#f87171]"  },
};

export const CLASH_STATUS_LABELS: Record<ClashIssueStatus, string> = {
  OPEN:        "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED:    "Resolved",
  WAIVED:      "Waived",
};

export const CLASH_STATUS_STYLES: Record<ClashIssueStatus, { text: string; bg: string; border: string; dot: string }> = {
  OPEN:        { text: "text-[#f87171]",  bg: "bg-[#f87171]/10",     border: "border-[#7f1d1d]",   dot: "bg-[#f87171]"  },
  IN_PROGRESS: { text: "text-[#fbbf24]",  bg: "bg-[#fbbf24]/10",     border: "border-[#78350f]",   dot: "bg-[#fbbf24]"  },
  RESOLVED:    { text: "text-[#34d399]",  bg: "bg-[#34d399]/10",     border: "border-[#064e3b]",   dot: "bg-[#34d399]"  },
  WAIVED:      { text: "text-[#6b7280]",  bg: "bg-white/5",          border: "border-white/10",    dot: "bg-[#6b7280]"  },
};

// ── API — Deliverables ────────────────────────────────────────────────────────

export async function fetchDeliverables(filters?: {
  projectId?: string;
  status?: DeliverableStatus;
  type?: DeliverableType;
}): Promise<Deliverable[]> {
  const qs = new URLSearchParams();
  if (filters?.projectId) qs.set("projectId", filters.projectId);
  if (filters?.status)    qs.set("status",    filters.status);
  if (filters?.type)      qs.set("type",      filters.type);
  const query = qs.toString() ? `?${qs}` : "";
  const res = await fetch(`${API_BASE}/deliverables${query}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: Deliverable[] }>(res);
  return body.data ?? [];
}

export async function fetchDeliverable(id: string): Promise<Deliverable> {
  const res = await fetch(`${API_BASE}/deliverables/${id}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: Deliverable }>(res);
  return body.data;
}

// ── API — Clash ───────────────────────────────────────────────────────────────

export async function fetchClashReports(projectId?: string): Promise<ClashReport[]> {
  const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  const res = await fetch(`${API_BASE}/clash-reports${qs}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: ClashReport[] }>(res);
  return body.data ?? [];
}

export async function fetchClashReportDetail(reportId: string): Promise<ClashReportDetail> {
  const res = await fetch(`${API_BASE}/clash-reports/${reportId}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: ClashReportDetail }>(res);
  return body.data;
}

export async function fetchClashIssues(
  reportId: string,
  filters?: { severity?: ClashSeverity; status?: ClashIssueStatus }
): Promise<ClashIssue[]> {
  const qs = new URLSearchParams();
  if (filters?.severity) qs.set("severity", filters.severity);
  if (filters?.status)   qs.set("status",   filters.status);
  const query = qs.toString() ? `?${qs}` : "";
  const res = await fetch(`${API_BASE}/clash-reports/${reportId}/issues${query}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: ClashIssue[] }>(res);
  return body.data ?? [];
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isOverdue(dateIso?: string | null): boolean {
  if (!dateIso) return false;
  return new Date(dateIso) < new Date();
}
