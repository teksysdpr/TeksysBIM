import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.js";
import { requireRoles } from "../../common/middleware/rbac.js";
import { mockUsers } from "../../data/mock.js";

export const adminRouter = Router();

adminRouter.get("/users", requireAuth, requireRoles("ADMIN"), (_req, res) => {
  res.json({
    data: mockUsers.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      organizationId: user.organizationId,
    })),
  });
});

adminRouter.get("/settings", requireAuth, requireRoles("ADMIN"), (_req, res) => {
  res.json({
    data: {
      fileRetentionDays: 3650,
      maxUploadMb: 100,
      approvalMatrixEnabled: true,
      auditLogsEnabled: true,
    },
  });
});
