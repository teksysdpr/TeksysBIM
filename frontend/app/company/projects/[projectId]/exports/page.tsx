"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Download } from "lucide-react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";
import {
  BimPageHeader,
  BimPanel,
  BimStateBox,
} from "@/app/components/company/ui";

interface Deliverable {
  id: string;
  title: string;
  version?: string;
  status: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     "border-white/15 bg-white/5 text-[#8a6e4e]",
  SUBMITTED: "border-[#78350f]/60 bg-[#78350f]/20 text-[#fbbf24]",
  APPROVED:  "border-[#064e3b]/60 bg-[#064e3b]/20 text-[#34d399]",
  REJECTED:  "border-[#7f1d1d]/60 bg-[#7f1d1d]/20 text-[#f87171]",
};

export default function ExportsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<Deliverable[] | { data: Deliverable[] } | { items: Deliverable[] }>(
      `/deliverables?projectId=${projectId}`
    )
      .then((r) => {
        if (Array.isArray(r)) { setDeliverables(r); return; }
        if ("data" in r) { setDeliverables(r.data); return; }
        setDeliverables(r.items);
      })
      .catch(() => setDeliverables([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="space-y-5">
      <BimPageHeader eyebrow="Project Workspace" title="Exports & Deliverables" />

      <BimPanel noPad className="shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        {loading ? (
          <BimStateBox type="loading" />
        ) : deliverables.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Download className="h-10 w-10 text-[#3f2d1a]" />
            <p className="mt-3 text-sm font-bold text-[#7a5e3e]">No deliverables submitted yet</p>
            <p className="mt-1 text-xs text-[#4a2e10]">
              Deliverables are created when conversion requests are completed and files approved.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e1610]">
            <div className="grid grid-cols-4 gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[#5a3e22]">
              <span className="col-span-2">Deliverable</span>
              <span>Status</span>
              <span>Date</span>
            </div>
            {deliverables.map((d) => {
              const cls = STATUS_STYLE[d.status] ?? STATUS_STYLE.DRAFT;
              return (
                <div
                  key={d.id}
                  className="grid grid-cols-4 items-center gap-4 px-5 py-3.5 transition hover:bg-[#150f09]"
                >
                  <div className="col-span-2 flex items-center gap-2.5">
                    <ClipboardCheck className="h-4 w-4 flex-none text-[#5a3e22]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#f0e6d4]">{d.title}</p>
                      {d.version && (
                        <p className="mt-0.5 font-mono text-[10px] text-[#6b4f30]">{d.version}</p>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>
                    {d.status}
                  </span>
                  <span className="text-xs text-[#7a5e3e]">
                    {d.reviewedAt
                      ? new Date(d.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                      : d.submittedAt
                      ? new Date(d.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </BimPanel>
    </div>
  );
}
