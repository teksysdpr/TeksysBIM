import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.js";
import {
  mockConversionRequests,
  mockFiles,
  mockProjects,
  mockEstimateRevisions,
} from "../../data/mock.js";

export const dashboardRouter = Router();

// GET /dashboard/summary
// Returns a flat DashboardSummary shape that matches the frontend dashboardService contract.
dashboardRouter.get("/summary", requireAuth, (_req, res) => {
  const activeProjects   = mockProjects.filter((p) => p.status === "ACTIVE").length;
  const openConversions  = mockConversionRequests.filter(
    (r) => r.stage !== "DELIVERED" && r.stage !== "CLOSED"
  ).length;
  const pendingApprovals = mockConversionRequests.filter(
    (r) => r.stage === "UNDER_REVIEW" || r.stage === "QA_CHECK"
  ).length;
  const estimationJobs   = mockEstimateRevisions.filter(
    (e) => e.status === "draft" || e.status === "submitted"
  ).length;

  res.json({
    activeProjects,
    openConversions,
    pendingApprovals,
    openClashItems:   0,
    estimationJobs,
    activeUsers:      2,
    storageUsedMb:    mockFiles.length * 8,
    storageLimitMb:   5120,
    planName:         "BIM Professional",
    recentExports:    0,
  });
});
