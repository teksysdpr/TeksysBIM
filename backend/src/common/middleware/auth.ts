import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { appConfig } from "../../config/env.js";

export type AuthUser = {
  id: string;
  email: string;
  roles: string[];
  organizationId?: string | null;
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (!token) {
    next();
    return;
  }
  try {
    req.user = jwt.verify(token, appConfig.jwtSecret) as AuthUser;
  } catch {
    req.user = undefined;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    req.user = jwt.verify(token, appConfig.jwtSecret) as AuthUser;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

function extractBearer(req: Request) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7);
}
