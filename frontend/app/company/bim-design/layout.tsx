"use client";

import { useEffect } from "react";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";
import { getAccessToken, getStoredUser } from "@/lib/storage";
import { resolveAuthCategory } from "@/lib/landing";

export default function BimDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const storedUser = getStoredUser() as {
      category?: string | null;
      role?: string | null;
    } | null;
    const category = resolveAuthCategory({
      category: storedUser?.category,
      role: storedUser?.role,
    });
    if (!category) {
      window.location.href = "/login";
    }
  }, []);

  return (
    <div
      className="min-h-screen px-4 py-5 md:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at top, #0f766e 0%, #115e59 26%, #0a2d28 68%, #020d0c 100%)",
      }}
    >
      <div className="mx-auto max-w-[1440px] space-y-5">
        <CompanyPageHeader />

        <section className="rounded-[26px] border border-teal-900/50 bg-gradient-to-br from-[#082f29]/95 via-[#0d3d36]/90 to-[#071e1b]/95 p-5 text-white shadow-[0_24px_60px_rgba(2,13,12,0.45)] md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-300/70">
                TeksysBIM
              </p>
              <h1 className="text-2xl font-black tracking-wide text-white md:text-3xl">
                BIM Design Workspace
              </h1>
              <p className="text-sm text-white/65">
                Element library · Material catalogue · Layer assemblies · Direct-3D authoring
              </p>
            </div>
          </div>
        </section>

        <main className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(2,13,12,0.14)]">
          {children}
        </main>
      </div>
    </div>
  );
}
