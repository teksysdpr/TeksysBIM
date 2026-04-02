"use client";

import Link from "next/link";
import { AlertTriangle, Bell, Info, XCircle } from "lucide-react";
import type { DashboardAlert } from "@/app/services/dashboardService";
import { BimPanel } from "@/app/components/company/ui/BimPanel";

const ALERT_STYLES = {
  warning: {
    icon: AlertTriangle,
    iconColor: "text-[#fbbf24]",
    border: "border-[#78350f]/60",
    bg: "bg-[#1c0d00]",
    title: "text-[#fbbf24]",
  },
  error: {
    icon: XCircle,
    iconColor: "text-[#f87171]",
    border: "border-[#7f1d1d]/60",
    bg: "bg-[#1a0707]",
    title: "text-[#f87171]",
  },
  info: {
    icon: Info,
    iconColor: "text-[#60a5fa]",
    border: "border-[#1e3a5f]/60",
    bg: "bg-[#091422]",
    title: "text-[#60a5fa]",
  },
};

type Props = {
  alerts: DashboardAlert[];
  loading: boolean;
};

export default function BimAlertsPanel({ alerts, loading }: Props) {
  return (
    <BimPanel as="section" className="shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-[#f87171]" />
        <p className="text-xs font-black uppercase tracking-widest text-[#8a6e4e]">Alerts & Warnings</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-[#064e3b]/40 bg-[#021a12] px-4 py-4 text-center">
          <p className="text-xs font-semibold text-[#34d399]">All clear — no active alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const s = ALERT_STYLES[a.type] ?? ALERT_STYLES.info;
            const Icon = s.icon;
            const inner = (
              <div className={`rounded-xl border ${s.border} ${s.bg} px-4 py-3 transition hover:brightness-110`}>
                <div className="flex items-start gap-2.5">
                  <Icon className={`mt-0.5 h-4 w-4 flex-none ${s.iconColor}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${s.title}`}>{a.title}</p>
                    <p className="mt-0.5 text-xs leading-4 text-[#9a7d5e]">{a.message}</p>
                  </div>
                </div>
              </div>
            );
            return a.link ? (
              <Link key={a.id} href={a.link}>{inner}</Link>
            ) : (
              <div key={a.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </BimPanel>
  );
}
