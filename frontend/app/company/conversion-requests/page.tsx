import BimModulePage from "@/app/components/company/BimModulePage";

export default function ConversionRequestsPage() {
  return (
    <BimModulePage
      title="Conversion Requests"
      subtitle="Submit, assign, and manage CAD2BIM requests across the full delivery lifecycle."
      points={[
        "Create request with project, scope notes, due date, and linked files.",
        "Track stage transitions from Uploaded to Closed with full audit trail.",
        "Assign BIM Manager and BIM Engineer resources with accountability.",
        "Capture review notes, RFIs, and revision requirements in context.",
      ]}
    />
  );
}

