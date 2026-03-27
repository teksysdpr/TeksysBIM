import BimModulePage from "@/app/components/company/BimModulePage";

export default function ClientPortalPage() {
  return (
    <BimModulePage
      title="Client Portal View"
      subtitle="Controlled external view for client stakeholders to review progress, deliverables, and approvals."
      points={[
        "View project progress, current request stage, and planned milestones.",
        "Download approved deliverables and provide revision comments.",
        "Access clash summary and issue closure dashboard.",
        "Track approval history and open action items.",
      ]}
    />
  );
}
