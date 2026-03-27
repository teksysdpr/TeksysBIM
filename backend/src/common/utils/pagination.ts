import type { Request } from "express";

export function parsePaging(req: Request) {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}

export function parseSort(req: Request, allowed: string[], fallback = "createdAt") {
  const sortByRaw = String(req.query.sortBy || fallback);
  const sortBy = allowed.includes(sortByRaw) ? sortByRaw : fallback;
  const sortOrder = String(req.query.sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  return { sortBy, sortOrder };
}
