"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, MapPin } from "lucide-react";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";
import { getAccessToken, getStoredUser } from "@/lib/storage";
import {
  getLandingPathFromAuthContext,
  resolveAuthCategory,
  type AuthCategory,
} from "@/lib/landing";
import { CompanyProjectRow, getCompanyProjects } from "@/services/companyService";
import { readProjectImageMap } from "@/lib/projectMedia";

type StoredProjectRef = string | { id?: number | null; name?: string | null };
type StoredUserSnapshot = {
  category?: string | null;
  role?: string | null;
  projects?: StoredProjectRef[] | null;
  project_ids?: Array<number | string> | null;
};

function getProjectDisplayName(project: CompanyProjectRow) {
  const value = project.name || project.project_name || project.project_code;
  return String(value || "Project").trim() || "Project";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function extractAssignmentScope(user: StoredUserSnapshot | null) {
  const ids = new Set<number>();
  const names = new Set<string>();

  const rawIds = Array.isArray(user?.project_ids) ? user?.project_ids : [];
  rawIds.forEach((value) => {
    const n = Number(value);
    if (!Number.isNaN(n) && n > 0) ids.add(n);
  });

  const rawProjects = Array.isArray(user?.projects) ? user?.projects : [];
  rawProjects.forEach((entry) => {
    if (typeof entry === "string") {
      const text = entry.trim().toLowerCase();
      if (text) names.add(text);
      return;
    }
    const id = Number(entry?.id);
    const name = String(entry?.name || "")
      .trim()
      .toLowerCase();
    if (!Number.isNaN(id) && id > 0) ids.add(id);
    if (name) names.add(name);
  });

  return {
    ids: Array.from(ids),
    names: Array.from(names),
  };
}

function normalizeAuthMeUser(payload: any): StoredUserSnapshot | null {
  if (!payload || typeof payload !== "object") return null;
  const source =
    payload.user && typeof payload.user === "object" ? payload.user : payload;
  if (!source || typeof source !== "object") return null;
  return source as StoredUserSnapshot;
}

export default function CompanyProjectTeamLandingPage() {
  const [category, setCategory] = useState<AuthCategory | null>(null);
  const [projects, setProjects] = useState<CompanyProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignedProjectIds, setAssignedProjectIds] = useState<number[]>([]);
  const [assignedProjectNames, setAssignedProjectNames] = useState<string[]>([]);
  const [projectImageMap, setProjectImageMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const accessToken = token;

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
    const mediaMap = readProjectImageMap();
    const normalized: Record<number, string> = {};
    Object.entries(mediaMap).forEach(([key, value]) => {
      const id = Number(key);
      if (!Number.isNaN(id) && id > 0 && value) {
        normalized[id] = value;
      }
    });
    setProjectImageMap(normalized);

    async function loadProjectCardsAndAssignments() {
      try {
        setLoading(true);
        setError("");
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

        setProjects(projectsResponse.rows || []);

        const authMeUser = normalizeAuthMeUser(authMeResponse);
        const assignmentSource = authMeUser || storedUser;
        const assignmentScope = extractAssignmentScope(assignmentSource);
        setAssignedProjectIds(assignmentScope.ids);
        setAssignedProjectNames(assignmentScope.names);
      } catch (err: any) {
        setError(err?.message || "Unable to load project cards.");
      } finally {
        setLoading(false);
      }
    }

    void loadProjectCardsAndAssignments();
  }, []);

  const hasAssignmentScope =
    category === "SITE" &&
    (assignedProjectIds.length > 0 || assignedProjectNames.length > 0);

  const projectCards = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (Boolean(a.is_active) !== Boolean(b.is_active)) {
        return a.is_active ? -1 : 1;
      }
      return getProjectDisplayName(a).localeCompare(getProjectDisplayName(b));
    });
  }, [projects]);

  function isAssignedProject(project: CompanyProjectRow) {
    const byId = assignedProjectIds.includes(project.id);
    const byName = assignedProjectNames.includes(getProjectDisplayName(project).toLowerCase());
    return byId || byName;
  }

  function canOpenProjectDashboard(project: CompanyProjectRow) {
    if (category === "ADMIN") return true;
    if (!hasAssignmentScope) return false;
    return isAssignedProject(project);
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

        {category === "ADMIN" ? (
          <section className="flex flex-wrap items-center gap-2">
            <Link
              href="/company/dashboard"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-white"
            >
              Back to Company Dashboard
            </Link>
            <Link
              href="/company/pmo"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-white"
            >
              Go to PMO Dashboard
            </Link>
          </section>
        ) : null}

        <section className="rounded-[30px] border border-white/15 bg-gradient-to-br from-[#0B1120]/95 via-[#172554]/90 to-[#0F172A]/95 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/90">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Site Workspace
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-wide text-[#fff5e8] md:text-4xl">
            Project Portfolio
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-white/85 md:text-base">
            Select a project to open project-level execution dashboard and site modules. All company
            projects are visible here for context.
          </p>
        </section>

        {error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </section>
        ) : null}

        {category === "SITE" && !loading && !hasAssignmentScope ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No projects are assigned to your login yet. Please contact Company Admin.
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`loading-${index}`}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))
          ) : projectCards.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
              No projects available for this company.
            </div>
          ) : (
            projectCards.map((project) => {
              const assigned = isAssignedProject(project);
              const canOpen = canOpenProjectDashboard(project);
              return (
                <article
                  key={project.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.10)]"
                >
                  <div className="relative h-36">
                    <img
                      src={projectImageMap[project.id] || "/township-image.jpg"}
                      alt={getProjectDisplayName(project)}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent" />
                    <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                      <span className="rounded-full border border-white/25 bg-black/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                        {project.category || "Project"}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                          project.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {project.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h2 className="truncate text-lg font-black text-white">
                        {getProjectDisplayName(project)}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-2 p-4 text-sm text-[#6f4b36]">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Project Code: <span className="font-bold text-slate-900">{project.project_code}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      <span>{project.location || "-"}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      <span>
                        {formatDate(project.start_date)} - {formatDate(project.end_date)}
                      </span>
                    </p>

                    {hasAssignmentScope ? (
                      <p
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                          assigned
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {assigned ? "Assigned to You" : "Info Only"}
                      </p>
                    ) : null}

                    {canOpen ? (
                      <Link
                        href={`/company/project-dashboard?project_id=${project.id}`}
                        className="mt-2 inline-flex items-center rounded-lg border border-[#b88d70] bg-gradient-to-b from-[#f7e7d7] to-[#dfc0a3] px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-[#4b2d1d] shadow-[0_3px_0_#a77d5c,0_8px_12px_rgba(12,6,3,0.2)] transition hover:brightness-105"
                      >
                        Open Project Dashboard
                      </Link>
                    ) : (
                      <div className="mt-2 inline-flex items-center rounded-lg border border-[#dbc7b8] bg-[#efe7e1] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#9b8576]">
                        View Only
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-xs uppercase tracking-wider text-white/75">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Project cards auto-update from company project master
          </div>
        </section>
      </div>
    </div>
  );
}
