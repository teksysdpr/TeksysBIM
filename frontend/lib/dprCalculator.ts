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
  type DprRiskManagementItem,
} from "@/lib/dprTypes";

type CalcOptions = {
  inclusive_hindrance_days?: boolean;
};

function asTrimmedString(value: unknown): string {
  return String(value ?? "").trim();
}

function asDateOnly(value: unknown): string {
  const text = asTrimmedString(value);
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function asInteger(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.trunc(parsed);
}

function asDecimal(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Number(parsed.toFixed(4));
}

function asProjectId(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

function asScheduleId(value: unknown): string {
  return asTrimmedString(value);
}

function parseTimeToMinutes(raw: string): number | null {
  const value = asTrimmedString(raw);
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function getDayNameFromDate(dateValue: string): string {
  const iso = asDateOnly(dateValue);
  if (!iso) return "";
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

export function calculateMachineryHours(
  fromTime: string,
  toTime: string,
  manualHours: number | null
): number | null {
  if (manualHours !== null && Number.isFinite(manualHours)) {
    return Number(Math.max(0, manualHours).toFixed(2));
  }
  const fromMinutes = parseTimeToMinutes(fromTime);
  const toMinutes = parseTimeToMinutes(toTime);
  if (fromMinutes === null || toMinutes === null) return null;

  let diff = toMinutes - fromMinutes;
  if (diff < 0) diff += 24 * 60;
  return Number((diff / 60).toFixed(2));
}

export function calculateHindranceDays(
  fromDate: string,
  toDate: string,
  inclusive = true
): number | null {
  const from = asDateOnly(fromDate);
  const to = asDateOnly(toDate);
  if (!from || !to) return null;

  const fromDt = new Date(`${from}T00:00:00Z`);
  const toDt = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(fromDt.getTime()) || Number.isNaN(toDt.getTime())) return null;
  if (toDt < fromDt) return null;

  const diffDays = Math.floor((toDt.getTime() - fromDt.getTime()) / (1000 * 60 * 60 * 24));
  return inclusive ? diffDays + 1 : diffDays;
}

function applyDailyWorkProgressRow(
  row: Partial<DprDailyWorkProgressItem>,
  index: number
): DprDailyWorkProgressItem {
  const base = createEmptyDailyWorkProgressItem();
  const legacyExecuted = asDecimal((row as any).quantity);

  return {
    ...base,
    ...row,
    sr_no: index + 1,
    activity: asTrimmedString(row.activity),
    sub_activity: asTrimmedString(row.sub_activity),
    unit: asTrimmedString(row.unit),
    qty_planned_day: asDecimal((row as any).qty_planned_day),
    qty_executed: asDecimal((row as any).qty_executed) ?? legacyExecuted,
    remark: asTrimmedString((row as any).remark),
  };
}

function applyManpowerDeploymentRow(
  row: Partial<DprManpowerDeploymentItem>,
  index: number
): DprManpowerDeploymentItem {
  const base = createEmptyManpowerDeploymentItem();
  const manpowerSkilled = asInteger((row as any).manpower_skilled);
  const manpowerMc = asInteger((row as any).manpower_unskilled_mc);
  const manpowerFc = asInteger((row as any).manpower_unskilled_fc);
  const total =
    Math.max(0, manpowerSkilled || 0) +
    Math.max(0, manpowerMc || 0) +
    Math.max(0, manpowerFc || 0);

  return {
    ...base,
    ...row,
    sr_no: index + 1,
    contractor_name: asTrimmedString((row as any).contractor_name),
    activity: asTrimmedString((row as any).activity),
    sub_activity: asTrimmedString((row as any).sub_activity),
    unit: asTrimmedString((row as any).unit),
    manpower_skilled: manpowerSkilled,
    manpower_unskilled_mc: manpowerMc,
    manpower_unskilled_fc: manpowerFc,
    total_manpower: total,
    remarks: asTrimmedString((row as any).remarks || (row as any).remark),
  };
}

function applyMachineryRow(
  row: Partial<DprMachineryEquipmentItem>,
  index: number
): DprMachineryEquipmentItem {
  const base = createEmptyMachineryEquipmentItem();
  const hours = calculateMachineryHours(
    asTrimmedString(row.from_time),
    asTrimmedString(row.to_time),
    asDecimal(row.hours)
  );

  return {
    ...base,
    ...row,
    sr_no: index + 1,
    machine: asTrimmedString(row.machine),
    agency: asTrimmedString(row.agency),
    location: asTrimmedString(row.location),
    from_time: asTrimmedString(row.from_time),
    to_time: asTrimmedString(row.to_time),
    hours,
    work_done: asTrimmedString(row.work_done),
  };
}

function applyMaterialRow(
  row: Partial<DprMaterialProcurementItem>,
  index: number
): DprMaterialProcurementItem {
  const base = createEmptyMaterialProcurementItem();
  return {
    ...base,
    ...row,
    sr_no: index + 1,
    material: asTrimmedString(row.material),
    unit: asTrimmedString(row.unit),
    qty: asDecimal(row.qty),
    grn_no: asTrimmedString(row.grn_no),
    supplier: asTrimmedString(row.supplier),
    used_for: asTrimmedString(row.used_for),
  };
}

function applyMaterialIssueConsumptionRow(
  row: Partial<DprMaterialIssueConsumptionItem>,
  index: number
): DprMaterialIssueConsumptionItem {
  const base = createEmptyMaterialIssueConsumptionItem();
  return {
    ...base,
    ...row,
    sr_no: index + 1,
    material: asTrimmedString(row.material),
    unit: asTrimmedString(row.unit),
    qty: asDecimal(row.qty),
    issue_slip_no: asTrimmedString((row as any).issue_slip_no),
    contractor: asTrimmedString((row as any).contractor),
    activity: asTrimmedString((row as any).activity),
    sub_activity: asTrimmedString((row as any).sub_activity),
  };
}

function applyDeviationRow(
  row: Partial<DprDeviationReportItem>,
  index: number
): DprDeviationReportItem {
  const base = createEmptyDeviationReportItem();
  const plannedQty = asDecimal(row.planned_qty);
  const actualQty = asDecimal(row.actual_qty);
  const deviation =
    plannedQty !== null && actualQty !== null
      ? Number((actualQty - plannedQty).toFixed(4))
      : null;

  return {
    ...base,
    ...row,
    sr_no: index + 1,
    activity: asTrimmedString(row.activity),
    planned_qty: plannedQty,
    actual_qty: actualQty,
    deviation,
    remarks: asTrimmedString(row.remarks),
  };
}

function applyRiskRow(
  row: Partial<DprRiskManagementItem>,
  index: number
): DprRiskManagementItem {
  const base = createEmptyRiskManagementItem();
  return {
    ...base,
    ...row,
    sr_no: index + 1,
    activity: asTrimmedString(row.activity),
    location: asTrimmedString(row.location),
    risk_or_hurdles_identified: asTrimmedString(row.risk_or_hurdles_identified),
    mitigation_strategy: asTrimmedString(row.mitigation_strategy),
    remark: asTrimmedString(row.remark),
  };
}

function applyHindranceRow(
  row: Partial<DprHindranceReportItem>,
  index: number,
  inclusiveDays: boolean
): DprHindranceReportItem {
  const base = createEmptyHindranceReportItem();
  const fromDate = asDateOnly(row.from_date);
  const toDate = asDateOnly(row.to_date);
  const totalDays = calculateHindranceDays(fromDate, toDate, inclusiveDays);

  return {
    ...base,
    ...row,
    sr_no: index + 1,
    hindrance_date: asDateOnly(row.hindrance_date),
    activity_or_location: asTrimmedString(row.activity_or_location),
    responsible_party: asTrimmedString(row.responsible_party),
    from_date: fromDate,
    to_date: toDate,
    total_days: totalDays,
    remarks: asTrimmedString(row.remarks),
  };
}

function ensureAtLeastOneRow<T>(rows: T[], createRow: () => T): T[] {
  return rows.length ? rows : [createRow()];
}

export function applyDprCalculations(
  input: Partial<DprReportInput>,
  options: CalcOptions = {}
): DprReportInput {
  const base = createEmptyDprReportInput();
  const inclusiveDays = options.inclusive_hindrance_days ?? true;
  const dprDate = asDateOnly(input.dpr_date || base.dpr_date);

  const dailyRows = ensureAtLeastOneRow(
    (Array.isArray(input.daily_work_progress_items) ? input.daily_work_progress_items : []).map(
      (row, index) => applyDailyWorkProgressRow(row, index)
    ),
    createEmptyDailyWorkProgressItem
  );
  const rawManpowerRows = Array.isArray((input as any).manpower_deployment_items)
    ? ((input as any).manpower_deployment_items as Partial<DprManpowerDeploymentItem>[])
    : [];
  const fallbackManpowerRows = !rawManpowerRows.length
    ? (Array.isArray(input.daily_work_progress_items) ? input.daily_work_progress_items : []).filter(
        (row: any) =>
          row &&
          (
            String(row.contractor_name || "").trim() ||
            [row.manpower_skilled, row.manpower_unskilled_mc, row.manpower_unskilled_fc, row.total_manpower]
              .some((value) => value !== null && value !== undefined && String(value).trim() !== "")
          )
      )
    : [];
  const manpowerRows = ensureAtLeastOneRow(
    (rawManpowerRows.length ? rawManpowerRows : fallbackManpowerRows).map((row, index) =>
      applyManpowerDeploymentRow(row as Partial<DprManpowerDeploymentItem>, index)
    ),
    createEmptyManpowerDeploymentItem
  );
  const machineryRows = ensureAtLeastOneRow(
    (Array.isArray(input.machinery_equipment_items) ? input.machinery_equipment_items : []).map(
      (row, index) => applyMachineryRow(row, index)
    ),
    createEmptyMachineryEquipmentItem
  );
  const materialRows = ensureAtLeastOneRow(
    (Array.isArray(input.material_procurement_items) ? input.material_procurement_items : []).map(
      (row, index) => applyMaterialRow(row, index)
    ),
    createEmptyMaterialProcurementItem
  );
  const materialIssueConsumptionRows = ensureAtLeastOneRow(
    (
      Array.isArray(input.material_issue_consumption_items)
        ? (input.material_issue_consumption_items as Partial<DprMaterialIssueConsumptionItem>[])
        : []
    ).map((row, index) => applyMaterialIssueConsumptionRow(row, index)),
    createEmptyMaterialIssueConsumptionItem
  );
  const deviationRows = ensureAtLeastOneRow(
    (Array.isArray(input.deviation_report_items) ? input.deviation_report_items : []).map(
      (row, index) => applyDeviationRow(row, index)
    ),
    createEmptyDeviationReportItem
  );
  const riskRows = ensureAtLeastOneRow(
    (Array.isArray(input.risk_management_items) ? input.risk_management_items : []).map(
      (row, index) => applyRiskRow(row, index)
    ),
    createEmptyRiskManagementItem
  );
  const hindranceRows = ensureAtLeastOneRow(
    (Array.isArray(input.hindrance_report_items) ? input.hindrance_report_items : []).map(
      (row, index) => applyHindranceRow(row, index, inclusiveDays)
    ),
    createEmptyHindranceReportItem
  );

  return {
    ...base,
    ...input,
    project_id: asProjectId(input.project_id),
    project_name: asTrimmedString(input.project_name),
    schedule_id: asScheduleId(input.schedule_id),
    schedule_name: asTrimmedString(input.schedule_name),
    dpr_date: dprDate || base.dpr_date,
    day_name: getDayNameFromDate(dprDate || base.dpr_date),
    weather: asTrimmedString(input.weather),
    weather_impact_details: String(input.weather_impact_details ?? ""),
    todays_visitors: String(input.todays_visitors ?? ""),
    safety_security_incidence: String(input.safety_security_incidence ?? ""),
    pending_decisions_drawing_requirements: String(input.pending_decisions_drawing_requirements ?? ""),
    critical_points: String(input.critical_points ?? ""),
    red_alert: String(input.red_alert ?? ""),
    total_manpower_sum: manpowerRows.reduce((acc, row) => acc + row.total_manpower, 0),
    site_engineer_name: asTrimmedString(input.site_engineer_name),
    site_engineer_designation: asTrimmedString((input as any).site_engineer_designation),
    project_manager_name: asTrimmedString(input.project_manager_name),
    site_engineer_signature: asTrimmedString(input.site_engineer_signature),
    project_manager_signature: asTrimmedString(input.project_manager_signature),
    status: input.status || "draft",
    created_by: asTrimmedString(input.created_by),
    daily_work_progress_items: dailyRows,
    manpower_deployment_items: manpowerRows,
    machinery_equipment_items: machineryRows,
    material_procurement_items: materialRows,
    material_issue_consumption_items: materialIssueConsumptionRows,
    deviation_report_items: deviationRows,
    risk_management_items: riskRows,
    hindrance_report_items: hindranceRows,
  };
}
