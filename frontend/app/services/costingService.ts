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

// ── Types ─────────────────────────────────────────────────────────────────────

export type EstimateStatus = "draft" | "submitted" | "approved" | "superseded";

export interface RateItem {
  id: string;
  discipline: string;
  elementType: string;
  description: string;
  unit: string;
  ratePerUnit: number;
  currency: string;
  region: string;
  rateRevision: string;
  notes: string | null;
  updatedAt: string;
}

export interface BoqLineItem {
  id: string;
  estimateId: string;
  quantityRecordId: string;
  discipline: string;
  level: string;
  zone: string;
  elementType: string;
  description: string;
  unit: string;
  quantity: number;
  rateItemId: string | null;
  ratePerUnit: number;
  amount: number;
  notes: string | null;
}

export interface EstimateRevision {
  id: string;
  projectId: string;
  takeoffRevisionId: string;
  revisionNumber: number;
  label: string;
  status: EstimateStatus;
  currency: string;
  contingencyPct: number;
  overheadPct: number;
  profitPct: number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

export interface EstimateSummary {
  estimateId: string;
  projectId: string;
  takeoffRevisionId: string;
  subtotal: number;
  contingency: number;
  overhead: number;
  profit: number;
  grandTotal: number;
  currency: string;
  contingencyPct: number;
  overheadPct: number;
  profitPct: number;
  byDiscipline: Record<string, { lineCount: number; amount: number }>;
}

export interface CreateEstimateResult {
  estimate: EstimateRevision;
  linesGenerated: number;
}

// ── Phase 3 types ─────────────────────────────────────────────────────────────

export type EstimateAuditAction =
  | "created"
  | "status_changed"
  | "line_rate_updated"
  | "line_qty_updated"
  | "line_removed"
  | "notes_updated";

export interface EstimateAuditEvent {
  id: string;
  estimateId: string;
  action: EstimateAuditAction;
  actor: string;
  note: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  timestamp: string;
}

export type ComparisonChangeType = "added" | "removed" | "changed" | "unchanged";

export interface ComparisonLine {
  quantityRecordId: string;
  discipline: string;
  elementType: string;
  description: string;
  unit: string;
  level: string;
  zone: string;
  changeType: ComparisonChangeType;
  baseQty: number | null;
  baseRate: number | null;
  baseAmount: number | null;
  compareQty: number | null;
  compareRate: number | null;
  compareAmount: number | null;
  qtyDelta: number | null;
  rateDelta: number | null;
  amountDelta: number | null;
}

export interface EstimateComparison {
  baseEstimateId: string;
  compareEstimateId: string;
  baseLabel: string;
  compareLabel: string;
  baseSubtotal: number;
  compareSubtotal: number;
  subtotalDelta: number;
  baseGrandTotal: number;
  compareGrandTotal: number;
  grandTotalDelta: number;
  changedCount: number;
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
  lines: ComparisonLine[];
}

// ── Display constants ─────────────────────────────────────────────────────────

export const ESTIMATE_STATUS_LABELS: Record<EstimateStatus, string> = {
  draft:      "Draft",
  submitted:  "Submitted",
  approved:   "Approved",
  superseded: "Superseded",
};

export const ESTIMATE_STATUS_COLORS: Record<EstimateStatus, string> = {
  draft:      "text-[#fbbf24]",
  submitted:  "text-[#60a5fa]",
  approved:   "text-[#34d399]",
  superseded: "text-[#6b7280]",
};

export const AUDIT_ACTION_LABELS: Record<EstimateAuditAction, string> = {
  created:           "Created",
  status_changed:    "Status Changed",
  line_rate_updated: "Rate Updated",
  line_qty_updated:  "Quantity Updated",
  line_removed:      "Line Removed",
  notes_updated:     "Notes Updated",
};

export const AUDIT_ACTION_COLORS: Record<EstimateAuditAction, string> = {
  created:           "text-[#34d399]",
  status_changed:    "text-[#60a5fa]",
  line_rate_updated: "text-[#d4933c]",
  line_qty_updated:  "text-[#d4933c]",
  line_removed:      "text-red-400",
  notes_updated:     "text-[#7a5e3e]",
};

export const CHANGE_TYPE_LABELS: Record<ComparisonChangeType, string> = {
  added:     "Added",
  removed:   "Removed",
  changed:   "Changed",
  unchanged: "Unchanged",
};

export const CHANGE_TYPE_COLORS: Record<ComparisonChangeType, string> = {
  added:     "text-[#34d399]",
  removed:   "text-red-400",
  changed:   "text-[#d4933c]",
  unchanged: "text-[#5a3e22]",
};

export const CHANGE_TYPE_ROW_BG: Record<ComparisonChangeType, string> = {
  added:     "bg-[#34d399]/5 border-[#34d399]/10",
  removed:   "bg-red-500/5 border-red-500/10",
  changed:   "bg-[#d4933c]/5 border-[#d4933c]/10",
  unchanged: "bg-[#0a0804] border-[#1a1208]",
};

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchEstimates(projectId: string): Promise<EstimateRevision[]> {
  const res = await fetch(
    `${API_BASE}/costing/estimates?projectId=${encodeURIComponent(projectId)}`,
    { headers: jsonHeaders(), cache: "no-store" }
  );
  const body = await handleResponse<{ data: EstimateRevision[] }>(res);
  return body.data ?? [];
}

export async function fetchBoqLineItems(estimateId: string): Promise<BoqLineItem[]> {
  const res = await fetch(
    `${API_BASE}/costing/estimates/${encodeURIComponent(estimateId)}/boq`,
    { headers: jsonHeaders(), cache: "no-store" }
  );
  const body = await handleResponse<{ data: BoqLineItem[] }>(res);
  return body.data ?? [];
}

export async function fetchEstimateSummary(estimateId: string): Promise<EstimateSummary> {
  const res = await fetch(
    `${API_BASE}/costing/estimates/${encodeURIComponent(estimateId)}/summary`,
    { headers: jsonHeaders(), cache: "no-store" }
  );
  const body = await handleResponse<{ data: EstimateSummary }>(res);
  return body.data;
}

export async function fetchRateLibrary(filters?: {
  discipline?: string;
  elementType?: string;
}): Promise<RateItem[]> {
  const qs = new URLSearchParams();
  if (filters?.discipline)  qs.set("discipline",  filters.discipline);
  if (filters?.elementType) qs.set("elementType", filters.elementType);
  const query = qs.toString() ? `?${qs}` : "";
  const res = await fetch(`${API_BASE}/costing/rate-library${query}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: RateItem[] }>(res);
  return body.data ?? [];
}

export async function createEstimate(payload: {
  projectId: string;
  takeoffRevisionId: string;
  label?: string;
  notes?: string;
  createdBy?: string;
  contingencyPct?: number;
  overheadPct?: number;
  profitPct?: number;
}): Promise<CreateEstimateResult> {
  const res = await fetch(`${API_BASE}/costing/estimates/create`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<{ data: CreateEstimateResult }>(res);
  return body.data;
}

export async function fetchEstimateComparison(
  baseId: string,
  compareId: string
): Promise<EstimateComparison> {
  const qs = new URLSearchParams({ baseId, compareId });
  const res = await fetch(`${API_BASE}/costing/estimates/compare?${qs}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: EstimateComparison }>(res);
  return body.data;
}

export async function fetchEstimateHistory(
  estimateId: string
): Promise<EstimateAuditEvent[]> {
  const res = await fetch(
    `${API_BASE}/costing/estimates/${encodeURIComponent(estimateId)}/history`,
    { headers: jsonHeaders(), cache: "no-store" }
  );
  const body = await handleResponse<{ data: EstimateAuditEvent[] }>(res);
  return body.data ?? [];
}

export async function updateEstimateStatus(
  estimateId: string,
  status: EstimateStatus
): Promise<EstimateRevision> {
  const res = await fetch(
    `${API_BASE}/costing/estimates/${encodeURIComponent(estimateId)}/status`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ status }),
    }
  );
  const body = await handleResponse<{ data: EstimateRevision }>(res);
  return body.data;
}
