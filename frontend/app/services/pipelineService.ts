// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:8101";

// ── Auth helpers (mirrors conversionService pattern) ──────────────────────────

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

// ── Pipeline types ────────────────────────────────────────────────────────────

export type PipelineStage =
  | "INTAKE" | "NORMALIZE" | "PARSE"
  | "CLASSIFY" | "GENERATE" | "REVIEW" | "COMMIT";

export type FileFormat =
  | "DWG" | "DXF" | "PDF" | "IFC" | "RVT" | "NWC" | "SCANNED_PDF";

export type WorkerJobStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED" | "SKIPPED";

export interface StageResult {
  stage: PipelineStage;
  status: WorkerJobStatus;
  message?: string;
  durationMs?: number;
  outputCount?: number;
  completedAt: string;
}

export interface PipelineJob {
  id: string;
  conversionJobId: string;
  fileId: string;
  fileFormat: FileFormat;
  currentStage: PipelineStage;
  workerStatus: WorkerJobStatus;
  stageResults: Partial<Record<PipelineStage, StageResult>>;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StageMeta {
  label: string;
  description: string;
}

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  "INTAKE", "NORMALIZE", "PARSE", "CLASSIFY", "GENERATE", "REVIEW", "COMMIT",
];

export const PIPELINE_STAGE_META: Record<PipelineStage, StageMeta> = {
  INTAKE:    { label: "Intake",    description: "File received, checksum verified, format detected"        },
  NORMALIZE: { label: "Normalize", description: "Convert to internal geometry representation"              },
  PARSE:     { label: "Parse",     description: "Extract layers, blocks, annotations, and references"      },
  CLASSIFY:  { label: "Classify",  description: "Match layer names to discipline categories (AIA/NCS)"     },
  GENERATE:  { label: "Generate",  description: "Infer and generate candidate BIM objects from geometry"   },
  REVIEW:    { label: "Review",    description: "Manual review — approve / reject / correct candidates"    },
  COMMIT:    { label: "Commit",    description: "Write approved candidates to BIM model layer"             },
};

// ── BIM element types ─────────────────────────────────────────────────────────

export type BimElementType =
  | "building" | "level"    | "zone"
  | "wall"     | "slab"     | "opening" | "door"   | "window"
  | "column"   | "beam"     | "footing"
  | "duct"     | "pipe"     | "cable_tray"          | "equipment";

export type BimElementStatus = "active" | "superseded" | "deleted";

export type CandidateDiscipline = "architecture" | "structure" | "mep";

export interface BimElement {
  id: string;
  projectId: string;
  conversionJobId: string;
  candidateId: string;
  elementType: BimElementType;
  discipline: CandidateDiscipline;
  label: string;
  sourceLayerRef: string;
  sourceFileId: string;
  properties: Record<string, string | number>;
  status: BimElementStatus;
  committedBy: string;
  committedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BimModelSummary {
  projectId: string;
  total: number;
  byDiscipline: Record<string, number>;
  byType: Record<string, number>;
}

// ── Audit trail types ─────────────────────────────────────────────────────────

export type AuditAction =
  | "CANDIDATE_APPROVED"
  | "CANDIDATE_REJECTED"
  | "CANDIDATE_CORRECTED"
  | "CANDIDATE_RESET"
  | "PIPELINE_JOB_CREATED"
  | "PIPELINE_STAGE_ADVANCED"
  | "MODEL_COMMIT"
  | "MODEL_ELEMENT_SUPERSEDED"
  | "JOB_STAGE_CHANGED";

export type AuditEntityType =
  | "candidate" | "pipeline_job" | "bim_element" | "conversion_job";

export interface AuditEvent {
  id: string;
  conversionJobId: string;
  entityId: string;
  entityType: AuditEntityType;
  action: AuditAction;
  actor: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  note: string | null;
  timestamp: string;
}

// ── Commit result ─────────────────────────────────────────────────────────────

export interface CommitResult {
  jobId: string;
  committed: number;
  skipped: number;
  rejected: number;
  elements: BimElement[];
  jobStage: string;
}

// ── Pipeline API functions ────────────────────────────────────────────────────

export async function fetchPipelineJobs(conversionJobId: string): Promise<PipelineJob[]> {
  const res = await fetch(
    `${API_BASE}/pipeline-jobs?conversionJobId=${encodeURIComponent(conversionJobId)}`,
    { headers: jsonHeaders(), cache: "no-store" }
  );
  const body = await handleResponse<{ data: PipelineJob[] }>(res);
  return body.data ?? [];
}

export async function createPipelineJob(payload: {
  conversionJobId: string;
  fileId: string;
  fileFormat: FileFormat;
}): Promise<PipelineJob> {
  const res = await fetch(`${API_BASE}/pipeline-jobs`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<{ data: PipelineJob }>(res);
  return body.data;
}

export async function advancePipelineStage(pipelineJobId: string): Promise<PipelineJob> {
  const res = await fetch(`${API_BASE}/pipeline-jobs/${pipelineJobId}/advance`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
  const body = await handleResponse<{ data: PipelineJob }>(res);
  return body.data;
}

// ── BIM model API functions ───────────────────────────────────────────────────

export async function fetchBimElements(filters?: {
  projectId?: string;
  conversionJobId?: string;
  discipline?: CandidateDiscipline;
  status?: BimElementStatus;
}): Promise<BimElement[]> {
  const qs = new URLSearchParams();
  if (filters?.projectId)       qs.set("projectId",       filters.projectId);
  if (filters?.conversionJobId) qs.set("conversionJobId", filters.conversionJobId);
  if (filters?.discipline)      qs.set("discipline",      filters.discipline);
  if (filters?.status)          qs.set("status",          filters.status);
  const query = qs.toString() ? `?${qs}` : "";
  const res = await fetch(`${API_BASE}/bim-elements${query}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: BimElement[] }>(res);
  return body.data ?? [];
}

export async function fetchBimModelSummary(projectId: string): Promise<BimModelSummary> {
  const res = await fetch(`${API_BASE}/bim-elements/summary/${projectId}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: BimModelSummary }>(res);
  return body.data;
}

export async function supersedeBimElement(
  elementId: string,
  note?: string
): Promise<BimElement> {
  const res = await fetch(`${API_BASE}/bim-elements/${elementId}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ status: "superseded", note }),
  });
  const body = await handleResponse<{ data: BimElement }>(res);
  return body.data;
}

// ── Commit & audit API functions ──────────────────────────────────────────────

export async function commitCandidatesToModel(
  conversionJobId: string,
  committedBy = "BIM Manager"
): Promise<CommitResult> {
  const res = await fetch(`${API_BASE}/conversion-requests/${conversionJobId}/commit`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ committedBy }),
  });
  const body = await handleResponse<{ data: CommitResult }>(res);
  return body.data;
}

export async function fetchAuditTrail(conversionJobId: string): Promise<AuditEvent[]> {
  const res = await fetch(`${API_BASE}/conversion-requests/${conversionJobId}/audit`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: AuditEvent[] }>(res);
  return body.data ?? [];
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CANDIDATE_APPROVED:        "Candidate approved",
  CANDIDATE_REJECTED:        "Candidate rejected",
  CANDIDATE_CORRECTED:       "Candidate corrected",
  CANDIDATE_RESET:           "Candidate reset to pending",
  PIPELINE_JOB_CREATED:      "Pipeline job queued",
  PIPELINE_STAGE_ADVANCED:   "Pipeline stage advanced",
  MODEL_COMMIT:              "Committed to BIM model",
  MODEL_ELEMENT_SUPERSEDED:  "BIM element superseded",
  JOB_STAGE_CHANGED:         "Job stage changed",
};

export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
  CANDIDATE_APPROVED:        "text-[#34d399]",
  CANDIDATE_REJECTED:        "text-[#f87171]",
  CANDIDATE_CORRECTED:       "text-[#a78bfa]",
  CANDIDATE_RESET:           "text-[#fbbf24]",
  PIPELINE_JOB_CREATED:      "text-[#60a5fa]",
  PIPELINE_STAGE_ADVANCED:   "text-[#60a5fa]",
  MODEL_COMMIT:              "text-[#34d399]",
  MODEL_ELEMENT_SUPERSEDED:  "text-[#f87171]",
  JOB_STAGE_CHANGED:         "text-[#d4933c]",
};

export const BIM_ELEMENT_TYPE_LABELS: Record<BimElementType, string> = {
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

export const WORKER_STATUS_COLORS: Record<WorkerJobStatus, string> = {
  QUEUED:  "text-[#fbbf24]",
  RUNNING: "text-[#60a5fa]",
  DONE:    "text-[#34d399]",
  FAILED:  "text-[#f87171]",
  SKIPPED: "text-[#6b7280]",
};
