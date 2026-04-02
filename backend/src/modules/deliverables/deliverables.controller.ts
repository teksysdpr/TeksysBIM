/**
 * Deliverables & Clash Reports Controller
 *
 * GET /deliverables?projectId=       — deliverable list (filtered by project)
 * GET /deliverables/:id              — single deliverable
 * GET /clash-reports?projectId=      — clash reports with issue summaries
 * GET /clash-reports/:id             — single report with full issue list
 * GET /clash-reports/:id/issues      — issues list (filterable by severity/status)
 */

import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.js";
import {
  mockDeliverables,
  mockClashReports,
  mockClashIssues,
} from "../../data/mock.js";

export const deliverablesRouter = Router();

// ── GET /deliverables?projectId= ──────────────────────────────────────────────

deliverablesRouter.get("/deliverables", requireAuth, (req, res) => {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
  const status    = typeof req.query.status    === "string" ? req.query.status.toUpperCase()    : "";
  const type      = typeof req.query.type      === "string" ? req.query.type.toUpperCase()      : "";

  let rows = mockDeliverables.slice();
  if (projectId) rows = rows.filter((d) => d.projectId === projectId);
  if (status)    rows = rows.filter((d) => d.status    === status);
  if (type)      rows = rows.filter((d) => d.deliverableType === type);

  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ data: rows, total: rows.length });
});

// ── GET /deliverables/:id ─────────────────────────────────────────────────────

deliverablesRouter.get("/deliverables/:id", requireAuth, (req, res) => {
  const row = mockDeliverables.find((d) => d.id === req.params.id);
  if (!row) {
    res.status(404).json({ message: "Deliverable not found" });
    return;
  }
  res.json({ data: row });
});

// ── GET /clash-reports?projectId= ────────────────────────────────────────────
// Returns reports with aggregated issue counts per severity/status.

deliverablesRouter.get("/clash-reports", requireAuth, (req, res) => {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";

  let reports = mockClashReports.slice();
  if (projectId) reports = reports.filter((r) => r.projectId === projectId);

  const enriched = reports.map((report) => {
    const issues = mockClashIssues.filter((i) => i.reportId === report.id);
    return {
      ...report,
      totalIssues:    issues.length,
      openIssues:     issues.filter((i) => i.status === "OPEN").length,
      inProgressIssues: issues.filter((i) => i.status === "IN_PROGRESS").length,
      resolvedIssues: issues.filter((i) => i.status === "RESOLVED").length,
      waivedIssues:   issues.filter((i) => i.status === "WAIVED").length,
      criticalCount:  issues.filter((i) => i.severity === "CRITICAL").length,
      highCount:      issues.filter((i) => i.severity === "HIGH").length,
      mediumCount:    issues.filter((i) => i.severity === "MEDIUM").length,
      lowCount:       issues.filter((i) => i.severity === "LOW").length,
    };
  });

  res.json({ data: enriched, total: enriched.length });
});

// ── GET /clash-reports/:id ────────────────────────────────────────────────────

deliverablesRouter.get("/clash-reports/:id", requireAuth, (req, res) => {
  const report = mockClashReports.find((r) => r.id === req.params.id);
  if (!report) {
    res.status(404).json({ message: "Clash report not found" });
    return;
  }
  const issues = mockClashIssues
    .filter((i) => i.reportId === req.params.id)
    .slice()
    .sort((a, b) => {
      const sevOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4);
    });

  res.json({ data: { ...report, issues } });
});

// ── GET /clash-reports/:id/issues ─────────────────────────────────────────────

deliverablesRouter.get("/clash-reports/:id/issues", requireAuth, (req, res) => {
  const report = mockClashReports.find((r) => r.id === req.params.id);
  if (!report) {
    res.status(404).json({ message: "Clash report not found" });
    return;
  }

  const severity = typeof req.query.severity === "string" ? req.query.severity.toUpperCase() : "";
  const status   = typeof req.query.status   === "string" ? req.query.status.toUpperCase()   : "";

  let issues = mockClashIssues.filter((i) => i.reportId === req.params.id);
  if (severity) issues = issues.filter((i) => i.severity === severity);
  if (status)   issues = issues.filter((i) => i.status   === status);

  const sevOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  issues.sort((a, b) => (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4));

  res.json({ data: issues, total: issues.length });
});
