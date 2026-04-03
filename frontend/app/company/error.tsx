"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CompanyRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Company route error", error);
  }, [error]);

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#090603] px-4 py-10 text-[#f5e4ca] md:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[26px] border border-[#3f2d1a] bg-gradient-to-br from-[#1b120b] to-[#120c07] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.34)]">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f0c27e]">
          TeksysBIM
        </p>
        <h1 className="mt-3 text-2xl font-black text-[#fff3de]">Workspace temporarily unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-[#d0b894]">
          A route-level error was contained so the portal stays reachable. You can return to the
          dashboard or retry this workspace.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="rounded-xl border border-[#6b3e14] bg-[#1f1209] px-4 py-2 text-sm font-bold text-[#d4933c] transition hover:bg-[#2a1910]"
          >
            Retry
          </button>
          <Link
            href="/company/dashboard"
            className="rounded-xl border border-[#3f2d1a] bg-[#120c07] px-4 py-2 text-sm font-bold text-[#f5e4ca] transition hover:border-[#6b3e14]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
