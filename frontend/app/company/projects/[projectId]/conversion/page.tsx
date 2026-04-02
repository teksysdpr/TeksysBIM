"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Clock,
  FileText,
  Filter,
  Loader2,
  Paperclip,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
  ArrowRight,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Eye,
  ClipboardList,
} from "lucide-react";
import {
  fetchConversionJobs,
  createConversionJob,
  updateConversionStage,
  deleteConversionJob,
  uploadDrawingFile,
  attachFilesToJob,
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_STYLES,
  TERMINAL_STAGES,
  ACTIVE_STAGES,
  NEEDS_REVIEW_STAGES,
  formatConversionDate,
  formatFileSize,
  isOverdue,
  type ConversionJob,
  type ConversionStage,
  type UploadedDrawing,
} from "@/app/services/conversionService";
import {
  BimPageHeader,
  BimPanel,
  BimButton,
  bimBtnClass,
  BimStateBox,
  BimStatCard,
} from "@/app/components/company/ui";

// ── Sub-types ─────────────────────────────────────────────────────────────────

interface PendingFile {
  uid: string;
  file: File;
  status: "queued" | "uploading" | "done" | "error";
  progress: number;
  result?: UploadedDrawing;
  error?: string;
}

type StageFilter = "ALL" | ConversionStage;

const SUPPORTED_EXTENSIONS = [".dwg", ".pdf", ".ifc", ".rvt", ".dxf", ".nwc"];

// ── Stage badge ───────────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: ConversionStage }) {
  const s = STAGE_STYLES[stage] ?? STAGE_STYLES.UPLOADED;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        s.text, s.bg, s.border,
      ].join(" ")}
    >
      <span className={`h-1.5 w-1.5 flex-none rounded-full ${s.dot}`} />
      {STAGE_LABELS[stage]}
    </span>
  );
}

// ── Stage select dropdown ─────────────────────────────────────────────────────

interface StageSelectProps {
  current: ConversionStage;
  jobId: string;
  onChanged: (job: ConversionJob) => void;
}

function StageSelect({ current, jobId, onChanged }: StageSelectProps) {
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ConversionStage;
    if (next === current) return;
    setBusy(true);
    try {
      const updated = await updateConversionStage(jobId, next);
      onChanged(updated);
    } catch {
      // silently ignore — keep current
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex items-center">
      {busy && <Loader2 className="absolute right-6 h-3 w-3 animate-spin text-[#d4933c]" />}
      <select
        value={current}
        onChange={handleChange}
        disabled={busy}
        className="appearance-none rounded-lg border border-[#2b1e12] bg-[#150f09] py-1.5 pl-2.5 pr-6 text-[11px] font-bold text-[#d4933c] transition focus:border-[#6b3e14] focus:outline-none disabled:opacity-50 cursor-pointer"
      >
        {STAGE_ORDER.map((s) => (
          <option key={s} value={s}>{STAGE_LABELS[s]}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-[#6b4820]" />
    </div>
  );
}

// ── File row in upload panel ──────────────────────────────────────────────────

function PendingFileRow({
  pf,
  onRemove,
}: {
  pf: PendingFile;
  onRemove: (uid: string) => void;
}) {
  const ext = pf.file.name.split(".").pop()?.toLowerCase() ?? "";
  const iconColor =
    ext === "dwg" || ext === "dxf"
      ? "text-[#60a5fa]"
      : ext === "pdf"
      ? "text-[#f87171]"
      : ext === "ifc"
      ? "text-[#34d399]"
      : "text-[#9a7d5e]";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#2b1e12] bg-[#0e0b07] px-3 py-2.5">
      <FileText className={`h-4 w-4 flex-none ${iconColor}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-[#e8d5b8]">{pf.file.name}</p>
        <p className="mt-0.5 text-[10px] text-[#6b4820]">{formatFileSize(pf.file.size)}</p>
        {pf.status === "uploading" && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#2b1e12]">
            <div
              className="h-full rounded-full bg-[#d4933c] transition-all duration-200"
              style={{ width: `${pf.progress}%` }}
            />
          </div>
        )}
        {pf.status === "error" && (
          <p className="mt-0.5 text-[10px] text-[#f87171]">{pf.error}</p>
        )}
      </div>
      <div className="flex-none">
        {pf.status === "queued" && (
          <span className="text-[10px] font-bold text-[#6b4820]">Queued</span>
        )}
        {pf.status === "uploading" && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#d4933c]" />
        )}
        {pf.status === "done" && (
          <CheckCircle2 className="h-3.5 w-3.5 text-[#34d399]" />
        )}
        {pf.status === "error" && (
          <button onClick={() => onRemove(pf.uid)}>
            <X className="h-3.5 w-3.5 text-[#f87171]" />
          </button>
        )}
        {(pf.status === "queued" || pf.status === "done") && (
          <button
            onClick={() => onRemove(pf.uid)}
            className="ml-2 text-[#4a3020] transition hover:text-[#f87171]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Job card ──────────────────────────────────────────────────────────────────

interface JobCardProps {
  job: ConversionJob;
  onStageChanged: (job: ConversionJob) => void;
  onDelete: (id: string) => void;
}

function JobCard({ job, onStageChanged, onDelete }: JobCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const overdue = isOverdue(job.dueDate) && !TERMINAL_STAGES.includes(job.stage);
  const isActive = ACTIVE_STAGES.includes(job.stage);
  const needsReview = NEEDS_REVIEW_STAGES.includes(job.stage);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteConversionJob(job.id);
      onDelete(job.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="group relative rounded-2xl border border-[#2b1e12] bg-[#0e0b07] p-5 transition hover:border-[#4a2e10]">
      {/* Alert strip */}
      {(overdue || needsReview) && (
        <div
          className={[
            "mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold",
            overdue
              ? "border-[#7f1d1d]/50 bg-[#f87171]/5 text-[#f87171]"
              : "border-[#78350f]/50 bg-[#fbbf24]/5 text-[#fbbf24]",
          ].join(" ")}
        >
          <AlertTriangle className="h-3.5 w-3.5 flex-none" />
          {overdue ? "Overdue" : "Needs Review"}
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StageBadge stage={job.stage} />
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#064e3b]/60 bg-[#064e3b]/20 px-2 py-0.5 text-[10px] font-bold text-[#34d399]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#34d399]" />
                Active
              </span>
            )}
          </div>
          <h3 className="mt-2 text-sm font-black text-[#f0e6d4]">{job.title}</h3>
          {job.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7a5e3e]">{job.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Review workspace link */}
          {!confirmDelete && (
            <Link
              href={`/company/projects/${job.projectId}/conversion/${job.id}`}
              className={bimBtnClass("secondary", "sm")}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Review
            </Link>
          )}
          {!TERMINAL_STAGES.includes(job.stage) && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-transparent p-1.5 text-[#4a3020] transition hover:border-[#7f1d1d]/50 hover:text-[#f87171]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#f87171]">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-[#7f1d1d]/60 bg-[#f87171]/10 px-2 py-1 text-[10px] font-bold text-[#f87171] transition hover:bg-[#f87171]/20 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-[#2b1e12] px-2 py-1 text-[10px] font-bold text-[#6b4820] transition hover:text-[#9a7d5e]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#1e1610] pt-3">
        {/* Files */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#6b4820]">
          <Paperclip className="h-3.5 w-3.5" />
          <span>
            {(job.fileIds?.length ?? 0) === 0
              ? "No files"
              : `${job.fileIds?.length} file${(job.fileIds?.length ?? 0) > 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Due */}
        <div className={["flex items-center gap-1.5 text-[11px]", overdue ? "text-[#f87171]" : "text-[#6b4820]"].join(" ")}>
          <Clock className="h-3.5 w-3.5" />
          <span>Due {formatConversionDate(job.dueDate)}</span>
        </div>

        {/* Assignee */}
        {job.assignee && job.assignee !== "Unassigned" && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#6b4820]">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2b1e12] text-[8px] font-black text-[#9a7d5e]">
              {job.assignee.charAt(0).toUpperCase()}
            </div>
            <span className="truncate max-w-[120px]">{job.assignee}</span>
          </div>
        )}

        {/* Review flag */}
        {job.reviewRequired && (
          <div className="flex items-center gap-1 text-[11px] text-[#fbbf24]">
            <Eye className="h-3.5 w-3.5" />
            <span>Review required</span>
          </div>
        )}

        {/* Stage changer — pushed right */}
        <div className="ml-auto">
          <StageSelect
            current={job.stage}
            jobId={job.id}
            onChanged={onStageChanged}
          />
        </div>
      </div>
    </div>
  );
}

// ── Stage filter tab bar ──────────────────────────────────────────────────────

const FILTER_TABS: Array<{ label: string; value: StageFilter }> = [
  { label: "All",             value: "ALL" },
  { label: "Uploaded",        value: "UPLOADED" },
  { label: "Under Review",    value: "UNDER_REVIEW" },
  { label: "In Conversion",   value: "IN_CONVERSION" },
  { label: "QA / Clash",      value: "QA_CHECK" },
  { label: "Delivered",       value: "DELIVERED" },
  { label: "Closed",          value: "CLOSED" },
];

function StageFilterBar({
  active,
  onChange,
  counts,
}: {
  active: StageFilter;
  onChange: (v: StageFilter) => void;
  counts: Partial<Record<StageFilter, number>>;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
      <Filter className="h-3.5 w-3.5 flex-none text-[#5a3e22]" />
      {FILTER_TABS.map((tab) => {
        const isActive = active === tab.value;
        const count = counts[tab.value];
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={[
              "flex flex-none items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition whitespace-nowrap",
              isActive
                ? "border-[#d4933c]/50 bg-[#d4933c]/10 text-[#d4933c]"
                : "border-transparent text-[#6b4820] hover:border-[#2b1e12] hover:text-[#9a7d5e]",
            ].join(" ")}
          >
            {tab.label}
            {count !== undefined && count > 0 && (
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[9px] font-black",
                  isActive ? "bg-[#d4933c]/20 text-[#d4933c]" : "bg-[#2b1e12] text-[#7a5e3e]",
                ].join(" ")}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── New Job Panel ─────────────────────────────────────────────────────────────

interface NewJobPanelProps {
  projectId: string;
  onCreated: (job: ConversionJob) => void;
  onClose: () => void;
}

function NewJobPanel({ projectId, onCreated, onClose }: NewJobPanelProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── File handling ──────────────────────────────────────────────────────────

  function addFiles(rawFiles: File[]) {
    const allowed = rawFiles.filter((f) => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });
    const entries: PendingFile[] = allowed.map((f) => ({
      uid: `${Date.now()}-${Math.random()}`,
      file: f,
      status: "queued",
      progress: 0,
    }));
    setPendingFiles((prev) => [...prev, ...entries]);
    // Start uploading immediately
    entries.forEach((entry) => startUpload(entry));
  }

  function startUpload(entry: PendingFile) {
    setPendingFiles((prev) =>
      prev.map((p) => (p.uid === entry.uid ? { ...p, status: "uploading" } : p))
    );
    uploadDrawingFile(entry.file, projectId, (pct) => {
      setPendingFiles((prev) =>
        prev.map((p) => (p.uid === entry.uid ? { ...p, progress: pct } : p))
      );
    })
      .then((result) => {
        setPendingFiles((prev) =>
          prev.map((p) =>
            p.uid === entry.uid ? { ...p, status: "done", progress: 100, result } : p
          )
        );
      })
      .catch((err: Error) => {
        setPendingFiles((prev) =>
          prev.map((p) =>
            p.uid === entry.uid ? { ...p, status: "error", error: err.message } : p
          )
        );
      });
  }

  function removePendingFile(uid: string) {
    setPendingFiles((prev) => prev.filter((p) => p.uid !== uid));
  }

  // ── Drag-drop ──────────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!dropRef.current?.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, [projectId]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const anyUploading = pendingFiles.some((p) => p.status === "uploading" || p.status === "queued");
    if (anyUploading) {
      setSubmitError("Wait for all files to finish uploading.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const doneFileIds = pendingFiles
        .filter((p) => p.status === "done" && p.result)
        .map((p) => p.result!.id);

      const job = await createConversionJob({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        fileIds: doneFileIds,
      });

      onCreated(job);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  const doneCount = pendingFiles.filter((p) => p.status === "done").length;
  const uploadingCount = pendingFiles.filter((p) => p.status === "uploading" || p.status === "queued").length;
  const canSubmit = title.trim().length >= 3 && uploadingCount === 0;

  return (
    <BimPanel noPad className="shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-[#2b1e12] px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4933c]/10 border border-[#d4933c]/20">
            <Plus className="h-3.5 w-3.5 text-[#d4933c]" />
          </div>
          <span className="text-sm font-black text-[#f0e6d4]">New Conversion Job</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-[#5a3e22] transition hover:text-[#9a7d5e]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Title + Due Date row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#5a3e22]">
              Job Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tower-A Architectural CAD2BIM"
              className="w-full rounded-xl border border-[#2b1e12] bg-[#150f09] px-3.5 py-2.5 text-sm text-[#f0e6d4] placeholder-[#4a3020] transition focus:border-[#6b3e14] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#5a3e22]">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-[#2b1e12] bg-[#150f09] px-3.5 py-2.5 text-sm text-[#f0e6d4] transition focus:border-[#6b3e14] focus:outline-none [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#5a3e22]">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Scope of work, drawing reference, special instructions…"
            className="w-full resize-none rounded-xl border border-[#2b1e12] bg-[#150f09] px-3.5 py-2.5 text-sm text-[#f0e6d4] placeholder-[#4a3020] transition focus:border-[#6b3e14] focus:outline-none"
          />
        </div>

        {/* Drop zone */}
        <div>
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#5a3e22]">
            Upload Source Drawings
          </label>
          <div
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-5 py-8 text-center transition cursor-pointer",
              dragOver
                ? "border-[#d4933c] bg-[#d4933c]/5"
                : "border-[#2b1e12] bg-[#0a0806] hover:border-[#4a2e10]",
            ].join(" ")}
          >
            <div className={["flex h-10 w-10 items-center justify-center rounded-xl border", dragOver ? "border-[#d4933c]/40 bg-[#d4933c]/10" : "border-[#2b1e12] bg-[#150f09]"].join(" ")}>
              <FileUp className={["h-5 w-5", dragOver ? "text-[#d4933c]" : "text-[#5a3e22]"].join(" ")} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#9a7d5e]">
                {dragOver ? "Drop files here" : "Drag & drop files or click to browse"}
              </p>
              <p className="mt-1 text-[11px] text-[#4a3020]">
                Supported: {SUPPORTED_EXTENSIONS.join(", ")} · Max 100 MB per file
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={SUPPORTED_EXTENSIONS.join(",")}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
        </div>

        {/* Pending file list */}
        {pendingFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#5a3e22]">
              {doneCount} / {pendingFiles.length} uploaded
              {uploadingCount > 0 && ` · ${uploadingCount} uploading…`}
            </p>
            {pendingFiles.map((pf) => (
              <PendingFileRow key={pf.uid} pf={pf} onRemove={removePendingFile} />
            ))}
          </div>
        )}

        {/* Error */}
        {submitError && (
          <BimStateBox type="error" message={submitError} />
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#1e1610] pt-4">
          <BimButton
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
          >
            Cancel
          </BimButton>
          <BimButton
            type="submit"
            variant="primary"
            size="md"
            icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Creating…" : "Create Job"}
          </BimButton>
        </div>
      </form>
    </BimPanel>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  filter,
  onNew,
}: {
  filter: StageFilter;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2b1e12] bg-[#110e0a]">
        <Layers className="h-8 w-8 text-[#3a2510]" />
      </div>
      <h3 className="mt-5 text-base font-black text-[#7a5e3e]">
        {filter === "ALL" ? "No conversion jobs yet" : `No jobs in "${STAGE_LABELS[filter as ConversionStage]}" stage`}
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-[#4a3020]">
        {filter === "ALL"
          ? "Upload CAD/PDF drawings and create a conversion job to get started."
          : "Try a different filter or create a new job."}
      </p>
      {filter === "ALL" && (
        <BimButton
          variant="primary"
          size="md"
          icon={<Plus className="h-4 w-4" />}
          onClick={onNew}
          className="mt-6"
        >
          New Conversion Job
        </BimButton>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ConversionWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StageFilter>("ALL");
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetchConversionJobs(projectId)
      .then(setJobs)
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredJobs =
    filter === "ALL" ? jobs : jobs.filter((j) => j.stage === filter);

  const counts: Partial<Record<StageFilter, number>> = { ALL: jobs.length };
  for (const j of jobs) {
    counts[j.stage] = (counts[j.stage] ?? 0) + 1;
  }

  const activeCount = jobs.filter((j) => ACTIVE_STAGES.includes(j.stage)).length;
  const deliveredCount = jobs.filter((j) => j.stage === "DELIVERED").length;
  const needsAttentionCount = jobs.filter(
    (j) => NEEDS_REVIEW_STAGES.includes(j.stage) || isOverdue(j.dueDate) && !TERMINAL_STAGES.includes(j.stage)
  ).length;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleJobCreated(job: ConversionJob) {
    setJobs((prev) => [job, ...prev]);
    setIsCreating(false);
  }

  function handleStageChanged(updated: ConversionJob) {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  }

  function handleDelete(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <BimPageHeader
        eyebrow="Project Workspace"
        title="CAD / PDF → BIM Conversion"
        subtitle="Upload drawings, register conversion jobs, and track progress through each stage."
        action={
          <div className="flex items-center gap-2">
            <BimButton
              variant="secondary"
              size="sm"
              icon={<RefreshCw className={["h-3.5 w-3.5", loading ? "animate-spin" : ""].join(" ")} />}
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
            >
              Refresh
            </BimButton>
            <BimButton
              variant={isCreating ? "ghost" : "primary"}
              size="sm"
              icon={isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              onClick={() => setIsCreating((v) => !v)}
            >
              {isCreating ? "Cancel" : "New Job"}
            </BimButton>
          </div>
        }
      />

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      {!loading && jobs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <BimStatCard label="Total Jobs"      value={jobs.length}        color="gold"  />
          <BimStatCard label="Active"          value={activeCount}         color="green" />
          <BimStatCard label="Delivered"       value={deliveredCount}      color="blue"  />
          <BimStatCard label="Needs Attention" value={needsAttentionCount} color="red"   />
        </div>
      )}

      {/* ── New job form ───────────────────────────────────────────────────── */}
      {isCreating && (
        <NewJobPanel
          projectId={projectId}
          onCreated={handleJobCreated}
          onClose={() => setIsCreating(false)}
        />
      )}

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      {jobs.length > 0 && (
        <StageFilterBar active={filter} onChange={setFilter} counts={counts} />
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {loading ? (
        <BimStateBox type="loading" message="Loading conversion jobs…" />
      ) : loadError ? (
        <BimStateBox
          type="error"
          message={loadError}
          onRetry={() => setRefreshKey((k) => k + 1)}
        />
      ) : filteredJobs.length === 0 ? (
        <EmptyState filter={filter} onNew={() => setIsCreating(true)} />
      ) : (
        <div className="grid gap-4">
          {/* Stage section headers when filtering ALL */}
          {filter === "ALL"
            ? (() => {
                // Group by stage in STAGE_ORDER order
                const grouped = new Map<ConversionStage, ConversionJob[]>();
                for (const stage of STAGE_ORDER) {
                  const group = filteredJobs.filter((j) => j.stage === stage);
                  if (group.length > 0) grouped.set(stage, group);
                }
                return Array.from(grouped.entries()).map(([stage, stageJobs]) => {
                  const s = STAGE_STYLES[stage];
                  return (
                    <div key={stage}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        <span className={`text-[11px] font-black uppercase tracking-widest ${s.text}`}>
                          {STAGE_LABELS[stage]}
                        </span>
                        <span className="text-[10px] text-[#4a3020]">
                          ({stageJobs.length})
                        </span>
                      </div>
                      <div className="grid gap-3">
                        {stageJobs.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            onStageChanged={handleStageChanged}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  );
                });
              })()
            : filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onStageChanged={handleStageChanged}
                  onDelete={handleDelete}
                />
              ))}
        </div>
      )}

      {/* ── Phase 2 callout ────────────────────────────────────────────────── */}
      <BimPanel className="mt-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#5a3e22]">
          Coming in Phase 2
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Conversion review workspace with drawing overlay",
            "AI-assisted BIM entity inference from DWG layers",
            "Confidence scoring and unresolved item list",
            "Approve / reject / correct generated BIM objects",
            "Commit approved objects into BIM model",
            "Full conversion audit trail and revision history",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-xs text-[#5a3e22]">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-none text-[#3a2510]" />
              {item}
            </div>
          ))}
        </div>
      </BimPanel>
    </div>
  );
}
