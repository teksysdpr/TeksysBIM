/**
 * Conversion Pipeline Controller
 *
 * Manages the staged processing pipeline that transforms uploaded source files
 * (DWG / DXF / PDF / scanned drawings) into candidate BIM objects.
 *
 * Pipeline stages (in order):
 *   INTAKE → NORMALIZE → PARSE → CLASSIFY → GENERATE → REVIEW → COMMIT
 *
 * Heavy recognition logic (geometry parsing, layer classification, object
 * inference) is mocked here. The service/data contract is fully defined so a
 * real worker implementation can replace the mock without API changes.
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../common/middleware/auth.js";
import { mockAuditEvents, mockConversionRequests, mockPipelineJobs } from "../../data/mock.js";
import type { FileFormat, PipelineJob, PipelineStage, StageResult } from "../../types.js";

// ── Stage ordering (intake → commit) ─────────────────────────────────────────

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  "INTAKE", "NORMALIZE", "PARSE", "CLASSIFY", "GENERATE", "REVIEW", "COMMIT",
];

// Human-readable label + description for each stage
export const PIPELINE_STAGE_META: Record<PipelineStage, { label: string; description: string }> = {
  INTAKE:    { label: "Intake",      description: "File received, checksum verified, format detected" },
  NORMALIZE: { label: "Normalize",   description: "Convert to internal geometry representation" },
  PARSE:     { label: "Parse",       description: "Extract layers, blocks, annotations, and references" },
  CLASSIFY:  { label: "Classify",    description: "Match layer names to discipline categories (AIA/NCS)" },
  GENERATE:  { label: "Generate",    description: "Infer and generate candidate BIM objects from geometry" },
  REVIEW:    { label: "Review",      description: "Manual review of generated candidates (approve / reject / correct)" },
  COMMIT:    { label: "Commit",      description: "Write approved candidates to BIM model layer" },
};

// Format → supported stages (scanned PDFs skip PARSE-level vector extraction)
export const FORMAT_PIPELINE_MAP: Record<FileFormat, PipelineStage[]> = {
  DWG:         PIPELINE_STAGE_ORDER,
  DXF:         PIPELINE_STAGE_ORDER,
  PDF:         PIPELINE_STAGE_ORDER,
  IFC:         ["INTAKE", "NORMALIZE", "CLASSIFY", "REVIEW", "COMMIT"],
  RVT:         ["INTAKE", "NORMALIZE", "CLASSIFY", "REVIEW", "COMMIT"],
  NWC:         ["INTAKE", "NORMALIZE", "CLASSIFY", "REVIEW", "COMMIT"],
  SCANNED_PDF: ["INTAKE", "NORMALIZE", "PARSE", "CLASSIFY", "GENERATE", "REVIEW", "COMMIT"],
};

// ── Validation schemas ────────────────────────────────────────────────────────

const createPipelineJobSchema = z.object({
  conversionJobId: z.string().min(1),
  fileId:          z.string().min(1),
  fileFormat:      z.enum(["DWG", "DXF", "PDF", "IFC", "RVT", "NWC", "SCANNED_PDF"] as [FileFormat, ...FileFormat[]]),
});

// ── Router ────────────────────────────────────────────────────────────────────

export const pipelineRouter = Router();

// LIST  GET /pipeline-jobs?conversionJobId=
pipelineRouter.get("/", requireAuth, (req, res) => {
  const { conversionJobId } = req.query;
  const rows = conversionJobId
    ? mockPipelineJobs.filter((p) => p.conversionJobId === String(conversionJobId))
    : mockPipelineJobs.slice();
  res.json({ data: rows, total: rows.length });
});

// STAGE META  GET /pipeline-jobs/meta/stages
// NOTE: Must be declared BEFORE /:id to avoid "meta" being matched as a job id.
// Returns stage labels, descriptions, and order — used for UI rendering.
pipelineRouter.get("/meta/stages", (_req, res) => {
  res.json({
    data: {
      order: PIPELINE_STAGE_ORDER,
      meta:  PIPELINE_STAGE_META,
    },
  });
});

// GET SINGLE  GET /pipeline-jobs/:id
pipelineRouter.get("/:id", requireAuth, (req, res) => {
  const job = mockPipelineJobs.find((p) => p.id === req.params.id);
  if (!job) {
    res.status(404).json({ message: "Pipeline job not found" });
    return;
  }
  res.json({ data: job });
});

// CREATE  POST /pipeline-jobs
// Queues a new pipeline job for a conversion request file.
pipelineRouter.post("/", requireAuth, (req, res) => {
  const parsed = createPipelineJobSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  // Verify the conversion job exists
  const convJob = mockConversionRequests.find((r) => r.id === parsed.data.conversionJobId);
  if (!convJob) {
    res.status(404).json({ message: "Conversion request not found" });
    return;
  }

  const now = new Date().toISOString();
  const pipelineJob: PipelineJob = {
    id:               `pj-${Date.now()}`,
    conversionJobId:  parsed.data.conversionJobId,
    fileId:           parsed.data.fileId,
    fileFormat:       parsed.data.fileFormat,
    currentStage:     "INTAKE",
    workerStatus:     "QUEUED",
    stageResults:     {},
    errorMessage:     null,
    createdAt:        now,
    updatedAt:        now,
  };
  mockPipelineJobs.push(pipelineJob);

  // Audit event
  mockAuditEvents.push({
    id:               `ae-${Date.now()}`,
    conversionJobId:  parsed.data.conversionJobId,
    entityId:         pipelineJob.id,
    entityType:       "pipeline_job",
    action:           "PIPELINE_JOB_CREATED",
    actor:            "system",
    before:           null,
    after:            { stage: "INTAKE", workerStatus: "QUEUED" },
    note:             `Pipeline job created for file ${parsed.data.fileId} (${parsed.data.fileFormat}).`,
    timestamp:        now,
  });

  res.status(201).json({ data: pipelineJob });
});

// ADVANCE STAGE  POST /pipeline-jobs/:id/advance
// Simulates advancing the pipeline job to the next stage.
// In production this would be triggered by the worker process completing a stage.
pipelineRouter.post("/:id/advance", requireAuth, (req, res) => {
  const pipelineJob = mockPipelineJobs.find((p) => p.id === req.params.id);
  if (!pipelineJob) {
    res.status(404).json({ message: "Pipeline job not found" });
    return;
  }

  if (pipelineJob.workerStatus === "DONE") {
    res.status(400).json({ message: "Pipeline job is already complete" });
    return;
  }
  if (pipelineJob.workerStatus === "FAILED") {
    res.status(400).json({ message: "Pipeline job has failed — create a new job to retry" });
    return;
  }

  const currentIdx = PIPELINE_STAGE_ORDER.indexOf(pipelineJob.currentStage);
  const isLastStage = currentIdx === PIPELINE_STAGE_ORDER.length - 1;
  const prevStage = pipelineJob.currentStage; // capture before mutation

  const now = new Date().toISOString();
  const durationMs = 1000 + Math.floor(Math.random() * 4000);

  // Mark current stage as done
  const completedResult: StageResult = {
    stage:       prevStage,
    status:      "DONE",
    message:     `${PIPELINE_STAGE_META[prevStage].label} stage completed (simulated).`,
    durationMs,
    outputCount: Math.floor(Math.random() * 20) + 1,
    completedAt: now,
  };
  pipelineJob.stageResults[prevStage] = completedResult;

  if (isLastStage) {
    pipelineJob.workerStatus = "DONE";
  } else {
    const nextStage = PIPELINE_STAGE_ORDER[currentIdx + 1];
    pipelineJob.currentStage = nextStage;
    pipelineJob.workerStatus = "RUNNING";
  }
  pipelineJob.updatedAt = now;

  // Audit event — use prevStage so before/after correctly reflect the transition
  mockAuditEvents.push({
    id:              `ae-${Date.now()}`,
    conversionJobId: pipelineJob.conversionJobId,
    entityId:        pipelineJob.id,
    entityType:      "pipeline_job",
    action:          "PIPELINE_STAGE_ADVANCED",
    actor:           "system",
    before:          { stage: prevStage },
    after:           isLastStage
                       ? { stage: prevStage, workerStatus: "DONE" }
                       : { stage: PIPELINE_STAGE_ORDER[currentIdx + 1] },
    note:            null,
    timestamp:       now,
  });

  res.json({ data: pipelineJob });
});

