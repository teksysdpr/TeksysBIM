import BimModulePage from "@/app/components/company/BimModulePage";

export default function ProjectsPage() {
  return (
    <BimModulePage
      title="Projects List"
      subtitle="Manage BIM project masters, client mapping, members, timeline, and conversion scope packages."
      points={[
        "Create project with code, client organization, location, start-end dates, and delivery targets.",
        "Assign BIM Manager, BIM Engineers, Reviewer, and client participants at project level.",
        "Track progress by status: Draft, Active, On Hold, Completed, Archived.",
        "Search and filter by client, stage, manager, and due date.",
      ]}
    />
  );
}
