"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function BimDesignError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("BIM Design route error", error);
  }, [error]);

  return (
    <div className="space-y-6 p-5 md:p-6">
      <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
          BIM Design
        </p>
        <h2 className="mt-1 text-2xl font-black text-slate-900">Workspace recovered safely</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          A BIM Design error was isolated so it does not break the wider portal. You can retry this
          route or go back to the dashboard while the failing panel is stabilized.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={reset}
          className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700 transition hover:bg-teal-100"
        >
          Retry BIM Design
        </button>
        <Link
          href="/company/dashboard"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
