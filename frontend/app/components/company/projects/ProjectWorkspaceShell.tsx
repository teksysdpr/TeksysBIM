"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  Download,
  FolderKanban,
  Loader2,
  PenTool,
  RefreshCw,
  Ruler,
  Spline,
} from "lucide-react";
import {
  fetchProject,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
  type ProjectDetail,
} from "@/app/services/projectsService";

// ── Workspace tab definition ──────────────────────────────────────────────────

interface WorkspaceTab {
  key: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  suffix: string; // path suffix after /[projectId]
  iconColor: string;
}

const TABS: WorkspaceTab[] = [
  { key: "overview",    label: "Overview",    icon: FolderKanban,  suffix: "",            iconColor: "text-[#d4933c]" },
  { key: "editor",      label: "Editor",      icon: PenTool,       suffix: "/editor",      iconColor: "text-[#60a5fa]" },
  { key: "conversion",  label: "Conversion",  icon: RefreshCw,     suffix: "/conversion",  iconColor: "text-[#fbbf24]" },
  { key: "takeoff",     label: "Takeoff",     icon: Ruler,         suffix: "/takeoff",     iconColor: "text-[#a78bfa]" },
  { key: "estimate",    label: "Estimate",    icon: BarChart3,     suffix: "/estimate",    iconColor: "text-[#34d399]" },
  { key: "issues",      label: "Issues",      icon: Spline,        suffix: "/issues",      iconColor: "text-[#f87171]" },
  { key: "exports",     label: "Exports",     icon: Download,      suffix: "/exports",     iconColor: "text-[#60a5fa]" },
];

// ── Shell component ───────────────────────────────────────────────────────────

type Props = {
  projectId: string;
  children: React.ReactNode;
};

export default function ProjectWorkspaceShell({ projectId, children }: Props) {
  const pathname = usePathname();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject(projectId)
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  // Determine active tab from current pathname
  const base = `/company/projects/${projectId}`;
  const activeTab = TABS.find((t) => {
    if (t.suffix === "") return pathname === base || pathname === `${base}/`;
    return pathname.startsWith(`${base}${t.suffix}`);
  })?.key ?? "overview";

  const statusStyle = project
    ? PROJECT_STATUS_STYLES[project.status] ?? PROJECT_STATUS_STYLES.DRAFT
    : PROJECT_STATUS_STYLES.DRAFT;

  return (
    <div className="min-h-[calc(100vh-88px)] bg-[#0a0806] text-[#f0e6d4]">

      {/* ── Project header band ─────────────────────────────────────────── */}
      <div className="border-b border-[#1e1610] bg-[#0e0b07]">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-1.5 text-[11px] text-[#6b4820]">
            <Link href="/company/dashboard" className="hover:text-[#d4933c]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/company/projects" className="hover:text-[#d4933c]">Projects</Link>
            <ChevronRight className="h-3 w-3" />
            {loading ? (
              <span className="h-3 w-24 animate-pulse rounded bg-white/10" />
            ) : (
              <span className="text-[#9a7d5e]">{project?.name ?? "Project"}</span>
            )}
          </nav>

          {/* Project identity */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {loading ? (
              <div className="space-y-2">
                <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
              </div>
            ) : project ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black text-[#f8e8cf]">{project.name}</h1>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusStyle.badge}`}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#7a5e3e]">
                  <span className="font-mono">{project.code}</span>
                  {project.clientName && (
                    <>
                      <span>·</span>
                      <span>{project.clientName}</span>
                    </>
                  )}
                  {project.location && (
                    <>
                      <span>·</span>
                      <span>{project.location}</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-[#7a5e3e]">Project not found</p>
              </div>
            )}

            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-[#6b4820]" />
            )}
          </div>
        </div>

        {/* ── Workspace navigation tabs ──────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <nav className="-mb-px flex gap-1 overflow-x-auto pb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const href = `${base}${tab.suffix}`;
              const isActive = activeTab === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={href}
                  className={[
                    "flex flex-none items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-bold transition whitespace-nowrap",
                    isActive
                      ? "border-[#d4933c] text-[#e8c080]"
                      : "border-transparent text-[#6b4820] hover:border-[#4a2e10] hover:text-[#9a7d5e]",
                  ].join(" ")}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? tab.iconColor : ""}`} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Page content ────────────────────────────────────────────────── */}
      {pathname.startsWith(`${base}/editor`) ? (
        // Editor gets full-bleed, no padding container
        <div className="flex-1 overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
          {children}
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Workspace placeholder (for modules not yet built) ─────────────────────────

interface WorkspacePlaceholderProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  comingSoon?: string[];
}

export function WorkspacePlaceholder({
  icon: Icon,
  title,
  description,
  color,
  comingSoon = [],
}: WorkspacePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2b1e12] bg-[#110e0a]`}>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
      <h2 className="mt-5 text-xl font-black text-[#f0e6d4]">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#8a6e4e]">{description}</p>

      {comingSoon.length > 0 && (
        <div className="mt-8 w-full max-w-md rounded-2xl border border-[#2b1e12] bg-[#110e0a] p-5 text-left">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#5a3e22]">
            Planned for next phase
          </p>
          <ul className="space-y-2">
            {comingSoon.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-[#8a6e4e]">
                <ClipboardCheck className="h-3.5 w-3.5 flex-none text-[#d4933c]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
