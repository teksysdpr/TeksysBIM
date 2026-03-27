-- DPR parent table
CREATE TABLE IF NOT EXISTS dpr_report (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL,
  project_name TEXT NOT NULL,
  schedule_id TEXT,
  schedule_name TEXT,
  dpr_date DATE NOT NULL,
  day_name TEXT,
  weather TEXT NOT NULL,
  weather_impact_details TEXT,
  todays_visitors TEXT,
  safety_security_incidence TEXT,
  pending_decisions_drawing_requirements TEXT,
  critical_points TEXT,
  red_alert TEXT,
  total_manpower_sum INTEGER NOT NULL DEFAULT 0,
  site_engineer_name TEXT,
  site_engineer_designation TEXT,
  project_manager_name TEXT,
  site_engineer_signature TEXT,
  project_manager_signature TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dpr_project_date UNIQUE (project_id, dpr_date)
);

CREATE INDEX IF NOT EXISTS ix_dpr_report_project_id ON dpr_report (project_id);
CREATE INDEX IF NOT EXISTS ix_dpr_report_dpr_date ON dpr_report (dpr_date);
CREATE INDEX IF NOT EXISTS ix_dpr_report_status ON dpr_report (status);

-- Section 1
CREATE TABLE IF NOT EXISTS dpr_daily_work_progress_item (
  id BIGSERIAL PRIMARY KEY,
  dpr_report_id BIGINT NOT NULL REFERENCES dpr_report(id) ON DELETE CASCADE,
  sr_no INTEGER NOT NULL,
  activity TEXT,
  sub_activity TEXT,
  unit TEXT,
  qty_planned_day NUMERIC(18, 4),
  qty_executed NUMERIC(18, 4),
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dpr_daily_work_progress_item_report_id
  ON dpr_daily_work_progress_item (dpr_report_id, sr_no);

-- Section 2
CREATE TABLE IF NOT EXISTS dpr_manpower_deployment_item (
  id BIGSERIAL PRIMARY KEY,
  dpr_report_id BIGINT NOT NULL REFERENCES dpr_report(id) ON DELETE CASCADE,
  sr_no INTEGER NOT NULL,
  contractor_name TEXT,
  activity TEXT,
  sub_activity TEXT,
  unit TEXT,
  manpower_skilled INTEGER,
  manpower_unskilled_mc INTEGER,
  manpower_unskilled_fc INTEGER,
  total_manpower INTEGER NOT NULL DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dpr_manpower_deployment_item_report_id
  ON dpr_manpower_deployment_item (dpr_report_id, sr_no);

-- Section 3
CREATE TABLE IF NOT EXISTS dpr_machinery_equipment_item (
  id BIGSERIAL PRIMARY KEY,
  dpr_report_id BIGINT NOT NULL REFERENCES dpr_report(id) ON DELETE CASCADE,
  sr_no INTEGER NOT NULL,
  machine TEXT,
  agency TEXT,
  location TEXT,
  from_time TIME,
  to_time TIME,
  hours NUMERIC(10, 2),
  work_done TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dpr_machinery_equipment_item_report_id
  ON dpr_machinery_equipment_item (dpr_report_id, sr_no);

-- Section 4
CREATE TABLE IF NOT EXISTS dpr_material_procurement_item (
  id BIGSERIAL PRIMARY KEY,
  dpr_report_id BIGINT NOT NULL REFERENCES dpr_report(id) ON DELETE CASCADE,
  sr_no INTEGER NOT NULL,
  material TEXT,
  unit TEXT,
  qty NUMERIC(18, 4),
  grn_no TEXT,
  supplier TEXT,
  used_for TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dpr_material_procurement_item_report_id
  ON dpr_material_procurement_item (dpr_report_id, sr_no);

-- Section 5
CREATE TABLE IF NOT EXISTS dpr_material_issue_consumption_item (
  id BIGSERIAL PRIMARY KEY,
  dpr_report_id BIGINT NOT NULL REFERENCES dpr_report(id) ON DELETE CASCADE,
  sr_no INTEGER NOT NULL,
  material TEXT,
  unit TEXT,
  qty NUMERIC(18, 4),
  issue_slip_no TEXT,
  contractor TEXT,
  activity TEXT,
  sub_activity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dpr_material_issue_consumption_item_report_id
  ON dpr_material_issue_consumption_item (dpr_report_id, sr_no);

-- Section 6
CREATE TABLE IF NOT EXISTS dpr_deviation_report_item (
  id BIGSERIAL PRIMARY KEY,
  dpr_report_id BIGINT NOT NULL REFERENCES dpr_report(id) ON DELETE CASCADE,
  sr_no INTEGER NOT NULL,
  activity TEXT,
  planned_qty NUMERIC(18, 4),
  actual_qty NUMERIC(18, 4),
  deviation NUMERIC(18, 4),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dpr_deviation_report_item_report_id
  ON dpr_deviation_report_item (dpr_report_id, sr_no);

-- Section 7
CREATE TABLE IF NOT EXISTS dpr_risk_management_item (
  id BIGSERIAL PRIMARY KEY,
  dpr_report_id BIGINT NOT NULL REFERENCES dpr_report(id) ON DELETE CASCADE,
  sr_no INTEGER NOT NULL,
  activity TEXT,
  location TEXT,
  risk_or_hurdles_identified TEXT,
  mitigation_strategy TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dpr_risk_management_item_report_id
  ON dpr_risk_management_item (dpr_report_id, sr_no);

-- Section 8
CREATE TABLE IF NOT EXISTS dpr_hindrance_report_item (
  id BIGSERIAL PRIMARY KEY,
  dpr_report_id BIGINT NOT NULL REFERENCES dpr_report(id) ON DELETE CASCADE,
  sr_no INTEGER NOT NULL,
  hindrance_date DATE,
  activity_or_location TEXT,
  responsible_party TEXT,
  from_date DATE,
  to_date DATE,
  total_days INTEGER,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_dpr_hindrance_report_item_report_id
  ON dpr_hindrance_report_item (dpr_report_id, sr_no);
