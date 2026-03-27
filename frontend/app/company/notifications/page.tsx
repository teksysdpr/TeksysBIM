import BimModulePage from "@/app/components/company/BimModulePage";

export default function NotificationsPage() {
  return (
    <BimModulePage
      title="Notifications"
      subtitle="Monitor in-app and email notifications for assignments, approvals, due dates, and revision actions."
      points={[
        "Queued, sent, read, and failed delivery states with channel-level breakdown.",
        "Role-aware notification routing: manager, engineer, reviewer, and client.",
        "Escalation alerts for overdue tasks and delayed conversion stages.",
        "Action links to open request, deliverable, or clash item directly.",
      ]}
    />
  );
}
