import { formatProjectStatus, ProjectRow } from "@/app/services/projectControlService";

type Props = {
  rows: ProjectRow[];
  projectImageMap?: Record<number, string>;
  selectedProjectId: number | null;
  onDisplaySchedules: (project: ProjectRow) => void;
  onDelete: (project: ProjectRow) => void;
  deletingProjectId: number | null;
  onStartEdit: (project: ProjectRow) => void;
};

export default function ProjectListTable({
  rows,
  projectImageMap = {},
  selectedProjectId,
  onDisplaySchedules,
  onDelete,
  deletingProjectId,
  onStartEdit,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#D7BDA9] bg-[#FFF9F4] shadow-[0_8px_24px_rgba(91,52,33,0.08)]">
      <table className="min-w-full">
        <thead className="bg-[linear-gradient(180deg,#E7D0BE_0%,#E2C5B0_100%)] text-left">
          <tr>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Project Name</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Project Code</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Client Name</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Location</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Status</th>
            <th className="px-4 py-3 text-sm font-bold text-[#5B3421]">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-[#7A5C4D]">
                No projects found.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const isSelected = selectedProjectId === row.id;

              return (
                <tr
                  key={row.id}
                  className={`border-t border-[#E9D9CC] ${isSelected ? "bg-[#F8EBDD]" : "bg-[#FFF9F4]"}`}
                >
                  <td className="px-4 py-3 text-sm text-[#5B3421]">
                    <div className="flex items-center gap-2">
                      {projectImageMap[row.id] ? (
                        <img
                          src={projectImageMap[row.id]}
                          alt={row.project_name}
                          className="h-7 w-7 rounded-md border border-[#D8C2B5] object-cover"
                        />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#D8C2B5] bg-[#F6E8DC] text-[10px] font-bold text-[#7A5C4D]">
                          {String(row.project_name || "P").trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="font-medium">{row.project_name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-[#5B3421]">
                    {row.project_code}
                  </td>

                  <td className="px-4 py-3 text-sm text-[#5B3421]">
                    {row.client_name || "-"}
                  </td>

                  <td className="px-4 py-3 text-sm text-[#5B3421]">
                    {row.location || "-"}
                  </td>

                  <td className="px-4 py-3 text-sm text-[#5B3421]">
                    {formatProjectStatus(row.status)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        disabled={deletingProjectId === row.id}
                        className="rounded-xl border border-[#D8B7A6] bg-[#F6E8DC] px-3 py-2 text-xs font-semibold text-[#8A3C2A] shadow-[0_4px_0_#D8B7A6] disabled:opacity-50"
                      >
                        {deletingProjectId === row.id ? "Deleting..." : "Delete"}
                      </button>

                      <button
                        type="button"
                        onClick={() => onStartEdit(row)}
                        className="rounded-xl border border-[#B58C72] bg-[#E7D0BE] px-3 py-2 text-xs font-semibold text-[#5B3421] shadow-[0_4px_0_#C5A48D]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onDisplaySchedules(row)}
                        className="rounded-xl border border-[#6F4A36] bg-[#8B5E3C] px-3 py-2 text-xs font-semibold text-white shadow-[0_4px_0_#5B3421]"
                      >
                        Manage Schedule
                      </button>
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
