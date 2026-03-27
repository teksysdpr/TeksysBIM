"use client";

import Link from "next/link";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";

export default function Page() {
  return (
    <div className="min-h-screen erp-page-bg p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <CompanyPageHeader />

        <section className="text-white">
          <div className="mb-2">
            <Link
              href="/company/dashboard"
              className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-white shadow-sm sm:text-sm"
            >
              Back to Dashboard
            </Link>
          </div>

          <h2 className="text-3xl font-extrabold tracking-wide">
            Audit Logs
          </h2>
          <p className="mt-2 text-sm text-white/85 md:text-base">
            This page is under development.
          </p>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl">
          <div className="text-slate-900">Module page under development.</div>
        </section>
      </div>
    </div>
  );
}
