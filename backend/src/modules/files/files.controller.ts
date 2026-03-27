import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { z } from "zod";
import { appConfig } from "../../config/env.js";
import { requireAuth } from "../../common/middleware/auth.js";
import { parsePaging } from "../../common/utils/pagination.js";
import { mockFiles } from "../../data/mock.js";

const allowedExtensions = new Set([
  ".dwg",
  ".pdf",
  ".ifc",
  ".rvt",
  ".nwc",
  ".nwd",
  ".xlsx",
  ".docx",
  ".zip",
]);

const createFileSchema = z.object({
  projectId: z.string().min(1),
  category: z.string().min(1),
});

function ensureUploadDir() {
  fs.mkdirSync(appConfig.uploadLocalDir, { recursive: true });
}

ensureUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, appConfig.uploadLocalDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: appConfig.maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(ext)) {
      cb(new Error(`Unsupported file type: ${ext || "unknown"}`));
      return;
    }
    cb(null, true);
  },
});

export const filesRouter = Router();

filesRouter.get("/", requireAuth, (req, res) => {
  const { page, pageSize, skip, take } = parsePaging(req);
  const projectId = String(req.query.projectId || "");
  const rows = projectId ? mockFiles.filter((file) => file.projectId === projectId) : mockFiles;
  const total = rows.length;
  const data = rows.slice(skip, skip + take);
  res.json({
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
});

filesRouter.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  (req, res) => {
    const parsed = createFileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid upload metadata", errors: parsed.error.flatten() });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: "File is required" });
      return;
    }

    const file = {
      id: `f-${mockFiles.length + 1}`,
      projectId: parsed.data.projectId,
      originalName: req.file.originalname,
      category: parsed.data.category,
      status: "UPLOADED",
      createdAt: new Date().toISOString(),
      storageKey: req.file.filename,
      sizeBytes: req.file.size,
    };
    mockFiles.push(file as any);
    res.status(201).json({ data: file });
  }
);
