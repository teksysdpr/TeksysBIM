"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  Download,
  FileStack,
  PenTool,
  RefreshCw,
  Ruler,
  Spline,
  Users,
} from "lucide-react";
import {
  fetchProject,
  fetchProjectStats,
  formatProjectDate,
  timeAgo,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
  type ProjectDetail,
  type ProjectStats,
} from "@/app/services/projectsService";
import BimMetricCard from "@/app/components/company/dashboard/BimMetricCard";
import { BimStateBox } from "@/app/components/company/ui/BimStateBox";
import { BimSectionLabel } from "@/app/components/company/ui/BimSectionLabel";
import { BimPanel } from "@/app/components/company/ui/BimPanel";

// ── Workspace module cards ────────────────────────────────────────────────────

function WorkspaceCard({
  href,
  icon: Icon,
  label,
  desc,
  iconColor,
  count,
  countColor,
}: {
  href: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  desc: string;
  iconColor: string;
  count?: number | string;
  countColor?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3.5 rounded-2xl border border-[#2b1e12] bg-[#110e0a] p-4 transition hover:-translate-y-0.5 hover:border-[#6b3e14] hover:bg-[#160f08]"
    >
      <span className="mt-0.5 inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-[#3a2410] bg-[#1a0f06]">
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-[#f0e6d4] group-hover:text-[#e8c080]">{label}</p>
          {count !== undefined && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${countColor ?? "bg-white/5 text-[#8a6e4e]"}`}>
              {count}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-4 text-[#7a5e3e]">{desc}</p>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectOverviewPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchProject(projectId)
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoadingProject(false));

    fetchProjectStats(projectId)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [projectId]);

  const base = `/company/projects/${projectId}`;
  const s = project ? PROJECT_STATUS_STYLES[project.status] ?? PROJECT_STATUS_STYLES.DRAFT : null;

  if (loadingProject) {
    return <BimStateBox type="loading" />;
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-6 py-10 text-center">
        <p className="text-sm font-bold text-[#f87171]">Project not found</p>
        <p className="mt-1 text-xs text-[#7a5e3e]">
          The project ID may be invalid or you may not have access.
        </p>
        <Link
          href="/company/projects"
          className="mt-4 inline-block rounded-xl bg-[#1f1209] px-4 py-2 text-xs font-bold text-[#d4933c]"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Project summary card ─────────────────────────────────────────── */}
      <section className="rounded-[24px] border border-[#2b1e12] bg-gradient-to-br from-[#1a1108] via-[#14100a] to-[#0e0b07] px-6 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            {project.description && (
              <p className="max-w-2xl text-sm leading-6 text-[#9a7d5e]">{project.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-[#7a5e3e]">
              {project.startDate && (
                <span>
                  <span className="text-[#5a3e22]">Start</span>{" "}
                  {formatProjectDate(project.startDate)}
                </span>
              )}
              {project.endDate && (
                <span>
                  <span className="text-[#5a3e22]">End</span>{" "}
                  {formatProjectDate(project.endDate)}
                </span>
              )}
              <span>
                <span className="text-[#5a3e22]">Updated</span>{" "}
                {timeAgo(project.updatedAt)}
              </span>
            </div>
          </div>
          {s && (
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${s.badge}`}
            >
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          )}
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BimMetricCard
          icon={RefreshCw}
          label="Open Conversions"
          value={loadingStats ? "—" : (stats?.openConversions ?? 0)}
          subtext="In pipeline"
          variant="amber"
          loading={loadingStats}
        />
        <BimMetricCard
          icon={Spline}
          label="Open Clashes"
          value={loadingStats ? "—" : (stats?.openClashes ?? 0)}
          subtext="Unresolved"
          variant="red"
          loading={loadingStats}
        />
        <BimMetricCard
          icon={FileStack}
          label="Files"
          value={loadingStats ? "—" : (stats?.totalFiles ?? 0)}
          subtext="Uploaded"
          variant="gold"
          loading={loadingStats}
        />
        <BimMetricCard
          icon={Users}
          label="Team Members"
          value={loadingStats ? "—" : (stats?.memberCount ?? 0)}
          subtext="Assigned"
          variant="green"
          loading={loadingStats}
        />
      </section>

      {/* ── Workspace navigation cards ───────────────────────────────────── */}
      <section>
        <BimSectionLabel className="mb-3">Workspaces</BimSectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <WorkspaceCard
            href={`${base}/editor`}
            icon={PenTool}
            label="BIM Editor"
            desc="Open and review 3D BIM model files for this project."
            iconColor="text-[#60a5fa]"
          />
          <WorkspaceCard
            href={`${base}/conversion`}
            icon={RefreshCw}
            label="Conversion"
            desc="Manage CAD2BIM conversion requests, scope, and reviews."
            iconColor="text-[#fbbf24]"
            count={stats?.openConversions}
            countColor="bg-[#fbbf24]/10 text-[#fbbf24]"
          />
          <WorkspaceCard
            href={`${base}/takeoff`}
            icon={Ruler}
            label="Takeoff"
            desc="Extract model quantities and generate takeoff schedules."
            iconColor="text-[#a78bfa]"
          />
          <WorkspaceCard
            href={`${base}/estimate`}
            icon={BarChart3}
            label="Estimate"
            desc="Apply rates to takeoff quantities and produce cost summaries."
            iconColor="text-[#34d399]"
            count={stats?.activeEstimates}
            countColor="bg-[#34d399]/10 text-[#34d399]"
          />
          <WorkspaceCard
            href={`${base}/issues`}
            icon={Spline}
            label="Issues & Clashes"
            desc="Track interdisciplinary clashes, severity, and resolutions."
            iconColor="text-[#f87171]"
            count={stats?.openClashes}
            countColor="bg-[#f87171]/10 text-[#f87171]"
          />
          <WorkspaceCard
            href={`${base}/exports`}
            icon={Download}
            label="Exports"
            desc="View and download deliverables, export packages, and reports."
            iconColor="text-[#60a5fa]"
            count={stats?.recentExports}
            countColor="bg-[#60a5fa]/10 text-[#60a5fa]"
          />
        </div>
      </section>

      {/* ── Team members ────────────────────────────────────────────────── */}
      {project.members && project.members.length > 0 && (
        <section>
          <BimSectionLabel className="mb-3">Project Team</BimSectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-[#2b1e12] bg-[#110e0a] px-4 py-3"
              >
                <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[#4a2e10] bg-[#1a0f06] text-sm font-black text-[#d4933c]">
                  {(m.fullName ?? m.email).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#f0e6d4]">{m.fullName ?? m.email}</p>
                  {m.title && <p className="truncate text-xs text-[#7a5e3e]">{m.title}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Deliverables & exports summary ──────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2">
        <BimPanel noPad as="article" className="p-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[#34d399]" />
            <p className="text-xs font-black uppercase tracking-widest text-[#5a3e22]">Deliverables</p>
          </div>
          <p className="mt-3 text-3xl font-black text-[#34d399]">
            {loadingStats ? "—" : (stats?.deliverables ?? 0)}
          </p>
          <p className="mt-0.5 text-xs text-[#7a5e3e]">Submitted for this project</p>
        </BimPanel>
        <BimPanel noPad as="article" className="p-4">
          <div className="flex items-center gap-2">
            <FileStack className="h-4 w-4 text-[#d4933c]" />
            <p className="text-xs font-black uppercase tracking-widest text-[#5a3e22]">Open Tasks</p>
          </div>
          <p className="mt-3 text-3xl font-black text-[#d4933c]">
            {loadingStats ? "—" : (stats?.openTasks ?? 0)}
          </p>
          <p className="mt-0.5 text-xs text-[#7a5e3e]">Across all workspaces</p>
        </BimPanel>
      </section>

    </div>
  );
}
