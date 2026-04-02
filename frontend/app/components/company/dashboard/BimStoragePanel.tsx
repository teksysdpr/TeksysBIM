"use client";

import { HardDrive } from "lucide-react";
import type { DashboardSummary } from "@/app/services/dashboardService";
import { BimPanel } from "@/app/components/company/ui/BimPanel";

function fmtMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

type Props = {
  summary: DashboardSummary | null;
  loading: boolean;
};

export default function BimStoragePanel({ summary, loading }: Props) {
  const used = summary?.storageUsedMb ?? 0;
  const limit = summary?.storageLimitMb ?? 5120;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const barColor =
    pct >= 90 ? "bg-[#f87171]" :
    pct >= 70 ? "bg-[#fbbf24]" :
    "bg-[#d4933c]";

  return (
    <BimPanel noPad as="section" className="px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-[#d4933c]" />
          <p className="text-xs font-black uppercase tracking-widest text-[#8a6e4e]">
            Storage & Plan
          </p>
        </div>
        {summary?.planName && (
          <span className="rounded-full border border-[#6b3e14] bg-[#1a0f06] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d4933c]">
            {summary.planName}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-4 h-4 animate-pulse rounded-full bg-white/5" />
      ) : (
        <>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#1e1610]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-[#8a6e4e]">
              <span className="font-bold text-[#f0e6d4]">{fmtMb(used)}</span> used of{" "}
              <span className="font-bold text-[#f0e6d4]">{fmtMb(limit)}</span>
            </p>
            <p className={`text-xs font-bold ${pct >= 90 ? "text-[#f87171]" : pct >= 70 ? "text-[#fbbf24]" : "text-[#8a6e4e]"}`}>
              {pct}%
            </p>
          </div>
        </>
      )}
    </BimPanel>
  );
}
