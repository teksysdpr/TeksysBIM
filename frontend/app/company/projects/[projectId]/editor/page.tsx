"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import EditorShell from "@/app/editor/components/EditorShell";
import { fetchProject } from "@/app/services/projectsService";

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectName, setProjectName] = useState<string | undefined>();

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
        .then((p) => setProjectName(p.name))
        .catch(() => {});
    }
  }, [projectId]);

  return <EditorShell projectName={projectName} />;
}
