"use client";

import Link from "next/link";

type Scope = "company" | "pmo" | "project";

const dashboardRouteMap: Record<Scope, string> = {
  company: "/company/dashboard",
  pmo: "/pmo/dashboard",
  project: "/project/dashboard",
};

export default function BackToDashboard({
  scope,
}: {
  scope: Scope;
}) {
  return (
    <div className="flex justify-end">
      <Link
        href={dashboardRouteMap[scope]}
        className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
