import BimModulePage from "@/app/components/company/BimModulePage";

export default function CostEstimationPage() {
  return (
    <BimModulePage
      title="Cost Estimation Dashboard"
      subtitle="Use model-derived quantities to produce cost snapshots and control commercial visibility."
      points={[
        "Maintain quantity extraction by item, unit, and discipline package.",
        "Apply rates and produce amount-level estimates with revision tracking.",
        "Compare estimate revisions against model updates and scope changes.",
        "Prepare client-ready cost summary sheets for review cycles.",
      ]}
    />
  );
}

