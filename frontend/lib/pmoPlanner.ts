export type ActivityType = "SUMMARY" | "TASK" | "MILESTONE";
export type BaselineSlot = "BASELINE_1" | "BASELINE_2" | "BASELINE_3";
export type ScheduleType = "MILESTONE" | "EVM";

export type EVMMaterialCostLine = {
  id: string;
  description: string;
  unit: string;
  qty: number | null;
  rate: number | null;
  gstPercent: number | null;
};

export type EVMLabourCostLine = {
  id: string;
  labourType: string;
  unit: string;
  qty: number | null;
  rate: number | null;
  gstPercent: number | null;
};

export type EVMMachineryCostLine = {
  id: string;
  machineryType: string;
  unit: string;
  rate: number | null;
  cost: number | null;
  gstPercent: number | null;
};

export type EVMCostAnalysis = {
  materials: EVMMaterialCostLine[];
  labours: EVMLabourCostLine[];
  machinery: EVMMachineryCostLine[];
};

export type PlannerRow = {
  uid: string;
  sourceScheduleId: number | null;
  scheduleType: ScheduleType;
  activityId: number;
  wbsCode: string;
  activityName: string;
  parentActivityId: number | null;
  indentLevel: number;
  activityType: ActivityType;
  segment: string;
  tradeCategory: string;
  unit: string;
  plannedQty: number | null;
  durationDays: number;
  startDate: string;
  finishDate: string;
  predecessors: string;
  successors: string;
  baseline1Start: string;
  baseline1Finish: string;
  baseline1Duration: number;
  baseline2Start: string;
  baseline2Finish: string;
  baseline2Duration: number;
  baseline3Start: string;
  baseline3Finish: string;
  baseline3Duration: number;
  actualStart: string;
  actualFinish: string;
  status: string;
  percentComplete: number;
  delayDays: number;
  remarks: string;
  evmMaterialCost: number | null;
  evmLabourCost: number | null;
  evmOverheadCost: number | null;
  evmCostAnalysis: EVMCostAnalysis | null;
  evmMaterialSubtotal: number | null;
  evmLabourSubtotal: number | null;
  evmMachinerySubtotal: number | null;
  evmTotalGst: number | null;
  evmGrandTotalCost: number | null;
  evmActivityCostPerUnit: number | null;
  evmActivityTotalCost: number | null;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  fontColor?: string;
};

export type ProjectCalendar = {
  id: string;
  name: string;
  workingDays: number[];
  holidays: string[];
  events?: Array<{
    id: string;
    date: string;
    detail: string;
  }>;
  createdAt: string;
};

export type RevisionEntry = {
  id: string;
  projectId: number;
  projectName: string;
  revisionNo: number;
  reason: string;
  createdAt: string;
  rowCount: number;
  snapshot: PlannerRow[];
};

export type PortalUnitDomain =
  | "Materials"
  | "Labor"
  | "Activities"
  | "Machinery and Equipment"
  | "Concrete and Mortar"
  | "Miscellaneous"
  | "Custom";

export type PortalUnitOption = {
  id: string;
  label: string;
  domain: PortalUnitDomain;
  group: string;
};

export type PortalUnitStore = {
  selectedUnitIds: string[];
  customUnits: PortalUnitOption[];
};

const BUILT_IN_PORTAL_UNITS: PortalUnitOption[] = [
  // Materials: Length/Distance
  { id: "mat_len_m", label: "Meter (m)", domain: "Materials", group: "Length/Distance" },
  { id: "mat_len_cm", label: "Centimeter (cm)", domain: "Materials", group: "Length/Distance" },
  { id: "mat_len_mm", label: "Millimeter (mm)", domain: "Materials", group: "Length/Distance" },
  { id: "mat_len_km", label: "Kilometer (km)", domain: "Materials", group: "Length/Distance" },
  { id: "mat_len_ft", label: "Feet (ft)", domain: "Materials", group: "Length/Distance" },
  { id: "mat_len_in", label: "Inch (in)", domain: "Materials", group: "Length/Distance" },
  { id: "mat_len_yd", label: "Yard (yd)", domain: "Materials", group: "Length/Distance" },
  // Materials: Area
  { id: "mat_area_m2", label: "Square Meter (m²)", domain: "Materials", group: "Area" },
  { id: "mat_area_ft2", label: "Square Foot (ft²)", domain: "Materials", group: "Area" },
  { id: "mat_area_in2", label: "Square Inch (in²)", domain: "Materials", group: "Area" },
  { id: "mat_area_acre", label: "Acre", domain: "Materials", group: "Area" },
  { id: "mat_area_ha", label: "Hectare (ha)", domain: "Materials", group: "Area" },
  // Materials: Volume
  { id: "mat_vol_m3", label: "Cubic Meter (m³)", domain: "Materials", group: "Volume" },
  { id: "mat_vol_ft3", label: "Cubic Foot (ft³)", domain: "Materials", group: "Volume" },
  { id: "mat_vol_l", label: "Liter (L)", domain: "Materials", group: "Volume" },
  { id: "mat_vol_gal", label: "Gallon (gal)", domain: "Materials", group: "Volume" },
  { id: "mat_vol_ml", label: "Milliliter (mL)", domain: "Materials", group: "Volume" },
  { id: "mat_vol_yd3", label: "Cubic Yard (yd³)", domain: "Materials", group: "Volume" },
  // Materials: Weight/Mass
  { id: "mat_wt_kg", label: "Kilogram (kg)", domain: "Materials", group: "Weight/Mass" },
  { id: "mat_wt_tonne", label: "Metric Ton (t or tonne)", domain: "Materials", group: "Weight/Mass" },
  { id: "mat_wt_g", label: "Gram (g)", domain: "Materials", group: "Weight/Mass" },
  { id: "mat_wt_lbs", label: "Pound (lbs)", domain: "Materials", group: "Weight/Mass" },
  { id: "mat_wt_oz", label: "Ounce (oz)", domain: "Materials", group: "Weight/Mass" },
  // Materials: Density
  {
    id: "mat_density_kg_m3",
    label: "Kilogram per Cubic Meter (kg/m³)",
    domain: "Materials",
    group: "Density",
  },
  {
    id: "mat_density_lb_ft3",
    label: "Pound per Cubic Foot (lb/ft³)",
    domain: "Materials",
    group: "Density",
  },
  // Materials: Flow Rate
  {
    id: "mat_flow_l_min",
    label: "Liter per Minute (L/min)",
    domain: "Materials",
    group: "Flow Rate",
  },
  {
    id: "mat_flow_gpm",
    label: "Gallon per Minute (gpm)",
    domain: "Materials",
    group: "Flow Rate",
  },
  // Materials: Quantity
  { id: "mat_qty_ton", label: "Ton (t)", domain: "Materials", group: "Quantity" },
  { id: "mat_qty_kg", label: "Kilogram (kg)", domain: "Materials", group: "Quantity" },
  { id: "mat_qty_lb", label: "Pound (lb)", domain: "Materials", group: "Quantity" },
  // Materials: Pressure
  { id: "mat_press_pa", label: "Pascal (Pa)", domain: "Materials", group: "Pressure" },
  { id: "mat_press_bar", label: "Bar (bar)", domain: "Materials", group: "Pressure" },
  { id: "mat_press_psi", label: "Pounds per Square Inch (psi)", domain: "Materials", group: "Pressure" },
  // Materials: Temperature
  { id: "mat_temp_c", label: "Celsius (°C)", domain: "Materials", group: "Temperature" },
  { id: "mat_temp_f", label: "Fahrenheit (°F)", domain: "Materials", group: "Temperature" },
  // Materials: Strength/Force
  { id: "mat_force_n", label: "Newton (N)", domain: "Materials", group: "Strength/Force" },
  { id: "mat_force_kn", label: "Kilonewton (kN)", domain: "Materials", group: "Strength/Force" },
  { id: "mat_force_lbf", label: "Pound-Force (lbf)", domain: "Materials", group: "Strength/Force" },
  // Materials: Moisture Content
  { id: "mat_moist_pct", label: "Percentage (%)", domain: "Materials", group: "Moisture Content" },
  {
    id: "mat_moist_kg_m3",
    label: "Kilograms per Cubic Meter (kg/m³)",
    domain: "Materials",
    group: "Moisture Content",
  },

  // Labor
  { id: "lab_time_hr", label: "Hour (hr)", domain: "Labor", group: "Time" },
  { id: "lab_time_day", label: "Day (d)", domain: "Labor", group: "Time" },
  { id: "lab_time_wk", label: "Week (wk)", domain: "Labor", group: "Time" },
  { id: "lab_time_mo", label: "Month (mo)", domain: "Labor", group: "Time" },
  { id: "lab_work_ph", label: "Person-Hour (ph)", domain: "Labor", group: "Work Quantity" },
  { id: "lab_work_pd", label: "Person-Day (pd)", domain: "Labor", group: "Work Quantity" },
  {
    id: "lab_prod_unit_hr",
    label: "Units per Hour (unit/hr)",
    domain: "Labor",
    group: "Labor Productivity",
  },
  {
    id: "lab_prod_m3_hr",
    label: "Cubic Meter per Hour (m³/hr)",
    domain: "Labor",
    group: "Labor Productivity",
  },
  {
    id: "lab_prod_m2_hr",
    label: "Square Meter per Hour (m²/hr)",
    domain: "Labor",
    group: "Labor Productivity",
  },
  { id: "lab_cost_hourly", label: "Hourly Rate", domain: "Labor", group: "Labor Costs" },
  { id: "lab_cost_daily", label: "Daily Rate", domain: "Labor", group: "Labor Costs" },

  // Activities
  { id: "act_dur_hr", label: "Hour (hr)", domain: "Activities", group: "Duration" },
  { id: "act_dur_day", label: "Day (d)", domain: "Activities", group: "Duration" },
  { id: "act_dur_wk", label: "Week (wk)", domain: "Activities", group: "Duration" },
  { id: "act_prog_pct", label: "Percentage (%)", domain: "Activities", group: "Work Progress" },
  {
    id: "act_work_units",
    label: "Work Units (e.g., m² for tiling, m³ for concrete, etc.)",
    domain: "Activities",
    group: "Work Progress",
  },
  {
    id: "act_completion_pct",
    label: "Percentage (%) Completion",
    domain: "Activities",
    group: "Completion",
  },
  {
    id: "act_cycle_hr_activity",
    label: "Time per Activity (hr/activity)",
    domain: "Activities",
    group: "Cycle Time",
  },
  {
    id: "act_workers",
    label: "Number of Workers (workers)",
    domain: "Activities",
    group: "Manpower Allocation",
  },

  // Machinery and Equipment
  { id: "mach_power_hp", label: "Horsepower (HP)", domain: "Machinery and Equipment", group: "Power" },
  { id: "mach_power_kw", label: "Kilowatt (kW)", domain: "Machinery and Equipment", group: "Power" },
  { id: "mach_power_mw", label: "Megawatt (MW)", domain: "Machinery and Equipment", group: "Power" },
  {
    id: "mach_fuel_l_hr",
    label: "Liter per Hour (L/hr)",
    domain: "Machinery and Equipment",
    group: "Fuel Consumption",
  },
  {
    id: "mach_fuel_gal_hr",
    label: "Gallon per Hour (gal/hr)",
    domain: "Machinery and Equipment",
    group: "Fuel Consumption",
  },
  {
    id: "mach_fuel_l_km",
    label: "Liter per Kilometer (L/km)",
    domain: "Machinery and Equipment",
    group: "Fuel Consumption",
  },
  {
    id: "mach_cap_t",
    label: "Ton (tonne or t) – For lifting equipment",
    domain: "Machinery and Equipment",
    group: "Capacity",
  },
  {
    id: "mach_cap_kg",
    label: "Kilogram (kg) – For lifting equipment",
    domain: "Machinery and Equipment",
    group: "Capacity",
  },
  {
    id: "mach_cap_m3",
    label: "Cubic Meter (m³) – For trucks, mixers, etc.",
    domain: "Machinery and Equipment",
    group: "Capacity",
  },
  {
    id: "mach_speed_km_h",
    label: "Kilometer per Hour (km/h)",
    domain: "Machinery and Equipment",
    group: "Speed/Travel",
  },
  {
    id: "mach_speed_m_s",
    label: "Meter per Second (m/s)",
    domain: "Machinery and Equipment",
    group: "Speed/Travel",
  },
  {
    id: "mach_eff_pct",
    label: "Percent (%) Efficiency",
    domain: "Machinery and Equipment",
    group: "Efficiency",
  },
  {
    id: "mach_oh_hr",
    label: "Hour (hr)",
    domain: "Machinery and Equipment",
    group: "Operating Hours",
  },
  {
    id: "mach_oh_shift",
    label: "Shift (sh)",
    domain: "Machinery and Equipment",
    group: "Operating Hours",
  },
  {
    id: "mach_rate_m3_hr",
    label: "Cubic Meter per Hour (m³/hr)",
    domain: "Machinery and Equipment",
    group: "Work Rate",
  },
  {
    id: "mach_rate_t_hr",
    label: "Ton per Hour (t/hr)",
    domain: "Machinery and Equipment",
    group: "Work Rate",
  },
  {
    id: "mach_pressure_bar",
    label: "Bar (bar) – Hydraulic pressure",
    domain: "Machinery and Equipment",
    group: "Pressure",
  },
  {
    id: "mach_pressure_psi",
    label: "PSI (psi) – Hydraulic pressure",
    domain: "Machinery and Equipment",
    group: "Pressure",
  },

  // Concrete and Mortar
  {
    id: "concrete_mix_ratio",
    label: "Cement: Sand: Aggregate (for example, 1:2:3)",
    domain: "Concrete and Mortar",
    group: "Mix Ratio",
  },
  {
    id: "concrete_strength_mpa",
    label: "Megapascal (MPa)",
    domain: "Concrete and Mortar",
    group: "Concrete Strength",
  },
  {
    id: "concrete_strength_psi",
    label: "Pounds per Square Inch (psi)",
    domain: "Concrete and Mortar",
    group: "Concrete Strength",
  },
  {
    id: "concrete_wc_pct",
    label: "Percentage (%)",
    domain: "Concrete and Mortar",
    group: "Water-Cement Ratio",
  },
  {
    id: "concrete_slump_mm",
    label: "Millimeter (mm)",
    domain: "Concrete and Mortar",
    group: "Slump",
  },
  {
    id: "concrete_comp_n_mm2",
    label: "Newton per Square Millimeter (N/mm²)",
    domain: "Concrete and Mortar",
    group: "Compressive Strength",
  },

  // Miscellaneous
  { id: "misc_kwh", label: "Kilowatt-Hour (kWh)", domain: "Miscellaneous", group: "Electricity Consumption" },
  { id: "misc_amp", label: "Ampere (A)", domain: "Miscellaneous", group: "Electricity Consumption" },
  { id: "misc_db_acoustic", label: "Decibel (dB)", domain: "Miscellaneous", group: "Acoustic Levels" },
  { id: "misc_lux", label: "Lux (lx)", domain: "Miscellaneous", group: "Lighting Levels" },
  { id: "misc_db_vibration", label: "Decibel (dB)", domain: "Miscellaneous", group: "Vibration" },
  { id: "misc_hz", label: "Hertz (Hz)", domain: "Miscellaneous", group: "Vibration" },
];

const DEFAULT_SELECTED_PORTAL_UNITS = [
  "mat_len_m",
  "mat_area_m2",
  "mat_vol_m3",
  "mat_wt_kg",
  "mat_wt_tonne",
  "mat_qty_ton",
  "mat_press_bar",
  "mat_press_psi",
  "lab_time_hr",
  "lab_time_day",
  "act_dur_day",
  "act_prog_pct",
  "act_workers",
  "mach_oh_hr",
  "mach_oh_shift",
  "concrete_strength_mpa",
  "misc_kwh",
];

type GridStore = Record<string, PlannerRow[]>;
type CalendarStore = ProjectCalendar[];
type AssignmentStore = Record<string, string>;
type ScheduleAssignmentStore = Record<string, string>;
type RevisionStore = RevisionEntry[];
type PortalUnitStoreRow = {
  selectedUnitIds: string[];
  customUnits: PortalUnitOption[];
};

export const PMO_GRID_STORAGE_KEY = "dpr_pmo_schedule_grid_v4";
export const PMO_CALENDAR_STORAGE_KEY = "dpr_pmo_calendars_v1";
export const PMO_CALENDAR_ASSIGNMENT_STORAGE_KEY = "dpr_pmo_project_calendar_assignment_v1";
export const PMO_SCHEDULE_CALENDAR_ASSIGNMENT_STORAGE_KEY =
  "dpr_pmo_schedule_calendar_assignment_v1";
export const PMO_REVISION_STORAGE_KEY = "dpr_pmo_revisions_v1";
export const PMO_PORTAL_UNITS_STORAGE_KEY = "dpr_portal_units_v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readPlannerGridStore(): GridStore {
  return readJson<GridStore>(PMO_GRID_STORAGE_KEY, {});
}

export function getProjectPlannerRows(projectId: number): PlannerRow[] {
  const store = readPlannerGridStore();
  return store[String(projectId)] || [];
}

export function saveProjectPlannerRows(projectId: number, rows: PlannerRow[]) {
  const store = readPlannerGridStore();
  store[String(projectId)] = rows;
  writeJson(PMO_GRID_STORAGE_KEY, store);
}

export function readCalendars(): CalendarStore {
  const rows = readJson<CalendarStore>(PMO_CALENDAR_STORAGE_KEY, []);
  return rows.map((row) => {
    const holidays = Array.isArray(row.holidays)
      ? [...new Set(row.holidays.map((x) => String(x).trim()).filter(Boolean))].sort()
      : [];
    const events = Array.isArray(row.events)
      ? row.events
          .map((event) => ({
            id: String(event?.id || ""),
            date: String(event?.date || ""),
            detail: String(event?.detail || ""),
          }))
          .filter((event) => event.id && event.date)
      : holidays.map((date) => ({
          id: `evt_${date}`,
          date,
          detail: "",
        }));
    return {
      ...row,
      holidays,
      events,
    };
  });
}

export function saveCalendars(rows: CalendarStore) {
  writeJson(PMO_CALENDAR_STORAGE_KEY, rows);
}

export function readCalendarAssignments(): AssignmentStore {
  return readJson<AssignmentStore>(PMO_CALENDAR_ASSIGNMENT_STORAGE_KEY, {});
}

export function getAssignedCalendarId(projectId: number): string | null {
  const store = readCalendarAssignments();
  return store[String(projectId)] || null;
}

export function setAssignedCalendarId(projectId: number, calendarId: string) {
  const store = readCalendarAssignments();
  store[String(projectId)] = calendarId;
  writeJson(PMO_CALENDAR_ASSIGNMENT_STORAGE_KEY, store);
}

function scheduleCalendarAssignmentKey(projectId: number, scheduleId: number): string {
  return `${projectId}:${scheduleId}`;
}

export function readScheduleCalendarAssignments(): ScheduleAssignmentStore {
  return readJson<ScheduleAssignmentStore>(PMO_SCHEDULE_CALENDAR_ASSIGNMENT_STORAGE_KEY, {});
}

export function getAssignedScheduleCalendarId(
  projectId: number,
  scheduleId: number
): string | null {
  const store = readScheduleCalendarAssignments();
  return store[scheduleCalendarAssignmentKey(projectId, scheduleId)] || null;
}

export function setAssignedScheduleCalendarId(
  projectId: number,
  scheduleId: number,
  calendarId: string
) {
  const store = readScheduleCalendarAssignments();
  store[scheduleCalendarAssignmentKey(projectId, scheduleId)] = calendarId;
  writeJson(PMO_SCHEDULE_CALENDAR_ASSIGNMENT_STORAGE_KEY, store);
}

export function readRevisions(): RevisionStore {
  return readJson<RevisionStore>(PMO_REVISION_STORAGE_KEY, []);
}

export function listProjectRevisions(projectId: number): RevisionEntry[] {
  return readRevisions()
    .filter((x) => x.projectId === projectId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function addRevisionEntry(entry: RevisionEntry) {
  const rows = readRevisions();
  rows.unshift(entry);
  writeJson(PMO_REVISION_STORAGE_KEY, rows);
}

function normalizeUnitId(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizePortalUnitOption(row: any): PortalUnitOption | null {
  const label = String(row?.label || "").trim();
  if (!label) return null;
  const idCandidate = String(row?.id || "").trim();
  const id = idCandidate || `custom_${normalizeUnitId(label)}`;
  const domainRaw = String(row?.domain || "Custom").trim() as PortalUnitDomain;
  const domain: PortalUnitDomain =
    domainRaw === "Materials" ||
    domainRaw === "Labor" ||
    domainRaw === "Activities" ||
    domainRaw === "Machinery and Equipment" ||
    domainRaw === "Concrete and Mortar" ||
    domainRaw === "Miscellaneous"
      ? domainRaw
      : "Custom";
  const group = String(row?.group || "Custom").trim() || "Custom";
  return {
    id,
    label,
    domain,
    group,
  };
}

function dedupeUnitOptions(rows: PortalUnitOption[]): PortalUnitOption[] {
  const map = new Map<string, PortalUnitOption>();
  rows.forEach((row) => {
    const key = String(row.id || "").trim();
    if (!key) return;
    if (!map.has(key)) map.set(key, row);
  });
  return Array.from(map.values());
}

export function listBuiltInPortalUnits(): PortalUnitOption[] {
  return [...BUILT_IN_PORTAL_UNITS];
}

export function readPortalUnitStore(): PortalUnitStore {
  const raw = readJson<PortalUnitStoreRow>(PMO_PORTAL_UNITS_STORAGE_KEY, {
    selectedUnitIds: [...DEFAULT_SELECTED_PORTAL_UNITS],
    customUnits: [],
  });
  const customUnits = Array.isArray(raw.customUnits)
    ? raw.customUnits
        .map((row) => normalizePortalUnitOption(row))
        .filter((row): row is PortalUnitOption => !!row)
    : [];
  const catalog = dedupeUnitOptions([...BUILT_IN_PORTAL_UNITS, ...customUnits]);
  const allowedIds = new Set(catalog.map((row) => row.id));
  const selectedUnitIdsRaw = Array.isArray(raw.selectedUnitIds)
    ? raw.selectedUnitIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
  const selectedUnitIds = selectedUnitIdsRaw.filter((id) => allowedIds.has(id));
  return {
    selectedUnitIds: selectedUnitIds.length ? selectedUnitIds : [...DEFAULT_SELECTED_PORTAL_UNITS],
    customUnits,
  };
}

export function savePortalUnitStore(store: PortalUnitStore) {
  const normalizedCustom = dedupeUnitOptions(
    (Array.isArray(store.customUnits) ? store.customUnits : [])
      .map((row) => normalizePortalUnitOption(row))
      .filter((row): row is PortalUnitOption => !!row)
  );
  const catalog = dedupeUnitOptions([...BUILT_IN_PORTAL_UNITS, ...normalizedCustom]);
  const allowedIds = new Set(catalog.map((row) => row.id));
  const selectedIds = (Array.isArray(store.selectedUnitIds) ? store.selectedUnitIds : [])
    .map((id) => String(id || "").trim())
    .filter((id) => allowedIds.has(id));
  writeJson(PMO_PORTAL_UNITS_STORAGE_KEY, {
    selectedUnitIds: selectedIds.length ? selectedIds : [...DEFAULT_SELECTED_PORTAL_UNITS],
    customUnits: normalizedCustom,
  } satisfies PortalUnitStoreRow);
}

export function getPortalUnitCatalog(store?: PortalUnitStore): PortalUnitOption[] {
  const source = store || readPortalUnitStore();
  return dedupeUnitOptions([...BUILT_IN_PORTAL_UNITS, ...source.customUnits]);
}

export function getActivePortalUnits(store?: PortalUnitStore): PortalUnitOption[] {
  const source = store || readPortalUnitStore();
  const catalog = getPortalUnitCatalog(source);
  const byId = new Map(catalog.map((row) => [row.id, row] as const));
  return source.selectedUnitIds
    .map((id) => byId.get(id))
    .filter((row): row is PortalUnitOption => !!row);
}
