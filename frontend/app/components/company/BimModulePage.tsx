"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
  points: string[];
};

export default function BimModulePage({ title, subtitle, points }: Props) {
  return (
    <main className="min-h-[calc(100vh-88px)] bg-[#090603] px-4 py-8 text-[#f4e2c8] md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <Link
          href="/company/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-[#5a3d24] bg-[#1a120b] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#f0c27e] transition hover:bg-[#25180d]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>

        <section className="rounded-[24px] border border-[#3f2d1a] bg-gradient-to-br from-[#1b120b] to-[#120c07] px-6 py-7 shadow-[0_20px_50px_rgba(0,0,0,0.34)]">
          <h1 className="text-3xl font-black text-[#fff3de]">{title}</h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-[#d0b894]">{subtitle}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {points.map((point) => (
            <article
              key={point}
              className="rounded-2xl border border-[#3f2d1a] bg-[#0f0905] p-5 text-sm leading-7 text-[#d2bb98] shadow-[0_14px_30px_rgba(0,0,0,0.24)]"
            >
              {point}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
