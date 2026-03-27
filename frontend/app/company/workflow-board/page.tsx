import BimModulePage from "@/app/components/company/BimModulePage";

export default function WorkflowBoardPage() {
  return (
    <BimModulePage
      title="Tasks and Workflow Board"
      subtitle="Plan and execute BIM production tasks across teams with status and ownership visibility."
      points={[
        "Kanban-style tracking: To Do, In Progress, In Review, Done.",
        "Assign tasks by discipline package with priority and due dates.",
        "Track blockers, dependencies, and overdue actions.",
        "Generate team workload and completion analytics.",
      ]}
    />
  );
}

