import {
  formatScheduleStatus,
  ScheduleRow,
} from "@/app/services/projectControlService";

type EditableSchedule = {
  schedule_name: string;
  start_date: string;
  end_date: string;
  status: string;
  is_billable: boolean;
  remarks: string;
};

type Props = {
  rows: ScheduleRow[];
  editingScheduleId: number | null;
  editScheduleForm: EditableSchedule | null;
  savingScheduleEdit: boolean;
  deletingScheduleId: number | null;
  onStartScheduleEdit: (row: ScheduleRow) => void;
  onChangeScheduleEdit: (field: keyof EditableSchedule, value: string | boolean) => void;
  onSaveScheduleEdit: (scheduleId: number) => void;
  onCancelScheduleEdit: () => void;
  onDeleteSchedule: (row: ScheduleRow) => void;
  onQuickAction: (
    row: ScheduleRow,
    action: "activate" | "pause" | "complete" | "stop" | "toggle_billable"
  ) => void;
};

function QuickActionButton({
  label,
  disabled = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-[#CDB4A5] bg-[#F7EEE8] px-2.5 py-1.5 text-xs font-semibold text-[#6D4C3D] shadow-sm disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export default function ScheduleListTable({
  rows,
  editingScheduleId,
  editScheduleForm,
  savingScheduleEdit,
  deletingScheduleId,
  onStartScheduleEdit,
  onChangeScheduleEdit,
  onSaveScheduleEdit,
  onCancelScheduleEdit,
  onDeleteSchedule,
  onQuickAction,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#D7BDA9] bg-[#FFF9F4] shadow-[0_8px_24px_rgba(91,52,33,0.08)]">
      <table className="min-w-full">
        <thead className="bg-[linear-gradient(180deg,#E7D0BE_0%,#E2C5B0_100%)] text-left">
          <tr>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Schedule Name</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Structure / Block</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Start Date</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">End Date</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Status</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Billable</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Remarks</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Action</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Quick Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-6 text-center text-sm text-[#7A5C4D]">
                No schedules found.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const isEditing = editingScheduleId === row.id;
              const normalizedStatus = String(row.status || "").toUpperCase();
              const lockedReason = String(row.locked_reason || "").toUpperCase();
              const quickDisabled =
                (row.is_locked && lockedReason !== "PAUSED") || isEditing;

              return (
                <tr key={row.id} className="border-t border-[#E9D9CC] bg-[#FFF9F4]">
                  <td className="px-4 py-3 text-sm text-[#5B3421]">
                    {isEditing ? (
                      <input
                        value={editScheduleForm?.schedule_name || ""}
                        onChange={(e) => onChangeScheduleEdit("schedule_name", e.target.value)}
                        className="w-full rounded-lg border border-[#D8C2B5] bg-white px-2 py-1.5"
                      />
                    ) : (
                      row.schedule_name
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm text-[#5B3421]">{row.structure_name || "-"}</td>

                  <td className="px-4 py-3 text-sm text-[#5B3421]">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editScheduleForm?.start_date || ""}
                        onChange={(e) => onChangeScheduleEdit("start_date", e.target.value)}
                        className="w-full rounded-lg border border-[#D8C2B5] bg-white px-2 py-1.5"
                      />
                    ) : (
                      row.start_date || "-"
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm text-[#5B3421]">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editScheduleForm?.end_date || ""}
                        onChange={(e) => onChangeScheduleEdit("end_date", e.target.value)}
                        className="w-full rounded-lg border border-[#D8C2B5] bg-white px-2 py-1.5"
                      />
                    ) : (
                      row.end_date || "-"
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm text-[#5B3421]">
                    {isEditing ? (
                      <select
                        value={editScheduleForm?.status || "Active"}
                        onChange={(e) => onChangeScheduleEdit("status", e.target.value)}
                        className="w-full rounded-lg border border-[#D8C2B5] bg-white px-2 py-1.5"
                      >
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Completed">Completed</option>
                        <option value="Stopped">Stopped</option>
                      </select>
                    ) : (
                      formatScheduleStatus(row.status)
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm text-[#5B3421]">
                    {isEditing ? (
                      <select
                        value={editScheduleForm?.is_billable ? "yes" : "no"}
                        onChange={(e) => onChangeScheduleEdit("is_billable", e.target.value === "yes")}
                        className="w-full rounded-lg border border-[#D8C2B5] bg-white px-2 py-1.5"
                      >
                        <option value="yes">Billable</option>
                        <option value="no">Non-Billable</option>
                      </select>
                    ) : (
                      row.billable_label
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm text-[#5B3421]">
                    {isEditing ? (
                      <input
                        value={editScheduleForm?.remarks || ""}
                        onChange={(e) => onChangeScheduleEdit("remarks", e.target.value)}
                        className="w-full rounded-lg border border-[#D8C2B5] bg-white px-2 py-1.5"
                      />
                    ) : (
                      row.remarks || "-"
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onSaveScheduleEdit(row.id)}
                            disabled={savingScheduleEdit}
                            className="rounded-xl border border-[#6F4A36] bg-[#8B5E3C] px-3 py-2 text-xs font-semibold text-white shadow-[0_4px_0_#5B3421] disabled:opacity-60"
                          >
                            {savingScheduleEdit ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={onCancelScheduleEdit}
                            className="rounded-xl border border-[#D8B7A6] bg-white px-3 py-2 text-xs font-semibold text-[#7A5C4D]"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onStartScheduleEdit(row)}
                            className="rounded-xl border border-[#B58C72] bg-[#E7D0BE] px-3 py-2 text-xs font-semibold text-[#5B3421] shadow-[0_4px_0_#C5A48D]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSchedule(row)}
                            disabled={deletingScheduleId === row.id}
                            className="rounded-xl border border-[#D8B7A6] bg-[#F6E8DC] px-3 py-2 text-xs font-semibold text-[#8A3C2A] shadow-[0_4px_0_#D8B7A6] disabled:opacity-50"
                          >
                            {deletingScheduleId === row.id ? "Deleting..." : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <QuickActionButton
                        label="Activate"
                        disabled={quickDisabled || normalizedStatus === "ACTIVE"}
                        onClick={() => onQuickAction(row, "activate")}
                      />
                      <QuickActionButton
                        label="Pause"
                        disabled={quickDisabled || normalizedStatus === "PAUSED"}
                        onClick={() => onQuickAction(row, "pause")}
                      />
                      <QuickActionButton
                        label="Complete"
                        disabled={quickDisabled || normalizedStatus === "COMPLETED"}
                        onClick={() => onQuickAction(row, "complete")}
                      />
                      <QuickActionButton
                        label="Stop"
                        disabled={quickDisabled || normalizedStatus === "STOPPED"}
                        onClick={() => onQuickAction(row, "stop")}
                      />
                      <QuickActionButton
                        label={row.is_billable ? "Make Non-Billable" : "Make Billable"}
                        disabled={quickDisabled}
                        onClick={() => onQuickAction(row, "toggle_billable")}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
