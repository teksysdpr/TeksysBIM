import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../common/middleware/auth.js";
import { requireRoles } from "../../common/middleware/rbac.js";
import { parsePaging } from "../../common/utils/pagination.js";
import { mockConversionRequests } from "../../data/mock.js";
import type { ConversionStage } from "../../types.js";

const stageFlow: ConversionStage[] = [
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

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(3),
  dueDate: z.string().datetime().optional(),
});

const moveSchema = z.object({
  stage: z.enum(stageFlow as [ConversionStage, ...ConversionStage[]]),
});

export const conversionRouter = Router();

conversionRouter.get("/", requireAuth, (req, res) => {
  const { page, pageSize, skip, take } = parsePaging(req);
  const projectId = String(req.query.projectId || "");
  const stage = String(req.query.stage || "").toUpperCase();
  let rows = mockConversionRequests.slice();
  if (projectId) rows = rows.filter((request) => request.projectId === projectId);
  if (stage) rows = rows.filter((request) => request.stage === stage);
  const total = rows.length;

  res.json({
    data: rows.slice(skip, skip + take),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
});

conversionRouter.post("/", requireAuth, requireRoles("CLIENT", "ADMIN", "BIM_MANAGER"), (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid conversion request payload", errors: parsed.error.flatten() });
    return;
  }

  const request = {
    id: `cr-${mockConversionRequests.length + 1}`,
    projectId: parsed.data.projectId,
    title: parsed.data.title,
    dueDate: parsed.data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    stage: "UPLOADED" as ConversionStage,
    assignee: "Unassigned",
  };
  mockConversionRequests.push(request);
  res.status(201).json({ data: request });
});

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

    const row = mockConversionRequests.find((request) => request.id === req.params.id);
    if (!row) {
      res.status(404).json({ message: "Conversion request not found" });
      return;
    }

    row.stage = parsed.data.stage;
    res.json({ data: row });
  }
);
