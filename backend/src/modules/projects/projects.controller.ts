import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../common/middleware/auth.js";
import { requireRoles } from "../../common/middleware/rbac.js";
import { parsePaging, parseSort } from "../../common/utils/pagination.js";
import { mockProjects } from "../../data/mock.js";

const projectCreateSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  location: z.string().optional(),
  clientName: z.string().min(2),
});

export const projectsRouter = Router();

projectsRouter.get("/", requireAuth, (req, res) => {
  const { page, pageSize, skip, take } = parsePaging(req);
  const { sortBy, sortOrder } = parseSort(req, ["name", "code", "createdAt"], "createdAt");
  const q = String(req.query.q || "").trim().toLowerCase();

  let rows = mockProjects.slice();

  if (q) {
    rows = rows.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) => {
    const aValue = (a as Record<string, string>)[sortBy];
    const bValue = (b as Record<string, string>)[sortBy];
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const total = rows.length;
  const data = rows.slice(skip, skip + take);

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
    ...parsed.data,
    location: parsed.data.location || "",
  };
  mockProjects.push(created);
  res.status(201).json({ data: created });
});
