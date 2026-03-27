import BimModulePage from "@/app/components/company/BimModulePage";

export default function ReportsPage() {
  return (
    <BimModulePage
      title="Reports"
      subtitle="Generate execution, quality, clash, quantity, and delivery reports for BIM governance."
      points={[
        "Daily and weekly conversion throughput by project, discipline, and engineer.",
        "Stage aging report: requests stuck in review, QA, clash, or cost pipeline.",
        "Deliverable acceptance ratio, revision cycle count, and closure performance.",
        "Export-ready reports for client review meetings and internal PMO controls.",
      ]}
    />
  );
}
