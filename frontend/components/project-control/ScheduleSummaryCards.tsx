type Props = {
  summary: {
    total_schedules: number;
    active: number;
    paused: number;
    completed: number;
    stopped: number;
    billable: number;
    non_billable: number;
  } | null;
};

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="min-h-[92px] rounded-2xl border border-[#D7BDA9] bg-[#FFF8F1] p-4 text-center shadow-sm">
      <div className="break-words text-[11px] font-semibold uppercase leading-4 tracking-wide text-[#8A5A3B]">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold text-[#4A2C1D]">{value}</div>
    </div>
  );
}

export default function ScheduleSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      <Card title="Total Schedules" value={summary?.total_schedules ?? 0} />
      <Card title="Active" value={summary?.active ?? 0} />
      <Card title="Paused" value={summary?.paused ?? 0} />
      <Card title="Completed" value={summary?.completed ?? 0} />
      <Card title="Stopped" value={summary?.stopped ?? 0} />
      <Card title="Billable" value={summary?.billable ?? 0} />
      <Card title="Non-Billable" value={summary?.non_billable ?? 0} />
    </div>
  );
}
