"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { useLibraryStore } from "@/app/editor/stores/libraryStore";
import type { LibraryScope } from "@/app/editor/types/libraryBase";
import type {
  Material,
  MaterialCategory,
  MaterialPhase,
} from "@/app/editor/types/libraryTypes";

interface Props {
  mode: "create" | "edit";
  scope: LibraryScope;
  /** Pre-fill data — for edit (id kept) or clone (id discarded, code/name adjusted). */
  initial?: Material;
  onClose: () => void;
}

const MAT_CATEGORIES: { value: MaterialCategory; label: string }[] = [
  { value: "MASONRY", label: "Masonry" },
  { value: "CONCRETE", label: "Concrete" },
  { value: "METAL", label: "Metal" },
  { value: "WOOD", label: "Wood" },
  { value: "INSULATION", label: "Insulation" },
  { value: "MEMBRANE", label: "Membrane" },
  { value: "FINISH", label: "Finish" },
  { value: "GLASS", label: "Glass" },
  { value: "EARTH", label: "Earth" },
  { value: "OTHER", label: "Other" },
];

const MAT_PHASES: { value: MaterialPhase; label: string }[] = [
  { value: "SOLID", label: "Solid" },
  { value: "LIQUID", label: "Liquid" },
  { value: "GAS", label: "Gas" },
  { value: "COMPOSITE", label: "Composite" },
];

const inp =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function MaterialFormModal({ mode, scope, initial, onClose }: Props) {
  // Detect "clone" — create mode with initial data from a different item
  const isClone = mode === "create" && !!initial;

  const [code, setCode] = useState(
    initial ? (isClone ? `${initial.code}-COPY` : initial.code) : ""
  );
  const [name, setName] = useState(
    initial ? (isClone ? `${initial.name} (Copy)` : initial.name) : ""
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<MaterialCategory>(
    initial?.category ?? "MASONRY"
  );
  const [phase, setPhase] = useState<MaterialPhase>(initial?.phase ?? "SOLID");
  const [colour, setColour] = useState(initial?.colour ?? "#C8B49A");
  const [density, setDensity] = useState(initial?.density?.toString() ?? "");
  const [thermalCond, setThermalCond] = useState(
    initial?.thermalConductivity?.toString() ?? ""
  );
  const [compStrength, setCompStrength] = useState(
    initial?.compressiveStrength?.toString() ?? ""
  );
  const [vapourRes, setVapourRes] = useState(
    initial?.vapourResistance?.toString() ?? ""
  );
  const [ifcName, setIfcName] = useState(initial?.ifcMaterialName ?? "");
  const [tagsRaw, setTagsRaw] = useState(initial?.tags?.join(", ") ?? "");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT">(
    isClone || !initial ? "ACTIVE" : (initial.status as "ACTIVE" | "DRAFT")
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearErr(key: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!code.trim()) e.code = "Required";
    if (!name.trim()) e.name = "Required";
    if (!/^#[0-9a-fA-F]{6}$/.test(colour)) e.colour = "Enter a valid 6-digit hex colour";
    return e;
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      phase,
      colour,
      density: density ? parseFloat(density) : undefined,
      thermalConductivity: thermalCond ? parseFloat(thermalCond) : undefined,
      compressiveStrength: compStrength ? parseFloat(compStrength) : undefined,
      vapourResistance: vapourRes ? parseFloat(vapourRes) : undefined,
      ifcMaterialName: ifcName.trim() || undefined,
      tags,
      scope,
      status,
      isBuiltIn: false,
      metadata: initial?.metadata ?? {},
    };

    const store = useLibraryStore.getState();
    if (mode === "edit" && initial) {
      store.updateMaterial(initial.id, payload);
    } else {
      store.addMaterial(payload);
    }
    onClose();
  }

  const modalTitle =
    mode === "edit" ? "Edit Material" : isClone ? "Clone Material" : "New Material";
  const saveLabel =
    mode === "edit" ? "Save Changes" : isClone ? "Save Clone" : "Add Material";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">
              {modalTitle}
            </p>
            <h2 className="text-base font-black text-slate-900">
              {mode === "edit" ? name || "Untitled" : "Add to Library"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-4">
          {/* Code + Status */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code *" error={errors.code}>
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  clearErr("code");
                }}
                placeholder="e.g. MAT-RBB"
                className={inp}
              />
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "DRAFT")}
                className={`${inp} cursor-pointer`}
              >
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
              </select>
            </Field>
          </div>

          {/* Name */}
          <Field label="Name *" error={errors.name}>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearErr("name");
              }}
              placeholder="e.g. Red Burnt Brick"
              className={inp}
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              rows={2}
              className={`${inp} resize-none`}
            />
          </Field>

          {/* Category + Phase */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className={`${inp} cursor-pointer`}
              >
                {MAT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Phase">
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value as MaterialPhase)}
                className={`${inp} cursor-pointer`}
              >
                {MAT_PHASES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Colour */}
          <Field label="Viewport Colour *" error={errors.colour}>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colour.match(/^#[0-9a-fA-F]{6}$/) ? colour : "#c8b49a"}
                onChange={(e) => {
                  setColour(e.target.value);
                  clearErr("colour");
                }}
                className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
              />
              <input
                value={colour}
                onChange={(e) => {
                  setColour(e.target.value);
                  clearErr("colour");
                }}
                placeholder="#C8B49A"
                className={`${inp} flex-1 font-mono`}
              />
            </div>
          </Field>

          {/* Physical properties */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-slate-400">
              Physical Properties (optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Density (kg/m³)">
                <input
                  type="number"
                  min="0"
                  value={density}
                  onChange={(e) => setDensity(e.target.value)}
                  placeholder="e.g. 1900"
                  className={inp}
                />
              </Field>
              <Field label="λ Thermal (W/m·K)">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={thermalCond}
                  onChange={(e) => setThermalCond(e.target.value)}
                  placeholder="e.g. 0.72"
                  className={inp}
                />
              </Field>
              <Field label="Comp. Strength (MPa)">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={compStrength}
                  onChange={(e) => setCompStrength(e.target.value)}
                  placeholder="e.g. 7.5"
                  className={inp}
                />
              </Field>
              <Field label="Vapour Resistance μ">
                <input
                  type="number"
                  min="0"
                  value={vapourRes}
                  onChange={(e) => setVapourRes(e.target.value)}
                  placeholder="e.g. 50000"
                  className={inp}
                />
              </Field>
              <Field label="IFC Material Name">
                <input
                  value={ifcName}
                  onChange={(e) => setIfcName(e.target.value)}
                  placeholder="e.g. Brick, Common"
                  className={`${inp} col-span-2`}
                />
              </Field>
            </div>
          </div>

          {/* Tags */}
          <Field label="Tags (comma-separated)">
            <input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="e.g. masonry, IS-1077, indian-standard"
              className={inp}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            <Save className="h-4 w-4" />
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
