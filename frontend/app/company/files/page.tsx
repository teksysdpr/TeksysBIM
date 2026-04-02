"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileUp,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import BimPageShell from "@/app/components/company/ui/BimPageShell";
import { BimPageHeader } from "@/app/components/company/ui/BimPageHeader";
import { BimPanel } from "@/app/components/company/ui/BimPanel";
import { BimSectionLabel } from "@/app/components/company/ui/BimSectionLabel";
import { getAccessToken } from "@/lib/storage";
import { fetchProjects, type ProjectListItem } from "@/app/services/projectsService";

const ALLOWED_EXT = [".dwg", ".dxf", ".pdf", ".ifc", ".rvt", ".nwc", ".nwd", ".xlsx", ".docx", ".zip"];
const CATEGORIES = ["Source CAD", "Source PDF", "BIM Model", "Deliverable", "Coordination", "Cost Data", "Other"];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function ext(name: string) {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}

interface UploadedFile {
  id: string;
  originalName: string;
  category: string;
  sizeBytes: number;
  status: string;
  createdAt: string;
}

export default function FilesPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadedFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProjects()
      .then((list) => {
        setProjects(list);
        if (list.length > 0) setProjectId(list[0].id);
      })
      .finally(() => setProjectsLoading(false));
  }, []);

  function validateAndSetFile(f: File) {
    setUploadResult(null);
    setUploadError(null);
    const e = ext(f.name);
    if (!ALLOWED_EXT.includes(e)) {
      setFileError(`File type "${e}" is not allowed. Accepted: ${ALLOWED_EXT.join(", ")}`);
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(f);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
    e.target.value = "";
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  }, []);

  async function handleUpload() {
    if (!file || !projectId || !category) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const token = getAccessToken();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("projectId", projectId);
      fd.append("category", category);
      const r = await fetch("/api/proxy/files/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const payload = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(payload?.message || "Upload failed");
      setUploadResult(payload.data as UploadedFile);
      setFile(null);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const fieldCls =
    "w-full rounded-xl border border-[#2b1e12] bg-[#0f0905] px-3 py-2.5 text-sm text-[#f0e6d4] focus:border-[#6b3e14] focus:outline-none";

  return (
    <BimPageShell>
      <BimPageHeader
        eyebrow="TeksysBIM · Files"
        title="Upload Files"
        subtitle="Upload source drawings and deliverables to a project"
        action={
          <Link
            href="/company/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2b1e12] px-3 py-2 text-xs font-semibold text-[#8a6e4e] transition hover:border-[#6b3e14] hover:text-[#d4933c]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        }
      />

      <div className="mx-auto max-w-lg space-y-6">
        {/* Project + Category */}
        <BimPanel as="section" className="space-y-4">
          <BimSectionLabel>File Details</BimSectionLabel>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#c4a46e]">
              Project <span className="text-[#f87171]">*</span>
            </label>
            {projectsLoading ? (
              <div className="flex items-center gap-2 text-xs text-[#7a5e3e]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading projects…
              </div>
            ) : projects.length === 0 ? (
              <p className="text-xs text-[#7a5e3e]">
                No projects found.{" "}
                <Link href="/company/projects?action=new" className="text-[#d4933c] hover:underline">
                  Create one first.
                </Link>
              </p>
            ) : (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={fieldCls}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#c4a46e]">
              Category <span className="text-[#f87171]">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </BimPanel>

        {/* Drop zone */}
        <BimPanel as="section" className="space-y-4">
          <BimSectionLabel>Select File</BimSectionLabel>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={[
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
              dragging
                ? "border-[#d4933c] bg-[#d4933c]/10"
                : "border-[#2b1e12] bg-[#0a0705] hover:border-[#6b3e14] hover:bg-[#100c07]",
            ].join(" ")}
          >
            <FileUp className={`h-10 w-10 ${dragging ? "text-[#d4933c]" : "text-[#3f2d1a]"}`} />
            {file ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#f0e6d4]">{file.name}</span>
                <span className="text-xs text-[#7a5e3e]">({formatBytes(file.size)})</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setFileError(null); }}
                  className="rounded p-0.5 text-[#5a3e22] hover:text-[#f87171]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#8a6e4e]">
                  Drag & drop a file here, or <span className="text-[#d4933c]">click to browse</span>
                </p>
                <p className="text-[11px] text-[#5a3e22]">
                  {ALLOWED_EXT.join(" · ")}
                </p>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_EXT.join(",")}
            onChange={onInputChange}
            className="hidden"
          />

          {fileError && (
            <p className="rounded-xl border border-red-900/50 bg-red-950/20 px-3 py-2 text-xs text-[#f87171]">
              {fileError}
            </p>
          )}

          {uploadError && (
            <p className="rounded-xl border border-red-900/50 bg-red-950/20 px-3 py-2 text-xs text-[#f87171]">
              {uploadError}
            </p>
          )}

          {uploadResult && (
            <div className="flex items-start gap-3 rounded-xl border border-[#064e3b]/60 bg-[#064e3b]/20 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#34d399]" />
              <div>
                <p className="text-sm font-bold text-[#34d399]">Upload successful</p>
                <p className="mt-0.5 text-xs text-[#6ee7b7]">
                  {uploadResult.originalName} · {formatBytes(uploadResult.sizeBytes)} · {uploadResult.category}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={!file || !projectId || uploading}
            onClick={handleUpload}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4933c] py-2.5 text-sm font-black text-[#1a0f06] transition hover:bg-[#c08030] disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload File</>
            )}
          </button>
        </BimPanel>

        <p className="text-center text-[11px] text-[#5a3e22]">
          Max 100 MB per file · Supported: {ALLOWED_EXT.join(", ")}
        </p>
      </div>
    </BimPageShell>
  );
}
