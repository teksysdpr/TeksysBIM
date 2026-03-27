const accessCards = [
  {
    title: "Company Admin",
    text: "Manage user access and permissions for all roles from the Company Dashboard.",
  },
  {
    title: "Planning & PMO",
    text: "Control schedules, baselines, revisions, reports, monitoring, and governance from one workspace.",
  },
  {
    title: "Project Teams",
    text: "Enable structured execution, daily coordination, approvals, and real-time operational visibility.",
  },
];

export default function HomeAccessGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] lg:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
            Portal access
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Controlled access with clear role ownership
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Structure ERP access around who plans, who executes, who approves, and who reviews.
            Keep teams aligned without losing governance or management control.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {accessCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                Role
              </div>
              <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
