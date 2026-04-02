"use client";

import { useState } from "react";
import { SchedulePayload } from "@/app/services/projectControlService";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: SchedulePayload) => Promise<void>;
  projectName?: string;
};

const initialForm: SchedulePayload = {
  schedule_name: "",
  start_date: "",
  end_date: "",
  status: "Active",
  is_billable: true,
  remarks: "",
};

export default function AddScheduleModal({ open, onClose, onSave, projectName }: Props) {
  const [form, setForm] = useState<SchedulePayload>(initialForm);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  function updateField<K extends keyof SchedulePayload>(key: K, value: SchedulePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.schedule_name.trim()) {
      alert("Schedule Name is required.");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        remarks: form.remarks || null,
      });
      setForm(initialForm);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-[#3f2d1a] bg-[#1a0f06] p-6 shadow-2xl">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#fff3de]">Add Schedule</h2>
          <p className="mt-1 text-sm text-[#d0b894]">
            {projectName ? `Create a schedule for ${projectName}.` : "Create a new schedule."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#d0b894]">Schedule Name</label>
              <input
                value={form.schedule_name}
                onChange={(e) => updateField("schedule_name", e.target.value)}
                className="w-full rounded-xl border border-[#3f2d1a] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#d0b894]">Start Date</label>
              <input
                type="date"
                value={form.start_date || ""}
                onChange={(e) => updateField("start_date", e.target.value)}
                className="w-full rounded-xl border border-[#3f2d1a] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#d0b894]">End Date</label>
              <input
                type="date"
                value={form.end_date || ""}
                onChange={(e) => updateField("end_date", e.target.value)}
                className="w-full rounded-xl border border-[#3f2d1a] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#d0b894]">Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full rounded-xl border border-[#3f2d1a] px-3 py-2 text-sm outline-none"
              >
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
                <option value="Stopped">Stopped</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#d0b894]">Billable</label>
              <select
                value={form.is_billable ? "yes" : "no"}
                onChange={(e) => updateField("is_billable", e.target.value === "yes")}
                className="w-full rounded-xl border border-[#3f2d1a] px-3 py-2 text-sm outline-none"
              >
                <option value="yes">Billable</option>
                <option value="no">Non-Billable</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#d0b894]">Remarks</label>
              <textarea
                value={form.remarks || ""}
                onChange={(e) => updateField("remarks", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#3f2d1a] px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#3f2d1a] bg-transparent px-4 py-2 text-sm font-semibold text-[#d0b894] hover:bg-[#1a120b]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl border border-[#6b3e14] bg-[#d4933c] px-4 py-2 text-sm font-semibold text-[#1a0f06] hover:bg-[#c08030] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
