import type {
  AuditAction, AuditEntityType, AuditEvent,
  BimElement, BimElementStatus, BimElementType,
  CandidateDiscipline, CandidateStatus, ConversionStage,
  FileFormat, PipelineJob, PipelineStage, StageResult, WorkerJobStatus,
  TakeoffRevision, TakeoffRevisionStatus, QuantityRecord,
  RateItem, BoqLineItem, EstimateRevision, EstimateAuditEvent,
} from "../types.js";

export const mockUsers = [
  {
    id: "u-admin-1",
    email: "admin@teksys.in",
    fullName: "Teksys BIM Admin",
    roles: ["ADMIN"],
    organizationId: "org-internal",
    password: "Admin@1234",
  },
  {
    id: "u-manager-1",
    email: "manager@teksys.in",
    fullName: "BIM Manager",
    roles: ["BIM_MANAGER"],
    organizationId: "org-internal",
    password: "Manager@1234",
  },
  {
    id: "u-client-1",
    email: "vpprojects@aishwaryam.com",
    fullName: "VP Projects — Aishwaryam",
    roles: ["CLIENT_VIEWER", "BIM_MANAGER"],
    organizationId: "org-aishwaryam",
    password: "Aishwaryam@1234",
  },
];

export type ProjectModule = "BIM_DESIGN" | "CAD2BIM" | "COSTING";

export interface MockProject {
  id: string;
  code: string;
  name: string;
  location: string;
  status: string;
  clientName: string;
  createdAt: string;
  module?: ProjectModule;
  description?: string;
  startDate?: string;
  endDate?: string;
  updatedAt?: string;
  members?: { id: string; email: string; fullName: string; title: string }[];
}

export const mockProjects: MockProject[] = [
  {
    id: "p-1",
    code: "TKS-BIM-001",
    name: "Aishwaryam Signature - CAD2BIM",
    module: "CAD2BIM",
    description: "Full CAD2BIM conversion of Tower-A and Tower-B including architectural, structural, and MEP disciplines. Deliverables include coordinated BIM models, clash reports, and model-based quantity extractions.",
    location: "Hyderabad",
    status: "ACTIVE",
    clientName: "Aishwaryam Group",
    startDate: "2026-03-20T00:00:00.000Z",
    endDate:   "2026-07-31T00:00:00.000Z",
    createdAt: "2026-03-20T09:00:00.000Z",
    updatedAt: "2026-03-29T11:15:00.000Z",
    members: [
      { id: "u-admin-1",   email: "admin@teksys.in",   fullName: "Teksys BIM Admin",  title: "BIM Admin" },
      { id: "u-manager-1", email: "manager@teksys.in", fullName: "BIM Manager",       title: "BIM Manager" },
    ],
  },
  {
    id: "p-2",
    code: "TKS-BIM-002",
    name: "Prestige Heights - BIM Coordination",
    module: "BIM_DESIGN",
    description: "Full BIM authoring and coordination for Prestige Heights residential tower. Includes architectural, structural and MEP models with clash detection.",
    location: "Bengaluru",
    status: "DRAFT",
    clientName: "Prestige Group",
    startDate: "2026-04-01T00:00:00.000Z",
    endDate:   "2026-09-30T00:00:00.000Z",
    createdAt: "2026-03-28T10:00:00.000Z",
    updatedAt: "2026-03-30T09:00:00.000Z",
    members: [
      { id: "u-manager-1", email: "manager@teksys.in", fullName: "BIM Manager", title: "BIM Manager" },
    ],
  },
  {
    id: "p-3",
    code: "TKS-COST-001",
    name: "Sobha Meadows - Cost Estimation",
    module: "COSTING",
    description: "Quantity takeoff and detailed cost estimation for Sobha Meadows villa project. Includes BOQ generation and rate analysis.",
    location: "Chennai",
    status: "ACTIVE",
    clientName: "Sobha Ltd",
    startDate: "2026-03-15T00:00:00.000Z",
    endDate:   "2026-05-31T00:00:00.000Z",
    createdAt: "2026-03-15T08:00:00.000Z",
    updatedAt: "2026-04-01T14:00:00.000Z",
    members: [
      { id: "u-admin-1",   email: "admin@teksys.in",   fullName: "Teksys BIM Admin", title: "BIM Admin" },
    ],
  },
];

export interface MockConversionRequest {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  stage: ConversionStage;
  dueDate: string;
  assignee: string;
  fileIds: string[];
  reviewRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockConversionRequests: MockConversionRequest[] = [
  {
    id: "cr-1",
    projectId: "p-1",
    title: "Tower-A Architectural CAD2BIM",
    description: "Full architectural floor plan conversion from DWG to BIM for Towers A/B.",
    stage: "UNDER_REVIEW",
    dueDate: "2026-04-10T00:00:00.000Z",
    assignee: "BIM Manager",
    fileIds: ["f-1"],
    reviewRequired: true,
    createdAt: "2026-03-21T09:30:00.000Z",
    updatedAt: "2026-03-22T14:00:00.000Z",
  },
  {
    id: "cr-2",
    projectId: "p-1",
    title: "Tower-A Structural Conversion",
    description: "Structural framing and column layout conversion from PDF drawings.",
    stage: "IN_CONVERSION",
    dueDate: "2026-04-14T00:00:00.000Z",
    assignee: "BIM Engineer Team",
    fileIds: ["f-2"],
    reviewRequired: false,
    createdAt: "2026-03-22T10:00:00.000Z",
    updatedAt: "2026-03-23T11:30:00.000Z",
  },
];

export const mockFiles = [
  {
    id: "f-1",
    projectId: "p-1",
    originalName: "TowerA_Arch_Rev03.dwg",
    category: "SOURCE_CAD",
    status: "READY",
    createdAt: "2026-03-21T09:15:00.000Z",
  },
  {
    id: "f-2",
    projectId: "p-1",
    originalName: "TowerA_Structure.pdf",
    category: "SOURCE_DOC",
    status: "READY",
    createdAt: "2026-03-21T10:05:00.000Z",
  },
];

// ── Candidate objects ─────────────────────────────────────────────────────────

export interface MockCandidateObject {
  id: string;
  jobId: string;
  discipline: CandidateDiscipline;
  objectType: string;
  label: string;
  sourceFileId: string;
  sourceLayerRef: string;
  confidenceScore: number;
  status: CandidateStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  correctionNote: string | null;
  reviewComment: string | null;
  properties: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
}

export const mockCandidateObjects: MockCandidateObject[] = [
  // ── cr-1: Tower-A Architectural (UNDER_REVIEW) ──────────────────────────────
  {
    id: "cand-1", jobId: "cr-1", discipline: "architecture",
    objectType: "Wall", label: "External Wall EW-001",
    sourceFileId: "f-1", sourceLayerRef: "A-WALL",
    confidenceScore: 94,
    status: "approved", reviewedBy: "BIM Manager", reviewedAt: "2026-03-22T10:00:00.000Z",
    correctionNote: null, reviewComment: "Clean wall definition, layer is unambiguous.",
    properties: { height: "3200mm", thickness: "230mm", material: "Brick Masonry", count: 14 },
    createdAt: "2026-03-22T09:00:00.000Z", updatedAt: "2026-03-22T10:00:00.000Z",
  },
  {
    id: "cand-2", jobId: "cr-1", discipline: "architecture",
    objectType: "Wall", label: "Internal Partition Wall IW-001",
    sourceFileId: "f-1", sourceLayerRef: "A-WALL-INT",
    confidenceScore: 78,
    status: "pending_review", reviewedBy: null, reviewedAt: null,
    correctionNote: null, reviewComment: null,
    properties: { height: "3200mm", thickness: "115mm", material: "Block Work", count: 22 },
    createdAt: "2026-03-22T09:00:00.000Z", updatedAt: "2026-03-22T09:00:00.000Z",
  },
  {
    id: "cand-3", jobId: "cr-1", discipline: "architecture",
    objectType: "Wall", label: "Retaining Wall RW-001",
    sourceFileId: "f-1", sourceLayerRef: "A-WALL-RTN",
    confidenceScore: 72,
    status: "corrected", reviewedBy: "BIM Manager", reviewedAt: "2026-03-22T11:30:00.000Z",
    correctionNote: "Height corrected from 3000mm to 4200mm per section drawing S-04.", reviewComment: null,
    properties: { height: "4200mm", thickness: "350mm", material: "RCC", count: 4 },
    createdAt: "2026-03-22T09:00:00.000Z", updatedAt: "2026-03-22T11:30:00.000Z",
  },
  {
    id: "cand-4", jobId: "cr-1", discipline: "architecture",
    objectType: "Wall", label: "Parapet Wall PW-001",
    sourceFileId: "f-1", sourceLayerRef: "A-WALL-PRAP",
    confidenceScore: 65,
    status: "pending_review", reviewedBy: null, reviewedAt: null,
    correctionNote: null, reviewComment: null,
    properties: { height: "900mm", thickness: "115mm", material: "Brick", count: 8 },
    createdAt: "2026-03-22T09:00:00.000Z", updatedAt: "2026-03-22T09:00:00.000Z",
  },
  {
    id: "cand-5", jobId: "cr-1", discipline: "architecture",
    objectType: "Door", label: "Single Leaf Door D-001",
    sourceFileId: "f-1", sourceLayerRef: "A-DOOR",
    confidenceScore: 92,
    status: "approved", reviewedBy: "BIM Manager", reviewedAt: "2026-03-22T10:30:00.000Z",
    correctionNote: null, reviewComment: null,
    properties: { width: "900mm", height: "2100mm", type: "Single Leaf Flush", count: 18 },
    createdAt: "2026-03-22T09:00:00.000Z", updatedAt: "2026-03-22T10:30:00.000Z",
  },
  {
    id: "cand-6", jobId: "cr-1", discipline: "architecture",
    objectType: "Door", label: "Double Leaf Door D-002",
    sourceFileId: "f-1", sourceLayerRef: "A-DOOR-DBL",
    confidenceScore: 85,
    status: "pending_review", reviewedBy: null, reviewedAt: null,
    correctionNote: null, reviewComment: null,
    properties: { width: "1800mm", height: "2100mm", type: "Double Leaf", count: 4 },
    createdAt: "2026-03-22T09:00:00.000Z", updatedAt: "2026-03-22T09:00:00.000Z",
  },
  {
    id: "cand-7", jobId: "cr-1", discipline: "architecture",
    objectType: "Window", label: "Fixed Glazing WN-001",
    sourceFileId: "f-1", sourceLayerRef: "A-GLAZ",
    confidenceScore: 78,
    status: "pending_review", reviewedBy: null, reviewedAt: null,
    correctionNote: null, reviewComment: null,
    properties: { width: "1200mm", height: "1500mm", sillHeight: "900mm", type: "Fixed Glazing", count: 32 },
    createdAt: "2026-03-22T09:00:00.000Z", updatedAt: "2026-03-22T09:00:00.000Z",
  },
  {
    id: "cand-8", jobId: "cr-1", discipline: "architecture",
    objectType: "Window", label: "Sliding Window WN-002",
    sourceFileId: "f-1", sourceLayerRef: "A-GLAZ-SLD",
    confidenceScore: 68,
    status: "rejected", reviewedBy: "BIM Manager", reviewedAt: "2026-03-22T12:00:00.000Z",
    correctionNote: null, reviewComment: "Sill height ambiguous in source DWG — requires manual modelling from detail drawing.",
    properties: { width: "1500mm", height: "1200mm", type: "Sliding 2-Track", count: 12 },
    createdAt: "2026-03-22T09:00:00.000Z", updatedAt: "2026-03-22T12:00:00.000Z",
  },
  {
    id: "cand-9", jobId: "cr-1", discipline: "structure",
    objectType: "Slab", label: "Typical Floor Slab SL-001",
    sourceFileId: "f-1", sourceLayerRef: "S-SLAB",
    confidenceScore: 88,
    status: "pending_review", reviewedBy: null, reviewedAt: null,
    correctionNote: null, reviewComment: null,
    properties: { thickness: "150mm", span: "4800 × 6000mm", material: "RCC M30", count: 6 },
    createdAt: "2026-03-22T09:00:00.000Z", updatedAt: "2026-03-22T09:00:00.000Z",
  },
  {
    id: "cand-10", jobId: "cr-1", discipline: "mep",
    objectType: "Duct Run", label: "Supply Air Duct DA-001",
    sourceFileId: "f-1", sourceLayerRef: "M-HVAC-SUP",
    confidenceScore: 61,
    status: "pending_review", reviewedBy: null, reviewedAt: null,
    correctionNote: null, reviewComment: null,
    properties: { width: "600mm", height: "300mm", length: "42000mm", system: "Supply Air" },
    createdAt: "2026-03-22T09:00:00.000Z", updatedAt: "2026-03-22T09:00:00.000Z",
  },

  // ── cr-2: Tower-A Structural (IN_CONVERSION) ─────────────────────────────────
  {
    id: "cand-11", jobId: "cr-2", discipline: "structure",
    objectType: "Column", label: "Square Column C-001 (300×300)",
    sourceFileId: "f-2", sourceLayerRef: "S-COLS",
    confidenceScore: 96,
    status: "approved", reviewedBy: "BIM Engineer Team", reviewedAt: "2026-03-23T10:00:00.000Z",
    correctionNote: null, reviewComment: "Column grid verified against grid lines.",
    properties: { width: "300mm", depth: "300mm", height: "3600mm", material: "RCC M30", count: 16 },
    createdAt: "2026-03-23T09:00:00.000Z", updatedAt: "2026-03-23T10:00:00.000Z",
  },
  {
    id: "cand-12", jobId: "cr-2", discipline: "structure",
    objectType: "Column", label: "Large Column C-002 (450×450)",
    sourceFileId: "f-2", sourceLayerRef: "S-COLS-L",
    confidenceScore: 91,
    status: "approved", reviewedBy: "BIM Engineer Team", reviewedAt: "2026-03-23T10:15:00.000Z",
    correctionNote: null, reviewComment: "Column size confirmed per structural layout.",
    properties: { width: "450mm", depth: "450mm", height: "3600mm", material: "RCC M35", count: 8 },
    createdAt: "2026-03-23T09:00:00.000Z", updatedAt: "2026-03-23T10:15:00.000Z",
  },
  {
    id: "cand-13", jobId: "cr-2", discipline: "structure",
    objectType: "Column", label: "Rectangular Column C-003 (600×300)",
    sourceFileId: "f-2", sourceLayerRef: "S-COLS-RECT",
    confidenceScore: 90,
    status: "approved", reviewedBy: "BIM Engineer Team", reviewedAt: "2026-03-23T10:20:00.000Z",
    correctionNote: null, reviewComment: "Verified against grid intersections on sheet S-02.",
    properties: { width: "600mm", depth: "300mm", height: "3600mm", material: "RCC M35", count: 6 },
    createdAt: "2026-03-23T09:00:00.000Z", updatedAt: "2026-03-23T10:20:00.000Z",
  },
  {
    id: "cand-14", jobId: "cr-2", discipline: "structure",
    objectType: "Beam", label: "Primary Beam B-001",
    sourceFileId: "f-2", sourceLayerRef: "S-BEAM-P",
    confidenceScore: 88,
    status: "approved", reviewedBy: "BIM Engineer Team", reviewedAt: "2026-03-23T10:30:00.000Z",
    correctionNote: null, reviewComment: "Beam schedule cross-checked with sheet S-05.",
    properties: { width: "300mm", depth: "600mm", material: "RCC M30", count: 24 },
    createdAt: "2026-03-23T09:00:00.000Z", updatedAt: "2026-03-23T10:30:00.000Z",
  },
  {
    id: "cand-15", jobId: "cr-2", discipline: "structure",
    objectType: "Beam", label: "Secondary Beam B-002",
    sourceFileId: "f-2", sourceLayerRef: "S-BEAM-S",
    confidenceScore: 82,
    status: "corrected", reviewedBy: "BIM Engineer Team", reviewedAt: "2026-03-23T11:00:00.000Z",
    correctionNote: "Depth updated from 400mm to 450mm per structural notes on sheet S-07.",
    reviewComment: null,
    properties: { width: "230mm", depth: "450mm", material: "RCC M25", count: 36 },
    createdAt: "2026-03-23T09:00:00.000Z", updatedAt: "2026-03-23T11:00:00.000Z",
  },
  {
    id: "cand-16", jobId: "cr-2", discipline: "structure",
    objectType: "Slab", label: "Transfer Slab SL-002",
    sourceFileId: "f-2", sourceLayerRef: "S-SLAB-T",
    confidenceScore: 91,
    status: "approved", reviewedBy: "BIM Engineer Team", reviewedAt: "2026-03-23T11:15:00.000Z",
    correctionNote: null,
    reviewComment: "Transfer slab thickness and span verified against structural drawings. High confidence classification confirmed.",
    properties: { thickness: "250mm", span: "8400 × 9600mm", material: "RCC M40", count: 1 },
    createdAt: "2026-03-23T09:00:00.000Z", updatedAt: "2026-03-23T11:15:00.000Z",
  },
  {
    id: "cand-17", jobId: "cr-2", discipline: "structure",
    objectType: "Footing", label: "Isolated Footing F-001",
    sourceFileId: "f-2", sourceLayerRef: "S-FNDTN",
    confidenceScore: 76,
    status: "approved", reviewedBy: "BIM Engineer Team", reviewedAt: "2026-03-23T11:30:00.000Z",
    correctionNote: null,
    reviewComment: "Isolated footing dimensions verified against foundation layout sheet S-01.",
    properties: { width: "1800mm", depth: "1800mm", thickness: "600mm", material: "RCC M25", count: 24 },
    createdAt: "2026-03-23T09:00:00.000Z", updatedAt: "2026-03-23T11:30:00.000Z",
  },
  {
    id: "cand-18", jobId: "cr-2", discipline: "mep",
    objectType: "Pipe Run", label: "Drainage Pipe P-001",
    sourceFileId: "f-2", sourceLayerRef: "P-DRAIN",
    confidenceScore: 58,
    status: "rejected", reviewedBy: "BIM Engineer Team", reviewedAt: "2026-03-23T11:45:00.000Z",
    correctionNote: null,
    reviewComment: "Drainage pipe is out of scope for structural PDF conversion. Low confidence (58%). To be addressed in MEP conversion phase.",
    properties: { diameter: "150mm", length: "28000mm", material: "uPVC", system: "Drainage" },
    createdAt: "2026-03-23T09:00:00.000Z", updatedAt: "2026-03-23T11:45:00.000Z",
  },
];

// ── Pipeline jobs ─────────────────────────────────────────────────────────────
// cr-1: at REVIEW stage, workerStatus RUNNING — awaiting manual candidate review.
// cr-2: at COMMIT stage, workerStatus RUNNING — all 8 candidates reviewed
//        (6 approved, 1 corrected, 1 rejected). 7 objects committable. No pending_review.

export const mockPipelineJobs: PipelineJob[] = [
  {
    id: "pj-1",
    conversionJobId: "cr-1",
    fileId: "f-1",
    fileFormat: "DWG",
    currentStage: "REVIEW",
    workerStatus: "RUNNING",
    errorMessage: null,
    stageResults: {
      INTAKE: {
        stage: "INTAKE", status: "DONE",
        message: "File received and registered. SHA-256 checksum verified.",
        durationMs: 120, outputCount: 1,
        completedAt: "2026-03-22T09:01:00.000Z",
      },
      NORMALIZE: {
        stage: "NORMALIZE", status: "DONE",
        message: "DWG converted to internal SVG/geometry representation. 47 blocks flattened.",
        durationMs: 3400, outputCount: 47,
        completedAt: "2026-03-22T09:01:03.000Z",
      },
      PARSE: {
        stage: "PARSE", status: "DONE",
        message: "Layer tree parsed. 24 named layers identified. Text annotations extracted.",
        durationMs: 1800, outputCount: 24,
        completedAt: "2026-03-22T09:01:05.000Z",
      },
      CLASSIFY: {
        stage: "CLASSIFY", status: "DONE",
        message: "Layers classified against AIA/NCS naming convention. 9 discipline groups matched.",
        durationMs: 2200, outputCount: 9,
        completedAt: "2026-03-22T09:01:07.000Z",
      },
      GENERATE: {
        stage: "GENERATE", status: "DONE",
        message: "10 candidate BIM objects generated from classified geometry. 2 low-confidence items flagged.",
        durationMs: 5600, outputCount: 10,
        completedAt: "2026-03-22T09:01:13.000Z",
      },
      REVIEW: {
        stage: "REVIEW", status: "RUNNING",
        message: "Awaiting manual review of generated candidates.",
        completedAt: "2026-03-22T09:01:13.000Z",
      },
    },
    createdAt: "2026-03-22T09:00:58.000Z",
    updatedAt: "2026-03-22T09:01:13.000Z",
  },
  {
    id: "pj-2",
    conversionJobId: "cr-2",
    fileId: "f-2",
    fileFormat: "PDF",
    currentStage: "COMMIT",
    workerStatus: "RUNNING",
    errorMessage: null,
    stageResults: {
      INTAKE: {
        stage: "INTAKE", status: "DONE",
        message: "PDF received. Page count: 12. Resolution: 300 DPI.",
        durationMs: 95, outputCount: 12,
        completedAt: "2026-03-23T09:01:00.000Z",
      },
      NORMALIZE: {
        stage: "NORMALIZE", status: "DONE",
        message: "PDF rasterised to high-res images. Vector text extracted where available.",
        durationMs: 8200, outputCount: 12,
        completedAt: "2026-03-23T09:01:08.000Z",
      },
      PARSE: {
        stage: "PARSE", status: "DONE",
        message: "Drawing sheets parsed. Grid lines, title blocks, and revision clouds identified.",
        durationMs: 4100, outputCount: 36,
        completedAt: "2026-03-23T09:01:12.000Z",
      },
      CLASSIFY: {
        stage: "CLASSIFY", status: "DONE",
        message: "Structural elements classified by hatch pattern and line weight analysis.",
        durationMs: 3700, outputCount: 8,
        completedAt: "2026-03-23T09:01:16.000Z",
      },
      GENERATE: {
        stage: "GENERATE", status: "DONE",
        message: "8 structural candidate objects generated. Footing and drainage objects flagged for manual review.",
        durationMs: 7100, outputCount: 8,
        completedAt: "2026-03-23T09:01:23.000Z",
      },
      REVIEW: {
        stage: "REVIEW", status: "DONE",
        message: "Review complete. 6 approved, 1 corrected, 1 rejected. 7 objects ready for commit.",
        durationMs: 0, outputCount: 7,
        completedAt: "2026-03-23T11:45:00.000Z",
      },
      COMMIT: {
        stage: "COMMIT", status: "RUNNING",
        message: "Awaiting final commit to BIM model layer.",
        completedAt: "2026-03-23T11:45:00.000Z",
      },
    },
    createdAt: "2026-03-23T09:00:57.000Z",
    updatedAt: "2026-03-23T11:45:00.000Z",
  },
];

// ── BIM model elements ────────────────────────────────────────────────────────
// Mutable array — committed during runtime will be pushed here.

export const mockBimElements: BimElement[] = [];

// ── Audit events ──────────────────────────────────────────────────────────────
// Bootstrapped with seed events matching mock candidate data above.

export const mockAuditEvents: AuditEvent[] = [
  // cr-1 seed events (existing approved/corrected/rejected candidates)
  {
    id: "ae-1", conversionJobId: "cr-1", entityId: "cand-1",
    entityType: "candidate", action: "CANDIDATE_APPROVED",
    actor: "BIM Manager", before: { status: "pending_review" }, after: { status: "approved" },
    note: "Clean wall definition, layer is unambiguous.",
    timestamp: "2026-03-22T10:00:00.000Z",
  },
  {
    id: "ae-2", conversionJobId: "cr-1", entityId: "cand-3",
    entityType: "candidate", action: "CANDIDATE_CORRECTED",
    actor: "BIM Manager", before: { status: "pending_review" }, after: { status: "corrected" },
    note: "Height corrected from 3000mm to 4200mm per section drawing S-04.",
    timestamp: "2026-03-22T11:30:00.000Z",
  },
  {
    id: "ae-3", conversionJobId: "cr-1", entityId: "cand-5",
    entityType: "candidate", action: "CANDIDATE_APPROVED",
    actor: "BIM Manager", before: { status: "pending_review" }, after: { status: "approved" },
    note: null,
    timestamp: "2026-03-22T10:30:00.000Z",
  },
  {
    id: "ae-4", conversionJobId: "cr-1", entityId: "cand-8",
    entityType: "candidate", action: "CANDIDATE_REJECTED",
    actor: "BIM Manager", before: { status: "pending_review" }, after: { status: "rejected" },
    note: "Sill height ambiguous — requires manual modelling.",
    timestamp: "2026-03-22T12:00:00.000Z",
  },
  {
    id: "ae-5", conversionJobId: "cr-1", entityId: "pj-1",
    entityType: "pipeline_job", action: "PIPELINE_JOB_CREATED",
    actor: "system", before: null, after: { stage: "INTAKE", workerStatus: "QUEUED" },
    note: "Pipeline job created on file upload.",
    timestamp: "2026-03-22T09:00:58.000Z",
  },
  // cr-2 seed events
  {
    id: "ae-6", conversionJobId: "cr-2", entityId: "cand-11",
    entityType: "candidate", action: "CANDIDATE_APPROVED",
    actor: "BIM Engineer Team", before: { status: "pending_review" }, after: { status: "approved" },
    note: "Column grid verified against grid lines.",
    timestamp: "2026-03-23T10:00:00.000Z",
  },
  {
    id: "ae-6b", conversionJobId: "cr-2", entityId: "cand-12",
    entityType: "candidate", action: "CANDIDATE_APPROVED",
    actor: "BIM Engineer Team", before: { status: "pending_review" }, after: { status: "approved" },
    note: "Column size confirmed per structural layout.",
    timestamp: "2026-03-23T10:15:00.000Z",
  },
  {
    id: "ae-6c", conversionJobId: "cr-2", entityId: "cand-13",
    entityType: "candidate", action: "CANDIDATE_APPROVED",
    actor: "BIM Engineer Team", before: { status: "pending_review" }, after: { status: "approved" },
    note: "Verified against grid intersections on sheet S-02.",
    timestamp: "2026-03-23T10:20:00.000Z",
  },
  {
    id: "ae-6d", conversionJobId: "cr-2", entityId: "cand-14",
    entityType: "candidate", action: "CANDIDATE_APPROVED",
    actor: "BIM Engineer Team", before: { status: "pending_review" }, after: { status: "approved" },
    note: "Beam schedule cross-checked with sheet S-05.",
    timestamp: "2026-03-23T10:30:00.000Z",
  },
  {
    id: "ae-7", conversionJobId: "cr-2", entityId: "cand-15",
    entityType: "candidate", action: "CANDIDATE_CORRECTED",
    actor: "BIM Engineer Team", before: { status: "pending_review" }, after: { status: "corrected" },
    note: "Depth updated from 400mm to 450mm per structural notes on sheet S-07.",
    timestamp: "2026-03-23T11:00:00.000Z",
  },
  {
    id: "ae-8", conversionJobId: "cr-2", entityId: "pj-2",
    entityType: "pipeline_job", action: "PIPELINE_JOB_CREATED",
    actor: "system", before: null, after: { stage: "INTAKE", workerStatus: "QUEUED" },
    note: "Pipeline job created on file upload.",
    timestamp: "2026-03-23T09:00:57.000Z",
  },
  {
    id: "ae-9", conversionJobId: "cr-2", entityId: "cand-16",
    entityType: "candidate", action: "CANDIDATE_APPROVED",
    actor: "BIM Engineer Team", before: { status: "pending_review" }, after: { status: "approved" },
    note: "Transfer slab thickness and span verified against structural drawings. High confidence classification confirmed.",
    timestamp: "2026-03-23T11:15:00.000Z",
  },
  {
    id: "ae-10", conversionJobId: "cr-2", entityId: "cand-17",
    entityType: "candidate", action: "CANDIDATE_APPROVED",
    actor: "BIM Engineer Team", before: { status: "pending_review" }, after: { status: "approved" },
    note: "Isolated footing dimensions verified against foundation layout sheet S-01.",
    timestamp: "2026-03-23T11:30:00.000Z",
  },
  {
    id: "ae-11", conversionJobId: "cr-2", entityId: "cand-18",
    entityType: "candidate", action: "CANDIDATE_REJECTED",
    actor: "BIM Engineer Team", before: { status: "pending_review" }, after: { status: "rejected" },
    note: "Drainage pipe is out of scope for structural PDF conversion. Low confidence (58%). To be addressed in MEP conversion phase.",
    timestamp: "2026-03-23T11:45:00.000Z",
  },
] as AuditEvent[];

// ── Takeoff revisions ─────────────────────────────────────────────────────────

export const mockTakeoffRevisions: TakeoffRevision[] = [
  {
    id: "tr-1",
    projectId: "p-1",
    revisionNumber: 1,
    label: "Rev-01 — Initial Extraction",
    generatedBy: "BIM Manager",
    generatedAt: "2026-03-24T10:00:00.000Z",
    status: "issued",
    notes: "First extraction from architectural and structural conversion jobs.",
    createdAt: "2026-03-24T10:00:00.000Z",
  },
  {
    id: "tr-2",
    projectId: "p-1",
    revisionNumber: 2,
    label: "Rev-02 — MEP Added",
    generatedBy: "BIM Manager",
    generatedAt: "2026-03-28T14:00:00.000Z",
    status: "draft",
    notes: "MEP quantities added from mechanical conversion job.",
    createdAt: "2026-03-28T14:00:00.000Z",
  },
];

// ── Quantity records ──────────────────────────────────────────────────────────

export let mockQuantityRecords: QuantityRecord[] = [
  // ── Architecture — Rev-01 ──────────────────────────────────────────────────
  {
    id: "qr-1",  revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "architecture", level: "G",   zone: "Zone-A",          elementType: "wall",
    description: "External load-bearing brick wall 230mm",              unit: "m²",  quantity: 340.5,
    sourceLayerRef: "A-WALL-EXT", extractedBy: "BIM Manager", createdAt: "2026-03-24T10:01:00.000Z",
  },
  {
    id: "qr-2",  revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "architecture", level: "G",   zone: "Zone-Core",       elementType: "wall",
    description: "Internal partition wall 115mm",                       unit: "m²",  quantity: 180.0,
    sourceLayerRef: "A-WALL-INT", extractedBy: "BIM Manager", createdAt: "2026-03-24T10:01:05.000Z",
  },
  {
    id: "qr-3",  revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "architecture", level: "L1",  zone: "Zone-A",          elementType: "wall",
    description: "External load-bearing brick wall 230mm",              unit: "m²",  quantity: 320.0,
    sourceLayerRef: "A-WALL-EXT", extractedBy: "BIM Manager", createdAt: "2026-03-24T10:01:10.000Z",
  },
  {
    id: "qr-4",  revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "architecture", level: "L2",  zone: "Zone-Periphery",  elementType: "wall",
    description: "External load-bearing brick wall 230mm",              unit: "m²",  quantity: 295.5,
    sourceLayerRef: "A-WALL-EXT", extractedBy: "BIM Manager", createdAt: "2026-03-24T10:01:15.000Z",
  },
  {
    id: "qr-5",  revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "architecture", level: "G",   zone: "Zone-Core",       elementType: "door",
    description: "Single flush door 900x2100",                         unit: "nos", quantity: 12,
    sourceLayerRef: "A-DOOR",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:01:20.000Z",
  },
  {
    id: "qr-6",  revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "architecture", level: "L1",  zone: "Zone-A",          elementType: "door",
    description: "Single flush door 900x2100",                         unit: "nos", quantity: 18,
    sourceLayerRef: "A-DOOR",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:01:25.000Z",
  },
  {
    id: "qr-7",  revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "architecture", level: "G",   zone: "Zone-A",          elementType: "window",
    description: "Aluminium sliding window 1200x1200",                 unit: "nos", quantity: 24,
    sourceLayerRef: "A-GLAZ",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:01:30.000Z",
  },
  {
    id: "qr-8",  revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "architecture", level: "L1",  zone: "Zone-A",          elementType: "window",
    description: "Aluminium sliding window 1200x1200",                 unit: "nos", quantity: 24,
    sourceLayerRef: "A-GLAZ",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:01:35.000Z",
  },
  {
    id: "qr-9",  revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "architecture", level: "G",   zone: "Zone-Core",       elementType: "slab",
    description: "RCC slab 150mm thick",                               unit: "m²",  quantity: 420.0,
    sourceLayerRef: "A-SLAB",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:01:40.000Z",
  },
  // ── Structure — Rev-01 ────────────────────────────────────────────────────
  {
    id: "qr-10", revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-2",
    discipline: "structure", level: "Foundation", zone: "Zone-A",      elementType: "footing",
    description: "Isolated footing 1500x1500x500",                     unit: "m³",  quantity: 45.0,
    sourceLayerRef: "S-FNDN",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:02:00.000Z",
  },
  {
    id: "qr-11", revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-2",
    discipline: "structure", level: "G",   zone: "Zone-A",             elementType: "column",
    description: "RCC column 450x450",                                 unit: "m³",  quantity: 28.8,
    sourceLayerRef: "S-COLS",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:02:05.000Z",
  },
  {
    id: "qr-12", revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-2",
    discipline: "structure", level: "L1",  zone: "Zone-A",             elementType: "column",
    description: "RCC column 450x450",                                 unit: "m³",  quantity: 26.4,
    sourceLayerRef: "S-COLS",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:02:10.000Z",
  },
  {
    id: "qr-13", revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-2",
    discipline: "structure", level: "G",   zone: "Zone-Core",          elementType: "beam",
    description: "Primary beam 300x600",                               unit: "m³",  quantity: 35.2,
    sourceLayerRef: "S-BEAM",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:02:15.000Z",
  },
  {
    id: "qr-14", revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-2",
    discipline: "structure", level: "L1",  zone: "Zone-Core",          elementType: "beam",
    description: "Primary beam 300x600",                               unit: "m³",  quantity: 33.6,
    sourceLayerRef: "S-BEAM",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:02:20.000Z",
  },
  {
    id: "qr-15", revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-2",
    discipline: "structure", level: "G",   zone: "Zone-A",             elementType: "slab",
    description: "Structural RCC flat slab 200mm",                    unit: "m²",  quantity: 520.0,
    sourceLayerRef: "S-SLAB",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:02:25.000Z",
  },
  {
    id: "qr-16", revisionId: "tr-1", projectId: "p-1", conversionJobId: "cr-2",
    discipline: "structure", level: "Roof", zone: "Zone-A",            elementType: "slab",
    description: "Terrace slab 150mm with waterproofing",             unit: "m²",  quantity: 480.0,
    sourceLayerRef: "S-SLAB",    extractedBy: "BIM Manager", createdAt: "2026-03-24T10:02:30.000Z",
  },
  // ── MEP — Rev-02 ──────────────────────────────────────────────────────────
  {
    id: "qr-17", revisionId: "tr-2", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "mep", level: "G",   zone: "Zone-Core",               elementType: "duct",
    description: "Rectangular HVAC supply duct 600x400",              unit: "m",   quantity: 85.0,
    sourceLayerRef: "M-HVAC-SUP", extractedBy: "BIM Manager", createdAt: "2026-03-28T14:01:00.000Z",
  },
  {
    id: "qr-18", revisionId: "tr-2", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "mep", level: "L1",  zone: "Zone-Core",               elementType: "duct",
    description: "Rectangular HVAC supply duct 600x400",              unit: "m",   quantity: 80.0,
    sourceLayerRef: "M-HVAC-SUP", extractedBy: "BIM Manager", createdAt: "2026-03-28T14:01:05.000Z",
  },
  {
    id: "qr-19", revisionId: "tr-2", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "mep", level: "G",   zone: "Zone-A",                  elementType: "pipe",
    description: "Domestic water supply pipe 50mm dia",               unit: "m",   quantity: 120.0,
    sourceLayerRef: "P-DOMW",    extractedBy: "BIM Manager", createdAt: "2026-03-28T14:01:10.000Z",
  },
  {
    id: "qr-20", revisionId: "tr-2", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "mep", level: "L1",  zone: "Zone-A",                  elementType: "pipe",
    description: "Domestic water supply pipe 50mm dia",               unit: "m",   quantity: 115.0,
    sourceLayerRef: "P-DOMW",    extractedBy: "BIM Manager", createdAt: "2026-03-28T14:01:15.000Z",
  },
  {
    id: "qr-21", revisionId: "tr-2", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "mep", level: "G",   zone: "Zone-Core",               elementType: "equipment",
    description: "AHU — Air Handling Unit (packaged)",                unit: "nos", quantity: 2,
    sourceLayerRef: "M-EQUIP",   extractedBy: "BIM Manager", createdAt: "2026-03-28T14:01:20.000Z",
  },
  {
    id: "qr-22", revisionId: "tr-2", projectId: "p-1", conversionJobId: "cr-1",
    discipline: "mep", level: "G",   zone: "Zone-A",                  elementType: "cable_tray",
    description: "Cable tray 300mm wide (perforated)",                unit: "m",   quantity: 95.0,
    sourceLayerRef: "E-CTRAY",   extractedBy: "BIM Manager", createdAt: "2026-03-28T14:01:25.000Z",
  },
];

// ── Rate library ──────────────────────────────────────────────────────────────
// Schedule of Rates — Maharashtra region, Q1-2026.

export const mockRateItems: RateItem[] = [
  // Architecture
  { id: "rl-1",  discipline: "architecture", elementType: "wall",       description: "External / internal masonry wall (plastered finish)",        unit: "m²",  ratePerUnit: 850,   currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
  { id: "rl-2",  discipline: "architecture", elementType: "door",       description: "Single leaf flush door with frame & ironmongery",            unit: "nos", ratePerUnit: 18500, currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
  { id: "rl-3",  discipline: "architecture", elementType: "window",     description: "Aluminium sliding window with glass (1200×1200)",           unit: "nos", ratePerUnit: 12000, currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
  { id: "rl-4",  discipline: "architecture", elementType: "slab",       description: "RCC slab 150mm — architectural / non-structural",           unit: "m²",  ratePerUnit: 1200,  currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
  // Structure
  { id: "rl-5",  discipline: "structure",    elementType: "footing",    description: "Isolated footing — M25 RCC with bar reinforcement",         unit: "m³",  ratePerUnit: 22000, currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
  { id: "rl-6",  discipline: "structure",    elementType: "column",     description: "RCC column 450×450 — M25 grade concrete",                  unit: "m³",  ratePerUnit: 28000, currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
  { id: "rl-7",  discipline: "structure",    elementType: "beam",       description: "Primary RCC beam 300×600 — M25 grade",                     unit: "m³",  ratePerUnit: 26000, currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
  { id: "rl-8",  discipline: "structure",    elementType: "slab",       description: "Structural RCC flat slab 200mm — M25 grade concrete",      unit: "m²",  ratePerUnit: 1450,  currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
  // MEP
  { id: "rl-9",  discipline: "mep",          elementType: "duct",       description: "GI rectangular HVAC supply / return duct (600×400)",       unit: "m",   ratePerUnit: 3200,  currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
  { id: "rl-10", discipline: "mep",          elementType: "pipe",       description: "GI domestic water supply pipe 50mm dia (complete)",        unit: "m",   ratePerUnit: 1800,  currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
  { id: "rl-11", discipline: "mep",          elementType: "equipment",  description: "Packaged AHU (Air Handling Unit) — supply + installation",  unit: "nos", ratePerUnit: 85000, currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
  { id: "rl-12", discipline: "mep",          elementType: "cable_tray", description: "Perforated cable tray 300mm wide with supports & clamps",  unit: "m",   ratePerUnit: 2400,  currency: "INR", region: "Maharashtra", rateRevision: "SOR-2026-Q1", notes: null, updatedAt: "2026-03-01T00:00:00.000Z" },
];

// ── Estimate revisions ────────────────────────────────────────────────────────
// Est-01 is linked to takeoff revision tr-1 (Architecture + Structure, 16 records).

export let mockEstimateRevisions: EstimateRevision[] = [
  {
    id: "est-1",
    projectId: "p-1",
    takeoffRevisionId: "tr-1",
    revisionNumber: 1,
    label: "Est-01 — Arch + Structure (Rev-01)",
    status: "draft",
    currency: "INR",
    contingencyPct: 5,
    overheadPct: 10,
    profitPct: 8,
    notes: "Initial estimate covering architectural and structural works from Rev-01 takeoff.",
    createdBy: "BIM Manager",
    createdAt: "2026-03-25T09:00:00.000Z",
  },
  // Est-02: MEP only — from Rev-02 takeoff (tr-2)
  // Subtotal: ₹13,49,000 | Grand Total: ₹16,59,270
  {
    id: "est-2",
    projectId: "p-1",
    takeoffRevisionId: "tr-2",
    revisionNumber: 2,
    label: "Est-02 — MEP Works (Rev-02)",
    status: "draft",
    currency: "INR",
    contingencyPct: 5,
    overheadPct: 10,
    profitPct: 8,
    notes: "MEP estimate from Rev-02 takeoff. HVAC, plumbing, electrical tray included.",
    createdBy: "BIM Engineer",
    createdAt: "2026-03-29T09:00:00.000Z",
  },
  // Est-03: Revised Arch + Structure — updated wall/column rates, door L1 scope removed.
  // Subtotal: ₹81,81,600 | Grand Total: ₹1,00,63,368
  {
    id: "est-3",
    projectId: "p-1",
    takeoffRevisionId: "tr-1",
    revisionNumber: 3,
    label: "Est-03 — Arch + Structure Revised (SOR March 2026)",
    status: "submitted",
    currency: "INR",
    contingencyPct: 5,
    overheadPct: 10,
    profitPct: 8,
    notes: "Revised estimate: wall rate updated ₹850→₹900/m², column rate updated ₹28,000→₹29,500/m³, L1 door line removed (contractor scope).",
    createdBy: "BIM Manager",
    createdAt: "2026-03-28T09:00:00.000Z",
  },
];

// ── BOQ line items ────────────────────────────────────────────────────────────
// 16 lines mapped from takeoff revision tr-1 (qr-1 → qr-16).
// Amounts = quantity × ratePerUnit.

export let mockBoqLineItems: BoqLineItem[] = [
  // ── Architecture ─────────────────────────────────────────────────────────
  { id: "boq-1",  estimateId: "est-1", quantityRecordId: "qr-1",  discipline: "architecture", level: "G",          zone: "Zone-A",        elementType: "wall",    description: "External load-bearing brick wall 230mm",   unit: "m²",  quantity: 340.5, rateItemId: "rl-1", ratePerUnit: 850,   amount: 289425, notes: null },
  { id: "boq-2",  estimateId: "est-1", quantityRecordId: "qr-2",  discipline: "architecture", level: "G",          zone: "Zone-Core",     elementType: "wall",    description: "Internal partition wall 115mm",            unit: "m²",  quantity: 180.0, rateItemId: "rl-1", ratePerUnit: 850,   amount: 153000, notes: null },
  { id: "boq-3",  estimateId: "est-1", quantityRecordId: "qr-3",  discipline: "architecture", level: "L1",         zone: "Zone-A",        elementType: "wall",    description: "External load-bearing brick wall 230mm",   unit: "m²",  quantity: 320.0, rateItemId: "rl-1", ratePerUnit: 850,   amount: 272000, notes: null },
  { id: "boq-4",  estimateId: "est-1", quantityRecordId: "qr-4",  discipline: "architecture", level: "L2",         zone: "Zone-Periphery",elementType: "wall",    description: "External load-bearing brick wall 230mm",   unit: "m²",  quantity: 295.5, rateItemId: "rl-1", ratePerUnit: 850,   amount: 251175, notes: null },
  { id: "boq-5",  estimateId: "est-1", quantityRecordId: "qr-5",  discipline: "architecture", level: "G",          zone: "Zone-Core",     elementType: "door",    description: "Single flush door 900x2100",               unit: "nos", quantity: 12,    rateItemId: "rl-2", ratePerUnit: 18500, amount: 222000, notes: null },
  { id: "boq-6",  estimateId: "est-1", quantityRecordId: "qr-6",  discipline: "architecture", level: "L1",         zone: "Zone-A",        elementType: "door",    description: "Single flush door 900x2100",               unit: "nos", quantity: 18,    rateItemId: "rl-2", ratePerUnit: 18500, amount: 333000, notes: null },
  { id: "boq-7",  estimateId: "est-1", quantityRecordId: "qr-7",  discipline: "architecture", level: "G",          zone: "Zone-A",        elementType: "window",  description: "Aluminium sliding window 1200x1200",       unit: "nos", quantity: 24,    rateItemId: "rl-3", ratePerUnit: 12000, amount: 288000, notes: null },
  { id: "boq-8",  estimateId: "est-1", quantityRecordId: "qr-8",  discipline: "architecture", level: "L1",         zone: "Zone-A",        elementType: "window",  description: "Aluminium sliding window 1200x1200",       unit: "nos", quantity: 24,    rateItemId: "rl-3", ratePerUnit: 12000, amount: 288000, notes: null },
  { id: "boq-9",  estimateId: "est-1", quantityRecordId: "qr-9",  discipline: "architecture", level: "G",          zone: "Zone-Core",     elementType: "slab",    description: "RCC slab 150mm thick",                     unit: "m²",  quantity: 420.0, rateItemId: "rl-4", ratePerUnit: 1200,  amount: 504000, notes: null },
  // ── Structure ─────────────────────────────────────────────────────────────
  { id: "boq-10", estimateId: "est-1", quantityRecordId: "qr-10", discipline: "structure",    level: "Foundation", zone: "Zone-A",        elementType: "footing", description: "Isolated footing 1500x1500x500",           unit: "m³",  quantity: 45.0,  rateItemId: "rl-5", ratePerUnit: 22000, amount: 990000, notes: null },
  { id: "boq-11", estimateId: "est-1", quantityRecordId: "qr-11", discipline: "structure",    level: "G",          zone: "Zone-A",        elementType: "column",  description: "RCC column 450x450",                       unit: "m³",  quantity: 28.8,  rateItemId: "rl-6", ratePerUnit: 28000, amount: 806400, notes: null },
  { id: "boq-12", estimateId: "est-1", quantityRecordId: "qr-12", discipline: "structure",    level: "L1",         zone: "Zone-A",        elementType: "column",  description: "RCC column 450x450",                       unit: "m³",  quantity: 26.4,  rateItemId: "rl-6", ratePerUnit: 28000, amount: 739200, notes: null },
  { id: "boq-13", estimateId: "est-1", quantityRecordId: "qr-13", discipline: "structure",    level: "G",          zone: "Zone-Core",     elementType: "beam",    description: "Primary beam 300x600",                     unit: "m³",  quantity: 35.2,  rateItemId: "rl-7", ratePerUnit: 26000, amount: 915200, notes: null },
  { id: "boq-14", estimateId: "est-1", quantityRecordId: "qr-14", discipline: "structure",    level: "L1",         zone: "Zone-Core",     elementType: "beam",    description: "Primary beam 300x600",                     unit: "m³",  quantity: 33.6,  rateItemId: "rl-7", ratePerUnit: 26000, amount: 873600, notes: null },
  { id: "boq-15", estimateId: "est-1", quantityRecordId: "qr-15", discipline: "structure",    level: "G",          zone: "Zone-A",        elementType: "slab",    description: "Structural RCC flat slab 200mm",           unit: "m²",  quantity: 520.0, rateItemId: "rl-8", ratePerUnit: 1450,  amount: 754000, notes: null },
  { id: "boq-16", estimateId: "est-1", quantityRecordId: "qr-16", discipline: "structure",    level: "Roof",       zone: "Zone-A",        elementType: "slab",    description: "Terrace slab 150mm with waterproofing",    unit: "m²",  quantity: 480.0, rateItemId: "rl-8", ratePerUnit: 1450,  amount: 696000, notes: null },

  // ── MEP — Est-02 (linked to tr-2, 6 MEP lines) ───────────────────────────
  { id: "boq-17", estimateId: "est-2", quantityRecordId: "qr-17", discipline: "mep", level: "G",  zone: "Zone-Core", elementType: "duct",       description: "Rectangular HVAC supply duct 600x400",   unit: "m",   quantity: 85.0,  rateItemId: "rl-9",  ratePerUnit: 3200,  amount: 272000, notes: null },
  { id: "boq-18", estimateId: "est-2", quantityRecordId: "qr-18", discipline: "mep", level: "L1", zone: "Zone-Core", elementType: "duct",       description: "Rectangular HVAC supply duct 600x400",   unit: "m",   quantity: 80.0,  rateItemId: "rl-9",  ratePerUnit: 3200,  amount: 256000, notes: null },
  { id: "boq-19", estimateId: "est-2", quantityRecordId: "qr-19", discipline: "mep", level: "G",  zone: "Zone-A",    elementType: "pipe",       description: "Domestic water supply pipe 50mm dia",    unit: "m",   quantity: 120.0, rateItemId: "rl-10", ratePerUnit: 1800,  amount: 216000, notes: null },
  { id: "boq-20", estimateId: "est-2", quantityRecordId: "qr-20", discipline: "mep", level: "L1", zone: "Zone-A",    elementType: "pipe",       description: "Domestic water supply pipe 50mm dia",    unit: "m",   quantity: 115.0, rateItemId: "rl-10", ratePerUnit: 1800,  amount: 207000, notes: null },
  { id: "boq-21", estimateId: "est-2", quantityRecordId: "qr-21", discipline: "mep", level: "G",  zone: "Zone-Core", elementType: "equipment",  description: "AHU — Air Handling Unit (packaged)",     unit: "nos", quantity: 2,     rateItemId: "rl-11", ratePerUnit: 85000, amount: 170000, notes: null },
  { id: "boq-22", estimateId: "est-2", quantityRecordId: "qr-22", discipline: "mep", level: "G",  zone: "Zone-A",    elementType: "cable_tray", description: "Cable tray 300mm wide (perforated)",     unit: "m",   quantity: 95.0,  rateItemId: "rl-12", ratePerUnit: 2400,  amount: 228000, notes: null },

  // ── Est-03 — Revised Arch + Structure (updated wall/column rates, qr-6 removed) ──
  // Wall rate revised: 850 → 900 | Column rate revised: 28000 → 29500 | Door L1 (qr-6) removed
  { id: "boq-23", estimateId: "est-3", quantityRecordId: "qr-1",  discipline: "architecture", level: "G",          zone: "Zone-A",        elementType: "wall",    description: "External load-bearing brick wall 230mm",   unit: "m²",  quantity: 340.5, rateItemId: "rl-1", ratePerUnit: 900,   amount: 306450, notes: null },
  { id: "boq-24", estimateId: "est-3", quantityRecordId: "qr-2",  discipline: "architecture", level: "G",          zone: "Zone-Core",     elementType: "wall",    description: "Internal partition wall 115mm",            unit: "m²",  quantity: 180.0, rateItemId: "rl-1", ratePerUnit: 900,   amount: 162000, notes: null },
  { id: "boq-25", estimateId: "est-3", quantityRecordId: "qr-3",  discipline: "architecture", level: "L1",         zone: "Zone-A",        elementType: "wall",    description: "External load-bearing brick wall 230mm",   unit: "m²",  quantity: 320.0, rateItemId: "rl-1", ratePerUnit: 900,   amount: 288000, notes: null },
  { id: "boq-26", estimateId: "est-3", quantityRecordId: "qr-4",  discipline: "architecture", level: "L2",         zone: "Zone-Periphery",elementType: "wall",    description: "External load-bearing brick wall 230mm",   unit: "m²",  quantity: 295.5, rateItemId: "rl-1", ratePerUnit: 900,   amount: 265950, notes: null },
  { id: "boq-27", estimateId: "est-3", quantityRecordId: "qr-5",  discipline: "architecture", level: "G",          zone: "Zone-Core",     elementType: "door",    description: "Single flush door 900x2100",               unit: "nos", quantity: 12,    rateItemId: "rl-2", ratePerUnit: 18500, amount: 222000, notes: null },
  // qr-6 (L1 door, ₹3,33,000) removed — door supply moved to contractor scope
  { id: "boq-28", estimateId: "est-3", quantityRecordId: "qr-7",  discipline: "architecture", level: "G",          zone: "Zone-A",        elementType: "window",  description: "Aluminium sliding window 1200x1200",       unit: "nos", quantity: 24,    rateItemId: "rl-3", ratePerUnit: 12000, amount: 288000, notes: null },
  { id: "boq-29", estimateId: "est-3", quantityRecordId: "qr-8",  discipline: "architecture", level: "L1",         zone: "Zone-A",        elementType: "window",  description: "Aluminium sliding window 1200x1200",       unit: "nos", quantity: 24,    rateItemId: "rl-3", ratePerUnit: 12000, amount: 288000, notes: null },
  { id: "boq-30", estimateId: "est-3", quantityRecordId: "qr-9",  discipline: "architecture", level: "G",          zone: "Zone-Core",     elementType: "slab",    description: "RCC slab 150mm thick",                     unit: "m²",  quantity: 420.0, rateItemId: "rl-4", ratePerUnit: 1200,  amount: 504000, notes: null },
  { id: "boq-31", estimateId: "est-3", quantityRecordId: "qr-10", discipline: "structure",    level: "Foundation", zone: "Zone-A",        elementType: "footing", description: "Isolated footing 1500x1500x500",           unit: "m³",  quantity: 45.0,  rateItemId: "rl-5", ratePerUnit: 22000, amount: 990000, notes: null },
  { id: "boq-32", estimateId: "est-3", quantityRecordId: "qr-11", discipline: "structure",    level: "G",          zone: "Zone-A",        elementType: "column",  description: "RCC column 450x450",                       unit: "m³",  quantity: 28.8,  rateItemId: "rl-6", ratePerUnit: 29500, amount: 849600, notes: null },
  { id: "boq-33", estimateId: "est-3", quantityRecordId: "qr-12", discipline: "structure",    level: "L1",         zone: "Zone-A",        elementType: "column",  description: "RCC column 450x450",                       unit: "m³",  quantity: 26.4,  rateItemId: "rl-6", ratePerUnit: 29500, amount: 778800, notes: null },
  { id: "boq-34", estimateId: "est-3", quantityRecordId: "qr-13", discipline: "structure",    level: "G",          zone: "Zone-Core",     elementType: "beam",    description: "Primary beam 300x600",                     unit: "m³",  quantity: 35.2,  rateItemId: "rl-7", ratePerUnit: 26000, amount: 915200, notes: null },
  { id: "boq-35", estimateId: "est-3", quantityRecordId: "qr-14", discipline: "structure",    level: "L1",         zone: "Zone-Core",     elementType: "beam",    description: "Primary beam 300x600",                     unit: "m³",  quantity: 33.6,  rateItemId: "rl-7", ratePerUnit: 26000, amount: 873600, notes: null },
  { id: "boq-36", estimateId: "est-3", quantityRecordId: "qr-15", discipline: "structure",    level: "G",          zone: "Zone-A",        elementType: "slab",    description: "Structural RCC flat slab 200mm",           unit: "m²",  quantity: 520.0, rateItemId: "rl-8", ratePerUnit: 1450,  amount: 754000, notes: null },
  { id: "boq-37", estimateId: "est-3", quantityRecordId: "qr-16", discipline: "structure",    level: "Roof",       zone: "Zone-A",        elementType: "slab",    description: "Terrace slab 150mm with waterproofing",    unit: "m²",  quantity: 480.0, rateItemId: "rl-8", ratePerUnit: 1450,  amount: 696000, notes: null },
];

// ── Deliverables ──────────────────────────────────────────────────────────────

export type DeliverableStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type DeliverableType   = "IFC" | "RVT" | "DWG" | "PDF" | "NWC" | "COORDINATION_MODEL";

export interface MockDeliverable {
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

export const mockDeliverables: MockDeliverable[] = [
  {
    id: "del-1", projectId: "p-1", conversionJobId: "cr-1",
    title: "Tower-A Architectural BIM Model — V1.0",
    deliverableType: "IFC", version: "V1.0", status: "SUBMITTED",
    submittedBy: "BIM Manager", submittedAt: "2026-03-25T10:00:00.000Z",
    reviewedBy: null, reviewedAt: null, reviewComments: null,
    description: "IFC export of architectural model including all walls, doors, windows, and slabs from Tower-A conversion.",
    createdAt: "2026-03-25T09:30:00.000Z", updatedAt: "2026-03-25T10:00:00.000Z",
  },
  {
    id: "del-2", projectId: "p-1", conversionJobId: "cr-2",
    title: "Tower-A Structural BIM Model — V1.0",
    deliverableType: "IFC", version: "V1.0", status: "APPROVED",
    submittedBy: "BIM Engineer Team", submittedAt: "2026-03-26T09:00:00.000Z",
    reviewedBy: "BIM Manager", reviewedAt: "2026-03-27T11:00:00.000Z",
    reviewComments: "Structural model verified. All columns, beams, and footings correctly placed per SD.",
    description: "IFC export of structural model from Tower-A conversion. Columns, beams, slabs, footings included.",
    createdAt: "2026-03-26T08:30:00.000Z", updatedAt: "2026-03-27T11:00:00.000Z",
  },
  {
    id: "del-3", projectId: "p-1", conversionJobId: "cr-1",
    title: "Tower-A Coordination Model — V1.0",
    deliverableType: "NWC", version: "V1.0", status: "DRAFT",
    submittedBy: "BIM Manager", submittedAt: null,
    reviewedBy: null, reviewedAt: null, reviewComments: null,
    description: "Navisworks coordination model for Arch + Structure clash detection. MEP to be added in V2.0.",
    createdAt: "2026-03-28T10:00:00.000Z", updatedAt: "2026-03-28T10:00:00.000Z",
  },
  {
    id: "del-4", projectId: "p-1", conversionJobId: null,
    title: "Tower-A Quantity Takeoff Report — Rev-01",
    deliverableType: "PDF", version: "Rev-01", status: "APPROVED",
    submittedBy: "BIM Manager", submittedAt: "2026-03-26T14:00:00.000Z",
    reviewedBy: "BIM Manager", reviewedAt: "2026-03-27T09:00:00.000Z",
    reviewComments: "Takeoff report approved for cost estimation.",
    description: "PDF report of quantity takeoff Rev-01 covering architectural and structural elements.",
    createdAt: "2026-03-26T13:30:00.000Z", updatedAt: "2026-03-27T09:00:00.000Z",
  },
  {
    id: "del-5", projectId: "p-1", conversionJobId: "cr-1",
    title: "Tower-A Architectural BIM Model — V1.1",
    deliverableType: "IFC", version: "V1.1", status: "REJECTED",
    submittedBy: "BIM Manager", submittedAt: "2026-03-29T10:00:00.000Z",
    reviewedBy: "BIM Manager", reviewedAt: "2026-03-30T14:00:00.000Z",
    reviewComments: "Retaining wall height incorrect (3000mm vs 4200mm per section S-04). Resubmit after correction.",
    description: "Updated IFC model with retaining wall correction. Parapet heights also revised.",
    createdAt: "2026-03-29T09:30:00.000Z", updatedAt: "2026-03-30T14:00:00.000Z",
  },
];

// ── Clash reports & issues ─────────────────────────────────────────────────────

export type ClashSeverity    = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ClashIssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "WAIVED";

export interface MockClashReport {
  id: string;
  projectId: string;
  title: string;
  disciplineA: string;
  disciplineB: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockClashIssue {
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

export const mockClashReports: MockClashReport[] = [
  {
    id: "crpt-1", projectId: "p-1",
    title: "Arch vs Structure — Coordination Cycle 1",
    disciplineA: "Architecture", disciplineB: "Structure",
    createdAt: "2026-03-28T10:00:00.000Z", updatedAt: "2026-03-30T15:00:00.000Z",
  },
  {
    id: "crpt-2", projectId: "p-1",
    title: "Structure vs MEP — Coordination Cycle 1",
    disciplineA: "Structure", disciplineB: "MEP",
    createdAt: "2026-03-30T10:00:00.000Z", updatedAt: "2026-04-01T09:00:00.000Z",
  },
];

export const mockClashIssues: MockClashIssue[] = [
  // ── Arch vs Structure (crpt-1) ───────────────────────────────────────────────
  {
    id: "ci-1", reportId: "crpt-1", projectId: "p-1",
    title: "Retaining wall intersects with structural footing F-003",
    description: "Architectural retaining wall RW-001 at Zone-A boundary clashes with isolated footing F-003. Wall base extends 200mm into footing zone.",
    disciplineA: "Architecture", disciplineB: "Structure",
    severity: "HIGH", status: "IN_PROGRESS",
    assignedTo: "BIM Engineer Team", targetDate: "2026-04-05T00:00:00.000Z",
    resolvedAt: null, resolutionNote: null,
    createdAt: "2026-03-28T10:30:00.000Z", updatedAt: "2026-03-30T11:00:00.000Z",
  },
  {
    id: "ci-2", reportId: "crpt-1", projectId: "p-1",
    title: "Internal partition wall runs through primary beam B-001",
    description: "Partition wall IW-001 (G-Level, Zone-Core) intersects with primary beam B-001 at 900mm from column C-004. Beam soffit at 2800mm, wall height 3200mm.",
    disciplineA: "Architecture", disciplineB: "Structure",
    severity: "CRITICAL", status: "OPEN",
    assignedTo: "BIM Manager", targetDate: "2026-04-03T00:00:00.000Z",
    resolvedAt: null, resolutionNote: null,
    createdAt: "2026-03-28T10:45:00.000Z", updatedAt: "2026-03-28T10:45:00.000Z",
  },
  {
    id: "ci-3", reportId: "crpt-1", projectId: "p-1",
    title: "Window sill elevation conflicts with structural slab edge",
    description: "WN-001 sill at 900mm conflicts with slab edge upstand at 950mm at Zone-A perimeter. Minor conflict — coordinate with slab edge detail.",
    disciplineA: "Architecture", disciplineB: "Structure",
    severity: "LOW", status: "RESOLVED",
    assignedTo: "BIM Engineer Team", targetDate: "2026-03-30T00:00:00.000Z",
    resolvedAt: "2026-03-29T16:00:00.000Z",
    resolutionNote: "Slab edge upstand revised to 850mm in structural model. Coordinated with architect.",
    createdAt: "2026-03-28T11:00:00.000Z", updatedAt: "2026-03-29T16:00:00.000Z",
  },
  {
    id: "ci-4", reportId: "crpt-1", projectId: "p-1",
    title: "Parapet wall base intersects with roof slab reinforcement zone",
    description: "Parapet wall PW-001 base plate conflicts with roof slab top bar reinforcement at 50mm cover zone. Coordination required for fixing detail.",
    disciplineA: "Architecture", disciplineB: "Structure",
    severity: "MEDIUM", status: "OPEN",
    assignedTo: null, targetDate: "2026-04-07T00:00:00.000Z",
    resolvedAt: null, resolutionNote: null,
    createdAt: "2026-03-28T11:15:00.000Z", updatedAt: "2026-03-28T11:15:00.000Z",
  },
  // ── Structure vs MEP (crpt-2) ────────────────────────────────────────────────
  {
    id: "ci-5", reportId: "crpt-2", projectId: "p-1",
    title: "HVAC supply duct passes through secondary beam B-002",
    description: "Supply air duct DA-001 (600×300mm) penetrates secondary beam B-002 at G-Level. Beam web penetration not detailed — RFI required from structural engineer.",
    disciplineA: "Structure", disciplineB: "MEP",
    severity: "HIGH", status: "OPEN",
    assignedTo: "BIM Manager", targetDate: "2026-04-05T00:00:00.000Z",
    resolvedAt: null, resolutionNote: null,
    createdAt: "2026-03-30T10:30:00.000Z", updatedAt: "2026-03-30T10:30:00.000Z",
  },
  {
    id: "ci-6", reportId: "crpt-2", projectId: "p-1",
    title: "Drainage pipe P-001 route conflicts with footing F-007",
    description: "uPVC drainage pipe P-001 (150mm dia) under G-Level slab intersects isolated footing F-007 at Zone-A entry. Pipe needs rerouting or sleeve detail.",
    disciplineA: "Structure", disciplineB: "MEP",
    severity: "CRITICAL", status: "IN_PROGRESS",
    assignedTo: "BIM Engineer Team", targetDate: "2026-04-04T00:00:00.000Z",
    resolvedAt: null, resolutionNote: null,
    createdAt: "2026-03-30T10:45:00.000Z", updatedAt: "2026-04-01T09:00:00.000Z",
  },
  {
    id: "ci-7", reportId: "crpt-2", projectId: "p-1",
    title: "Cable tray route conflicts with column C-012 at L1",
    description: "Perforated cable tray (300mm wide) at L1 corridor conflicts with column C-012 (300×300mm). Tray requires offset of 450mm minimum to clear column face.",
    disciplineA: "Structure", disciplineB: "MEP",
    severity: "MEDIUM", status: "RESOLVED",
    assignedTo: "BIM Engineer Team", targetDate: "2026-03-31T00:00:00.000Z",
    resolvedAt: "2026-03-31T14:00:00.000Z",
    resolutionNote: "Cable tray rerouted 500mm east of column face. Updated in coordination model.",
    createdAt: "2026-03-30T11:00:00.000Z", updatedAt: "2026-03-31T14:00:00.000Z",
  },
  {
    id: "ci-8", reportId: "crpt-2", projectId: "p-1",
    title: "AHU unit support conflicts with beam B-014 web",
    description: "AHU hanging support hanger rod intersects beam B-014 web at 200mm from column. Coordination required for hanger bracket detail.",
    disciplineA: "Structure", disciplineB: "MEP",
    severity: "LOW", status: "WAIVED",
    assignedTo: "BIM Manager", targetDate: "2026-04-02T00:00:00.000Z",
    resolvedAt: "2026-04-01T08:00:00.000Z",
    resolutionNote: "Structural engineer confirmed beam web has capacity for hanger rod penetration with sleeve. No model change required.",
    createdAt: "2026-03-30T11:15:00.000Z", updatedAt: "2026-04-01T08:00:00.000Z",
  },
];

// ── Estimate audit events ─────────────────────────────────────────────────────

export const mockEstimateAuditEvents: EstimateAuditEvent[] = [
  // ── Est-01 ────────────────────────────────────────────────────────────────
  { id: "ea-1", estimateId: "est-1", action: "created",           actor: "BIM Manager", note: "Initial estimate generated from Rev-01 takeoff (Arch + Structure).",                          before: null,                                   after: { status: "draft" },                   timestamp: "2026-03-25T09:00:00.000Z" },
  { id: "ea-2", estimateId: "est-1", action: "notes_updated",     actor: "BIM Manager", note: "Added scope clarification.",                                                                   before: { notes: null },                        after: { notes: "Initial estimate covering architectural and structural works." }, timestamp: "2026-03-25T11:30:00.000Z" },
  // ── Est-02 ────────────────────────────────────────────────────────────────
  { id: "ea-3", estimateId: "est-2", action: "created",           actor: "BIM Engineer", note: "MEP estimate generated from Rev-02 takeoff.",                                                 before: null,                                   after: { status: "draft" },                   timestamp: "2026-03-29T09:00:00.000Z" },
  // ── Est-03 ────────────────────────────────────────────────────────────────
  { id: "ea-4", estimateId: "est-3", action: "created",           actor: "BIM Manager", note: "Revised estimate from Rev-01 takeoff with updated SOR rates for March 2026.",                 before: null,                                   after: { status: "draft" },                   timestamp: "2026-03-28T09:00:00.000Z" },
  { id: "ea-5", estimateId: "est-3", action: "line_rate_updated", actor: "BIM Manager", note: "Wall rate revised per SOR-2026-Q1 update.",                                                   before: { elementType: "wall", ratePerUnit: 850 },  after: { elementType: "wall", ratePerUnit: 900 },  timestamp: "2026-03-28T10:00:00.000Z" },
  { id: "ea-6", estimateId: "est-3", action: "line_rate_updated", actor: "BIM Manager", note: "Column rate revised per SOR-2026-Q1 update.",                                                 before: { elementType: "column", ratePerUnit: 28000 }, after: { elementType: "column", ratePerUnit: 29500 }, timestamp: "2026-03-28T10:05:00.000Z" },
  { id: "ea-7", estimateId: "est-3", action: "line_removed",      actor: "BIM Manager", note: "L1 door supply moved to contractor scope — removed from estimate.",                           before: { quantityRecordId: "qr-6", description: "Single flush door 900x2100 (L1)", amount: 333000 }, after: null, timestamp: "2026-03-28T10:10:00.000Z" },
  { id: "ea-8", estimateId: "est-3", action: "status_changed",    actor: "BIM Manager", note: "Submitted for review — revised SOR rates applied, scope adjusted.",                          before: { status: "draft" },                    after: { status: "submitted" },               timestamp: "2026-03-29T14:00:00.000Z" },
];
