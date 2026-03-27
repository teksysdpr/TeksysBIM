export type MisStatus = "draft" | "submitted" | "approved";

export type MisIdLike = number | null;
export type MisIsoDate = string;
export type MisIsoDateTime = string;

export type ProjectMisMasterRow = {
  id: number;
  project_id: number;
  schedule_id: string;
  sr_no: number;
  activity: string;
  sub_activity: string;
  msp_start_date: MisIsoDate;
  msp_end_date: MisIsoDate;
  revised_start_date: MisIsoDate;
  revised_end_date: MisIsoDate;
  actual_start_date: MisIsoDate;
  actual_end_date: MisIsoDate;
  unit: string;
  project_qty: number;
  total_qty_done_till_last_month: number;
  total_qty_done_till_today: number;
  percentage_completion_till_yesterday: number;
  balance_qty: number;
  days_available_as_per_original_msp: number;
  days_available_as_per_revised_baseline: number;
  per_day_target: number;
  monthly_target_should_be: number;
  monthly_target_taken: number;
  work_done_till_yesterday: number;
  done_today_latest: number;
  upto_date_done_in_month: number;
  percentage_completion_in_month: number;
  days_performance: string;
  created_at: MisIsoDateTime;
  updated_at: MisIsoDateTime;
};

export type ProjectMisMasterInputRow = Omit<
  ProjectMisMasterRow,
  | "id"
  | "project_id"
  | "sr_no"
  | "total_qty_done_till_today"
  | "percentage_completion_till_yesterday"
  | "balance_qty"
  | "days_available_as_per_original_msp"
  | "days_available_as_per_revised_baseline"
  | "per_day_target"
  | "monthly_target_should_be"
  | "work_done_till_yesterday"
  | "done_today_latest"
  | "upto_date_done_in_month"
  | "percentage_completion_in_month"
  | "days_performance"
  | "created_at"
  | "updated_at"
>;

export type ProjectMisDailyReportLine = {
  id: number;
  daily_report_id: number;
  master_activity_id: MisIdLike;
  sr_no: number;
  sub_activity: string;
  unit: string;
  per_day_target: number;
  done_today: number;
  deviation: number;
  days_performance: string;
  reason_for_poor_output_today: string;
  specify_reasons_in_detail: string;
  available_skilled_manpower_on_site: number;
  additional_skilled_manpower_requirement: number;
  created_at: MisIsoDateTime;
  updated_at: MisIsoDateTime;
};

export type ProjectMisDailyReport = {
  id: number;
  project_id: number;
  project_name: string;
  schedule_id: string;
  schedule_name: string;
  report_date: MisIsoDate;
  report_month: string;
  building_or_tower: string;
  status: MisStatus;
  created_by: string;
  approved_by: string;
  lines: ProjectMisDailyReportLine[];
  created_at: MisIsoDateTime;
  updated_at: MisIsoDateTime;
};

export type ProjectMisDailyLineInput = Omit<
  ProjectMisDailyReportLine,
  | "id"
  | "daily_report_id"
  | "sr_no"
  | "deviation"
  | "days_performance"
  | "created_at"
  | "updated_at"
>;

export type ProjectMisDailyReportInput = {
  id?: number | null;
  project_id: number;
  project_name: string;
  schedule_id: string;
  schedule_name: string;
  report_date: MisIsoDate;
  report_month?: string;
  building_or_tower?: string;
  status?: MisStatus;
  created_by?: string;
  approved_by?: string;
  lines: ProjectMisDailyLineInput[];
};

export type ProjectMisStore = {
  master_sequence: number;
  daily_sequence: number;
  daily_line_sequence: number;
  masters: ProjectMisMasterRow[];
  daily_reports: ProjectMisDailyReport[];
};

export type ProjectMisMasterListFilters = {
  project_id?: number;
  schedule_id?: string;
};

export type ProjectMisDailyListFilters = {
  project_id?: number;
  schedule_id?: string;
  report_date?: string;
  status?: MisStatus;
  include_lines?: boolean;
};

export const MIS_PERFORMANCE_TEXT = {
  NO_WORK: "No work Today ? What happened Guys?",
  WELL_DONE: "Well Done Guys",
  MISSED: "Target for Day missed guys",
} as const;
