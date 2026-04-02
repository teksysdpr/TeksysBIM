"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  FileSymlink,
  FolderKanban,
  FolderPlus,
  Layers,
  Loader2,
  Search,
  X,
} from "lucide-react";
import ProjectCard from "@/app/components/company/projects/ProjectCard";
import BimPageShell from "@/app/components/company/ui/BimPageShell";
import { BimPageHeader } from "@/app/components/company/ui/BimPageHeader";
import { BimStateBox } from "@/app/components/company/ui/BimStateBox";
import { BimButton } from "@/app/components/company/ui/BimButton";
import { getAccessToken } from "@/lib/storage";
import {
  fetchProjects,
  PROJECT_STATUS_LABELS,
  type ProjectListItem,
  type ProjectModule,
  type ProjectStatus,
} from "@/app/services/projectsService";

// ── Module configs (all in client to avoid server→client fn passing) ──────────

interface ModuleConfig {
  module: ProjectModule;
  title: string;
  eyebrow: string;
  description: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  features: string[];
}

const MODULE_CONFIGS: Record<ProjectModule, ModuleConfig> = {
  BIM_DESIGN: {
    module:       "BIM_DESIGN",
    title:        "BIM Design",
    eyebrow:      "TeksysBIM · BIM Design",
    description:  "3D model authoring, interdisciplinary coordination, and clash detection for intelligent BIM delivery.",
    accentColor:  "#60a5fa",
    accentBg:     "#060d18",
    accentBorder: "#1e3a5f",
    features:     ["Revit / IFC / NWC Models", "Clash Detection", "BIM Coordination", "Deliverables", "Member Access Control"],
  },
  CAD2BIM: {
    module:       "CAD2BIM",
    title:        "2D CAD2BIM",
    eyebrow:      "TeksysBIM · 2D CAD2BIM",
    description:  "Convert 2D DWG and PDF drawings into intelligent, coordinated BIM models with full audit trail.",
    accentColor:  "#d4933c",
    accentBg:     "#0e0803",
    accentBorder: "#6b3e14",
    features:     ["DWG / PDF Source Upload", "Conversion Pipeline", "Multi-Discipline Extraction", "QA Review Workflow", "Clash & Export Reports"],
  },
  COSTING: {
    module:       "COSTING",
    title:        "Costing",
    eyebrow:      "TeksysBIM · Costing",
    description:  "Model-based quantity takeoff, rate analysis, BOQ generation, and detailed cost estimation.",
    accentColor:  "#a78bfa",
    accentBg:     "#09061a",
    accentBorder: "#3b1f6b",
    features:     ["Quantity Extraction from BIM", "Rate Library & Analysis", "BOQ Builder", "Estimate Revisions", "Cost Comparison Reports"],
  },
};

function ModuleIcon({ module, className, color }: { module: ProjectModule; className?: string; color?: string }) {
  const style = color ? { color } : undefined;
  if (module === "BIM_DESIGN") return <Layers className={className} style={style} />;
  if (module === "CAD2BIM")   return <FileSymlink className={className} style={style} />;
  return <BarChart3 className={className} style={style} />;
}

// ── Status filter ──────────────────────────────────────────────────────────────

const STATUS_FILTERS: Array<{ value: ProjectStatus | "ALL"; label: string }> = [
  { value: "ALL",       label: "All" },
  { value: "ACTIVE",    label: "Active" },
  { value: "DRAFT",     label: "Draft" },
  { value: "ON_HOLD",   label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED",  label: "Archived" },
];

const FIELD =
  "w-full rounded-xl border border-[#2b1e12] bg-[#0f0905] px-3 py-2.5 text-sm text-[#f0e6d4] placeholder:text-[#5a3e22] focus:border-[#6b3e14] focus:outline-none";

// ── Create Project Modal ───────────────────────────────────────────────────────

function CreateProjectModal({
  module,
  onClose,
  onCreated,
}: {
  module: ProjectModule;
  onClose: () => void;
  onCreated: (project: ProjectListItem) => void;
}) {
  const [code, setCode]         = useState("");
  const [name, setName]         = useState("");
  const [clientName, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const firstRef                = useRef<HTMLInputElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  function onBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 3)       return setError("Project code must be at least 3 characters.");
    if (name.trim().length < 3)       return setError("Project name must be at least 3 characters.");
    if (clientName.trim().length < 2) return setError("Client name must be at least 2 characters.");

    setSaving(true);
    try {
      const token = getAccessToken();
      const r = await fetch("/api/proxy/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          clientName: clientName.trim(),
          location: location.trim() || undefined,
          module,
        }),
      });
      const payload = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(payload?.message || "Failed to create project");
      onCreated(payload.data as ProjectListItem);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onBackdrop}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#3f2d1a] bg-[#120c07] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6b4820]">New Project</p>
            <h2 className="mt-0.5 text-lg font-black text-[#f8e8cf]">Create Project</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#5a3e22] hover:bg-[#1a0f06] hover:text-[#f0e6d4]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/20 px-3 py-2.5 text-xs text-[#f87171]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#c4a46e]">
              Project Code <span className="text-[#f87171]">*</span>
            </label>
            <input ref={firstRef} value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. TKS-BIM-002" className={FIELD} required />
            <p className="mt-1 text-[10px] text-[#7a5e3e]">Short unique identifier (auto-uppercased)</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#c4a46e]">
              Project Name <span className="text-[#f87171]">*</span>
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Prestige Heights — BIM Coordination" className={FIELD} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#c4a46e]">
              Client Name <span className="text-[#f87171]">*</span>
            </label>
            <input value={clientName} onChange={(e) => setClient(e.target.value)}
              placeholder="e.g. Prestige Group" className={FIELD} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#c4a46e]">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru" className={FIELD} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-[#2b1e12] py-2.5 text-sm font-semibold text-[#8a6e4e] transition hover:bg-[#1a0f06]">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d4933c] py-2.5 text-sm font-black text-[#1a0f06] transition hover:bg-[#c08030] disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ModuleProjectsClient({ module }: { module: ProjectModule }) {
  const config = MODULE_CONFIGS[module];
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects]         = useState<ProjectListItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [showModal, setShowModal]       = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "new") setShowModal(true);
  }, [searchParams]);

  const loadProjects = useCallback(() => {
    setLoading(true);
    fetchProjects({ module: config.module })
      .then(setProjects)
      .catch((e) => setError(e?.message ?? "Failed to load projects"))
      .finally(() => setLoading(false));
  }, [config.module]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  function handleCreated(project: ProjectListItem) {
    setShowModal(false);
    router.replace(window.location.pathname);
    setProjects((prev) => [project, ...prev]);
    router.push(`/company/projects/${project.id}`);
  }

  function openModal() {
    setShowModal(true);
    router.replace(`${window.location.pathname}?action=new`, { scroll: false });
  }

  function closeModal() {
    setShowModal(false);
    router.replace(window.location.pathname, { scroll: false });
  }

  const filtered = projects.filter((p) => {
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.clientName ?? "").toLowerCase().includes(q) ||
      (p.location ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const { accentColor, accentBg, accentBorder } = config;

  const subtitle = loading
    ? "Loading…"
    : `${projects.length} project${projects.length !== 1 ? "s" : ""}`;

  return (
    <BimPageShell>
      {showModal && (
        <CreateProjectModal
          module={config.module}
          onClose={closeModal}
          onCreated={handleCreated}
        />
      )}

      {/* ── Page header ── */}
      <BimPageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        subtitle={subtitle}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/company/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2b1e12] px-3 py-2 text-xs font-semibold text-[#8a6e4e] transition hover:border-[#6b3e14] hover:text-[#d4933c]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <BimButton variant="primary" size="md" icon={<FolderPlus className="h-4 w-4" />} onClick={openModal}>
              New Project
            </BimButton>
          </div>
        }
      />

      {/* ── Module hero strip ── */}
      <section
        className="flex items-center gap-4 rounded-2xl border px-5 py-4"
        style={{ borderColor: accentBorder, backgroundColor: accentBg }}
      >
        <span
          className="inline-flex h-14 w-14 flex-none items-center justify-center rounded-2xl border"
          style={{ borderColor: accentBorder, backgroundColor: `${accentColor}18` }}
        >
          <ModuleIcon module={module} className="h-7 w-7" color={accentColor} />
        </span>
        <div>
          <p className="text-sm font-black" style={{ color: accentColor }}>{config.title}</p>
          <p className="mt-0.5 text-xs text-[#8a6e4e]">{config.description}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {config.features.map((f) => (
              <span key={f} className="text-[10px] font-semibold text-[#7a5e3e]">· {f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search + status filters ── */}
      <section className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a3e22]" />
          <input
            type="text"
            placeholder="Search by name, code, client, or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#2b1e12] bg-[#110e0a] py-2.5 pl-9 pr-4 text-sm text-[#f0e6d4] placeholder:text-[#5a3e22] focus:border-[#6b3e14] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value} type="button" onClick={() => setStatusFilter(f.value)}
              className={[
                "rounded-lg border px-3 py-1.5 text-xs font-bold transition",
                statusFilter === f.value
                  ? "border-[#d4933c] bg-[#d4933c]/15 text-[#e8c080]"
                  : "border-[#2b1e12] bg-[#110e0a] text-[#7a5e3e] hover:border-[#4a2e10] hover:text-[#9a7d5e]",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Content ── */}
      {loading ? (
        <BimStateBox type="loading" />
      ) : error ? (
        <BimStateBox type="error" message={error} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="h-12 w-12 text-[#3f2d1a]" />
          <p className="mt-3 text-base font-bold text-[#7a5e3e]">
            {search || statusFilter !== "ALL" ? "No projects match your filters" : "No projects yet"}
          </p>
          {!search && statusFilter === "ALL" && (
            <>
              <p className="mt-1 text-sm text-[#7a5e3e]">
                Create your first {config.title} project to get started.
              </p>
              <button
                onClick={openModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#d4933c] px-4 py-2.5 text-sm font-black text-[#1a0f06] transition hover:bg-[#c08030]"
              >
                <FolderPlus className="h-4 w-4" />
                Create First Project
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {/* ── Summary strip ── */}
      {!loading && !error && projects.length > 0 && (
        <div className="flex flex-wrap gap-4 rounded-2xl border border-[#1e1610] bg-[#0e0b07] px-5 py-3">
          {(["ACTIVE", "DRAFT", "ON_HOLD", "COMPLETED"] as ProjectStatus[]).map((s) => {
            const count = projects.filter((p) => p.status === s).length;
            return count > 0 ? (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                className="flex items-center gap-2 text-xs transition hover:opacity-80">
                <span className="text-base font-black text-[#f0e6d4]">{count}</span>
                <span className="text-[#7a5e3e]">{PROJECT_STATUS_LABELS[s]}</span>
              </button>
            ) : null;
          })}
        </div>
      )}
    </BimPageShell>
  );
}
