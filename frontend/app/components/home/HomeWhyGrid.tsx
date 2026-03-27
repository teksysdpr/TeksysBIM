const items = [
  {
    title: "Unified control",
    description:
      "Connect planning, procurement, inventory, billing, finance, and management reviews without fragmented spreadsheets or disconnected tools.",
  },
  {
    title: "Role-wise clarity",
    description:
      "Give company admins, PMO, project teams, purchase, accounts, and leadership exactly the visibility and actions they need.",
  },
  {
    title: "Operational traceability",
    description:
      "Track decisions, approvals, execution movement, and progress history in a single controlled workspace.",
  },
  {
    title: "Executive reporting",
    description:
      "Move from raw transactions to actionable dashboards, exception visibility, and decision-ready summaries.",
  },
];

export default function HomeWhyGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
          Why TeksysERP?
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Built for control, coordination, and management confidence
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Run projects, procurement, inventory, billing, finance, and operations through one
          integrated ERP platform with a cleaner executive experience and stronger day-to-day discipline.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={item.title}
            className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-lg font-black text-white">
              0{index + 1}
            </div>
            <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
