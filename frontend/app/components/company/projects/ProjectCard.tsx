"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  MapPin,
  RefreshCw,
  Spline,
  Users,
} from "lucide-react";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
  formatProjectDate,
  timeAgo,
  type ProjectListItem,
} from "@/app/services/projectsService";

type Props = {
  project: ProjectListItem;
};

export default function ProjectCard({ project: p }: Props) {
  const s = PROJECT_STATUS_STYLES[p.status] ?? PROJECT_STATUS_STYLES.DRAFT;
  const counts = p._count ?? {};

  return (
    <Link
      href={`/company/projects/${p.id}`}
      className="group flex flex-col rounded-2xl border border-[#2b1e12] bg-[#110e0a] shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5 hover:border-[#6b3e14] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 border-b border-[#1e1610] px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black text-[#f0e6d4] group-hover:text-[#e8c080]">
            {p.name}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-[#7a5e3e]">{p.code}</p>
        </div>
        <span className={`flex-none rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${s.badge}`}>
          {PROJECT_STATUS_LABELS[p.status]}
        </span>
      </div>

      {/* Meta row */}
      <div className="space-y-2 px-5 py-3">
        {p.clientName && (
          <div className="flex items-center gap-2 text-xs text-[#8a6e4e]">
            <Users className="h-3.5 w-3.5 flex-none text-[#6b4820]" />
            <span className="truncate">{p.clientName}</span>
          </div>
        )}
        {p.location && (
          <div className="flex items-center gap-2 text-xs text-[#8a6e4e]">
            <MapPin className="h-3.5 w-3.5 flex-none text-[#6b4820]" />
            <span className="truncate">{p.location}</span>
          </div>
        )}
        {(p.startDate || p.endDate) && (
          <div className="flex items-center gap-2 text-xs text-[#8a6e4e]">
            <CalendarRange className="h-3.5 w-3.5 flex-none text-[#6b4820]" />
            <span>
              {formatProjectDate(p.startDate)} — {formatProjectDate(p.endDate)}
            </span>
          </div>
        )}
      </div>

      {/* Stats band */}
      <div className="mt-auto grid grid-cols-3 divide-x divide-[#1e1610] border-t border-[#1e1610]">
        <div className="flex flex-col items-center gap-1 px-2 py-3">
          <div className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3 text-[#fbbf24]" />
            <span className="text-sm font-black text-[#fbbf24]">
              {counts.conversionRequests ?? "—"}
            </span>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-[#6b4f30]">Conversions</span>
        </div>
        <div className="flex flex-col items-center gap-1 px-2 py-3">
          <div className="flex items-center gap-1">
            <Spline className="h-3 w-3 text-[#f87171]" />
            <span className="text-sm font-black text-[#f87171]">
              {counts.clashReports ?? "—"}
            </span>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-[#6b4f30]">Clash Reports</span>
        </div>
        <div className="flex flex-col items-center gap-1 px-2 py-3">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-[#34d399]" />
            <span className="text-sm font-black text-[#34d399]">
              {counts.members ?? "—"}
            </span>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-[#6b4f30]">Members</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#1e1610] px-5 py-2.5">
        <span className="text-[10px] text-[#5a3e22]">
          Updated {timeAgo(p.updatedAt)}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-[#d4933c] opacity-0 transition group-hover:opacity-100">
          Open workspace <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
