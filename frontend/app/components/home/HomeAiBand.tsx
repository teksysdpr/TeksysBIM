const points = [
  {
    title: "Predict slippages early",
    body: "Flag delay patterns, review risk concentration, and make recovery action visible before issues become expensive.",
  },
  {
    title: "Prioritize what matters",
    body: "Surface the most important exceptions across planning, procurement, execution, approvals, and reporting.",
  },
  {
    title: "Keep leadership decision-ready",
    body: "Turn live operational movement into a management layer with concise, actionable signals.",
  },
];

export default function HomeAiBand() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
              AI Project Intelligence
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Predict issues earlier and control outcomes faster
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Use ERP data as an intelligence layer: identify bottlenecks, highlight risks,
              improve visibility, and keep execution teams and leadership aligned every day.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              AI Project Intelligence: Predict slippages early, prioritize recovery actions,
              and keep leadership decision-ready every day.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {points.map((point) => (
              <div
                key={point.title}
                className="rounded-[24px] border border-white/10 bg-white/5 p-5"
              >
                <h3 className="text-lg font-black tracking-tight text-white">{point.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
