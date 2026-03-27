"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ClipboardCheck, Save } from "lucide-react";
import {
  getProjects,
  getSchedules,
  type ProjectRow,
  type ScheduleRow,
} from "@/app/services/projectControlService";
import {
  getBaselineDetail,
  listScheduleBaselines,
  requestBaselineRevoke,
  type PMOBaselineRow,
} from "@/app/services/pmoScheduleApprovalService";
import {
  listScheduleImplementationRecords,
  saveScheduleImplementationDraft,
  submitScheduleImplementation,
} from "@/app/services/scheduleImplementationService";
import { saveProjectMisMasterRows } from "@/app/services/projectMisService";

const GRID_PAGE_SIZE_OPTIONS = [50, 100, 200, 500] as const;
const TABLE_MIN_WIDTH = 1250;

type ImplColumnKey =
  | "no"
  | "activity"
  | "duration"
  | "start"
  | "finish"
  | "unit"
  | "projectQty"
  | "qtyDone";

const DEFAULT_COLUMN_WIDTHS: Record<ImplColumnKey, number> = {
  no: 44,
  activity: 610,
  duration: 60,
  start: 100,
  finish: 100,
  unit: 110,
  projectQty: 100,
  qtyDone: 120,
};

const MIN_COLUMN_WIDTHS: Record<ImplColumnKey, number> = {
  no: 36,
  activity: 260,
  duration: 52,
  start: 84,
  finish: 84,
  unit: 90,
  projectQty: 90,
  qtyDone: 96,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ImplementationLine = {
  key: string;
  sl_no: number;
  activity_id: number | null;
  wbs_code: string;           // "1", "1.1", "1.1.1" — shown as inline ID prefix
  activity_name: string;
  activity_type: string;      // "TASK" | "SUMMARY" | "MILESTONE"
  indent_level: number;
  duration_days: number;
  start_date: string;
  finish_date: string;
  predecessors: string;
  unit: string;               // editable
  planned_qty: number | null; // editable
  font_weight: string;
  font_style: string;
  font_color: string;
  completed_qty_before_start: number; // editable
};

function createLineKey() {
  return `impl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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

function mapBaselineToLines(rawRows: Record<string, any>[]): ImplementationLine[] {
  return rawRows
    .map((raw, index) => {
      const name = String(raw?.activityName || raw?.taskName || "").trim();
      if (!name) return null;
      return {
        key: createLineKey(),
        sl_no: index + 1,
        activity_id: toNum(raw?.activityId) || null,
        wbs_code: String(raw?.wbsCode || raw?.wbs_code || "").trim(),
        activity_name: name,
        activity_type: String(raw?.activityType || "TASK").toUpperCase(),
        indent_level: Math.max(0, Number(raw?.indentLevel ?? raw?.outlineLevel ?? 0)),
        duration_days: Math.max(0, Number(raw?.durationDays || 0)),
        start_date: String(raw?.startDate || raw?.start_date || "").trim(),
        finish_date: String(raw?.finishDate || raw?.endDate || raw?.end_date || "").trim(),
        predecessors: String(raw?.predecessors || "").trim(),
        unit: String(raw?.unit || "").trim(),
        planned_qty: raw?.plannedQty != null ? Math.max(0, toNum(raw.plannedQty)) : null,
        font_weight: String(raw?.fontWeight || "normal"),
        font_style: String(raw?.fontStyle || "normal"),
        font_color: String(raw?.fontColor || "#0F172A"),
        completed_qty_before_start: 0,
      } satisfies ImplementationLine;
    })
    .filter((r): r is ImplementationLine => r !== null);
}

const IMPL_HIDEABLE_COLS = [
  { key: "duration",   label: "Duration" },
  { key: "start",      label: "Start Date" },
  { key: "finish",     label: "Finish Date" },
  { key: "unit",       label: "Unit" },
  { key: "projectQty", label: "Project Qty" },
  { key: "qtyDone",    label: "Qty Done Till Prev Day" },
] as const;

const IMPL_HIDEABLE_COL_RATIOS: Record<string, number> = {
  duration: 0.06, start: 0.09, finish: 0.09, unit: 0.09, projectQty: 0.09, qtyDone: 0.09,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScheduleImplementationPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [baselines, setBaselines] = useState<PMOBaselineRow[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [selectedBaselineId, setSelectedBaselineId] = useState<number>(0);
  const [implementationDate, setImplementationDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const [rows, setRows] = useState<ImplementationLine[]>([]);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [recordStatus, setRecordStatus] = useState<
    "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
  >("DRAFT");

  const [gridPageSize, setGridPageSize] = useState<number>(100);
  const [gridPage, setGridPage] = useState<number>(1);
  const [columnWidths, setColumnWidths] =
    useState<Record<ImplColumnKey, number>>(DEFAULT_COLUMN_WIDTHS);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [returningToBuilder, setReturningToBuilder] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [approvedImplBaselineIds, setApprovedImplBaselineIds] = useState<Set<number>>(new Set());
  const [viewLevelFilter, setViewLevelFilter] = useState<"ALL" | "LEVEL2" | "LEVEL3">("ALL");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [viewHiddenCols, setViewHiddenCols] = useState<Set<string>>(new Set());
  const [viewColPickerOpen, setViewColPickerOpen] = useState(false);
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollSyncRef = useRef(false);
  const resizeStateRef = useRef<{
    columnKey: ImplColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);

  const isEditable = recordStatus === "DRAFT" || recordStatus === "REJECTED";

  const filteredRows = useMemo(() => {
    if (viewLevelFilter === "ALL") return rows;
    const maxLevel = viewLevelFilter === "LEVEL2" ? 1 : 2;
    return rows.filter((r) => r.indent_level <= maxLevel);
  }, [rows, viewLevelFilter]);

  const visibleColCount = 2 + IMPL_HIDEABLE_COLS.filter((c) => !viewHiddenCols.has(c.key)).length;

  const selectedProjectName = useMemo(
    () => projects.find((r) => r.id === selectedProjectId)?.project_name || "",
    [projects, selectedProjectId]
  );
  const selectedScheduleName = useMemo(
    () => schedules.find((r) => String(r.id) === selectedScheduleId)?.schedule_name || "",
    [schedules, selectedScheduleId]
  );
  const selectedBaseline = useMemo(
    () => baselines.find((r) => r.id === selectedBaselineId) || null,
    [baselines, selectedBaselineId]
  );
  const canReturnToBuilder = Boolean(
    selectedBaseline &&
      recordStatus !== "APPROVED" &&
      String(selectedBaseline.revoke_request_status || "NONE").toUpperCase() !== "PENDING"
  );

  // Pagination (uses filteredRows so level filter applies to paging too)
  const totalGridPages = Math.max(1, Math.ceil(filteredRows.length / gridPageSize));
  const currentGridPage = Math.min(Math.max(gridPage, 1), totalGridPages);
  const gridPageStartIndex = (currentGridPage - 1) * gridPageSize;
  const pagedRows = filteredRows.slice(gridPageStartIndex, gridPageStartIndex + gridPageSize);
  const tableWidth = useMemo(
    () =>
      Math.max(
        TABLE_MIN_WIDTH,
        Object.keys(DEFAULT_COLUMN_WIDTHS).reduce((sum, key) => {
          if (viewHiddenCols.has(key)) return sum;
          const colKey = key as ImplColumnKey;
          const value = Number(columnWidths[colKey] ?? DEFAULT_COLUMN_WIDTHS[colKey]);
          return sum + Math.max(MIN_COLUMN_WIDTHS[colKey], value);
        }, 0)
      ),
    [columnWidths, viewHiddenCols]
  );

  function getColumnWidth(key: ImplColumnKey) {
    return Math.max(MIN_COLUMN_WIDTHS[key], Number(columnWidths[key] ?? DEFAULT_COLUMN_WIDTHS[key]));
  }

  function openReturnModal() {
    if (!selectedBaseline?.id) {
      setError("Select a pre-approved baseline first.");
      return;
    }
    setReturnReason("");
    setError("");
    setReturnModalOpen(true);
  }

  async function handleReturnToBuilder() {
    if (!selectedBaseline?.id) {
      setError("Select a pre-approved baseline first.");
      return;
    }
    const reason = returnReason.trim();
    if (!reason) {
      setError("Please enter a reason before returning to Schedule Builder.");
      return;
    }
    try {
      setReturningToBuilder(true);
      setError("");
      const res = await requestBaselineRevoke(selectedBaseline.id, { note: reason });
      setReturnModalOpen(false);
      setNotice(
        `Return request sent for baseline B${res.row?.baseline_no || selectedBaseline.baseline_no}. Schedule Builder corrections can be done after Company Admin approval.`
      );
      if (selectedProjectId && selectedScheduleId) {
        await loadBaselines(selectedProjectId, Number(selectedScheduleId));
      }
    } catch (e: any) {
      setError(e?.message || "Failed to return schedule to Schedule Builder.");
    } finally {
      setReturningToBuilder(false);
    }
  }

  async function printPdfBlob(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const frame = document.createElement("iframe");
      let completed = false;
      const finish = (error?: Error) => {
        if (completed) return;
        completed = true;
        setTimeout(() => { URL.revokeObjectURL(url); frame.remove(); }, 1200);
        if (error) reject(error); else resolve();
      };
      frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;";
      frame.setAttribute("aria-hidden", "true");
      frame.onload = () => {
        const fw = frame.contentWindow;
        if (!fw) { finish(new Error("Unable to open print document.")); return; }
        fw.focus();
        let handled = false;
        fw.onafterprint = () => { handled = true; finish(); };
        setTimeout(() => { try { fw.print(); } catch { finish(new Error("Print dialog failed.")); } }, 120);
        setTimeout(() => { if (!handled) finish(); }, 4500);
      };
      frame.onerror = () => finish(new Error("Unable to load print preview."));
      frame.src = url;
      document.body.appendChild(frame);
    });
  }

  async function runImplExport(mode: "PDF" | "PRINT") {
    if (!filteredRows.length) {
      setError("No activities to export.");
      return;
    }
    try {
      setExportingPdf(true);
      setError("");
      const selectedBaseline = baselines.find((r) => r.id === selectedBaselineId);
      const baselineLabel = selectedBaseline
        ? `B${selectedBaseline.baseline_no} — ${approvedImplBaselineIds.has(selectedBaseline.id) ? "Approved (Final)" : "Pre-Approved"}`
        : "Baseline";
      const levelLabel = viewLevelFilter === "ALL" ? "All Levels" : viewLevelFilter === "LEVEL2" ? "Upto Level 2" : "Upto Level 3";

      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3", compress: true });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const ml = 28, mr = 28, mt = 44, mb = 20;
      const usableW = pageW - ml - mr;

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Schedule Implementation", ml, mt - 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`${baselineLabel}  ·  ${levelLabel}`, ml, mt - 8);

      type ImplOptCol = { key: string; head: string; cell: (r: typeof filteredRows[number]) => string };
      const allOptCols: ImplOptCol[] = [
        { key: "duration",   head: "Dur.",          cell: (r) => String(r.duration_days ?? "") },
        { key: "start",      head: "Start",         cell: (r) => r.start_date || "" },
        { key: "finish",     head: "Finish",        cell: (r) => r.finish_date || "" },
        { key: "unit",       head: "Unit",          cell: (r) => r.unit || "" },
        { key: "projectQty", head: "Project Qty",   cell: (r) => r.planned_qty != null ? String(r.planned_qty) : "" },
        { key: "qtyDone",    head: "Qty Done",      cell: (r) => String(r.completed_qty_before_start ?? "") },
      ];
      const visOptCols = allOptCols.filter((c) => !viewHiddenCols.has(c.key));
      const sumOptRatios = visOptCols.reduce((s, c) => s + (IMPL_HIDEABLE_COL_RATIOS[c.key] ?? 0.08), 0);
      const actRatio = Math.max(0.22, 1 - 0.04 - sumOptRatios);

      const head = [["No", "Activity", ...visOptCols.map((c) => c.head)]];
      const body = filteredRows.map((row, idx) => [
        String(idx + 1),
        `${"  ".repeat(Math.max(0, row.indent_level))}${row.wbs_code ? `${row.wbs_code} ` : ""}${row.activity_name || ""}`,
        ...visOptCols.map((c) => c.cell(row)),
      ]);

      const colRatios = [0.04, actRatio, ...visOptCols.map((c) => IMPL_HIDEABLE_COL_RATIOS[c.key] ?? 0.08)];
      const columnStyles = colRatios.reduce<Record<number, { cellWidth: number }>>((acc, r, i) => {
        acc[i] = { cellWidth: Math.max(32, usableW * r) };
        return acc;
      }, {});

      autoTable(doc, {
        head,
        body,
        startY: mt,
        margin: { left: ml, right: mr, top: mt, bottom: mb },
        styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [74, 42, 27], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
        columnStyles,
        didParseCell: (data) => {
          if (data.section === "body") {
            const row = filteredRows[data.row.index];
            if (!row) return;
            const isSummary = row.activity_type === "SUMMARY";
            const fw = isSummary || String(row.font_weight || "").toLowerCase() === "bold" ? "bold" : "normal";
            const fi = String(row.font_style || "").toLowerCase() === "italic" ? "italic" : "normal";
            data.cell.styles.fontStyle = fw === "bold" && fi === "italic" ? "bolditalic" : fw === "bold" ? "bold" : fi === "italic" ? "italic" : "normal";
            if (isSummary) data.cell.styles.fillColor = [247, 237, 224];
          }
        },
        didDrawPage: (data) => {
          const pg = (doc as any).internal.getCurrentPageInfo().pageNumber;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.text(`Page ${pg}`, pageW - mr, pageH - 6, { align: "right" });
        },
      });

      if (mode === "PDF") {
        doc.save(`schedule-implementation-${baselineLabel.replace(/\s+/g, "_")}.pdf`);
        setNotice("PDF saved.");
      } else {
        const blob = doc.output("blob");
        await printPdfBlob(blob);
        setNotice("Print dialog opened.");
      }
    } catch (err: any) {
      setError(err?.message || "Export failed.");
    } finally {
      setExportingPdf(false);
    }
  }

  function syncHorizontalScroll(source: "top" | "table") {
    const top = topScrollRef.current;
    const table = tableScrollRef.current;
    if (!top || !table) return;
    if (scrollSyncRef.current) return;
    scrollSyncRef.current = true;
    if (source === "top") {
      table.scrollLeft = top.scrollLeft;
    } else {
      top.scrollLeft = table.scrollLeft;
    }
    requestAnimationFrame(() => {
      scrollSyncRef.current = false;
    });
  }

  function startColumnResize(columnKey: ImplColumnKey, event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    resizeStateRef.current = {
      columnKey,
      startX: event.clientX,
      startWidth: getColumnWidth(columnKey),
    };
  }

  // ── Load on mount ────────────────────────────────────────────────────────────
  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setSchedules([]);
      setSelectedScheduleId("");
      return;
    }
    void loadSchedules(selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId || !selectedScheduleId) {
      setBaselines([]);
      setSelectedBaselineId(0);
      setRows([]);
      setRecordId(null);
      setRecordStatus("DRAFT");
      return;
    }
    void loadBaselines(selectedProjectId, Number(selectedScheduleId));
  }, [selectedProjectId, selectedScheduleId]);

  useEffect(() => {
    if (!selectedProjectId || !selectedScheduleId || !selectedBaselineId) {
      setRows([]);
      setRecordId(null);
      setRecordStatus("DRAFT");
      return;
    }
    void loadImplementationRecord(selectedProjectId, selectedScheduleId, selectedBaselineId);
  }, [selectedProjectId, selectedScheduleId, selectedBaselineId]);

  useEffect(() => {
    const top = topScrollRef.current;
    const table = tableScrollRef.current;
    if (!top || !table) return;
    top.scrollLeft = table.scrollLeft;
  }, [rows.length, currentGridPage, gridPageSize]);

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      const active = resizeStateRef.current;
      if (!active) return;
      const delta = event.clientX - active.startX;
      const nextWidth = Math.max(
        MIN_COLUMN_WIDTHS[active.columnKey],
        Math.round(active.startWidth + delta)
      );
      setColumnWidths((prev) => {
        if (prev[active.columnKey] === nextWidth) return prev;
        return { ...prev, [active.columnKey]: nextWidth };
      });
    }

    function handleMouseUp() {
      resizeStateRef.current = null;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // ── Data loaders ─────────────────────────────────────────────────────────────
  async function loadProjects() {
    try {
      setLoading(true);
      setError("");
      const res = await getProjects();
      const list = res.rows || [];
      setProjects(list);
      if (list.length) setSelectedProjectId(list[0].id);
    } catch (e: any) {
      setError(e?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSchedules(projectId: number) {
    try {
      setError("");
      const res = await getSchedules(projectId);
      const list = res.rows || [];
      setSchedules(list);
      if (list.length) setSelectedScheduleId(String(list[0].id));
      else setSelectedScheduleId("");
    } catch (e: any) {
      setError(e?.message || "Failed to load schedules.");
      setSchedules([]);
      setSelectedScheduleId("");
    }
  }

  async function loadBaselines(projectId: number, scheduleId: number) {
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
      const approved = (res.rows || [])
        .filter((r) => String(r.status || "").toUpperCase() === "APPROVED")
        .sort((a, b) => Number(b.baseline_no || 0) - Number(a.baseline_no || 0));
      setBaselines(approved);
      setSelectedBaselineId(approved[0]?.id || 0);
      if (!approved.length) {
        setRows([]);
        setNotice("No pre-approved baseline. Submit from Schedule Builder first.");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load baselines.");
      setBaselines([]);
      setSelectedBaselineId(0);
    }
  }

  async function loadImplementationRecord(
    projectId: number,
    scheduleId: string,
    baselineId: number
  ) {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      const [existingRes, detailRes] = await Promise.all([
        listScheduleImplementationRecords({
          project_id: projectId,
          schedule_id: scheduleId,
          baseline_id: baselineId,
        }),
        getBaselineDetail(baselineId),
      ]);

      // Always build display rows from baseline — preserves wbsCode, indentLevel, fonts
      const rawRows = Array.isArray(detailRes.rows) ? detailRes.rows : [];
      const displayRows = mapBaselineToLines(rawRows);

      const existing = (existingRes.rows || [])[0] || null;
      if (existing) {
        setRecordId(existing.id);
        setRecordStatus(existing.status);
        setImplementationDate(
          existing.implementation_date || new Date().toISOString().slice(0, 10)
        );
        // Overlay saved unit, project_qty, completed_qty onto baseline rows
        type Ov = { unit: string; planned_qty: number | null; qty: number };
        const savedMap = new Map<string, Ov>();
        for (const saved of existing.rows || []) {
          const k = saved.activity_id
            ? `id:${saved.activity_id}`
            : `name:${saved.activity_name}`;
          savedMap.set(k, {
            unit: String(saved.unit || ""),
            planned_qty:
              saved.project_qty != null ? Math.max(0, toNum(saved.project_qty)) : null,
            qty: Math.max(0, toNum(saved.completed_qty_before_start)),
          });
        }
        setRows(
          displayRows.map((row) => {
            const k = row.activity_id
              ? `id:${row.activity_id}`
              : `name:${row.activity_name}`;
            const ov = savedMap.get(k);
            if (!ov) return row;
            return {
              ...row,
              unit: ov.unit !== "" ? ov.unit : row.unit,
              planned_qty: ov.planned_qty !== null ? ov.planned_qty : row.planned_qty,
              completed_qty_before_start: ov.qty,
            };
          })
        );
      } else {
        setRows(displayRows);
        setRecordId(null);
        setRecordStatus("DRAFT");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load implementation data.");
      setRows([]);
      setRecordId(null);
      setRecordStatus("DRAFT");
    } finally {
      setLoading(false);
    }
  }

  // ── Row updaters ──────────────────────────────────────────────────────────────
  function updateField(globalIdx: number, value: string) {
    if (!isEditable) return;
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== globalIdx) return r;
        return { ...r, completed_qty_before_start: Math.max(0, toNum(value)) };
      })
    );
  }

  // ── Save / Submit ─────────────────────────────────────────────────────────────
  async function syncWithMisMaster(currentRows: ImplementationLine[]) {
    if (!selectedProjectId || !selectedScheduleId) return;
    await saveProjectMisMasterRows({
      project_id: selectedProjectId,
      schedule_id: selectedScheduleId,
      reference_date: implementationDate,
      rows: currentRows
        .filter((r) => r.activity_type !== "SUMMARY")
        .map((row) => ({
          activity: row.activity_name,
          sub_activity: row.activity_name,
          unit: row.unit,
          project_qty: row.planned_qty ?? 0,
          total_qty_done_till_last_month: row.completed_qty_before_start,
        })),
    });
  }

  async function handleSaveDraft() {
    if (!selectedProjectId || !selectedScheduleId || !selectedBaseline) {
      setError("Select project, schedule, and baseline first.");
      return null;
    }
    if (!rows.length) {
      setError("No rows available.");
      return null;
    }
    try {
      setBusy(true);
      setError("");
      const saved = await saveScheduleImplementationDraft({
        id: recordId || undefined,
        project_id: selectedProjectId,
        project_name: selectedProjectName,
        schedule_id: selectedScheduleId,
        schedule_name: selectedScheduleName,
        baseline_id: selectedBaseline.id,
        baseline_no: selectedBaseline.baseline_no,
        implementation_date: implementationDate,
        rows: rows
          .filter((r) => r.activity_type !== "SUMMARY")
          .map((r, i) => ({
            sr_no: i + 1,
            activity_id: r.activity_id,
            wbs_code: r.wbs_code,
            activity_name: r.activity_name,
            start_date: r.start_date,
            end_date: r.finish_date,
            unit: r.unit,
            project_qty: r.planned_qty ?? 0,
            completed_qty_before_start: r.completed_qty_before_start,
          })),
      });
      await syncWithMisMaster(rows);
      setRecordId(saved.id);
      setRecordStatus(saved.status);
      setNotice(`Draft saved for B${saved.baseline_no}. Submit for final approval after verification.`);
      return saved;
    } catch (e: any) {
      setError(e?.message || "Failed to save draft.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    try {
      setError("");
      const saved = await handleSaveDraft();
      if (!saved) return;
      setBusy(true);
      const submitted = await submitScheduleImplementation(saved.id, {
        actor: "PMO",
        note: "Submitted for final approval by planning team.",
      });
      setRecordId(submitted.id);
      setRecordStatus(submitted.status);
      setNotice(`B${submitted.baseline_no} submitted for final approval.`);
    } catch (e: any) {
      setError(e?.message || "Failed to submit.");
    } finally {
      setBusy(false);
    }
  }

  // ── Pagination controls ───────────────────────────────────────────────────────
  const paginationControls = rows.length > 0 ? (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
        Rows / page
        <select
          className="rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs text-slate-900 outline-none"
          value={gridPageSize}
          onChange={(e) => { setGridPageSize(Number(e.target.value)); setGridPage(1); }}
        >
          {GRID_PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <button
        type="button"
        onClick={() => setGridPage((p) => Math.max(1, p - 1))}
        disabled={currentGridPage <= 1}
        className={currentGridPage <= 1
          ? "rounded border border-[#ddd0c5] bg-[#efe6df] px-2 py-1 text-xs font-semibold text-[#aa9788]"
          : "rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-semibold text-slate-900"}
      >Prev</button>
      <span className="text-xs font-semibold text-slate-600">
        Page {currentGridPage} / {totalGridPages}
      </span>
      <button
        type="button"
        onClick={() => setGridPage((p) => Math.min(totalGridPages, p + 1))}
        disabled={currentGridPage >= totalGridPages}
        className={currentGridPage >= totalGridPages
          ? "rounded border border-[#ddd0c5] bg-[#efe6df] px-2 py-1 text-xs font-semibold text-[#aa9788]"
          : "rounded border border-[#cdb8a8] bg-white px-2 py-1 text-xs font-semibold text-slate-900"}
      >Next</button>
    </div>
  ) : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-2">

      {/* Header */}
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-[#fff8f1] via-[#f5e4d3] to-[#e9c9ab] p-5 shadow-[0_18px_42px_rgba(38,21,11,0.14)]">
        <div className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-[#f1c38f]/45 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-44 w-44 rounded-full bg-[#d69b62]/30 blur-2xl" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative z-10">
            <h3 className="text-xl font-black text-slate-900">Schedule Implementation</h3>
            <p className="mt-1 text-sm text-slate-600">
              Review pre-approved baseline. Unit and Project Qty are read-only from Schedule Builder. Update only Qty Done till previous day and submit for final approval.
            </p>
          </div>
          <Link
            href="/company/pmo"
            className="relative z-10 rounded-lg border border-slate-800 bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-3 py-2 text-xs font-semibold text-white shadow-md"
          >
            Back to PMO Dashboard
          </Link>
        </div>
      </section>

      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Selectors */}
      <section className="rounded-2xl border border-slate-200 bg-[#fffaf5] p-4 shadow-[0_10px_24px_rgba(34,18,9,0.08)]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Select Project
            <select value={selectedProjectId ? String(selectedProjectId) : ""} onChange={(e) => setSelectedProjectId(Number(e.target.value || 0))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
              {projects.map((r) => <option key={r.id} value={r.id}>{r.project_name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Select Schedule
            <select value={selectedScheduleId} onChange={(e) => setSelectedScheduleId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
              {schedules.map((r) => <option key={r.id} value={r.id}>{r.schedule_name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Select Baseline
            <select value={selectedBaselineId ? String(selectedBaselineId) : ""} onChange={(e) => setSelectedBaselineId(Number(e.target.value || 0))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
              {baselines.map((r) => (
                <option key={r.id} value={r.id}>
                  B{r.baseline_no} — {approvedImplBaselineIds.has(r.id) ? "Approved (Final)" : "Pre-Approved"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Implementation Date
            <input type="date" value={implementationDate} onChange={(e) => setImplementationDate(e.target.value)} disabled={!isEditable} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-[#f3ede7]" />
          </label>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Approval Status
            <div className="mt-1 flex h-[42px] items-center justify-center rounded-lg border border-slate-200 bg-[#f9f2ec] px-3 text-sm font-black text-slate-900">{recordStatus}</div>
          </div>
        </div>
      </section>

      {/* Schedule Grid */}
      <section className="rounded-2xl border border-slate-200 bg-[#fffaf5] shadow-[0_14px_32px_rgba(33,17,9,0.1)]">
        <div className="p-4 pb-2">
          {/* Level filter + export toolbar */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-900">Show:</span>
            {(["ALL", "LEVEL2", "LEVEL3"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => { setViewLevelFilter(level); setGridPage(1); }}
                className={
                  viewLevelFilter === level
                    ? "rounded-lg border border-[#3f2418] bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-3 py-1 text-xs font-semibold text-white shadow-[0_2px_0_#2f1b12]"
                    : "rounded-lg border border-[#cdb8a8] bg-white px-3 py-1 text-xs font-semibold text-slate-900"
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
                  className="rounded-lg border border-[#cdb8a8] bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Columns {viewColPickerOpen ? "▲" : "▼"}
                </button>
                {viewColPickerOpen && (
                  <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl border border-[#d7c2b0] bg-white p-3 shadow-xl">
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
                        onClick={() => setViewHiddenCols(new Set(IMPL_HIDEABLE_COLS.map((c) => c.key)))}
                        className="text-[11px] font-semibold text-[#4a2a1b] underline"
                      >
                        Hide All
                      </button>
                    </div>
                    {IMPL_HIDEABLE_COLS.map((col) => (
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
                onClick={() => runImplExport("PDF")}
                disabled={!filteredRows.length || exportingPdf}
                className={filteredRows.length && !exportingPdf
                  ? "rounded-lg border border-slate-800 bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-3 py-1 text-xs font-semibold text-white shadow-sm"
                  : "rounded-lg border border-[#ddd0c5] bg-[#efe6df] px-3 py-1 text-xs font-semibold text-[#aa9788] cursor-not-allowed"
                }
              >
                {exportingPdf ? "Exporting..." : "Save PDF"}
              </button>
              <button
                type="button"
                onClick={() => runImplExport("PRINT")}
                disabled={!filteredRows.length || exportingPdf}
                className={filteredRows.length && !exportingPdf
                  ? "rounded-lg border border-slate-800 bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-3 py-1 text-xs font-semibold text-white shadow-sm"
                  : "rounded-lg border border-[#ddd0c5] bg-[#efe6df] px-3 py-1 text-xs font-semibold text-[#aa9788] cursor-not-allowed"
                }
              >
                Print
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
              {filteredRows.length} activities{viewLevelFilter !== "ALL" ? ` (filtered from ${rows.length})` : ""}
            </span>
            {paginationControls}
          </div>
        </div>

        <div className="sticky top-[84px] z-20 bg-[#fffaf5] px-4 pb-2 pt-1">
          <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-[#f5e8db] px-3 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Horizontal Scroll
            </span>
            <span className="text-[11px] text-[#8a664f]">
              Use this bar to move across schedule columns
            </span>
          </div>
          <div
            ref={topScrollRef}
            onScroll={() => syncHorizontalScroll("top")}
            className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white"
          >
            <div style={{ width: tableWidth, height: 1 }} />
          </div>
        </div>

        {/* Horizontally scrollable table */}
        <div
          ref={tableScrollRef}
          onScroll={() => syncHorizontalScroll("table")}
          className="w-full overflow-x-auto px-4 pb-2"
        >
          <table
            className="border-collapse text-[10.5px]"
            style={{ minWidth: tableWidth, tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: getColumnWidth("no") }} />
              <col style={{ width: getColumnWidth("activity") }} />
              {!viewHiddenCols.has("duration") && <col style={{ width: getColumnWidth("duration") }} />}
              {!viewHiddenCols.has("start") && <col style={{ width: getColumnWidth("start") }} />}
              {!viewHiddenCols.has("finish") && <col style={{ width: getColumnWidth("finish") }} />}
              {!viewHiddenCols.has("unit") && <col style={{ width: getColumnWidth("unit") }} />}
              {!viewHiddenCols.has("projectQty") && <col style={{ width: getColumnWidth("projectQty") }} />}
              {!viewHiddenCols.has("qtyDone") && <col style={{ width: getColumnWidth("qtyDone") }} />}
            </colgroup>
            <thead>
              <tr className="bg-[#f0dfcf] text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                <th
                  className="sticky left-0 z-20 border-b border-r border-slate-200 bg-[#f0dfcf] px-1 py-1 text-center"
                  style={{ width: getColumnWidth("no"), minWidth: getColumnWidth("no") }}
                >
                  <div className="relative pr-1">
                    No
                    <div
                      className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                      onMouseDown={(e) => startColumnResize("no", e)}
                    />
                  </div>
                </th>
                <th
                  className="border-b border-r border-slate-200 px-2 py-1 font-black text-slate-900"
                  style={{ width: getColumnWidth("activity"), minWidth: getColumnWidth("activity") }}
                >
                  <div className="relative pr-1">
                    Activity
                    <div
                      className="absolute -right-1 top-0 h-full w-2 cursor-col-resize"
                      onMouseDown={(e) => startColumnResize("activity", e)}
                    />
                  </div>
                </th>
                {!viewHiddenCols.has("duration") && (
                  <th className="border-b border-r border-slate-200 px-2 py-1" style={{ width: getColumnWidth("duration"), minWidth: getColumnWidth("duration") }}>
                    <div className="relative pr-1">Dur.<div className="absolute -right-1 top-0 h-full w-2 cursor-col-resize" onMouseDown={(e) => startColumnResize("duration", e)} /></div>
                  </th>
                )}
                {!viewHiddenCols.has("start") && (
                  <th className="border-b border-r border-slate-200 px-2 py-1" style={{ width: getColumnWidth("start"), minWidth: getColumnWidth("start") }}>
                    <div className="relative pr-1">Start<div className="absolute -right-1 top-0 h-full w-2 cursor-col-resize" onMouseDown={(e) => startColumnResize("start", e)} /></div>
                  </th>
                )}
                {!viewHiddenCols.has("finish") && (
                  <th className="border-b border-r border-slate-200 px-2 py-1" style={{ width: getColumnWidth("finish"), minWidth: getColumnWidth("finish") }}>
                    <div className="relative pr-1">Finish<div className="absolute -right-1 top-0 h-full w-2 cursor-col-resize" onMouseDown={(e) => startColumnResize("finish", e)} /></div>
                  </th>
                )}
                {!viewHiddenCols.has("unit") && (
                  <th className="border-b border-r border-slate-200 bg-[#f0f8e8] px-2 py-1 text-[#2d6a2d]" style={{ width: getColumnWidth("unit"), minWidth: getColumnWidth("unit") }}>
                    <div className="relative pr-1">Unit<div className="absolute -right-1 top-0 h-full w-2 cursor-col-resize" onMouseDown={(e) => startColumnResize("unit", e)} /></div>
                  </th>
                )}
                {!viewHiddenCols.has("projectQty") && (
                  <th className="border-b border-r border-slate-200 bg-[#f0f8e8] px-2 py-1 text-[#2d6a2d]" style={{ width: getColumnWidth("projectQty"), minWidth: getColumnWidth("projectQty") }}>
                    <div className="relative pr-1">Project Qty<div className="absolute -right-1 top-0 h-full w-2 cursor-col-resize" onMouseDown={(e) => startColumnResize("projectQty", e)} /></div>
                  </th>
                )}
                {!viewHiddenCols.has("qtyDone") && (
                  <th className="border-b border-slate-200 bg-[#e6f4e6] px-2 py-1 text-[#2d6a2d]" style={{ width: getColumnWidth("qtyDone"), minWidth: getColumnWidth("qtyDone") }}>
                    <div className="relative pr-1">Qty Done Till Prev Day<div className="absolute -right-1 top-0 h-full w-2 cursor-col-resize" onMouseDown={(e) => startColumnResize("qtyDone", e)} /></div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleColCount} className="px-3 py-6 text-sm text-slate-600">Loading…</td></tr>
              ) : !rows.length ? (
                <tr><td colSpan={visibleColCount} className="px-3 py-6 text-sm text-slate-600">No activities available.</td></tr>
              ) : (
                pagedRows.map((row, pageIdx) => {
                  const globalIdx = gridPageStartIndex + pageIdx;
                  const isSummary = row.activity_type === "SUMMARY";
                  const rowStyle: React.CSSProperties = {
                    fontWeight:
                      isSummary || String(row.font_weight || "").toLowerCase() === "bold"
                        ? ("700" as const)
                        : ("400" as const),
                    fontStyle:
                      String(row.font_style || "").toLowerCase() === "italic"
                        ? ("italic" as const)
                        : ("normal" as const),
                    color: normalizeFontColor(row.font_color),
                    fontSize: fontSizeByIndent(row.indent_level),
                  };
                  const cellClass = `border-b border-r border-[#e6d2c1] px-2 py-0.5 overflow-hidden text-ellipsis whitespace-nowrap`;
                  return (
                    <tr key={row.key} className={isSummary ? "bg-[#f7ede0]" : "bg-slate-50"}>

                      {/* No — sticky */}
                      <td className="sticky left-0 z-10 border-b border-r border-[#e6d2c1] bg-inherit px-1 py-0.5 text-center text-[10px] text-slate-600">
                        {row.sl_no}
                      </td>

                      {/* Activity — wbsCode ("1","1.1","1.1.1") as inline ID prefix + indentation */}
                      <td className="border-b border-r border-[#e6d2c1] px-2 py-0.5 align-top">
                        <div className="flex min-w-0 items-start" style={{ paddingLeft: `${row.indent_level * 14}px` }}>
                          {row.wbs_code && (
                            <span className="mr-1 shrink-0 select-none" style={rowStyle}>
                              {row.wbs_code}
                            </span>
                          )}
                          <span style={rowStyle} className="break-words leading-[1.2]">
                            {row.activity_name}
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      {!viewHiddenCols.has("duration") && <td className={cellClass} style={rowStyle}>{row.duration_days || ""}</td>}

                      {/* Start */}
                      {!viewHiddenCols.has("start") && <td className={cellClass} style={rowStyle}>{row.start_date || ""}</td>}

                      {/* Finish */}
                      {!viewHiddenCols.has("finish") && <td className={cellClass} style={rowStyle}>{row.finish_date || ""}</td>}

                      {/* Unit — read-only from Schedule Builder */}
                      {!viewHiddenCols.has("unit") && (
                        <td className="border-b border-r border-[#e6d2c1] bg-[#f8fbf2] px-1 py-0.5">
                          <span style={rowStyle} className="px-1">{row.unit || ""}</span>
                        </td>
                      )}

                      {/* Project Qty — read-only from Schedule Builder */}
                      {!viewHiddenCols.has("projectQty") && (
                        <td className="border-b border-r border-[#e6d2c1] bg-[#f8fbf2] px-1 py-0.5">
                          <span style={rowStyle} className="px-1">{row.planned_qty != null ? row.planned_qty.toFixed(2) : ""}</span>
                        </td>
                      )}

                      {/* Qty Done Till Previous Day — editable */}
                      {!viewHiddenCols.has("qtyDone") && (
                        <td className="border-b border-[#e6d2c1] bg-[#f0faf0] px-1 py-0.5">
                          {!isSummary ? (
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.completed_qty_before_start}
                              disabled={!isEditable}
                              onChange={(e) => updateField(globalIdx, e.target.value)}
                              className="w-full rounded border border-[#a8d8a8] bg-white px-1.5 py-0.5 text-[10.5px] text-[#2d6a2d] outline-none focus:border-[#4caf50] disabled:bg-[#f3ede7]"
                            />
                          ) : (
                            <span className="px-1 text-[#ccc]"></span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom pagination + actions */}
        <div className="p-4 pt-3">
          <div className="flex flex-wrap items-center gap-3">
            {paginationControls}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openReturnModal}
                disabled={busy || returningToBuilder || !rows.length || !canReturnToBuilder}
                className="inline-flex items-center gap-1 rounded-lg border border-[#7a3f24] bg-gradient-to-b from-[#d8a074] to-[#a46642] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#2f1a10] shadow-[0_4px_0_#7d4d32] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Return to Schedule Builder
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={busy || !isEditable || !rows.length}
                className="inline-flex items-center gap-1 rounded-lg border border-[#3f2418] bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy || !isEditable || !rows.length}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Submit For Final Approval
              </button>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Pre-approval from Schedule Builder required
              </span>
            </div>
          </div>
        </div>
      </section>

      {returnModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-[#fff9f3] p-5 shadow-[0_20px_48px_rgba(18,9,5,0.35)]">
            <h4 className="text-lg font-black text-slate-900">Return to Schedule Builder</h4>
            <p className="mt-1 text-sm text-slate-600">
              Enter a short reason so corrections can be done in Schedule Builder.
            </p>
            <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Reason for Return
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={4}
                maxLength={1000}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#a67652]"
                placeholder="Mention what needs correction in schedule setup."
              />
            </label>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="rounded-lg border border-[#cdb8a8] bg-white px-4 py-2 text-xs font-semibold text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReturnToBuilder}
                disabled={returningToBuilder}
                className="rounded-lg border border-[#7a3f24] bg-gradient-to-b from-[#d8a074] to-[#a46642] px-4 py-2 text-xs font-bold text-[#2f1a10] shadow-[0_4px_0_#7d4d32] disabled:opacity-60"
              >
                {returningToBuilder ? "Returning..." : "Return Schedule"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
