import ProjectWorkspaceShell from "@/app/components/company/projects/ProjectWorkspaceShell";

interface Props {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function ProjectWorkspaceLayout({ children, params }: Props) {
  const { projectId } = await params;
  return (
    <ProjectWorkspaceShell projectId={projectId}>
      {children}
    </ProjectWorkspaceShell>
  );
}
