export type DprStatus = "draft" | "submitted" | "approved" | "rejected";

export type IdLike = number | null;
export type IsoDate = string;
export type IsoDateTime = string;

export type DprDailyWorkProgressItem = {
  id: IdLike;
  dpr_report_id: IdLike;
  sr_no: number;
  activity: string;
  sub_activity: string;
  unit: string;
  qty_planned_day: number | null;
  qty_executed: number | null;
  remark: string;
  created_at: IsoDateTime | null;
  updated_at: IsoDateTime | null;
};

export type DprManpowerDeploymentItem = {
  id: IdLike;
  dpr_report_id: IdLike;
  sr_no: number;
  contractor_name: string;
  activity: string;
  sub_activity: string;
  unit: string;
  manpower_skilled: number | null;
  manpower_unskilled_mc: number | null;
  manpower_unskilled_fc: number | null;
  total_manpower: number;
  remarks: string;
  created_at: IsoDateTime | null;
  updated_at: IsoDateTime | null;
};

export type DprMachineryEquipmentItem = {
  id: IdLike;
  dpr_report_id: IdLike;
  sr_no: number;
  machine: string;
  agency: string;
  location: string;
  from_time: string;
  to_time: string;
  hours: number | null;
  work_done: string;
  created_at: IsoDateTime | null;
  updated_at: IsoDateTime | null;
};

export type DprMaterialProcurementItem = {
  id: IdLike;
  dpr_report_id: IdLike;
  sr_no: number;
  material: string;
  unit: string;
  qty: number | null;
  grn_no: string;
  supplier: string;
  used_for: string;
  created_at: IsoDateTime | null;
  updated_at: IsoDateTime | null;
};

export type DprMaterialIssueConsumptionItem = {
  id: IdLike;
  dpr_report_id: IdLike;
  sr_no: number;
  material: string;
  unit: string;
  qty: number | null;
  issue_slip_no: string;
  contractor: string;
  activity: string;
  sub_activity: string;
  created_at: IsoDateTime | null;
  updated_at: IsoDateTime | null;
};

export type DprDeviationReportItem = {
  id: IdLike;
  dpr_report_id: IdLike;
  sr_no: number;
  activity: string;
  planned_qty: number | null;
  actual_qty: number | null;
  deviation: number | null;
  remarks: string;
  created_at: IsoDateTime | null;
  updated_at: IsoDateTime | null;
};

export type DprRiskManagementItem = {
  id: IdLike;
  dpr_report_id: IdLike;
  sr_no: number;
  activity: string;
  location: string;
  risk_or_hurdles_identified: string;
  mitigation_strategy: string;
  remark: string;
  created_at: IsoDateTime | null;
  updated_at: IsoDateTime | null;
};

export type DprHindranceReportItem = {
  id: IdLike;
  dpr_report_id: IdLike;
  sr_no: number;
  hindrance_date: string;
  activity_or_location: string;
  responsible_party: string;
  from_date: string;
  to_date: string;
  total_days: number | null;
  remarks: string;
  created_at: IsoDateTime | null;
  updated_at: IsoDateTime | null;
};

export type DprReportBase = {
  project_id: number | null;
  project_name: string;
  schedule_id: string;
  schedule_name: string;
  dpr_date: IsoDate;
  day_name: string;
  weather: string;
  weather_impact_details: string;
  todays_visitors: string;
  safety_security_incidence: string;
  pending_decisions_drawing_requirements: string;
  critical_points: string;
  red_alert: string;
  total_manpower_sum: number;
  site_engineer_name: string;
  site_engineer_designation: string;
  project_manager_name: string;
  site_engineer_signature: string;
  project_manager_signature: string;
  status: DprStatus;
  created_by: string;
  daily_work_progress_items: DprDailyWorkProgressItem[];
  manpower_deployment_items: DprManpowerDeploymentItem[];
  machinery_equipment_items: DprMachineryEquipmentItem[];
  material_procurement_items: DprMaterialProcurementItem[];
  material_issue_consumption_items: DprMaterialIssueConsumptionItem[];
  deviation_report_items: DprDeviationReportItem[];
  risk_management_items: DprRiskManagementItem[];
  hindrance_report_items: DprHindranceReportItem[];
};

export type DprReportRecord = DprReportBase & {
  id: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
};

export type DprReportInput = DprReportBase & {
  id?: number | null;
};

export type DprStore = {
  sequence: number;
  row_sequence: number;
  reports: DprReportRecord[];
};

export type DprListFilters = {
  project_id?: number;
  dpr_date?: string;
  status?: DprStatus;
  include_rows?: boolean;
};

export type DprMutationOptions = {
  allow_duplicate?: boolean;
  allow_edit_submitted?: boolean;
  inclusive_hindrance_days?: boolean;
};

function createBaseRow() {
  return {
    id: null,
    dpr_report_id: null,
    sr_no: 1,
    created_at: null,
    updated_at: null,
  };
}

export function createEmptyDailyWorkProgressItem(): DprDailyWorkProgressItem {
  return {
    ...createBaseRow(),
    activity: "",
    sub_activity: "",
    unit: "",
    qty_planned_day: null,
    qty_executed: null,
    remark: "",
  };
}

export function createEmptyManpowerDeploymentItem(): DprManpowerDeploymentItem {
  return {
    ...createBaseRow(),
    contractor_name: "",
    activity: "",
    sub_activity: "",
    unit: "",
    manpower_skilled: null,
    manpower_unskilled_mc: null,
    manpower_unskilled_fc: null,
    total_manpower: 0,
    remarks: "",
  };
}

export function createEmptyMachineryEquipmentItem(): DprMachineryEquipmentItem {
  return {
    ...createBaseRow(),
    machine: "",
    agency: "",
    location: "",
    from_time: "",
    to_time: "",
    hours: null,
    work_done: "",
  };
}

export function createEmptyMaterialProcurementItem(): DprMaterialProcurementItem {
  return {
    ...createBaseRow(),
    material: "",
    unit: "",
    qty: null,
    grn_no: "",
    supplier: "",
    used_for: "",
  };
}

export function createEmptyMaterialIssueConsumptionItem(): DprMaterialIssueConsumptionItem {
  return {
    ...createBaseRow(),
    material: "",
    unit: "",
    qty: null,
    issue_slip_no: "",
    contractor: "",
    activity: "",
    sub_activity: "",
  };
}

export function createEmptyDeviationReportItem(): DprDeviationReportItem {
  return {
    ...createBaseRow(),
    activity: "",
    planned_qty: null,
    actual_qty: null,
    deviation: null,
    remarks: "",
  };
}

export function createEmptyRiskManagementItem(): DprRiskManagementItem {
  return {
    ...createBaseRow(),
    activity: "",
    location: "",
    risk_or_hurdles_identified: "",
    mitigation_strategy: "",
    remark: "",
  };
}

export function createEmptyHindranceReportItem(): DprHindranceReportItem {
  return {
    ...createBaseRow(),
    hindrance_date: "",
    activity_or_location: "",
    responsible_party: "",
    from_date: "",
    to_date: "",
    total_days: null,
    remarks: "",
  };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyDprReportInput(): DprReportInput {
  return {
    project_id: null,
    project_name: "",
    schedule_id: "",
    schedule_name: "",
    dpr_date: todayIsoDate(),
    day_name: "",
    weather: "",
    weather_impact_details: "",
    todays_visitors: "",
    safety_security_incidence: "",
    pending_decisions_drawing_requirements: "",
    critical_points: "",
    red_alert: "",
    total_manpower_sum: 0,
    site_engineer_name: "",
    site_engineer_designation: "",
    project_manager_name: "",
    site_engineer_signature: "",
    project_manager_signature: "",
    status: "draft",
    created_by: "",
    daily_work_progress_items: [createEmptyDailyWorkProgressItem()],
    manpower_deployment_items: [createEmptyManpowerDeploymentItem()],
    machinery_equipment_items: [createEmptyMachineryEquipmentItem()],
    material_procurement_items: [createEmptyMaterialProcurementItem()],
    material_issue_consumption_items: [createEmptyMaterialIssueConsumptionItem()],
    deviation_report_items: [createEmptyDeviationReportItem()],
    risk_management_items: [createEmptyRiskManagementItem()],
    hindrance_report_items: [createEmptyHindranceReportItem()],
  };
}
