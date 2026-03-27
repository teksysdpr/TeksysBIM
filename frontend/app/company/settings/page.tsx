import BimModulePage from "@/app/components/company/BimModulePage";

export default function SettingsPage() {
  return (
    <BimModulePage
      title="Admin Settings"
      subtitle="Configure tenant-wide governance for users, permissions, storage, approvals, and audit retention."
      points={[
        "Define role-permission matrix for Admin, BIM Manager, BIM Engineer, Client, and Reviewer.",
        "Configure file policy: allowed formats, upload size, and archival retention.",
        "Set approval rules for conversion scope, deliverables, and revision requests.",
        "Manage notification templates and escalation timelines.",
      ]}
    />
  );
}
