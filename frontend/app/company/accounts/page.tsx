"use client";

export default function AccountsDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-emerald-900/20 bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-800 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.35)] md:p-8">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white/90">
            Accounts Dashboard
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            Accounts & Payment Workspace
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
            Manage payment processing, receivables, payables, deductions, and financial follow-up
            through one dedicated workspace.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Payments Due</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Receivables</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Payables</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Approval Queue</p>
            <p className="mt-2 text-3xl font-black text-slate-900">0</p>
          </div>
        </section>
      </div>
    </div>
  );
}
