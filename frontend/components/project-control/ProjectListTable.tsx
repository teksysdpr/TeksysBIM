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
    <div className="overflow-x-auto rounded-2xl border border-[#3f2d1a] bg-[#0f0905] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <table className="min-w-full">
        <thead className="bg-[#1a0f06] text-left">
          <tr>
            <th className="px-4 py-3 text-sm font-semibold text-[#8a6e4e]">Project Name</th>
            <th className="px-4 py-3 text-sm font-semibold text-[#8a6e4e]">Project Code</th>
            <th className="px-4 py-3 text-sm font-semibold text-[#8a6e4e]">Client Name</th>
            <th className="px-4 py-3 text-sm font-semibold text-[#8a6e4e]">Location</th>
            <th className="px-4 py-3 text-sm font-semibold text-[#8a6e4e]">Status</th>
            <th className="px-4 py-3 text-sm font-semibold text-[#8a6e4e]">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-[#8a6e4e]">
                No projects found.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const isSelected = selectedProjectId === row.id;

              return (
                <tr
                  key={row.id}
                  className={`border-t border-[#2b1e12] ${isSelected ? "bg-[#160f08]" : "bg-[#110e0a]"}`}
                >
                  <td className="px-4 py-3 text-sm text-[#f0e6d4]">
                    <div className="flex items-center gap-2">
                      {projectImageMap[row.id] ? (
                        <img
                          src={projectImageMap[row.id]}
                          alt={row.project_name}
                          className="h-7 w-7 rounded-md border border-[#2b1e12] object-cover"
                        />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#2b1e12] bg-[#1a0f06] text-[10px] font-bold text-[#8a6e4e]">
                          {String(row.project_name || "P").trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="font-medium">{row.project_name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-[#f0e6d4]">
                    {row.project_code}
                  </td>

                  <td className="px-4 py-3 text-sm text-[#f0e6d4]">
                    {row.client_name || "-"}
                  </td>

                  <td className="px-4 py-3 text-sm text-[#f0e6d4]">
                    {row.location || "-"}
                  </td>

                  <td className="px-4 py-3 text-sm text-[#f0e6d4]">
                    {formatProjectStatus(row.status)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        disabled={deletingProjectId === row.id}
                        className="rounded-xl border border-red-900/60 bg-red-950/25 px-3 py-2 text-xs font-semibold text-[#f87171] disabled:opacity-50"
                      >
                        {deletingProjectId === row.id ? "Deleting..." : "Delete"}
                      </button>

                      <button
                        type="button"
                        onClick={() => onStartEdit(row)}
                        className="rounded-xl border border-[#3f2d1a] bg-[#1a120b] px-3 py-2 text-xs font-semibold text-[#f0c27e] hover:bg-[#25180d]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onDisplaySchedules(row)}
                        className="rounded-xl border border-[#6b3e14] bg-[#d4933c] px-3 py-2 text-xs font-semibold text-[#1a0f06] hover:bg-[#c08030]"
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
