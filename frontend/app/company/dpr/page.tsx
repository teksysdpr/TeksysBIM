"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";
import RepeatableTableSection, {
  type DprTableColumn,
} from "@/components/dpr/RepeatableTableSection";
import {
  createDprReport,
  getDprReport,
  listDprReports,
  submitDprReport,
  updateDprReport,
} from "@/app/services/dprService";
import {
  getCompanyProjectStructures,
  getCompanyProjects,
} from "@/services/companyService";
import {
  getSchedules,
  type ScheduleRow,
} from "@/app/services/projectControlService";
import {
  getBaselineDetail,
  listScheduleBaselines,
  type PMOBaselineRow,
} from "@/app/services/pmoScheduleApprovalService";
import { applyDprCalculations } from "@/lib/dprCalculator";
import { resolveAuthCategory } from "@/lib/landing";
import { getAccessToken, getStoredUser } from "@/lib/storage";
import {
  createEmptyDailyWorkProgressItem,
  createEmptyDeviationReportItem,
  createEmptyDprReportInput,
  createEmptyHindranceReportItem,
  createEmptyMaterialIssueConsumptionItem,
  createEmptyManpowerDeploymentItem,
  createEmptyMachineryEquipmentItem,
  createEmptyMaterialProcurementItem,
  createEmptyRiskManagementItem,
  type DprDailyWorkProgressItem,
  type DprDeviationReportItem,
  type DprHindranceReportItem,
  type DprMaterialIssueConsumptionItem,
  type DprManpowerDeploymentItem,
  type DprMachineryEquipmentItem,
  type DprMaterialProcurementItem,
  type DprReportInput,
  type DprReportRecord,
  type DprRiskManagementItem,
  type DprStatus,
} from "@/lib/dprTypes";
import { validateDprInput } from "@/lib/dprValidation";

const WEATHER_OPTIONS = [
  "Clear",
  "Cloudy",
  "Rainy",
  "Stormy",
  "Humid",
  "Windy",
];
const SUMMARY_TEXT_LIMIT = 1000;

const UNIT_OPTIONS = ["Sqm", "Cum", "Rmt", "Kg", "Nos", "Lot"];
const PROJECT_PLACEHOLDERS = ["project"];
const SCHEDULE_PLACEHOLDERS = ["schedule", "selected schedule"];

const RESPONSIBLE_PARTY_OPTIONS = [
  { label: "Client", value: "Client" },
  { label: "Consultant", value: "Consultant" },
  { label: "Contractor", value: "Contractor" },
  { label: "Vendor", value: "Vendor" },
  { label: "Internal Team", value: "Internal Team" },
];

type UserSnapshot = {
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  category?: string | null;
};

type CompanyProfileSnapshot = {
  company_name?: string;
  logo_url?: string | null;
};

type ApprovedActivityOption = {
  label: string;
  value: string;
};

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function roleToken(value: unknown): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function canEditSubmittedDpr(user: UserSnapshot | null): boolean {
  const category = resolveAuthCategory({ category: user?.category, role: user?.role });
  if (category === "ADMIN") return true;
  const role = roleToken(user?.role);
  return role.includes("ADMIN") || role.includes("PROJECT_MANAGER") || role.includes("PMO");
}

function createdByLabel(user: UserSnapshot | null): string {
  return (
    String(user?.full_name || user?.name || user?.email || "Portal User").trim() ||
    "Portal User"
  );
}

function asNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function formatStatus(status: DprStatus): string {
  if (status === "draft") return "Draft";
  if (status === "submitted") return "Submitted";
  if (status === "approved") return "Approved";
  return "Rejected";
}

function normalizeLabel(value: string | null | undefined): string {
  return String(value || "")
    .replace(/^[\s:|-]+/, "")
    .trim();
}

function nonPlaceholder(
  value: string | null | undefined,
  placeholders: string[]
): string {
  const text = normalizeLabel(value);
  if (!text) return "";
  const lowered = text.toLowerCase();
  if (placeholders.some((item) => lowered === item.toLowerCase())) return "";
  return text;
}

function normalizeLookupToken(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function getBaselineActivityName(raw: Record<string, any>): string {
  const candidateKeys = [
    "activityName",
    "activity_name",
    "taskName",
    "task_name",
    "name",
    "title",
  ];
  for (const key of candidateKeys) {
    const value = normalizeLabel(raw?.[key]);
    if (value) return value;
  }
  return "";
}

function isSummaryBaselineRow(raw: Record<string, any>): boolean {
  const type = String(raw?.activityType || raw?.activity_type || "")
    .trim()
    .toUpperCase();
  return type === "SUMMARY";
}

function baselineSortKey(row: PMOBaselineRow): string {
  return String(row.approved_at || row.updated_at || row.created_at || "");
}

function compareBaselinePriority(a: PMOBaselineRow, b: PMOBaselineRow): number {
  const baselineDiff = Number(b.baseline_no || 0) - Number(a.baseline_no || 0);
  if (baselineDiff !== 0) return baselineDiff;
  const timeDiff = baselineSortKey(b).localeCompare(baselineSortKey(a));
  if (timeDiff !== 0) return timeDiff;
  return Number(b.id || 0) - Number(a.id || 0);
}

function pickLatestApprovedBaseline(rows: PMOBaselineRow[]): PMOBaselineRow | null {
  const approvedRows = (rows || []).filter((row) => {
    const status = String(row.status || "").trim().toUpperCase();
    return status === "APPROVED" && !row.revoked_at;
  });
  if (!approvedRows.length) return null;
  return [...approvedRows].sort(compareBaselinePriority)[0] || null;
}

function toFormInput(row: DprReportRecord): DprReportInput {
  return applyDprCalculations({
    ...row,
    id: row.id,
  });
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

async function exportDprAsPdf(
  reportId: number | null,
  form: DprReportInput,
  companyProfile: CompanyProfileSnapshot | null,
  display: { projectName?: string; scheduleName?: string } = {}
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const companyName = companyProfile?.company_name || "Company";
  const logoSource = toAbsoluteAssetUrl(companyProfile?.logo_url || "");
  const logoDataUrl = await imageToDataUrl(logoSource);
  const reportNo = reportId ? `#${reportId}` : "Draft";
  const projectName =
    nonPlaceholder(display.projectName, PROJECT_PLACEHOLDERS) ||
    nonPlaceholder(form.project_name, PROJECT_PLACEHOLDERS) ||
    "-";
  const scheduleName =
    nonPlaceholder(display.scheduleName, SCHEDULE_PLACEHOLDERS) ||
    nonPlaceholder(form.schedule_name, SCHEDULE_PLACEHOLDERS) ||
    "-";

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 14, 10, 15, 15);
  }
  const infoX = logoDataUrl ? 33 : 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text(companyName, infoX, 14);
  doc.setFontSize(10.5);
  doc.text(projectName, infoX, 20);
  doc.setFontSize(9.5);
  doc.text(scheduleName, infoX, 26);
  doc.setDrawColor(185, 152, 129);
  doc.setLineWidth(0.4);
  doc.line(14, 30, 196, 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Report: ${reportNo}`, 14, 36);
  doc.text(`Date: ${form.dpr_date || "-"} (${form.day_name || "-"})`, 14, 41);
  doc.text(`Weather: ${form.weather || "-"}`, 14, 46);
  doc.text(`Status: ${formatStatus(form.status)}`, 14, 51);

  autoTable(doc, {
    startY: 56,
    head: [["Summary", "Value"]],
    body: [
      ["Today's Visitors", form.todays_visitors || "-"],
      ["Safety / Security Incidence", form.safety_security_incidence || "-"],
      ["Pending Decisions / Drawing Requirements", form.pending_decisions_drawing_requirements || "-"],
      ["Critical Points", form.critical_points || "-"],
      ["Red Alert", form.red_alert || "-"],
      ["Weather Impact Details", form.weather_impact_details || "-"],
      ["Total Manpower", String(form.total_manpower_sum || 0)],
    ],
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [124, 78, 49] },
    theme: "grid",
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 4,
    head: [[
      "Sr",
      "Activity",
      "Sub Activity",
      "Unit",
      "Qty Planned",
      "Qty Executed",
      "Remark",
    ]],
    body: form.daily_work_progress_items.map((row) => [
      row.sr_no,
      row.activity || "-",
      row.sub_activity || "-",
      row.unit || "-",
      row.qty_planned_day ?? "-",
      row.qty_executed ?? "-",
      row.remark || "-",
    ]),
    styles: { fontSize: 7, cellPadding: 1.2 },
    headStyles: { fillColor: [124, 78, 49] },
    theme: "grid",
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 4,
    head: [[
      "Sr",
      "Contractor",
      "Activity",
      "Sub Activity",
      "Unit",
      "Skilled",
      "US-MC",
      "US-FC",
      "Total",
      "Remarks",
    ]],
    body: form.manpower_deployment_items.map((row) => [
      row.sr_no,
      row.contractor_name || "-",
      row.activity || "-",
      row.sub_activity || "-",
      row.unit || "-",
      row.manpower_skilled ?? "-",
      row.manpower_unskilled_mc ?? "-",
      row.manpower_unskilled_fc ?? "-",
      row.total_manpower ?? "-",
      row.remarks || "-",
    ]),
    styles: { fontSize: 7, cellPadding: 1.2 },
    headStyles: { fillColor: [124, 78, 49] },
    theme: "grid",
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 4,
    head: [[
      "Sr",
      "Material",
      "Unit",
      "Qty",
      "Issue Slip No",
      "Contractor",
      "Activity",
      "Sub Activity",
    ]],
    body: form.material_issue_consumption_items.map((row) => [
      row.sr_no,
      row.material || "-",
      row.unit || "-",
      row.qty ?? "-",
      row.issue_slip_no || "-",
      row.contractor || "-",
      row.activity || "-",
      row.sub_activity || "-",
    ]),
    styles: { fontSize: 7, cellPadding: 1.2 },
    headStyles: { fillColor: [124, 78, 49] },
    theme: "grid",
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 4,
    head: [["Section", "Summary"]],
    body: [
      ["Work Progress Rows", String(form.daily_work_progress_items.length)],
      ["Manpower Rows", String(form.manpower_deployment_items.length)],
      ["Machinery Rows", String(form.machinery_equipment_items.length)],
      ["Material Procurement Rows", String(form.material_procurement_items.length)],
      [
        "Material Issue / Consumption Rows",
        String(form.material_issue_consumption_items.length),
      ],
      ["Deviation Rows", String(form.deviation_report_items.length)],
      ["Risk Rows", String(form.risk_management_items.length)],
      ["Hindrance Rows", String(form.hindrance_report_items.length)],
      ["DPR Created By (Engineer)", form.site_engineer_name || "-"],
      ["Engineer Designation", form.site_engineer_designation || "-"],
      [
        "DPR Verified and Submitted By",
        form.project_manager_name || "-",
      ],
    ],
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [124, 78, 49] },
    theme: "grid",
  });

  const fileName = `DPR_${(projectName || "Project")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")}_${form.dpr_date || todayDateOnly()}.pdf`;
  doc.save(fileName);
}

export default function DprPage() {
  const [queryProjectId, setQueryProjectId] = useState<number | null>(null);
  const [queryReportId, setQueryReportId] = useState<number | null>(null);
  const [queryProjectName, setQueryProjectName] = useState("");
  const [queryScheduleId, setQueryScheduleId] = useState("");
  const [queryScheduleName, setQueryScheduleName] = useState("");
  const [queryDate, setQueryDate] = useState<string>(todayDateOnly());
  const [shouldAutoPrint, setShouldAutoPrint] = useState(false);
  const [shouldAutoExportPdf, setShouldAutoExportPdf] = useState(false);
  const [queryReady, setQueryReady] = useState(false);
  const [resolvedProjectName, setResolvedProjectName] = useState("");
  const [resolvedScheduleName, setResolvedScheduleName] = useState("");

  const [reportId, setReportId] = useState<number | null>(null);
  const [form, setForm] = useState<DprReportInput>(() =>
    applyDprCalculations({
      ...createEmptyDprReportInput(),
      dpr_date: todayDateOnly(),
    })
  );
  const [inclusiveHindranceDays, setInclusiveHindranceDays] = useState(true);
  const [mode, setMode] = useState<"edit" | "view">("edit");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [userSnapshot, setUserSnapshot] = useState<UserSnapshot | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileSnapshot | null>(null);
  const [approvedActivityOptions, setApprovedActivityOptions] = useState<
    ApprovedActivityOption[]
  >([]);
  const [approvedActivityLoading, setApprovedActivityLoading] = useState(false);
  const [approvedActivityNotice, setApprovedActivityNotice] = useState("");
  const didInitRef = useRef(false);
  const lastSelectionKeyRef = useRef("");
  const lastActivityFetchKeyRef = useRef("");

  const canEditSubmitted = useMemo(() => canEditSubmittedDpr(userSnapshot), [userSnapshot]);
  const canSubmitDpr = useMemo(() => {
    const category = resolveAuthCategory({
      category: userSnapshot?.category,
      role: userSnapshot?.role,
    });
    if (category === "ADMIN") return true;
    const role = roleToken(userSnapshot?.role);
    return role.includes("PROJECT_MANAGER");
  }, [userSnapshot]);
  const readOnly = mode === "view" || (form.status === "submitted" && !canEditSubmitted);
  const submitDisabled = busy || readOnly || !canSubmitDpr;
  const forcedScheduleName =
    queryScheduleId === "ALL"
      ? "All Schedules"
      : queryScheduleId === "__UNASSIGNED__"
      ? "Unassigned"
      : "";
  const displayProjectName =
    nonPlaceholder(resolvedProjectName, PROJECT_PLACEHOLDERS) ||
    nonPlaceholder(form.project_name, PROJECT_PLACEHOLDERS) ||
    nonPlaceholder(queryProjectName, PROJECT_PLACEHOLDERS) ||
    "Project";
  const displayScheduleName =
    nonPlaceholder(forcedScheduleName, SCHEDULE_PLACEHOLDERS) ||
    nonPlaceholder(resolvedScheduleName, SCHEDULE_PLACEHOLDERS) ||
    nonPlaceholder(form.schedule_name, SCHEDULE_PLACEHOLDERS) ||
    nonPlaceholder(queryScheduleName, SCHEDULE_PLACEHOLDERS) ||
    "Schedule";
  const displayCompanyName = companyProfile?.company_name || "Company";
  const printLogoSrc = toAbsoluteAssetUrl(companyProfile?.logo_url || "");
  const backToProjectDashboardHref = useMemo(() => {
    const params = new URLSearchParams();
    const projectId = queryProjectId || form.project_id;
    const scheduleId = String(queryScheduleId || form.schedule_id || "").trim();
    const reportingDate = String(form.dpr_date || queryDate || "").trim();

    if (projectId) params.set("project_id", String(projectId));
    if (scheduleId) params.set("schedule_id", scheduleId);
    if (reportingDate) params.set("dpr_date", reportingDate);

    const query = params.toString();
    return query ? `/company/project-dashboard?${query}` : "/company/project-dashboard";
  }, [
    queryProjectId,
    queryScheduleId,
    queryDate,
    form.project_id,
    form.schedule_id,
    form.dpr_date,
  ]);
  const activityOptions = useMemo(() => {
    const map = new Map<string, ApprovedActivityOption>();
    const addOption = (raw: string | null | undefined) => {
      const value = normalizeLabel(raw);
      if (!value) return;
      const token = normalizeLookupToken(value);
      if (!token || map.has(token)) return;
      map.set(token, { label: value, value });
    };

    approvedActivityOptions.forEach((option) => {
      addOption(option.value || option.label);
    });
    form.daily_work_progress_items.forEach((row) => addOption(row.activity));
    form.manpower_deployment_items.forEach((row) => addOption(row.activity));

    return Array.from(map.values());
  }, [
    approvedActivityOptions,
    form.daily_work_progress_items,
    form.manpower_deployment_items,
  ]);

  const dailyColumns = useMemo<DprTableColumn<DprDailyWorkProgressItem>[]>(
    () => [
      { key: "sr_no", label: "Sr No", type: "readonly", widthClass: "w-[64px]", align: "center" },
      {
        key: "activity",
        label: "Activity",
        type: "select",
        widthClass: "min-w-[190px]",
        options: activityOptions,
      },
      { key: "sub_activity", label: "Sub Activity", widthClass: "min-w-[170px]" },
      {
        key: "unit",
        label: "Unit",
        type: "select",
        widthClass: "w-[96px]",
        options: UNIT_OPTIONS.map((unit) => ({ label: unit, value: unit })),
      },
      {
        key: "qty_planned_day",
        label: "Qty Planned for Day",
        type: "number",
        widthClass: "w-[150px]",
        step: "0.01",
        align: "right",
      },
      {
        key: "qty_executed",
        label: "Qty Executed",
        type: "number",
        widthClass: "w-[120px]",
        step: "0.01",
        align: "right",
      },
      { key: "remark", label: "Remark", widthClass: "min-w-[170px]" },
    ],
    [activityOptions]
  );

  const manpowerColumns = useMemo<DprTableColumn<DprManpowerDeploymentItem>[]>(
    () => [
      { key: "sr_no", label: "Sl. No.", type: "readonly", widthClass: "w-[64px]", align: "center" },
      { key: "contractor_name", label: "Contractor", widthClass: "min-w-[170px]" },
      {
        key: "activity",
        label: "Activity",
        type: "select",
        widthClass: "min-w-[180px]",
        options: activityOptions,
      },
      { key: "sub_activity", label: "Sub Activity", widthClass: "min-w-[150px]" },
      {
        key: "unit",
        label: "Unit",
        type: "select",
        widthClass: "w-[96px]",
        options: UNIT_OPTIONS.map((unit) => ({ label: unit, value: unit })),
      },
      {
        key: "manpower_skilled",
        label: "Skilled",
        type: "integer",
        widthClass: "w-[90px]",
        align: "right",
      },
      {
        key: "manpower_unskilled_mc",
        label: "US-MC",
        type: "integer",
        widthClass: "w-[90px]",
        align: "right",
      },
      {
        key: "manpower_unskilled_fc",
        label: "US-FC",
        type: "integer",
        widthClass: "w-[90px]",
        align: "right",
      },
      {
        key: "total_manpower",
        label: "Total",
        type: "readonly",
        widthClass: "w-[90px]",
        align: "right",
      },
      { key: "remarks", label: "Remarks", widthClass: "min-w-[170px]" },
    ],
    [activityOptions]
  );

  const machineryColumns = useMemo<DprTableColumn<DprMachineryEquipmentItem>[]>(
    () => [
      { key: "sr_no", label: "Sr No", type: "readonly", widthClass: "w-[64px]", align: "center" },
      { key: "machine", label: "Machine", widthClass: "min-w-[170px]" },
      { key: "agency", label: "Agency", widthClass: "min-w-[140px]" },
      { key: "location", label: "Location", widthClass: "min-w-[140px]" },
      { key: "from_time", label: "From", type: "time", widthClass: "w-[110px]" },
      { key: "to_time", label: "To", type: "time", widthClass: "w-[110px]" },
      { key: "hours", label: "Hours", type: "number", widthClass: "w-[96px]", step: "0.25", align: "right" },
      { key: "work_done", label: "Work Done", widthClass: "min-w-[220px]" },
    ],
    []
  );

  const materialColumns = useMemo<DprTableColumn<DprMaterialProcurementItem>[]>(
    () => [
      { key: "sr_no", label: "Sr No", type: "readonly", widthClass: "w-[64px]", align: "center" },
      { key: "material", label: "Material", widthClass: "min-w-[170px]" },
      {
        key: "unit",
        label: "Unit",
        type: "select",
        widthClass: "w-[96px]",
        options: UNIT_OPTIONS.map((unit) => ({ label: unit, value: unit })),
      },
      { key: "qty", label: "Qty", type: "number", widthClass: "w-[90px]", step: "0.01", align: "right" },
      { key: "grn_no", label: "GRN No", widthClass: "min-w-[120px]" },
      { key: "supplier", label: "Supplier", widthClass: "min-w-[150px]" },
      { key: "used_for", label: "Used For", widthClass: "min-w-[200px]" },
    ],
    []
  );

  const materialIssueConsumptionColumns = useMemo<
    DprTableColumn<DprMaterialIssueConsumptionItem>[]
  >(
    () => [
      { key: "sr_no", label: "Sr No", type: "readonly", widthClass: "w-[64px]", align: "center" },
      { key: "material", label: "Material", widthClass: "min-w-[170px]" },
      {
        key: "unit",
        label: "Unit",
        type: "select",
        widthClass: "w-[96px]",
        options: UNIT_OPTIONS.map((unit) => ({ label: unit, value: unit })),
      },
      { key: "qty", label: "Qty", type: "number", widthClass: "w-[90px]", step: "0.01", align: "right" },
      { key: "issue_slip_no", label: "Issue Slip No.", widthClass: "min-w-[150px]" },
      { key: "contractor", label: "Contractor", widthClass: "min-w-[160px]" },
      {
        key: "activity",
        label: "Activity",
        type: "select",
        widthClass: "min-w-[180px]",
        options: activityOptions,
      },
      { key: "sub_activity", label: "Sub-Activity", widthClass: "min-w-[170px]" },
    ],
    [activityOptions]
  );

  const deviationColumns = useMemo<DprTableColumn<DprDeviationReportItem>[]>(
    () => [
      { key: "sr_no", label: "Sr No", type: "readonly", widthClass: "w-[64px]", align: "center" },
      { key: "activity", label: "Activity", widthClass: "min-w-[200px]" },
      { key: "planned_qty", label: "Planned Qty", type: "number", widthClass: "w-[120px]", step: "0.01", align: "right" },
      { key: "actual_qty", label: "Actual Qty", type: "number", widthClass: "w-[120px]", step: "0.01", align: "right" },
      { key: "deviation", label: "Deviation", type: "readonly", widthClass: "w-[120px]", align: "right" },
      { key: "remarks", label: "Remarks", widthClass: "min-w-[220px]" },
    ],
    []
  );

  const riskColumns = useMemo<DprTableColumn<DprRiskManagementItem>[]>(
    () => [
      { key: "sr_no", label: "Sr No", type: "readonly", widthClass: "w-[64px]", align: "center" },
      { key: "activity", label: "Activity", widthClass: "min-w-[160px]" },
      { key: "location", label: "Location", widthClass: "min-w-[140px]" },
      {
        key: "risk_or_hurdles_identified",
        label: "Risk / Hurdles Identified",
        type: "textarea",
        widthClass: "min-w-[260px]",
      },
      {
        key: "mitigation_strategy",
        label: "Mitigation Strategy",
        type: "textarea",
        widthClass: "min-w-[260px]",
      },
      { key: "remark", label: "Remark", widthClass: "min-w-[170px]" },
    ],
    []
  );

  const hindranceColumns = useMemo<DprTableColumn<DprHindranceReportItem>[]>(
    () => [
      { key: "sr_no", label: "Sr No", type: "readonly", widthClass: "w-[64px]", align: "center" },
      { key: "hindrance_date", label: "Hindrance Date", type: "date", widthClass: "w-[140px]" },
      { key: "activity_or_location", label: "Activity / Location", widthClass: "min-w-[220px]" },
      {
        key: "responsible_party",
        label: "Responsible Party",
        type: "select",
        widthClass: "min-w-[150px]",
        options: RESPONSIBLE_PARTY_OPTIONS,
      },
      { key: "from_date", label: "From Date", type: "date", widthClass: "w-[130px]" },
      { key: "to_date", label: "To Date", type: "date", widthClass: "w-[130px]" },
      { key: "total_days", label: "Total Days", type: "readonly", widthClass: "w-[110px]", align: "right" },
      { key: "remarks", label: "Remarks", widthClass: "min-w-[180px]" },
    ],
    []
  );

  const applyFormPatch = (patch: Partial<DprReportInput> | ((prev: DprReportInput) => Partial<DprReportInput>)) => {
    setForm((prev) =>
      applyDprCalculations(
        {
          ...prev,
          ...(typeof patch === "function" ? patch(prev) : patch),
        },
        { inclusive_hindrance_days: inclusiveHindranceDays }
      )
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setQueryProjectId(asNumber(params.get("project_id")));
    setQueryReportId(asNumber(params.get("report_id")));
    setQueryProjectName(String(params.get("project_name") || "").trim());
    setQueryScheduleId(String(params.get("schedule_id") || "").trim());
    setQueryScheduleName(String(params.get("schedule_name") || "").trim());
    setQueryDate(params.get("dpr_date") || todayDateOnly());
    setShouldAutoPrint(
      String(params.get("print") || "")
        .trim()
        .toLowerCase() === "1"
    );
    setShouldAutoExportPdf(
      String(params.get("export") || "")
        .trim()
        .toLowerCase() === "1"
    );
    setQueryReady(true);
  }, []);

  useEffect(() => {
    if (!queryReady) return;

    setResolvedProjectName("");
    setResolvedScheduleName("");

    if (!queryProjectId) return;
    if (queryScheduleId === "ALL") {
      setResolvedScheduleName("All Schedules");
    } else if (queryScheduleId === "__UNASSIGNED__") {
      setResolvedScheduleName("Unassigned");
    }

    const token = getAccessToken();
    if (!token) return;

    let active = true;
    (async () => {
      try {
        const projects = await getCompanyProjects(token);
        if (!active) return;
        const projectMatch = (projects.rows || []).find((row) => row.id === queryProjectId);
        if (projectMatch) {
          const projectLabel =
            nonPlaceholder(projectMatch.project_name, PROJECT_PLACEHOLDERS) ||
            nonPlaceholder(projectMatch.name, PROJECT_PLACEHOLDERS) ||
            normalizeLabel(projectMatch.project_code);
          if (projectLabel) setResolvedProjectName(projectLabel);
        }

        if (
          queryScheduleId &&
          queryScheduleId !== "ALL" &&
          queryScheduleId !== "__UNASSIGNED__"
        ) {
          const structures = await getCompanyProjectStructures(token, queryProjectId);
          if (!active) return;
          const scheduleMatch = (structures.rows || []).find(
            (row) => String(row.id) === String(queryScheduleId)
          );
          if (scheduleMatch?.name) setResolvedScheduleName(normalizeLabel(scheduleMatch.name));
        }
      } catch {
        // fallback to query/form labels
      }
    })();

    return () => {
      active = false;
    };
  }, [queryReady, queryProjectId, queryScheduleId]);

  const setRows = <T extends keyof DprReportInput>(
    key: T,
    rows: DprReportInput[T]
  ) => {
    applyFormPatch({ [key]: rows } as Partial<DprReportInput>);
  };

  const loadReport = async (id: number) => {
    const row = await getDprReport(id);
    setReportId(row.id);
    const normalized = toFormInput(row);
    if (!normalized.schedule_id && queryScheduleId) normalized.schedule_id = queryScheduleId;
    if (!nonPlaceholder(normalized.schedule_name, SCHEDULE_PLACEHOLDERS)) {
      normalized.schedule_name =
        nonPlaceholder(resolvedScheduleName, SCHEDULE_PLACEHOLDERS) ||
        nonPlaceholder(queryScheduleName, SCHEDULE_PLACEHOLDERS) ||
        normalized.schedule_name;
    }
    if (!nonPlaceholder(normalized.project_name, PROJECT_PLACEHOLDERS)) {
      normalized.project_name =
        nonPlaceholder(resolvedProjectName, PROJECT_PLACEHOLDERS) ||
        nonPlaceholder(queryProjectName, PROJECT_PLACEHOLDERS) ||
        normalized.project_name;
    }
    setForm(normalized);
    setMode(row.status === "submitted" && !canEditSubmitted ? "view" : "edit");
  };

  const createFreshFormForSelection = (
    projectId: number,
    projectName: string,
    scheduleId: string,
    scheduleName: string,
    dprDate: string
  ) => {
    setReportId(null);
    setMode("edit");
    setForm(
      applyDprCalculations(
        {
          ...createEmptyDprReportInput(),
          project_id: projectId,
          project_name:
            nonPlaceholder(projectName, PROJECT_PLACEHOLDERS) ||
            nonPlaceholder(resolvedProjectName, PROJECT_PLACEHOLDERS) ||
            nonPlaceholder(queryProjectName, PROJECT_PLACEHOLDERS),
          schedule_id: scheduleId,
          schedule_name:
            nonPlaceholder(scheduleName, SCHEDULE_PLACEHOLDERS) ||
            nonPlaceholder(resolvedScheduleName, SCHEDULE_PLACEHOLDERS) ||
            nonPlaceholder(queryScheduleName, SCHEDULE_PLACEHOLDERS),
          dpr_date: dprDate,
          created_by: createdByLabel(userSnapshot),
        },
        { inclusive_hindrance_days: inclusiveHindranceDays }
      )
    );
  };

  const loadExistingForSelection = async (projectId: number, dprDate: string) => {
    const response = await listDprReports({
      project_id: projectId,
      dpr_date: dprDate,
      include_rows: true,
    });
    if (!response.rows.length) return false;
    const preferred =
      response.rows.find((row) => row.status === "draft") || response.rows[0];
    await loadReport(preferred.id);
    return true;
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const user = (getStoredUser() || null) as UserSnapshot | null;
        if (active) setUserSnapshot(user);

        const token = getAccessToken();
        if (token) {
          const profileRes = await fetch("/api/proxy/company/profile", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (active && profileRes.ok) {
            const data = await profileRes.json();
            setCompanyProfile({
              company_name: data?.company_name || "",
              logo_url: data?.logo_url || "",
            });
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load DPR prerequisites.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setForm((prev) => applyDprCalculations(prev, { inclusive_hindrance_days: inclusiveHindranceDays }));
  }, [inclusiveHindranceDays]);

  useEffect(() => {
    if (loading || !queryReady || didInitRef.current) return;
    didInitRef.current = true;

    const init = async () => {
      try {
        const projectId = queryProjectId;
        const dprDate = queryDate;
        const projectName =
          nonPlaceholder(resolvedProjectName, PROJECT_PLACEHOLDERS) ||
          nonPlaceholder(queryProjectName, PROJECT_PLACEHOLDERS) ||
          nonPlaceholder(form.project_name, PROJECT_PLACEHOLDERS);
        const scheduleId = queryScheduleId || form.schedule_id || "";
        const scheduleName =
          nonPlaceholder(forcedScheduleName, SCHEDULE_PLACEHOLDERS) ||
          nonPlaceholder(resolvedScheduleName, SCHEDULE_PLACEHOLDERS) ||
          nonPlaceholder(queryScheduleName, SCHEDULE_PLACEHOLDERS) ||
          nonPlaceholder(form.schedule_name, SCHEDULE_PLACEHOLDERS);

        if (queryReportId) {
          await loadReport(queryReportId);
          return;
        }

        if (projectId) {
          const loaded = await loadExistingForSelection(projectId, dprDate);
          if (loaded) return;
          createFreshFormForSelection(projectId, projectName, scheduleId, scheduleName, dprDate);
          return;
        }

        setError("Project context is missing. Please open DPR from Project Dashboard.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to initialize DPR page.");
      }
    };

    void init();
  }, [
    loading,
    queryReady,
    queryDate,
    queryProjectId,
    queryProjectName,
    queryReportId,
    queryScheduleId,
    queryScheduleName,
    resolvedProjectName,
    resolvedScheduleName,
    forcedScheduleName,
    userSnapshot,
    inclusiveHindranceDays,
    form.project_name,
    form.schedule_id,
    form.schedule_name,
  ]);

  useEffect(() => {
    const activeProjectId = form.project_id;
    if (!activeProjectId || !form.dpr_date || queryReportId) return;
    const selectionKey = `${activeProjectId}|${form.dpr_date}`;
    if (lastSelectionKeyRef.current === selectionKey) return;
    lastSelectionKeyRef.current = selectionKey;

    let active = true;
    (async () => {
      try {
        const loaded = await loadExistingForSelection(activeProjectId, form.dpr_date);
        if (!active || loaded) return;
        createFreshFormForSelection(
          activeProjectId,
          nonPlaceholder(resolvedProjectName, PROJECT_PLACEHOLDERS) ||
            nonPlaceholder(queryProjectName, PROJECT_PLACEHOLDERS) ||
            nonPlaceholder(form.project_name, PROJECT_PLACEHOLDERS),
          queryScheduleId || form.schedule_id || "",
          nonPlaceholder(forcedScheduleName, SCHEDULE_PLACEHOLDERS) ||
            nonPlaceholder(resolvedScheduleName, SCHEDULE_PLACEHOLDERS) ||
            nonPlaceholder(queryScheduleName, SCHEDULE_PLACEHOLDERS) ||
            nonPlaceholder(form.schedule_name, SCHEDULE_PLACEHOLDERS),
          form.dpr_date
        );
      } catch {
        // silent auto-load fallback
      }
    })();
    return () => {
      active = false;
    };
  }, [
    form.project_id,
    form.dpr_date,
    form.project_name,
    form.schedule_id,
    form.schedule_name,
    queryReportId,
    queryProjectName,
    queryScheduleId,
    queryScheduleName,
    resolvedProjectName,
    resolvedScheduleName,
    forcedScheduleName,
  ]);

  useEffect(() => {
    if (!queryReady) return;

    const projectId = queryProjectId || form.project_id || null;
    const scheduleIdHint = String(queryScheduleId || form.schedule_id || "").trim();
    const scheduleNameHint =
      nonPlaceholder(queryScheduleName, SCHEDULE_PLACEHOLDERS) ||
      nonPlaceholder(form.schedule_name, SCHEDULE_PLACEHOLDERS) ||
      nonPlaceholder(resolvedScheduleName, SCHEDULE_PLACEHOLDERS);

    if (!projectId) {
      setApprovedActivityOptions([]);
      setApprovedActivityNotice("");
      lastActivityFetchKeyRef.current = "";
      return;
    }

    if (!scheduleIdHint && !scheduleNameHint) {
      setApprovedActivityOptions([]);
      setApprovedActivityNotice("Select schedule to load approved activities.");
      lastActivityFetchKeyRef.current = "";
      return;
    }

    if (scheduleIdHint === "ALL" || scheduleIdHint === "__UNASSIGNED__") {
      setApprovedActivityOptions([]);
      setApprovedActivityNotice("Select a specific schedule to load activity list.");
      lastActivityFetchKeyRef.current = "";
      return;
    }

    const fetchKey = `${projectId}|${scheduleIdHint}|${scheduleNameHint}`;
    if (lastActivityFetchKeyRef.current === fetchKey) return;
    lastActivityFetchKeyRef.current = fetchKey;

    let active = true;
    (async () => {
      setApprovedActivityLoading(true);
      setApprovedActivityNotice("");
      try {
        const scheduleRes = await getSchedules(projectId);
        if (!active) return;

        const scheduleRows = scheduleRes.rows || [];
        const numericHint = asNumber(scheduleIdHint);
        let candidates: ScheduleRow[] = [];

        if (numericHint) {
          candidates = scheduleRows.filter((row) => {
            if (Number(row.id || 0) === numericHint) return true;
            if (row.structure_id == null) return false;
            return Number(row.structure_id) === numericHint;
          });
        }

        if (!candidates.length && scheduleNameHint) {
          const token = normalizeLookupToken(scheduleNameHint);
          candidates = scheduleRows.filter((row) => {
            return (
              normalizeLookupToken(row.schedule_name) === token ||
              normalizeLookupToken(row.structure_name) === token
            );
          });
        }

        if (!candidates.length) {
          setApprovedActivityOptions([]);
          setApprovedActivityNotice("No matching schedule found in backend for this DPR context.");
          return;
        }

        const candidateScheduleIds = Array.from(
          new Set(
            candidates
              .map((row) => Number(row.id))
              .filter((value) => Number.isFinite(value) && value > 0)
          )
        );

        if (!candidateScheduleIds.length) {
          setApprovedActivityOptions([]);
          setApprovedActivityNotice("No schedule id available for activity mapping.");
          return;
        }

        const baselineResponses = await Promise.all(
          candidateScheduleIds.map(async (scheduleId) => {
            try {
              const res = await listScheduleBaselines(projectId, scheduleId);
              return res;
            } catch {
              return null;
            }
          })
        );
        if (!active) return;

        const approvedCandidates: PMOBaselineRow[] = [];
        baselineResponses.forEach((res) => {
          const latest = pickLatestApprovedBaseline(res?.rows || []);
          if (latest) approvedCandidates.push(latest);
        });

        if (!approvedCandidates.length) {
          setApprovedActivityOptions([]);
          setApprovedActivityNotice("No approved baseline found for selected schedule.");
          return;
        }

        const bestBaseline = [...approvedCandidates].sort(compareBaselinePriority)[0];
        if (!bestBaseline?.id) {
          setApprovedActivityOptions([]);
          setApprovedActivityNotice("Approved baseline details are unavailable.");
          return;
        }

        const detail = await getBaselineDetail(bestBaseline.id);
        if (!active) return;
        const rows = detail.rows || [];

        const seen = new Set<string>();
        const options: ApprovedActivityOption[] = [];
        rows.forEach((raw) => {
          if (isSummaryBaselineRow(raw)) return;
          const activityName = getBaselineActivityName(raw);
          const token = normalizeLookupToken(activityName);
          if (!token || seen.has(token)) return;
          seen.add(token);
          options.push({ label: activityName, value: activityName });
        });

        if (!options.length) {
          setApprovedActivityOptions([]);
          setApprovedActivityNotice("Approved schedule has no task activities.");
          return;
        }

        setApprovedActivityOptions(options);
        setApprovedActivityNotice("");
      } catch (err) {
        if (!active) return;
        setApprovedActivityOptions([]);
        setApprovedActivityNotice(
          err instanceof Error
            ? err.message
            : "Unable to load activity options from approved schedule."
        );
      } finally {
        if (active) setApprovedActivityLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [
    queryReady,
    queryProjectId,
    queryScheduleId,
    queryScheduleName,
    form.project_id,
    form.schedule_id,
    form.schedule_name,
    resolvedScheduleName,
  ]);

  useEffect(() => {
    if (!shouldAutoPrint || loading) return;
    const timer = setTimeout(() => {
      window.print();
    }, 450);
    return () => clearTimeout(timer);
  }, [shouldAutoPrint, loading]);

  useEffect(() => {
    if (!shouldAutoExportPdf || loading) return;
    const timer = setTimeout(() => {
      void exportDprAsPdf(reportId, form, companyProfile, {
        projectName: displayProjectName,
        scheduleName: displayScheduleName,
      }).finally(() => {
        setShouldAutoExportPdf(false);
      });
    }, 450);
    return () => clearTimeout(timer);
  }, [
    shouldAutoExportPdf,
    loading,
    reportId,
    form,
    companyProfile,
    displayProjectName,
    displayScheduleName,
  ]);

  const validateBeforeAction = (requireForSubmit: boolean): boolean => {
    const result = validateDprInput(form, {
      requireForSubmit,
      inclusive_hindrance_days: inclusiveHindranceDays,
    });
    setValidationErrors(result.errors);
    if (!result.ok) {
      setError(result.errors[0] || "Validation failed.");
      return false;
    }
    return true;
  };

  const onSaveDraft = async () => {
    setError("");
    setNotice("");
    if (!validateBeforeAction(false)) return;

    setBusy(true);
    try {
      const payload = applyDprCalculations(
        {
          ...form,
          status: form.status === "submitted" ? "submitted" : "draft",
          created_by: form.created_by || createdByLabel(userSnapshot),
        },
        { inclusive_hindrance_days: inclusiveHindranceDays }
      );

      const row = reportId
        ? await updateDprReport(reportId, payload, {
            allow_edit_submitted: canEditSubmitted,
            inclusive_hindrance_days: inclusiveHindranceDays,
          })
        : await createDprReport(payload, {
            inclusive_hindrance_days: inclusiveHindranceDays,
          });

      setReportId(row.id);
      setForm(toFormInput(row));
      setMode("edit");
      setNotice("Draft saved successfully.");
      setValidationErrors([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save draft.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async () => {
    if (!canSubmitDpr) {
      setError("Only Project Manager or Company Admin can submit DPR.");
      return;
    }
    setError("");
    setNotice("");
    if (!validateBeforeAction(true)) return;

    setBusy(true);
    try {
      const payload = applyDprCalculations(
        {
          ...form,
          created_by: form.created_by || createdByLabel(userSnapshot),
        },
        { inclusive_hindrance_days: inclusiveHindranceDays }
      );

      let id = reportId;
      if (!id) {
        const created = await createDprReport(
          {
            ...payload,
            status: "draft",
          },
          { inclusive_hindrance_days: inclusiveHindranceDays }
        );
        id = created.id;
      } else {
        await updateDprReport(id, payload, {
          allow_edit_submitted: canEditSubmitted,
          inclusive_hindrance_days: inclusiveHindranceDays,
        });
      }

      const submitted = await submitDprReport(id as number);
      setReportId(submitted.id);
      setForm(toFormInput(submitted));
      setMode("view");
      setNotice("DPR submitted successfully. It is now read-only unless role has edit rights.");
      setValidationErrors([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit DPR.");
    } finally {
      setBusy(false);
    }
  };

  const autoGrowTextarea = (
    event: React.FormEvent<HTMLTextAreaElement> | React.FocusEvent<HTMLTextAreaElement>
  ) => {
    const target = event.currentTarget;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#5a3019] via-[#764326] to-[#8a5535] p-6 text-white">
        <div className="mx-auto max-w-7xl">Loading DPR workspace...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#5a3019] via-[#764326] to-[#8a5535] p-4 md:p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-7xl space-y-4 print:max-w-none print:space-y-2">
        <section className="print:hidden">
          <Link
            href={backToProjectDashboardHref}
            className="inline-flex rounded-lg border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/20"
          >
            Back to Project Dashboard
          </Link>
        </section>

        <section className="print:hidden">
          <CompanyPageHeader />
        </section>

        <section className="hidden border-b border-[#d8c4b5] pb-2 print:block">
          <div className="flex items-start gap-3">
            {printLogoSrc ? (
              <img src={printLogoSrc} alt={displayCompanyName} className="h-12 w-auto object-contain" />
            ) : null}
            <div>
              <p className="text-base font-black text-[#4a2c1d]">{displayCompanyName}</p>
              <p className="text-sm font-bold text-slate-900">{displayProjectName}</p>
              <p className="text-xs font-semibold text-[#6f4b37]">{displayScheduleName}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-white shadow-xl print:hidden">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={busy || readOnly}
              className="rounded-lg border border-[#3f2418] bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitDisabled}
              title={canSubmitDpr ? "Submit DPR" : "Only Project Manager or Company Admin can submit DPR"}
              className="rounded-lg border border-slate-800 bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              Submit DPR
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-white/35 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
            >
              Print
            </button>
            <button
              type="button"
              onClick={() => {
                void exportDprAsPdf(reportId, form, companyProfile, {
                  projectName: displayProjectName,
                  scheduleName: displayScheduleName,
                });
              }}
              className="rounded-lg border border-white/35 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
            >
              Export PDF
            </button>
          </div>
          {!canSubmitDpr ? (
            <p className="mt-2 text-xs font-semibold text-amber-100">
              Submit DPR is enabled only for Project Manager or Company Admin login.
            </p>
          ) : null}
          {notice ? <p className="mt-2 text-xs font-semibold text-emerald-200">{notice}</p> : null}
          {error ? <p className="mt-2 text-xs font-semibold text-rose-200">{error}</p> : null}
          {validationErrors.length > 1 ? (
            <div className="mt-2 rounded-lg border border-rose-200/30 bg-rose-500/15 p-2 text-xs text-rose-100">
              {validationErrors.slice(0, 5).map((item, index) => (
                <p key={index}>- {item}</p>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[#d7c0af] bg-white p-4 shadow-[0_12px_30px_rgba(35,13,3,0.14)] print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
          <div className="mt-1 rounded-xl border border-slate-200 bg-[#f7ebe1] px-4 py-3 text-center">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-900 print:text-base">
              DAILY PROGRESS REPORT
            </h2>
            <p className="mt-2 text-sm font-black text-[#4a2c1d]">
              {displayProjectName}{" "}
              <span className="px-2 text-[#9a7b66]">|</span>
              {displayScheduleName}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#6f4b36]">
              Reporting Date: {form.dpr_date || queryDate}
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 print:mt-2 print:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-900">
              Today's Visitors
              <textarea
                value={form.todays_visitors}
                onChange={(event) => applyFormPatch({ todays_visitors: event.target.value })}
                onInput={autoGrowTextarea}
                onFocus={autoGrowTextarea}
                disabled={readOnly}
                rows={1}
                maxLength={SUMMARY_TEXT_LIMIT}
                className="mt-1 min-h-[42px] w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#4a2c1d] outline-none focus:border-[#ab7a56] disabled:bg-[#f5eee9]"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-900">
              Safety / Security Incident
              <textarea
                value={form.safety_security_incidence}
                onChange={(event) =>
                  applyFormPatch({ safety_security_incidence: event.target.value })
                }
                onInput={autoGrowTextarea}
                onFocus={autoGrowTextarea}
                disabled={readOnly}
                rows={1}
                maxLength={SUMMARY_TEXT_LIMIT}
                className="mt-1 min-h-[42px] w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#4a2c1d] outline-none focus:border-[#ab7a56] disabled:bg-[#f5eee9]"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 print:mt-2 print:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-900">
              Pending Decision / Drawing Requirements
              <textarea
                value={form.pending_decisions_drawing_requirements}
                onChange={(event) =>
                  applyFormPatch({
                    pending_decisions_drawing_requirements: event.target.value,
                  })
                }
                onInput={autoGrowTextarea}
                onFocus={autoGrowTextarea}
                disabled={readOnly}
                rows={1}
                maxLength={SUMMARY_TEXT_LIMIT}
                className="mt-1 min-h-[42px] w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#4a2c1d] outline-none focus:border-[#ab7a56] disabled:bg-[#f5eee9]"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-900">
              Other Critical Issues
              <textarea
                value={form.critical_points}
                onChange={(event) => applyFormPatch({ critical_points: event.target.value })}
                onInput={autoGrowTextarea}
                onFocus={autoGrowTextarea}
                disabled={readOnly}
                rows={1}
                maxLength={SUMMARY_TEXT_LIMIT}
                className="mt-1 min-h-[42px] w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#4a2c1d] outline-none focus:border-[#ab7a56] disabled:bg-[#f5eee9]"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 print:mt-2 print:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-900">
              Red Alert
              <textarea
                value={form.red_alert}
                onChange={(event) => applyFormPatch({ red_alert: event.target.value })}
                onInput={autoGrowTextarea}
                onFocus={autoGrowTextarea}
                disabled={readOnly}
                rows={1}
                maxLength={SUMMARY_TEXT_LIMIT}
                className="mt-1 min-h-[42px] w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#4a2c1d] outline-none focus:border-[#ab7a56] disabled:bg-[#f5eee9]"
              />
            </label>
            <div className="rounded-lg border border-slate-200 bg-[#fffdfb] p-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                Weather Condition *
                <select
                  value={form.weather}
                  onChange={(event) => applyFormPatch({ weather: event.target.value })}
                  disabled={readOnly}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#4a2c1d] outline-none focus:border-[#ab7a56] disabled:bg-[#f5eee9]"
                >
                  <option value="">Select weather</option>
                  {WEATHER_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-2 block text-xs font-semibold uppercase tracking-wide text-slate-900">
                Weather Impact on Activities
                <textarea
                  value={form.weather_impact_details || ""}
                  onChange={(event) => applyFormPatch({ weather_impact_details: event.target.value })}
                  onInput={autoGrowTextarea}
                  onFocus={autoGrowTextarea}
                  disabled={readOnly}
                  rows={1}
                  maxLength={SUMMARY_TEXT_LIMIT}
                  placeholder="Mention affected activities due to weather conditions"
                  className="mt-1 min-h-[42px] w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#4a2c1d] outline-none focus:border-[#ab7a56] disabled:bg-[#f5eee9]"
                />
              </label>
            </div>
          </div>
        </section>

        <RepeatableTableSection<DprDailyWorkProgressItem>
          title="Section 1: Today's Work Progress"
          description={
            approvedActivityLoading
              ? "Loading activity list from approved schedule..."
              : approvedActivityNotice
              ? approvedActivityNotice
              : "Activity list is fetched from approved schedule. Enter sub-activity and daily progress."
          }
          rows={form.daily_work_progress_items}
          columns={dailyColumns}
          createEmptyRow={createEmptyDailyWorkProgressItem}
          onRowsChange={(rows) => setRows("daily_work_progress_items", rows)}
          readOnly={readOnly}
        />

        <RepeatableTableSection<DprManpowerDeploymentItem>
          title="Section 2: Manpower Deployment"
          description="Capture contractor-wise manpower deployment. Total is auto-calculated."
          rows={form.manpower_deployment_items}
          columns={manpowerColumns}
          createEmptyRow={createEmptyManpowerDeploymentItem}
          onRowsChange={(rows) => setRows("manpower_deployment_items", rows)}
          readOnly={readOnly}
          footer={
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#deccbf] bg-[#f7eee8] px-3 py-2 text-xs font-semibold text-[#5a3622]">
              total_manpower_sum: <span className="text-sm font-black">{form.total_manpower_sum}</span>
            </div>
          }
        />

        <RepeatableTableSection<DprMachineryEquipmentItem>
          title="Section 3: Machinery & Equipment Deployment"
          description="hours is auto-derived from from_time/to_time when empty, and can be manually overridden."
          rows={form.machinery_equipment_items}
          columns={machineryColumns}
          createEmptyRow={createEmptyMachineryEquipmentItem}
          onRowsChange={(rows) => setRows("machinery_equipment_items", rows)}
          readOnly={readOnly}
        />

        <RepeatableTableSection<DprMaterialProcurementItem>
          title="Section 4: Material Procurement"
          rows={form.material_procurement_items}
          columns={materialColumns}
          createEmptyRow={createEmptyMaterialProcurementItem}
          onRowsChange={(rows) => setRows("material_procurement_items", rows)}
          readOnly={readOnly}
        />

        <RepeatableTableSection<DprMaterialIssueConsumptionItem>
          title="Section 5: MATERIAL ISSUE / CONSUPTION REPORT"
          rows={form.material_issue_consumption_items}
          columns={materialIssueConsumptionColumns}
          createEmptyRow={createEmptyMaterialIssueConsumptionItem}
          onRowsChange={(rows) => setRows("material_issue_consumption_items", rows)}
          readOnly={readOnly}
        />

        <RepeatableTableSection<DprDeviationReportItem>
          title="Section 6: Deviation Report"
          description="deviation = actual_qty - planned_qty"
          rows={form.deviation_report_items}
          columns={deviationColumns}
          createEmptyRow={createEmptyDeviationReportItem}
          onRowsChange={(rows) => setRows("deviation_report_items", rows)}
          readOnly={readOnly}
        />

        <RepeatableTableSection<DprRiskManagementItem>
          title="Section 7: Risk Management"
          rows={form.risk_management_items}
          columns={riskColumns}
          createEmptyRow={createEmptyRiskManagementItem}
          onRowsChange={(rows) => setRows("risk_management_items", rows)}
          readOnly={readOnly}
        />

        <RepeatableTableSection<DprHindranceReportItem>
          title="Section 8: Hindrance Report"
          description="total_days auto-calculated from from_date and to_date."
          rows={form.hindrance_report_items}
          columns={hindranceColumns}
          createEmptyRow={createEmptyHindranceReportItem}
          onRowsChange={(rows) => setRows("hindrance_report_items", rows)}
          readOnly={readOnly}
          footer={
            <label className="inline-flex items-center gap-2 rounded-lg border border-[#deccbf] bg-[#f7eee8] px-3 py-2 text-xs font-semibold text-[#5a3622]">
              <input
                type="checkbox"
                checked={inclusiveHindranceDays}
                onChange={(event) => setInclusiveHindranceDays(event.target.checked)}
                disabled={readOnly}
              />
              Inclusive day count (default enabled)
            </label>
          }
        />

        <section className="rounded-2xl border border-[#deccbf] bg-white p-4 shadow-[0_10px_24px_rgba(44,19,5,0.1)]">
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-900">
            Signature / Closing
          </h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[#ddcabd] bg-white p-3">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-900">
                DPR Created By
              </p>
              <label className="mt-2 block text-xs font-semibold uppercase tracking-wide text-slate-900">
                Name of Engineer
                <input
                  value={form.site_engineer_name}
                  onChange={(event) => applyFormPatch({ site_engineer_name: event.target.value })}
                  disabled={readOnly}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#4a2c1d] outline-none focus:border-[#ab7a56] disabled:bg-[#f5eee9]"
                />
              </label>
              <label className="mt-2 block text-xs font-semibold uppercase tracking-wide text-slate-900">
                Designation
                <input
                  value={form.site_engineer_designation || ""}
                  onChange={(event) =>
                    applyFormPatch({ site_engineer_designation: event.target.value } as Partial<DprReportInput>)
                  }
                  disabled={readOnly}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#4a2c1d] outline-none focus:border-[#ab7a56] disabled:bg-[#f5eee9]"
                />
              </label>
            </div>
            <div className="rounded-xl border border-[#ddcabd] bg-white p-3">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-900">
                DPR Verified and Submitted By
              </p>
              <label className="mt-2 block text-xs font-semibold uppercase tracking-wide text-slate-900">
                Name of Project Head / Project Manager / Project In-Charge
                <input
                  value={form.project_manager_name}
                  onChange={(event) => applyFormPatch({ project_manager_name: event.target.value })}
                  disabled={readOnly}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#4a2c1d] outline-none focus:border-[#ab7a56] disabled:bg-[#f5eee9]"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={busy || readOnly}
              className="rounded-lg border border-[#3f2418] bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitDisabled}
              title={canSubmitDpr ? "Submit DPR" : "Only Project Manager or Company Admin can submit DPR"}
              className="rounded-lg border border-slate-800 bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              Submit DPR
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-[#d2bdaa] bg-[#f4e7de] px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-900"
            >
              Print
            </button>
            <button
              type="button"
              onClick={() => {
                void exportDprAsPdf(reportId, form, companyProfile, {
                  projectName: displayProjectName,
                  scheduleName: displayScheduleName,
                });
              }}
              className="rounded-lg border border-[#d2bdaa] bg-[#f4e7de] px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-900"
            >
              Export PDF
            </button>
          </div>

        </section>
      </div>
    </main>
  );
}
