"use client";

import { useSceneStore } from "../../stores/sceneStore";
import { useWorkbenchStore } from "../../stores/workbenchStore";
import { useViewerStore } from "../../stores/viewerStore";
import { formatPropertyValue, humanizeKey, getEntityDimensions } from "../../lib/entityUtils";
import { VIEW_MODE_LABELS, RENDER_MODE_LABELS } from "../../types/tools";

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#1a1208] pb-3">
      <p className="mb-2 px-3 pt-3 text-[9px] font-black uppercase tracking-widest text-[#4a2e10]">
        {title}
      </p>
      <div className="px-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <span className="flex-none text-[10px] text-[#5a3e22]">{label}</span>
      <span className="min-w-0 text-right font-mono text-[10px] text-[#9a7d5e]">{value}</span>
    </div>
  );
}

// ── No-selection panel ────────────────────────────────────────────────────────

function ViewerSettings() {
  const { viewMode, renderMode, showGrid, showAxes, setViewMode, setRenderMode, toggleGrid, toggleAxes } = useViewerStore();

  return (
    <Section title="Viewport">
      <Row label="View mode" value={VIEW_MODE_LABELS[viewMode]} />
      <Row label="Render" value={RENDER_MODE_LABELS[renderMode]} />
      <Row label="Grid" value={showGrid ? "On" : "Off"} />
      <Row label="Axes" value={showAxes ? "On" : "Off"} />
      <p className="mt-2 text-[9px] text-[#3a2410]">Select an element to inspect its properties.</p>
    </Section>
  );
}

// ── Properties panel ──────────────────────────────────────────────────────────

export default function PropertiesPanel() {
  const entities    = useSceneStore((s) => s.entities);
  const selectedIds = useWorkbenchStore((s) => s.selectedIds);

  const entityId = selectedIds[0] ?? null;
  const entity   = entityId ? entities[entityId] : null;

  return (
    <div className="flex h-full w-72 flex-none flex-col border-l border-[#1e1610] bg-[#0d0a07]">
      {/* Header */}
      <div className="border-b border-[#1e1610] px-3 py-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-[#4a2e10]">
          {entity ? "Properties" : "Inspector"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!entity ? (
          <ViewerSettings />
        ) : (
          <>
            {/* Identity */}
            <Section title="Identity">
              <Row label="Name"   value={entity.name} />
              <Row label="Type"   value={entity.type} />
              {entity.category   && <Row label="Category"   value={entity.category} />}
              {entity.discipline && <Row label="Discipline" value={entity.discipline} />}
              <Row label="ID" value={
                <span className="max-w-[120px] truncate block" title={entity.id}>
                  {entity.id.slice(0, 16)}…
                </span>
              } />
            </Section>

            {/* Geometry */}
            {entity.geometry && (() => {
              const dims = getEntityDimensions(entity);
              const tf   = entity.geometry.transform;
              return (
                <Section title="Geometry">
                  <Row label="Primitive" value={entity.geometry.def.primitive} />
                  {dims && (
                    <>
                      <Row label="Width"  value={`${dims.w.toFixed(2)} m`} />
                      <Row label="Depth"  value={`${dims.d.toFixed(2)} m`} />
                      <Row label="Height" value={`${dims.h.toFixed(2)} m`} />
                    </>
                  )}
                  <Row
                    label="Position"
                    value={`${tf.position[0].toFixed(2)}, ${tf.position[1].toFixed(2)}, ${tf.position[2].toFixed(2)}`}
                  />
                </Section>
              );
            })()}

            {/* Properties */}
            {Object.keys(entity.properties).length > 0 && (
              <Section title="BIM Properties">
                {Object.entries(entity.properties).map(([k, v]) => (
                  <Row key={k} label={humanizeKey(k)} value={formatPropertyValue(v)} />
                ))}
              </Section>
            )}

            {/* State */}
            <Section title="State">
              <Row label="Visible" value={entity.visible ? "Yes" : "No"} />
              <Row label="Locked"  value={entity.locked  ? "Yes" : "No"} />
              <Row label="Dirty"   value={entity.dirty   ? "Yes" : "No"} />
            </Section>

            {/* Multi-selection hint */}
            {selectedIds.length > 1 && (
              <div className="px-3 py-2">
                <p className="text-[9px] text-[#5a3e22]">
                  + {selectedIds.length - 1} more selected
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
