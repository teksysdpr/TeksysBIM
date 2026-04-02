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

export type CandidateDiscipline = "architecture" | "structure" | "mep";
export type CandidateStatus = "pending_review" | "approved" | "rejected" | "corrected";

// ── Pipeline types ────────────────────────────────────────────────────────────

export type PipelineStage =
  | "INTAKE"
  | "NORMALIZE"
  | "PARSE"
  | "CLASSIFY"
  | "GENERATE"
  | "REVIEW"
  | "COMMIT";

export type FileFormat = "DWG" | "DXF" | "PDF" | "IFC" | "RVT" | "NWC" | "SCANNED_PDF";

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

// ── BIM model element types ───────────────────────────────────────────────────

export type BimElementType =
  | "building" | "level"    | "zone"
  | "wall"     | "slab"     | "opening" | "door"   | "window"
  | "column"   | "beam"     | "footing"
  | "duct"     | "pipe"     | "cable_tray"          | "equipment";

export type BimElementStatus = "active" | "superseded" | "deleted";

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

export type AuditEntityType = "candidate" | "pipeline_job" | "bim_element" | "conversion_job";

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

// ── Quantity takeoff types ────────────────────────────────────────────────────

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

// ── Costing / BOQ types ───────────────────────────────────────────────────────

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

// ── Estimate audit / history types ────────────────────────────────────────────

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

// ── Estimate comparison types ─────────────────────────────────────────────────

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
