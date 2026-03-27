export type ScheduleImplementationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type ScheduleImplementationLine = {
  id: number;
  implementation_id: number;
  sr_no: number;
  activity_id: number | null;
  wbs_code: string;
  activity_name: string;
  start_date: string;
  end_date: string;
  unit: string;
  project_qty: number;
  completed_qty_before_start: number;
  created_at: string;
  updated_at: string;
};

export type ScheduleImplementationRecord = {
  id: number;
  project_id: number;
  project_name: string;
  schedule_id: string;
  schedule_name: string;
  baseline_id: number;
  baseline_no: number;
  implementation_date: string;
  status: ScheduleImplementationStatus;
  note: string;
  submitted_at: string | null;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  created_at: string;
  updated_at: string;
  rows: ScheduleImplementationLine[];
};

export type ScheduleImplementationStore = {
  sequence: number;
  line_sequence: number;
  rows: ScheduleImplementationRecord[];
};

export type ScheduleImplementationListFilters = {
  project_id?: number;
  schedule_id?: string;
  baseline_id?: number;
  status?: ScheduleImplementationStatus;
};

export type ScheduleImplementationSaveLineInput = {
  id?: number | null;
  sr_no?: number | null;
  activity_id?: number | null;
  wbs_code?: string | null;
  activity_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  unit?: string | null;
  project_qty?: number | null;
  completed_qty_before_start?: number | null;
};

export type ScheduleImplementationSaveInput = {
  id?: number | null;
  project_id: number;
  project_name?: string | null;
  schedule_id: string;
  schedule_name?: string | null;
  baseline_id: number;
  baseline_no: number;
  implementation_date: string;
  note?: string | null;
  rows: ScheduleImplementationSaveLineInput[];
  actor?: string | null;
};
