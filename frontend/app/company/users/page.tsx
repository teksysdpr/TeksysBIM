import BimModulePage from "@/app/components/company/BimModulePage";

export default function UsersPage() {
  return (
    <BimModulePage
      title="User Management"
      subtitle="Create and manage BIM users, assign roles, and control project-level access."
      points={[
        "Invite users by email and assign base role with RBAC permissions.",
        "Map users to project teams with title and scope-specific access.",
        "Deactivate, reactivate, or reset credentials through admin controls.",
        "Track user activity and permission changes through audit logs.",
      ]}
    />
  );
}
