/**
 * Costing Controller
 *
 * BOQ / cost estimation workspace — Costing Phase 2 + Phase 3.
 *
 * Phase 2 endpoints:
 *   GET  /costing/rate-library               — Schedule of rates
 *   GET  /costing/estimates                  — List estimate revisions
 *   POST /costing/estimates/create           — Create estimate from takeoff revision
 *   GET  /costing/estimates/:id/boq          — BOQ line items
 *   GET  /costing/estimates/:id/summary      — Cost summary (subtotal + adjustments)
 *
 * Phase 3 endpoints:
 *   GET   /costing/estimates/compare         — Compare two estimates (delta view)
 *   GET   /costing/estimates/:id/history     — Audit events for an estimate
 *   PATCH /costing/estimates/:id/status      — Transition estimate status
 *
 * NOTE: Static sub-routes (/compare, /create) must be declared BEFORE /:id routes.
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../common/middleware/auth.js";
import { requireRoles } from "../../common/middleware/rbac.js";
import {
  mockRateItems,
  mockEstimateRevisions,
  mockBoqLineItems,
  mockTakeoffRevisions,
  mockQuantityRecords,
  mockEstimateAuditEvents,
} from "../../data/mock.js";
import type {
  BoqLineItem,
  ComparisonChangeType,
  ComparisonLine,
  EstimateComparison,
  EstimateRevision,
  EstimateSummary,
} from "../../types.js";

export const costingRouter = Router();

// ── RATE LIBRARY  GET /costing/rate-library ───────────────────────────────────

costingRouter.get("/rate-library", requireAuth, (req, res) => {
  const { discipline, elementType } = req.query;
  let rates = mockRateItems.slice();
  if (discipline && typeof discipline === "string") {
    rates = rates.filter((r) => r.discipline === discipline);
  }
  if (elementType && typeof elementType === "string") {
    rates = rates.filter((r) => r.elementType === elementType);
  }
  rates.sort((a, b) =>
    a.discipline.localeCompare(b.discipline) ||
    a.elementType.localeCompare(b.elementType)
  );
  res.json({ data: rates, total: rates.length });
});

// ── LIST ESTIMATES  GET /costing/estimates?projectId= ─────────────────────────

costingRouter.get("/estimates", requireAuth, (req, res) => {
  const { projectId } = req.query;
  let estimates = mockEstimateRevisions.slice();
  if (projectId && typeof projectId === "string") {
    estimates = estimates.filter((e) => e.projectId === projectId);
  }
  estimates.sort((a, b) => b.revisionNumber - a.revisionNumber);
  res.json({ data: estimates, total: estimates.length });
});

// ── CREATE ESTIMATE  POST /costing/estimates/create ───────────────────────────
// NOTE: This route must be declared before /:id routes to avoid "create" being
// treated as an estimateId parameter.

const createSchema = z.object({
  projectId:         z.string().min(1),
  takeoffRevisionId: z.string().min(1),
  label:             z.string().optional(),
  notes:             z.string().optional(),
  createdBy:         z.string().optional(),
  contingencyPct:    z.number().min(0).max(100).optional(),
  overheadPct:       z.number().min(0).max(100).optional(),
  profitPct:         z.number().min(0).max(100).optional(),
});

costingRouter.post(
  "/estimates/create",
  requireAuth,
  requireRoles("ADMIN", "BIM_MANAGER", "BIM_ENGINEER"),
  (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
      return;
    }

    const {
      projectId,
      takeoffRevisionId,
      notes,
      createdBy        = "BIM Manager",
      contingencyPct   = 5,
      overheadPct      = 10,
      profitPct        = 8,
    } = parsed.data;

    // Validate takeoff revision exists
    const takeoffRev = mockTakeoffRevisions.find((r) => r.id === takeoffRevisionId);
    if (!takeoffRev) {
      res.status(404).json({ message: "Takeoff revision not found" });
      return;
    }

    // Determine next estimate revision number for this project
    const existing = mockEstimateRevisions.filter((e) => e.projectId === projectId);
    const nextNum = existing.length > 0
      ? Math.max(...existing.map((e) => e.revisionNumber)) + 1
      : 1;

    const now        = new Date().toISOString();
    const estimateId = `est-${Date.now()}`;
    const label      = parsed.data.label
      ?? `Est-${String(nextNum).padStart(2, "0")} — ${now.slice(0, 10)}`;

    const newEstimate: EstimateRevision = {
      id: estimateId,
      projectId,
      takeoffRevisionId,
      revisionNumber: nextNum,
      label,
      status: "draft",
      currency: "INR",
      contingencyPct,
      overheadPct,
      profitPct,
      notes: notes ?? null,
      createdBy,
      createdAt: now,
    };

    mockEstimateRevisions.push(newEstimate);

    // Auto-map rates from rate library to each quantity record in the takeoff revision.
    // Matching key: discipline + elementType.  Rate = 0 when no match found.
    const qtyRecords = mockQuantityRecords.filter(
      (qr) => qr.revisionId === takeoffRevisionId
    );

    const newLines: BoqLineItem[] = qtyRecords.map((qr, i) => {
      const rate = mockRateItems.find(
        (r) => r.discipline === qr.discipline && r.elementType === qr.elementType
      );
      const ratePerUnit = rate?.ratePerUnit ?? 0;
      return {
        id:                `boq-gen-${Date.now()}-${i}`,
        estimateId,
        quantityRecordId:  qr.id,
        discipline:        qr.discipline,
        level:             qr.level,
        zone:              qr.zone,
        elementType:       qr.elementType,
        description:       qr.description,
        unit:              qr.unit,
        quantity:          qr.quantity,
        rateItemId:        rate?.id ?? null,
        ratePerUnit,
        amount:            Math.round(qr.quantity * ratePerUnit * 100) / 100,
        notes:             null,
      };
    });

    mockBoqLineItems.push(...newLines);

    res.status(201).json({
      data: {
        estimate:       newEstimate,
        linesGenerated: newLines.length,
      },
    });
  }
);

// ── COMPARE  GET /costing/estimates/compare?baseId=&compareId= ───────────────
// Returns a line-by-line delta between two estimate revisions.
// MUST be declared before /:id routes to avoid "compare" matching as an id.

costingRouter.get("/estimates/compare", requireAuth, (req, res) => {
  const { baseId, compareId } = req.query;

  if (!baseId || typeof baseId !== "string" || !compareId || typeof compareId !== "string") {
    res.status(400).json({ message: "baseId and compareId are required query params" });
    return;
  }
  if (baseId === compareId) {
    res.status(400).json({ message: "baseId and compareId must be different" });
    return;
  }

  const baseEst = mockEstimateRevisions.find((e) => e.id === baseId);
  const cmpEst  = mockEstimateRevisions.find((e) => e.id === compareId);
  if (!baseEst) { res.status(404).json({ message: "Base estimate not found" });    return; }
  if (!cmpEst)  { res.status(404).json({ message: "Compare estimate not found" }); return; }

  const baseLines = mockBoqLineItems.filter((l) => l.estimateId === baseId);
  const cmpLines  = mockBoqLineItems.filter((l) => l.estimateId === compareId);

  const baseByQr = new Map(baseLines.map((l) => [l.quantityRecordId, l]));
  const cmpByQr  = new Map(cmpLines.map((l)  => [l.quantityRecordId, l]));

  const allQrIds = new Set([...baseByQr.keys(), ...cmpByQr.keys()]);

  const lines: ComparisonLine[] = [];
  let changedCount = 0, addedCount = 0, removedCount = 0, unchangedCount = 0;

  for (const qrId of allQrIds) {
    const base = baseByQr.get(qrId);
    const cmp  = cmpByQr.get(qrId);

    if (base && cmp) {
      const qtyChanged  = base.quantity    !== cmp.quantity;
      const rateChanged = base.ratePerUnit !== cmp.ratePerUnit;
      const changeType: ComparisonChangeType = (qtyChanged || rateChanged) ? "changed" : "unchanged";
      lines.push({
        quantityRecordId: qrId,
        discipline:       cmp.discipline,   elementType: cmp.elementType,
        description:      cmp.description,  unit:        cmp.unit,
        level:            cmp.level,        zone:        cmp.zone,
        changeType,
        baseQty:    base.quantity,     compareQty:    cmp.quantity,
        baseRate:   base.ratePerUnit,  compareRate:   cmp.ratePerUnit,
        baseAmount: base.amount,       compareAmount: cmp.amount,
        qtyDelta:    cmp.quantity    - base.quantity,
        rateDelta:   cmp.ratePerUnit - base.ratePerUnit,
        amountDelta: cmp.amount      - base.amount,
      });
      if (changeType === "changed") changedCount++; else unchangedCount++;
    } else if (base) {
      lines.push({
        quantityRecordId: qrId,
        discipline: base.discipline, elementType: base.elementType,
        description: base.description, unit: base.unit,
        level: base.level, zone: base.zone,
        changeType: "removed",
        baseQty: base.quantity,    compareQty:    null,
        baseRate: base.ratePerUnit, compareRate:  null,
        baseAmount: base.amount,   compareAmount: null,
        qtyDelta: null, rateDelta: null, amountDelta: null,
      });
      removedCount++;
    } else if (cmp) {
      lines.push({
        quantityRecordId: qrId,
        discipline: cmp.discipline, elementType: cmp.elementType,
        description: cmp.description, unit: cmp.unit,
        level: cmp.level, zone: cmp.zone,
        changeType: "added",
        baseQty: null,    compareQty:    cmp.quantity,
        baseRate: null,   compareRate:   cmp.ratePerUnit,
        baseAmount: null, compareAmount: cmp.amount,
        qtyDelta: null, rateDelta: null, amountDelta: null,
      });
      addedCount++;
    }
  }

  // Sort: removed → added → changed → unchanged, then discipline → elementType
  const changeOrder: Record<ComparisonChangeType, number> = {
    removed: 0, added: 1, changed: 2, unchanged: 3,
  };
  lines.sort((a, b) =>
    changeOrder[a.changeType] - changeOrder[b.changeType] ||
    a.discipline.localeCompare(b.discipline) ||
    a.elementType.localeCompare(b.elementType)
  );

  // Recompute grand totals from line sums (consistent with summary endpoint logic)
  const baseSubtotal = baseLines.reduce((s, l) => s + l.amount, 0);
  const cmpSubtotal  = cmpLines.reduce((s, l) => s + l.amount, 0);
  const round = (n: number) => Math.round(n);

  const baseGrandTotal = baseSubtotal
    + round(baseSubtotal * baseEst.contingencyPct / 100)
    + round(baseSubtotal * baseEst.overheadPct    / 100)
    + round(baseSubtotal * baseEst.profitPct      / 100);
  const cmpGrandTotal  = cmpSubtotal
    + round(cmpSubtotal  * cmpEst.contingencyPct  / 100)
    + round(cmpSubtotal  * cmpEst.overheadPct     / 100)
    + round(cmpSubtotal  * cmpEst.profitPct       / 100);

  const result: EstimateComparison = {
    baseEstimateId:    baseId,
    compareEstimateId: compareId,
    baseLabel:         baseEst.label,
    compareLabel:      cmpEst.label,
    baseSubtotal,
    compareSubtotal:   cmpSubtotal,
    subtotalDelta:     cmpSubtotal   - baseSubtotal,
    baseGrandTotal,
    compareGrandTotal: cmpGrandTotal,
    grandTotalDelta:   cmpGrandTotal - baseGrandTotal,
    changedCount,
    addedCount,
    removedCount,
    unchangedCount,
    lines,
  };

  res.json({ data: result });
});

// ── BOQ LINE ITEMS  GET /costing/estimates/:id/boq ────────────────────────────

costingRouter.get("/estimates/:estimateId/boq", requireAuth, (req, res) => {
  const { estimateId } = req.params;
  const lines = mockBoqLineItems
    .filter((l) => l.estimateId === estimateId)
    .slice()
    .sort((a, b) =>
      a.discipline.localeCompare(b.discipline) ||
      a.elementType.localeCompare(b.elementType) ||
      a.level.localeCompare(b.level)
    );
  res.json({ data: lines, total: lines.length });
});

// ── ESTIMATE SUMMARY  GET /costing/estimates/:id/summary ─────────────────────

costingRouter.get("/estimates/:estimateId/summary", requireAuth, (req, res) => {
  const { estimateId } = req.params;

  const estimate = mockEstimateRevisions.find((e) => e.id === estimateId);
  if (!estimate) {
    res.status(404).json({ message: "Estimate not found" });
    return;
  }

  const lines = mockBoqLineItems.filter((l) => l.estimateId === estimateId);

  const byDiscipline: Record<string, { lineCount: number; amount: number }> = {};
  let subtotal = 0;

  for (const line of lines) {
    subtotal += line.amount;
    if (!byDiscipline[line.discipline]) {
      byDiscipline[line.discipline] = { lineCount: 0, amount: 0 };
    }
    byDiscipline[line.discipline].lineCount += 1;
    byDiscipline[line.discipline].amount    += line.amount;
  }

  const contingency = Math.round((subtotal * estimate.contingencyPct) / 100);
  const overhead    = Math.round((subtotal * estimate.overheadPct)    / 100);
  const profit      = Math.round((subtotal * estimate.profitPct)      / 100);
  const grandTotal  = subtotal + contingency + overhead + profit;

  const summary: EstimateSummary = {
    estimateId,
    projectId:          estimate.projectId,
    takeoffRevisionId:  estimate.takeoffRevisionId,
    subtotal,
    contingency,
    overhead,
    profit,
    grandTotal,
    currency:           estimate.currency,
    contingencyPct:     estimate.contingencyPct,
    overheadPct:        estimate.overheadPct,
    profitPct:          estimate.profitPct,
    byDiscipline,
  };

  res.json({ data: summary });
});

// ── HISTORY  GET /costing/estimates/:id/history ───────────────────────────────

costingRouter.get("/estimates/:estimateId/history", requireAuth, (req, res) => {
  const { estimateId } = req.params;
  const events = mockEstimateAuditEvents
    .filter((e) => e.estimateId === estimateId)
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json({ data: events, total: events.length });
});

// ── STATUS TRANSITION  PATCH /costing/estimates/:id/status ───────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft:      ["submitted"],
  submitted:  ["approved", "draft"],
  approved:   ["superseded"],
  superseded: [],
};

const statusSchema = z.object({
  status: z.enum(["draft", "submitted", "approved", "superseded"]),
});

costingRouter.patch(
  "/estimates/:estimateId/status",
  requireAuth,
  requireRoles("ADMIN", "BIM_MANAGER"),
  (req, res) => {
    const { estimateId } = req.params;
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
      return;
    }
    const estimate = mockEstimateRevisions.find((e) => e.id === estimateId);
    if (!estimate) {
      res.status(404).json({ message: "Estimate not found" });
      return;
    }
    const allowed = VALID_TRANSITIONS[estimate.status] ?? [];
    if (!allowed.includes(parsed.data.status)) {
      res.status(422).json({
        message: `Cannot transition from '${estimate.status}' to '${parsed.data.status}'`,
      });
      return;
    }
    estimate.status = parsed.data.status;
    res.json({ data: estimate });
  }
);
