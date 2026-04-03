"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { useLibraryStore, librarySelectors } from "@/app/editor/stores/libraryStore";
import type { LibraryScope } from "@/app/editor/types/libraryBase";
import type { ElementType } from "@/app/editor/types/libraryTypes";

interface Props {
  mode: "create" | "edit" | "clone";
  scope: LibraryScope;
  /** Pre-fill data — for edit (id kept) or clone (id discarded, code/name adjusted). */
  initial?: ElementType;
  /** Pre-select this family when opening a create modal from inside a family view. */
  defaultFamilyId?: string;
  onClose: () => void;
}

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

export default function ElementTypeFormModal({
  mode,
  scope,
  initial,
  defaultFamilyId,
  onClose,
}: Props) {
  const allFamilies = useLibraryStore(librarySelectors.activeFamilies);
  const allAssemblies = useLibraryStore(librarySelectors.activeAssemblies);
  const allCategories = useLibraryStore(librarySelectors.activeCategories);

  const isClone = mode === "clone";
  const isEdit = mode === "edit";

  const [code, setCode] = useState(
    isClone && initial ? `${initial.code}-COPY` : (initial?.code ?? "")
  );
  const [name, setName] = useState(
    isClone && initial ? `${initial.name} (Copy)` : (initial?.name ?? "")
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [familyId, setFamilyId] = useState(
    initial?.familyId ?? defaultFamilyId ?? (allFamilies[0]?.id ?? "")
  );
  const [assemblyId, setAssemblyId] = useState(initial?.assemblyId ?? "");
  const [nominalThickness, setNominalThickness] = useState(
    initial?.nominalThickness?.toString() ?? ""
  );
  const [nominalHeight, setNominalHeight] = useState(
    initial?.nominalHeight?.toString() ?? ""
  );
  const [isStructural, setIsStructural] = useState(initial?.isStructural ?? false);
  const [isFireRated, setIsFireRated] = useState(initial?.isFireRated ?? false);
  const [fireRating, setFireRating] = useState(initial?.fireRating ?? "");
  const [ifcTypeName, setIfcTypeName] = useState(initial?.ifcTypeName ?? "");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT">(
    isClone || !initial ? "DRAFT" : (initial.status as "ACTIVE" | "DRAFT")
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearErr(key: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // Derive category from selected family
  const selectedFamily = allFamilies.find((f) => f.id === familyId);
  const selectedCat = allCategories.find((c) => c.id === selectedFamily?.categoryId);

  // Filter assemblies to those relevant to the selected category
  const relevantAssemblies = selectedCat
    ? allAssemblies.filter(
        (a) =>
          a.applicableCategories.length === 0 ||
          a.applicableCategories.includes(
            (selectedCat.code ?? selectedCat.name).toUpperCase()
          )
      )
    : allAssemblies;

  // Group families by category name for the <optgroup> select
  const catGroups: Record<string, { id: string; label: string }[]> = {};
  allFamilies.forEach((f) => {
    const cat = allCategories.find((c) => c.id === f.categoryId);
    const catName = cat?.name ?? "Uncategorised";
    if (!catGroups[catName]) catGroups[catName] = [];
    catGroups[catName].push({ id: f.id, label: f.name });
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!code.trim()) e.code = "Required";
    if (!name.trim()) e.name = "Required";
    if (!familyId) e.familyId = "Select a family";
    return e;
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
      familyId,
      assemblyId: assemblyId || undefined,
      nominalThickness: nominalThickness ? parseFloat(nominalThickness) : undefined,
      nominalHeight: nominalHeight ? parseFloat(nominalHeight) : undefined,
      isStructural,
      isFireRated,
      fireRating: isFireRated && fireRating.trim() ? fireRating.trim() : undefined,
      ifcTypeName: ifcTypeName.trim() || undefined,
      tags: initial?.tags ?? [],
      scope,
      status,
      isBuiltIn: false,
      metadata: initial?.metadata ?? {},
      finishSystemIds: initial?.finishSystemIds,
    };

    const store = useLibraryStore.getState();
    if (isEdit && initial) {
      store.updateType(initial.id, payload);
    } else {
      store.addType(payload);
    }
    onClose();
  }

  const modalTitle = isEdit
    ? "Edit Element Type"
    : isClone
    ? "Clone Element Type"
    : "New Element Type";
  const saveLabel = isEdit ? "Save Changes" : isClone ? "Save Clone" : "Add Type";

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
              {isEdit ? name || "Untitled" : "Add to Library"}
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
                placeholder="e.g. TYP-BW-230"
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
              placeholder="e.g. 230mm Brick Wall (Plastered)"
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

          {/* Family */}
          <Field label="Family *" error={errors.familyId}>
            <select
              value={familyId}
              onChange={(e) => {
                setFamilyId(e.target.value);
                setAssemblyId("");
                clearErr("familyId");
              }}
              className={`${inp} cursor-pointer`}
            >
              <option value="">— Select family —</option>
              {Object.entries(catGroups).map(([catName, fams]) => (
                <optgroup key={catName} label={catName}>
                  {fams.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          {/* Assembly */}
          <Field label="Layer Assembly (optional)">
            <select
              value={assemblyId}
              onChange={(e) => setAssemblyId(e.target.value)}
              className={`${inp} cursor-pointer`}
            >
              <option value="">— None —</option>
              {relevantAssemblies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.totalThickness}mm · {a.layers.length} layers)
                </option>
              ))}
            </select>
          </Field>

          {/* Dimensions */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-slate-400">
              Dimensions
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nominal Thickness (mm)">
                <input
                  type="number"
                  min="0"
                  value={nominalThickness}
                  onChange={(e) => setNominalThickness(e.target.value)}
                  placeholder="e.g. 230"
                  className={inp}
                />
              </Field>
              <Field label="Nominal Height (mm)">
                <input
                  type="number"
                  min="0"
                  value={nominalHeight}
                  onChange={(e) => setNominalHeight(e.target.value)}
                  placeholder="0 = storey height"
                  className={inp}
                />
              </Field>
            </div>
          </div>

          {/* Classification */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-slate-400">
              Classification
            </p>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isStructural}
                  onChange={(e) => setIsStructural(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-teal-600"
                />
                <span className="text-sm text-slate-700">
                  Structural (load-bearing)
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isFireRated}
                  onChange={(e) => {
                    setIsFireRated(e.target.checked);
                    if (!e.target.checked) setFireRating("");
                  }}
                  className="h-4 w-4 rounded border-slate-300 accent-teal-600"
                />
                <span className="text-sm text-slate-700">Fire rated</span>
              </label>

              {isFireRated && (
                <Field label="Fire Rating">
                  <input
                    value={fireRating}
                    onChange={(e) => setFireRating(e.target.value)}
                    placeholder="e.g. REI 60, EI 120, 2H"
                    className={inp}
                  />
                </Field>
              )}

              <Field label="IFC Type Name (optional)">
                <input
                  value={ifcTypeName}
                  onChange={(e) => setIfcTypeName(e.target.value)}
                  placeholder="e.g. SOLIDWALL, PARTITIONING"
                  className={inp}
                />
              </Field>
            </div>
          </div>
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
