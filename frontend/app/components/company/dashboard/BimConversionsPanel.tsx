"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import type { ConversionJob } from "@/app/services/dashboardService";
import { conversionStageLabel } from "@/app/services/dashboardService";
import { BimPanel } from "@/app/components/company/ui/BimPanel";
import { BimBadge, type BadgeColor } from "@/app/components/company/ui/BimBadge";

function stageColor(stage: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    UPLOADED:           "blue",
    UNDER_REVIEW:       "amber",
    SCOPE_APPROVED:     "green",
    IN_CONVERSION:      "purple",
    QA_CHECK:           "amber",
    CLASH_REVIEW:       "red",
    COST_ESTIMATION:    "purple",
    REVISION_REQUESTED: "red",
    DELIVERED:          "green",
  };
  return map[stage] ?? "gray";
}

type Props = {
  jobs: ConversionJob[];
  loading: boolean;
};

export default function BimConversionsPanel({ jobs, loading }: Props) {
  return (
    <BimPanel noPad as="section" className="shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* ── Panel header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#2b1e12] px-5 py-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-[#fbbf24]" />
          <p className="text-xs font-black uppercase tracking-widest text-[#8a6e4e]">
            Conversion Jobs
          </p>
        </div>
        <Link
          href="/company/conversion-requests"
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
      ) : jobs.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <RefreshCw className="mx-auto h-8 w-8 text-[#3f2d1a]" />
          <p className="mt-2 text-sm text-[#6b4f30]">No active conversion jobs</p>
        </div>
      ) : (
        <div className="divide-y divide-[#1e1610]">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/company/conversion-requests?id=${job.id}`}
              className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-[#150f09]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#f0e6d4]">{job.title}</p>
                <p className="mt-0.5 truncate text-xs text-[#7a5e3e]">
                  {job.projectName ?? "—"}
                  {job.assignedEngineer ? ` · ${job.assignedEngineer}` : ""}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {job.dueDate && (
                  <span className="text-[10px] text-[#7a5e3e]">
                    {new Date(job.dueDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
                <BimBadge label={conversionStageLabel(job.stage)} color={stageColor(job.stage)} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </BimPanel>
  );
}
