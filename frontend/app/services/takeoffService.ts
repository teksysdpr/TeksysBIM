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

export type TakeoffRevisionStatus = "draft" | "issued" | "superseded";

export interface TakeoffRevision {
  id: string;
  projectId: string;
  revisionNumber: number;
  label: string;
  generatedBy: string;
  generatedAt: string;
  status: TakeoffRevisionStatus;
  notes: string | null;
  createdAt: string;
}

export interface QuantityRecord {
  id: string;
  revisionId: string;
  projectId: string;
  bimElementId?: string;
  conversionJobId?: string;
  discipline: string;
  level: string;
  zone: string;
  elementType: string;
  description: string;
  unit: string;
  quantity: number;
  sourceLayerRef?: string;
  sourceFileId?: string;
  extractedBy: string;
  createdAt: string;
}

export interface TakeoffSummary {
  revisionId: string;
  totalRecords: number;
  byDiscipline: Record<string, { count: number; units: Record<string, number> }>;
  byElementType: Record<string, number>;
  byLevel: Record<string, number>;
}

export interface GenerateResult {
  revision: TakeoffRevision;
  recordsGenerated: number;
}

// ── Display constants ─────────────────────────────────────────────────────────

export const DISCIPLINE_LABELS: Record<string, string> = {
  architecture: "Architecture",
  structure:    "Structure",
  mep:          "MEP",
};

export const DISCIPLINE_COLORS: Record<string, string> = {
  architecture: "text-[#60a5fa]",
  structure:    "text-[#a78bfa]",
  mep:          "text-[#34d399]",
};

export const DISCIPLINE_BG: Record<string, string> = {
  architecture: "bg-[#60a5fa]/10 border-[#60a5fa]/20",
  structure:    "bg-[#a78bfa]/10 border-[#a78bfa]/20",
  mep:          "bg-[#34d399]/10 border-[#34d399]/20",
};

export const ELEMENT_TYPE_LABELS: Record<string, string> = {
  building:   "Building",
  level:      "Level",
  zone:       "Zone",
  wall:       "Wall",
  slab:       "Slab",
  opening:    "Opening",
  door:       "Door",
  window:     "Window",
  column:     "Column",
  beam:       "Beam",
  footing:    "Footing",
  duct:       "Duct Run",
  pipe:       "Pipe Run",
  cable_tray: "Cable Tray",
  equipment:  "Equipment",
};

export const REVISION_STATUS_COLORS: Record<TakeoffRevisionStatus, string> = {
  draft:      "text-[#fbbf24]",
  issued:     "text-[#34d399]",
  superseded: "text-[#6b7280]",
};

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchTakeoffRevisions(projectId: string): Promise<TakeoffRevision[]> {
  const res = await fetch(
    `${API_BASE}/takeoff/revisions?projectId=${encodeURIComponent(projectId)}`,
    { headers: jsonHeaders(), cache: "no-store" }
  );
  const body = await handleResponse<{ data: TakeoffRevision[] }>(res);
  return body.data ?? [];
}

export async function fetchQuantityRecords(filters: {
  revisionId: string;
  discipline?: string;
  level?: string;
  zone?: string;
  elementType?: string;
}): Promise<QuantityRecord[]> {
  const qs = new URLSearchParams({ revisionId: filters.revisionId });
  if (filters.discipline)  qs.set("discipline",  filters.discipline);
  if (filters.level)       qs.set("level",       filters.level);
  if (filters.zone)        qs.set("zone",        filters.zone);
  if (filters.elementType) qs.set("elementType", filters.elementType);

  const res = await fetch(`${API_BASE}/takeoff/quantities?${qs}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: QuantityRecord[] }>(res);
  return body.data ?? [];
}

export async function fetchTakeoffSummary(revisionId: string): Promise<TakeoffSummary> {
  const res = await fetch(
    `${API_BASE}/takeoff/summary?revisionId=${encodeURIComponent(revisionId)}`,
    { headers: jsonHeaders(), cache: "no-store" }
  );
  const body = await handleResponse<{ data: TakeoffSummary }>(res);
  return body.data;
}

export async function generateTakeoff(payload: {
  projectId: string;
  notes?: string;
  generatedBy?: string;
}): Promise<GenerateResult> {
  const res = await fetch(`${API_BASE}/takeoff/generate`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<{ data: GenerateResult }>(res);
  return body.data;
}
