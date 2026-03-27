import { applyDprCalculations, calculateHindranceDays } from "@/lib/dprCalculator";
import type { DprReportInput } from "@/lib/dprTypes";

export type DprValidationResult = {
  ok: boolean;
  errors: string[];
};

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const dt = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(dt.getTime());
}

function isValidNumberLike(value: unknown): boolean {
  if (value === "" || value === null || value === undefined) return true;
  if (typeof value === "number") return Number.isFinite(value);
  const parsed = Number(value);
  return Number.isFinite(parsed);
}

function isValidIntegerLike(value: unknown): boolean {
  if (value === "" || value === null || value === undefined) return true;
  if (typeof value === "number") return Number.isFinite(value) && Number.isInteger(value);
  const parsed = Number(value);
  return Number.isFinite(parsed) && Number.isInteger(parsed);
}

export function validateDprInput(
  rawInput: Partial<DprReportInput>,
  options: { requireForSubmit?: boolean; inclusive_hindrance_days?: boolean } = {}
): DprValidationResult {
  const errors: string[] = [];
  const includeDays = options.inclusive_hindrance_days ?? true;
  const input = applyDprCalculations(rawInput, { inclusive_hindrance_days: includeDays });
  const requireForSubmit = options.requireForSubmit ?? false;

  if (!String(input.project_name || "").trim()) {
    errors.push("project_name is required.");
  }
  if (!input.project_id || Number(input.project_id) <= 0) {
    errors.push("project_id is required.");
  }

  if (!input.dpr_date || !isValidDateOnly(input.dpr_date)) {
    errors.push("dpr_date is required and must be a valid date.");
  }

  if (!String(input.weather || "").trim()) {
    errors.push("weather is required.");
  }

  const textLimit = 1000;
  const summaryTextFields: Array<[string, string]> = [
    ["todays_visitors", String(input.todays_visitors || "")],
    ["safety_security_incidence", String(input.safety_security_incidence || "")],
    [
      "pending_decisions_drawing_requirements",
      String(input.pending_decisions_drawing_requirements || ""),
    ],
    ["critical_points", String(input.critical_points || "")],
    ["red_alert", String(input.red_alert || "")],
    ["weather_impact_details", String(input.weather_impact_details || "")],
  ];
  summaryTextFields.forEach(([field, value]) => {
    if (value.length > textLimit) {
      errors.push(`${field} cannot exceed ${textLimit} characters.`);
    }
  });

  input.daily_work_progress_items.forEach((row, index) => {
    const line = index + 1;
    if (!isValidNumberLike(row.qty_planned_day)) {
      errors.push(`daily_work_progress_items row ${line}: qty_planned_day must be numeric.`);
    }
    if (!isValidNumberLike(row.qty_executed)) {
      errors.push(`daily_work_progress_items row ${line}: qty_executed must be numeric.`);
    }
  });

  input.manpower_deployment_items.forEach((row, index) => {
    const line = index + 1;
    if (!isValidIntegerLike(row.manpower_skilled)) {
      errors.push(`manpower_deployment_items row ${line}: manpower_skilled must be integer.`);
    }
    if (!isValidIntegerLike(row.manpower_unskilled_mc)) {
      errors.push(`manpower_deployment_items row ${line}: manpower_unskilled_mc must be integer.`);
    }
    if (!isValidIntegerLike(row.manpower_unskilled_fc)) {
      errors.push(`manpower_deployment_items row ${line}: manpower_unskilled_fc must be integer.`);
    }
  });

  input.machinery_equipment_items.forEach((row, index) => {
    const line = index + 1;
    if (!isValidNumberLike(row.hours)) {
      errors.push(`machinery_equipment_items row ${line}: hours must be numeric.`);
    }
  });

  input.material_procurement_items.forEach((row, index) => {
    const line = index + 1;
    if (!isValidNumberLike(row.qty)) {
      errors.push(`material_procurement_items row ${line}: qty must be numeric.`);
    }
  });

  (Array.isArray(input.material_issue_consumption_items)
    ? input.material_issue_consumption_items
    : []
  ).forEach((row, index) => {
    const line = index + 1;
    if (!isValidNumberLike(row.qty)) {
      errors.push(`material_issue_consumption_items row ${line}: qty must be numeric.`);
    }
  });

  input.deviation_report_items.forEach((row, index) => {
    const line = index + 1;
    if (!isValidNumberLike(row.planned_qty)) {
      errors.push(`deviation_report_items row ${line}: planned_qty must be numeric.`);
    }
    if (!isValidNumberLike(row.actual_qty)) {
      errors.push(`deviation_report_items row ${line}: actual_qty must be numeric.`);
    }
  });

  input.hindrance_report_items.forEach((row, index) => {
    const line = index + 1;
    const from = String(row.from_date || "").trim();
    const to = String(row.to_date || "").trim();
    if (from && !isValidDateOnly(from)) {
      errors.push(`hindrance_report_items row ${line}: from_date must be valid.`);
    }
    if (to && !isValidDateOnly(to)) {
      errors.push(`hindrance_report_items row ${line}: to_date must be valid.`);
    }
    if (from && to) {
      const total = calculateHindranceDays(from, to, includeDays);
      if (total === null) {
        errors.push(
          `hindrance_report_items row ${line}: to_date cannot be earlier than from_date.`
        );
      }
    }
  });

  if (requireForSubmit) {
    const hasAnyProgress = input.daily_work_progress_items.some(
      (row) =>
        String(row.activity).trim() ||
        row.qty_planned_day !== null ||
        row.qty_executed !== null
    );
    if (!hasAnyProgress) {
      errors.push("At least one daily_work_progress_items row should contain progress data before submit.");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
