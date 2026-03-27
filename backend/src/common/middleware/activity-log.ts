import type { NextFunction, Request, Response } from "express";

export function activityLogMiddleware(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const userId = req.user?.id ?? "anonymous";
    const entry = {
      ts: new Date().toISOString(),
      userId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
    };
    // Replace with database persistence in next phase.
    // Keeping stdout logging here for now.
    console.log("[activity]", JSON.stringify(entry));
  });
  next();
}
