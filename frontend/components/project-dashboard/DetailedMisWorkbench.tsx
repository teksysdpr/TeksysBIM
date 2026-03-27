"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getBaselineDetail,
  listScheduleBaselines,
  type PMOBaselineRow,
} from "@/app/services/pmoScheduleApprovalService";
import { listDprReports } from "@/app/services/dprService";
import type { DprReportRecord } from "@/lib/dprTypes";
import {
  listProjectMisMasterRows,
  saveProjectMisMasterRows,
} from "@/app/services/projectMisService";
import { listScheduleImplementationRecords } from "@/app/services/scheduleImplementationService";

type ScheduleActivityRow = {
  activity_id: number;
  activity_name: string;
  start_date: string;
  target_date: string;
  unit: string;
  project_qty: number;
};

type SourceMode = "APPROVED" | "NONE";

type DailyComputedRow = {
  sr_no: number;
  key: string;
  activity: string;
  start_date: string;
  unit: string;
  project_qty: number;
  qty_completed_till_yesterday: number;
  qty_done_today: number;
  upto_date_completed_qty: number;
  pct_completion_till_date: number;
  balance_qty_till_date: number;
  days_available_as_per_target_date: number;
  target_qty_per_day: number;
  monthly_target: number;
  work_done_till_yesterday_in_month: number;
  work_done_today: number;
  upto_date_qty_done_in_month: number;
  pct_work_completed_in_month: number;
  day_performance: string;
  overall_progress_status: string;
};

type MisColumnKey =
  | "sr_no"
  | "activity"
  | "start_date"
  | "unit"
  | "project_qty"
  | "qty_completed_till_yesterday"
  | "qty_done_today"
  | "upto_date_completed_qty"
  | "pct_completion_till_date"
  | "balance_qty_till_date"
  | "days_available_as_per_target_date"
  | "target_qty_per_day"
  | "monthly_target"
  | "work_done_till_yesterday_in_month"
  | "work_done_today"
  | "upto_date_qty_done_in_month"
  | "pct_work_completed_in_month"
  | "day_performance"
  | "overall_progress_status";

const MIS_COLUMNS: Array<{ key: MisColumnKey; label: string }> = [
  { key: "sr_no", label: "Sr. No." },
  { key: "activity", label: "Activity" },
  { key: "start_date", label: "Start Date" },
  { key: "unit", label: "Unit" },
  { key: "project_qty", label: "Project Qty" },
  { key: "qty_completed_till_yesterday", label: "Qty Completed Till Yesterday" },
  { key: "qty_done_today", label: "Qty Done Today" },
  { key: "upto_date_completed_qty", label: "Upto Date Completed Qty" },
  { key: "pct_completion_till_date", label: "% Completion Till Date" },
  { key: "balance_qty_till_date", label: "Balance Qty Till Date" },
  {
    key: "days_available_as_per_target_date",
    label: "No Of Days Available As per Target Date",
  },
  { key: "target_qty_per_day", label: "Target Qty Per Day" },
  { key: "monthly_target", label: "Monthly Target" },
  { key: "work_done_till_yesterday_in_month", label: "Work Done till Yesterday in Month" },
  { key: "work_done_today", label: "Work Done Today" },
  { key: "upto_date_qty_done_in_month", label: "Upto Date Qty Done in Month" },
  { key: "pct_work_completed_in_month", label: "% Work completed in Month" },
  { key: "day_performance", label: "Day's Performance" },
  { key: "overall_progress_status", label: "Overall Progress Status" },
];

const MIS_DEFAULT_COLUMN_WIDTHS: Record<MisColumnKey, number> = {
  sr_no: 70,
  activity: 320,
  start_date: 120,
  unit: 90,
  project_qty: 120,
  qty_completed_till_yesterday: 170,
  qty_done_today: 125,
  upto_date_completed_qty: 150,
  pct_completion_till_date: 145,
  balance_qty_till_date: 140,
  days_available_as_per_target_date: 215,
  target_qty_per_day: 130,
  monthly_target: 130,
  work_done_till_yesterday_in_month: 170,
  work_done_today: 125,
  upto_date_qty_done_in_month: 170,
  pct_work_completed_in_month: 155,
  day_performance: 190,
  overall_progress_status: 170,
};

const MIS_MIN_COLUMN_WIDTHS: Record<MisColumnKey, number> = {
  sr_no: 54,
  activity: 220,
  start_date: 100,
  unit: 70,
  project_qty: 90,
  qty_completed_till_yesterday: 130,
  qty_done_today: 95,
  upto_date_completed_qty: 110,
  pct_completion_till_date: 110,
  balance_qty_till_date: 110,
  days_available_as_per_target_date: 170,
  target_qty_per_day: 100,
  monthly_target: 100,
  work_done_till_yesterday_in_month: 130,
  work_done_today: 95,
  upto_date_qty_done_in_month: 130,
  pct_work_completed_in_month: 120,
  day_performance: 150,
  overall_progress_status: 140,
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeKey(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseIsoDate(value?: string | null): Date | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const dt = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function formatDate(value?: string | null): string {
  const dt = parseIsoDate(value);
  if (!dt) return "-";
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(digits);
}

function daysBetweenInclusive(fromDate: Date, toDate: Date): number {
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime();
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()).getTime();
  if (to < from) return 0;
  return Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
}

function countWorkingDays(fromDate: Date, toDate: Date): number {
  if (toDate < fromDate) return 0;
  const cursor = new Date(fromDate);
  let count = 0;
  while (cursor <= toDate) {
    const day = cursor.getDay();
    if (day !== 0) count += 1; // Sunday off
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function getDayPerformance(doneToday: number, targetPerDay: number): string {
  if (targetPerDay > 0 && doneToday <= 0) return "No work Today ? What happened Guys?";
  if (doneToday < targetPerDay) return "Target for Day missed guys";
  return "Well Done Guys";
}

function getOverallProgressStatus(
  projectQty: number,
  uptoDateCompletedQty: number,
  doneToday: number,
  targetPerDay: number,
  daysAvailable: number
): string {
  if (projectQty <= 0) return "No Quantity";
  if (uptoDateCompletedQty >= projectQty) return "Completed";
  if (daysAvailable <= 0) return "Overdue";
  if (targetPerDay > 0 && doneToday <= 0) return "No Progress Today";
  if (doneToday > targetPerDay) return "Ahead";
  if (doneToday < targetPerDay) return "Behind";
  return "On Track";
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DetailedMisWorkbench({
  projectId,
  projectName,
  scheduleId,
  scheduleName,
  reportingDate,
  canSeedProgress,
}: {
  projectId: number;
  projectName: string;
  scheduleId: string;
  scheduleName: string;
  reportingDate: string;
  canSeedProgress: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [columnWidths, setColumnWidths] =
    useState<Record<MisColumnKey, number>>(MIS_DEFAULT_COLUMN_WIDTHS);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("NONE");
  const [selectedBaseline, setSelectedBaseline] = useState<PMOBaselineRow | null>(null);
  const [scheduleRows, setScheduleRows] = useState<ScheduleActivityRow[]>([]);
  const [dprRows, setDprRows] = useState<DprReportRecord[]>([]);
  const [seedQtyMap, setSeedQtyMap] = useState<Record<string, number>>({});
  const resizeStateRef = useRef<{
    columnKey: MisColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);

  const parsedReportingDate = useMemo(
    () => parseIsoDate(reportingDate) || new Date(),
    [reportingDate]
  );

  const monthStartDate = useMemo(
    () => new Date(parsedReportingDate.getFullYear(), parsedReportingDate.getMonth(), 1),
    [parsedReportingDate]
  );
  const monthEndDate = useMemo(
    () => new Date(parsedReportingDate.getFullYear(), parsedReportingDate.getMonth() + 1, 0),
    [parsedReportingDate]
  );

  const effectiveRows = useMemo(() => {
    return scheduleRows.filter((row) => normalizeKey(row.activity_name));
  }, [scheduleRows]);

  useEffect(() => {
    let active = true;
    async function loadMisSourceData() {
      if (!(projectId > 0) || !scheduleId) {
        setScheduleRows([]);
        setDprRows([]);
        setSeedQtyMap({});
        setSelectedBaseline(null);
        setSourceMode("NONE");
        return;
      }

      try {
        setLoading(true);
        setError("");
        setNotice("");

        const scheduleNumericId = Number(scheduleId);
        const [baselinesRes, dprRes, masterRes, implementationRes] = await Promise.all([
          listScheduleBaselines(projectId, scheduleNumericId),
          listDprReports({ project_id: projectId, include_rows: true }),
          listProjectMisMasterRows({ project_id: projectId, schedule_id: scheduleId }),
          listScheduleImplementationRecords({
            project_id: projectId,
            schedule_id: String(scheduleId),
            status: "APPROVED",
          }),
        ]);

        if (!active) return;

        const baselineRows = Array.isArray(baselinesRes.rows) ? baselinesRes.rows : [];
        const approvedBaselines = baselineRows.filter(
          (row) => String(row.status || "").toUpperCase() === "APPROVED"
        );
        const implementationRows = Array.isArray(implementationRes.rows)
          ? implementationRes.rows
          : [];
        const finalApprovedBaselineIds = new Set(
          implementationRows
            .map((row: any) => Number(row?.baseline_id || 0))
            .filter((value) => Number.isFinite(value) && value > 0)
        );
        const chosen = approvedBaselines
          .filter((row) => finalApprovedBaselineIds.has(Number(row.id)))
          .sort((a, b) => Number(b.baseline_no || 0) - Number(a.baseline_no || 0))[0];

        setSelectedBaseline(chosen);
        if (chosen) {
          setSourceMode("APPROVED");
        } else {
          setSourceMode("NONE");
          if (approvedBaselines.length > 0) {
            setNotice(
              "Final approval pending in Schedule Implementation. MIS will unlock after Company Admin final approval."
            );
          }
        }

        let rows: ScheduleActivityRow[] = [];
        if (chosen) {
          const detail = await getBaselineDetail(chosen.id);
          if (!active) return;
          const rawRows = Array.isArray(detail.rows) ? detail.rows : [];
          rows = rawRows
            .filter((raw) => String(raw?.activityType || "").toUpperCase() !== "SUMMARY")
            .map((raw) => {
              const activityName = String(raw?.activityName || "").trim();
              if (!activityName) return null;
              const startDate = String(raw?.startDate || raw?.baseline1Start || "").slice(0, 10);
              const targetDate = String(raw?.finishDate || raw?.baseline1Finish || "").slice(0, 10);
              const unit = String(raw?.unit || "").trim();
              const projectQty = Math.max(0, toNumber(raw?.plannedQty));
              return {
                activity_id: Number(raw?.activityId || 0) || 0,
                activity_name: activityName,
                start_date: startDate,
                target_date: targetDate,
                unit,
                project_qty: projectQty,
              } as ScheduleActivityRow;
            })
            .filter((row): row is ScheduleActivityRow => Boolean(row));
        }
        setScheduleRows(rows);

        const filteredDprRows = (dprRes.rows || []).filter((row) => {
          const scheduleIdMatch = String(row.schedule_id || "").trim() === String(scheduleId).trim();
          const scheduleNameMatch =
            normalizeKey(String(row.schedule_name || "")) === normalizeKey(scheduleName);
          return scheduleIdMatch || scheduleNameMatch;
        });
        setDprRows(filteredDprRows);

        const storedRows = Array.isArray(masterRes.rows) ? masterRes.rows : [];
        const nextSeed: Record<string, number> = {};
        storedRows.forEach((row) => {
          const key = normalizeKey(`${row.sub_activity}::${row.msp_start_date}`);
          if (!key) return;
          nextSeed[key] = Math.max(0, toNumber(row.total_qty_done_till_last_month));
        });
        setSeedQtyMap(nextSeed);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Unable to load Detailed MIS data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMisSourceData();
    return () => {
      active = false;
    };
  }, [projectId, scheduleId, scheduleName]);

  const submittedDprRows = useMemo(
    () =>
      dprRows.filter((row) => {
        const status = String(row.status || "").toLowerCase();
        return status === "submitted" || status === "approved";
      }),
    [dprRows]
  );

  const activityQtyAggregation = useMemo(() => {
    const uptoDateMap = new Map<string, number>();
    const doneTodayMap = new Map<string, number>();
    const monthTillYesterdayMap = new Map<string, number>();
    const monthTodayMap = new Map<string, number>();

    const reportDateIso = reportingDate;
    const monthStartIso = `${parsedReportingDate.getFullYear()}-${String(
      parsedReportingDate.getMonth() + 1
    ).padStart(2, "0")}-01`;

    submittedDprRows.forEach((dpr) => {
      const dprDate = String(dpr.dpr_date || "").slice(0, 10);
      const isOnOrBeforeReportingDate = dprDate && dprDate <= reportDateIso;
      const isToday = dprDate === reportDateIso;
      const isCurrentMonth = dprDate >= monthStartIso && dprDate <= reportDateIso;
      const isBeforeTodayInMonth = isCurrentMonth && dprDate < reportDateIso;

      const progressRows = Array.isArray(dpr.daily_work_progress_items)
        ? dpr.daily_work_progress_items
        : [];
      progressRows.forEach((item) => {
        const activity = normalizeKey(String(item.activity || item.sub_activity || ""));
        if (!activity) return;
        const qty = Math.max(0, toNumber((item as any).qty_executed ?? (item as any).quantity ?? 0));
        if (isOnOrBeforeReportingDate) {
          uptoDateMap.set(activity, (uptoDateMap.get(activity) || 0) + qty);
        }
        if (isToday) {
          doneTodayMap.set(activity, (doneTodayMap.get(activity) || 0) + qty);
          monthTodayMap.set(activity, (monthTodayMap.get(activity) || 0) + qty);
        }
        if (isBeforeTodayInMonth) {
          monthTillYesterdayMap.set(activity, (monthTillYesterdayMap.get(activity) || 0) + qty);
        }
      });
    });

    return {
      uptoDateMap,
      doneTodayMap,
      monthTillYesterdayMap,
      monthTodayMap,
    };
  }, [submittedDprRows, reportingDate, parsedReportingDate]);

  const computedRows = useMemo<DailyComputedRow[]>(() => {
    return effectiveRows.map((row, index) => {
      const rowKey = normalizeKey(`${row.activity_name}::${row.start_date}`);
      const activityKey = normalizeKey(row.activity_name);
      const seedCompletedTillYesterday = Math.max(0, toNumber(seedQtyMap[rowKey] || 0));

      const qtyFromDprTillDate = Math.max(
        0,
        toNumber(activityQtyAggregation.uptoDateMap.get(activityKey) || 0)
      );
      const qtyDoneToday = Math.max(
        0,
        toNumber(activityQtyAggregation.doneTodayMap.get(activityKey) || 0)
      );
      const workDoneTillYesterdayInMonth = Math.max(
        0,
        toNumber(activityQtyAggregation.monthTillYesterdayMap.get(activityKey) || 0)
      );
      const workDoneToday = Math.max(
        0,
        toNumber(activityQtyAggregation.monthTodayMap.get(activityKey) || 0)
      );

      const projectQty = Math.max(0, toNumber(row.project_qty));
      const uptoDateCompletedQty = seedCompletedTillYesterday + qtyFromDprTillDate;
      const pctCompletionTillDate = projectQty > 0 ? (uptoDateCompletedQty / projectQty) * 100 : 0;
      const balanceQtyTillDate = Math.max(0, projectQty - uptoDateCompletedQty);

      const targetDate = parseIsoDate(row.target_date);
      const daysAvailableAsPerTargetDate =
        targetDate && parsedReportingDate <= targetDate
          ? daysBetweenInclusive(parsedReportingDate, targetDate)
          : 0;
      const targetQtyPerDay =
        daysAvailableAsPerTargetDate > 0
          ? balanceQtyTillDate / daysAvailableAsPerTargetDate
          : 0;

      const workingDaysRemainingInMonth = countWorkingDays(parsedReportingDate, monthEndDate);
      const monthlyTarget = targetQtyPerDay * workingDaysRemainingInMonth;

      const uptoDateQtyDoneInMonth = workDoneTillYesterdayInMonth + workDoneToday;
      const pctWorkCompletedInMonth =
        monthlyTarget > 0 ? (uptoDateQtyDoneInMonth / monthlyTarget) * 100 : 0;
      const dayPerformance = getDayPerformance(workDoneToday, targetQtyPerDay);
      const overallProgressStatus = getOverallProgressStatus(
        projectQty,
        uptoDateCompletedQty,
        workDoneToday,
        targetQtyPerDay,
        daysAvailableAsPerTargetDate
      );

      return {
        sr_no: index + 1,
        key: rowKey,
        activity: row.activity_name,
        start_date: row.start_date,
        unit: row.unit || "-",
        project_qty: projectQty,
        qty_completed_till_yesterday: seedCompletedTillYesterday,
        qty_done_today: qtyDoneToday,
        upto_date_completed_qty: uptoDateCompletedQty,
        pct_completion_till_date: pctCompletionTillDate,
        balance_qty_till_date: balanceQtyTillDate,
        days_available_as_per_target_date: daysAvailableAsPerTargetDate,
        target_qty_per_day: targetQtyPerDay,
        monthly_target: monthlyTarget,
        work_done_till_yesterday_in_month: workDoneTillYesterdayInMonth,
        work_done_today: workDoneToday,
        upto_date_qty_done_in_month: uptoDateQtyDoneInMonth,
        pct_work_completed_in_month: pctWorkCompletedInMonth,
        day_performance: dayPerformance,
        overall_progress_status: overallProgressStatus,
      };
    });
  }, [
    activityQtyAggregation.doneTodayMap,
    activityQtyAggregation.monthTillYesterdayMap,
    activityQtyAggregation.monthTodayMap,
    activityQtyAggregation.uptoDateMap,
    effectiveRows,
    monthEndDate,
    parsedReportingDate,
    seedQtyMap,
  ]);

  function getColumnWidth(columnKey: MisColumnKey) {
    return columnWidths[columnKey] || MIS_DEFAULT_COLUMN_WIDTHS[columnKey];
  }

  function startColumnResize(columnKey: MisColumnKey, event: React.MouseEvent) {
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
      const minWidth = MIS_MIN_COLUMN_WIDTHS[state.columnKey] || 60;
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

  function updateSeedQty(rowKey: string, value: string) {
    const numeric = Math.max(0, toNumber(value));
    setSeedQtyMap((prev) => ({ ...prev, [rowKey]: numeric }));
  }

  async function handleSaveSeedProgress() {
    if (!(projectId > 0) || !scheduleId || !effectiveRows.length) return;
    try {
      setSaving(true);
      setError("");
      setNotice("");
      const rows = effectiveRows.map((row) => {
        const key = normalizeKey(`${row.activity_name}::${row.start_date}`);
        return {
          activity: row.activity_name,
          sub_activity: row.activity_name,
          msp_start_date: row.start_date,
          msp_end_date: row.target_date,
          revised_start_date: "",
          revised_end_date: "",
          actual_start_date: "",
          actual_end_date: "",
          unit: row.unit,
          project_qty: row.project_qty,
          total_qty_done_till_last_month: Math.max(0, toNumber(seedQtyMap[key] || 0)),
          monthly_target_taken: 0,
          schedule_id: scheduleId,
        };
      });
      await saveProjectMisMasterRows({
        project_id: projectId,
        schedule_id: scheduleId,
        rows,
        reference_date: reportingDate,
      });
      setNotice("Qty Completed Till Yesterday saved successfully.");
    } catch (err: any) {
      setError(err?.message || "Unable to save seed progress values.");
    } finally {
      setSaving(false);
    }
  }

  function handleExportCsv() {
    const headers = [
      "Sr. No.",
      "Activity",
      "Start Date",
      "Unit",
      "Project Qty",
      "Qty Completed Till Yesterday",
      "Qty Done Today",
      "Upto Date Completed Qty",
      "% Completion Till Date",
      "Balance Qty Till Date",
      "No Of Days Available As per Target Date",
      "Target Qty Per Day",
      "Monthly Target",
      "Work Done till Yesterday in Month",
      "Work Done Today",
      "Upto Date Qty Done in Month",
      "% Work completed in Month",
      "Day's Performance",
      "Overall Progress Status",
    ];
    const rows = computedRows.map((row) => [
      row.sr_no,
      row.activity,
      row.start_date,
      row.unit,
      row.project_qty,
      row.qty_completed_till_yesterday,
      row.qty_done_today,
      row.upto_date_completed_qty,
      formatNumber(row.pct_completion_till_date),
      row.balance_qty_till_date,
      row.days_available_as_per_target_date,
      formatNumber(row.target_qty_per_day),
      formatNumber(row.monthly_target),
      row.work_done_till_yesterday_in_month,
      row.work_done_today,
      row.upto_date_qty_done_in_month,
      formatNumber(row.pct_work_completed_in_month),
      row.day_performance,
      row.overall_progress_status,
    ]);
    downloadCsv(
      `detailed-mis-${projectId}-${scheduleId}-${reportingDate}.csv`,
      headers,
      rows
    );
  }

  return (
    <article className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(31,14,6,0.14)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#5B3421]">Detailed MIS</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            {projectName} | {scheduleName || "Select Schedule"} | Reporting Date:{" "}
            {formatDate(reportingDate)}
          </p>
          {selectedBaseline ? (
            <p className="mt-1 text-[11px] font-semibold text-slate-600">
              Source Baseline: B{selectedBaseline.baseline_no} ({selectedBaseline.status})
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canSeedProgress ? (
            <button
              type="button"
              disabled={saving || !effectiveRows.length}
              onClick={handleSaveSeedProgress}
              className="rounded-lg border border-[#3f2418] bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Qty Completed Till Yesterday"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!computedRows.length}
            className="rounded-lg border border-[#d8c7bb] bg-[#f2ebe6] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#7c6354] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export Excel
          </button>
        </div>
      </div>

      {loading ? <p className="mt-3 text-sm text-[#6f4b36]">Loading Detailed MIS...</p> : null}
      {sourceMode === "NONE" && !loading ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          No schedule baseline found for selected project and schedule.
        </p>
      ) : null}
      {notice ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-3 w-full max-w-full rounded-xl border border-slate-200 bg-white p-2 overflow-hidden">
        <div className="rounded-md border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#fff3e8]">
            Detailed MIS Excel Grid
          </p>
        </div>
        <div className="mt-2 w-full max-w-full overflow-x-auto overflow-y-auto rounded-md border border-[#d6c3b4] bg-white max-h-[64vh]">
          <table className="table-fixed border-collapse text-[11px]" style={{ minWidth: `${MIS_COLUMNS.reduce((acc, col) => acc + getColumnWidth(col.key), 0)}px` }}>
            <colgroup>
              {MIS_COLUMNS.map((column) => (
                <col key={`mis-col-${column.key}`} style={{ width: `${getColumnWidth(column.key)}px` }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-20 bg-gradient-to-r from-[#6f3f24] to-[#4a2a1b] text-left text-white shadow-sm">
            <tr>
              {MIS_COLUMNS.map((column) => (
                <th
                  key={`mis-head-${column.key}`}
                  className="relative border border-[#7c573f] px-2 py-1.5 font-bold uppercase tracking-wide"
                >
                  <span>{column.label}</span>
                  <button
                    type="button"
                    onMouseDown={(event) => startColumnResize(column.key, event)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize bg-transparent"
                    aria-label={`Resize ${column.label} column`}
                    title="Drag to resize column"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!computedRows.length ? (
              <tr>
                <td colSpan={MIS_COLUMNS.length} className="border border-[#ead9cc] px-3 py-5 text-center text-slate-600">
                  No activity rows available for Detailed MIS.
                </td>
              </tr>
            ) : (
              computedRows.map((row) => (
                <tr key={row.key} className="align-top odd:bg-[#fffdfa] even:bg-white">
                  <td className="border border-[#ead9cc] px-2 py-1.5 font-semibold text-slate-900 whitespace-nowrap">
                    {row.sr_no}
                  </td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 font-semibold text-slate-900 whitespace-nowrap">
                    {row.activity}
                  </td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">
                    {formatDate(row.start_date)}
                  </td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">
                    {row.unit}
                  </td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">
                    {formatNumber(row.project_qty)}
                  </td>
                  <td className="border border-[#ead9cc] px-2 py-1.5">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.qty_completed_till_yesterday}
                      disabled={!canSeedProgress}
                      onChange={(e) => updateSeedQty(row.key, e.target.value)}
                      className="w-28 rounded border border-[#dac6b8] bg-white px-2 py-0.5 text-[11px] disabled:cursor-not-allowed disabled:bg-[#f3ece7]"
                    />
                  </td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{formatNumber(row.qty_done_today)}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{formatNumber(row.upto_date_completed_qty)}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{formatNumber(row.pct_completion_till_date)}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{formatNumber(row.balance_qty_till_date)}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{row.days_available_as_per_target_date}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{formatNumber(row.target_qty_per_day)}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{formatNumber(row.monthly_target)}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{formatNumber(row.work_done_till_yesterday_in_month)}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{formatNumber(row.work_done_today)}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{formatNumber(row.upto_date_qty_done_in_month)}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{formatNumber(row.pct_work_completed_in_month)}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 text-[#6f4b36] whitespace-nowrap">{row.day_performance}</td>
                  <td className="border border-[#ead9cc] px-2 py-1.5 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${
                        row.overall_progress_status === "Completed"
                          ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                          : row.overall_progress_status === "Behind" ||
                            row.overall_progress_status === "Overdue" ||
                            row.overall_progress_status === "No Progress Today"
                          ? "border-rose-300 bg-rose-100 text-rose-800"
                          : row.overall_progress_status === "Ahead"
                          ? "border-blue-300 bg-blue-100 text-blue-800"
                          : "border-amber-300 bg-amber-100 text-amber-800"
                      }`}
                    >
                      {row.overall_progress_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}
