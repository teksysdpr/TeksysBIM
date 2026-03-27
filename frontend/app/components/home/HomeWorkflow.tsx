const steps = [
  {
    title: "Plan",
    body: "Build project controls, baselines, roles, and operational structure.",
  },
  {
    title: "Procure",
    body: "Manage requests, purchase workflows, vendor actions, and material readiness.",
  },
  {
    title: "Execute",
    body: "Drive site activity, approvals, billing movement, and team accountability.",
  },
  {
    title: "Track",
    body: "Capture progress, visibility, exceptions, and operational traceability.",
  },
  {
    title: "Control",
    body: "Turn live ERP data into executive review, risk focus, and faster decisions.",
  },
];

export default function HomeWorkflow() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] lg:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
            End-to-end ERP workflow walkthrough
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            One operating rhythm from planning to management control
          </h2>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Step
                </span>
                <span className="text-lg font-black text-indigo-600">0{index + 1}</span>
              </div>
              <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
