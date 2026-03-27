import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.js";
import { mockConversionRequests, mockFiles, mockProjects } from "../../data/mock.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", requireAuth, (_req, res) => {
  const totalProjects = mockProjects.length;
  const activeProjects = mockProjects.filter((project) => project.status === "ACTIVE").length;
  const totalFiles = mockFiles.length;
  const conversionOpen = mockConversionRequests.filter(
    (request) => request.stage !== "DELIVERED" && request.stage !== "CLOSED"
  ).length;
  const delivered = mockConversionRequests.filter((request) => request.stage === "DELIVERED").length;

  res.json({
    kpis: {
      totalProjects,
      activeProjects,
      totalFiles,
      conversionOpen,
      delivered,
    },
    stageDistribution: mockConversionRequests.reduce<Record<string, number>>((acc, item) => {
      acc[item.stage] = (acc[item.stage] || 0) + 1;
      return acc;
    }, {}),
    alerts: [
      {
        level: "warning",
        text: "1 request is due within next 3 days and still in conversion.",
      },
      {
        level: "info",
        text: "Clash review pending for Tower-A coordination package.",
      },
    ],
  });
});
