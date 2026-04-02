import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../common/middleware/auth.js";
import { requireRoles } from "../../common/middleware/rbac.js";
import { parsePaging, parseSort } from "../../common/utils/pagination.js";
import {
  mockProjects,
  mockConversionRequests,
  mockFiles,
  mockEstimateRevisions,
  mockDeliverables,
  mockClashIssues,
} from "../../data/mock.js";

const projectCreateSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  location: z.string().optional(),
  clientName: z.string().min(2),
  module: z.enum(["BIM_DESIGN", "CAD2BIM", "COSTING"]).optional(),
});

export const projectsRouter = Router();

projectsRouter.get("/", requireAuth, (req, res) => {
  const { page, pageSize, skip, take } = parsePaging(req);
  const { sortBy, sortOrder } = parseSort(req, ["name", "code", "createdAt"], "createdAt");
  const q      = String(req.query.q || "").trim().toLowerCase();
  const status = String(req.query.status || "").trim().toUpperCase();
  const module = String(req.query.module || "").trim().toUpperCase();

  let rows = mockProjects.slice();

  if (status) {
    rows = rows.filter((item) => item.status === status);
  }

  if (module) {
    rows = rows.filter((item) => (item.module ?? "").toUpperCase() === module);
  }

  if (q) {
    rows = rows.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.location ?? "").toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) => {
    const aValue = String(((a as unknown) as Record<string, unknown>)[sortBy] ?? "");
    const bValue = String(((b as unknown) as Record<string, unknown>)[sortBy] ?? "");
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const total = rows.length;
  const data = rows.slice(skip, skip + take).map((p) => ({
    ...p,
    _count: {
      conversionRequests: mockConversionRequests.filter((r) => r.projectId === p.id).length,
      files:              mockFiles.filter((f) => f.projectId === p.id).length,
      members:            (p.members ?? []).length,
      clashReports:       0,
    },
  }));

  res.json({
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      sortBy,
      sortOrder,
    },
  });
});

// GET SINGLE  GET /projects/:id
projectsRouter.get("/:id", requireAuth, (req, res) => {
  const project = mockProjects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  res.json({ data: project });
});

// GET STATS  GET /projects/:id/stats
projectsRouter.get("/:id/stats", requireAuth, (req, res) => {
  const project = mockProjects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  // Derive lightweight stats from mock collections
  const openConversions = mockConversionRequests.filter(
    (r) => r.projectId === req.params.id &&
      r.stage !== "DELIVERED" && r.stage !== "CLOSED"
  ).length;
  res.json({
    data: {
      totalFiles:       mockFiles.filter((f) => f.projectId === req.params.id).length,
      openConversions,
      memberCount:      (project.members ?? []).length,
      openClashes:      mockClashIssues.filter(
        (i) => i.projectId === req.params.id && (i.status === "OPEN" || i.status === "IN_PROGRESS")
      ).length,
      activeEstimates:  mockEstimateRevisions.filter(
        (e) => e.projectId === req.params.id && e.status !== "superseded"
      ).length,
      openTasks:        0,
      deliverables:     mockDeliverables.filter((d) => d.projectId === req.params.id).length,
      recentExports:    mockDeliverables.filter(
        (d) => d.projectId === req.params.id && d.status === "APPROVED"
      ).length,
    },
  });
});

// PATCH /projects/:id — update fields
projectsRouter.patch("/:id", requireAuth, requireRoles("ADMIN", "BIM_MANAGER"), (req, res) => {
  const project = mockProjects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  const { name, clientName, location, status } = req.body ?? {};
  if (typeof name       === "string") project.name       = name;
  if (typeof clientName === "string") project.clientName = clientName;
  if (typeof location   === "string") project.location   = location;
  if (typeof status     === "string") project.status     = status;
  project.updatedAt = new Date().toISOString();
  res.json({ data: project });
});

// DELETE /projects/:id
projectsRouter.delete("/:id", requireAuth, requireRoles("ADMIN", "BIM_MANAGER"), (req, res) => {
  const idx = mockProjects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  mockProjects.splice(idx, 1);
  res.status(204).send();
});

projectsRouter.post("/", requireAuth, requireRoles("ADMIN", "BIM_MANAGER"), (req, res) => {
  const parsed = projectCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid project payload", errors: parsed.error.flatten() });
    return;
  }

  const now = new Date().toISOString();
  const created = {
    id: `p-${mockProjects.length + 1}`,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    members: [],
    ...parsed.data,
    location: parsed.data.location || "",
    module: parsed.data.module ?? "BIM_DESIGN",
  };
  mockProjects.push(created);
  res.status(201).json({ data: created });
});
