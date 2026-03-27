import Link from "next/link";

const metrics = [
  { label: "Live Control", value: "Projects, Procurement, Finance" },
  { label: "Portfolio View", value: "Single executive workspace" },
  { label: "Decision Speed", value: "Faster review and action" },
  { label: "Operational Layer", value: "One ERP, one source of truth" },
];

export default function HomeHero() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 md:px-6 lg:px-8 lg:pt-12">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 shadow-sm backdrop-blur">
            Plan Smarter. Execute Faster. Control Every Milestone.
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Integrated ERP for Projects, Procurement, and Business Operations
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            TeksysERP brings project control, procurement, inventory, billing, finance,
            approvals, and management visibility into one executive-grade platform built
            for contractors, EPC companies, and real estate teams.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              Access ERP Portal
            </Link>
            <a
              href="#home-contact"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Request Demo
            </a>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {metrics.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:p-5">
          <div className="rounded-[24px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">
                  ERP Intelligence
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Executive Command Center
                </h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
                Live
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                  Portfolio Health
                </p>
                <p className="mt-2 text-3xl font-black">92%</p>
                <p className="mt-2 text-sm text-slate-300">
                  Active projects aligned to target timelines and approvals.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                  Purchase Visibility
                </p>
                <p className="mt-2 text-3xl font-black">Real-time</p>
                <p className="mt-2 text-sm text-slate-300">
                  Requisitions, POs, stock movement, and supplier actions in one layer.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                AI Priority Feed
              </p>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                  <p className="text-sm font-bold text-white">
                    Delay signal detected in execution and procurement chain.
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Review recovery actions before milestone slippage expands.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                  <p className="text-sm font-bold text-white">
                    Resource utilization and approval bottlenecks visible instantly.
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Leadership gets one view across planning, buying, billing, and execution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
