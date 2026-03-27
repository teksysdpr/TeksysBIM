"use client";

import { useEffect, useState } from "react";
import { ProjectPayload } from "@/app/services/projectControlService";

export type ProjectCreateFormPayload = ProjectPayload;

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: ProjectCreateFormPayload) => Promise<void>;
  mode?: "create" | "edit";
  initialForm?: Partial<ProjectPayload> | null;
};

const INITIAL_FORM_STATE: ProjectPayload = {
  project_name: "",
  project_code: "",
  client_name: "",
  location: "",
  start_date: "",
  end_date: "",
  remarks: "",
  status: "Active",
};

function buildFormState(seed?: Partial<ProjectPayload> | null): ProjectPayload {
  return {
    ...INITIAL_FORM_STATE,
    ...(seed || {}),
    project_name: String(seed?.project_name || "").trim(),
    project_code: String(seed?.project_code || "").trim(),
    client_name: seed?.client_name || "",
    location: seed?.location || "",
    start_date: seed?.start_date || "",
    end_date: seed?.end_date || "",
    remarks: seed?.remarks || "",
    status: seed?.status || "Active",
  };
}

export default function AddProjectModal({
  open,
  onClose,
  onSave,
  mode = "create",
  initialForm = null,
}: Props) {
  const [form, setForm] = useState<ProjectPayload>(buildFormState(initialForm));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(buildFormState(initialForm));
  }, [open, initialForm]);

  if (!open) return null;

  function updateField<K extends keyof ProjectPayload>(key: K, value: ProjectPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.project_name.trim()) {
      alert("Project Name is required.");
      return;
    }

    if (!form.project_code.trim()) {
      alert("Project Code is required.");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        ...form,
        client_name: form.client_name || null,
        location: form.location || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        remarks: form.remarks || null,
      });
      setForm(INITIAL_FORM_STATE);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#5B3421]">
            {mode === "edit" ? "Edit Project" : "Create Project"}
          </h2>
          <p className="mt-1 text-sm text-[#7A5C4D]">
            {mode === "edit" ? "Update project details." : "Add a new project record."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#5B3421]">Project Name</label>
              <input
                value={form.project_name}
                onChange={(e) => updateField("project_name", e.target.value)}
                className="w-full rounded-xl border border-[#D8C2B5] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#5B3421]">Project Code</label>
              <input
                value={form.project_code}
                onChange={(e) => updateField("project_code", e.target.value)}
                className="w-full rounded-xl border border-[#D8C2B5] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#5B3421]">Client Name</label>
              <input
                value={form.client_name || ""}
                onChange={(e) => updateField("client_name", e.target.value)}
                className="w-full rounded-xl border border-[#D8C2B5] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#5B3421]">Location</label>
              <input
                value={form.location || ""}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full rounded-xl border border-[#D8C2B5] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#5B3421]">Start Date</label>
              <input
                type="date"
                value={form.start_date || ""}
                onChange={(e) => updateField("start_date", e.target.value)}
                className="w-full rounded-xl border border-[#D8C2B5] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#5B3421]">End Date</label>
              <input
                type="date"
                value={form.end_date || ""}
                onChange={(e) => updateField("end_date", e.target.value)}
                className="w-full rounded-xl border border-[#D8C2B5] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#5B3421]">Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full rounded-xl border border-[#D8C2B5] px-3 py-2 text-sm outline-none"
              >
                <option value="Active">Active</option>
                <option value="On-Hold">On-Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#5B3421]">Remarks</label>
              <textarea
                value={form.remarks || ""}
                onChange={(e) => updateField("remarks", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#D8C2B5] px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D8B7A6] bg-white px-4 py-2 text-sm font-semibold text-[#7A5C4D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl border border-[#B58C72] bg-[#E7D0BE] px-4 py-2 text-sm font-semibold text-[#5B3421] shadow-[0_4px_0_#C5A48D] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
