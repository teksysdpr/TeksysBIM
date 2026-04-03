"use client";

import Link from "next/link";
import { BimSectionLabel } from "@/app/components/company/ui/BimSectionLabel";
import {
  Bell,
  BookOpen,
  Boxes,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Cuboid,
  FileStack,
  FolderKanban,
  KanbanSquare,
  ShieldCheck,
  Spline,
  Users,
} from "lucide-react";

const MODULES = [
  {
    group: "Core BIM",
    items: [
      { href: "/company/projects",           icon: FolderKanban,  label: "Projects",           desc: "Project master, members, milestones." },
      { href: "/company/files",              icon: FileStack,     label: "Files",              desc: "DWG, IFC, RVT, PDF, NWC uploads." },
      { href: "/company/conversion-requests",icon: Boxes,         label: "Conversions",        desc: "CAD2BIM request lifecycle tracking." },
      { href: "/company/bim-design",         icon: Cuboid,        label: "BIM Design",         desc: "Element library and model authoring." },
      { href: "/company/clash-register",     icon: Spline,        label: "Clash Register",     desc: "Interdisciplinary clash logs." },
    ],
  },
  {
    group: "Delivery",
    items: [
      { href: "/company/deliverables",       icon: ClipboardCheck,label: "Deliverables",       desc: "Submissions, revisions, handover." },
      { href: "/company/workflow-board",     icon: KanbanSquare,  label: "Workflow Board",     desc: "Task kanban, assignments, blockers." },
      { href: "/company/documents",          icon: BookOpen,      label: "Documents",          desc: "Project documentation hub." },
      { href: "/company/notifications",      icon: Bell,          label: "Notifications",      desc: "In-app updates and action prompts." },
    ],
  },
  {
    group: "Commercial",
    items: [
      { href: "/company/cost-estimation",    icon: Calculator,    label: "Cost Estimation",    desc: "Quantity extraction and estimates." },
      { href: "/company/reports",            icon: CheckCircle2,  label: "Reports",            desc: "Progress, SLA, productivity." },
      { href: "/company/client-portal",      icon: Building2,     label: "Client Portal",      desc: "External stakeholder view." },
      { href: "/company/analytics",          icon: CheckCircle2,  label: "Analytics",          desc: "Trends and performance insights." },
    ],
  },
  {
    group: "Platform",
    items: [
      { href: "/company/users",              icon: Users,         label: "Users",              desc: "Roles, permissions, access." },
      { href: "/company/settings",           icon: ShieldCheck,   label: "Settings",           desc: "System controls and preferences." },
      { href: "/company/masters",            icon: BookOpen,      label: "Masters",            desc: "Lookup data and reference tables." },
      { href: "/company/audit-logs",         icon: ClipboardCheck,label: "Audit Logs",         desc: "Full activity and change history." },
    ],
  },
];

export default function BimModuleGrid() {
  return (
    <section className="space-y-5">
      {MODULES.map((group) => (
        <div key={group.group}>
          <BimSectionLabel className="mb-3">{group.group}</BimSectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-start gap-3 rounded-2xl border border-[#2b1e12] bg-[#110e0a] p-4 shadow-[0_4px_14px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-[#6b3e14] hover:bg-[#160f08]"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-[#4a3018] bg-[#1a0f06]">
                  <item.icon className="h-4 w-4 text-[#d4933c]" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#f0e6d4]">{item.label}</p>
                  <p className="mt-1 text-xs leading-4 text-[#7a5e3e]">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
