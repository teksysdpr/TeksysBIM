"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileSymlink,
  FolderKanban,
  Layers,
  RefreshCw,
  Users,
  Wrench,
} from "lucide-react";

import BimMetricCard from "@/app/components/company/dashboard/BimMetricCard";
import BimProjectsPanel from "@/app/components/company/dashboard/BimProjectsPanel";
import BimConversionsPanel from "@/app/components/company/dashboard/BimConversionsPanel";
import BimAlertsPanel from "@/app/components/company/dashboard/BimAlertsPanel";
import BimQuickActions from "@/app/components/company/dashboard/BimQuickActions";
import BimStoragePanel from "@/app/components/company/dashboard/BimStoragePanel";
import BimPageShell from "@/app/components/company/ui/BimPageShell";
import { BimSectionLabel } from "@/app/components/company/ui/BimSectionLabel";

import {
  fetchDashboardSummary,
  fetchActiveProjects,
  fetchConversionJobs,
  fetchDashboardAlerts,
  type DashboardSummary,
  type ActiveProject,
  type ConversionJob,
  type DashboardAlert,
} from "@/app/services/dashboardService";
import { getStoredUser } from "@/lib/storage";

function todayLabel(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── 3 Module Cards ─────────────────────────────────────────────────────────────

const MODULES = [
  {
    href:        "/company/bim-design",
    label:       "BIM Design",
    tagline:     "3D model authoring & coordination",
    description: "Author intelligent BIM models, coordinate multi-discipline clashes, manage deliverables, and drive data-rich design outcomes.",
    features:    ["Revit / IFC / NWC Models", "Clash Detection", "BIM Coordination", "Deliverables"],
    icon:        Layers,
    // Blue palette
    iconColor:   "#60a5fa",
    iconBg:      "rgba(96,165,250,0.1)",
    iconBorder:  "#1e3a5f",
    cardBorder:  "#1a3050",
    cardBg:      "linear-gradient(135deg, #060d18 0%, #0a1525 60%, #080e1a 100%)",
    badge:       "#1e3a5f",
    badgeText:   "#60a5fa",
    ctaColor:    "#3b82f6",
    // Decorative SVG paths
    deco:        "blue",
  },
  {
    href:        "/company/cad2bim",
    label:       "2D CAD2BIM",
    tagline:     "Convert drawings to intelligent BIM",
    description: "Transform 2D DWG and PDF drawings into coordinated, data-rich BIM models through a structured conversion pipeline with full QA workflow.",
    features:    ["DWG / PDF Upload", "Conversion Pipeline", "Multi-Discipline", "QA Review"],
    icon:        FileSymlink,
    // Amber palette (portal accent)
    iconColor:   "#d4933c",
    iconBg:      "rgba(212,147,60,0.1)",
    iconBorder:  "#6b3e14",
    cardBorder:  "#4a2e10",
    cardBg:      "linear-gradient(135deg, #0e0803 0%, #160d05 60%, #0c0803 100%)",
    badge:       "#3d200a",
    badgeText:   "#d4933c",
    ctaColor:    "#d4933c",
    deco:        "amber",
  },
  {
    href:        "/company/costing",
    label:       "Costing",
    tagline:     "Quantity takeoff & cost estimation",
    description: "Extract quantities from BIM models, build rate-linked BOQs, generate detailed cost estimates and comparative analysis reports.",
    features:    ["Quantity Takeoff", "Rate Library", "BOQ Builder", "Estimate Reports"],
    icon:        BarChart3,
    // Purple palette
    iconColor:   "#a78bfa",
    iconBg:      "rgba(167,139,250,0.1)",
    iconBorder:  "#3b1f6b",
    cardBorder:  "#2e1860",
    cardBg:      "linear-gradient(135deg, #09061a 0%, #100825 60%, #080618 100%)",
    badge:       "#1e0f40",
    badgeText:   "#a78bfa",
    ctaColor:    "#7c3aed",
    deco:        "purple",
  },
];

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function DashboardClient() {
  const [summary, setSummary]         = useState<DashboardSummary | null>(null);
  const [projects, setProjects]       = useState<ActiveProject[]>([]);
  const [conversions, setConversions] = useState<ConversionJob[]>([]);
  const [alerts, setAlerts]           = useState<DashboardAlert[]>([]);
  const [summaryLoading, setSummaryLoading]       = useState(true);
  const [projectsLoading, setProjectsLoading]     = useState(true);
  const [conversionsLoading, setConversionsLoading] = useState(true);
  const [alertsLoading, setAlertsLoading]         = useState(true);

  const user = getStoredUser() as { fullName?: string; email?: string } | null;
  const displayName = user?.fullName ?? user?.email ?? "there";

  useEffect(() => {
    fetchDashboardSummary()
      .then(setSummary).catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
    fetchActiveProjects()
      .then(setProjects).catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false));
    fetchConversionJobs()
      .then(setConversions).catch(() => setConversions([]))
      .finally(() => setConversionsLoading(false));
    fetchDashboardAlerts()
      .then(setAlerts).catch(() => setAlerts([]))
      .finally(() => setAlertsLoading(false));
  }, []);

  return (
    <BimPageShell gap="lg">

      {/* ── Greeting header ─────────────────────────────────────────────── */}
      <section className="rounded-[24px] border border-[#2b1e12] bg-gradient-to-br from-[#1a1108] via-[#14100a] to-[#0e0b07] px-6 py-6 shadow-[0_16px_48px_rgba(0,0,0,0.45)] md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b4820]">
              TeksysBIM · Operations Hub
            </p>
            <h1 className="mt-2 text-2xl font-black text-[#f8e8cf] md:text-3xl">
              {getGreeting()}, {displayName}
            </h1>
            <p className="mt-1 text-sm text-[#8a6e4e]">{todayLabel()}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[#2b1e12] bg-[#0e0b07] px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-[#34d399]" />
            <span className="text-xs font-semibold text-[#34d399]">Portal Live</span>
          </div>
        </div>
      </section>

      {/* ── Module cards — PRIMARY ENTRY POINT ──────────────────────────── */}
      <section>
        <BimSectionLabel className="mb-4">Select Your Module</BimSectionLabel>
        <div className="grid gap-5 md:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group relative flex flex-col overflow-hidden rounded-[20px] border transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                style={{ borderColor: m.cardBorder }}
              >
                {/* Card background */}
                <div
                  className="absolute inset-0"
                  style={{ background: m.cardBg }}
                />

                {/* Decorative glow blob */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
                  style={{ backgroundColor: m.iconColor }}
                />

                {/* Content */}
                <div className="relative flex flex-1 flex-col p-6">

                  {/* Icon + badge row */}
                  <div className="mb-5 flex items-start justify-between">
                    {/* Large creative icon */}
                    <div
                      className="relative flex h-16 w-16 items-center justify-center rounded-2xl border shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                      style={{ borderColor: m.iconBorder, background: m.iconBg }}
                    >
                      <Icon className="h-8 w-8" style={{ color: m.iconColor }} />
                      {/* Inner accent ring */}
                      <div
                        className="absolute inset-1 rounded-xl opacity-20"
                        style={{ border: `1px solid ${m.iconColor}` }}
                      />
                    </div>

                    {/* Module badge */}
                    <span
                      className="rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
                      style={{ borderColor: m.iconBorder, backgroundColor: m.badge, color: m.badgeText }}
                    >
                      Module
                    </span>
                  </div>

                  {/* Title & tagline */}
                  <h2 className="text-xl font-black text-[#f8e8cf] transition group-hover:text-white">
                    {m.label}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold" style={{ color: m.iconColor }}>
                    {m.tagline}
                  </p>

                  {/* Description */}
                  <p className="mt-3 text-sm leading-relaxed text-[#8a6e4e]">
                    {m.description}
                  </p>

                  {/* Feature pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {m.features.map((f) => (
                      <span
                        key={f}
                        className="rounded-md border px-2 py-0.5 text-[10px] font-semibold"
                        style={{ borderColor: m.iconBorder, color: m.badgeText, backgroundColor: `${m.iconColor}08` }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-5 flex items-center gap-1.5">
                    <span
                      className="text-sm font-black transition group-hover:underline"
                      style={{ color: m.iconColor }}
                    >
                      Open {m.label}
                    </span>
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      style={{ color: m.iconColor }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── KPI metrics ─────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <BimMetricCard icon={FolderKanban} label="Active Projects"   value={summaryLoading ? "—" : (summary?.activeProjects ?? 0)}   subtext="Currently running" variant="gold"   loading={summaryLoading} />
        <BimMetricCard icon={RefreshCw}    label="Open Conversions"  value={summaryLoading ? "—" : (summary?.openConversions ?? 0)}   subtext="In pipeline"       variant="amber"  loading={summaryLoading} />
        <BimMetricCard icon={AlertTriangle}label="Pending Approvals" value={summaryLoading ? "—" : (summary?.pendingApprovals ?? 0)}  subtext="Awaiting action"   variant="red"    loading={summaryLoading} />
        <BimMetricCard icon={Wrench}       label="Open Clashes"      value={summaryLoading ? "—" : (summary?.openClashItems ?? 0)}    subtext="Unresolved"        variant="purple" loading={summaryLoading} />
        <BimMetricCard icon={CheckCircle2} label="Estimation Jobs"   value={summaryLoading ? "—" : (summary?.estimationJobs ?? 0)}   subtext="Active jobs"       variant="blue"   loading={summaryLoading} />
        <BimMetricCard icon={Users}        label="Active Users"      value={summaryLoading ? "—" : (summary?.activeUsers ?? 0)}      subtext="This workspace"    variant="green"  loading={summaryLoading} />
      </section>

      {/* ── Main grid: content + sidebar ────────────────────────────────── */}
      <section className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <BimProjectsPanel projects={projects} loading={projectsLoading} />
          <BimConversionsPanel jobs={conversions} loading={conversionsLoading} />
        </div>
        <div className="space-y-5">
          <BimQuickActions />
          <BimAlertsPanel alerts={alerts} loading={alertsLoading} />
        </div>
      </section>

      {/* ── Storage / plan ──────────────────────────────────────────────── */}
      <BimStoragePanel summary={summary} loading={summaryLoading} />

    </BimPageShell>
  );
}
