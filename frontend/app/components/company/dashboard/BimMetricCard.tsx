"use client";

import { type LucideIcon } from "lucide-react";

export type MetricVariant = "gold" | "green" | "amber" | "red" | "blue" | "purple";

const VARIANTS: Record<
  MetricVariant,
  { leftBorder: string; iconRing: string; iconText: string; value: string }
> = {
  gold:   { leftBorder: "border-l-[#d4933c]", iconRing: "border-[#6b3e14] bg-[#1f1108]", iconText: "text-[#d4933c]", value: "text-[#e8c080]" },
  green:  { leftBorder: "border-l-[#34d399]", iconRing: "border-[#064e3b] bg-[#022c22]", iconText: "text-[#34d399]", value: "text-[#34d399]" },
  amber:  { leftBorder: "border-l-[#fbbf24]", iconRing: "border-[#78350f] bg-[#1c0d00]", iconText: "text-[#fbbf24]", value: "text-[#fbbf24]" },
  red:    { leftBorder: "border-l-[#f87171]", iconRing: "border-[#7f1d1d] bg-[#200a0a]", iconText: "text-[#f87171]", value: "text-[#f87171]" },
  blue:   { leftBorder: "border-l-[#60a5fa]", iconRing: "border-[#1e3a5f] bg-[#0a1a2e]", iconText: "text-[#60a5fa]", value: "text-[#60a5fa]" },
  purple: { leftBorder: "border-l-[#a78bfa]", iconRing: "border-[#3b1f6b] bg-[#130a22]", iconText: "text-[#a78bfa]", value: "text-[#a78bfa]" },
};

type Props = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  subtext?: string;
  variant?: MetricVariant;
  loading?: boolean;
};

export default function BimMetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  variant = "gold",
  loading = false,
}: Props) {
  const v = VARIANTS[variant];

  return (
    <article
      className={`rounded-2xl border border-[#2b1e12] border-l-4 ${v.leftBorder} bg-[#110e0a] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.45)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl border ${v.iconRing}`}>
          <Icon className={`h-5 w-5 ${v.iconText}`} />
        </span>
        {loading ? (
          <div className="h-9 w-14 animate-pulse rounded-lg bg-white/8" />
        ) : (
          <span className={`text-3xl font-black leading-none tabular-nums ${v.value}`}>{value}</span>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-[#f0e6d4]">{label}</p>
      {subtext && <p className="mt-0.5 text-xs text-[#8a6e4e]">{subtext}</p>}
    </article>
  );
}
