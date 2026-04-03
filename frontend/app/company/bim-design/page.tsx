"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Cuboid,
  Layers3,
  PenLine,
} from "lucide-react";

const modules = [
  {
    href: "/company/bim-design/library",
    icon: BookOpen,
    title: "Element Library",
    description:
      "Manage element types, material catalogue, layer assemblies, finish systems, and structural profiles.",
    status: "active" as const,
    badge: "Available",
  },
  {
    href: "/company/bim-design/editor/demo",
    icon: Cuboid,
    title: "3D Editor",
    description:
      "Direct-3D BIM authoring canvas. Select element types from the palette and place them in the scene.",
    status: "active" as const,
    badge: "Available",
  },
  {
    href: "#",
    icon: Layers3,
    title: "Floor Plan View",
    description:
      "2D floor plan view with snap-to-grid element placement and dimension annotation.",
    status: "soon" as const,
    badge: "Coming Soon",
  },
  {
    href: "#",
    icon: PenLine,
    title: "Annotation & Schedules",
    description:
      "Room schedules, material take-off, door/window schedules, and automatic BOM generation.",
    status: "soon" as const,
    badge: "Coming Soon",
  },
];

export default function BimDesignPage() {
  return (
    <div className="space-y-6 p-5 md:p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link
          href="/company/dashboard"
          className="transition hover:text-slate-800"
        >
          Dashboard
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">BIM Design</span>
      </nav>

      {/* Intro */}
      <section className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">
          BIM Design
        </p>
        <h2 className="mt-1 text-2xl font-black text-slate-900">
          Design Tools Overview
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Build your BIM design library, author 3D models, and generate
          schedules — all from a single integrated workspace.
        </p>
      </section>

      {/* Module grid */}
      <section className="grid gap-4 md:grid-cols-2">
        {modules.map((mod) => {
          const isActive = mod.status === "active";
          const card = (
            <div
              className={[
                "group relative overflow-hidden rounded-2xl border p-5 transition",
                isActive
                  ? "border-[#e7d4c6] bg-white/95 shadow-sm hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                  : "border-slate-100 bg-slate-50/60 opacity-70 cursor-not-allowed",
              ].join(" ")}
            >
              {isActive && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400" />
              )}

              <div className="flex items-start justify-between gap-3">
                <div
                  className={[
                    "inline-flex rounded-xl p-2.5",
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "bg-slate-100 text-slate-400",
                  ].join(" ")}
                >
                  <mod.icon className="h-5 w-5" />
                </div>
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                    isActive
                      ? "border border-teal-200 bg-teal-50 text-teal-700"
                      : "border border-slate-200 bg-white text-slate-400",
                  ].join(" ")}
                >
                  {mod.badge}
                </span>
              </div>

              <h3
                className={[
                  "mt-3 text-base font-black",
                  isActive ? "text-slate-900" : "text-slate-500",
                ].join(" ")}
              >
                {mod.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {mod.description}
              </p>

              {isActive && (
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-teal-700">
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </p>
              )}
            </div>
          );

          return isActive ? (
            <Link key={mod.title} href={mod.href}>
              {card}
            </Link>
          ) : (
            <div key={mod.title}>{card}</div>
          );
        })}
      </section>
    </div>
  );
}
