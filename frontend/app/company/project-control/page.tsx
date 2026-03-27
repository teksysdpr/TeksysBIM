"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";
import ProjectSummaryCards from "@/components/project-control/ProjectSummaryCards";
import ProjectListTable from "@/components/project-control/ProjectListTable";
import ScheduleSummaryCards from "@/components/project-control/ScheduleSummaryCards";
import ScheduleListTable from "@/components/project-control/ScheduleListTable";
import AddProjectModal from "@/components/project-control/AddProjectModal";
import type { ProjectCreateFormPayload } from "@/components/project-control/AddProjectModal";
import AddScheduleModal from "@/components/project-control/AddScheduleModal";
import {
  createProject,
  createSchedule,
  deleteProject,
  deleteSchedule,
  getProjectSummary,
  getProjects,
  getScheduleSummary,
  getSchedules,
  ProjectRow,
  ProjectSummary,
  SchedulePayload,
  ScheduleRow,
  ScheduleSummary,
  toBackendProjectStatus,
  toBackendScheduleStatus,
  updateProject,
  updateSchedule,
} from "@/app/services/projectControlService";
import { readProjectImageMap } from "@/lib/projectMedia";

function SectionCard({
  title,
  subtitle,
  children,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#D7BDA9] bg-[#F3E3D3] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] md:p-6">
      <div className="mb-4 flex flex-col gap-3 border-b border-[#D6B9A3] pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#4A2C1D]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[#6A4937]">{subtitle}</p> : null}
        </div>
        {rightAction ? <div>{rightAction}</div> : null}
      </div>
      {children}
    </section>
  );
}

type EditableSchedule = {
  schedule_name: string;
  start_date: string;
  end_date: string;
  status: string;
  is_billable: boolean;
  remarks: string;
};

export default function ProjectControlPage() {
  const [loading, setLoading] = useState(true);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [scheduleSummary, setScheduleSummary] = useState<ScheduleSummary | null>(null);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<number | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [projectImageMap, setProjectImageMap] = useState<Record<number, string>>({});
  const [prefillProjectId, setPrefillProjectId] = useState<number | null>(null);

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);

  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);

  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [savingScheduleEdit, setSavingScheduleEdit] = useState(false);
  const [editScheduleForm, setEditScheduleForm] = useState<EditableSchedule | null>(null);

  async function loadProjectsBlock() {
    const [summaryRes, projectsRes] = await Promise.all([getProjectSummary(), getProjects()]);
    setProjectSummary(summaryRes);
    setProjects(projectsRes.rows || []);
  }

  async function loadSchedulesBlock(project: ProjectRow) {
    const [summaryRes, listRes] = await Promise.all([
      getScheduleSummary(project.id),
      getSchedules(project.id),
    ]);
    setSelectedProject(project);
    setScheduleSummary(summaryRes);
    setSchedules(listRes.rows || []);
  }

  async function refreshSelectedProjectSchedules(projectId?: number) {
    const targetProjectId = projectId || selectedProject?.id;
    if (!targetProjectId) return;

    const project =
      projects.find((p) => p.id === targetProjectId) ||
      (await getProjects()).rows.find((p) => p.id === targetProjectId);

    if (!project) return;
    await loadSchedulesBlock(project);
  }

  async function initialLoad() {
    try {
      setLoading(true);
      setPageError(null);
      await loadProjectsBlock();
    } catch (error: any) {
      setPageError(error?.message || "Failed to load Project Control data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawMap = readProjectImageMap();
    const normalized: Record<number, string> = {};
    Object.entries(rawMap).forEach(([key, value]) => {
      const id = Number(key);
      if (!Number.isNaN(id) && id > 0 && value) {
        normalized[id] = value;
      }
    });
    setProjectImageMap(normalized);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("project_id");
    const parsed = raw ? Number(raw) : null;
    if (parsed && !Number.isNaN(parsed)) {
      setPrefillProjectId(parsed);
    }
  }, []);

  useEffect(() => {
    if (!prefillProjectId || Number.isNaN(prefillProjectId)) return;
    if (!projects.length) return;
    if (selectedProject?.id === prefillProjectId) return;

    const targetProject = projects.find((p) => p.id === prefillProjectId);
    if (!targetProject) return;

    let active = true;
    (async () => {
      try {
        const [summaryRes, listRes] = await Promise.all([
          getScheduleSummary(targetProject.id),
          getSchedules(targetProject.id),
        ]);
        if (!active) return;
        setSelectedProject(targetProject);
        setScheduleSummary(summaryRes);
        setSchedules(listRes.rows || []);
      } catch (error: any) {
        if (!active) return;
        setPageError(error?.message || "Failed to load schedules.");
      }
    })();

    return () => {
      active = false;
    };
  }, [prefillProjectId, projects, selectedProject?.id]);

  function handleCloseProjectModal() {
    setIsAddProjectOpen(false);
    setEditingProject(null);
  }

  async function handleSaveProject(payload: ProjectCreateFormPayload) {
    try {
      if (editingProject) {
        const updated = await updateProject(editingProject.id, payload);
        handleCloseProjectModal();
        await loadProjectsBlock();
        if (selectedProject?.id === updated.id) {
          setSelectedProject(updated);
        }
        alert("Project updated successfully.");
        return;
      }

      await createProject(payload);

      handleCloseProjectModal();
      await loadProjectsBlock();
      alert("Project created successfully.");
    } catch (error: any) {
      alert(error?.message || `Failed to ${editingProject ? "update" : "create"} project.`);
    }
  }

  async function handleDisplaySchedules(project: ProjectRow) {
    try {
      setPageError(null);
      await loadSchedulesBlock(project);
    } catch (error: any) {
      setPageError(error?.message || "Failed to load schedules.");
    }
  }

  function handleStartEdit(project: ProjectRow) {
    setEditingProject(project);
    setIsAddProjectOpen(true);
  }

  async function handleDelete(project: ProjectRow) {
    const confirmed = window.confirm(
      `Delete project "${project.project_name}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingProjectId(project.id);
      setPageError(null);

      const res = await deleteProject(project.id);

      if (!res.ok) {
        alert(res.message || "Unable to delete project.");
        return;
      }

      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
        setScheduleSummary(null);
        setSchedules([]);
      }

      await loadProjectsBlock();
      alert(res.message || "Project deleted successfully.");
    } catch (error: any) {
      setPageError(error?.message || "Failed to delete project.");
    } finally {
      setDeletingProjectId(null);
    }
  }

  async function handleCreateSchedule(payload: SchedulePayload) {
    if (!selectedProject) {
      alert("Please select a project first.");
      return;
    }

    try {
      await createSchedule(selectedProject.id, payload);
      setIsAddScheduleOpen(false);
      await refreshSelectedProjectSchedules(selectedProject.id);
      alert("Schedule created successfully.");
    } catch (error: any) {
      alert(error?.message || "Failed to create schedule.");
    }
  }

  function handleStartScheduleEdit(row: ScheduleRow) {
    setEditingScheduleId(row.id);
    setEditScheduleForm({
      schedule_name: row.schedule_name || "",
      start_date: row.start_date || "",
      end_date: row.end_date || "",
      status: toBackendScheduleStatus(row.status),
      is_billable: !!row.is_billable,
      remarks: row.remarks || "",
    });
  }

  function handleChangeScheduleEdit(field: keyof EditableSchedule, value: string | boolean) {
    setEditScheduleForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function handleCancelScheduleEdit() {
    setEditingScheduleId(null);
    setEditScheduleForm(null);
  }

  async function handleSaveScheduleEdit(scheduleId: number) {
    if (!selectedProject || !editScheduleForm) return;

    try {
      setSavingScheduleEdit(true);

      await updateSchedule(selectedProject.id, scheduleId, {
        schedule_name: editScheduleForm.schedule_name,
        start_date: editScheduleForm.start_date || null,
        end_date: editScheduleForm.end_date || null,
        status: editScheduleForm.status,
        is_billable: editScheduleForm.is_billable,
        remarks: editScheduleForm.remarks || null,
      });

      handleCancelScheduleEdit();
      await refreshSelectedProjectSchedules(selectedProject.id);
      alert("Schedule updated successfully.");
    } catch (error: any) {
      alert(error?.message || "Failed to update schedule.");
    } finally {
      setSavingScheduleEdit(false);
    }
  }

  async function handleDeleteSchedule(row: ScheduleRow) {
    if (!selectedProject) {
      alert("Please select a project first.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete schedule "${row.schedule_name}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingScheduleId(row.id);
      await deleteSchedule(selectedProject.id, row.id);
      await refreshSelectedProjectSchedules(selectedProject.id);
      alert("Schedule deleted successfully.");
    } catch (error: any) {
      alert(error?.message || "Failed to delete schedule.");
    } finally {
      setDeletingScheduleId(null);
    }
  }

  async function handleScheduleQuickAction(
    row: ScheduleRow,
    action: "activate" | "pause" | "complete" | "stop" | "toggle_billable"
  ) {
    if (!selectedProject) {
      alert("Please select a project first.");
      return;
    }

    try {
      const statusMap = {
        activate: "Active",
        pause: "Paused",
        complete: "Completed",
        stop: "Stopped",
      } as const;

      const payload = {
        schedule_name: row.schedule_name,
        start_date: row.start_date || null,
        end_date: row.end_date || null,
        status:
          action === "toggle_billable"
            ? toBackendScheduleStatus(row.status)
            : statusMap[action],
        is_billable:
          action === "toggle_billable" ? !row.is_billable : row.is_billable,
        remarks: row.remarks || null,
      };

      await updateSchedule(selectedProject.id, row.id, payload);
      await refreshSelectedProjectSchedules(selectedProject.id);
      alert("Schedule updated successfully.");
    } catch (error: any) {
      alert(error?.message || "Failed to update schedule.");
    }
  }

  const scheduleSummaryTitle = selectedProject
    ? `Schedule Summary for ${selectedProject.project_name}`
    : "Schedule Summary for Selected Project";

  return (
    <div className="min-h-screen bg-[#4A2C1D] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <CompanyPageHeader />

        <div className="flex items-center justify-between gap-4">
          <Link
            href="/company/dashboard"
            className="inline-flex items-center rounded-xl border border-[#D7BDA9] bg-[#F3E3D3] px-4 py-2 text-sm font-semibold text-[#4A2C1D] shadow-sm hover:bg-[#EAD7C4]"
          >
            ← Back to Company Dashboard
          </Link>
        </div>

        <div className="pt-1">
          <h1 className="text-left text-2xl font-bold text-[#FFF4EA] md:text-3xl">
            Project Control
          </h1>
          <p className="mt-2 text-sm text-[#F3E3D3] md:text-base">
            Project summary, project list, and schedule view for the selected project.
          </p>
        </div>

        {pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-1">
            <SectionCard
              title="Project Summary KPI"
              subtitle="High-level project counts for the company."
            >
              <ProjectSummaryCards summary={projectSummary} />
            </SectionCard>
          </div>

          <div className="xl:col-span-2">
            <SectionCard
              title={scheduleSummaryTitle}
              subtitle={
                selectedProject
                  ? `Showing schedule KPIs for ${selectedProject.project_name}.`
                  : "Select a project from the list below to view its schedule summary."
              }
            >
              <ScheduleSummaryCards summary={scheduleSummary} />
            </SectionCard>
          </div>
        </div>

        <SectionCard
          title="Project List"
          subtitle="Use Manage Schedule to display the schedules for a particular project."
        >
          {loading ? (
            <div className="rounded-2xl border border-[#D6B9A3] bg-[#EED9C7] px-4 py-6 text-sm text-[#6A4937]">
              Loading project control data...
            </div>
          ) : (
            <>
              <ProjectListTable
                rows={projects}
                projectImageMap={projectImageMap}
                selectedProjectId={selectedProject?.id || null}
                onDisplaySchedules={handleDisplaySchedules}
                onDelete={handleDelete}
                deletingProjectId={deletingProjectId}
                onStartEdit={handleStartEdit}
              />

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProject(null);
                    setIsAddProjectOpen(true);
                  }}
                  className="rounded-xl border border-[#6F4A36] bg-[#8B5E3C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_5px_0_#5B3421]"
                >
                  Create Project
                </button>
              </div>
            </>
          )}
        </SectionCard>

        {selectedProject ? (
          <SectionCard
            title={`Schedules for ${selectedProject.project_name}`}
            subtitle="Manage schedules for the selected project."
          >
            <ScheduleListTable
              rows={schedules}
              editingScheduleId={editingScheduleId}
              editScheduleForm={editScheduleForm}
              savingScheduleEdit={savingScheduleEdit}
              deletingScheduleId={deletingScheduleId}
              onStartScheduleEdit={handleStartScheduleEdit}
              onChangeScheduleEdit={handleChangeScheduleEdit}
              onSaveScheduleEdit={handleSaveScheduleEdit}
              onCancelScheduleEdit={handleCancelScheduleEdit}
              onDeleteSchedule={handleDeleteSchedule}
              onQuickAction={handleScheduleQuickAction}
            />

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddScheduleOpen(true)}
                className="rounded-2xl border border-[#6F4A36] bg-[linear-gradient(180deg,#A66C44_0%,#8B5E3C_100%)] px-6 py-3 text-sm font-bold text-white shadow-[0_7px_0_#5B3421] transition hover:translate-y-[1px] hover:shadow-[0_6px_0_#5B3421]"
              >
                Add Schedule
              </button>
            </div>
          </SectionCard>
        ) : null}

        <AddProjectModal
          open={isAddProjectOpen}
          onClose={handleCloseProjectModal}
          onSave={handleSaveProject}
          mode={editingProject ? "edit" : "create"}
          initialForm={
            editingProject
              ? {
                  project_name: editingProject.project_name || "",
                  project_code: editingProject.project_code || "",
                  client_name: editingProject.client_name || "",
                  location: editingProject.location || "",
                  start_date: editingProject.start_date || "",
                  end_date: editingProject.end_date || "",
                  remarks: editingProject.remarks || "",
                  status: toBackendProjectStatus(editingProject.status),
                }
              : null
          }
        />

        <AddScheduleModal
          open={isAddScheduleOpen}
          onClose={() => setIsAddScheduleOpen(false)}
          onSave={handleCreateSchedule}
          projectName={selectedProject?.project_name}
        />
      </div>
    </div>
  );
}
