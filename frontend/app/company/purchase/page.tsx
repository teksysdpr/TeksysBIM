"use client";

import Link from "next/link";
import { ShoppingCart, Truck, Package, ClipboardList, ArrowRight } from "lucide-react";

const cards = [
  {
    title: "Purchase Requests",
    description: "Review purchase requisitions, internal requests, and approval readiness.",
    href: "/company/dashboard",
    icon: ClipboardList,
  },
  {
    title: "Purchase Orders",
    description: "Track RFQs, vendor selection, purchase orders, and order status.",
    href: "/company/reports",
    icon: ShoppingCart,
  },
  {
    title: "Receipts & Deliveries",
    description: "Monitor inbound material receipts, dispatches, and supplier deliveries.",
    href: "/company/project-control",
    icon: Truck,
  },
  {
    title: "Inventory Coordination",
    description: "Connect procurement with stock, stores, and material availability across projects.",
    href: "/company/documents",
    icon: Package,
  },
];

export default function PurchaseDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-teal-900/20 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.35)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white/90">
                Purchase Dashboard
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                Purchase Management Workspace
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
                Control requisitions, RFQs, vendors, purchase orders, deliveries, and procurement
                visibility through one dedicated workspace.
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
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Open Requests</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
            <p className="mt-1 text-sm text-slate-600">Pending internal purchase requests</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Open POs</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
            <p className="mt-1 text-sm text-slate-600">Purchase orders in progress</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Deliveries Due</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
            <p className="mt-1 text-sm text-slate-600">Supplier deliveries to follow up</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Vendor Actions</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
            <p className="mt-1 text-sm text-slate-600">Items needing vendor coordination</p>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Procurement Control Modules</h2>
            <p className="mt-1 text-sm text-slate-600">
              Starter dashboard for purchase users. You can expand these modules later.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-teal-300 hover:bg-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                      <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-600">
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
