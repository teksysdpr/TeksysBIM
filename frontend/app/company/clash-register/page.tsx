import BimModulePage from "@/app/components/company/BimModulePage";

export default function ClashRegisterPage() {
  return (
    <BimModulePage
      title="Clash Detection Register"
      subtitle="Record and monitor interdisciplinary clashes with severity, ownership, and closure status."
      points={[
        "Create clash reports for Arch vs MEP vs Structural coordination cycles.",
        "Track open, resolved, and overdue issues with severity segmentation.",
        "Assign actions with target dates and resolution notes.",
        "Export clash logs for QA and client coordination meetings.",
      ]}
    />
  );
}

