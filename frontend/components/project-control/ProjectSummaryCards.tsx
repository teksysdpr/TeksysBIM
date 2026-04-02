type Props = {
  summary: {
    total_projects: number;
    active_projects: number;
    on_hold_projects: number;
    completed_projects: number;
  } | null;
};

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#2b1e12] bg-[#110e0a] p-4 text-center shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#8a6e4e]">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold text-[#fff3de]">{value}</div>
    </div>
  );
}

export default function ProjectSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-2">
      <Card title="Total Projects" value={summary?.total_projects ?? 0} />
      <Card title="Active Projects" value={summary?.active_projects ?? 0} />
      <Card title="On-Hold Projects" value={summary?.on_hold_projects ?? 0} />
      <Card title="Completed Projects" value={summary?.completed_projects ?? 0} />
    </div>
  );
}
