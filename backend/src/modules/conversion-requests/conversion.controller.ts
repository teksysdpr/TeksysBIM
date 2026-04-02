import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../common/middleware/auth.js";
import { requireRoles } from "../../common/middleware/rbac.js";
import { parsePaging } from "../../common/utils/pagination.js";
import { mockAuditEvents, mockBimElements, mockCandidateObjects, mockConversionRequests } from "../../data/mock.js";
import type { AuditAction, BimElement, BimElementType, CandidateStatus, ConversionStage } from "../../types.js";

// ── objectType → BimElementType mapping ──────────────────────────────────────
// Maps the free-text objectType from candidates to the canonical BimElementType.

const OBJECT_TYPE_MAP: Record<string, BimElementType> = {
  "Wall":          "wall",
  "Door":          "door",
  "Window":        "window",
  "Slab":          "slab",
  "Opening":       "opening",
  "Column":        "column",
  "Beam":          "beam",
  "Footing":       "footing",
  "Duct Run":      "duct",
  "Pipe Run":      "pipe",
  "Cable Tray":    "cable_tray",
  "Equipment":     "equipment",
  "Level":         "level",
  "Zone":          "zone",
};

function resolveBimElementType(objectType: string): BimElementType {
  const mapped = OBJECT_TYPE_MAP[objectType];
  if (mapped) return mapped;
  // Partial match fallback
  const lower = objectType.toLowerCase();
  if (lower.includes("wall"))     return "wall";
  if (lower.includes("door"))     return "door";
  if (lower.includes("window"))   return "window";
  if (lower.includes("slab"))     return "slab";
  if (lower.includes("column"))   return "column";
  if (lower.includes("beam"))     return "beam";
  if (lower.includes("footing"))  return "footing";
  if (lower.includes("duct"))     return "duct";
  if (lower.includes("pipe"))     return "pipe";
  if (lower.includes("tray"))     return "cable_tray";
  return "equipment"; // safe fallback
}

// ── Stage ordering ─────────────────────────────────────────────────────────────

const STAGE_FLOW: ConversionStage[] = [
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

// ── Validation schemas ─────────────────────────────────────────────────────────

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  fileIds: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  assignee: z.string().optional(),
  reviewRequired: z.boolean().optional(),
});

const moveSchema = z.object({
  stage: z.enum(STAGE_FLOW as [ConversionStage, ...ConversionStage[]]),
});

const attachFilesSchema = z.object({
  fileIds: z.array(z.string().min(1)).min(1),
});

// ── Router ────────────────────────────────────────────────────────────────────

export const conversionRouter = Router();

// LIST  GET /conversion-requests
conversionRouter.get("/", requireAuth, (req, res) => {
  const { page, pageSize, skip, take } = parsePaging(req);
  const projectId = String(req.query.projectId || "");
  const stage = String(req.query.stage || "").toUpperCase();

  let rows = mockConversionRequests.slice();
  if (projectId) rows = rows.filter((r) => r.projectId === projectId);
  if (stage)     rows = rows.filter((r) => r.stage === stage);

  // Sort newest first
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = rows.length;
  res.json({
    data: rows.slice(skip, skip + take),
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
});

// GET SINGLE  GET /conversion-requests/:id
conversionRouter.get("/:id", requireAuth, (req, res) => {
  const row = mockConversionRequests.find((r) => r.id === req.params.id);
  if (!row) {
    res.status(404).json({ message: "Conversion request not found" });
    return;
  }
  res.json({ data: row });
});

// CREATE  POST /conversion-requests
conversionRouter.post(
  "/",
  requireAuth,
  requireRoles("CLIENT", "ADMIN", "BIM_MANAGER", "BIM_ENGINEER"),
  (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
      return;
    }

    const now = new Date().toISOString();
    const request = {
      id: `cr-${Date.now()}`,
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      stage: "UPLOADED" as ConversionStage,
      dueDate: parsed.data.dueDate ?? new Date(Date.now() + 7 * 86_400_000).toISOString(),
      assignee: "Unassigned",
      fileIds: parsed.data.fileIds ?? [],
      reviewRequired: true,
      createdAt: now,
      updatedAt: now,
    };
    mockConversionRequests.push(request);
    res.status(201).json({ data: request });
  }
);

// UPDATE  PATCH /conversion-requests/:id
conversionRouter.patch("/:id", requireAuth, (req, res) => {
  const row = mockConversionRequests.find((r) => r.id === req.params.id);
  if (!row) {
    res.status(404).json({ message: "Conversion request not found" });
    return;
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  if (parsed.data.title       !== undefined) row.title         = parsed.data.title;
  if (parsed.data.description !== undefined) row.description   = parsed.data.description ?? null;
  if (parsed.data.dueDate     !== undefined) row.dueDate       = parsed.data.dueDate;
  if (parsed.data.assignee    !== undefined) row.assignee      = parsed.data.assignee;
  if (parsed.data.reviewRequired !== undefined) row.reviewRequired = parsed.data.reviewRequired;
  row.updatedAt = new Date().toISOString();

  res.json({ data: row });
});

// DELETE / CANCEL  DELETE /conversion-requests/:id
conversionRouter.delete(
  "/:id",
  requireAuth,
  requireRoles("ADMIN", "BIM_MANAGER"),
  (req, res) => {
    const idx = mockConversionRequests.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ message: "Conversion request not found" });
      return;
    }
    mockConversionRequests.splice(idx, 1);
    res.json({ message: "Deleted" });
  }
);

// MOVE STAGE  PATCH /conversion-requests/:id/stage
conversionRouter.patch(
  "/:id/stage",
  requireAuth,
  requireRoles("ADMIN", "BIM_MANAGER", "BIM_ENGINEER", "REVIEWER"),
  (req, res) => {
    const parsed = moveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid stage payload", errors: parsed.error.flatten() });
      return;
    }

    const row = mockConversionRequests.find((r) => r.id === req.params.id);
    if (!row) {
      res.status(404).json({ message: "Conversion request not found" });
      return;
    }

    row.stage = parsed.data.stage;
    row.updatedAt = new Date().toISOString();
    res.json({ data: row });
  }
);

// ATTACH FILES  POST /conversion-requests/:id/files
conversionRouter.post("/:id/files", requireAuth, (req, res) => {
  const row = mockConversionRequests.find((r) => r.id === req.params.id);
  if (!row) {
    res.status(404).json({ message: "Conversion request not found" });
    return;
  }
  const parsed = attachFilesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid file IDs", errors: parsed.error.flatten() });
    return;
  }

  row.fileIds = Array.from(new Set([...row.fileIds, ...parsed.data.fileIds]));
  row.updatedAt = new Date().toISOString();
  res.json({ data: row });
});

// GET JOB FILES  GET /conversion-requests/:id/files
conversionRouter.get("/:id/files", requireAuth, (req, res) => {
  const row = mockConversionRequests.find((r) => r.id === req.params.id);
  if (!row) {
    res.status(404).json({ message: "Conversion request not found" });
    return;
  }
  // Return just the file IDs and minimal info (real impl would join FileAsset)
  res.json({ data: { jobId: row.id, fileIds: row.fileIds, total: row.fileIds.length } });
});

// ── Review / Candidate endpoints ──────────────────────────────────────────────

const updateCandidateSchema = z.object({
  status: z.enum(["pending_review", "approved", "rejected", "corrected"] as [CandidateStatus, ...CandidateStatus[]]).optional(),
  reviewComment: z.string().optional(),
  correctionNote: z.string().optional(),
  reviewedBy: z.string().min(1).optional(),
});

// LIST CANDIDATES  GET /conversion-requests/:id/candidates
conversionRouter.get("/:id/candidates", requireAuth, (req, res) => {
  const job = mockConversionRequests.find((r) => r.id === req.params.id);
  if (!job) {
    res.status(404).json({ message: "Conversion request not found" });
    return;
  }

  let rows = mockCandidateObjects.filter((c) => c.jobId === req.params.id);

  const { discipline, status } = req.query;
  if (discipline && typeof discipline === "string") {
    rows = rows.filter((c) => c.discipline === discipline.toLowerCase());
  }
  if (status && typeof status === "string") {
    rows = rows.filter((c) => c.status === status.toLowerCase());
  }

  res.json({ data: rows, total: rows.length });
});

// UPDATE CANDIDATE  PATCH /conversion-requests/:id/candidates/:candidateId
conversionRouter.patch("/:id/candidates/:candidateId", requireAuth, (req, res) => {
  const job = mockConversionRequests.find((r) => r.id === req.params.id);
  if (!job) {
    res.status(404).json({ message: "Conversion request not found" });
    return;
  }
  const candidate = mockCandidateObjects.find(
    (c) => c.id === req.params.candidateId && c.jobId === req.params.id
  );
  if (!candidate) {
    res.status(404).json({ message: "Candidate not found" });
    return;
  }

  const parsed = updateCandidateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const now          = new Date().toISOString();
  const prevStatus   = candidate.status;

  if (parsed.data.status !== undefined) {
    candidate.status = parsed.data.status;
    candidate.reviewedAt = parsed.data.status === "pending_review" ? null : (candidate.reviewedAt ?? now);
  }
  if (parsed.data.reviewComment !== undefined) candidate.reviewComment = parsed.data.reviewComment;
  if (parsed.data.correctionNote !== undefined) candidate.correctionNote = parsed.data.correctionNote;
  if (parsed.data.reviewedBy     !== undefined) candidate.reviewedBy    = parsed.data.reviewedBy;
  candidate.updatedAt = now;

  // ── Audit trail ──────────────────────────────────────────────────────────────
  if (parsed.data.status !== undefined && parsed.data.status !== prevStatus) {
    const actionMap: Record<string, AuditAction> = {
      approved:       "CANDIDATE_APPROVED",
      rejected:       "CANDIDATE_REJECTED",
      corrected:      "CANDIDATE_CORRECTED",
      pending_review: "CANDIDATE_RESET",
    };
    const note =
      parsed.data.reviewComment ?? parsed.data.correctionNote ?? null;
    mockAuditEvents.push({
      id:              `ae-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversionJobId: req.params.id,
      entityId:        candidate.id,
      entityType:      "candidate",
      action:          actionMap[parsed.data.status] ?? "CANDIDATE_APPROVED",
      actor:           parsed.data.reviewedBy ?? "BIM Reviewer",
      before:          { status: prevStatus },
      after:           { status: parsed.data.status },
      note,
      timestamp:       now,
    });
  }

  res.json({ data: candidate });
});

// REVIEW SUMMARY  GET /conversion-requests/:id/review-summary
conversionRouter.get("/:id/review-summary", requireAuth, (req, res) => {
  const job = mockConversionRequests.find((r) => r.id === req.params.id);
  if (!job) {
    res.status(404).json({ message: "Conversion request not found" });
    return;
  }

  const candidates = mockCandidateObjects.filter((c) => c.jobId === req.params.id);
  const total     = candidates.length;
  const pending   = candidates.filter((c) => c.status === "pending_review").length;
  const approved  = candidates.filter((c) => c.status === "approved").length;
  const rejected  = candidates.filter((c) => c.status === "rejected").length;
  const corrected = candidates.filter((c) => c.status === "corrected").length;

  const disciplines = ["architecture", "structure", "mep"] as const;
  const byDiscipline: Record<string, object> = {};
  for (const d of disciplines) {
    const g = candidates.filter((c) => c.discipline === d);
    byDiscipline[d] = {
      total:    g.length,
      pending:  g.filter((c) => c.status === "pending_review").length,
      approved: g.filter((c) => c.status === "approved").length,
      rejected: g.filter((c) => c.status === "rejected").length,
      corrected:g.filter((c) => c.status === "corrected").length,
    };
  }

  res.json({
    data: {
      jobId: req.params.id,
      total,
      pending,
      approved,
      rejected,
      corrected,
      byDiscipline,
      completionPercent: total > 0 ? Math.round(((total - pending) / total) * 100) : 0,
      allResolved: pending === 0 && total > 0,
    },
  });
});

// ── Commit to BIM model  POST /conversion-requests/:id/commit ─────────────────
//
// Takes all approved/corrected candidates for a job and writes them to the BIM
// model layer (mockBimElements). Creates one audit event per element + one
// master MODEL_COMMIT event, then advances the job to DELIVERED.
//
// Rejected candidates are not committed. Pending candidates block the commit.

const commitSchema = z.object({
  committedBy: z.string().min(1).default("BIM Manager"),
});

conversionRouter.post(
  "/:id/commit",
  requireAuth,
  requireRoles("ADMIN", "BIM_MANAGER", "BIM_ENGINEER"),
  (req, res) => {
    const job = mockConversionRequests.find((r) => r.id === req.params.id);
    if (!job) {
      res.status(404).json({ message: "Conversion request not found" });
      return;
    }

    const candidates = mockCandidateObjects.filter((c) => c.jobId === req.params.id);

    // Block commit if any candidate is still pending
    const pendingCount = candidates.filter((c) => c.status === "pending_review").length;
    if (pendingCount > 0) {
      res.status(409).json({
        message: `${pendingCount} candidate${pendingCount > 1 ? "s" : ""} still pending review — resolve all before committing.`,
      });
      return;
    }

    const committable = candidates.filter(
      (c) => c.status === "approved" || c.status === "corrected"
    );
    if (committable.length === 0) {
      res.status(400).json({ message: "No approved or corrected candidates to commit." });
      return;
    }

    const parsed = commitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
      return;
    }

    const now         = new Date().toISOString();
    const committed: BimElement[] = [];

    for (const candidate of committable) {
      // Check for duplicate — don't re-commit the same candidate
      const alreadyCommitted = mockBimElements.some(
        (e) => e.candidateId === candidate.id && e.status === "active"
      );
      if (alreadyCommitted) continue;

      const element: BimElement = {
        id:               `bim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId:        job.projectId,
        conversionJobId:  job.id,
        candidateId:      candidate.id,
        elementType:      resolveBimElementType(candidate.objectType),
        discipline:       candidate.discipline,
        label:            candidate.label,
        sourceLayerRef:   candidate.sourceLayerRef,
        sourceFileId:     candidate.sourceFileId,
        properties:       { ...(candidate.properties ?? {}) },
        status:           "active",
        committedBy:      parsed.data.committedBy,
        committedAt:      now,
        createdAt:        now,
        updatedAt:        now,
      };
      mockBimElements.push(element);
      committed.push(element);
    }

    // Capture stage before mutation for accurate audit trail
    const prevJobStage = job.stage;

    // Advance job to DELIVERED
    job.stage     = "DELIVERED";
    job.updatedAt = now;

    // Master audit event for the commit
    mockAuditEvents.push({
      id:              `ae-${Date.now()}`,
      conversionJobId: job.id,
      entityId:        job.id,
      entityType:      "conversion_job",
      action:          "MODEL_COMMIT",
      actor:           parsed.data.committedBy,
      before:          { stage: prevJobStage },
      after:           { stage: "DELIVERED", elementsCommitted: committed.length },
      note:            `${committed.length} BIM element${committed.length !== 1 ? "s" : ""} committed to model layer.`,
      timestamp:       now,
    });

    res.status(201).json({
      data: {
        jobId:          job.id,
        committed:      committed.length,
        skipped:        committable.length - committed.length,
        rejected:       candidates.filter((c) => c.status === "rejected").length,
        elements:       committed,
        jobStage:       "DELIVERED",
      },
    });
  }
);

// AUDIT TRAIL  GET /conversion-requests/:id/audit
conversionRouter.get("/:id/audit", requireAuth, (req, res) => {
  const job = mockConversionRequests.find((r) => r.id === req.params.id);
  if (!job) {
    res.status(404).json({ message: "Conversion request not found" });
    return;
  }

  const events = mockAuditEvents
    .filter((e) => e.conversionJobId === req.params.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({ data: events, total: events.length });
});
