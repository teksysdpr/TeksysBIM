// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:8101";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConversionStage =
  | "UPLOADED"
  | "UNDER_REVIEW"
  | "SCOPE_APPROVED"
  | "IN_CONVERSION"
  | "QA_CHECK"
  | "CLASH_REVIEW"
  | "COST_ESTIMATION"
  | "DELIVERED"
  | "REVISION_REQUESTED"
  | "CLOSED";

export interface ConversionJob {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  stage: ConversionStage;
  dueDate?: string | null;
  assignee?: string | null;
  fileIds?: string[];
  reviewRequired?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UploadedDrawing {
  id: string;
  projectId: string;
  originalName: string;
  category: string;
  status: string;
  sizeBytes?: number;
  storageKey?: string;
  createdAt: string;
}

export interface CreateJobPayload {
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  fileIds?: string[];
}

export interface PaginatedJobs {
  data: ConversionJob[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

// ── Stage display constants ────────────────────────────────────────────────────

export const STAGE_ORDER: ConversionStage[] = [
  "UPLOADED",
  "UNDER_REVIEW",
  "SCOPE_APPROVED",
  "IN_CONVERSION",
  "QA_CHECK",
  "CLASH_REVIEW",
  "COST_ESTIMATION",
  "DELIVERED",
  "REVISION_REQUESTED",
  "CLOSED",
];

export const STAGE_LABELS: Record<ConversionStage, string> = {
  UPLOADED:           "Uploaded",
  UNDER_REVIEW:       "Under Review",
  SCOPE_APPROVED:     "Scope Approved",
  IN_CONVERSION:      "In Conversion",
  QA_CHECK:           "QA Check",
  CLASH_REVIEW:       "Clash Review",
  COST_ESTIMATION:    "Cost Estimation",
  DELIVERED:          "Delivered",
  REVISION_REQUESTED: "Revision Req.",
  CLOSED:             "Closed",
};

export interface StageStyle {
  text: string;
  bg: string;
  border: string;
  dot: string;
}

export const STAGE_STYLES: Record<ConversionStage, StageStyle> = {
  UPLOADED:           { text: "text-[#60a5fa]", bg: "bg-[#60a5fa]/10", border: "border-[#1e3a5f]", dot: "bg-[#60a5fa]" },
  UNDER_REVIEW:       { text: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10", border: "border-[#78350f]", dot: "bg-[#fbbf24]" },
  SCOPE_APPROVED:     { text: "text-[#34d399]", bg: "bg-[#34d399]/10", border: "border-[#064e3b]", dot: "bg-[#34d399]" },
  IN_CONVERSION:      { text: "text-[#a78bfa]", bg: "bg-[#a78bfa]/10", border: "border-[#3b1f6b]", dot: "bg-[#a78bfa]" },
  QA_CHECK:           { text: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10", border: "border-[#78350f]", dot: "bg-[#fbbf24]" },
  CLASH_REVIEW:       { text: "text-[#f87171]", bg: "bg-[#f87171]/10", border: "border-[#7f1d1d]", dot: "bg-[#f87171]" },
  COST_ESTIMATION:    { text: "text-[#a78bfa]", bg: "bg-[#a78bfa]/10", border: "border-[#3b1f6b]", dot: "bg-[#a78bfa]" },
  REVISION_REQUESTED: { text: "text-[#f87171]", bg: "bg-[#f87171]/10", border: "border-[#7f1d1d]", dot: "bg-[#f87171]" },
  DELIVERED:          { text: "text-[#34d399]", bg: "bg-[#34d399]/10", border: "border-[#064e3b]", dot: "bg-[#34d399]" },
  CLOSED:             { text: "text-[#6b7280]", bg: "bg-white/5",       border: "border-white/10", dot: "bg-[#6b7280]" },
};

// ── Terminal / active stage classification ─────────────────────────────────────

export const TERMINAL_STAGES: ConversionStage[] = ["DELIVERED", "CLOSED"];
export const ACTIVE_STAGES: ConversionStage[] = [
  "UNDER_REVIEW", "SCOPE_APPROVED", "IN_CONVERSION",
  "QA_CHECK", "CLASH_REVIEW", "COST_ESTIMATION",
];
export const NEEDS_REVIEW_STAGES: ConversionStage[] = ["REVISION_REQUESTED", "CLASH_REVIEW", "QA_CHECK"];

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

// ── API ───────────────────────────────────────────────────────────────────────

export async function fetchConversionJobs(
  projectId: string,
  stage?: ConversionStage | "ALL"
): Promise<ConversionJob[]> {
  const qs = new URLSearchParams({ projectId });
  if (stage && stage !== "ALL") qs.set("stage", stage);
  const res = await fetch(`${API_BASE}/conversion-requests?${qs}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data?: ConversionJob[]; items?: ConversionJob[] }>(res);
  return body?.data ?? body?.items ?? [];
}

export async function fetchConversionJob(id: string): Promise<ConversionJob> {
  const res = await fetch(`${API_BASE}/conversion-requests/${id}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: ConversionJob }>(res);
  return body.data;
}

export async function createConversionJob(payload: CreateJobPayload): Promise<ConversionJob> {
  const res = await fetch(`${API_BASE}/conversion-requests`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<{ data: ConversionJob }>(res);
  return body.data;
}

export async function updateConversionJob(
  id: string,
  updates: Partial<Pick<ConversionJob, "title" | "description" | "dueDate" | "assignee" | "reviewRequired">>
): Promise<ConversionJob> {
  const res = await fetch(`${API_BASE}/conversion-requests/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(updates),
  });
  const body = await handleResponse<{ data: ConversionJob }>(res);
  return body.data;
}

export async function updateConversionStage(
  id: string,
  stage: ConversionStage
): Promise<ConversionJob> {
  const res = await fetch(`${API_BASE}/conversion-requests/${id}/stage`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ stage }),
  });
  const body = await handleResponse<{ data: ConversionJob }>(res);
  return body.data;
}

export async function deleteConversionJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/conversion-requests/${id}`, {
    method: "DELETE",
    headers: jsonHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete conversion job");
}

export async function attachFilesToJob(
  jobId: string,
  fileIds: string[]
): Promise<ConversionJob> {
  const res = await fetch(`${API_BASE}/conversion-requests/${jobId}/files`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ fileIds }),
  });
  const body = await handleResponse<{ data: ConversionJob }>(res);
  return body.data;
}

export interface UploadProgress {
  status: "uploading" | "done" | "error";
  error?: string;
  file?: UploadedDrawing;
}

export async function uploadDrawingFile(
  file: File,
  projectId: string,
  onProgress?: (pct: number) => void
): Promise<UploadedDrawing> {
  const form = new FormData();
  form.append("file", file);
  form.append("projectId", projectId);
  form.append("category", "SOURCE_CAD");

  // XHR to support progress reporting
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.addEventListener("load", () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(body?.data ?? body);
        } else {
          reject(new Error(body?.message ?? `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error("Upload response parse error"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("POST", `${API_BASE}/files/upload`);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(form);
  });
}

// ── Candidate review types ────────────────────────────────────────────────────

export type CandidateDiscipline = "architecture" | "structure" | "mep";
export type CandidateStatus = "pending_review" | "approved" | "rejected" | "corrected";

export interface CandidateObject {
  id: string;
  jobId: string;
  discipline: CandidateDiscipline;
  objectType: string;
  label: string;
  sourceFileId: string;
  sourceLayerRef: string;
  confidenceScore: number;
  status: CandidateStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  correctionNote?: string | null;
  reviewComment?: string | null;
  properties?: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
}

export interface DisciplineSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  corrected: number;
}

export interface ReviewSummary {
  jobId: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  corrected: number;
  byDiscipline: Record<CandidateDiscipline, DisciplineSummary>;
  completionPercent: number;
  allResolved: boolean;
}

export interface UpdateCandidatePayload {
  status?: CandidateStatus;
  reviewComment?: string;
  correctionNote?: string;
  reviewedBy?: string;
}

// ── Candidate API functions ───────────────────────────────────────────────────

export async function fetchCandidates(
  jobId: string,
  options?: { discipline?: CandidateDiscipline; status?: CandidateStatus }
): Promise<CandidateObject[]> {
  const qs = new URLSearchParams();
  if (options?.discipline) qs.set("discipline", options.discipline);
  if (options?.status)     qs.set("status",     options.status);
  const query = qs.toString() ? `?${qs}` : "";
  const res = await fetch(`${API_BASE}/conversion-requests/${jobId}/candidates${query}`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: CandidateObject[] }>(res);
  return body.data ?? [];
}

export async function updateCandidate(
  jobId: string,
  candidateId: string,
  payload: UpdateCandidatePayload
): Promise<CandidateObject> {
  const res = await fetch(
    `${API_BASE}/conversion-requests/${jobId}/candidates/${candidateId}`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(payload) }
  );
  const body = await handleResponse<{ data: CandidateObject }>(res);
  return body.data;
}

export async function fetchReviewSummary(jobId: string): Promise<ReviewSummary> {
  const res = await fetch(`${API_BASE}/conversion-requests/${jobId}/review-summary`, {
    headers: jsonHeaders(),
    cache: "no-store",
  });
  const body = await handleResponse<{ data: ReviewSummary }>(res);
  return body.data;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatConversionDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isOverdue(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}
