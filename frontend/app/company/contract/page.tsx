"use client";

import Link from "next/link";
import { FileText, Receipt, Scale, ClipboardCheck, ArrowRight } from "lucide-react";

const cards = [
  {
    title: "Contract Register",
    description: "Manage client contracts, subcontract agreements, work orders, and amendments.",
    href: "/company/documents",
    icon: FileText,
  },
  {
    title: "Billing & Certification",
    description: "Track RA bills, certification stages, deductions, approvals, and billing status.",
    href: "/company/reports",
    icon: Receipt,
  },
  {
    title: "Claims & Variations",
    description: "Monitor variation orders, claims, escalation items, and commercial changes.",
    href: "/company/project-control",
    icon: Scale,
  },
  {
    title: "Compliance & Review",
    description: "Keep notices, obligations, approvals, and contractual checkpoints under control.",
    href: "/company/dashboard",
    icon: ClipboardCheck,
  },
];

export default function ContractDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-indigo-900/20 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.35)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white/90">
                Contract Dashboard
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                Contract Management Workspace
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
                Manage contracts, certifications, claims, variations, approvals, and commercial control
                through one dedicated workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/company/dashboard"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Company Dashboard
              </Link>
              <Link
                href="/company/reports"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Reports
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Active Contracts</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
            <p className="mt-1 text-sm text-slate-600">Current contract records</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Bills Pending</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
            <p className="mt-1 text-sm text-slate-600">Awaiting review or certification</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Variation Items</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
            <p className="mt-1 text-sm text-slate-600">Open commercial changes</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Claims</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
            <p className="mt-1 text-sm text-slate-600">Commercial issues requiring action</p>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Contract Control Modules</h2>
            <p className="mt-1 text-sm text-slate-600">
              Starter dashboard for contract users. You can expand these modules later.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-indigo-300 hover:bg-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                      <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                        Open module <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
