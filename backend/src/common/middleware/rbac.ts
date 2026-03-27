import type { NextFunction, Request, Response } from "express";

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles ?? [];
    const isAllowed = roles.some((role) => userRoles.includes(role));
    if (!isAllowed) {
      res.status(403).json({ message: "Forbidden: insufficient role access" });
      return;
    }
    next();
  };
}
