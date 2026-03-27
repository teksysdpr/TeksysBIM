"use client";

import Link from "next/link";
import {
  Bell,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileStack,
  FolderKanban,
  Gauge,
  ShieldCheck,
  Spline,
  Users,
  Wrench,
} from "lucide-react";

const kpis = [
  { title: "Active Projects", value: "04" },
  { title: "Open Conversion Requests", value: "11" },
  { title: "Pending Approvals", value: "07" },
  { title: "Open Clash Items", value: "23" },
];

const modules = [
  { href: "/company/projects", title: "Projects List", icon: FolderKanban, desc: "Project master, members, milestones." },
  { href: "/company/files", title: "File Upload Center", icon: FileStack, desc: "DWG, PDF, IFC, RVT, NWC, ZIP uploads." },
  { href: "/company/conversion-requests", title: "Conversion Requests", icon: Boxes, desc: "CAD2BIM request lifecycle tracking." },
  { href: "/company/clash-register", title: "Clash Register", icon: Spline, desc: "Discipline clash logs and resolutions." },
  { href: "/company/cost-estimation", title: "Cost Dashboard", icon: Gauge, desc: "Quantity extraction and estimates." },
  { href: "/company/deliverables", title: "Deliverables", icon: ClipboardCheck, desc: "Submission, revision, and handover." },
  { href: "/company/workflow-board", title: "Workflow Board", icon: Wrench, desc: "Task status, assignments, blockers." },
  { href: "/company/notifications", title: "Notifications", icon: Bell, desc: "In-app updates and action prompts." },
  { href: "/company/reports", title: "Reports", icon: CheckCircle2, desc: "Progress, SLA, productivity reports." },
  { href: "/company/users", title: "User Management", icon: Users, desc: "Roles, permissions, and access matrix." },
  { href: "/company/settings", title: "Admin Settings", icon: ShieldCheck, desc: "System controls and preferences." },
  { href: "/company/client-portal", title: "Client Portal View", icon: Building2, desc: "External stakeholder visibility." },
];

export default function CompanyDashboardPage() {
  return (
    <main className="min-h-[calc(100vh-88px)] bg-[#090603] px-4 py-8 text-[#f5e4ca] md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[26px] border border-[#3f2d1a] bg-gradient-to-br from-[#1b120b] to-[#120c07] px-5 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.34)] md:px-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f0c27e]">
            TeksysBIM Workspace
          </p>
          <h1 className="mt-3 text-3xl font-black text-[#fff3de] md:text-4xl">Company Dashboard</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#d0b894]">
            Central command for CAD2BIM delivery: projects, files, conversion requests, clash
            review, quantity intelligence, approvals, and governance.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#3f2d1a] bg-[#120c07] p-5 text-center shadow-[0_14px_32px_rgba(0,0,0,0.24)]"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#cfa575]">{item.title}</p>
              <p className="mt-3 text-4xl font-black text-[#f8e8cf]">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-[#3f2d1a] bg-[#0f0905] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:border-[#a16f37]"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-[#5a3d24] bg-[#1b120b] p-2.5">
                  <item.icon className="h-5 w-5 text-[#e6b978]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#f9ead2]">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#c9b08a]">{item.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
