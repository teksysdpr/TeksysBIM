"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Cuboid, Layers3, PenLine } from "lucide-react";

const modules = [
  {
    href: "/company/bim-design/library",
    icon: BookOpen,
    title: "Element Library",
    description:
      "Manage categories, families, types, materials, and layered assemblies that will drive browser BIM authoring.",
    status: "active" as const,
    badge: "Live",
    accent: "from-[#0f766e] via-[#0b5f59] to-[#083f3c]",
    ring: "border-[#2b7c73]",
    iconBg: "bg-[#d9f5ef]",
    iconText: "text-[#0f766e]",
  },
  {
    href: "/company/bim-design/editor/demo",
    icon: Cuboid,
    title: "3D Editor",
    description:
      "Open the BIM authoring workspace with guarded canvas initialization and store-driven scene state.",
    status: "active" as const,
    badge: "Live",
    accent: "from-[#14532d] via-[#166534] to-[#0f3d22]",
    ring: "border-[#2d8b50]",
    iconBg: "bg-[#ddfbe8]",
    iconText: "text-[#166534]",
  },
  {
    href: "#",
    icon: Layers3,
    title: "Floor Plan View",
    description:
      "Reserved for future 2D floor-plan authoring, snapping, dimensioning, and hybrid drafting interactions.",
    status: "soon" as const,
    badge: "Next Phase",
    accent: "from-[#334155] via-[#475569] to-[#334155]",
    ring: "border-[#94a3b8]",
    iconBg: "bg-[#e2e8f0]",
    iconText: "text-[#475569]",
  },
  {
    href: "#",
    icon: PenLine,
    title: "Schedules & Annotation",
    description:
      "Planned schedule generation, tags, and downstream documentation support built from BIM model state.",
    status: "soon" as const,
    badge: "Next Phase",
    accent: "from-[#7c2d12] via-[#9a3412] to-[#7c2d12]",
    ring: "border-[#ea580c]",
    iconBg: "bg-[#ffedd5]",
    iconText: "text-[#c2410c]",
  },
];

export default function BimDesignPage() {
  return (
    <div className="space-y-8 p-5 md:p-7">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-[#bfe5dd] bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,118,110,0.08)]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0f766e]">
            BIM Design Overview
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0f172a]">
            Structured workspace for model-first BIM delivery
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#475569]">
            Use the library to define reusable BIM intelligence, then open the editor to author
            scene elements from normalized type and assembly data. Experimental areas stay isolated
            so the route remains usable while the module evolves.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[24px] border border-[#cde8e2] bg-[#f7fcfb] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0f766e]">
              Current Focus
            </p>
            <p className="mt-2 text-xl font-black text-[#0f172a]">BIM Design</p>
            <p className="mt-1 text-sm leading-6 text-[#52606d]">
              Stable entry point for authoring, library definition, and future CAD-to-BIM inputs.
            </p>
          </div>
          <div className="rounded-[24px] border border-[#cde8e2] bg-[#f7fcfb] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0f766e]">
              Route Policy
            </p>
            <p className="mt-2 text-xl font-black text-[#0f172a]">Quarantined Safely</p>
            <p className="mt-1 text-sm leading-6 text-[#52606d]">
              If one BIM panel fails, the whole portal should still stay reachable.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {modules.map((mod) => {
          const isActive = mod.status === "active";
          const card = (
            <div
              className={[
                "group relative h-full overflow-hidden rounded-[26px] border bg-white p-6 shadow-[0_18px_38px_rgba(2,13,12,0.08)] transition",
                isActive
                  ? `${mod.ring} hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(2,13,12,0.14)]`
                  : "border-[#d5dde5] opacity-80",
              ].join(" ")}
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${mod.accent}`} />

              <div className="flex items-start justify-between gap-3">
                <div className={`inline-flex rounded-2xl p-3 ${mod.iconBg}`}>
                  <mod.icon className={`h-6 w-6 ${mod.iconText}`} />
                </div>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
                    isActive
                      ? "bg-[#dcfce7] text-[#166534]"
                      : "bg-[#e2e8f0] text-[#475569]",
                  ].join(" ")}
                >
                  {mod.badge}
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-black tracking-tight text-[#0f172a]">
                {mod.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#52606d]">{mod.description}</p>

              <div className="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#0f766e]">
                {isActive ? "Open Workspace" : "Planned"}
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          );

          return isActive ? (
            <Link key={mod.title} href={mod.href} className="block h-full">
              {card}
            </Link>
          ) : (
            <div key={mod.title} className="h-full">
              {card}
            </div>
          );
        })}
      </section>
    </div>
  );
}
