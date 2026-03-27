import {
  MIS_PERFORMANCE_TEXT,
  type ProjectMisDailyReport,
  type ProjectMisDailyReportLine,
  type ProjectMisMasterInputRow,
  type ProjectMisMasterRow,
} from "@/lib/projectMisTypes";

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function diffDaysInclusive(start: string, end: string): number {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return 0;
  if (e < s) return 0;
  const ms = e.getTime() - s.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

function getMonthKey(value: Date | string): string {
  const dt = typeof value === "string" ? parseDate(value) : value;
  if (!dt) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getDayPerformance(doneToday: number, perDayTarget: number): string {
  const done = toNumber(doneToday);
  const target = toNumber(perDayTarget);
  if (target > 0 && done <= 0) return MIS_PERFORMANCE_TEXT.NO_WORK;
  const deviation = done - target;
  if (deviation < 0) return MIS_PERFORMANCE_TEXT.MISSED;
  return MIS_PERFORMANCE_TEXT.WELL_DONE;
}

function calculateCumulativeByMaster(
  masterId: number,
  reports: ProjectMisDailyReport[],
  reportMonth: string
) {
  let doneInMonth = 0;
  let doneTodayLatest = 0;
  let latestDate = "";
  reports.forEach((report) => {
    if (report.report_month !== reportMonth) return;
    const line = report.lines.find((item) => item.master_activity_id === masterId);
    if (!line) return;
    doneInMonth += toNumber(line.done_today);
    if (!latestDate || report.report_date > latestDate) {
      latestDate = report.report_date;
      doneTodayLatest = toNumber(line.done_today);
    }
  });
  return { doneInMonth, doneTodayLatest };
}

export function applyMasterCalculations(
  row: ProjectMisMasterInputRow,
  context: {
    id: number;
    project_id: number;
    sr_no: number;
    schedule_id: string;
    created_at: string;
    updated_at: string;
    daily_reports: ProjectMisDailyReport[];
    reference_date?: string;
  }
): ProjectMisMasterRow {
  const projectQty = clampNonNegative(toNumber(row.project_qty));
  const doneTillLastMonth = clampNonNegative(toNumber(row.total_qty_done_till_last_month));
  const monthlyTargetTaken = clampNonNegative(toNumber(row.monthly_target_taken));
  const referenceMonth = getMonthKey(context.reference_date || new Date());
  const { doneInMonth, doneTodayLatest } = calculateCumulativeByMaster(
    context.id,
    context.daily_reports,
    referenceMonth
  );

  const totalQtyDoneTillToday = doneTillLastMonth + doneInMonth;
  const workDoneTillYesterday = Math.max(0, doneInMonth - doneTodayLatest);
  const uptoDateDoneInMonth = workDoneTillYesterday + doneTodayLatest;
  const balanceQty = Math.max(0, projectQty - totalQtyDoneTillToday);
  const daysOriginal = diffDaysInclusive(row.msp_start_date, row.msp_end_date);
  const daysRevised = row.revised_start_date && row.revised_end_date
    ? diffDaysInclusive(row.revised_start_date, row.revised_end_date)
    : 0;
  const availableDays = daysRevised > 0 ? daysRevised : daysOriginal;
  const perDayTarget = availableDays > 0 ? balanceQty / availableDays : 0;
  const monthlyTargetShouldBe = perDayTarget * 30;
  const pctTillYesterday = projectQty > 0 ? (Math.max(0, totalQtyDoneTillToday - doneTodayLatest) / projectQty) * 100 : 0;
  const pctCompletionInMonth = monthlyTargetTaken > 0 ? (uptoDateDoneInMonth / monthlyTargetTaken) * 100 : 0;
  const daysPerformance = getDayPerformance(doneTodayLatest, perDayTarget);

  return {
    id: context.id,
    project_id: context.project_id,
    schedule_id: context.schedule_id,
    sr_no: context.sr_no,
    activity: String(row.activity || "").trim(),
    sub_activity: String(row.sub_activity || "").trim(),
    msp_start_date: String(row.msp_start_date || ""),
    msp_end_date: String(row.msp_end_date || ""),
    revised_start_date: String(row.revised_start_date || ""),
    revised_end_date: String(row.revised_end_date || ""),
    actual_start_date: String(row.actual_start_date || ""),
    actual_end_date: String(row.actual_end_date || ""),
    unit: String(row.unit || "").trim(),
    project_qty: projectQty,
    total_qty_done_till_last_month: doneTillLastMonth,
    total_qty_done_till_today: totalQtyDoneTillToday,
    percentage_completion_till_yesterday: pctTillYesterday,
    balance_qty: balanceQty,
    days_available_as_per_original_msp: daysOriginal,
    days_available_as_per_revised_baseline: daysRevised,
    per_day_target: perDayTarget,
    monthly_target_should_be: monthlyTargetShouldBe,
    monthly_target_taken: monthlyTargetTaken,
    work_done_till_yesterday: workDoneTillYesterday,
    done_today_latest: doneTodayLatest,
    upto_date_done_in_month: uptoDateDoneInMonth,
    percentage_completion_in_month: pctCompletionInMonth,
    days_performance: daysPerformance,
    created_at: context.created_at,
    updated_at: context.updated_at,
  };
}

export function applyDailyLineCalculations(
  line: Omit<ProjectMisDailyReportLine, "deviation" | "days_performance"> & {
    per_day_target: number;
    done_today: number;
  }
): Pick<ProjectMisDailyReportLine, "deviation" | "days_performance"> {
  const target = toNumber(line.per_day_target);
  const done = toNumber(line.done_today);
  return {
    deviation: done - target,
    days_performance: getDayPerformance(done, target),
  };
}

export function calculateMisSummary(rows: ProjectMisMasterRow[]) {
  const totalProjectQty = rows.reduce((acc, row) => acc + toNumber(row.project_qty), 0);
  const totalDoneTillToday = rows.reduce((acc, row) => acc + toNumber(row.total_qty_done_till_today), 0);
  const monthlyTarget = rows.reduce((acc, row) => acc + toNumber(row.monthly_target_taken), 0);
  const monthlyAchieved = rows.reduce((acc, row) => acc + toNumber(row.upto_date_done_in_month), 0);
  const behindTarget = rows.filter((row) => toNumber(row.done_today_latest) < toNumber(row.per_day_target)).length;
  const noWorkToday = rows.filter((row) => toNumber(row.done_today_latest) <= 0 && toNumber(row.per_day_target) > 0).length;
  const completionPct = totalProjectQty > 0 ? (totalDoneTillToday / totalProjectQty) * 100 : 0;
  return {
    totalProjectQty,
    totalDoneTillToday,
    completionPct,
    monthlyTarget,
    monthlyAchieved,
    behindTarget,
    noWorkToday,
  };
}

