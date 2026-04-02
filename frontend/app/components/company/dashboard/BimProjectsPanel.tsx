"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";
import type { ActiveProject } from "@/app/services/dashboardService";
import { BimPanel } from "@/app/components/company/ui/BimPanel";
import { BimBadge, type BadgeColor } from "@/app/components/company/ui/BimBadge";

function statusColor(status: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    ACTIVE:    "green",
    ON_HOLD:   "amber",
    COMPLETED: "blue",
    ARCHIVED:  "gray",
    DRAFT:     "gray",
  };
  return map[status] ?? "gray";
}

type Props = {
  projects: ActiveProject[];
  loading: boolean;
};

export default function BimProjectsPanel({ projects, loading }: Props) {
  return (
    <BimPanel noPad as="section" className="shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* ── Panel header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#2b1e12] px-5 py-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-[#d4933c]" />
          <p className="text-xs font-black uppercase tracking-widest text-[#8a6e4e]">
            Active Projects
          </p>
        </div>
        <Link
          href="/company/projects"
          className="flex items-center gap-1 text-xs font-semibold text-[#d4933c] hover:text-[#e8c080]"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-[#3f2d1a]" />
          <p className="mt-2 text-sm text-[#6b4f30]">No active projects yet</p>
          <Link
            href="/company/projects?action=new"
            className="mt-3 inline-block rounded-xl bg-[#1f1209] px-4 py-2 text-xs font-bold text-[#d4933c] transition hover:bg-[#2a1910]"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#1e1610]">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/company/projects?id=${p.id}`}
              className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-[#150f09]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#f0e6d4]">{p.name}</p>
                <p className="mt-0.5 truncate text-xs text-[#7a5e3e]">
                  {p.code}{p.clientName ? ` · ${p.clientName}` : ""}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                {(p.openConversions > 0 || p.openClashes > 0) && (
                  <div className="flex items-center gap-1.5">
                    {p.openConversions > 0 && (
                      <span className="rounded-full bg-[#fbbf24]/15 px-2 py-0.5 text-[10px] font-bold text-[#fbbf24]">
                        {p.openConversions} conv
                      </span>
                    )}
                    {p.openClashes > 0 && (
                      <span className="rounded-full bg-[#f87171]/15 px-2 py-0.5 text-[10px] font-bold text-[#f87171]">
                        {p.openClashes} clashes
                      </span>
                    )}
                  </div>
                )}
                <BimBadge
                  label={p.status.replace("_", " ")}
                  color={statusColor(p.status)}
                  dot={false}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </BimPanel>
  );
}
