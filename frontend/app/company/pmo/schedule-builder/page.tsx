"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getProjects,
  getSchedules,
  ProjectRow,
  ScheduleRow,
} from "@/app/services/projectControlService";
import {
  createNextBaseline,
  getBaselineDetail,
  listBaselineRevisionLines,
  listScheduleBaselines,
  requestBaselineRevoke,
  saveBaselineDraft,
  submitBaselineForApproval,
  type PMOBaselineRow,
  type PMORevisionChangeLineRow,
} from "@/app/services/pmoScheduleApprovalService";
import { apiRequest } from "@/lib/apiClient";
import { listScheduleImplementationRecords } from "@/app/services/scheduleImplementationService";
import {
  getActivePortalUnits,
  getAssignedCalendarId,
  getAssignedScheduleCalendarId,
  getPortalUnitCatalog,
  listBuiltInPortalUnits,
  readCalendars,
  readPortalUnitStore,
  saveCalendars,
  savePortalUnitStore,
  setAssignedCalendarId,
  setAssignedScheduleCalendarId,
} from "@/lib/pmoPlanner";
import type {
  EVMCostAnalysis,
  EVMLabourCostLine,
  EVMMachineryCostLine,
  EVMMaterialCostLine,
  PortalUnitOption,
  PortalUnitStore,
  PlannerRow,
  ProjectCalendar,
  ScheduleType,
} from "@/lib/pmoPlanner";

type RelationType = "FS" | "SS" | "FF" | "SF";

type ParsedDependency = {
  predRef: string;
  relation: RelationType;
  lagDays: number;
};

type ParsedMspPredecessorLink = {
  predUid: string;
  relation: RelationType;
  lagDays: number;
};

type ParsedMspTask = {
  uid: string;
  mspId: number | null;
  taskName: string;
  outlineLevel: number;
  durationDays: number | null;
  startDate: string;
  finishDate: string;
  predecessorLinks: ParsedMspPredecessorLink[];
};

const SCHEDULE_TYPE_OPTIONS: Array<{ label: string; value: ScheduleType }> = [
  { label: "Milestone Schedule", value: "MILESTONE" },
  { label: "EVM Schedule", value: "EVM" },
];
const WEEKDAY_OPTIONS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];
const UNIT_DOMAIN_ORDER = [
  "Materials",
  "Labor",
  "Activities",
  "Machinery and Equipment",
  "Concrete and Mortar",
  "Miscellaneous",
  "Custom",
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#a67652]";
const cellInputClass =
  "w-full min-w-0 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-[#a67652]";
const durationCellInputClass =
  "w-full min-w-0 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-[#a67652]";
const activityCellInputClass =
  "w-full min-w-0 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-[#a67652]";
const unitCellInputClass =
  "w-full min-w-0 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-[#a67652]";
const MAX_BASELINE_NUMBER = 6;
const GRID_PAGE_SIZE_OPTIONS = [50, 100, 200, 500] as const;
const activeActionButtonClass =
  "rounded-lg border border-[#3f2418] bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-3 py-2 text-xs font-semibold text-white shadow-md transition active:translate-y-[1px] active:shadow-[0_2px_0_#2f1b12]";
const inactiveActionButtonClass =
  "rounded-lg border border-[#ddd0c5] bg-[#efe6df] px-3 py-2 text-xs font-semibold text-[#aa9788] shadow-none cursor-not-allowed";
const saveAction3DButtonClass =
  "rounded-lg border border-[#3f2418] bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-5 py-2 text-sm font-bold text-white shadow-md transition active:translate-y-[1px] active:shadow-[0_2px_0_#2f1b12]";
const submitAction3DButtonClass =
  "rounded-lg border border-slate-800 bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-5 py-2 text-sm font-bold text-white shadow-md transition active:translate-y-[1px] active:shadow-sm";
const exitAction3DButtonClass =
  "rounded-lg border border-[#6f594d] bg-gradient-to-b from-[#b8a79b] to-[#89776b] px-5 py-2 text-sm font-bold text-white shadow-[0_4px_0_#625247] transition active:translate-y-[1px] active:shadow-[0_2px_0_#625247]";
const exportAction3DButtonClass =
  "rounded-lg border border-slate-800 bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-5 py-2 text-sm font-bold text-white shadow-md transition active:translate-y-[1px] active:shadow-sm";

type ExportMode = "PDF" | "PRINT";
type ExportPaperSize = "A4" | "A3" | "A2" | "LETTER" | "LEGAL";
type ExportOrientation = "portrait" | "landscape";

type ExportSettings = {
  pageSize: ExportPaperSize;
  orientation: ExportOrientation;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  printerSelection: "SYSTEM_DIALOG";
};

type CompanyProfileSnapshot = {
  company_name?: string;
  logo_url?: string | null;
};

const EXPORT_PAGE_SIZE_OPTIONS: Array<{ value: ExportPaperSize; label: string }> = [
  { value: "A4", label: "A4" },
  { value: "A3", label: "A3" },
  { value: "A2", label: "A2" },
  { value: "LETTER", label: "Letter" },
  { value: "LEGAL", label: "Legal" },
];

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  pageSize: "A3",
  orientation: "landscape",
  marginTopMm: 10,
  marginRightMm: 8,
  marginBottomMm: 10,
  marginLeftMm: 8,
  printerSelection: "SYSTEM_DIALOG",
};

type ScheduleColumnKey =
  | "no"
  | "id"
  | "activity"
  | "duration"
  | "baselineStart"
  | "baselineFinish"
  | "predecessors"
  | "unit"
  | "projectQty"
  | "cost";

const DEFAULT_COLUMN_WIDTHS: Record<ScheduleColumnKey, number> = {
  no: 44,
  id: 88,
  activity: 560,
  duration: 86,
  baselineStart: 136,
  baselineFinish: 136,
  predecessors: 170,
  unit: 120,
  projectQty: 132,
  cost: 140,
};

const MIN_COLUMN_WIDTHS: Record<ScheduleColumnKey, number> = {
  no: 36,
  id: 64,
  activity: 240,
  duration: 68,
  baselineStart: 112,
  baselineFinish: 112,
  predecessors: 120,
  unit: 88,
  projectQty: 98,
  cost: 110,
};

function createUid() {
  return `rw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeUnitToken(input: string) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createCustomPortalUnit(label: string): PortalUnitOption {
  const normalized = normalizeUnitToken(label) || "custom_unit";
  return {
    id: `custom_${normalized}`,
    label: label.trim(),
    domain: "Custom",
    group: "Custom",
  };
}

function dedupePortalUnits(rows: PortalUnitOption[]) {
  const seen = new Set<string>();
  const next: PortalUnitOption[] = [];
  rows.forEach((row) => {
    const key = String(row.id || "").trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    next.push(row);
  });
  return next;
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const dt = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function toIsoDateFromDateTime(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return "";
}

function toDisplayDate(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const dt = parseIsoDate(raw);
  if (!dt) return raw;
  return dt.toLocaleDateString("en-GB");
}

function readTagText(parent: Element, tagName: string): string {
  const node = parent.getElementsByTagName(tagName)[0];
  return node?.textContent?.trim() || "";
}

function parseMspDurationDays(rawDuration: string): number | null {
  const raw = String(rawDuration || "").trim();
  if (!raw) return null;

  if (/^P/i.test(raw)) {
    const days = Number(raw.match(/(\d+(?:\.\d+)?)D/i)?.[1] || 0);
    const hours = Number(raw.match(/(\d+(?:\.\d+)?)H/i)?.[1] || 0);
    const minutes = Number(raw.match(/(\d+(?:\.\d+)?)M/i)?.[1] || 0);
    const totalDays = days + hours / 8 + minutes / (8 * 60);
    if (Number.isFinite(totalDays) && totalDays > 0) return Math.max(1, Math.round(totalDays));
  }

  const numeric = Number(raw.replace(/[^0-9.+-]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("wk") || lower.includes("week")) return Math.max(1, Math.round(numeric * 7));
  if (lower.includes("hr") || lower.includes("hour")) return Math.max(1, Math.round(numeric / 8));
  if (lower.includes("min")) return Math.max(1, Math.round(numeric / (8 * 60)));
  return Math.max(1, Math.round(numeric));
}

function mapMspPredecessorType(typeRaw: string): RelationType {
  const value = Number(typeRaw);
  if (value === 0) return "FF";
  if (value === 2) return "SF";
  if (value === 3) return "SS";
  return "FS";
}

function parseMspLinkLagDays(rawLag: string): number {
  const parsed = Number(rawLag);
  if (!Number.isFinite(parsed) || parsed === 0) return 0;
  if (Math.abs(parsed) >= 100) return Math.round(parsed / 4800);
  return Math.round(parsed);
}

function addDaysRaw(iso: string, delta: number): string {
  const dt = parseIsoDate(iso);
  if (!dt) return "";
  dt.setUTCDate(dt.getUTCDate() + delta);
  return toIsoDate(dt);
}

function dayDiff(from: string, to: string): number | null {
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDecimalInputOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeFontColor(value: unknown): string {
  const raw = String(value || "").trim();
  if (/^#([0-9a-fA-F]{6})$/.test(raw)) return raw.toUpperCase();
  if (/^#([0-9a-fA-F]{3})$/.test(raw)) {
    const chars = raw.slice(1).split("");
    return `#${chars.map((char) => `${char}${char}`).join("").toUpperCase()}`;
  }
  return "#0F172A";
}

function fontSizeByIndent(indentLevel: number): string {
  const level = Math.max(0, Number(indentLevel || 0));
  if (level === 0) return "13px";
  if (level === 1) return "12px";
  if (level === 2) return "11px";
  if (level === 3) return "10px";
  return "9px";
}

function mmToPt(value: number) {
  return (Number(value || 0) * 72) / 25.4;
}

function toAbsoluteAssetUrl(rawUrl: string): string {
  const value = String(rawUrl || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (typeof window === "undefined") return value;
  try {
    return new URL(value, window.location.origin).toString();
  } catch {
    return value;
  }
}

async function imageToDataUrl(url: string): Promise<string | null> {
  if (!url || typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(null);
          return;
        }
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function rgbFromHex(hex: string): [number, number, number] {
  const normalized = normalizeFontColor(hex).replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((char) => `${char}${char}`).join("") : normalized;
  const r = Number.parseInt(value.slice(0, 2), 16) || 78;
  const g = Number.parseInt(value.slice(2, 4), 16) || 52;
  const b = Number.parseInt(value.slice(4, 6), 16) || 46;
  return [r, g, b];
}

function safeSlug(value: string): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function fitSingleLineText(doc: jsPDF, text: string, maxWidth: number) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  if (doc.getTextWidth(raw) <= maxWidth) return raw;
  const ellipsis = "...";
  let trimmed = raw;
  while (trimmed.length > 1 && doc.getTextWidth(`${trimmed}${ellipsis}`) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}${ellipsis}`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function moneyDisplay(value: number) {
  return roundMoney(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeEvmMaterialLines(raw: unknown): EVMMaterialCostLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => ({
      id: String((row as any)?.id || createUid()),
      description: String((row as any)?.description || "").trim(),
      unit: String((row as any)?.unit || "").trim(),
      qty: parseNumberOrNull((row as any)?.qty),
      rate: parseNumberOrNull((row as any)?.rate),
      gstPercent: parseNumberOrNull((row as any)?.gstPercent),
    }))
    .filter((row) => row.id);
}

function normalizeEvmLabourLines(raw: unknown): EVMLabourCostLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => ({
      id: String((row as any)?.id || createUid()),
      labourType: String((row as any)?.labourType || "").trim(),
      unit: String((row as any)?.unit || "").trim(),
      qty: parseNumberOrNull((row as any)?.qty),
      rate: parseNumberOrNull((row as any)?.rate),
      gstPercent: parseNumberOrNull((row as any)?.gstPercent),
    }))
    .filter((row) => row.id);
}

function normalizeEvmMachineryLines(raw: unknown): EVMMachineryCostLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => ({
      id: String((row as any)?.id || createUid()),
      machineryType: String((row as any)?.machineryType || "").trim(),
      unit: String((row as any)?.unit || "").trim(),
      rate: parseNumberOrNull((row as any)?.rate),
      cost: parseNumberOrNull((row as any)?.cost),
      gstPercent: parseNumberOrNull((row as any)?.gstPercent),
    }))
    .filter((row) => row.id);
}

function createEmptyEvmMaterialLine(): EVMMaterialCostLine {
  return {
    id: createUid(),
    description: "",
    unit: "",
    qty: null,
    rate: null,
    gstPercent: null,
  };
}

function createEmptyEvmLabourLine(): EVMLabourCostLine {
  return {
    id: createUid(),
    labourType: "",
    unit: "",
    qty: null,
    rate: null,
    gstPercent: null,
  };
}

function createEmptyEvmMachineryLine(): EVMMachineryCostLine {
  return {
    id: createUid(),
    machineryType: "",
    unit: "",
    rate: null,
    cost: null,
    gstPercent: null,
  };
}

function materialLineCost(line: EVMMaterialCostLine) {
  return roundMoney(Number(line.qty || 0) * Number(line.rate || 0));
}

function labourLineCost(line: EVMLabourCostLine) {
  return roundMoney(Number(line.qty || 0) * Number(line.rate || 0));
}

function machineryLineCost(line: EVMMachineryCostLine) {
  const cost = Number(line.cost || 0);
  return roundMoney(cost > 0 ? cost : Number(line.rate || 0));
}

function lineGstCost(baseCost: number, gstPercent: number | null) {
  return roundMoney(baseCost * (Number(gstPercent || 0) / 100));
}

function lineTotalCost(baseCost: number, gstPercent: number | null) {
  return roundMoney(baseCost + lineGstCost(baseCost, gstPercent));
}

function summarizeMaterialCosts(lines: EVMMaterialCostLine[]) {
  const subtotalCost = roundMoney(lines.reduce((sum, line) => sum + lineTotalCost(materialLineCost(line), line.gstPercent), 0));
  const totalGst = roundMoney(lines.reduce((sum, line) => sum + lineGstCost(materialLineCost(line), line.gstPercent), 0));
  return { subtotalCost, totalGst };
}

function summarizeLabourCosts(lines: EVMLabourCostLine[]) {
  const subtotalCost = roundMoney(lines.reduce((sum, line) => sum + lineTotalCost(labourLineCost(line), line.gstPercent), 0));
  const totalGst = roundMoney(lines.reduce((sum, line) => sum + lineGstCost(labourLineCost(line), line.gstPercent), 0));
  return { subtotalCost, totalGst };
}

function summarizeMachineryCosts(lines: EVMMachineryCostLine[]) {
  const subtotalCost = roundMoney(lines.reduce((sum, line) => sum + lineTotalCost(machineryLineCost(line), line.gstPercent), 0));
  const totalGst = roundMoney(lines.reduce((sum, line) => sum + lineGstCost(machineryLineCost(line), line.gstPercent), 0));
  return { subtotalCost, totalGst };
}

function normalizeEvmCostAnalysis(raw: unknown): EVMCostAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Record<string, unknown>;
  const materials = normalizeEvmMaterialLines(parsed.materials);
  const labours = normalizeEvmLabourLines(parsed.labours);
  const machinery = normalizeEvmMachineryLines(parsed.machinery);
  if (!materials.length && !labours.length && !machinery.length) return null;
  return { materials, labours, machinery };
}

function getRowEvmSummaries(row: PlannerRow) {
  const analysis = row.evmCostAnalysis;
  if (analysis) {
    const material = summarizeMaterialCosts(analysis.materials);
    const labour = summarizeLabourCosts(analysis.labours);
    const machinery = summarizeMachineryCosts(analysis.machinery);
    const grandTotal = roundMoney(material.subtotalCost + labour.subtotalCost + machinery.subtotalCost);
    const totalGst = roundMoney(material.totalGst + labour.totalGst + machinery.totalGst);
    const activityCostPerUnit = grandTotal;
    const activityTotalCost =
      row.plannedQty != null ? roundMoney(Number(row.plannedQty || 0) * activityCostPerUnit) : grandTotal;
    return {
      materialSubtotal: material.subtotalCost,
      labourSubtotal: labour.subtotalCost,
      machinerySubtotal: machinery.subtotalCost,
      totalGst,
      grandTotal,
      activityCostPerUnit,
      activityTotalCost,
    };
  }
  const fallbackGrand = roundMoney(
    Number(row.evmMaterialCost || 0) + Number(row.evmLabourCost || 0) + Number(row.evmOverheadCost || 0)
  );
  const activityCostPerUnit = row.evmActivityCostPerUnit ?? fallbackGrand;
  const activityTotalCost =
    row.plannedQty != null ? roundMoney(Number(row.plannedQty || 0) * Number(activityCostPerUnit || 0)) : fallbackGrand;
  return {
    materialSubtotal: Number(row.evmMaterialSubtotal || row.evmMaterialCost || 0),
    labourSubtotal: Number(row.evmLabourSubtotal || row.evmLabourCost || 0),
    machinerySubtotal: Number(row.evmMachinerySubtotal || row.evmOverheadCost || 0),
    totalGst: Number(row.evmTotalGst || 0),
    grandTotal: fallbackGrand,
    activityCostPerUnit: Number(activityCostPerUnit || 0),
    activityTotalCost,
  };
}

function formatWorkingDays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  return sorted
    .map((day) => WEEKDAY_OPTIONS.find((item) => item.value === day)?.label || String(day))
    .join(", ");
}

function computeDurationByCalendar(
  startDate: string,
  finishDate: string,
  calendar: ProjectCalendar | null
): number | null {
  if (!startDate || !finishDate) return null;
  const start = parseIsoDate(startDate);
  const finish = parseIsoDate(finishDate);
  if (!start || !finish) return null;
  if (finish < start) return 0;
  if (!calendar) {
    const raw = dayDiff(startDate, finishDate);
    return raw == null ? null : raw + 1;
  }
  let cursor = new Date(start.getTime());
  let count = 0;
  while (cursor <= finish) {
    const day = cursor.getUTCDay();
    const iso = toIsoDate(cursor);
    if (calendar.workingDays.includes(day) && !calendar.holidays.includes(iso)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

function computeFinishByCalendar(
  startDate: string,
  durationDays: number,
  calendar: ProjectCalendar | null
): string {
  if (!startDate) return "";
  if (durationDays <= 1) return startDate;
  if (!calendar) return addDaysRaw(startDate, durationDays - 1);

  const start = parseIsoDate(startDate);
  if (!start) return "";
  let remaining = durationDays - 1;
  const cursor = new Date(start.getTime());
  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const day = cursor.getUTCDay();
    const iso = toIsoDate(cursor);
    if (!calendar.workingDays.includes(day)) continue;
    if (calendar.holidays.includes(iso)) continue;
    remaining -= 1;
  }
  return toIsoDate(cursor);
}

function parseDependencyToken(token: string): ParsedDependency | null {
  const cleaned = token.replace(/\s+/g, "").toUpperCase();
  if (!cleaned) return null;
  const match = cleaned.match(/^(\d+(?:\.\d+)*)(FS|SS|FF|SF)?([+-]\d+D?)?$/);
  if (!match) return null;
  const predRef = match[1];
  const relation = (match[2] || "FS") as RelationType;
  const lagText = (match[3] || "").replace("D", "");
  const lagDays = lagText ? Number(lagText) : 0;
  if (!Number.isFinite(lagDays)) return null;
  return { predRef, relation, lagDays };
}

function parseDependencies(expression: string) {
  const tokens = expression
    .split(/[;,]/)
    .map((x) => x.trim())
    .filter(Boolean);
  const dependencies: ParsedDependency[] = [];
  const invalidTokens: string[] = [];
  tokens.forEach((token) => {
    const parsed = parseDependencyToken(token);
    if (parsed) dependencies.push(parsed);
    else invalidTokens.push(token);
  });
  return { dependencies, invalidTokens };
}

function parseMspXmlTasks(xmlText: string): ParsedMspTask[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error("Invalid MSP XML file. Please export again from Microsoft Project.");
  }

  const taskNodes = Array.from(doc.getElementsByTagName("Task"));
  const parsedTasks: ParsedMspTask[] = taskNodes
    .map((taskNode, index) => {
      const uid = readTagText(taskNode, "UID") || `uid_${index + 1}`;
      const mspIdRaw = Number(readTagText(taskNode, "ID"));
      const outlineLevelRaw = Number(readTagText(taskNode, "OutlineLevel"));
      const taskName = readTagText(taskNode, "Name");
      const startDate = toIsoDateFromDateTime(readTagText(taskNode, "Start"));
      const finishDate = toIsoDateFromDateTime(readTagText(taskNode, "Finish"));
      const durationDays = parseMspDurationDays(readTagText(taskNode, "Duration"));

      const predecessorLinks: ParsedMspPredecessorLink[] = Array.from(
        taskNode.getElementsByTagName("PredecessorLink")
      )
        .map((linkNode) => {
          const predUid = readTagText(linkNode, "PredecessorUID");
          if (!predUid) return null;
          const relation = mapMspPredecessorType(readTagText(linkNode, "Type"));
          const lagDays = parseMspLinkLagDays(readTagText(linkNode, "LinkLag"));
          return { predUid, relation, lagDays };
        })
        .filter((row): row is ParsedMspPredecessorLink => !!row);

      return {
        uid,
        mspId: Number.isFinite(mspIdRaw) ? mspIdRaw : null,
        taskName: taskName.trim(),
        outlineLevel: Number.isFinite(outlineLevelRaw) ? outlineLevelRaw : 1,
        durationDays,
        startDate,
        finishDate,
        predecessorLinks,
      };
    })
    .filter((row) => row.taskName && row.outlineLevel > 0);

  return parsedTasks;
}

function createDependencyResolver(rows: PlannerRow[]) {
  const byActivityId = new Map<number, PlannerRow>();
  const byWbsCode = new Map<string, PlannerRow>();
  rows.forEach((row) => {
    byActivityId.set(row.activityId, row);
    const wbs = String(row.wbsCode || "").trim();
    if (wbs) byWbsCode.set(wbs, row);
  });

  return (predRef: string): number | null => {
    const ref = String(predRef || "").trim();
    if (!ref) return null;
    if (byWbsCode.has(ref)) return byWbsCode.get(ref)!.activityId;
    if (/^\d+$/.test(ref)) {
      const numeric = Number(ref);
      if (byActivityId.has(numeric)) return numeric;
    }
    return null;
  };
}

function detectCycleNodes(ids: number[], edges: Array<[number, number]>) {
  const adjacency = new Map<number, number[]>();
  ids.forEach((id) => adjacency.set(id, []));
  edges.forEach(([from, to]) => {
    const list = adjacency.get(from);
    if (list) list.push(to);
  });

  const color = new Map<number, 0 | 1 | 2>();
  ids.forEach((id) => color.set(id, 0));
  const stack: number[] = [];
  const cycleNodes = new Set<number>();

  function dfs(node: number) {
    color.set(node, 1);
    stack.push(node);
    for (const next of adjacency.get(node) || []) {
      const c = color.get(next) || 0;
      if (c === 0) {
        dfs(next);
      } else if (c === 1) {
        const idx = stack.indexOf(next);
        if (idx >= 0) {
          for (let i = idx; i < stack.length; i += 1) cycleNodes.add(stack[i]);
          cycleNodes.add(next);
        }
      }
    }
    stack.pop();
    color.set(node, 2);
  }

  ids.forEach((id) => {
    if ((color.get(id) || 0) === 0) dfs(id);
  });

  return cycleNodes;
}

function nextActivityId(rows: PlannerRow[]) {
  return rows.reduce((max, row) => Math.max(max, row.activityId), 0) + 1;
}

function rowHasEntry(row: PlannerRow) {
  const evmSummary = getRowEvmSummaries(row);
  return Boolean(
    String(row.activityName || "").trim() ||
      String(row.predecessors || "").trim() ||
      String(row.unit || "").trim() ||
      String(row.remarks || "").trim() ||
      row.plannedQty != null ||
      row.evmMaterialCost != null ||
      row.evmLabourCost != null ||
      row.evmOverheadCost != null ||
      (row.evmCostAnalysis &&
        (row.evmCostAnalysis.materials.length > 0 ||
          row.evmCostAnalysis.labours.length > 0 ||
          row.evmCostAnalysis.machinery.length > 0)) ||
      evmSummary.grandTotal > 0 ||
      row.startDate ||
      row.finishDate
  );
}

function evmTotalCost(row: PlannerRow) {
  const summary = getRowEvmSummaries(row);
  return summary.activityTotalCost > 0 ? summary.activityTotalCost : summary.grandTotal;
}

function createEmptyPlannerRow(
  activityId: number,
  indentLevel: number,
  segment: string,
  sourceScheduleId: number | null,
  scheduleType: ScheduleType
): PlannerRow {
  return {
    uid: createUid(),
    sourceScheduleId,
    scheduleType,
    activityId,
    wbsCode: "",
    activityName: "",
    parentActivityId: null,
    indentLevel,
    activityType: "TASK",
    segment,
    tradeCategory: "",
    unit: "",
    plannedQty: null,
    durationDays: 1,
    startDate: "",
    finishDate: "",
    predecessors: "",
    successors: "",
    baseline1Start: "",
    baseline1Finish: "",
    baseline1Duration: 0,
    baseline2Start: "",
    baseline2Finish: "",
    baseline2Duration: 0,
    baseline3Start: "",
    baseline3Finish: "",
    baseline3Duration: 0,
    actualStart: "",
    actualFinish: "",
    status: "Active",
    percentComplete: 0,
    delayDays: 0,
    remarks: "",
    evmMaterialCost: null,
    evmLabourCost: null,
    evmOverheadCost: null,
    evmCostAnalysis: null,
    evmMaterialSubtotal: null,
    evmLabourSubtotal: null,
    evmMachinerySubtotal: null,
    evmTotalGst: null,
    evmGrandTotalCost: null,
    evmActivityCostPerUnit: null,
    evmActivityTotalCost: null,
    fontWeight: "normal",
    fontStyle: "normal",
    fontColor: "#0F172A",
  };
}

function mapPayloadRowsToPlannerRows(
  payloadRows: Record<string, any>[],
  scheduleId: number | null
): PlannerRow[] {
  return payloadRows.map((raw, index) => {
    const activityId = Number(raw?.activityId || index + 1);
    const scheduleType: ScheduleType =
      String(raw?.scheduleType || "").toUpperCase() === "EVM" ? "EVM" : "MILESTONE";
    const evmCostAnalysis = normalizeEvmCostAnalysis(raw?.evmCostAnalysis);
    const materialSummary = evmCostAnalysis ? summarizeMaterialCosts(evmCostAnalysis.materials) : null;
    const labourSummary = evmCostAnalysis ? summarizeLabourCosts(evmCostAnalysis.labours) : null;
    const machinerySummary = evmCostAnalysis
      ? summarizeMachineryCosts(evmCostAnalysis.machinery)
      : null;
    const grandFromAnalysis =
      materialSummary && labourSummary && machinerySummary
        ? roundMoney(
            materialSummary.subtotalCost +
              labourSummary.subtotalCost +
              machinerySummary.subtotalCost
          )
        : null;
    const rawPlannedQty =
      raw?.plannedQty === null || raw?.plannedQty === undefined ? null : Number(raw.plannedQty);
    const plannedQty = rawPlannedQty != null && Number.isFinite(rawPlannedQty) ? rawPlannedQty : null;
    const activityCostPerUnit = parseNumberOrNull(raw?.evmActivityCostPerUnit) ?? grandFromAnalysis;
    const normalized: PlannerRow = {
      uid: String(raw?.uid || createUid()),
      sourceScheduleId: scheduleId,
      scheduleType,
      activityId: Number.isFinite(activityId) ? activityId : index + 1,
      wbsCode: String(raw?.wbsCode || ""),
      activityName: String(raw?.activityName || `Activity ${index + 1}`),
      parentActivityId:
        raw?.parentActivityId === null || raw?.parentActivityId === undefined
          ? null
          : Number(raw.parentActivityId),
      indentLevel: Math.max(0, Number(raw?.indentLevel || 0)),
      activityType:
        raw?.activityType === "SUMMARY" || raw?.activityType === "MILESTONE"
          ? raw.activityType
          : "TASK",
      segment: String(raw?.segment || ""),
      tradeCategory: String(raw?.tradeCategory || ""),
      unit: String(raw?.unit || ""),
      plannedQty,
      durationDays: Math.max(0, Number(raw?.durationDays || 1)),
      startDate: String(raw?.startDate || ""),
      finishDate: String(raw?.finishDate || ""),
      predecessors: String(raw?.predecessors || ""),
      successors: "",
      baseline1Start: String(raw?.baseline1Start || ""),
      baseline1Finish: String(raw?.baseline1Finish || ""),
      baseline1Duration: Math.max(0, Number(raw?.baseline1Duration || 0)),
      baseline2Start: String(raw?.baseline2Start || ""),
      baseline2Finish: String(raw?.baseline2Finish || ""),
      baseline2Duration: Math.max(0, Number(raw?.baseline2Duration || 0)),
      baseline3Start: String(raw?.baseline3Start || ""),
      baseline3Finish: String(raw?.baseline3Finish || ""),
      baseline3Duration: Math.max(0, Number(raw?.baseline3Duration || 0)),
      actualStart: String(raw?.actualStart || ""),
      actualFinish: String(raw?.actualFinish || ""),
      status: String(raw?.status || "Active"),
      percentComplete: clamp(Number(raw?.percentComplete || 0), 0, 100),
      delayDays: Number(raw?.delayDays || 0),
      remarks: String(raw?.remarks || ""),
      evmMaterialCost: parseNumberOrNull(raw?.evmMaterialCost) ?? materialSummary?.subtotalCost ?? null,
      evmLabourCost: parseNumberOrNull(raw?.evmLabourCost) ?? labourSummary?.subtotalCost ?? null,
      evmOverheadCost:
        parseNumberOrNull(raw?.evmOverheadCost) ?? machinerySummary?.subtotalCost ?? null,
      evmCostAnalysis,
      evmMaterialSubtotal:
        parseNumberOrNull(raw?.evmMaterialSubtotal) ?? materialSummary?.subtotalCost ?? null,
      evmLabourSubtotal:
        parseNumberOrNull(raw?.evmLabourSubtotal) ?? labourSummary?.subtotalCost ?? null,
      evmMachinerySubtotal:
        parseNumberOrNull(raw?.evmMachinerySubtotal) ?? machinerySummary?.subtotalCost ?? null,
      evmTotalGst:
        parseNumberOrNull(raw?.evmTotalGst) ??
        (materialSummary && labourSummary && machinerySummary
          ? roundMoney(
              materialSummary.totalGst + labourSummary.totalGst + machinerySummary.totalGst
            )
          : null),
      evmGrandTotalCost: parseNumberOrNull(raw?.evmGrandTotalCost) ?? grandFromAnalysis,
      evmActivityCostPerUnit: activityCostPerUnit,
      evmActivityTotalCost:
        parseNumberOrNull(raw?.evmActivityTotalCost) ??
        (activityCostPerUnit != null && plannedQty != null
          ? roundMoney(Number(plannedQty || 0) * activityCostPerUnit)
          : activityCostPerUnit),
      fontWeight: String(raw?.fontWeight || "").toLowerCase() === "bold" ? "bold" : "normal",
      fontStyle: String(raw?.fontStyle || "").toLowerCase() === "italic" ? "italic" : "normal",
      fontColor: normalizeFontColor(raw?.fontColor),
    };
    return normalized;
  });
}

function normalizeRowByType(row: PlannerRow, calendar: ProjectCalendar | null): PlannerRow {
  const next = { ...row };
  next.percentComplete = clamp(Number(next.percentComplete || 0), 0, 100);
  if (next.activityType === "MILESTONE") {
    next.durationDays = 0;
    if (!next.startDate && next.finishDate) next.startDate = next.finishDate;
    if (!next.finishDate && next.startDate) next.finishDate = next.startDate;
    if (next.startDate) next.finishDate = next.startDate;
    return next;
  }
  next.durationDays = Math.max(1, Math.round(Number(next.durationDays || 1)));
  if (next.startDate && !next.finishDate) {
    next.finishDate = computeFinishByCalendar(next.startDate, next.durationDays, calendar);
  }
  if (next.startDate && next.finishDate) {
    const d = computeDurationByCalendar(next.startDate, next.finishDate, calendar);
    if (d != null && d > 0) next.durationDays = d;
  }
  return next;
}

function recomputeHierarchy(
  rows: PlannerRow[],
  options?: { preserveIndent?: boolean }
): PlannerRow[] {
  const preserveIndent = Boolean(options?.preserveIndent);
  const countersBySchedule: Record<string, number[]> = {};
  const normalized: PlannerRow[] = [];
  rows.forEach((row) => {
    const scheduleKey = String(row.sourceScheduleId || "none");
    if (!countersBySchedule[scheduleKey]) countersBySchedule[scheduleKey] = [];

    let prevSameSchedule: PlannerRow | null = null;
    for (let j = normalized.length - 1; j >= 0; j -= 1) {
      if (String(normalized[j].sourceScheduleId || "none") === scheduleKey) {
        prevSameSchedule = normalized[j];
        break;
      }
    }

    const rawIndent = Math.max(0, row.indentLevel);
    const indent = preserveIndent
      ? rawIndent
      : prevSameSchedule
        ? Math.min(rawIndent, prevSameSchedule.indentLevel + 1)
        : 0;

    if (!rowHasEntry(row)) {
      normalized.push({
        ...row,
        indentLevel: indent,
        parentActivityId: null,
        wbsCode: "",
      });
      return;
    }

    const counters = countersBySchedule[scheduleKey];
    if (preserveIndent) {
      for (let level = 0; level < indent; level += 1) {
        if (!Number.isFinite(counters[level]) || Number(counters[level]) <= 0) {
          counters[level] = 1;
        }
      }
    }
    counters[indent] = (counters[indent] || 0) + 1;
    counters.length = indent + 1;

    let parentActivityId: number | null = null;
    if (indent > 0) {
      for (let j = normalized.length - 1; j >= 0; j -= 1) {
        const prev = normalized[j];
        if (String(prev.sourceScheduleId || "none") !== scheduleKey) continue;
        if (!rowHasEntry(prev)) continue;
        if (prev.indentLevel < indent) {
          parentActivityId = prev.activityId;
          break;
        }
      }
    }

    const wbsCode = counters
      .slice(0, indent + 1)
      .map((part) => (Number.isFinite(part) && Number(part) > 0 ? Number(part) : 1))
      .join(".");

    normalized.push({
      ...row,
      indentLevel: indent,
      parentActivityId,
      wbsCode,
    });
  });

  const childCountByActivityId = new Map<number, number>();
  normalized.forEach((row) => {
    if (!rowHasEntry(row) || row.parentActivityId == null) return;
    childCountByActivityId.set(
      row.parentActivityId,
      (childCountByActivityId.get(row.parentActivityId) || 0) + 1
    );
  });

  return normalized.map((row) => {
    if (!rowHasEntry(row)) return row;
    const childCount = childCountByActivityId.get(row.activityId) || 0;
    if (childCount > 0) {
      return { ...row, activityType: "SUMMARY" };
    }
    if (row.activityType === "SUMMARY") {
      return { ...row, activityType: "TASK" };
    }
    return row;
  });
}

function applySummaryRollups(rows: PlannerRow[], calendar: ProjectCalendar | null): PlannerRow[] {
  const next = rows.map((x) => ({ ...x }));
  for (let i = next.length - 1; i >= 0; i -= 1) {
    const row = next[i];
    if (row.activityType !== "SUMMARY") continue;

    const children: PlannerRow[] = [];
    for (let j = i + 1; j < next.length; j += 1) {
      if (next[j].indentLevel <= row.indentLevel) break;
      if (next[j].indentLevel === row.indentLevel + 1 && rowHasEntry(next[j])) {
        children.push(next[j]);
      }
    }
    if (!children.length) continue;

    const firstChildWithStart = children.find((x) => String(x.startDate || "").trim());
    const lastChildWithFinish = [...children]
      .reverse()
      .find((x) => String(x.finishDate || "").trim());
    row.startDate = firstChildWithStart ? firstChildWithStart.startDate : "";
    row.finishDate = lastChildWithFinish ? lastChildWithFinish.finishDate : row.startDate;
    const summaryDuration = computeDurationByCalendar(row.startDate, row.finishDate, calendar);
    row.durationDays = summaryDuration || 0;
    row.percentComplete = Math.round(
      children.reduce((sum, item) => sum + Number(item.percentComplete || 0), 0) / children.length
    );
    const allCompleted = children.every(
      (item) => String(item.status || "").toUpperCase() === "COMPLETED"
    );
    row.status = allCompleted ? "Completed" : "Active";
  }
  return next;
}

function buildDependencyErrors(rows: PlannerRow[]) {
  const errors: Record<string, string> = {};
  const ids = rows.map((x) => x.activityId);
  const resolvePredId = createDependencyResolver(rows);
  const edges: Array<[number, number]> = [];

  rows.forEach((row) => {
    const parsed = parseDependencies(row.predecessors);
    const messages: string[] = [];
    if (parsed.invalidTokens.length) messages.push("Invalid predecessor format");
    parsed.dependencies.forEach((dep) => {
      const predId = resolvePredId(dep.predRef);
      if (!predId) {
        messages.push(`Unknown predecessor ${dep.predRef}`);
        return;
      }
      if (predId === row.activityId) messages.push("Self dependency");
      if (predId !== row.activityId) {
        edges.push([predId, row.activityId]);
      }
    });
    if (messages.length) errors[row.uid] = messages.join(", ");
  });

  const cycleNodes = detectCycleNodes(ids, edges);
  if (cycleNodes.size) {
    rows.forEach((row) => {
      if (cycleNodes.has(row.activityId)) {
        errors[row.uid] = errors[row.uid]
          ? `${errors[row.uid]}, Circular dependency`
          : "Circular dependency";
      }
    });
  }
  return errors;
}

function formatScheduleStatus(baseline?: PMOBaselineRow | null, isFinalApproved = false): string {
  if (!baseline) return "Not selected";
  const prefix = `B${baseline.baseline_no}`;
  const status = String(baseline.status || "DRAFT").toUpperCase();
  const revokeRequestStatus = String(baseline.revoke_request_status || "NONE").toUpperCase();
  const rowCount = Number(baseline.row_count ?? -1);
  if (status === "DRAFT" && !baseline.revoked_at && rowCount === 0) {
    return "CREATE NEW";
  }
  if (status === "APPROVED" && revokeRequestStatus === "PENDING") {
    return `${prefix} - REVOKE REQUESTED`;
  }
  if (status === "APPROVED" && isFinalApproved) return `${prefix} - APPROVED`;
  if (status === "APPROVED") return `${prefix} - PRE-APPROVED`;
  if (status === "SUBMITTED") return `${prefix} - SUBMITTED`;
  if (status === "DRAFT" && baseline.revoked_at) return `${prefix} - REVOKED`;
  return `${prefix} - DRAFT`;
}

function formatBaselineOptionLabel(baseline: PMOBaselineRow, isFinalApproved = false): string {
  const status = formatScheduleStatus(baseline, isFinalApproved);
  if (status === "CREATE NEW") return `B${baseline.baseline_no} - CREATE NEW`;
  return status;
}

const VIEW_BUILDER_COLS = [
  { key: "dur", label: "Duration" },
  { key: "start", label: "Start Date" },
  { key: "finish", label: "Finish Date" },
  { key: "predecessors", label: "Predecessors" },
  { key: "unit", label: "Unit" },
  { key: "qty", label: "Project Qty" },
] as const;

const VIEW_BUILDER_COL_RATIOS: Record<string, number> = {
  dur: 0.08, start: 0.11, finish: 0.11, predecessors: 0.12, unit: 0.10, qty: 0.10, cost: 0.07,
};

export default function PMOScheduleBuilderPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [backendSchedules, setBackendSchedules] = useState<ScheduleRow[]>([]);
  const [rows, setRows] = useState<PlannerRow[]>([]);
  const [selectedRowUid, setSelectedRowUid] = useState<string | null>(null);
  const [collapsedRowUids, setCollapsedRowUids] = useState<string[]>([]);
  const [selectedScheduleType, setSelectedScheduleType] = useState<ScheduleType>("MILESTONE");
  const [baselines, setBaselines] = useState<PMOBaselineRow[]>([]);
  const [selectedBaselineId, setSelectedBaselineId] = useState<number | null>(null);
  const [selectedNextBaselineNo, setSelectedNextBaselineNo] = useState<number | null>(null);
  const [openedBaseline, setOpenedBaseline] = useState<PMOBaselineRow | null>(null);
  const [builderVisible, setBuilderVisible] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submittingForApproval, setSubmittingForApproval] = useState(false);
  const [openingBaseline, setOpeningBaseline] = useState(false);
  const [requestingRevoke, setRequestingRevoke] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeNote, setRevokeNote] = useState("");
  const [approvedImplBaselineIds, setApprovedImplBaselineIds] = useState<Set<number>>(new Set());
  const [isViewMode, setIsViewMode] = useState(false);
  const [viewRows, setViewRows] = useState<PlannerRow[]>([]);
  const [viewLevelFilter, setViewLevelFilter] = useState<"ALL" | "LEVEL2" | "LEVEL3">("ALL");
  const [viewingBaseline, setViewingBaseline] = useState<PMOBaselineRow | null>(null);
  const [openingView, setOpeningView] = useState(false);
  const [viewHiddenCols, setViewHiddenCols] = useState<Set<string>>(new Set());
  const [viewColPickerOpen, setViewColPickerOpen] = useState(false);
  const [showRevisionLog, setShowRevisionLog] = useState(false);
  const [revisionLinesLoading, setRevisionLinesLoading] = useState(false);
  const [revisionLines, setRevisionLines] = useState<PMORevisionChangeLineRow[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileSnapshot | null>(null);
  const [exportMode, setExportMode] = useState<ExportMode | null>(null);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);
  const [exportingSchedule, setExportingSchedule] = useState(false);

  const [calendars, setCalendars] = useState<ProjectCalendar[]>([]);
  const [assignedCalendarId, setAssignedCalendar] = useState<string>("");
  const [newCalendarName, setNewCalendarName] = useState("");
  const [newCalendarWorkdays, setNewCalendarWorkdays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [pendingHolidayDate, setPendingHolidayDate] = useState("");
  const [pendingEventDetail, setPendingEventDetail] = useState("");
  const [, setPendingHolidayDates] = useState<string[]>([]);
  const [pendingCalendarEvents, setPendingCalendarEvents] = useState<
    Array<{ id: string; date: string; detail: string }>
  >([]);
  const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null);
  const [calendarModalMode, setCalendarModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [applyingCalendar, setApplyingCalendar] = useState(false);
  const [evmCostModalOpen, setEvmCostModalOpen] = useState(false);
  const [evmCostRowUid, setEvmCostRowUid] = useState<string | null>(null);
  const [evmMaterialLinesDraft, setEvmMaterialLinesDraft] = useState<EVMMaterialCostLine[]>([]);
  const [evmLabourLinesDraft, setEvmLabourLinesDraft] = useState<EVMLabourCostLine[]>([]);
  const [evmMachineryLinesDraft, setEvmMachineryLinesDraft] = useState<EVMMachineryCostLine[]>([]);
  const [unitManagerOpen, setUnitManagerOpen] = useState(false);
  const [portalUnitStore, setPortalUnitStore] = useState<PortalUnitStore>(() =>
    readPortalUnitStore()
  );
  const [unitSelectionDraft, setUnitSelectionDraft] = useState<string[]>([]);
  const [unitCustomUnitsDraft, setUnitCustomUnitsDraft] = useState<PortalUnitOption[]>([]);
  const [newUnitLabelDraft, setNewUnitLabelDraft] = useState("");
  const [unitManagerError, setUnitManagerError] = useState("");
  const [parsingMspFile, setParsingMspFile] = useState(false);
  const [gridPageSize, setGridPageSize] = useState<number>(100);
  const [gridPage, setGridPage] = useState<number>(1);
  const [columnWidths, setColumnWidths] =
    useState<Record<ScheduleColumnKey, number>>(DEFAULT_COLUMN_WIDTHS);
  const resizeStateRef = useRef<{
    columnKey: ScheduleColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);
  const mspFileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedBaseline = useMemo(
    () => baselines.find((x) => x.id === selectedBaselineId) || null,
    [baselines, selectedBaselineId]
  );
  const selectedSchedule = useMemo(
    () => backendSchedules.find((x) => x.id === selectedScheduleId) || null,
    [backendSchedules, selectedScheduleId]
  );
  const selectedProject = useMemo(
    () => projects.find((x) => x.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );
  const portalUnitCatalog = useMemo(
    () => getPortalUnitCatalog(portalUnitStore),
    [portalUnitStore]
  );
  const activePortalUnits = useMemo(
    () => getActivePortalUnits(portalUnitStore),
    [portalUnitStore]
  );
  const unitManagerCatalog = useMemo(
    () => dedupePortalUnits([...listBuiltInPortalUnits(), ...unitCustomUnitsDraft]),
    [unitCustomUnitsDraft]
  );
  const portalUnitsByDomain = useMemo(() => {
    const grouped = new Map<string, PortalUnitOption[]>();
    const sorted = [...unitManagerCatalog].sort((a, b) => {
      if (a.domain !== b.domain) {
        const aIdx = UNIT_DOMAIN_ORDER.indexOf(a.domain);
        const bIdx = UNIT_DOMAIN_ORDER.indexOf(b.domain);
        return (aIdx < 0 ? UNIT_DOMAIN_ORDER.length : aIdx) - (bIdx < 0 ? UNIT_DOMAIN_ORDER.length : bIdx);
      }
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return a.label.localeCompare(b.label);
    });
    sorted.forEach((unit) => {
      const key = `${unit.domain}::${unit.group}`;
      const rows = grouped.get(key) || [];
      rows.push(unit);
      grouped.set(key, rows);
    });
    return Array.from(grouped.entries()).map(([key, units]) => {
      const [domain, group] = key.split("::");
      return { domain, group, units };
    });
  }, [unitManagerCatalog]);

  const sortedBaselines = useMemo(
    () => [...baselines].sort((a, b) => Number(a.baseline_no || 0) - Number(b.baseline_no || 0)),
    [baselines]
  );
  const latestBaseline = useMemo(
    () => (sortedBaselines.length ? sortedBaselines[sortedBaselines.length - 1] : null),
    [sortedBaselines]
  );
  const isNextBaselineSelected = selectedBaselineId == null && selectedNextBaselineNo != null;
  const nextCreatableBaselineNo = useMemo(() => {
    if (!selectedProjectId || !selectedScheduleId) return null;
    if (!latestBaseline) return 1;
    const latestStatus = String(latestBaseline.status || "").toUpperCase();
    if (latestStatus === "APPROVED" && latestBaseline.baseline_no < MAX_BASELINE_NUMBER) {
      return latestBaseline.baseline_no + 1;
    }
    return null;
  }, [selectedProjectId, selectedScheduleId, latestBaseline]);

  const baselineOptions = useMemo(() => {
    const byNo = new Map<number, PMOBaselineRow>();
    sortedBaselines.forEach((row) => {
      const baselineNo = Number(row.baseline_no || 0);
      if (baselineNo >= 1 && baselineNo <= MAX_BASELINE_NUMBER) byNo.set(baselineNo, row);
    });
    return Array.from({ length: MAX_BASELINE_NUMBER }, (_, idx) => {
      const baselineNo = idx + 1;
      const existingRow = byNo.get(baselineNo);
      if (existingRow) {
        return {
          baselineNo,
          value: `id:${existingRow.id}`,
          label: formatBaselineOptionLabel(existingRow, approvedImplBaselineIds.has(existingRow.id)),
          disabled: false,
          mode: "existing" as const,
          baselineId: existingRow.id,
        };
      }
      if (nextCreatableBaselineNo === baselineNo) {
        return {
          baselineNo,
          value: `next:${baselineNo}`,
          label: `B${baselineNo} - CREATE NEW`,
          disabled: false,
          mode: "create" as const,
          baselineId: null,
        };
      }
      return {
        baselineNo,
        value: `locked:${baselineNo}`,
        label: `B${baselineNo} - LOCKED`,
        disabled: true,
        mode: "locked" as const,
        baselineId: null,
      };
    });
  }, [sortedBaselines, nextCreatableBaselineNo]);

  const selectedBaselineValue = useMemo(() => {
    if (selectedBaselineId) return `id:${selectedBaselineId}`;
    if (selectedNextBaselineNo != null) return `next:${selectedNextBaselineNo}`;
    return "";
  }, [selectedBaselineId, selectedNextBaselineNo]);

  const statusBaseline = openedBaseline || selectedBaseline;
  const scheduleLifecycleStatus = useMemo(() => {
    if (isNextBaselineSelected) return "CREATE_NEW" as const;
    if (!statusBaseline && sortedBaselines.length === 0 && selectedProjectId && selectedScheduleId) {
      return "CREATE_NEW" as const;
    }
    if (!statusBaseline) return "CREATE_NEW" as const;

    const rawStatus = String(statusBaseline.status || "").toUpperCase();
    if (rawStatus === "APPROVED" || rawStatus === "SUBMITTED") return "APPROVED" as const;
    if (rawStatus === "DRAFT" && !!statusBaseline.revoked_at) return "REVOKED" as const;
    if (rawStatus === "DRAFT" && Number(statusBaseline.row_count ?? 0) === 0) {
      return "CREATE_NEW" as const;
    }
    return "UNDER_DEVELOPMENT" as const;
  }, [isNextBaselineSelected, statusBaseline, sortedBaselines.length, selectedProjectId, selectedScheduleId]);

  const scheduleStatusLabel = useMemo(() => {
    if (scheduleLifecycleStatus === "CREATE_NEW") return "Create New";
    if (scheduleLifecycleStatus === "UNDER_DEVELOPMENT") return "Under Development";
    if (scheduleLifecycleStatus === "REVOKED") return "Revoked";
    const isFinal = !!statusBaseline && approvedImplBaselineIds.has(statusBaseline.id);
    return isFinal ? "Approved (Final)" : "Pre-Approved";
  }, [scheduleLifecycleStatus, statusBaseline, approvedImplBaselineIds]);

  const isApprovedStatus = scheduleLifecycleStatus === "APPROVED";
  const isRevokedSchedule = scheduleLifecycleStatus === "REVOKED";
  const isCreateNewStatus = scheduleLifecycleStatus === "CREATE_NEW";
  const isUnderDevelopmentStatus = scheduleLifecycleStatus === "UNDER_DEVELOPMENT";
  const canEditFromStatus = isUnderDevelopmentStatus || isRevokedSchedule;
  const canRequestRevoke =
    !!statusBaseline &&
    !isNextBaselineSelected &&
    isApprovedStatus &&
    String(statusBaseline.revoke_request_status || "NONE").toUpperCase() !== "PENDING";
  const canBuildScheduleAction = Boolean(
    selectedProjectId && selectedScheduleId && !openingBaseline && isCreateNewStatus
  );
  const canEditScheduleAction = Boolean(selectedBaselineId && !openingBaseline && canEditFromStatus);
  const canRevokeScheduleAction = Boolean(canRequestRevoke && !requestingRevoke);
  const canShowRevisionLogAction = Boolean(
    selectedBaselineId && !revisionLinesLoading && (isRevokedSchedule || isApprovedStatus)
  );
  const canViewScheduleAction = Boolean(
    selectedBaselineId && isApprovedStatus && !openingBaseline && !openingView
  );

  const visibleRows = useMemo(() => {
    if (!selectedScheduleId) return [];
    return rows.filter((row) => row.sourceScheduleId === selectedScheduleId);
  }, [rows, selectedScheduleId]);

  const filteredViewRows = useMemo(() => {
    if (viewLevelFilter === "ALL") return viewRows;
    const maxLevel = viewLevelFilter === "LEVEL2" ? 1 : 2;
    return viewRows.filter((row) => row.indentLevel <= maxLevel);
  }, [viewRows, viewLevelFilter]);

  const viewIncludesCost =
    selectedScheduleType === "EVM" || viewRows.some((r) => r.scheduleType === "EVM");

  const canExportSchedule =
    (builderVisible && visibleRows.length > 0) || (isViewMode && filteredViewRows.length > 0);
  const selectedVisibleRow = useMemo(
    () => visibleRows.find((row) => row.uid === selectedRowUid) || null,
    [visibleRows, selectedRowUid]
  );
  const collapsibleRowMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (let i = 0; i < visibleRows.length; i += 1) {
      const hasChildren =
        i + 1 < visibleRows.length && visibleRows[i + 1].indentLevel > visibleRows[i].indentLevel;
      map.set(visibleRows[i].uid, hasChildren);
    }
    return map;
  }, [visibleRows]);
  const collapsedRowUidSet = useMemo(() => new Set(collapsedRowUids), [collapsedRowUids]);
  const gridRows = useMemo(() => {
    if (!visibleRows.length) return [];
    const next: PlannerRow[] = [];
    let hiddenAtIndent: number | null = null;
    for (let i = 0; i < visibleRows.length; i += 1) {
      const row = visibleRows[i];
      if (hiddenAtIndent != null) {
        if (row.indentLevel > hiddenAtIndent) continue;
        hiddenAtIndent = null;
      }
      next.push(row);
      const hasChildren = collapsibleRowMap.get(row.uid) || false;
      if (hasChildren && collapsedRowUidSet.has(row.uid)) {
        hiddenAtIndent = row.indentLevel;
      }
    }
    return next;
  }, [visibleRows, collapsibleRowMap, collapsedRowUidSet]);
  const totalGridPages = useMemo(
    () => Math.max(1, Math.ceil(gridRows.length / gridPageSize)),
    [gridRows.length, gridPageSize]
  );
  const currentGridPage = Math.min(Math.max(gridPage, 1), totalGridPages);
  const gridPageStartIndex = (currentGridPage - 1) * gridPageSize;
  const pagedGridRows = useMemo(
    () => gridRows.slice(gridPageStartIndex, gridPageStartIndex + gridPageSize),
    [gridRows, gridPageStartIndex, gridPageSize]
  );
  const pagedRowStart = gridRows.length ? gridPageStartIndex + 1 : 0;
  const pagedRowEnd = gridRows.length ? gridPageStartIndex + pagedGridRows.length : 0;

  const isBuilderReadOnly = !openedBaseline || String(openedBaseline.status).toUpperCase() !== "DRAFT";

  const selectedCalendar = useMemo(
    () => calendars.find((x) => x.id === assignedCalendarId) || null,
    [calendars, assignedCalendarId]
  );
  const evmCostTargetRow = useMemo(
    () => visibleRows.find((row) => row.uid === evmCostRowUid) || null,
    [visibleRows, evmCostRowUid]
  );
  const evmDraftMaterialSummary = useMemo(
    () => summarizeMaterialCosts(evmMaterialLinesDraft),
    [evmMaterialLinesDraft]
  );
  const evmDraftLabourSummary = useMemo(
    () => summarizeLabourCosts(evmLabourLinesDraft),
    [evmLabourLinesDraft]
  );
  const evmDraftMachinerySummary = useMemo(
    () => summarizeMachineryCosts(evmMachineryLinesDraft),
    [evmMachineryLinesDraft]
  );
  const evmDraftTotalGst = useMemo(
    () =>
      roundMoney(
        evmDraftMaterialSummary.totalGst +
          evmDraftLabourSummary.totalGst +
          evmDraftMachinerySummary.totalGst
      ),
    [evmDraftMaterialSummary, evmDraftLabourSummary, evmDraftMachinerySummary]
  );
  const evmDraftGrandTotal = useMemo(
    () =>
      roundMoney(
        evmDraftMaterialSummary.subtotalCost +
          evmDraftLabourSummary.subtotalCost +
          evmDraftMachinerySummary.subtotalCost
      ),
    [evmDraftMaterialSummary, evmDraftLabourSummary, evmDraftMachinerySummary]
  );
  const evmDraftActivityCostPerUnit = useMemo(() => evmDraftGrandTotal, [evmDraftGrandTotal]);
  const evmDraftActivityTotalCost = useMemo(() => {
    if (!evmCostTargetRow) return evmDraftActivityCostPerUnit;
    if (evmCostTargetRow.plannedQty == null) return evmDraftActivityCostPerUnit;
    return roundMoney(Number(evmCostTargetRow.plannedQty || 0) * evmDraftActivityCostPerUnit);
  }, [evmCostTargetRow, evmDraftActivityCostPerUnit]);
  const selectedBaselineNumber = useMemo(() => {
    if (openedBaseline?.baseline_no) return Number(openedBaseline.baseline_no);
    if (selectedBaseline?.baseline_no) return Number(selectedBaseline.baseline_no);
    if (selectedNextBaselineNo != null) return Number(selectedNextBaselineNo);
    return 1;
  }, [openedBaseline, selectedBaseline, selectedNextBaselineNo]);
  const selectedBaselineStartLabel = `B${selectedBaselineNumber}-Start`;
  const selectedBaselineFinishLabel = `B${selectedBaselineNumber}-Finish`;

  useEffect(() => {
    if (!selectedProjectId || !selectedScheduleId) return;
    const selectedExistingValid =
      selectedBaselineId != null &&
      baselineOptions.some((option) => option.value === `id:${selectedBaselineId}` && !option.disabled);
    const selectedCreateValid =
      selectedBaselineId == null &&
      selectedNextBaselineNo != null &&
      baselineOptions.some(
        (option) => option.value === `next:${selectedNextBaselineNo}` && !option.disabled
      );
    if (selectedExistingValid || selectedCreateValid) return;

    const fallbackExisting = [...baselineOptions]
      .reverse()
      .find((option) => option.mode === "existing" && !option.disabled);
    if (fallbackExisting && fallbackExisting.baselineId) {
      setSelectedBaselineId(fallbackExisting.baselineId);
      setSelectedNextBaselineNo(null);
      return;
    }
    const fallbackCreate = baselineOptions.find(
      (option) => option.mode === "create" && !option.disabled
    );
    if (fallbackCreate) {
      setSelectedBaselineId(null);
      setSelectedNextBaselineNo(fallbackCreate.baselineNo);
      return;
    }
    setSelectedBaselineId(null);
    setSelectedNextBaselineNo(null);
  }, [
    selectedProjectId,
    selectedScheduleId,
    selectedBaselineId,
    selectedNextBaselineNo,
    baselineOptions,
  ]);

  useEffect(() => {
    const existingCalendars = readCalendars();
    if (existingCalendars.length) {
      setCalendars(existingCalendars);
      return;
    }
    const defaultCalendar: ProjectCalendar = {
      id: "default_mon_sat",
      name: "Default Mon-Sat",
      workingDays: [1, 2, 3, 4, 5, 6],
      holidays: [],
      createdAt: new Date().toISOString(),
    };
    setCalendars([defaultCalendar]);
    saveCalendars([defaultCalendar]);
  }, []);

  useEffect(() => {
    setPortalUnitStore(readPortalUnitStore());
  }, []);

  useEffect(() => {
    if (!unitManagerOpen) return;
    setUnitSelectionDraft([...portalUnitStore.selectedUnitIds]);
    setUnitCustomUnitsDraft([...portalUnitStore.customUnits]);
    setNewUnitLabelDraft("");
    setUnitManagerError("");
  }, [unitManagerOpen, portalUnitStore]);

  useEffect(() => {
    void loadProjects();
    void loadCompanyProfile();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    const assigned = getAssignedCalendarId(selectedProjectId);
    if (assigned) setAssignedCalendar(assigned);
    else if (calendars[0]) {
      setAssignedCalendar(calendars[0].id);
      setAssignedCalendarId(selectedProjectId, calendars[0].id);
    }
    setBuilderVisible(false);
    setOpenedBaseline(null);
    setRows([]);
    setBaselines([]);
    setSelectedBaselineId(null);
    setSelectedNextBaselineNo(null);
    setShowRevisionLog(false);
    setRevisionLines([]);
    void loadRowsForProject(selectedProjectId);
  }, [selectedProjectId, calendars]);

  useEffect(() => {
    if (!selectedProjectId || !selectedScheduleId) {
      setBaselines([]);
      setSelectedBaselineId(null);
      setBuilderVisible(false);
      setOpenedBaseline(null);
      setRows([]);
      setSelectedNextBaselineNo(null);
      setGridPage(1);
      return;
    }
    setBuilderVisible(false);
    setOpenedBaseline(null);
    setRows([]);
    setSelectedNextBaselineNo(null);
    setGridPage(1);
    setShowRevisionLog(false);
    setRevisionLines([]);
    void loadBaselineList(selectedProjectId, selectedScheduleId);
  }, [selectedProjectId, selectedScheduleId]);

  useEffect(() => {
    if (!selectedProjectId || !selectedScheduleId) return;
    const assignedToSchedule = getAssignedScheduleCalendarId(selectedProjectId, selectedScheduleId);
    if (assignedToSchedule && calendars.some((cal) => cal.id === assignedToSchedule)) {
      setAssignedCalendar(assignedToSchedule);
      return;
    }
    const assignedToProject = getAssignedCalendarId(selectedProjectId);
    if (assignedToProject && calendars.some((cal) => cal.id === assignedToProject)) {
      setAssignedCalendar(assignedToProject);
      return;
    }
    if (calendars[0]) {
      setAssignedCalendar(calendars[0].id);
    }
  }, [selectedProjectId, selectedScheduleId, calendars]);

  useEffect(() => {
    setShowRevisionLog(false);
    setRevisionLines([]);
  }, [selectedBaselineId]);

  useEffect(() => {
    if (!selectedRowUid && visibleRows.length) setSelectedRowUid(visibleRows[0].uid);
    if (selectedRowUid && !visibleRows.some((row) => row.uid === selectedRowUid)) {
      setSelectedRowUid(visibleRows[0]?.uid || null);
    }
  }, [visibleRows, selectedRowUid]);

  useEffect(() => {
    const validUids = new Set(visibleRows.map((row) => row.uid));
    setCollapsedRowUids((prev) => {
      const filtered = prev.filter((uid) => validUids.has(uid));
      if (filtered.length === prev.length && filtered.every((uid, idx) => uid === prev[idx])) {
        return prev;
      }
      return filtered;
    });
  }, [visibleRows]);

  useEffect(() => {
    setGridPage((prev) => {
      const bounded = Math.min(Math.max(prev, 1), totalGridPages);
      return prev === bounded ? prev : bounded;
    });
  }, [totalGridPages]);

  useEffect(() => {
    if (!selectedRowUid) return;
    const selectedIndex = gridRows.findIndex((row) => row.uid === selectedRowUid);
    if (selectedIndex < 0) return;
    const targetPage = Math.floor(selectedIndex / gridPageSize) + 1;
    setGridPage((prev) => (prev === targetPage ? prev : targetPage));
  }, [selectedRowUid, gridRows, gridPageSize]);

  useEffect(() => {
    if (!builderVisible) return;
    const raf = window.requestAnimationFrame(() => {
      const nodes = document.querySelectorAll<HTMLTextAreaElement>(
        'textarea[data-activity-autosize="1"]'
      );
      nodes.forEach((node) => {
        node.style.height = "0px";
        node.style.height = `${Math.max(20, node.scrollHeight)}px`;
      });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [builderVisible, gridRows, columnWidths.activity]);

  async function loadProjects() {
    try {
      setLoadingProjects(true);
      setError("");
      const res = await getProjects();
      const list = res.rows || [];
      setProjects(list);
      if (list.length) setSelectedProjectId((prev) => prev || list[0].id);
    } catch (err: any) {
      setError(err?.message || "Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }

  async function loadCompanyProfile() {
    try {
      const data = await apiRequest<CompanyProfileSnapshot>("/company/profile");
      setCompanyProfile(data || null);
    } catch {
      setCompanyProfile(null);
    }
  }

  async function loadRowsForProject(
    projectId: number,
    preferredScheduleId?: number | null
  ) {
    try {
      setLoadingRows(true);
      setError("");
      const scheduleRes = await getSchedules(projectId);
      const scheduleRows = scheduleRes.rows || [];
      setBackendSchedules(scheduleRows);
      if (scheduleRows.length) {
        const preferred =
          scheduleRows.find((row) => row.id === preferredScheduleId) ||
          scheduleRows.find((row) => row.id === selectedScheduleId) || scheduleRows[0];
        setSelectedScheduleId(preferred.id);
      } else {
        setSelectedScheduleId(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load schedule data");
    } finally {
      setLoadingRows(false);
    }
  }

  async function loadBaselineList(projectId: number, scheduleId: number) {
    try {
      setError("");
      const [res, implRes] = await Promise.all([
        listScheduleBaselines(projectId, scheduleId),
        listScheduleImplementationRecords({
          project_id: projectId,
          schedule_id: String(scheduleId),
          status: "APPROVED",
        }).catch(() => ({ rows: [] as { baseline_id: number }[] })),
      ]);
      const approvedImplIds = new Set<number>(
        (implRes.rows || [])
          .map((r) => Number((r as any).baseline_id || 0))
          .filter((id) => id > 0)
      );
      setApprovedImplBaselineIds(approvedImplIds);
      const list = res.rows || [];
      setBaselines(list);
      if (list.length) {
        const sorted = [...list].sort(
          (a, b) => Number(a.baseline_no || 0) - Number(b.baseline_no || 0)
        );
        const latest = sorted[sorted.length - 1];
        const latestApproved =
          String(latest.status || "").toUpperCase() === "APPROVED" &&
          Number(latest.baseline_no || 0) < MAX_BASELINE_NUMBER;
        setSelectedNextBaselineNo((prev) => {
          if (prev == null) return null;
          if (sorted.some((row) => Number(row.baseline_no || 0) === prev)) return null;
          if (latestApproved && prev === Number(latest.baseline_no || 0) + 1) return prev;
          return null;
        });
        setSelectedBaselineId((prev) => {
          if (prev == null) return null;
          const exists = prev ? list.some((row) => row.id === prev) : false;
          return exists ? prev : list[list.length - 1].id;
        });
      } else {
        setSelectedBaselineId(null);
        setSelectedNextBaselineNo(1);
      }
    } catch (err: any) {
      setBaselines([]);
      setSelectedBaselineId(null);
      setSelectedNextBaselineNo(null);
      setError(err?.message || "Failed to load baselines");
    }
  }

  function persistRows(nextRows: PlannerRow[], preferredSelection?: string | null) {
    setRows(nextRows);
    if (preferredSelection !== undefined) {
      setSelectedRowUid(preferredSelection);
    }
  }

  function mergeVisibleRows(sourceRows: PlannerRow[], scopedRows: PlannerRow[]): PlannerRow[] {
    if (!selectedScheduleId) return sourceRows;
    const merged: PlannerRow[] = [];
    let inserted = false;
    sourceRows.forEach((row) => {
      if (row.sourceScheduleId === selectedScheduleId) {
        if (!inserted) {
          merged.push(...scopedRows);
          inserted = true;
        }
        return;
      }
      merged.push(row);
    });
    if (!inserted) merged.push(...scopedRows);
    return merged;
  }

  function updateVisibleRows(
    mutator: (draft: PlannerRow[]) => PlannerRow[],
    preferredSelection?: string | null
  ) {
    if (!selectedScheduleId) return;
    if (isBuilderReadOnly) {
      setError("Selected baseline is read-only.");
      return;
    }
    const normalized = rows.map((row) => normalizeRowByType({ ...row }, selectedCalendar));
    const scopedDraft = normalized.filter((row) => row.sourceScheduleId === selectedScheduleId);
    const mutatedScoped = mutator(scopedDraft);
    const structuredScoped = applySummaryRollups(recomputeHierarchy(mutatedScoped), selectedCalendar);
    const merged = mergeVisibleRows(normalized, structuredScoped).map((row) => ({
      ...row,
      successors: "",
    }));
    persistRows(merged, preferredSelection);
  }

  function openMspUploadPicker() {
    if (!builderVisible) {
      setError("Open Schedule Builder first.");
      return;
    }
    if (isBuilderReadOnly) {
      setError("Selected baseline is read-only.");
      return;
    }
    mspFileInputRef.current?.click();
  }

  function importParsedMspTasks(tasks: ParsedMspTask[], sourceFileName: string) {
    if (!selectedScheduleId) {
      setError("Select schedule first.");
      return;
    }
    if (isBuilderReadOnly) {
      setError("Selected baseline is read-only.");
      return;
    }
    if (!tasks.length) {
      setError("No MSP tasks available for import.");
      return;
    }

    // Keep the same visual row sequence as MSP (ID order) before assigning local row numbers.
    const orderedTasks = [...tasks]
      .map((task, index) => ({ task, originalIndex: index }))
      .sort((a, b) => {
        const aId = Number(a.task.mspId || 0);
        const bId = Number(b.task.mspId || 0);
        if (aId > 0 && bId > 0 && aId !== bId) return aId - bId;
        if (aId > 0 && bId <= 0) return -1;
        if (aId <= 0 && bId > 0) return 1;
        return a.originalIndex - b.originalIndex;
      })
      .map((row) => row.task);

    const importedRows: PlannerRow[] = orderedTasks.map((task, index) => {
      const activityNumber = index + 1;
      const startDate = task.startDate;
      const finishDate = task.finishDate;
      const computedDuration =
        startDate && finishDate
          ? computeDurationByCalendar(startDate, finishDate, selectedCalendar)
          : null;
      const durationDays = Math.max(1, task.durationDays ?? computedDuration ?? 1);

      return {
        ...createEmptyPlannerRow(
          activityNumber,
          Math.max(0, Number(task.outlineLevel || 1) - 1),
          "",
          selectedScheduleId,
          selectedScheduleType
        ),
        activityId: activityNumber,
        activityName: task.taskName,
        durationDays,
        startDate,
        finishDate,
        predecessors: "",
      };
    });

    const trailingRow = createEmptyPlannerRow(
      importedRows.length + 1,
      0,
      "",
      selectedScheduleId,
      selectedScheduleType
    );

    const normalizedAllRows = rows.map((row) => normalizeRowByType({ ...row }, selectedCalendar));
    const structuredImportedBase = applySummaryRollups(
      recomputeHierarchy(importedRows, { preserveIndent: true }),
      selectedCalendar
    );
    // Map predecessor links to the final schedule-builder row numbers (column No / activityId).
    const uidToBuilderRowNo = new Map<string, number>();
    orderedTasks.forEach((task, idx) => {
      uidToBuilderRowNo.set(task.uid, idx + 1);
    });
    const structuredImported = structuredImportedBase.map((row, idx) => {
      const task = orderedTasks[idx];
      if (!task) return row;
      const predecessors = (task.predecessorLinks || [])
        .map((link) => {
          const predNo = uidToBuilderRowNo.get(link.predUid);
          if (!predNo) return "";
          const lagText =
            link.lagDays !== 0
              ? `${link.lagDays > 0 ? "+" : "-"}${Math.abs(link.lagDays)}d`
              : "";
          return `${predNo}${link.relation}${lagText}`;
        })
        .filter(Boolean)
        .join(", ");
      return { ...row, predecessors };
    });
    const merged = mergeVisibleRows(normalizedAllRows, [...structuredImported, trailingRow]).map(
      (row) => ({
        ...row,
        successors: "",
      })
    );
    persistRows(merged, structuredImported[0]?.uid || trailingRow.uid);
    setNotice(
      `Imported ${structuredImported.length} MSP tasks from ${sourceFileName}. Predecessors were remapped to Schedule Builder row references.`
    );
    setError("");
  }

  async function handleMspFileSelection(event: any) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xml")) {
      setError(
        "Please upload Microsoft Project XML export (.xml). Direct .mpp upload is not supported in browser."
      );
      return;
    }

    try {
      setParsingMspFile(true);
      setError("");
      const xmlText = await file.text();
      const tasks = parseMspXmlTasks(xmlText);
      if (!tasks.length) {
        setError("No task rows found in MSP XML.");
        return;
      }
      importParsedMspTasks(tasks, file.name);
    } catch (err: any) {
      setError(err?.message || "Failed to parse MSP XML file.");
    } finally {
      setParsingMspFile(false);
    }
  }

  function toggleRowCollapse(rowUid: string) {
    if (!(collapsibleRowMap.get(rowUid) || false)) return;
    setCollapsedRowUids((prev) =>
      prev.includes(rowUid) ? prev.filter((uid) => uid !== rowUid) : [...prev, rowUid]
    );
  }

  function collapseAllRows() {
    const next = visibleRows
      .filter((row) => collapsibleRowMap.get(row.uid))
      .map((row) => row.uid);
    setCollapsedRowUids(next);
  }

  function expandAllRows() {
    setCollapsedRowUids([]);
  }

  function applyFormattingToSelectedRow(stylePatch: {
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic";
    fontColor?: string;
  }) {
    if (!selectedRowUid) {
      setError("Select an activity row first.");
      return;
    }
    updateVisibleRows((draft) => {
      const index = draft.findIndex((row) => row.uid === selectedRowUid);
      if (index < 0) return draft;
      draft[index] = {
        ...draft[index],
        ...(stylePatch.fontWeight ? { fontWeight: stylePatch.fontWeight } : {}),
        ...(stylePatch.fontStyle ? { fontStyle: stylePatch.fontStyle } : {}),
        ...(stylePatch.fontColor ? { fontColor: normalizeFontColor(stylePatch.fontColor) } : {}),
      };
      return draft;
    }, selectedRowUid);
  }

  function addRowRelative(referenceUid: string, position: "above" | "below") {
    const selectedIndex = visibleRows.findIndex((x) => x.uid === referenceUid);
    const index = selectedIndex >= 0 ? selectedIndex : visibleRows.length - 1;
    const anchor = visibleRows[index];
    const newRow = createEmptyPlannerRow(
      nextActivityId(rows),
      anchor.indentLevel,
      anchor.segment,
      selectedScheduleId,
      anchor.scheduleType || selectedScheduleType
    );
    updateVisibleRows((draft) => {
      const insertAt = position === "above" ? index : index + 1;
      draft.splice(insertAt, 0, newRow);
      return draft;
    }, newRow.uid);
  }

  function shiftIndentByUid(rowUid: string, delta: number) {
    const selectedIndex = visibleRows.findIndex((x) => x.uid === rowUid);
    if (selectedIndex < 0) return;
    const startLevel = visibleRows[selectedIndex].indentLevel;
    let endIndex = selectedIndex + 1;
    while (endIndex < visibleRows.length && visibleRows[endIndex].indentLevel > startLevel) {
      endIndex += 1;
    }
    updateVisibleRows((draft) => {
      if (delta > 0 && selectedIndex > 0) {
        const maxAllowed = draft[selectedIndex - 1].indentLevel + 1;
        const target = Math.min(draft[selectedIndex].indentLevel + delta, maxAllowed);
        const realDelta = target - draft[selectedIndex].indentLevel;
        for (let i = selectedIndex; i < endIndex; i += 1) {
          draft[i].indentLevel = draft[i].indentLevel + realDelta;
        }
      } else {
        for (let i = selectedIndex; i < endIndex; i += 1) {
          draft[i].indentLevel = Math.max(0, draft[i].indentLevel + delta);
        }
      }
      return draft;
    });
  }

  function removeRowByUid(rowUid: string) {
    const target = visibleRows.find((row) => row.uid === rowUid);
    if (!target) return;
    const activityLabel = String(target.wbsCode || target.activityName || target.activityId || "").trim();
    const confirmed = window.confirm(
      `Delete this schedule row (${activityLabel})? This action cannot be undone.`
    );
    if (!confirmed) return;

    const targetIndex = visibleRows.findIndex((row) => row.uid === rowUid);
    if (targetIndex < 0) return;
    const startLevel = visibleRows[targetIndex].indentLevel;
    let endIndex = targetIndex + 1;
    while (endIndex < visibleRows.length && visibleRows[endIndex].indentLevel > startLevel) {
      endIndex += 1;
    }

    updateVisibleRows((draft) => {
      draft.splice(targetIndex, endIndex - targetIndex);
      if (!draft.length) {
        draft.push(
          createEmptyPlannerRow(
            nextActivityId(rows),
            0,
            "",
            selectedScheduleId,
            selectedScheduleType
          )
        );
      }
      return draft;
    });
  }

  async function openBaselineForBuilder(baselineId: number, mode: "BUILD" | "EDIT") {
    if (!selectedScheduleId) return;
    try {
      setOpeningBaseline(true);
      setError("");
      const detail = await getBaselineDetail(baselineId);
      const baseline = detail.row;
      if (mode === "EDIT" && String(baseline.status).toUpperCase() !== "DRAFT") {
        setError("Selected baseline is locked. Ask Company Admin to revoke it for editing.");
        return;
      }
      const parsedRows = mapPayloadRowsToPlannerRows(detail.rows || [], selectedScheduleId);
      const detectedScheduleType: ScheduleType =
        parsedRows.find((row) => row.scheduleType === "EVM") ? "EVM" : selectedScheduleType;
      const seedRows =
        parsedRows.length > 0
          ? parsedRows.map((row) => ({ ...row, scheduleType: row.scheduleType || detectedScheduleType }))
          : Array.from({ length: 5 }, (_, idx) =>
              createEmptyPlannerRow(idx + 1, 0, "", selectedScheduleId, detectedScheduleType)
            );
      const normalizedRows = applySummaryRollups(recomputeHierarchy(seedRows), selectedCalendar);
      setRows(normalizedRows);
      setSelectedScheduleType(detectedScheduleType);
      setOpenedBaseline(baseline);
      setSelectedBaselineId(baseline.id);
      setBuilderVisible(true);
      setSelectedRowUid(normalizedRows[0]?.uid || null);
      setNotice(
        mode === "BUILD"
          ? `Baseline ${baseline.baseline_no} opened in builder.`
          : `Baseline ${baseline.baseline_no} opened for editing.`
      );
    } catch (err: any) {
      setError(err?.message || "Failed to open baseline");
    } finally {
      setOpeningBaseline(false);
    }
  }

  async function handleBuildSchedule() {
    if (!selectedProjectId || !selectedScheduleId) {
      setError("Select project and schedule first.");
      return;
    }
    if (!isCreateNewStatus) {
      setError("Build Schedule is available only for new schedule creation.");
      return;
    }
    if (isApprovedStatus) {
      setError("Approved schedules are locked. Send revoke request to Company Admin.");
      return;
    }
    try {
      setError("");
      const emptyDraftBaseline =
        selectedBaseline &&
        String(selectedBaseline.status || "").toUpperCase() === "DRAFT" &&
        !selectedBaseline.revoked_at &&
        Number(selectedBaseline.row_count ?? -1) === 0
          ? selectedBaseline
          : null;
      if (emptyDraftBaseline?.id) {
        await openBaselineForBuilder(emptyDraftBaseline.id, "BUILD");
        return;
      }

      // Re-check backend baselines to avoid creating duplicate B1 drafts.
      const latestBaselineRes = await listScheduleBaselines(selectedProjectId, selectedScheduleId);
      const latestRows = latestBaselineRes.rows || [];
      if (latestRows.length) {
        setBaselines(latestRows);
        const reusableDraft = [...latestRows]
          .sort((a, b) => Number(a.baseline_no || 0) - Number(b.baseline_no || 0))
          .find(
            (row) =>
              String(row.status || "").toUpperCase() === "DRAFT" &&
              !row.revoked_at &&
              Number(row.row_count ?? -1) === 0
          );
        if (reusableDraft?.id) {
          setSelectedBaselineId(reusableDraft.id);
          setSelectedNextBaselineNo(null);
          await openBaselineForBuilder(reusableDraft.id, "BUILD");
          return;
        }
      }

      const created = await createNextBaseline(selectedProjectId, selectedScheduleId);
      await loadBaselineList(selectedProjectId, selectedScheduleId);
      if (created.row?.id) {
        await openBaselineForBuilder(created.row.id, "BUILD");
      }
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.toLowerCase().includes("previous baseline is not approved")) {
        setError(
          "A draft baseline already exists for this schedule. Select that baseline and continue with Build or Edit."
        );
        if (selectedProjectId && selectedScheduleId) {
          await loadBaselineList(selectedProjectId, selectedScheduleId);
        }
        return;
      }
      setError(msg || "Unable to build next baseline.");
    }
  }

  async function handleEditSchedule() {
    if (!selectedBaselineId) {
      setError("Select baseline first.");
      return;
    }
    if (isCreateNewStatus) {
      setError("No saved draft found. Use Build Schedule to start.");
      return;
    }
    if (isApprovedStatus) {
      setError("Approved schedules are locked. Send revoke request to Company Admin.");
      return;
    }
    if (!canEditFromStatus) {
      setError("Edit Schedule is available only when status is Under Development or Revoked.");
      return;
    }
    await openBaselineForBuilder(selectedBaselineId, "EDIT");
  }

  async function handleRequestRevokeSchedule(note: string) {
    if (!selectedBaselineId) {
      setError("Select an approved baseline first.");
      return;
    }
    if (!isApprovedStatus) {
      setError("Revoke Schedule is available only when status is Approved.");
      return;
    }
    try {
      setRequestingRevoke(true);
      setError("");
      const resp = await requestBaselineRevoke(selectedBaselineId, { note: note.trim() });
      const updatedRow = resp.row;
      if (selectedProjectId && selectedScheduleId) {
        await loadBaselineList(selectedProjectId, selectedScheduleId);
      }
      if (openedBaseline && openedBaseline.id === updatedRow.id) {
        setOpenedBaseline(updatedRow);
      }
      setRevokeModalOpen(false);
      setRevokeNote("");
      setNotice(`Revoke request submitted to Company Admin for baseline B${updatedRow.baseline_no}.`);
    } catch (err: any) {
      setError(err?.message || "Failed to request schedule revoke");
    } finally {
      setRequestingRevoke(false);
    }
  }

  async function handleViewSchedule() {
    if (!selectedBaselineId || !selectedScheduleId) {
      setError("Select a baseline first.");
      return;
    }
    if (!isApprovedStatus) {
      setError("View Schedule is available only for Pre-Approved or Approved baselines.");
      return;
    }
    try {
      setOpeningView(true);
      setError("");
      const detail = await getBaselineDetail(selectedBaselineId);
      const parsedRows = mapPayloadRowsToPlannerRows(detail.rows || [], selectedScheduleId);
      const normalized = applySummaryRollups(recomputeHierarchy(parsedRows), selectedCalendar);
      setViewRows(normalized);
      setViewingBaseline(detail.row);
      setIsViewMode(true);
      setViewLevelFilter("ALL");
      setBuilderVisible(false);
      setOpenedBaseline(null);
      setNotice(`Viewing B${detail.row.baseline_no} in read-only mode.`);
    } catch (err: any) {
      setError(err?.message || "Failed to load schedule for viewing.");
    } finally {
      setOpeningView(false);
    }
  }

  async function handleToggleRevisionLog() {
    if (!selectedBaselineId) {
      setError("Select baseline first.");
      return;
    }
    if (!(isRevokedSchedule || isApprovedStatus)) {
      setError("Revision log is available only for Revoked or Approved schedules.");
      return;
    }
    if (showRevisionLog) {
      setShowRevisionLog(false);
      return;
    }
    try {
      setRevisionLinesLoading(true);
      setError("");
      const res = await listBaselineRevisionLines(selectedBaselineId);
      setRevisionLines(res.rows || []);
      setShowRevisionLog(true);
    } catch (err: any) {
      setError(err?.message || "Failed to load revision log");
    } finally {
      setRevisionLinesLoading(false);
    }
  }

  async function handleSaveDraft(): Promise<boolean> {
    if (!openedBaseline || !selectedProjectId || !selectedScheduleId) return false;
    if (String(openedBaseline.status).toUpperCase() !== "DRAFT") {
      setError("Only DRAFT baseline can be saved.");
      return false;
    }
    try {
      setSavingDraft(true);
      setError("");
      const payloadRows = visibleRows.map((row) => ({
        ...row,
        sourceScheduleId: selectedScheduleId,
      }));
      const saved = await saveBaselineDraft(openedBaseline.id, {
        title: openedBaseline.title,
        rows: payloadRows,
      });
      setOpenedBaseline(saved.row);
      await loadBaselineList(selectedProjectId, selectedScheduleId);
      setNotice(`Baseline B${saved.row.baseline_no} draft saved.`);
      return true;
    } catch (err: any) {
      setError(err?.message || "Failed to save baseline draft");
      return false;
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSubmitForApproval() {
    if (!openedBaseline || !selectedProjectId || !selectedScheduleId) return;
    if (String(openedBaseline.status).toUpperCase() !== "DRAFT") {
      setError("Only DRAFT baseline can be submitted.");
      return;
    }
    const confirmSubmit = window.confirm(
      "Once submitted for pre-approval, this schedule cannot be edited by Planning Team unless Company Admin revokes approval. Do you want to continue?"
    );
    if (!confirmSubmit) return;
    try {
      setSubmittingForApproval(true);
      const saved = await handleSaveDraft();
      if (!saved) return;
      const submitted = await submitBaselineForApproval(openedBaseline.id);
      setOpenedBaseline(submitted.row);
      await loadBaselineList(selectedProjectId, selectedScheduleId);
      setNotice(`Baseline B${submitted.row.baseline_no} submitted for pre-approval.`);
    } catch (err: any) {
      setError(err?.message || "Failed to submit baseline for pre-approval");
    } finally {
      setSubmittingForApproval(false);
    }
  }

  function handleExitBuilder() {
    const confirmed = window.confirm(
      "Save Before Exit. If you exit now, unsaved changes may be lost. Do you want to continue?"
    );
    if (!confirmed) return;
    setBuilderVisible(false);
    setOpenedBaseline(null);
    setRows([]);
    setSelectedRowUid(null);
    setShowRevisionLog(false);
    setRevisionLines([]);
    setNotice("Returned to schedule parameters.");
    setError("");
  }

  function openExportDialog(mode: ExportMode) {
    if (!builderVisible && !isViewMode) {
      setError("Open Schedule Builder or View Schedule first.");
      return;
    }
    const rowsToCheck = isViewMode ? filteredViewRows : visibleRows;
    if (!rowsToCheck.length) {
      setError("No schedule rows available for export.");
      return;
    }
    setExportMode(mode);
    setError("");
  }

  function closeExportDialog() {
    if (exportingSchedule) return;
    setExportMode(null);
  }

  async function printPdfBlob(blob: Blob): Promise<void> {
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error("Print is available only in browser.");
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const frame = document.createElement("iframe");
      let completed = false;

      const finish = (error?: Error) => {
        if (completed) return;
        completed = true;
        setTimeout(() => {
          URL.revokeObjectURL(url);
          frame.remove();
        }, 1200);
        if (error) reject(error);
        else resolve();
      };

      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "0";
      frame.style.opacity = "0";
      frame.setAttribute("aria-hidden", "true");

      frame.onload = () => {
        try {
          const frameWindow = frame.contentWindow;
          if (!frameWindow) {
            finish(new Error("Unable to open print document."));
            return;
          }
          frameWindow.focus();
          let handled = false;
          frameWindow.onafterprint = () => {
            handled = true;
            finish();
          };
          setTimeout(() => {
            try {
              frameWindow.print();
            } catch {
              finish(new Error("Unable to open printer dialog."));
            }
          }, 120);
          setTimeout(() => {
            if (!handled) finish();
          }, 4500);
        } catch {
          finish(new Error("Unable to prepare print preview."));
        }
      };

      frame.onerror = () => finish(new Error("Unable to load print preview."));
      frame.src = url;
      document.body.appendChild(frame);
    });
  }

  async function buildScheduleDocumentPdf(settings: ExportSettings, rowsOverride?: PlannerRow[], hiddenCols?: Set<string>) {
    const rowsToExport = rowsOverride ?? visibleRows;
    const includeCostColumn =
      selectedScheduleType === "EVM" || rowsToExport.some((row) => row.scheduleType === "EVM");
    const companyName = companyProfile?.company_name || "Company";
    const projectTitle =
      selectedProject?.project_name || selectedProject?.project_code || "Project";
    const projectLocation = selectedProject?.location || "";
    const scheduleTitle = selectedSchedule?.schedule_name || "Schedule";

    const marginTopPt = mmToPt(clamp(settings.marginTopMm, 4, 30));
    const marginRightPt = mmToPt(clamp(settings.marginRightMm, 4, 30));
    const marginBottomPt = mmToPt(clamp(settings.marginBottomMm, 4, 30));
    const marginLeftPt = mmToPt(clamp(settings.marginLeftMm, 4, 30));

    const doc = new jsPDF({
      orientation: settings.orientation,
      unit: "pt",
      format: settings.pageSize.toLowerCase(),
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - marginLeftPt - marginRightPt;
    const firstHeaderHeight = 78;
    const continuationHeaderHeight = 24;

    const logoSource = toAbsoluteAssetUrl(companyProfile?.logo_url || "");
    const logoDataUrl = await imageToDataUrl(logoSource);

    const hasChildrenByUid = new Map<string, boolean>();
    rowsToExport.forEach((row, index) => {
      const next = rowsToExport[index + 1];
      hasChildrenByUid.set(row.uid, !!next && next.indentLevel > row.indentLevel);
    });

    const optionalCols = [
      { key: "dur",          head: "Duration",                    cell: (r: PlannerRow) => String(r.durationDays ?? "") },
      { key: "start",        head: selectedBaselineStartLabel,     cell: (r: PlannerRow) => toDisplayDate(r.startDate) },
      { key: "finish",       head: selectedBaselineFinishLabel,    cell: (r: PlannerRow) => toDisplayDate(r.finishDate) },
      { key: "predecessors", head: "Predecessors",                 cell: (r: PlannerRow) => r.predecessors || "" },
      { key: "unit",         head: "Unit",                         cell: (r: PlannerRow) => r.unit || "" },
      { key: "qty",          head: "Project Qty",                  cell: (r: PlannerRow) => r.plannedQty == null ? "" : String(r.plannedQty) },
      ...(includeCostColumn ? [{ key: "cost", head: "Cost",        cell: (r: PlannerRow) => `INR ${moneyDisplay(evmTotalCost(r))}` }] : []),
    ];
    const visOptCols = optionalCols.filter((c) => !hiddenCols?.has(c.key));
    const sumOptRatios = visOptCols.reduce((s, c) => s + (VIEW_BUILDER_COL_RATIOS[c.key] ?? 0.08), 0);
    const activityRatio = Math.max(0.22, 1 - 0.05 - sumOptRatios);

    const tableHead = [["No", "Activity", ...visOptCols.map((c) => c.head)]];

    const bodyRows = rowsToExport.map((row, index) => {
      const rowActivity = `${"  ".repeat(Math.max(0, row.indentLevel))}${row.wbsCode ? `${row.wbsCode} ` : ""}${row.activityName || "-"}`;
      return {
        uid: row.uid,
        indentLevel: row.indentLevel,
        isParent: hasChildrenByUid.get(row.uid) || false,
        fontWeight: row.fontWeight || "normal",
        fontStyle: row.fontStyle || "normal",
        fontColor: normalizeFontColor(row.fontColor),
        cells: [String(index + 1), rowActivity, ...visOptCols.map((c) => c.cell(row))],
      };
    });

    const widthRatios = [0.05, activityRatio, ...visOptCols.map((c) => VIEW_BUILDER_COL_RATIOS[c.key] ?? 0.08)];
    const columnStyles = widthRatios.reduce<Record<number, { cellWidth: number }>>(
      (acc, ratio, idx) => {
        acc[idx] = { cellWidth: Math.max(38, usableWidth * ratio) };
        return acc;
      },
      {}
    );

    autoTable(doc, {
      head: tableHead,
      body: bodyRows.map((row) => row.cells),
      startY: marginTopPt + firstHeaderHeight,
      margin: {
        top: marginTopPt + continuationHeaderHeight,
        right: marginRightPt,
        bottom: marginBottomPt,
        left: marginLeftPt,
      },
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        lineColor: [216, 194, 176],
        lineWidth: 0.35,
        textColor: [78, 52, 46],
        overflow: "linebreak",
        valign: "middle",
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [109, 75, 55],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
      },
      columnStyles,
      didParseCell: (hook) => {
        if (hook.section !== "body") return;
        const source = bodyRows[hook.row.index];
        if (!source) return;
        const [r, g, b] = rgbFromHex(source.fontColor);
        hook.cell.styles.textColor = [r, g, b];
        if (hook.column.index === 1) {
          const forceBold = source.isParent || source.fontWeight === "bold";
          hook.cell.styles.fontStyle = forceBold
            ? "bold"
            : source.fontStyle === "italic"
              ? "italic"
              : "normal";
          hook.cell.styles.fontSize = Math.max(
            6.5,
            8.5 - Math.min(source.indentLevel, 4) * 0.35
          );
        } else {
          hook.cell.styles.fontStyle = source.fontStyle === "italic" ? "italic" : "normal";
        }
      },
      didDrawPage: (hook) => {
        const currentPage = hook.pageNumber;
        doc.setTextColor(78, 52, 46);

        if (currentPage === 1) {
          const logoSize = logoDataUrl ? 28 : 0;
          const headerTop = marginTopPt + 2;
          const textX = marginLeftPt + (logoDataUrl ? logoSize + 8 : 0);

          if (logoDataUrl) {
            doc.addImage(logoDataUrl, "PNG", marginLeftPt, headerTop, logoSize, logoSize);
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          doc.text(companyName, textX, headerTop + 12);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.text(projectTitle, marginLeftPt, headerTop + 36);

          if (projectLocation) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(projectLocation, marginLeftPt, headerTop + 49);
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.text(scheduleTitle, marginLeftPt, headerTop + (projectLocation ? 63 : 53));
          doc.setDrawColor(185, 152, 129);
          doc.setLineWidth(0.6);
          doc.line(
            marginLeftPt,
            marginTopPt + firstHeaderHeight - 8,
            pageWidth - marginRightPt,
            marginTopPt + firstHeaderHeight - 8
          );
        } else {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          const continuationTitle = fitSingleLineText(
            doc,
            `${projectTitle} | ${scheduleTitle}`,
            usableWidth
          );
          doc.text(continuationTitle, marginLeftPt, marginTopPt + 9);
          doc.setDrawColor(185, 152, 129);
          doc.setLineWidth(0.4);
          doc.line(
            marginLeftPt,
            marginTopPt + 13,
            pageWidth - marginRightPt,
            marginTopPt + 13
          );
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Page ${currentPage}`, pageWidth - marginRightPt, pageHeight - 8, {
          align: "right",
        });
      },
    });

    return doc;
  }

  async function runScheduleExport() {
    if (!exportMode) return;
    try {
      setExportingSchedule(true);
      setError("");
      const doc = await buildScheduleDocumentPdf(
        exportSettings,
        isViewMode ? filteredViewRows : undefined,
        isViewMode ? viewHiddenCols : undefined
      );
      const fileName = [
        safeSlug(selectedProject?.project_name || selectedProject?.project_code || "project"),
        safeSlug(selectedSchedule?.schedule_name || "schedule"),
      ]
        .filter(Boolean)
        .join("_");

      if (exportMode === "PDF") {
        doc.save(`${fileName || "schedule"}.pdf`);
        setNotice("Schedule PDF saved.");
        setExportMode(null);
        return;
      }

      const blob = doc.output("blob");
      await printPdfBlob(blob);
      setNotice(
        "Print dialog opened for schedule document. Choose your printer in system dialog."
      );
      setExportMode(null);
    } catch (err: any) {
      setError(err?.message || "Failed to export schedule.");
    } finally {
      setExportingSchedule(false);
    }
  }

  function updateField(rowUid: string, field: string, value: string) {
    updateVisibleRows((draft) => {
      const index = draft.findIndex((x) => x.uid === rowUid);
      if (index < 0) return draft;
      const row = { ...draft[index] };
      row.scheduleType = row.scheduleType || selectedScheduleType;

      if (field === "activityName") row.activityName = value;
      if (field === "segment") row.segment = value;
      if (field === "tradeCategory") row.tradeCategory = value;
      if (field === "unit") row.unit = value;
      if (field === "plannedQty") {
        const parsed = Number(value);
        row.plannedQty = Number.isFinite(parsed) ? parsed : null;
        if (row.evmActivityCostPerUnit != null) {
          if (row.plannedQty == null) {
            row.evmActivityTotalCost = row.evmActivityCostPerUnit;
          } else {
            row.evmActivityTotalCost = roundMoney(
              Number(row.plannedQty || 0) * Number(row.evmActivityCostPerUnit || 0)
            );
          }
        }
      }
      if (field === "durationDays") {
        const parsed = Math.round(Number(value));
        row.durationDays = Number.isFinite(parsed) ? Math.max(0, parsed) : row.durationDays;
        if (row.activityType !== "MILESTONE" && row.startDate) {
          row.finishDate = computeFinishByCalendar(row.startDate, Math.max(1, row.durationDays), selectedCalendar);
        }
      }
      if (field === "startDate") {
        row.startDate = value;
        if (row.activityType === "MILESTONE") row.finishDate = value;
        else if (value) row.finishDate = computeFinishByCalendar(value, Math.max(1, row.durationDays), selectedCalendar);
      }
      if (field === "finishDate") {
        row.finishDate = value;
        if (row.activityType === "MILESTONE") row.startDate = value;
        else if (row.startDate && value) {
          const d = computeDurationByCalendar(row.startDate, value, selectedCalendar);
          if (d != null) row.durationDays = Math.max(1, d);
        }
      }
      if (field === "predecessors") row.predecessors = value;
      if (field === "status") row.status = value;
      if (field === "percentComplete") {
        row.percentComplete = clamp(Math.round(Number(value) || 0), 0, 100);
      }
      if (field === "baseline1Start") row.baseline1Start = value;
      if (field === "baseline1Finish") row.baseline1Finish = value;
      if (field === "baseline1Duration") row.baseline1Duration = Math.max(0, Math.round(Number(value) || 0));
      if (field === "baseline2Start") row.baseline2Start = value;
      if (field === "baseline2Finish") row.baseline2Finish = value;
      if (field === "baseline2Duration") row.baseline2Duration = Math.max(0, Math.round(Number(value) || 0));
      if (field === "baseline3Start") row.baseline3Start = value;
      if (field === "baseline3Finish") row.baseline3Finish = value;
      if (field === "baseline3Duration") row.baseline3Duration = Math.max(0, Math.round(Number(value) || 0));
      if (field === "actualStart") row.actualStart = value;
      if (field === "actualFinish") row.actualFinish = value;
      if (field === "remarks") row.remarks = value;

      draft[index] = normalizeRowByType(row, selectedCalendar);
      if (index === draft.length - 1 && rowHasEntry(draft[index])) {
        draft.push(
          createEmptyPlannerRow(
            nextActivityId(draft),
            0,
            "",
            selectedScheduleId,
            draft[index].scheduleType || selectedScheduleType
          )
        );
      }
      return draft;
    });
  }

  function openEvmCostModal(row: PlannerRow) {
    const analysis = row.evmCostAnalysis;
    const materialLines = analysis?.materials?.length
      ? normalizeEvmMaterialLines(analysis.materials)
      : row.evmMaterialCost != null && row.evmMaterialCost > 0
        ? [
            {
              ...createEmptyEvmMaterialLine(),
              description: "Material",
              qty: 1,
              rate: roundMoney(Number(row.evmMaterialCost || 0)),
              gstPercent: 0,
            },
          ]
        : [];
    const labourLines = analysis?.labours?.length
      ? normalizeEvmLabourLines(analysis.labours)
      : row.evmLabourCost != null && row.evmLabourCost > 0
        ? [
            {
              ...createEmptyEvmLabourLine(),
              labourType: "Labour",
              qty: 1,
              rate: roundMoney(Number(row.evmLabourCost || 0)),
              gstPercent: 0,
            },
          ]
        : [];
    const machineryLines = analysis?.machinery?.length
      ? normalizeEvmMachineryLines(analysis.machinery)
      : row.evmOverheadCost != null && row.evmOverheadCost > 0
        ? [
            {
              ...createEmptyEvmMachineryLine(),
              machineryType: "Machinery/Equipment",
              rate: null,
              cost: roundMoney(Number(row.evmOverheadCost || 0)),
              gstPercent: 0,
            },
          ]
        : [];

    setEvmCostRowUid(row.uid);
    setEvmMaterialLinesDraft(materialLines);
    setEvmLabourLinesDraft(labourLines);
    setEvmMachineryLinesDraft(machineryLines);
    setEvmCostModalOpen(true);
    setError("");
  }

  function closeEvmCostModal() {
    setEvmCostModalOpen(false);
    setEvmCostRowUid(null);
    setEvmMaterialLinesDraft([]);
    setEvmLabourLinesDraft([]);
    setEvmMachineryLinesDraft([]);
  }

  function updateMaterialDraftLine(
    lineId: string,
    field: "description" | "unit" | "qty" | "rate" | "gstPercent",
    value: string
  ) {
    setEvmMaterialLinesDraft((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        if (field === "description") return { ...line, description: value };
        if (field === "unit") return { ...line, unit: value };
        if (field === "qty") return { ...line, qty: parseDecimalInputOrNull(value) };
        if (field === "rate") return { ...line, rate: parseDecimalInputOrNull(value) };
        return { ...line, gstPercent: parseDecimalInputOrNull(value) };
      })
    );
  }

  function updateLabourDraftLine(
    lineId: string,
    field: "labourType" | "unit" | "qty" | "rate" | "gstPercent",
    value: string
  ) {
    setEvmLabourLinesDraft((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        if (field === "labourType") return { ...line, labourType: value };
        if (field === "unit") return { ...line, unit: value };
        if (field === "qty") return { ...line, qty: parseDecimalInputOrNull(value) };
        if (field === "rate") return { ...line, rate: parseDecimalInputOrNull(value) };
        return { ...line, gstPercent: parseDecimalInputOrNull(value) };
      })
    );
  }

  function updateMachineryDraftLine(
    lineId: string,
    field: "machineryType" | "unit" | "rate" | "cost" | "gstPercent",
    value: string
  ) {
    setEvmMachineryLinesDraft((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        if (field === "machineryType") return { ...line, machineryType: value };
        if (field === "unit") return { ...line, unit: value };
        if (field === "rate") return { ...line, rate: parseDecimalInputOrNull(value) };
        if (field === "cost") return { ...line, cost: parseDecimalInputOrNull(value) };
        return { ...line, gstPercent: parseDecimalInputOrNull(value) };
      })
    );
  }

  function addMaterialDraftLine() {
    setEvmMaterialLinesDraft((prev) => [...prev, createEmptyEvmMaterialLine()]);
  }

  function addLabourDraftLine() {
    setEvmLabourLinesDraft((prev) => [...prev, createEmptyEvmLabourLine()]);
  }

  function addMachineryDraftLine() {
    setEvmMachineryLinesDraft((prev) => [...prev, createEmptyEvmMachineryLine()]);
  }

  function removeMaterialDraftLine(lineId: string) {
    setEvmMaterialLinesDraft((prev) => prev.filter((line) => line.id !== lineId));
  }

  function removeLabourDraftLine(lineId: string) {
    setEvmLabourLinesDraft((prev) => prev.filter((line) => line.id !== lineId));
  }

  function removeMachineryDraftLine(lineId: string) {
    setEvmMachineryLinesDraft((prev) => prev.filter((line) => line.id !== lineId));
  }

  function openUnitManager() {
    setUnitManagerOpen(true);
  }

  function closeUnitManager() {
    setUnitManagerOpen(false);
    setUnitManagerError("");
  }

  function toggleDraftUnitSelection(unitId: string) {
    setUnitSelectionDraft((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  }

  function addCustomUnitToDraft() {
    const label = newUnitLabelDraft.trim();
    if (!label) {
      setUnitManagerError("Enter a unit label to add.");
      return;
    }
    const nextUnit = createCustomPortalUnit(label);
    const existsInCatalog = unitManagerCatalog.some(
      (row) => row.id === nextUnit.id || row.label.toLowerCase() === label.toLowerCase()
    );
    if (existsInCatalog) {
      setUnitManagerError("This unit already exists.");
      return;
    }
    setUnitCustomUnitsDraft((prev) => [...prev, nextUnit]);
    setUnitSelectionDraft((prev) => [...prev, nextUnit.id]);
    setNewUnitLabelDraft("");
    setUnitManagerError("");
  }

  function removeCustomUnitFromDraft(unitId: string) {
    setUnitCustomUnitsDraft((prev) => prev.filter((row) => row.id !== unitId));
    setUnitSelectionDraft((prev) => prev.filter((id) => id !== unitId));
  }

  function saveUnitManagerSelection() {
    const normalizedSelected = unitSelectionDraft
      .map((id) => String(id || "").trim())
      .filter(Boolean);
    if (!normalizedSelected.length) {
      setUnitManagerError("Select at least one unit.");
      return;
    }
    const nextStore: PortalUnitStore = {
      selectedUnitIds: normalizedSelected,
      customUnits: unitCustomUnitsDraft,
    };
    savePortalUnitStore(nextStore);
    setPortalUnitStore(readPortalUnitStore());
    setUnitManagerOpen(false);
    setUnitManagerError("");
    setNotice("Portal unit preferences updated.");
  }

  function saveEvmCostModal() {
    if (!evmCostRowUid) return;
    const materials = evmMaterialLinesDraft.filter(
      (line) =>
        String(line.description || "").trim() ||
        String(line.unit || "").trim() ||
        line.qty != null ||
        line.rate != null ||
        line.gstPercent != null
    );
    const labours = evmLabourLinesDraft.filter(
      (line) =>
        String(line.labourType || "").trim() ||
        String(line.unit || "").trim() ||
        line.qty != null ||
        line.rate != null ||
        line.gstPercent != null
    );
    const machinery = evmMachineryLinesDraft.filter(
      (line) =>
        String(line.machineryType || "").trim() ||
        String(line.unit || "").trim() ||
        line.rate != null ||
        line.cost != null ||
        line.gstPercent != null
    );
    const hasAnyAnalysis = materials.length > 0 || labours.length > 0 || machinery.length > 0;
    const materialSummary = summarizeMaterialCosts(materials);
    const labourSummary = summarizeLabourCosts(labours);
    const machinerySummary = summarizeMachineryCosts(machinery);
    const totalGst = roundMoney(
      materialSummary.totalGst + labourSummary.totalGst + machinerySummary.totalGst
    );
    const grandTotal = roundMoney(
      materialSummary.subtotalCost + labourSummary.subtotalCost + machinerySummary.subtotalCost
    );
    updateVisibleRows((draft) => {
      const index = draft.findIndex((row) => row.uid === evmCostRowUid);
      if (index < 0) return draft;
      const plannedQty = draft[index].plannedQty;
      const activityCostPerUnit = grandTotal;
      const activityTotalCost =
        plannedQty != null
          ? roundMoney(Number(plannedQty || 0) * activityCostPerUnit)
          : activityCostPerUnit;
      draft[index] = {
        ...draft[index],
        evmMaterialCost: hasAnyAnalysis ? materialSummary.subtotalCost : null,
        evmLabourCost: hasAnyAnalysis ? labourSummary.subtotalCost : null,
        evmOverheadCost: hasAnyAnalysis ? machinerySummary.subtotalCost : null,
        evmCostAnalysis: hasAnyAnalysis
          ? {
              materials,
              labours,
              machinery,
            }
          : null,
        evmMaterialSubtotal: hasAnyAnalysis ? materialSummary.subtotalCost : null,
        evmLabourSubtotal: hasAnyAnalysis ? labourSummary.subtotalCost : null,
        evmMachinerySubtotal: hasAnyAnalysis ? machinerySummary.subtotalCost : null,
        evmTotalGst: hasAnyAnalysis ? totalGst : null,
        evmGrandTotalCost: hasAnyAnalysis ? grandTotal : null,
        evmActivityCostPerUnit: hasAnyAnalysis ? activityCostPerUnit : null,
        evmActivityTotalCost: hasAnyAnalysis ? activityTotalCost : null,
      };
      return draft;
    }, evmCostRowUid);
    setNotice("EVM cost analysis saved.");
    closeEvmCostModal();
  }

  function getColumnWidth(columnKey: ScheduleColumnKey) {
    return columnWidths[columnKey] || DEFAULT_COLUMN_WIDTHS[columnKey];
  }

  function startColumnResize(columnKey: ScheduleColumnKey, event: any) {
    event.preventDefault();
    event.stopPropagation();
    const startWidth = getColumnWidth(columnKey);
    resizeStateRef.current = {
      columnKey,
      startX: event.clientX,
      startWidth,
    };
    const onMouseMove = (moveEvent: MouseEvent) => {
      const state = resizeStateRef.current;
      if (!state) return;
      const delta = moveEvent.clientX - state.startX;
      const minWidth = MIN_COLUMN_WIDTHS[state.columnKey] || 60;
      const nextWidth = Math.max(minWidth, Math.round(state.startWidth + delta));
      setColumnWidths((prev) => ({
        ...prev,
        [state.columnKey]: nextWidth,
      }));
    };
    const stopResize = () => {
      resizeStateRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopResize);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopResize);
  }

  function resetCalendarComposer() {
    setEditingCalendarId(null);
    setNewCalendarName("");
    setNewCalendarWorkdays([1, 2, 3, 4, 5, 6]);
    setPendingHolidayDate("");
    setPendingEventDetail("");
    setPendingHolidayDates([]);
    setPendingCalendarEvents([]);
  }

  function openCreateCalendarModal() {
    setCalendarModalMode("CREATE");
    resetCalendarComposer();
    setCalendarModalOpen(true);
    setError("");
  }

  function closeCalendarModal() {
    setCalendarModalOpen(false);
    setCalendarModalMode("CREATE");
    resetCalendarComposer();
  }

  function addHolidayDateToComposer() {
    if (!pendingHolidayDate) return;
    const detail = pendingEventDetail.trim();
    setPendingHolidayDates((prev) => {
      if (prev.includes(pendingHolidayDate)) return prev;
      return [...prev, pendingHolidayDate].sort();
    });
    setPendingCalendarEvents((prev) => {
      const existing = prev.find((row) => row.date === pendingHolidayDate);
      if (existing) {
        return prev.map((row) =>
          row.date === pendingHolidayDate
            ? {
                ...row,
                detail,
              }
            : row
        );
      }
      const next = [...prev, { id: createUid(), date: pendingHolidayDate, detail }];
      return next.sort((a, b) => a.date.localeCompare(b.date));
    });
    setPendingHolidayDate("");
    setPendingEventDetail("");
  }

  function removeHolidayDateFromComposer(date: string) {
    setPendingHolidayDates((prev) => prev.filter((item) => item !== date));
    setPendingCalendarEvents((prev) => prev.filter((row) => row.date !== date));
  }

  function beginCalendarEdit(calendarId: string) {
    const row = calendars.find((calendar) => calendar.id === calendarId);
    if (!row) return;
    setCalendarModalMode("EDIT");
    setEditingCalendarId(row.id);
    setNewCalendarName(row.name);
    setNewCalendarWorkdays([...row.workingDays]);
    const events =
      row.events && row.events.length
        ? [...row.events].map((event) => ({
            id: String(event.id || createUid()),
            date: String(event.date || ""),
            detail: String(event.detail || ""),
          }))
        : [...row.holidays].map((date) => ({
            id: createUid(),
            date,
            detail: "",
          }));
    setPendingCalendarEvents(events.sort((a, b) => a.date.localeCompare(b.date)));
    setPendingHolidayDates(events.map((event) => event.date).sort());
    setPendingHolidayDate("");
    setPendingEventDetail("");
    setCalendarModalOpen(true);
    setError("");
  }

  function upsertCalendar() {
    const name = newCalendarName.trim();
    if (!name) {
      setError("Calendar name is required.");
      return;
    }
    if (!newCalendarWorkdays.length) {
      setError("Select at least one working weekday.");
      return;
    }

    const sortedDays = [...newCalendarWorkdays].sort((a, b) => a - b);
    const sortedEvents = [...pendingCalendarEvents]
      .filter((row) => row.date)
      .map((row) => ({
        id: String(row.id || createUid()),
        date: String(row.date).trim(),
        detail: String(row.detail || "").trim(),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const sortedHolidays = [...new Set(sortedEvents.map((row) => row.date))].sort();
    const nowIso = new Date().toISOString();

    let next: ProjectCalendar[];
    let affectedId: string;
    if (editingCalendarId) {
      next = calendars.map((calendar) =>
        calendar.id === editingCalendarId
          ? {
              ...calendar,
              name,
              workingDays: sortedDays,
              holidays: sortedHolidays,
              events: sortedEvents,
            }
          : calendar
      );
      affectedId = editingCalendarId;
    } else {
      const row: ProjectCalendar = {
        id: createUid(),
        name,
        workingDays: sortedDays,
        holidays: sortedHolidays,
        events: sortedEvents,
        createdAt: nowIso,
      };
      next = [row, ...calendars];
      affectedId = row.id;
    }

    setCalendars(next);
    saveCalendars(next);
    if (!editingCalendarId) {
      setAssignedCalendar(affectedId);
      if (selectedProjectId) setAssignedCalendarId(selectedProjectId, affectedId);
    } else if (assignedCalendarId === editingCalendarId) {
      setAssignedCalendar(editingCalendarId);
    }
    setNotice(
      editingCalendarId
        ? `Calendar "${name}" updated.`
        : `Calendar "${name}" saved. Use Apply Calendar for the selected schedule.`
    );
    setError("");
    setCalendarModalOpen(false);
    resetCalendarComposer();
  }

  function handleEditSelectedCalendar() {
    if (!calendars.length) {
      setError("No saved calendars found.");
      return;
    }
    const targetId =
      assignedCalendarId && calendars.some((calendar) => calendar.id === assignedCalendarId)
        ? assignedCalendarId
        : calendars[0].id;
    beginCalendarEdit(targetId);
  }

  function deleteEditingCalendar() {
    if (!editingCalendarId) {
      setError("Select a calendar to delete.");
      return;
    }
    const selected = calendars.find((calendar) => calendar.id === editingCalendarId);
    if (!selected) {
      setError("Selected calendar not found.");
      return;
    }
    const confirmed = window.confirm(
      `Calendar "${selected.name}" will be deleted permanently and cannot be restored. Do you want to continue?`
    );
    if (!confirmed) return;

    const nextCalendars = calendars.filter((calendar) => calendar.id !== editingCalendarId);
    const fallbackId = nextCalendars[0]?.id || "";
    setCalendars(nextCalendars);
    saveCalendars(nextCalendars);

    if (assignedCalendarId === editingCalendarId) {
      setAssignedCalendar(fallbackId);
      if (selectedProjectId && fallbackId) {
        setAssignedCalendarId(selectedProjectId, fallbackId);
        if (selectedScheduleId) {
          setAssignedScheduleCalendarId(selectedProjectId, selectedScheduleId, fallbackId);
        }
      }
    }

    setNotice(`Calendar "${selected.name}" deleted.`);
    setError("");
    setCalendarModalOpen(false);
    setCalendarModalMode("CREATE");
    resetCalendarComposer();
  }

  function applyCalendarToSchedule() {
    if (!selectedProjectId || !selectedScheduleId) {
      setError("Select project and schedule first.");
      return;
    }
    if (!assignedCalendarId) {
      setError("Select a calendar to apply.");
      return;
    }
    const chosen = calendars.find((calendar) => calendar.id === assignedCalendarId);
    if (!chosen) {
      setError("Selected calendar is invalid.");
      return;
    }
    setApplyingCalendar(true);
    setAssignedScheduleCalendarId(selectedProjectId, selectedScheduleId, assignedCalendarId);
    setAssignedCalendarId(selectedProjectId, assignedCalendarId);
    setNotice(
      `Calendar "${chosen.name}" applied to ${selectedSchedule?.schedule_name || "selected schedule"}.`
    );
    setError("");
    setApplyingCalendar(false);
  }

  const dependencyErrors = useMemo(() => buildDependencyErrors(visibleRows), [visibleRows]);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/company/pmo"
          className="inline-flex items-center rounded-full border border-[#d3b8a3] bg-[#f8efe8] px-4 py-2 text-sm font-bold text-slate-900 shadow-[0_2px_8px_rgba(31,14,6,0.14)] transition hover:bg-white"
        >
          Back to Dashboard
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-xl font-black text-slate-900">Schedule Builder (Primary PMO Workbench)</h3>
        <p className="mt-2 text-sm text-slate-600">
          Build schedules inline with MSP-style activity hierarchy, predecessor logic, duration-based
          dates, baseline control, actual dates, and approval governance.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[1.4fr_1.2fr_1fr_1fr_1.2fr]">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Select Project
            </label>
            <select
              className={inputClass}
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingProjects}
            >
              {projects.length === 0 ? <option value="">No projects</option> : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_code} - {project.project_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Select Schedule
            </label>
            <select
              className={inputClass}
              value={selectedScheduleId || ""}
              onChange={(e) => setSelectedScheduleId(e.target.value ? Number(e.target.value) : null)}
              disabled={!selectedProjectId || backendSchedules.length === 0}
            >
              {backendSchedules.length === 0 ? <option value="">No schedules</option> : null}
              {backendSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.schedule_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Select Baseline
            </label>
            <select
              className={inputClass}
              value={selectedBaselineValue}
              onChange={(e) => {
                const value = e.target.value;
                if (value.startsWith("id:")) {
                  const id = Number(value.split(":")[1] || 0);
                  setSelectedBaselineId(Number.isFinite(id) && id > 0 ? id : null);
                  setSelectedNextBaselineNo(null);
                } else if (value.startsWith("next:")) {
                  const nextNo = Number(value.split(":")[1] || 0);
                  setSelectedNextBaselineNo(
                    Number.isFinite(nextNo) && nextNo >= 1 && nextNo <= MAX_BASELINE_NUMBER
                      ? nextNo
                      : null
                  );
                  setSelectedBaselineId(null);
                } else {
                  setSelectedBaselineId(null);
                  setSelectedNextBaselineNo(null);
                }
                setBuilderVisible(false);
                setOpenedBaseline(null);
                setRows([]);
              }}
              disabled={!selectedProjectId || !selectedScheduleId}
            >
              {baselineOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
                ))}
              </select>
            </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Schedule Type
            </label>
            <select
              className={inputClass}
              value={selectedScheduleType}
              onChange={(e) => setSelectedScheduleType(e.target.value as ScheduleType)}
              disabled={builderVisible || !selectedProjectId || !selectedScheduleId}
            >
              {SCHEDULE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Select Project Calendar
            </label>
            <select
              className={inputClass}
              value={assignedCalendarId}
              onChange={(e) => {
                const next = e.target.value;
                setAssignedCalendar(next);
              }}
              disabled={!selectedProjectId || !selectedScheduleId || calendars.length === 0}
            >
              {calendars.length === 0 ? <option value="">No calendars</option> : null}
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <button
            type="button"
            onClick={handleBuildSchedule}
            className={canBuildScheduleAction ? activeActionButtonClass : inactiveActionButtonClass}
            disabled={!canBuildScheduleAction}
          >
            Build Schedule
          </button>
          <button
            type="button"
            onClick={handleEditSchedule}
            disabled={!canEditScheduleAction}
            className={canEditScheduleAction ? activeActionButtonClass : inactiveActionButtonClass}
          >
            Edit Schedule
          </button>
          <button
            type="button"
            onClick={() => { setRevokeNote(""); setRevokeModalOpen(true); }}
            disabled={!canRevokeScheduleAction}
            className={canRevokeScheduleAction ? activeActionButtonClass : inactiveActionButtonClass}
          >
            Revoke Schedule
          </button>
          <button
            type="button"
            onClick={handleViewSchedule}
            disabled={!canViewScheduleAction}
            className={canViewScheduleAction ? activeActionButtonClass : inactiveActionButtonClass}
          >
            {openingView ? "Loading..." : "View Schedule"}
          </button>
          <button
            type="button"
            onClick={handleToggleRevisionLog}
            disabled={!canShowRevisionLogAction}
            className={canShowRevisionLogAction ? activeActionButtonClass : inactiveActionButtonClass}
          >
            {revisionLinesLoading ? "Loading..." : "Show Revision Log"}
          </button>
          <button type="button" onClick={openCreateCalendarModal} className={activeActionButtonClass}>
            Create Calendar
          </button>
          <button
            type="button"
            onClick={handleEditSelectedCalendar}
            disabled={calendars.length === 0}
            className={calendars.length ? activeActionButtonClass : inactiveActionButtonClass}
          >
            Edit Calendar
          </button>
          <button
            type="button"
            onClick={applyCalendarToSchedule}
            disabled={!selectedProjectId || !selectedScheduleId || !assignedCalendarId || applyingCalendar}
            className={
              selectedProjectId && selectedScheduleId && assignedCalendarId && !applyingCalendar
                ? activeActionButtonClass
                : inactiveActionButtonClass
            }
          >
            {applyingCalendar ? "Applying..." : "Apply Calendar"}
          </button>
          <button
            type="button"
            onClick={openUnitManager}
            className={activeActionButtonClass}
          >
            Manage Units
          </button>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr]">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Schedule Status
            </label>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
              {scheduleStatusLabel}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Last Update
            </label>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
              {openedBaseline?.updated_at
                ? new Date(openedBaseline.updated_at).toLocaleString()
                : selectedBaseline?.updated_at
                  ? new Date(selectedBaseline.updated_at).toLocaleString()
                  : "Not set"}
            </div>
          </div>
        </div>
      </section>

      {!builderVisible ? (
        <section className="rounded-2xl border border-dashed border-[#d6b79f] bg-[#fff6ef] p-5">
          <p className="text-sm font-semibold text-[#6f4127]">
            Select Project, Schedule, and Baseline, then click <span className="font-black">Build Schedule</span> or{" "}
            <span className="font-black">Edit Schedule</span> to open the Schedule Builder.
          </p>
        </section>
      ) : (
        <>
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-[#6f4127]">
            Inline activity controls are available in each row for indentation, outdentation, and adding
            child activities.
          </p>
          <button
            type="button"
            onClick={openMspUploadPicker}
            disabled={isBuilderReadOnly || parsingMspFile}
            className={
              !isBuilderReadOnly && !parsingMspFile
                ? activeActionButtonClass
                : inactiveActionButtonClass
            }
          >
            {parsingMspFile ? "Parsing MSP XML..." : "Upload MSP XML"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-600">
          Import captures only Task Name, Duration, Start, Finish, and Predecessors.
          System will generate Sl. No and ID automatically; Unit, Qty, and Cost stay editable.
        </p>
      </section>

        </>
      )}

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <input
        ref={mspFileInputRef}
        type="file"
        accept=".xml,text/xml,application/xml"
        onChange={handleMspFileSelection}
        className="hidden"
      />

      <datalist id="portal-unit-options">
        {(activePortalUnits.length ? activePortalUnits : portalUnitCatalog).map((unit) => (
          <option key={unit.id} value={unit.label} />
        ))}
      </datalist>

      {exportMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#d7c1b1] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {exportMode === "PDF" ? "Save Schedule PDF" : "Print Schedule"}
                </h4>
                <p className="mt-1 text-xs text-slate-600">
                  This exports only the schedule table with company/project/schedule header.
                </p>
              </div>
              <button
                type="button"
                onClick={closeExportDialog}
                disabled={exportingSchedule}
                className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Page Size
                </label>
                <select
                  className={inputClass}
                  value={exportSettings.pageSize}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      pageSize: e.target.value as ExportPaperSize,
                    }))
                  }
                  disabled={exportingSchedule}
                >
                  {EXPORT_PAGE_SIZE_OPTIONS.map((row) => (
                    <option key={row.value} value={row.value}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Orientation
                </label>
                <select
                  className={inputClass}
                  value={exportSettings.orientation}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      orientation: e.target.value as ExportOrientation,
                    }))
                  }
                  disabled={exportingSchedule}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Top (mm)
                </label>
                <input
                  type="number"
                  min={4}
                  max={30}
                  className={inputClass}
                  value={exportSettings.marginTopMm}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      marginTopMm: clamp(Number(e.target.value || 0), 4, 30),
                    }))
                  }
                  disabled={exportingSchedule}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Right (mm)
                </label>
                <input
                  type="number"
                  min={4}
                  max={30}
                  className={inputClass}
                  value={exportSettings.marginRightMm}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      marginRightMm: clamp(Number(e.target.value || 0), 4, 30),
                    }))
                  }
                  disabled={exportingSchedule}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Bottom (mm)
                </label>
                <input
                  type="number"
                  min={4}
                  max={30}
                  className={inputClass}
                  value={exportSettings.marginBottomMm}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      marginBottomMm: clamp(Number(e.target.value || 0), 4, 30),
                    }))
                  }
                  disabled={exportingSchedule}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Left (mm)
                </label>
                <input
                  type="number"
                  min={4}
                  max={30}
                  className={inputClass}
                  value={exportSettings.marginLeftMm}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      marginLeftMm: clamp(Number(e.target.value || 0), 4, 30),
                    }))
                  }
                  disabled={exportingSchedule}
                />
              </div>
            </div>

            {exportMode === "PRINT" ? (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Printer Selection
                </label>
                <select
                  className={inputClass}
                  value={exportSettings.printerSelection}
                  onChange={(e) =>
                    setExportSettings((prev) => ({
                      ...prev,
                      printerSelection: e.target.value as ExportSettings["printerSelection"],
                    }))
                  }
                  disabled={exportingSchedule}
                >
                  <option value="SYSTEM_DIALOG">System Printer Dialog</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-600">
                  Printer list opens in the system dialog after document generation.
                </p>
              </div>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeExportDialog}
                disabled={exportingSchedule}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runScheduleExport}
                disabled={exportingSchedule}
                className={exportAction3DButtonClass}
              >
                {exportingSchedule
                  ? exportMode === "PDF"
                    ? "Saving PDF..."
                    : "Preparing Print..."
                  : exportMode === "PDF"
                    ? "Save PDF"
                    : "Print"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {calendarModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[#d7c1b1] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {calendarModalMode === "EDIT" ? "Edit Project Calendar" : "Create New Project Calendar"}
                </h4>
                <p className="mt-1 text-xs text-slate-600">
                  Set calendar title, add event dates, choose working days, and save.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCalendarModal}
                className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900"
              >
                Close
              </button>
            </div>

            {calendarModalMode === "EDIT" ? (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Select Existing Calendar
                </label>
                <select
                  className={inputClass}
                  value={editingCalendarId || ""}
                  onChange={(e) => beginCalendarEdit(e.target.value)}
                  disabled={calendars.length === 0}
                >
                  {calendars.length === 0 ? <option value="">No saved calendars</option> : null}
                  {calendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_1fr_1.4fr_auto]">
              <input
                className={inputClass}
                placeholder="Calendar title"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
              />
              <input
                type="date"
                className={inputClass}
                value={pendingHolidayDate}
                onChange={(e) => setPendingHolidayDate(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Event detail"
                value={pendingEventDetail}
                onChange={(e) => setPendingEventDetail(e.target.value)}
              />
              <button
                type="button"
                onClick={addHolidayDateToComposer}
                className="rounded-lg border border-slate-800 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
              >
                Add Event
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Working Days (7 Day Buttons)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map((day) => {
                  const active = newCalendarWorkdays.includes(day.value);
                  return (
                    <button
                      type="button"
                      key={day.value}
                      onClick={() =>
                        setNewCalendarWorkdays((prev) =>
                          active ? prev.filter((x) => x !== day.value) : [...prev, day.value]
                        )
                      }
                      className={
                        active
                          ? "rounded border border-[#6d4b37] bg-[#6d4b37] px-2 py-1 text-xs font-semibold text-white"
                          : "rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                      }
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-[#fffaf6] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Calendar Events
              </p>
              {pendingCalendarEvents.length ? (
                <div className="mt-2 max-h-52 space-y-2 overflow-y-auto">
                  {pendingCalendarEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                    >
                      <span className="w-28 shrink-0 font-semibold">{event.date}</span>
                      <span className="flex-1">{event.detail || "No event detail"}</span>
                      <button
                        type="button"
                        onClick={() => removeHolidayDateFromComposer(event.date)}
                        className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-600">No events added yet.</p>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              {calendarModalMode === "EDIT" ? (
                <button
                  type="button"
                  onClick={deleteEditingCalendar}
                  disabled={!editingCalendarId}
                  className={
                    editingCalendarId
                      ? "rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
                      : inactiveActionButtonClass
                  }
                >
                  Delete Calendar
                </button>
              ) : null}
              <button
                type="button"
                onClick={closeCalendarModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={upsertCalendar}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
              >
                Save Calendar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {unitManagerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-[#d7c1b1] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-slate-900">Portal Units</h4>
                <p className="mt-1 text-xs text-slate-600">
                  Select the units Planning Team can use across schedules and EVM cost analysis.
                </p>
              </div>
              <button
                type="button"
                onClick={closeUnitManager}
                className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className={inputClass}
                placeholder="Add custom unit (example: Bag (50kg), Rft, Nos)"
                value={newUnitLabelDraft}
                onChange={(e) => setNewUnitLabelDraft(e.target.value)}
              />
              <button
                type="button"
                onClick={addCustomUnitToDraft}
                className="rounded-lg border border-slate-800 bg-white px-4 py-2 text-xs font-semibold text-slate-900"
              >
                Add Unit
              </button>
            </div>

            {unitManagerError ? (
              <p className="mt-2 text-xs font-semibold text-red-700">{unitManagerError}</p>
            ) : null}

            <div className="mt-4 max-h-[58vh] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-[#fffaf6] p-3">
              {portalUnitsByDomain.length === 0 ? (
                <p className="text-xs text-slate-600">No units found.</p>
              ) : (
                portalUnitsByDomain.map((section) => (
                  <div key={`${section.domain}_${section.group}`} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      {section.domain} / {section.group}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {section.units.map((unit) => {
                        const checked = unitSelectionDraft.includes(unit.id);
                        const isCustom = unit.domain === "Custom";
                        return (
                          <label
                            key={unit.id}
                            className="flex items-center justify-between gap-2 rounded border border-[#ead9cc] px-2 py-1 text-xs text-slate-900"
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleDraftUnitSelection(unit.id)}
                              />
                              <span>{unit.label}</span>
                            </span>
                            {isCustom ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeCustomUnitFromDraft(unit.id);
                                }}
                                className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700"
                              >
                                Delete
                              </button>
                            ) : null}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-600">
                Selected units: <span className="font-semibold text-slate-900">{unitSelectionDraft.length}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeUnitManager}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveUnitManagerSelection}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                >
                  Save Units
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {evmCostModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-[96vw] rounded-2xl border border-[#d7c1b1] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-slate-900">EVM Cost Analysis</h4>
                <p className="mt-1 text-xs text-slate-600">
                  {evmCostTargetRow?.activityName
                    ? `Task: ${evmCostTargetRow.activityName}`
                    : "Define material, labour, and machinery/equipment usage cost for this activity."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEvmCostModal}
                className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              <div className="rounded-xl border border-slate-200 bg-[#fffaf6] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Material Cost
                  </p>
                  <button
                    type="button"
                    onClick={addMaterialDraftLine}
                    className="rounded border border-slate-800 bg-white px-3 py-1 text-xs font-semibold text-slate-900"
                  >
                    Add Material
                  </button>
                </div>
                <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="min-w-[1120px] text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-left font-bold uppercase tracking-wide text-slate-600">
                        <th className="px-2 py-2">Sl. No</th>
                        <th className="px-2 py-2">Description of Material</th>
                        <th className="px-2 py-2">Unit</th>
                        <th className="px-2 py-2">Qty</th>
                        <th className="px-2 py-2">Rate</th>
                        <th className="px-2 py-2">Cost</th>
                        <th className="px-2 py-2">GST %</th>
                        <th className="px-2 py-2">GST Cost</th>
                        <th className="px-2 py-2">Total Cost</th>
                        <th className="px-2 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evmMaterialLinesDraft.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-2 py-3 text-slate-600">
                            No material lines added.
                          </td>
                        </tr>
                      ) : (
                        evmMaterialLinesDraft.map((line, index) => {
                          const baseCost = materialLineCost(line);
                          const gstCost = lineGstCost(baseCost, line.gstPercent);
                          const totalCost = lineTotalCost(baseCost, line.gstPercent);
                          return (
                            <tr key={line.id} className="border-t border-[#efe2d8] text-slate-900">
                              <td className="px-2 py-2">{index + 1}</td>
                              <td className="px-2 py-2">
                                <input
                                  className={cellInputClass}
                                  value={line.description}
                                  onChange={(e) =>
                                    updateMaterialDraftLine(line.id, "description", e.target.value)
                                  }
                                  placeholder="Material description"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  className={cellInputClass}
                                  value={line.unit}
                                  list="portal-unit-options"
                                  onChange={(e) => updateMaterialDraftLine(line.id, "unit", e.target.value)}
                                  placeholder="Unit"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  className={cellInputClass}
                                  value={line.qty ?? ""}
                                  onChange={(e) => updateMaterialDraftLine(line.id, "qty", e.target.value)}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  className={cellInputClass}
                                  value={line.rate ?? ""}
                                  onChange={(e) => updateMaterialDraftLine(line.id, "rate", e.target.value)}
                                />
                              </td>
                              <td className="px-2 py-2 font-semibold">₹ {moneyDisplay(baseCost)}</td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  className={cellInputClass}
                                  value={line.gstPercent ?? ""}
                                  onChange={(e) =>
                                    updateMaterialDraftLine(line.id, "gstPercent", e.target.value)
                                  }
                                />
                              </td>
                              <td className="px-2 py-2">₹ {moneyDisplay(gstCost)}</td>
                              <td className="px-2 py-2 font-semibold">₹ {moneyDisplay(totalCost)}</td>
                              <td className="px-2 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeMaterialDraftLine(line.id)}
                                  className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-900">
                  Material Total Cost: ₹ {moneyDisplay(evmDraftMaterialSummary.subtotalCost)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-[#fffaf6] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Labour Cost
                  </p>
                  <button
                    type="button"
                    onClick={addLabourDraftLine}
                    className="rounded border border-slate-800 bg-white px-3 py-1 text-xs font-semibold text-slate-900"
                  >
                    Add Labour
                  </button>
                </div>
                <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="min-w-[1120px] text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-left font-bold uppercase tracking-wide text-slate-600">
                        <th className="px-2 py-2">Sl. No</th>
                        <th className="px-2 py-2">Type of Labour</th>
                        <th className="px-2 py-2">Unit</th>
                        <th className="px-2 py-2">Qty</th>
                        <th className="px-2 py-2">Rate</th>
                        <th className="px-2 py-2">Cost</th>
                        <th className="px-2 py-2">GST %</th>
                        <th className="px-2 py-2">GST Cost</th>
                        <th className="px-2 py-2">Total Cost</th>
                        <th className="px-2 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evmLabourLinesDraft.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-2 py-3 text-slate-600">
                            No labour lines added.
                          </td>
                        </tr>
                      ) : (
                        evmLabourLinesDraft.map((line, index) => {
                          const baseCost = labourLineCost(line);
                          const gstCost = lineGstCost(baseCost, line.gstPercent);
                          const totalCost = lineTotalCost(baseCost, line.gstPercent);
                          return (
                            <tr key={line.id} className="border-t border-[#efe2d8] text-slate-900">
                              <td className="px-2 py-2">{index + 1}</td>
                              <td className="px-2 py-2">
                                <input
                                  className={cellInputClass}
                                  value={line.labourType}
                                  onChange={(e) =>
                                    updateLabourDraftLine(line.id, "labourType", e.target.value)
                                  }
                                  placeholder="Labour type"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  className={cellInputClass}
                                  value={line.unit}
                                  list="portal-unit-options"
                                  onChange={(e) => updateLabourDraftLine(line.id, "unit", e.target.value)}
                                  placeholder="Unit"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  className={cellInputClass}
                                  value={line.qty ?? ""}
                                  onChange={(e) => updateLabourDraftLine(line.id, "qty", e.target.value)}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  className={cellInputClass}
                                  value={line.rate ?? ""}
                                  onChange={(e) => updateLabourDraftLine(line.id, "rate", e.target.value)}
                                />
                              </td>
                              <td className="px-2 py-2 font-semibold">₹ {moneyDisplay(baseCost)}</td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  className={cellInputClass}
                                  value={line.gstPercent ?? ""}
                                  onChange={(e) =>
                                    updateLabourDraftLine(line.id, "gstPercent", e.target.value)
                                  }
                                />
                              </td>
                              <td className="px-2 py-2">₹ {moneyDisplay(gstCost)}</td>
                              <td className="px-2 py-2 font-semibold">₹ {moneyDisplay(totalCost)}</td>
                              <td className="px-2 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeLabourDraftLine(line.id)}
                                  className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-900">
                  Labour Total Cost: ₹ {moneyDisplay(evmDraftLabourSummary.subtotalCost)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-[#fffaf6] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Machinery/Equipment Usage Cost
                  </p>
                  <button
                    type="button"
                    onClick={addMachineryDraftLine}
                    className="rounded border border-slate-800 bg-white px-3 py-1 text-xs font-semibold text-slate-900"
                  >
                    Add Machinery/Equipment
                  </button>
                </div>
                <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="min-w-[1040px] text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-left font-bold uppercase tracking-wide text-slate-600">
                        <th className="px-2 py-2">Sl. No</th>
                        <th className="px-2 py-2">Type of Machinery/Equipment Usage</th>
                        <th className="px-2 py-2">Unit</th>
                        <th className="px-2 py-2">Rate</th>
                        <th className="px-2 py-2">Cost</th>
                        <th className="px-2 py-2">GST %</th>
                        <th className="px-2 py-2">GST Cost</th>
                        <th className="px-2 py-2">Total Cost</th>
                        <th className="px-2 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evmMachineryLinesDraft.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-2 py-3 text-slate-600">
                            No machinery/equipment lines added.
                          </td>
                        </tr>
                      ) : (
                        evmMachineryLinesDraft.map((line, index) => {
                          const baseCost = machineryLineCost(line);
                          const gstCost = lineGstCost(baseCost, line.gstPercent);
                          const totalCost = lineTotalCost(baseCost, line.gstPercent);
                          return (
                            <tr key={line.id} className="border-t border-[#efe2d8] text-slate-900">
                              <td className="px-2 py-2">{index + 1}</td>
                              <td className="px-2 py-2">
                                <input
                                  className={cellInputClass}
                                  value={line.machineryType}
                                  onChange={(e) =>
                                    updateMachineryDraftLine(line.id, "machineryType", e.target.value)
                                  }
                                  placeholder="Usage type"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  className={cellInputClass}
                                  value={line.unit}
                                  list="portal-unit-options"
                                  onChange={(e) => updateMachineryDraftLine(line.id, "unit", e.target.value)}
                                  placeholder="Unit"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  className={cellInputClass}
                                  value={line.rate ?? ""}
                                  onChange={(e) => updateMachineryDraftLine(line.id, "rate", e.target.value)}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  className={cellInputClass}
                                  value={line.cost ?? ""}
                                  onChange={(e) => updateMachineryDraftLine(line.id, "cost", e.target.value)}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  className={cellInputClass}
                                  value={line.gstPercent ?? ""}
                                  onChange={(e) =>
                                    updateMachineryDraftLine(line.id, "gstPercent", e.target.value)
                                  }
                                />
                              </td>
                              <td className="px-2 py-2">₹ {moneyDisplay(gstCost)}</td>
                              <td className="px-2 py-2 font-semibold">₹ {moneyDisplay(totalCost)}</td>
                              <td className="px-2 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeMachineryDraftLine(line.id)}
                                  className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-900">
                  Machinery/Equipment Total Cost: ₹{" "}
                  {moneyDisplay(evmDraftMachinerySummary.subtotalCost)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cost Summary
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900">
                    Material Total: <span className="font-semibold">₹ {moneyDisplay(evmDraftMaterialSummary.subtotalCost)}</span>
                  </div>
                  <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900">
                    Labour Total: <span className="font-semibold">₹ {moneyDisplay(evmDraftLabourSummary.subtotalCost)}</span>
                  </div>
                  <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900">
                    Machinery Total: <span className="font-semibold">₹ {moneyDisplay(evmDraftMachinerySummary.subtotalCost)}</span>
                  </div>
                  <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900">
                    Total GST: <span className="font-semibold">₹ {moneyDisplay(evmDraftTotalGst)}</span>
                  </div>
                  <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900">
                    Grand Total Cost: <span className="font-semibold">₹ {moneyDisplay(evmDraftGrandTotal)}</span>
                  </div>
                  <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900">
                    Activity Cost Per Unit: <span className="font-semibold">₹ {moneyDisplay(evmDraftActivityCostPerUnit)}</span>
                  </div>
                  <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900">
                    Project Qty:{" "}
                    <span className="font-semibold">
                      {evmCostTargetRow?.plannedQty != null
                        ? Number(evmCostTargetRow.plannedQty).toLocaleString("en-IN")
                        : "-"}
                    </span>
                  </div>
                  <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900">
                    Activity Total Cost: <span className="font-semibold">₹ {moneyDisplay(evmDraftActivityTotalCost)}</span>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-600">
                  This analysis represents one unit of activity. Activity Total Cost is auto-derived as
                  Project Qty multiplied by Activity Cost Per Unit.
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEvmCostModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEvmCostModal}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
              >
                Save Cost
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showRevisionLog ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-base font-black text-slate-900">Revision Log (Revoked Schedule)</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[820px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-left font-bold uppercase tracking-wide text-slate-600">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Activity</th>
                  <th className="px-3 py-2">Date of Revision</th>
                  <th className="px-3 py-2">Nature of Revision</th>
                </tr>
              </thead>
              <tbody>
                {revisionLinesLoading ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-3 text-sm text-slate-600">
                      Loading revision lines...
                    </td>
                  </tr>
                ) : revisionLines.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-3 text-sm text-slate-600">
                      No revisions recorded yet for this revoked schedule.
                    </td>
                  </tr>
                ) : (
                  revisionLines.map((line) => (
                    <tr key={line.id} className="border-t border-[#efe2d8] text-slate-900">
                      <td className="px-3 py-2">{line.activity_id ?? "-"}</td>
                      <td className="px-3 py-2">{line.activity_name || "-"}</td>
                      <td className="px-3 py-2">
                        {line.changed_at ? new Date(line.changed_at).toLocaleString() : "-"}
                      </td>
                      <td className="px-3 py-2">{line.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {builderVisible ? (
      <section className="max-w-full rounded-2xl border border-[#d7c2b0] bg-[#efe2d3] p-4">
        <div className="mb-3 rounded-xl border border-[#4a2a1b] bg-gradient-to-r from-[#4a2a1b] to-[#6a3c25] px-4 py-3 shadow-[0_8px_20px_rgba(37,20,12,0.22)]">
          <h4 className="text-base font-black text-[#fff7ef]">
            {selectedSchedule?.schedule_name || "Schedule Builder"}
          </h4>
          <p className="text-xs text-[#ecd7c6]">
            Includes inline WBS hierarchy, predecessors, duration-driven scheduling, baseline
            dates, and calendar-aware calculations.
          </p>
        </div>

        <div className="mb-3 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => openExportDialog("PDF")}
            disabled={!canExportSchedule || exportingSchedule}
            className={
              !canExportSchedule || exportingSchedule
                ? inactiveActionButtonClass
                : exportAction3DButtonClass
            }
          >
            Save PDF
          </button>
          <button
            type="button"
            onClick={() => openExportDialog("PRINT")}
            disabled={!canExportSchedule || exportingSchedule}
            className={
              !canExportSchedule || exportingSchedule
                ? inactiveActionButtonClass
                : exportAction3DButtonClass
            }
          >
            Print
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isBuilderReadOnly || savingDraft}
            className={
              isBuilderReadOnly || savingDraft ? inactiveActionButtonClass : saveAction3DButtonClass
            }
          >
            {savingDraft ? "Saving..." : "Save Schedule"}
          </button>
          <button
            type="button"
            onClick={handleExitBuilder}
            className={exitAction3DButtonClass}
          >
            Exit
          </button>
          <button
            type="button"
            onClick={handleSubmitForApproval}
            disabled={isBuilderReadOnly || submittingForApproval}
            className={
              isBuilderReadOnly || submittingForApproval
                ? inactiveActionButtonClass
                : submitAction3DButtonClass
            }
          >
            {submittingForApproval ? "Submitting..." : "Submit For Pre-Approval"}
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#f6ece2] px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Format Selected Row
            </span>
            <button
              type="button"
              onClick={() => applyFormattingToSelectedRow({ fontWeight: "bold" })}
              className="rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-bold text-slate-900"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => applyFormattingToSelectedRow({ fontStyle: "italic" })}
              className="rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-semibold italic text-slate-900"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() =>
                applyFormattingToSelectedRow({
                  fontWeight: "normal",
                  fontStyle: "normal",
                  fontColor: "#0F172A",
                })
              }
              className="rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-semibold text-slate-900"
              title="Normal"
            >
              Normal
            </button>
            <label className="flex items-center gap-1 rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-semibold text-slate-900">
              Color
              <input
                type="color"
                value={selectedVisibleRow?.fontColor || "#0F172A"}
                onChange={(e) => applyFormattingToSelectedRow({ fontColor: e.target.value })}
                className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={collapseAllRows}
              className="rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-semibold text-slate-900"
            >
              Collapse All
            </button>
            <button
              type="button"
              onClick={expandAllRows}
              className="rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-semibold text-slate-900"
            >
              Expand All
            </button>
          </div>
        </div>

        <div className="mb-2 flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-[#d9c4b2] bg-[#f3e5d7] px-3 py-2">
          <p className="text-xs font-semibold text-slate-600">
            Showing rows {pagedRowStart}-{pagedRowEnd} of {gridRows.length}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
              Rows / page
              <select
                className="rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs text-slate-900 outline-none"
                value={gridPageSize}
                onChange={(e) => {
                  setGridPageSize(Number(e.target.value));
                  setGridPage(1);
                }}
              >
                {GRID_PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setGridPage((prev) => Math.max(1, prev - 1))}
              disabled={currentGridPage <= 1}
              className={
                currentGridPage <= 1
                  ? "rounded border border-[#ddd0c5] bg-[#efe6df] px-2 py-1 text-xs font-semibold text-[#aa9788]"
                  : "rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-semibold text-slate-900"
              }
            >
              Prev
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page {currentGridPage} / {totalGridPages}
            </span>
            <button
              type="button"
              onClick={() => setGridPage((prev) => Math.min(totalGridPages, prev + 1))}
              disabled={currentGridPage >= totalGridPages}
              className={
                currentGridPage >= totalGridPages
                  ? "rounded border border-[#ddd0c5] bg-[#efe6df] px-2 py-1 text-xs font-semibold text-[#aa9788]"
                  : "rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-semibold text-slate-900"
              }
            >
              Next
            </button>
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-xl border border-[#d9c4b2] bg-[#ead8c7]">
        <div className="max-w-full overflow-x-auto pb-1">
        <fieldset disabled={isBuilderReadOnly} className="m-0 min-w-max border-0 p-0">
          {(() => {
            const showEvmCostColumn = selectedScheduleType === "EVM";
            const visibleColumnCount = 8 + (showEvmCostColumn ? 1 : 0);
            const widthNo = getColumnWidth("no");
            const widthActivity = getColumnWidth("activity");
            const widthDuration = getColumnWidth("duration");
            const widthBaselineStart = getColumnWidth("baselineStart");
            const widthBaselineFinish = getColumnWidth("baselineFinish");
            const widthPredecessors = getColumnWidth("predecessors");
            const widthUnit = getColumnWidth("unit");
            const widthProjectQty = getColumnWidth("projectQty");
            const widthCost = getColumnWidth("cost");
            const tableMinWidth =
              widthNo +
              widthActivity +
              widthDuration +
              widthBaselineStart +
              widthBaselineFinish +
              widthPredecessors +
              widthUnit +
              widthProjectQty +
              (showEvmCostColumn ? widthCost : 0);
            return (
              <table className="w-max text-[10.5px] leading-tight" style={{ minWidth: tableMinWidth }}>
                <thead>
                  <tr className="bg-[#f0dfcf] text-left font-bold uppercase tracking-wide text-slate-600">
                    <th
                      className="sticky left-0 z-20 border-r border-slate-200 bg-[#f0dfcf] px-1 py-1"
                      style={{ width: widthNo, minWidth: widthNo, left: 0 }}
                    >
                      <div className="relative pr-1">
                        No
                        <div
                          className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                          onMouseDown={(e) => startColumnResize("no", e)}
                        />
                      </div>
                    </th>
                    <th className="border-r border-slate-200 px-2 py-1" style={{ width: widthActivity, minWidth: widthActivity }}>
                      <div className="relative pr-1 font-black text-slate-900">
                        Activity
                        <div
                          className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                          onMouseDown={(e) => startColumnResize("activity", e)}
                        />
                      </div>
                    </th>
                    <th className="border-r border-slate-200 px-2 py-1" style={{ width: widthDuration, minWidth: widthDuration }}>
                      <div className="relative pr-1">
                        Duration
                        <div
                          className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                          onMouseDown={(e) => startColumnResize("duration", e)}
                        />
                      </div>
                    </th>
                    <th className="border-r border-slate-200 px-2 py-1" style={{ width: widthBaselineStart, minWidth: widthBaselineStart }}>
                      <div className="relative pr-1">
                        {selectedBaselineStartLabel}
                        <div
                          className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                          onMouseDown={(e) => startColumnResize("baselineStart", e)}
                        />
                      </div>
                    </th>
                    <th className="border-r border-slate-200 px-2 py-1" style={{ width: widthBaselineFinish, minWidth: widthBaselineFinish }}>
                      <div className="relative pr-1">
                        {selectedBaselineFinishLabel}
                        <div
                          className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                          onMouseDown={(e) => startColumnResize("baselineFinish", e)}
                        />
                      </div>
                    </th>
                    <th className="border-r border-slate-200 px-2 py-1" style={{ width: widthPredecessors, minWidth: widthPredecessors }}>
                      <div className="relative pr-1">
                        Predecessors
                        <div
                          className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                          onMouseDown={(e) => startColumnResize("predecessors", e)}
                        />
                      </div>
                    </th>
                    <th className="border-r border-slate-200 px-2 py-1" style={{ width: widthUnit, minWidth: widthUnit }}>
                      <div className="relative pr-1">
                        Unit
                        <div
                          className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                          onMouseDown={(e) => startColumnResize("unit", e)}
                        />
                      </div>
                    </th>
                    <th className="border-r border-slate-200 px-2 py-1" style={{ width: widthProjectQty, minWidth: widthProjectQty }}>
                      <div className="relative pr-1">
                        Project Qty
                        <div
                          className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                          onMouseDown={(e) => startColumnResize("projectQty", e)}
                        />
                      </div>
                    </th>
                    {showEvmCostColumn ? (
                      <th className="border-r border-slate-200 px-2 py-1" style={{ width: widthCost, minWidth: widthCost }}>
                        <div className="relative pr-1">
                          Cost
                          <div
                            className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                            onMouseDown={(e) => startColumnResize("cost", e)}
                          />
                        </div>
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {loadingRows ? (
                    <tr>
                      <td colSpan={visibleColumnCount} className="px-3 py-3 text-sm text-slate-600">
                        Loading schedule rows...
                      </td>
                    </tr>
                  ) : !selectedScheduleId ? (
                    <tr>
                      <td colSpan={visibleColumnCount} className="px-3 py-3 text-sm text-slate-600">
                        Select a schedule to start planning.
                      </td>
                    </tr>
                  ) : gridRows.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumnCount} className="px-3 py-3 text-sm text-slate-600">
                        No rows available. Use inline row controls in the Activity column to start planning.
                      </td>
                    </tr>
                  ) : (
                    pagedGridRows.map((row, index) => {
                      const rowNumber = gridPageStartIndex + index + 1;
                      const selected = row.uid === selectedRowUid;
                      const stickyBg = selected ? "bg-[#efdac8]" : "bg-[#f7eee5]";
                      const depError = dependencyErrors[row.uid];
                      const evmSummary = getRowEvmSummaries(row);
                      const totalEvmCost = evmTotalCost(row);
                      const isSummaryRow = row.activityType === "SUMMARY";
                      const hasChildren = collapsibleRowMap.get(row.uid) || false;
                      const isCollapsed = collapsedRowUidSet.has(row.uid);
                      const rowTextStyle = {
                        fontWeight: hasChildren
                          ? ("700" as const)
                          : row.fontWeight === "bold"
                            ? ("700" as const)
                            : ("400" as const),
                        fontStyle: row.fontStyle === "italic" ? ("italic" as const) : ("normal" as const),
                        color: normalizeFontColor(row.fontColor),
                        fontSize: fontSizeByIndent(row.indentLevel),
                      };

                      return (
                        <tr
                          key={row.uid}
                          onClick={(event) => {
                            const target = event.target as HTMLElement;
                            if (target.closest("textarea, input, button, select, option")) return;
                            setSelectedRowUid(row.uid);
                          }}
                          className={`border-t border-[#e6d2c1] text-slate-900 ${
                            selected ? "bg-[#f3e0cf]" : "bg-slate-50"
                          }`}
                        >
                          <td
                            className={`sticky z-10 border-r border-slate-200 px-1 py-0.5 ${stickyBg}`}
                            style={{ width: widthNo, minWidth: widthNo, left: 0 }}
                          >
                            {rowNumber}
                          </td>
                          <td className="px-2 py-0.5 align-top" style={{ width: widthActivity, minWidth: widthActivity }}>
                            <div className="flex min-w-0 items-start gap-1">
                              <div className="mt-0 flex items-center gap-0.5">
                                <button
                                  type="button"
                                  className={
                                    hasChildren
                                      ? "rounded border border-slate-200 bg-white px-0.5 py-0 text-[9px] leading-none"
                                      : "rounded border border-[#ead9cc] bg-[#f6eee6] px-0.5 py-0 text-[9px] leading-none text-[#b8a394]"
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRowUid(row.uid);
                                    toggleRowCollapse(row.uid);
                                  }}
                                  title={hasChildren ? (isCollapsed ? "Expand child activities" : "Collapse child activities") : "No child activities"}
                                  disabled={!hasChildren}
                                >
                                  {hasChildren ? (isCollapsed ? "▸" : "▾") : "·"}
                                </button>
                                <button
                                  type="button"
                                  className="rounded border border-slate-200 bg-white px-0.5 py-0 text-[9px] leading-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRowUid(row.uid);
                                    shiftIndentByUid(row.uid, 1);
                                  }}
                                  title="Indent"
                                >
                                  &gt;
                                </button>
                                <button
                                  type="button"
                                  className="rounded border border-slate-200 bg-white px-0.5 py-0 text-[9px] leading-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRowUid(row.uid);
                                    shiftIndentByUid(row.uid, -1);
                                  }}
                                  title="Outdent"
                                >
                                  &lt;
                                </button>
                                <button
                                  type="button"
                                  className="rounded border border-slate-200 bg-white px-0.5 py-0 text-[9px] leading-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRowUid(row.uid);
                                    addRowRelative(row.uid, "below");
                                  }}
                                  title="Add row below"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  className="rounded border border-red-200 bg-red-50 px-0.5 py-0 text-[9px] font-bold leading-none text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRowUid(row.uid);
                                    removeRowByUid(row.uid);
                                  }}
                                  title="Delete row"
                                >
                                  -
                                </button>
                              </div>
                              <div
                                className="flex min-w-0 flex-1 items-start"
                                style={{ paddingLeft: `${6 + row.indentLevel * 14}px` }}
                              >
                                <span
                                  className="mr-1 mt-0 shrink-0 select-none"
                                  style={rowTextStyle}
                                >
                                  {row.wbsCode || "-"}
                                </span>
                                <textarea
                                  rows={1}
                                  data-activity-autosize="1"
                                  className={`${activityCellInputClass} resize-none whitespace-pre-wrap break-words py-0 text-[10.5px] leading-[1.1]`}
                                  style={{
                                    ...rowTextStyle,
                                    minHeight: 20,
                                    lineHeight: 1.1,
                                  }}
                                  value={row.activityName}
                                  onFocus={() => setSelectedRowUid(row.uid)}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateField(row.uid, "activityName", e.target.value)}
                                  onInput={(e) => {
                                    const el = e.currentTarget;
                                    el.style.height = "0px";
                                    el.style.height = `${Math.max(20, el.scrollHeight)}px`;
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-0.5" style={{ width: widthDuration, minWidth: widthDuration }}>
                            <input
                              type="number"
                              min={isSummaryRow || row.activityType === "MILESTONE" ? 0 : 1}
                              className={`${durationCellInputClass} ${
                                isSummaryRow ? "bg-slate-50 text-slate-700" : ""
                              } py-0 text-[10.5px] leading-[1.1]`}
                              style={rowTextStyle}
                              value={row.durationDays}
                              onChange={(e) => updateField(row.uid, "durationDays", e.target.value)}
                              readOnly={isSummaryRow}
                            />
                          </td>
                          <td className="px-2 py-0.5" style={{ width: widthBaselineStart, minWidth: widthBaselineStart }}>
                            <input
                              type="date"
                              className={`${cellInputClass} ${
                                isSummaryRow ? "bg-slate-50 text-slate-700" : ""
                              } py-0 text-[10.5px] leading-[1.1]`}
                              style={rowTextStyle}
                              value={row.startDate}
                              onChange={(e) => updateField(row.uid, "startDate", e.target.value)}
                              readOnly={isSummaryRow}
                            />
                          </td>
                          <td className="px-2 py-0.5" style={{ width: widthBaselineFinish, minWidth: widthBaselineFinish }}>
                            <input
                              type="date"
                              className={`${cellInputClass} ${
                                isSummaryRow ? "bg-slate-50 text-slate-700" : ""
                              } py-0 text-[10.5px] leading-[1.1]`}
                              style={rowTextStyle}
                              value={row.finishDate}
                              onChange={(e) => updateField(row.uid, "finishDate", e.target.value)}
                              readOnly={isSummaryRow}
                            />
                          </td>
                          <td className="px-2 py-0.5 align-top" style={{ width: widthPredecessors, minWidth: widthPredecessors }}>
                            <input
                              className={`${cellInputClass} py-0 text-[10.5px] leading-[1.1]`}
                              style={rowTextStyle}
                              value={row.predecessors}
                              onChange={(e) => updateField(row.uid, "predecessors", e.target.value)}
                              placeholder="1FS, 1.2SS+2d"
                            />
                            {depError ? <p className="mt-0.5 text-[10px] text-red-700">{depError}</p> : null}
                          </td>
                          <td className="px-2 py-0.5" style={{ width: widthUnit, minWidth: widthUnit }}>
                            <input
                              className={`${unitCellInputClass} py-0 text-[10.5px] leading-[1.1]`}
                              list="portal-unit-options"
                              style={rowTextStyle}
                              value={row.unit}
                              onChange={(e) => updateField(row.uid, "unit", e.target.value)}
                              placeholder="Nos / Sqm / Cum"
                            />
                          </td>
                          <td className="px-2 py-0.5" style={{ width: widthProjectQty, minWidth: widthProjectQty }}>
                            <input
                              type="number"
                              min={0}
                              className={`${cellInputClass} py-0 text-[10.5px] leading-[1.1]`}
                              style={rowTextStyle}
                              value={row.plannedQty ?? ""}
                              onChange={(e) => updateField(row.uid, "plannedQty", e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          {showEvmCostColumn ? (
                            <td className="px-2 py-0.5" style={{ width: widthCost, minWidth: widthCost }}>
                              <button
                                type="button"
                                className="w-full rounded border border-slate-200 bg-white px-2 py-0 text-left text-[10.5px] leading-[1.1]"
                                style={rowTextStyle}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEvmCostModal(row);
                                }}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-semibold text-slate-900">
                                    ₹ {moneyDisplay(totalEvmCost)}
                                  </span>
                                  <span className="rounded border border-slate-200 px-1 text-[10px] text-slate-900">
                                    Edit
                                  </span>
                                </div>
                                <div className="mt-0 text-[10px] text-slate-600">
                                  Unit ₹ {moneyDisplay(evmSummary.activityCostPerUnit)}
                                </div>
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            );
          })()}
        </fieldset>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-[#d9c4b2] bg-[#f3e5d7] px-3 py-2">
          <p className="text-xs font-semibold text-slate-600">
            Showing rows {pagedRowStart}-{pagedRowEnd} of {gridRows.length}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setGridPage((prev) => Math.max(1, prev - 1))}
              disabled={currentGridPage <= 1}
              className={
                currentGridPage <= 1
                  ? "rounded border border-[#ddd0c5] bg-[#efe6df] px-2 py-1 text-xs font-semibold text-[#aa9788]"
                  : "rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-semibold text-slate-900"
              }
            >
              Prev
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page {currentGridPage} / {totalGridPages}
            </span>
            <button
              type="button"
              onClick={() => setGridPage((prev) => Math.min(totalGridPages, prev + 1))}
              disabled={currentGridPage >= totalGridPages}
              className={
                currentGridPage >= totalGridPages
                  ? "rounded border border-[#ddd0c5] bg-[#efe6df] px-2 py-1 text-xs font-semibold text-[#aa9788]"
                  : "rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-semibold text-slate-900"
              }
            >
              Next
            </button>
          </div>
        </div>
        </div>
      </section>
      ) : null}

      {isViewMode && viewingBaseline ? (
        <section className="rounded-2xl border border-[#d7c2b0] bg-[#efe2d3] p-4">
          {/* View mode header */}
          <div className="mb-3 rounded-xl border border-[#4a2a1b] bg-gradient-to-r from-[#4a2a1b] to-[#6a3c25] px-4 py-3 shadow-[0_8px_20px_rgba(37,20,12,0.22)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-black text-[#fff7ef]">
                  {selectedSchedule?.schedule_name || "Schedule"} — B{viewingBaseline.baseline_no} (Read-Only)
                </h4>
                <p className="text-xs text-[#ecd7c6]">
                  {approvedImplBaselineIds.has(viewingBaseline.id) ? "Approved (Final)" : "Pre-Approved"} · {filteredViewRows.length} activities shown
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsViewMode(false); setViewRows([]); setViewingBaseline(null); }}
                className={exitAction3DButtonClass}
              >
                Close View
              </button>
            </div>
          </div>

          {/* Level filter + export toolbar */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-900">Show Levels:</span>
            {(["ALL", "LEVEL2", "LEVEL3"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setViewLevelFilter(level)}
                className={
                  viewLevelFilter === level
                    ? "rounded-lg border border-[#3f2418] bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_3px_0_#2f1b12]"
                    : "rounded-lg border border-[#cdb8a8] bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
                }
              >
                {level === "ALL" ? "View All" : level === "LEVEL2" ? "Upto Level 2" : "Upto Level 3"}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {/* Column visibility picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setViewColPickerOpen((o) => !o)}
                  className="rounded-lg border border-[#cdb8a8] bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Columns {viewColPickerOpen ? "▲" : "▼"}
                </button>
                {viewColPickerOpen && (
                  <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-[#d7c2b0] bg-white p-3 shadow-xl">
                    <div className="mb-2 flex justify-between border-b border-[#f0e4d8] pb-1.5">
                      <button
                        type="button"
                        onClick={() => setViewHiddenCols(new Set())}
                        className="text-[11px] font-semibold text-[#4a2a1b] underline"
                      >
                        Show All
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewHiddenCols(new Set([...VIEW_BUILDER_COLS.map((c) => c.key), ...(viewIncludesCost ? ["cost"] : [])]))}
                        className="text-[11px] font-semibold text-[#4a2a1b] underline"
                      >
                        Hide All
                      </button>
                    </div>
                    {[
                      ...VIEW_BUILDER_COLS,
                      ...(viewIncludesCost ? [{ key: "cost" as const, label: "Project Cost" }] : []),
                    ].map((col) => (
                      <label key={col.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs text-slate-900 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={!viewHiddenCols.has(col.key)}
                          onChange={() =>
                            setViewHiddenCols((prev) => {
                              const next = new Set(prev);
                              if (next.has(col.key)) next.delete(col.key);
                              else next.add(col.key);
                              return next;
                            })
                          }
                          className="accent-[#7a4a2f]"
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => openExportDialog("PDF")}
                disabled={!filteredViewRows.length || exportingSchedule}
                className={filteredViewRows.length && !exportingSchedule ? exportAction3DButtonClass : inactiveActionButtonClass}
              >
                {exportingSchedule ? "Exporting..." : "Save PDF"}
              </button>
              <button
                type="button"
                onClick={() => openExportDialog("PRINT")}
                disabled={!filteredViewRows.length || exportingSchedule}
                className={filteredViewRows.length && !exportingSchedule ? exportAction3DButtonClass : inactiveActionButtonClass}
              >
                Print
              </button>
            </div>
          </div>

          {/* Read-only grid */}
          <div className="overflow-x-auto rounded-xl border border-[#d7c2b0]">
            <table className="w-full border-collapse text-[11px]" style={{ minWidth: 600 }}>
              <thead>
                <tr className="bg-[#f0dfcf] text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  <th className="border-b border-r border-slate-200 px-2 py-1.5 text-center" style={{ width: 40 }}>No</th>
                  <th className="border-b border-r border-slate-200 px-2 py-1.5 font-black text-slate-900" style={{ minWidth: 260 }}>Activity</th>
                  {!viewHiddenCols.has("dur") && <th className="border-b border-r border-slate-200 px-2 py-1.5" style={{ width: 64 }}>Dur.</th>}
                  {!viewHiddenCols.has("start") && <th className="border-b border-r border-slate-200 px-2 py-1.5" style={{ width: 100 }}>Start</th>}
                  {!viewHiddenCols.has("finish") && <th className="border-b border-r border-slate-200 px-2 py-1.5" style={{ width: 100 }}>Finish</th>}
                  {!viewHiddenCols.has("predecessors") && <th className="border-b border-r border-slate-200 px-2 py-1.5" style={{ width: 110 }}>Predecessors</th>}
                  {!viewHiddenCols.has("unit") && <th className="border-b border-r border-slate-200 px-2 py-1.5" style={{ width: 90 }}>Unit</th>}
                  {!viewHiddenCols.has("qty") && <th className={`border-b border-r border-slate-200 px-2 py-1.5${viewIncludesCost ? "" : " border-r-0"}`} style={{ width: 90 }}>Qty</th>}
                  {viewIncludesCost && !viewHiddenCols.has("cost") && <th className="border-b border-slate-200 px-2 py-1.5" style={{ width: 110 }}>Project Cost</th>}
                </tr>
              </thead>
              <tbody>
                {filteredViewRows.length === 0 ? (
                  <tr><td colSpan={2 + VIEW_BUILDER_COLS.filter((c) => !viewHiddenCols.has(c.key)).length + (viewIncludesCost && !viewHiddenCols.has("cost") ? 1 : 0)} className="px-3 py-6 text-center text-sm text-slate-600">No activities to display.</td></tr>
                ) : filteredViewRows.map((row, idx) => {
                  const isSummary = row.activityType === "SUMMARY";
                  const rowStyle: React.CSSProperties = {
                    fontWeight: isSummary || row.fontWeight === "bold" ? 700 : 400,
                    fontStyle: row.fontStyle === "italic" ? "italic" : "normal",
                    color: normalizeFontColor(row.fontColor),
                    fontSize: row.indentLevel === 0 ? "12px" : row.indentLevel === 1 ? "11px" : row.indentLevel === 2 ? "10px" : "9px",
                  };
                  return (
                    <tr key={row.uid} className={isSummary ? "bg-[#f7ede0]" : "bg-slate-50"}>
                      <td className="border-b border-r border-[#e6d2c1] px-1 py-0.5 text-center text-[10px] text-slate-600">{idx + 1}</td>
                      <td className="border-b border-r border-[#e6d2c1] px-2 py-0.5">
                        <div className="flex min-w-0 items-start" style={{ paddingLeft: `${row.indentLevel * 14}px` }}>
                          {row.wbsCode && <span className="mr-1 shrink-0 select-none" style={rowStyle}>{row.wbsCode}</span>}
                          <span style={rowStyle} className="break-words leading-[1.2]">{row.activityName || "—"}</span>
                        </div>
                      </td>
                      {!viewHiddenCols.has("dur") && <td className="border-b border-r border-[#e6d2c1] px-2 py-0.5 text-center" style={rowStyle}>{row.durationDays ?? ""}</td>}
                      {!viewHiddenCols.has("start") && <td className="border-b border-r border-[#e6d2c1] px-2 py-0.5" style={rowStyle}>{toDisplayDate(row.startDate)}</td>}
                      {!viewHiddenCols.has("finish") && <td className="border-b border-r border-[#e6d2c1] px-2 py-0.5" style={rowStyle}>{toDisplayDate(row.finishDate)}</td>}
                      {!viewHiddenCols.has("predecessors") && <td className="border-b border-r border-[#e6d2c1] px-2 py-0.5 text-[10px] text-slate-600">{row.predecessors || ""}</td>}
                      {!viewHiddenCols.has("unit") && <td className="border-b border-r border-[#e6d2c1] px-2 py-0.5" style={rowStyle}>{row.unit || ""}</td>}
                      {!viewHiddenCols.has("qty") && <td className={`border-b border-r border-[#e6d2c1] px-2 py-0.5${viewIncludesCost ? "" : " border-r-0"}`} style={rowStyle}>{row.plannedQty ?? ""}</td>}
                      {viewIncludesCost && !viewHiddenCols.has("cost") && <td className="border-b border-[#e6d2c1] px-2 py-0.5 text-right" style={rowStyle}>{row.activityType !== "SUMMARY" ? `INR ${moneyDisplay(evmTotalCost(row))}` : ""}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {builderVisible ? (
        <div className="pb-2 pt-2">
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => openExportDialog("PDF")}
              disabled={!canExportSchedule || exportingSchedule}
              className={
                !canExportSchedule || exportingSchedule
                  ? inactiveActionButtonClass
                  : exportAction3DButtonClass
              }
            >
              Save PDF
            </button>
            <button
              type="button"
              onClick={() => openExportDialog("PRINT")}
              disabled={!canExportSchedule || exportingSchedule}
              className={
                !canExportSchedule || exportingSchedule
                  ? inactiveActionButtonClass
                  : exportAction3DButtonClass
              }
            >
              Print
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isBuilderReadOnly || savingDraft}
              className={
                isBuilderReadOnly || savingDraft ? inactiveActionButtonClass : saveAction3DButtonClass
              }
            >
              {savingDraft ? "Saving..." : "Save Schedule"}
            </button>
            <button
              type="button"
              onClick={handleExitBuilder}
              className={exitAction3DButtonClass}
            >
              Exit
            </button>
            <button
              type="button"
              onClick={handleSubmitForApproval}
              disabled={isBuilderReadOnly || submittingForApproval}
              className={
                isBuilderReadOnly || submittingForApproval
                  ? inactiveActionButtonClass
                  : submitAction3DButtonClass
              }
            >
              {submittingForApproval ? "Submitting..." : "Submit For Pre-Approval"}
            </button>
          </div>
        </div>
      ) : null}

      {/* Revoke Request Modal */}
      {revokeModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-[#fff9f3] p-5 shadow-[0_20px_48px_rgba(18,9,5,0.35)]">
            <h4 className="text-lg font-black text-slate-900">Request Schedule Revoke</h4>
            <p className="mt-1 text-sm text-slate-600">
              Address your message to the Company Admin explaining the reason for revoking this
              pre-approved schedule. This message will be visible to the admin when processing your
              request.
            </p>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span className="font-bold">Baseline: </span>
              {selectedSchedule?.schedule_name || "Schedule"} —{" "}
              B{baselines.find((b) => b.id === selectedBaselineId)?.baseline_no ?? ""}
            </div>
            <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Message to Admin
              <textarea
                value={revokeNote}
                onChange={(e) => setRevokeNote(e.target.value)}
                rows={5}
                maxLength={2000}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#a67652]"
                placeholder="Dear Admin, I am requesting to revoke this pre-approved schedule because..."
                autoFocus
              />
              <span className="mt-0.5 block text-right text-[11px] font-normal text-slate-400">
                {revokeNote.length} / 2000
              </span>
            </label>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevokeModalOpen(false)}
                disabled={requestingRevoke}
                className="rounded-lg border border-[#cdb8a8] bg-white px-4 py-2 text-xs font-semibold text-slate-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRequestRevokeSchedule(revokeNote)}
                disabled={requestingRevoke || !revokeNote.trim()}
                className="rounded-lg border border-[#7a3f24] bg-gradient-to-b from-[#d8a074] to-[#a46642] px-4 py-2 text-xs font-bold text-[#2f1a10] shadow-[0_4px_0_#7d4d32] disabled:opacity-50"
              >
                {requestingRevoke ? "Submitting..." : "Send Revoke Request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
