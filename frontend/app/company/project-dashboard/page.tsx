"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  HardHat,
  ImagePlus,
  MapPin,
  PackageOpen,
  Pencil,
  PlayCircle,
  ShieldAlert,
  TimerReset,
  Trash2,
  Upload,
  Users,
  Wrench,
} from "lucide-react";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";
import DetailedMisWorkbench from "@/components/project-dashboard/DetailedMisWorkbench";
import { getAccessToken, getStoredUser } from "@/lib/storage";
import {
  getLandingPathFromAuthContext,
  resolveAuthCategory,
  type AuthCategory,
} from "@/lib/landing";
import {
  type CompanyProjectRow,
  type CompanyProjectStructureRow,
  type CompanyProjectStructuresSummary,
  getCompanyProjectStructures,
  getCompanyProjectStructuresSummary,
  getCompanyProjects,
} from "@/services/companyService";
import {
  type ScheduleRow,
  type ScheduleSummary,
  formatScheduleStatus,
  getScheduleSummary,
  getSchedules,
} from "@/app/services/projectControlService";
import {
  getProjectExecutionDprInsights,
  type ProjectExecutionDprInsights,
  type ProjectExecutionDprRegisterRow,
  type ProjectExecutionDprSummary,
} from "@/app/services/projectExecutionService";
import {
  listDprReports,
} from "@/app/services/dprService";
import type { DprReportRecord } from "@/lib/dprTypes";
import { listBaselineApprovalQueue } from "@/app/services/pmoScheduleApprovalService";
import {
  PROJECT_MEDIA_CHANGED_EVENT,
  readProjectImageMap,
  removeProjectImage,
  setProjectImage,
} from "@/lib/projectMedia";

type StoredProjectRef = string | { id?: number | null; name?: string | null };
type StoredUserSnapshot = {
  category?: string | null;
  role?: string | null;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  projects?: StoredProjectRef[] | null;
  project_ids?: Array<number | string> | null;
};

type ProjectRiskRow = {
  id: number;
  scheduleName: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  reason: string;
  owner: string;
  delayDays: number;
};

type DashboardTabKey =
  | "overview"
  | "today"
  | "progress"
  | "resources"
  | "risks"
  | "dpr"
  | "approvals"
  | "attachments";

const TAB_ITEMS: Array<{ key: DashboardTabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "today", label: "Today's Work" },
  { key: "progress", label: "Progress" },
  { key: "resources", label: "Resources" },
  { key: "risks", label: "Risks & Hurdles" },
  { key: "dpr", label: "DPR Register" },
  { key: "approvals", label: "Approvals" },
  { key: "attachments", label: "Attachments" },
];

function toDateOnlyInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function formatDate(value?: string | null): string {
  const dt = parseDate(value);
  if (!dt) return "-";
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function diffDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function normalizeScheduleStatus(status?: string | null): string {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function getProjectDisplayName(project: CompanyProjectRow): string {
  const candidates = [project.project_name, project.name, project.project_code]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const preferred =
    candidates.find((value) => value.toLowerCase() !== "project") || candidates[0] || "Project";
  return preferred;
}

function normalizeAuthMeUser(payload: any): StoredUserSnapshot | null {
  if (!payload || typeof payload !== "object") return null;
  const source = payload.user && typeof payload.user === "object" ? payload.user : payload;
  if (!source || typeof source !== "object") return null;
  return source as StoredUserSnapshot;
}

function extractAssignmentScope(user: StoredUserSnapshot | null) {
  const ids = new Set<number>();
  const names = new Set<string>();

  const rawIds = Array.isArray(user?.project_ids) ? user?.project_ids : [];
  rawIds.forEach((value) => {
    const id = Number(value);
    if (!Number.isNaN(id) && id > 0) ids.add(id);
  });

  const rawProjects = Array.isArray(user?.projects) ? user?.projects : [];
  rawProjects.forEach((entry) => {
    if (typeof entry === "string") {
      const name = entry.trim().toLowerCase();
      if (name) names.add(name);
      return;
    }
    const id = Number(entry?.id);
    const name = String(entry?.name || "")
      .trim()
      .toLowerCase();
    if (!Number.isNaN(id) && id > 0) ids.add(id);
    if (name) names.add(name);
  });

  return { ids: Array.from(ids), names: Array.from(names) };
}

function isAssignedProject(
  project: CompanyProjectRow,
  assignedIds: number[],
  assignedNames: string[]
): boolean {
  return (
    assignedIds.includes(project.id) ||
    assignedNames.includes(getProjectDisplayName(project).toLowerCase())
  );
}

function isScheduleDelayed(row: ScheduleRow, asOf: Date): boolean {
  const end = parseDate(row.end_date);
  if (!end) return false;
  const status = normalizeScheduleStatus(row.status);
  if (status === "COMPLETED") return false;
  return diffDays(end, asOf) > 0;
}

function getScheduleDelayDays(row: ScheduleRow, asOf: Date): number {
  const end = parseDate(row.end_date);
  if (!end) return 0;
  if (!isScheduleDelayed(row, asOf)) return 0;
  return diffDays(end, asOf);
}

function estimateActualProgressPct(row: ScheduleRow): number {
  const status = normalizeScheduleStatus(row.status);
  if (status === "COMPLETED") return 100;
  if (status === "ACTIVE") return 68;
  if (status === "PAUSED") return 42;
  if (status === "STOPPED") return 24;
  return 0;
}

function estimatePlannedProgressPct(row: ScheduleRow, asOf: Date): number {
  const start = parseDate(row.start_date);
  const end = parseDate(row.end_date);
  if (!start || !end) return 0;
  if (asOf <= start) return 0;
  if (asOf >= end) return 100;
  const total = Math.max(1, diffDays(start, end) + 1);
  const elapsed = Math.max(0, diffDays(start, asOf) + 1);
  return Math.min(100, (elapsed / total) * 100);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, n) => acc + n, 0) / values.length;
}

function overlapsPeriod(
  row: ScheduleRow,
  periodStart: Date,
  periodEnd: Date
): boolean {
  const start = parseDate(row.start_date);
  const end = parseDate(row.end_date);
  if (!start || !end) return false;
  return start <= periodEnd && end >= periodStart;
}

function statusBadgeClasses(status: string): string {
  const normalized = normalizeScheduleStatus(status);
  if (normalized === "ACTIVE") return "bg-emerald-100 text-emerald-800";
  if (normalized === "PAUSED") return "bg-amber-100 text-amber-800";
  if (normalized === "COMPLETED") return "bg-blue-100 text-blue-800";
  if (normalized === "STOPPED") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

function metricTone(value: number): "good" | "watch" | "risk" {
  if (value <= 0) return "good";
  if (value <= 2) return "watch";
  return "risk";
}

function zoneTitleClasses() {
  return "text-sm font-black uppercase tracking-[0.14em] text-[#5B3421]";
}

function getDprRegisterRowStatus(row: ProjectExecutionDprRegisterRow): string {
  if (row.returned_count > 0) return "Returned";
  if (row.approved_count > 0 && row.submitted_count + row.reviewed_count === 0) {
    return "Approved";
  }
  if (row.submitted_count + row.reviewed_count > 0) return "Under Review";
  if (row.draft_count > 0) return "Draft";
  if (row.entries > 0) return "Submitted";
  return "No Entry";
}

function normalizeDprStatus(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isSubmittedLikeDprStatus(value: unknown): boolean {
  const normalized = normalizeDprStatus(value);
  return normalized === "submitted" || normalized === "approved";
}

function normalizeProjectImageMap(rawMap: Record<string, string>): Record<number, string> {
  const normalizedMap: Record<number, string> = {};
  Object.entries(rawMap).forEach(([key, value]) => {
    const id = Number(key);
    if (!Number.isNaN(id) && id > 0 && value) normalizedMap[id] = value;
  });
  return normalizedMap;
}

function SnapshotCard({
  label,
  value,
  hint,
  tone = "neutral",
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "good" | "watch" | "risk";
  onClick?: () => void;
}) {
  const toneClasses =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "watch"
      ? "border-amber-200 bg-amber-50"
      : tone === "risk"
      ? "border-rose-200 bg-rose-50"
      : "border-slate-200 bg-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left shadow-[0_8px_20px_rgba(31,14,6,0.12)] transition hover:-translate-y-[1px] ${toneClasses}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A5036]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#4A2C1D]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#6E4A35]">{hint}</p> : null}
    </button>
  );
}

function ProgressPairCard({
  title,
  plannedPct,
  actualPct,
}: {
  title: string;
  plannedPct: number;
  actualPct: number;
}) {
  const variance = actualPct - plannedPct;
  const varianceTone =
    variance >= 0 ? "text-emerald-700" : variance <= -5 ? "text-rose-700" : "text-amber-700";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-[0_8px_20px_rgba(31,14,6,0.1)]">
      <p className="text-xs font-bold uppercase tracking-wide text-[#7a5036]">{title}</p>
      <div className="mt-3 space-y-2">
        <div>
          <div className="mb-1 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#6e4a35]">
            <span>Target</span>
            <span>{plannedPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#ead8cb]">
            <div
              className="h-2 rounded-full bg-indigo-600"
              style={{ width: `${Math.max(0, Math.min(100, plannedPct))}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#6e4a35]">
            <span>Actual</span>
            <span>{actualPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#ead8cb]">
            <div
              className="h-2 rounded-full bg-[#3f7b5b]"
              style={{ width: `${Math.max(0, Math.min(100, actualPct))}%` }}
            />
          </div>
        </div>
      </div>
      <p className={`mt-3 text-xs font-bold uppercase tracking-wide ${varianceTone}`}>
        Variance: {variance >= 0 ? "+" : ""}
        {variance.toFixed(1)}%
      </p>
    </div>
  );
}

export default function ProjectDashboardPage() {
  const [projectIdFromQuery, setProjectIdFromQuery] = useState<number | null>(null);
  const [queryReady, setQueryReady] = useState(false);

  const [category, setCategory] = useState<AuthCategory | null>(null);
  const [roleName, setRoleName] = useState("");

  const [projects, setProjects] = useState<CompanyProjectRow[]>([]);
  const [project, setProject] = useState<CompanyProjectRow | null>(null);
  const [assignmentIds, setAssignmentIds] = useState<number[]>([]);
  const [assignmentNames, setAssignmentNames] = useState<string[]>([]);

  const [scheduleSummary, setScheduleSummary] = useState<ScheduleSummary | null>(null);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [structures, setStructures] = useState<CompanyProjectStructureRow[]>([]);
  const [structureSummary, setStructureSummary] = useState<CompanyProjectStructuresSummary | null>(
    null
  );
  const [projectImageMap, setProjectImageMap] = useState<Record<number, string>>({});
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);

  const [reportingDate, setReportingDate] = useState<string>(toDateOnlyInput(new Date()));
  const [selectedStructure, setSelectedStructure] = useState("ALL");
  const [kpiAppliedStructure, setKpiAppliedStructure] = useState("ALL");
  const [kpiAppliedDate, setKpiAppliedDate] = useState<string>(toDateOnlyInput(new Date()));
  const [showMisPanel, setShowMisPanel] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [structureError, setStructureError] = useState("");
  const [executionSummary, setExecutionSummary] = useState<ProjectExecutionDprSummary | null>(
    null
  );
  const [executionRegisterRows, setExecutionRegisterRows] = useState<ProjectExecutionDprRegisterRow[]>([]);
  const [executionRegisterSource, setExecutionRegisterSource] = useState<
    "dashboard_api" | "task_progress" | "none"
  >("none");
  const [executionLoading, setExecutionLoading] = useState(false);
  const [executionError, setExecutionError] = useState("");
  const [dprHistoryRows, setDprHistoryRows] = useState<DprReportRecord[]>([]);
  const [dprHistoryLoading, setDprHistoryLoading] = useState(false);
  const [dprHistoryError, setDprHistoryError] = useState("");
  const [archiveDate, setArchiveDate] = useState("");
  const [approvalQueueCount, setApprovalQueueCount] = useState(0);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const imageMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("project_id");
    const parsed = Number(raw || 0);
    const scheduleId = String(params.get("schedule_id") || "").trim();
    const dprDate = String(params.get("dpr_date") || "").trim();

    setProjectIdFromQuery(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
    if (scheduleId) setSelectedStructure(scheduleId);
    if (dprDate) {
      const parsedDate = parseDate(dprDate);
      if (parsedDate) setReportingDate(toDateOnlyInput(parsedDate));
    }
    setQueryReady(true);
  }, []);

  useEffect(() => {
    if (!project?.id) return;
    setKpiAppliedStructure(selectedStructure);
    setKpiAppliedDate(reportingDate);
  }, [project?.id]);

  useEffect(() => {
    if (!queryReady) return;

    const token = getAccessToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const accessToken = token;

    if (!projectIdFromQuery) {
      setLoading(false);
      setError("Project is not selected. Please open a project from Project Portfolio.");
      return;
    }

    const storedUser = getStoredUser() as StoredUserSnapshot | null;
    const resolvedCategory = resolveAuthCategory({
      category: storedUser?.category,
      role: storedUser?.role,
    });
    if (!resolvedCategory) {
      window.location.href = "/login";
      return;
    }

    const allowed = resolvedCategory === "SITE" || resolvedCategory === "ADMIN";
    if (!allowed) {
      const redirectPath = getLandingPathFromAuthContext({
        category: storedUser?.category,
        role: storedUser?.role,
      });
      window.alert("Access denied: You are not part of Site.");
      window.location.href = redirectPath;
      return;
    }

    setCategory(resolvedCategory);
    setRoleName(String(storedUser?.role || "").trim().toUpperCase());

    setProjectImageMap(normalizeProjectImageMap(readProjectImageMap()));

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        setScheduleError("");
        setStructureError("");

        const [projectsResponse, authMeResponse] = await Promise.all([
          getCompanyProjects(accessToken),
          fetch("/api/proxy/auth/me", {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
          }).then(async (res) => {
            if (!res.ok) return null;
            return res.json().catch(() => null);
          }),
        ]);

        const availableProjects = projectsResponse.rows || [];
        setProjects(availableProjects);

        const selectedProject =
          availableProjects.find((row) => row.id === projectIdFromQuery) || null;

        if (!selectedProject) {
          setError("Selected project was not found or is not accessible.");
          return;
        }

        const authMeUser = normalizeAuthMeUser(authMeResponse);
        const assignmentScope = extractAssignmentScope(authMeUser || storedUser);
        setAssignmentIds(assignmentScope.ids);
        setAssignmentNames(assignmentScope.names);

        const hasScope = assignmentScope.ids.length > 0 || assignmentScope.names.length > 0;
        if (resolvedCategory === "SITE" && hasScope) {
          const assigned = isAssignedProject(
            selectedProject,
            assignmentScope.ids,
            assignmentScope.names
          );
          if (!assigned) {
            setError("Access denied: this project is not assigned to your login.");
            return;
          }
        }

        setProject(selectedProject);

        const scheduleSummaryPromise = getScheduleSummary(selectedProject.id);
        const schedulesPromise = getSchedules(selectedProject.id);
        const structuresPromise = getCompanyProjectStructures(accessToken, selectedProject.id);
        const structureSummaryPromise = getCompanyProjectStructuresSummary(
          accessToken,
          selectedProject.id
        );

        const [summaryResult, scheduleRowsResult, structuresResult, structureSummaryResult] =
          await Promise.allSettled([
            scheduleSummaryPromise,
            schedulesPromise,
            structuresPromise,
            structureSummaryPromise,
          ]);

        if (summaryResult.status === "fulfilled") {
          setScheduleSummary(summaryResult.value);
        } else {
          setScheduleSummary(null);
          setScheduleError("Schedule summary is not available right now.");
        }

        if (scheduleRowsResult.status === "fulfilled") {
          setSchedules(scheduleRowsResult.value.rows || []);
        } else {
          setSchedules([]);
          setScheduleError("Schedule list is not available right now.");
        }

        if (structuresResult.status === "fulfilled") {
          setStructures(structuresResult.value.rows || []);
        } else {
          setStructures([]);
          setStructureError("Segments/floors data is not available right now.");
        }

        if (structureSummaryResult.status === "fulfilled") {
          setStructureSummary(structureSummaryResult.value.summary || null);
        } else {
          setStructureSummary(null);
          setStructureError(
            "Structure summary is unavailable. Resource attention metrics use schedule fallback."
          );
        }

      } catch (err: any) {
        setError(err?.message || "Unable to load project dashboard.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [projectIdFromQuery, queryReady]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncProjectImages = () => {
      setProjectImageMap(normalizeProjectImageMap(readProjectImageMap()));
    };
    window.addEventListener(PROJECT_MEDIA_CHANGED_EVENT, syncProjectImages);
    window.addEventListener("storage", syncProjectImages);
    return () => {
      window.removeEventListener(PROJECT_MEDIA_CHANGED_EVENT, syncProjectImages);
      window.removeEventListener("storage", syncProjectImages);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!isImageMenuOpen) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (imageMenuRef.current?.contains(target)) return;
      setIsImageMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isImageMenuOpen]);

  useEffect(() => {
    setIsImageMenuOpen(false);
  }, [project?.id]);

  useEffect(() => {
    if (project?.id == null) return;
    const projectId: number = project.id;

    let active = true;
    async function loadExecutionSummary() {
      try {
        setExecutionLoading(true);
        setExecutionError("");

        const insights: ProjectExecutionDprInsights = await getProjectExecutionDprInsights(
          projectId,
          reportingDate,
          schedules
        );
        if (!active) return;
        setExecutionSummary(insights.summary);
        setExecutionRegisterRows(insights.register_rows || []);
        setExecutionRegisterSource(insights.register_source || "none");
      } catch (err: any) {
        if (!active) return;
        setExecutionSummary(null);
        setExecutionRegisterRows([]);
        setExecutionRegisterSource("none");
        setExecutionError(err?.message || "Unable to load DPR execution summary.");
      } finally {
        if (active) setExecutionLoading(false);
      }
    }

    async function loadApprovalQueueCount() {
      if (category !== "ADMIN") {
        setApprovalQueueCount(0);
        return;
      }
      try {
        const queue = await listBaselineApprovalQueue("SUBMITTED", projectId);
        if (!active) return;
        setApprovalQueueCount(Array.isArray(queue.rows) ? queue.rows.length : 0);
      } catch {
        if (!active) return;
        setApprovalQueueCount(0);
      }
    }

    void loadExecutionSummary();
    void loadApprovalQueueCount();

    return () => {
      active = false;
    };
  }, [project?.id, reportingDate, schedules, category]);

  useEffect(() => {
    if (project?.id == null) {
      setDprHistoryRows([]);
      setDprHistoryError("");
      return;
    }

    let active = true;
    (async () => {
      try {
        setDprHistoryLoading(true);
        setDprHistoryError("");
        const response = await listDprReports({
          project_id: project.id,
          include_rows: false,
        });
        if (!active) return;
        setDprHistoryRows(Array.isArray(response.rows) ? response.rows : []);
      } catch (err: any) {
        if (!active) return;
        setDprHistoryRows([]);
        setDprHistoryError(err?.message || "Unable to load DPR archive.");
      } finally {
        if (active) setDprHistoryLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [project?.id]);

  const reportingDateObj = useMemo(
    () => parseDate(reportingDate) || new Date(),
    [reportingDate]
  );

  const structureOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    structures.forEach((row) => {
      map.set(String(row.id), { id: String(row.id), name: row.name || row.structure_code });
    });
    schedules.forEach((row) => {
      if (row.structure_id && row.structure_name) {
        map.set(String(row.structure_id), {
          id: String(row.structure_id),
          name: row.structure_name,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [structures, schedules]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((row) => {
      if (selectedStructure === "ALL") return true;
      if (selectedStructure === "__UNASSIGNED__") return row.structure_id == null;
      return String(row.structure_id || "") === selectedStructure;
    });
  }, [schedules, selectedStructure]);

  const delayedRows = useMemo(
    () =>
      filteredSchedules
        .map((row) => ({ row, delayDays: getScheduleDelayDays(row, reportingDateObj) }))
        .filter((entry) => entry.delayDays > 0)
        .sort((a, b) => b.delayDays - a.delayDays),
    [filteredSchedules, reportingDateObj]
  );

  const todayRows = useMemo(
    () =>
      filteredSchedules.filter((row) =>
        overlapsPeriod(row, reportingDateObj, reportingDateObj)
      ),
    [filteredSchedules, reportingDateObj]
  );

  const executedTodayCount = useMemo(
    () => todayRows.filter((row) => normalizeScheduleStatus(row.status) !== "STOPPED").length,
    [todayRows]
  );

  const missedTodayCount = useMemo(
    () => Math.max(0, todayRows.length - executedTodayCount),
    [todayRows.length, executedTodayCount]
  );

  const completionRollup = useMemo(() => {
    if (!filteredSchedules.length) {
      return { planned: 0, actual: 0, variance: 0 };
    }
    const planned = average(
      filteredSchedules.map((row) => estimatePlannedProgressPct(row, reportingDateObj))
    );
    const actual = average(filteredSchedules.map((row) => estimateActualProgressPct(row)));
    return {
      planned,
      actual,
      variance: actual - planned,
    };
  }, [filteredSchedules, reportingDateObj]);

  const weekRange = useMemo(() => {
    const start = new Date(reportingDateObj);
    const weekday = start.getDay();
    const shift = weekday === 0 ? -6 : 1 - weekday;
    start.setDate(start.getDate() + shift);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }, [reportingDateObj]);

  const monthRange = useMemo(() => {
    const start = new Date(reportingDateObj.getFullYear(), reportingDateObj.getMonth(), 1);
    const end = new Date(reportingDateObj.getFullYear(), reportingDateObj.getMonth() + 1, 0);
    return { start, end };
  }, [reportingDateObj]);

  const periodMetrics = useMemo(() => {
    function build(start: Date, end: Date) {
      const rows = filteredSchedules.filter((row) => overlapsPeriod(row, start, end));
      if (!rows.length) {
        return { planned: 0, actual: 0, count: 0 };
      }
      const planned = average(rows.map((row) => estimatePlannedProgressPct(row, end)));
      const actual = average(rows.map((row) => estimateActualProgressPct(row)));
      return { planned, actual, count: rows.length };
    }

    return {
      today: build(reportingDateObj, reportingDateObj),
      week: build(weekRange.start, weekRange.end),
      month: build(monthRange.start, monthRange.end),
    };
  }, [filteredSchedules, reportingDateObj, weekRange, monthRange]);

  const progressBuckets = useMemo(() => {
    let ahead = 0;
    let onTrack = 0;
    let delayed = 0;
    filteredSchedules.forEach((row) => {
      const gap = estimateActualProgressPct(row) - estimatePlannedProgressPct(row, reportingDateObj);
      if (gap >= 5) ahead += 1;
      else if (gap <= -5) delayed += 1;
      else onTrack += 1;
    });
    return { ahead, onTrack, delayed };
  }, [filteredSchedules, reportingDateObj]);

  const riskRows = useMemo<ProjectRiskRow[]>(() => {
    return filteredSchedules
      .map((row) => {
        const delayDays = getScheduleDelayDays(row, reportingDateObj);
        const status = normalizeScheduleStatus(row.status);
        let severity: ProjectRiskRow["severity"] = "Low";
        if (delayDays >= 14) severity = "Critical";
        else if (delayDays >= 7) severity = "High";
        else if (delayDays > 0 || status === "PAUSED" || status === "STOPPED") severity = "Medium";

        let reason = "Normal execution";
        if (status === "PAUSED") reason = "Execution paused";
        else if (status === "STOPPED") reason = "Execution stopped";
        else if (delayDays > 0) reason = "Slippage vs planned finish";

        return {
          id: row.id,
          scheduleName: row.schedule_name,
          severity,
          reason,
          owner: "Project Engineer",
          delayDays,
        };
      })
      .filter((row) => row.reason !== "Normal execution")
      .sort((a, b) => b.delayDays - a.delayDays);
  }, [filteredSchedules, reportingDateObj]);

  const recurringReasonMap = useMemo(() => {
    const map = new Map<string, number>();
    riskRows.forEach((row) => {
      map.set(row.reason, (map.get(row.reason) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [riskRows]);

  const segmentsAttentionCount = useMemo(() => {
    if (structureSummary) {
      return structureSummary.paused_structures + structureSummary.inactive_structures;
    }
    return delayedRows.length;
  }, [structureSummary, delayedRows.length]);

  const dprDraftCount = executionSummary?.draft_count || 0;
  const dprReturnedCount = executionSummary?.returned_count || 0;
  const pendingApprovalsCount = Math.max(
    approvalQueueCount,
    executionSummary?.pending_approval_count || 0
  );

  const selectedScheduleLabel = useMemo(() => {
    if (selectedStructure === "__UNASSIGNED__") return "";
    if (selectedStructure === "ALL") return "";
    const match = structureOptions.find((row) => row.id === selectedStructure);
    return String(match?.name || "").trim();
  }, [selectedStructure, structureOptions]);

  const hasSelectedScheduleForDpr = Boolean(selectedScheduleLabel);

  const kpiReportingDateObj = useMemo(
    () => parseDate(kpiAppliedDate) || reportingDateObj,
    [kpiAppliedDate, reportingDateObj]
  );

  const kpiFilteredSchedules = useMemo(() => {
    return schedules.filter((row) => {
      if (kpiAppliedStructure === "ALL") return true;
      if (kpiAppliedStructure === "__UNASSIGNED__") return row.structure_id == null;
      return String(row.structure_id || "") === kpiAppliedStructure;
    });
  }, [schedules, kpiAppliedStructure]);

  const kpiTodayRows = useMemo(
    () =>
      kpiFilteredSchedules.filter((row) =>
        overlapsPeriod(row, kpiReportingDateObj, kpiReportingDateObj)
      ),
    [kpiFilteredSchedules, kpiReportingDateObj]
  );

  const kpiExecutedTodayCount = useMemo(
    () => kpiTodayRows.filter((row) => normalizeScheduleStatus(row.status) !== "STOPPED").length,
    [kpiTodayRows]
  );

  const kpiProgressBuckets = useMemo(() => {
    let ahead = 0;
    let onTrack = 0;
    let delayed = 0;
    kpiFilteredSchedules.forEach((row) => {
      const gap =
        estimateActualProgressPct(row) - estimatePlannedProgressPct(row, kpiReportingDateObj);
      if (gap >= 5) ahead += 1;
      else if (gap <= -5) delayed += 1;
      else onTrack += 1;
    });
    return { ahead, onTrack, delayed };
  }, [kpiFilteredSchedules, kpiReportingDateObj]);

  const kpiSelectedScheduleLabel = useMemo(() => {
    if (kpiAppliedStructure === "__UNASSIGNED__") return "";
    if (kpiAppliedStructure === "ALL") return "";
    const match = structureOptions.find((row) => row.id === kpiAppliedStructure);
    return String(match?.name || "").trim();
  }, [kpiAppliedStructure, structureOptions]);

  const kpiSelectedScheduleDprRows = useMemo(() => {
    if (!kpiSelectedScheduleLabel) return [] as DprReportRecord[];
    const selectedName = kpiSelectedScheduleLabel.trim().toLowerCase();
    return (dprHistoryRows || []).filter((row) => {
      const rowScheduleId = String(row.schedule_id || "").trim();
      if (rowScheduleId && rowScheduleId === kpiAppliedStructure) return true;
      const rowScheduleName = String(row.schedule_name || "")
        .trim()
        .toLowerCase();
      if (rowScheduleName && selectedName && rowScheduleName === selectedName) return true;
      return false;
    });
  }, [dprHistoryRows, kpiAppliedStructure, kpiSelectedScheduleLabel]);

  const kpiSelectedDateDprRow = useMemo(() => {
    const rows = kpiSelectedScheduleDprRows.filter((row) => row.dpr_date === kpiAppliedDate);
    if (!rows.length) return null;
    return [...rows].sort((a, b) => {
      const rankA = isSubmittedLikeDprStatus(a.status) ? 2 : 1;
      const rankB = isSubmittedLikeDprStatus(b.status) ? 2 : 1;
      if (rankA !== rankB) return rankB - rankA;
      const timeA = String(a.updated_at || "");
      const timeB = String(b.updated_at || "");
      if (timeA !== timeB) return timeA < timeB ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    })[0];
  }, [kpiSelectedScheduleDprRows, kpiAppliedDate]);

  const kpiMissingDprLast7Days = useMemo(() => {
    if (!kpiSelectedScheduleLabel) return 0;
    const baseDate = parseDate(kpiAppliedDate) || new Date();
    let missing = 0;
    for (let i = 0; i < 7; i += 1) {
      const dt = new Date(baseDate);
      dt.setDate(baseDate.getDate() - i);
      const dateKey = toDateOnlyInput(dt);
      const hasSubmitted = kpiSelectedScheduleDprRows.some(
        (row) => row.dpr_date === dateKey && isSubmittedLikeDprStatus(row.status)
      );
      if (!hasSubmitted) missing += 1;
    }
    return missing;
  }, [kpiSelectedScheduleDprRows, kpiAppliedDate, kpiSelectedScheduleLabel]);

  const kpiDprStatus = useMemo(() => {
    if (!kpiSelectedScheduleLabel) return "Select Schedule";
    if (!kpiSelectedDateDprRow) return "Create DPR";
    return isSubmittedLikeDprStatus(kpiSelectedDateDprRow.status) ? "Submitted" : "Draft Stage";
  }, [kpiSelectedScheduleLabel, kpiSelectedDateDprRow]);

  const dprQuery = useMemo(() => {
    if (!project?.id) return "";
    const params = new URLSearchParams();
    params.set("project_id", String(project.id));
    params.set("project_name", getProjectDisplayName(project));
    if (hasSelectedScheduleForDpr) {
      params.set("schedule_id", selectedStructure);
      params.set("schedule_name", selectedScheduleLabel);
    }
    params.set("dpr_date", reportingDate);
    return params.toString();
  }, [project, selectedStructure, selectedScheduleLabel, reportingDate, hasSelectedScheduleForDpr]);

  const selectedScheduleDprRows = useMemo(() => {
    if (!hasSelectedScheduleForDpr) return [] as DprReportRecord[];
    const selectedName = selectedScheduleLabel.trim().toLowerCase();
    return (dprHistoryRows || [])
      .filter((row) => {
        const rowScheduleId = String(row.schedule_id || "").trim();
        if (rowScheduleId && rowScheduleId === selectedStructure) return true;
        const rowScheduleName = String(row.schedule_name || "")
          .trim()
          .toLowerCase();
        if (rowScheduleName && selectedName && rowScheduleName === selectedName) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.dpr_date !== b.dpr_date) return a.dpr_date < b.dpr_date ? 1 : -1;
        return a.id < b.id ? 1 : -1;
      });
  }, [dprHistoryRows, hasSelectedScheduleForDpr, selectedStructure, selectedScheduleLabel]);

  const submittedDateSet = useMemo(() => {
    const out = new Set<string>();
    selectedScheduleDprRows.forEach((row) => {
      if (isSubmittedLikeDprStatus(row.status)) out.add(row.dpr_date);
    });
    return out;
  }, [selectedScheduleDprRows]);

  const selectedDateDprRow = useMemo(() => {
    const rows = selectedScheduleDprRows.filter((row) => row.dpr_date === reportingDate);
    if (!rows.length) return null;
    return [...rows].sort((a, b) => {
      const rankA = isSubmittedLikeDprStatus(a.status) ? 2 : 1;
      const rankB = isSubmittedLikeDprStatus(b.status) ? 2 : 1;
      if (rankA !== rankB) return rankB - rankA;
      const timeA = String(a.updated_at || "");
      const timeB = String(b.updated_at || "");
      if (timeA !== timeB) return timeA < timeB ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    })[0];
  }, [selectedScheduleDprRows, reportingDate]);

  const dprActionStatus = useMemo(() => {
    if (!hasSelectedScheduleForDpr) return "Create DPR";
    if (!selectedDateDprRow) return "Create DPR";
    return isSubmittedLikeDprStatus(selectedDateDprRow.status) ? "Submitted" : "Draft Stage";
  }, [hasSelectedScheduleForDpr, selectedDateDprRow]);

  const canCreateDpr = hasSelectedScheduleForDpr && dprActionStatus === "Create DPR";
  const canEditDraft = hasSelectedScheduleForDpr && dprActionStatus === "Draft Stage";
  const canViewDpr = hasSelectedScheduleForDpr && !!selectedDateDprRow;
  const canExportPrint = hasSelectedScheduleForDpr && dprActionStatus === "Submitted" && !!selectedDateDprRow;

  const buildDprHref = (extraParams: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams(dprQuery || "");
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      params.set(key, String(value));
    });
    const query = params.toString();
    return query ? `/company/dpr?${query}` : "/company/dpr";
  };

  const selectedReportId = selectedDateDprRow?.id;
  const dprWorkspaceHref = buildDprHref();
  const dprDraftHref = buildDprHref({ mode: "draft", report_id: selectedReportId });
  const dprViewHref = buildDprHref({ report_id: selectedReportId });
  const dprExportHref = buildDprHref({ report_id: selectedReportId, export: 1 });
  const dprPrintHref = buildDprHref({ report_id: selectedReportId, print: 1 });

  const submittedArchiveRows = useMemo(
    () => selectedScheduleDprRows.filter((row) => isSubmittedLikeDprStatus(row.status)),
    [selectedScheduleDprRows]
  );
  const selectedArchiveRow = useMemo(
    () => submittedArchiveRows.find((row) => row.dpr_date === archiveDate) || null,
    [submittedArchiveRows, archiveDate]
  );
  const archiveViewHref = selectedArchiveRow
    ? buildDprHref({ report_id: selectedArchiveRow.id, dpr_date: selectedArchiveRow.dpr_date })
    : "/company/dpr";
  const archiveExportHref = selectedArchiveRow
    ? buildDprHref({
        report_id: selectedArchiveRow.id,
        dpr_date: selectedArchiveRow.dpr_date,
        export: 1,
      })
    : "/company/dpr";
  const archivePrintHref = selectedArchiveRow
    ? buildDprHref({
        report_id: selectedArchiveRow.id,
        dpr_date: selectedArchiveRow.dpr_date,
        print: 1,
      })
    : "/company/dpr";

  const roleWorklist = useMemo(() => {
    const role = roleName;
    if (role.includes("MANAGER")) {
      return [
        `DPR approvals pending: ${pendingApprovalsCount}`,
        `Delayed activities to review: ${delayedRows.length}`,
        `Milestones at risk: ${progressBuckets.delayed}`,
        `Returned DPR corrections: ${dprReturnedCount}`,
      ];
    }
    if (role.includes("SEGMENT")) {
      return [
        `Assigned activities today: ${todayRows.length}`,
        `Progress updates pending: ${Math.max(0, todayRows.length - progressBuckets.ahead)}`,
        `Open risk items: ${Math.max(riskRows.length, executionSummary?.risk_hurdle_count || 0)}`,
        `Photos/documents pending: 0`,
      ];
    }
    return [
      `DPR drafts pending submission: ${dprDraftCount}`,
      `Segments requiring attention: ${segmentsAttentionCount}`,
      `Manpower / machinery gaps to check: ${delayedRows.length}`,
      `Delayed fronts needing closure: ${delayedRows.length}`,
    ];
  }, [
    roleName,
    pendingApprovalsCount,
    dprReturnedCount,
    delayedRows.length,
    todayRows.length,
    progressBuckets.delayed,
    progressBuckets.ahead,
    riskRows.length,
    executionSummary?.risk_hurdle_count,
    dprDraftCount,
    segmentsAttentionCount,
  ]);

  const showLoading = loading && !error;
  const currentProjectImage = project ? projectImageMap[project.id] || "" : "";

  useEffect(() => {
    if (!submittedArchiveRows.length) {
      if (archiveDate) setArchiveDate("");
      return;
    }
    if (!archiveDate || !submittedDateSet.has(archiveDate)) {
      setArchiveDate(submittedArchiveRows[0].dpr_date);
    }
  }, [submittedArchiveRows, archiveDate, submittedDateSet]);

  function handleReportingDateChange(nextDate: string) {
    if (!nextDate) return;
    setReportingDate(nextDate);
  }

  function handleRefreshKpis() {
    if (!selectedScheduleLabel) {
      window.alert("Please select a schedule, then click Refresh KPIs.");
      return;
    }
    setKpiAppliedStructure(selectedStructure);
    setKpiAppliedDate(reportingDate);
  }

  useEffect(() => {
    setShowMisPanel(false);
  }, [selectedStructure, reportingDate]);

  function handleArchiveDateChange(nextDate: string) {
    if (!nextDate) return;
    if (!submittedDateSet.has(nextDate)) {
      window.alert("No submitted DPR available on this date for selected schedule.");
      return;
    }
    setArchiveDate(nextDate);
  }

  function openImagePicker() {
    imageInputRef.current?.click();
  }

  function handleProjectImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!project) return;
    const selected = event.target.files?.[0] || null;
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        alert("Unable to read selected image.");
        return;
      }
      setProjectImage(project.id, dataUrl);
      setProjectImageMap((prev) => ({ ...prev, [project.id]: dataUrl }));
      setIsImageMenuOpen(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    };
    reader.onerror = () => {
      alert("Unable to process selected image.");
      if (imageInputRef.current) imageInputRef.current.value = "";
    };
    reader.readAsDataURL(selected);
  }

  function handleDeleteProjectImage() {
    if (!project) return;
    const confirmed = window.confirm("Delete project image?");
    if (!confirmed) return;
    removeProjectImage(project.id);
    setProjectImageMap((prev) => {
      const next = { ...prev };
      delete next[project.id];
      return next;
    });
    setIsImageMenuOpen(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  return (
    <div
      className="min-h-screen px-4 py-5 md:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at top, #1e3a8a 0%, #172554 26%, #0f172a 68%, #020617 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <CompanyPageHeader />

        <section className="flex flex-wrap items-center gap-2">
          <Link
            href="/company/project-team"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-white"
          >
            Back to Project Portfolio
          </Link>
          {category === "ADMIN" ? (
            <Link
              href="/company/dashboard"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-white"
            >
              Back to Company Dashboard
            </Link>
          ) : null}
        </section>

        <div className="pt-1">
          <h1 className="text-left text-2xl font-bold text-[#FFF4EA] md:text-3xl">
            Project Dashboard
          </h1>
        </div>

        {error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </section>
        ) : null}

        {showLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-900">
            Loading project dashboard...
          </section>
        ) : project ? (
          <>
            <section className="rounded-[28px] border border-white/15 bg-gradient-to-br from-[#0B1120]/95 via-[#172554]/90 to-[#0F172A]/95 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] md:p-6">
              <div className="grid gap-4 lg:grid-cols-[2fr_3fr] lg:items-stretch">
                <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/20 bg-black/25 lg:min-h-[440px]">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProjectImageChange}
                  />
                  {currentProjectImage ? (
                    <>
                      <img
                        src={currentProjectImage}
                        alt={getProjectDisplayName(project)}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/20 to-transparent" />
                      <div ref={imageMenuRef} className="absolute right-3 top-3 z-30">
                        <button
                          type="button"
                          onClick={() => setIsImageMenuOpen((prev) => !prev)}
                          className="inline-flex items-center justify-center rounded-full border border-white/40 bg-black/40 p-2 text-white shadow-md transition hover:bg-black/60"
                          aria-label="Manage project image"
                          title="Replace or delete image"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {isImageMenuOpen ? (
                          <div className="mt-2 w-44 overflow-hidden rounded-xl border border-[#d8bda8] bg-[#fff7f1] text-slate-900 shadow-[0_12px_25px_rgba(0,0,0,0.2)]">
                            <button
                              type="button"
                              onClick={openImagePicker}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition hover:bg-[#f5e5d8]"
                            >
                              <Upload className="h-4 w-4" />
                              Replace Image
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteProjectImage}
                              className="flex w-full items-center gap-2 border-t border-[#ead8cb] px-3 py-2 text-left text-xs font-semibold text-[#8f2d2d] transition hover:bg-[#fde9e9]"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Image
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#a26b47] via-[#8c5736] to-[#633d28]">
                      <button
                        type="button"
                        onClick={openImagePicker}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#f3d9c4] bg-[#fff7f0] px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-900 shadow-[0_5px_0_#c09b80]"
                      >
                        <ImagePlus className="h-4 w-4" />
                        Upload Project Image
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex h-full flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-black tracking-wide text-[#fff5e8] md:text-3xl">
                        {getProjectDisplayName(project)}
                      </h1>
                    </div>
                    <div className="text-right">
                      <p className="inline-flex items-center justify-end gap-1 text-sm font-semibold text-white/90">
                        <MapPin className="h-3.5 w-3.5" />
                        {project.location || "-"}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                        Project Code: {project.project_code || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/25 bg-white/10 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                      Execution Workspace
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white/90">
                      Use DPR Action Center for daily reporting flow and Detailed MIS for planning-linked execution monitoring.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                        Activities Planned Today
                      </p>
                      <p className="mt-1 text-xl font-black text-white">{kpiTodayRows.length}</p>
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                        Activities Executed Today
                      </p>
                      <p className="mt-1 text-xl font-black text-white">{kpiExecutedTodayCount}</p>
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                        Activities On Track
                      </p>
                      <p className="mt-1 text-xl font-black text-white">{kpiProgressBuckets.onTrack}</p>
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                        Activities Delayed
                      </p>
                      <p className="mt-1 text-xl font-black text-white">{kpiProgressBuckets.delayed}</p>
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                        Missing DPR In 7 Days
                      </p>
                      <p className="mt-1 text-xl font-black text-white">{kpiMissingDprLast7Days}</p>
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                        DPR Status Today
                      </p>
                      <p className="mt-1 text-sm font-black uppercase tracking-wide text-white">
                        {kpiDprStatus}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto rounded-xl border border-[#ead9cc] bg-white p-3 text-slate-900 shadow-[0_10px_24px_rgba(31,14,6,0.2)]">
                    <p className={zoneTitleClasses()}>DPR ACTION CENTER</p>
                    <div className="mt-3 space-y-3">
                      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_190px]">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                          Select Schedule
                          <select
                            value={selectedStructure}
                            onChange={(e) => setSelectedStructure(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-[#dac6b8] bg-white px-3 py-2 text-sm font-semibold text-[#4a2c1d] outline-none"
                          >
                            <option value="ALL">All Schedules</option>
                            <option value="__UNASSIGNED__">Unassigned</option>
                            {structureOptions.map((row) => (
                              <option key={row.id} value={row.id}>
                                {row.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                          Select Reporting Date
                          <input
                            type="date"
                            value={reportingDate}
                            onChange={(e) => handleReportingDateChange(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-[#dac6b8] bg-white px-3 py-2 text-sm font-semibold text-[#4a2c1d] outline-none"
                          />
                        </label>

                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                          DPR Status
                          <div className="mt-1 flex h-[42px] items-center justify-center rounded-lg border border-[#dac6b8] bg-[#fff5ee] px-3 text-center text-sm font-black uppercase tracking-wide text-slate-900">
                            {dprActionStatus}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {canCreateDpr ? (
                          <Link
                            href={dprWorkspaceHref}
                            className="rounded-lg border border-[#3f2418] bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white shadow-md"
                          >
                            Create DPR
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-lg border border-[#d8c8be] bg-[#efe6e1] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#8a7568]"
                          >
                            Create DPR
                          </button>
                        )}
                        {canEditDraft ? (
                          <Link
                            href={dprDraftHref}
                            className="rounded-lg border border-slate-800 bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white shadow-md"
                          >
                            Edit Draft
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-lg border border-[#d8c8be] bg-[#efe6e1] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#8a7568]"
                          >
                            Edit Draft
                          </button>
                        )}
                        {canViewDpr ? (
                          <Link
                            href={dprViewHref}
                            className="rounded-lg border border-[#5d3f2f] bg-gradient-to-b from-[#d0b39d] to-[#b39077] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#4a2b1c] shadow-[0_3px_0_#9f7f67]"
                          >
                            View DPR
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-lg border border-[#d8c8be] bg-[#efe6e1] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#8a7568]"
                          >
                            View DPR
                          </button>
                        )}
                        {canExportPrint ? (
                          <Link
                            href={dprExportHref}
                            className="rounded-lg border border-[#d8c7bb] bg-[#f2ebe6] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#7c6354]"
                          >
                            Export PDF
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-lg border border-[#d8c8be] bg-[#efe6e1] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#8a7568]"
                          >
                            Export PDF
                          </button>
                        )}
                        {canExportPrint ? (
                          <Link
                            href={dprPrintHref}
                            className="rounded-lg border border-[#d8c7bb] bg-[#f2ebe6] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#7c6354]"
                          >
                            Print
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-lg border border-[#d8c8be] bg-[#efe6e1] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#8a7568]"
                          >
                            Print
                          </button>
                        )}
                        {hasSelectedScheduleForDpr ? (
                          <button
                            type="button"
                            onClick={handleRefreshKpis}
                            className="rounded-lg border border-slate-800 bg-gradient-to-b from-[#4F46E5] to-[#2563EB] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white shadow-md"
                          >
                            Refresh KPIs
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-lg border border-[#d8c8be] bg-[#efe6e1] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#8a7568]"
                          >
                            Refresh KPIs
                          </button>
                        )}
                        {hasSelectedScheduleForDpr ? (
                          <button
                            type="button"
                            onClick={() => setShowMisPanel(true)}
                            className="rounded-lg border border-[#3f2418] bg-gradient-to-b from-[#8f5837] to-[#5a3320] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white shadow-md"
                          >
                            Show MIS
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-lg border border-[#d8c8be] bg-[#efe6e1] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#8a7568]"
                          >
                            Show MIS
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {showMisPanel && hasSelectedScheduleForDpr ? (
              <section className="grid gap-4">
                <DetailedMisWorkbench
                  projectId={project.id}
                  projectName={getProjectDisplayName(project)}
                  scheduleId={selectedStructure}
                  scheduleName={selectedScheduleLabel}
                  reportingDate={reportingDate}
                  canSeedProgress={category === "ADMIN"}
                />
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
