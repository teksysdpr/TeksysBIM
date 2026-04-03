"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Grid3X3, Layers3 } from "lucide-react";
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#154d46_0%,#0e2f2b_30%,#071614_70%,#04100f_100%)] px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-[28px] border border-[#1f5a54] bg-[linear-gradient(135deg,rgba(5,24,22,0.96),rgba(10,50,45,0.94),rgba(6,22,20,0.98))] shadow-[0_28px_70px_rgba(1,10,9,0.45)]">
          <div className="flex flex-col gap-5 p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/company/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-[#2b6a62] bg-[#0a221f] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#9ce6d7] transition hover:border-[#49a698] hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </Link>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#28534e] bg-[#09201d]/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#7fd5c4]">
                <span className="h-2 w-2 rounded-full bg-[#38d39f]" />
                BIM Design Module
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2f7269] bg-[#0c2a26] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Layers3 className="h-7 w-7 text-[#8ce3cf]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#7fd5c4]">
                      TeksysBIM
                    </p>
                    <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                      BIM Design Workspace
                    </h1>
                  </div>
                </div>

                <p className="max-w-3xl text-sm leading-7 text-[#c6ece4] md:text-[15px]">
                  Design library, model authoring, and future schedule-driven BIM workflows in one
                  workspace. This route is intentionally isolated so BIM experiments do not affect
                  the wider portal.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-[#245951] bg-[#081d1b]/90 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#72ccb9]">
                    Active Scope
                  </p>
                  <p className="mt-2 text-lg font-black text-white">Library + Authoring</p>
                  <p className="mt-1 text-xs leading-5 text-[#b0ddd3]">
                    Stable entry points for element library and editor access.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#245951] bg-[#081d1b]/90 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#72ccb9]">
                    Architecture Direction
                  </p>
                  <p className="mt-2 text-lg font-black text-white">Store-Driven BIM</p>
                  <p className="mt-1 text-xs leading-5 text-[#b0ddd3]">
                    Model/state stays authoritative; rendering remains a derived layer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="rounded-[28px] border border-[#224842] bg-[linear-gradient(180deg,#f7fcfb_0%,#edf7f5_100%)] shadow-[0_18px_48px_rgba(3,15,13,0.18)]">
          {children}
        </main>
      </div>
    </div>
  );
}
