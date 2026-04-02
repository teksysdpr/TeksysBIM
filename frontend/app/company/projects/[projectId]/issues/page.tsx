"use client";

import { useEffect, useState } from "react";
import { Spline } from "lucide-react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";
import {
  BimPageHeader,
  BimPanel,
  BimStateBox,
} from "@/app/components/company/ui";

interface ClashReport {
  id: string;
  disciplineA: string;
  disciplineB: string;
  createdAt: string;
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
}

export default function IssuesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [reports, setReports] = useState<ClashReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<ClashReport[] | { data: ClashReport[] } | { items: ClashReport[] }>(
      `/clash-reports?projectId=${projectId}`
    )
      .then((r) => {
        if (Array.isArray(r)) { setReports(r); return; }
        if ("data" in r) { setReports(r.data); return; }
        setReports(r.items);
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="space-y-5">
      <BimPageHeader eyebrow="Project Workspace" title="Issues & Clash Register" />

      <BimPanel noPad className="shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        {loading ? (
          <BimStateBox type="loading" />
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Spline className="h-10 w-10 text-[#3f2d1a]" />
            <p className="mt-3 text-sm font-bold text-[#7a5e3e]">No clash reports for this project</p>
            <p className="mt-1 text-xs text-[#4a2e10]">
              Clash reports are generated after BIM model coordination.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e1610]">
            <div className="grid grid-cols-5 gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[#5a3e22]">
              <span className="col-span-2">Disciplines</span>
              <span>Date</span>
              <span>Open</span>
              <span>Resolved</span>
            </div>
            {reports.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-5 items-center gap-4 px-5 py-3.5 transition hover:bg-[#150f09]"
              >
                <div className="col-span-2">
                  <p className="text-sm font-bold text-[#f0e6d4]">
                    {r.disciplineA} vs {r.disciplineB}
                  </p>
                  <p className="mt-0.5 text-xs text-[#7a5e3e]">{r.totalIssues} total clashes</p>
                </div>
                <span className="text-xs text-[#7a5e3e]">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <span className="text-sm font-black text-[#f87171]">{r.openIssues}</span>
                <span className="text-sm font-black text-[#34d399]">{r.resolvedIssues}</span>
              </div>
            ))}
          </div>
        )}
      </BimPanel>
    </div>
  );
}
