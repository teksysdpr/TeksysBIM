const capabilities = [
  "Project Control",
  "Procurement",
  "Inventory",
  "Billing",
  "Finance",
  "Approvals",
  "Document Control",
  "Executive Analytics",
];

export default function HomeCapabilityStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-6 md:px-6 lg:px-8">
      <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
              Core ERP Coverage
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              One platform across operational and management layers
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {capabilities.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
