import BimModulePage from "@/app/components/company/BimModulePage";

export default function DeliverablesPage() {
  return (
    <BimModulePage
      title="BIM Deliverables"
      subtitle="Manage model submissions, approvals, rejections, and revision cycles with full traceability."
      points={[
        "Submit deliverables against project and conversion request scope.",
        "Capture reviewer comments and approval outcomes per version.",
        "Mark delivered packages and monitor closure quality.",
        "Keep revision history immutable and audit-ready.",
      ]}
    />
  );
}

