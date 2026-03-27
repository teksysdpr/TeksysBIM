"use client";

import { useEffect } from "react";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";
import { getAccessToken, getStoredUser } from "@/lib/storage";
import { getLandingPathFromAuthContext, resolveAuthCategory } from "@/lib/landing";

export default function PMOLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const storedUser = getStoredUser() as
      | { category?: string | null; role?: string | null }
      | null;
    const category = resolveAuthCategory({
      category: storedUser?.category,
      role: storedUser?.role,
    });
    if (!category) {
      window.location.href = "/login";
      return;
    }

    const allowed = category === "PLANNING" || category === "ADMIN";
    if (!allowed) {
      const redirectPath = getLandingPathFromAuthContext({
        category: storedUser?.category,
        role: storedUser?.role,
      });
      window.alert("Access denied: You are not part of Planning.");
      window.location.href = redirectPath;
    }
  }, []);

  return (
    <div
      className="min-h-screen px-4 py-5 md:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at top, #1e3a8a 0%, #172554 26%, #0f172a 68%, #020617 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <CompanyPageHeader />

        <section className="rounded-[26px] border border-white/15 bg-gradient-to-br from-[#0B1120]/95 via-[#172554]/90 to-[#0F172A]/95 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] md:p-6">
          <h2 className="text-2xl font-black tracking-wide md:text-3xl">PMO / Planning Workspace</h2>
          <p className="mt-1 text-sm text-white/85 md:text-base">
            Planning control workspace with MSP-style Schedule Builder at the center.
          </p>
        </section>

        <main className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.10)] md:p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
