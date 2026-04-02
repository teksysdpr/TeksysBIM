// ── Mock BIM scene ────────────────────────────────────────────────────────────
// Demo 3-storey residential building for Phase 3 viewport preview.
// Used when no real project data is loaded.
//
// Building: 12m × 8m footprint, 3 levels at 3.2m each, flat roof.
// Hierarchy: Project → Site → Building → Level → [Elements]

import type { BimEntity } from "../types/model";

// ── Dimension constants ───────────────────────────────────────────────────────

const W = 12;           // building width (X) in metres
const D = 8;            // building depth (Z) in metres
const WALL_T = 0.25;    // wall thickness
const SLAB_T = 0.20;    // slab thickness
const LEVEL_H = 3.2;    // storey height

const LEVELS: Array<{ id: string; name: string; number: string; elevation: number }> = [
  { id: "lvl-00", name: "Ground Floor", number: "00", elevation: 0 },
  { id: "lvl-01", name: "First Floor",  number: "01", elevation: LEVEL_H },
  { id: "lvl-02", name: "Second Floor", number: "02", elevation: LEVEL_H * 2 },
  { id: "lvl-03", name: "Roof",         number: "RF", elevation: LEVEL_H * 3 },
];

// ── Entity builder helpers ────────────────────────────────────────────────────

function ent(partial: Omit<BimEntity, "visible" | "locked" | "dirty">): BimEntity {
  return { ...partial, visible: true, locked: false, dirty: false };
}

// ── Build scene ───────────────────────────────────────────────────────────────

export function buildMockScene(): {
  entities: Record<string, BimEntity>;
  rootIds: string[];
} {
  const entities: Record<string, BimEntity> = {};

  function add(e: BimEntity) { entities[e.id] = e; }

  // ── Project ──────────────────────────────────────────────────────────────
  add(ent({
    id: "proj-demo",
    type: "PROJECT",
    name: "Sunset Towers — Block A",
    parentId: null,
    childIds: ["site-001"],
    properties: { status: "DEMO", discipline: "ALL" },
  }));

  // ── Site ─────────────────────────────────────────────────────────────────
  add(ent({
    id: "site-001",
    type: "SITE",
    name: "Phase 1 Plot",
    parentId: "proj-demo",
    childIds: ["bldg-001"],
    properties: { area: "850 sqm", plotNo: "A" },
  }));

  // ── Building ─────────────────────────────────────────────────────────────
  add(ent({
    id: "bldg-001",
    type: "BUILDING",
    name: "Block A",
    parentId: "site-001",
    childIds: LEVELS.map((l) => l.id),
    properties: { floors: 3, usage: "RESIDENTIAL", footprintW: W, footprintD: D },
  }));

  // ── Levels ───────────────────────────────────────────────────────────────
  for (const lvl of LEVELS) {
    const isRoof = lvl.number === "RF";
    const slabId = `slab-${lvl.id}`;
    const wallIds = isRoof
      ? []
      : [`wall-${lvl.id}-n`, `wall-${lvl.id}-s`, `wall-${lvl.id}-e`, `wall-${lvl.id}-w`];

    add(ent({
      id: lvl.id,
      type: "LEVEL",
      name: lvl.name,
      parentId: "bldg-001",
      childIds: [slabId, ...wallIds],
      properties: {
        elevation: lvl.elevation,
        height: isRoof ? SLAB_T : LEVEL_H,
        number: lvl.number,
      },
    }));

    // ── Slab ───────────────────────────────────────────────────────────────
    add(ent({
      id: slabId,
      type: "ELEMENT",
      name: `Slab — ${lvl.name}`,
      parentId: lvl.id,
      childIds: [],
      category: isRoof ? "ROOF" : "SLAB",
      discipline: "STRUCTURE",
      properties: { level: lvl.number, thickness: SLAB_T },
      geometry: {
        def: { primitive: "BOX", width: W, depth: D, height: SLAB_T },
        transform: {
          position: [0, lvl.elevation + SLAB_T / 2, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      },
    }));

    if (!isRoof) {
      const wallY = lvl.elevation + SLAB_T + LEVEL_H / 2;

      // North wall
      add(ent({
        id: `wall-${lvl.id}-n`,
        type: "ELEMENT",
        name: `Wall N — ${lvl.name}`,
        parentId: lvl.id,
        childIds: [],
        category: "WALL",
        discipline: "ARCHITECTURE",
        properties: { level: lvl.number, thickness: WALL_T, orientation: "NORTH" },
        geometry: {
          def: { primitive: "BOX", width: W, depth: WALL_T, height: LEVEL_H },
          transform: {
            position: [0, wallY, -(D / 2 - WALL_T / 2)],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      }));

      // South wall
      add(ent({
        id: `wall-${lvl.id}-s`,
        type: "ELEMENT",
        name: `Wall S — ${lvl.name}`,
        parentId: lvl.id,
        childIds: [],
        category: "WALL",
        discipline: "ARCHITECTURE",
        properties: { level: lvl.number, thickness: WALL_T, orientation: "SOUTH" },
        geometry: {
          def: { primitive: "BOX", width: W, depth: WALL_T, height: LEVEL_H },
          transform: {
            position: [0, wallY, D / 2 - WALL_T / 2],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      }));

      // East wall
      add(ent({
        id: `wall-${lvl.id}-e`,
        type: "ELEMENT",
        name: `Wall E — ${lvl.name}`,
        parentId: lvl.id,
        childIds: [],
        category: "WALL",
        discipline: "ARCHITECTURE",
        properties: { level: lvl.number, thickness: WALL_T, orientation: "EAST" },
        geometry: {
          def: { primitive: "BOX", width: WALL_T, depth: D - WALL_T * 2, height: LEVEL_H },
          transform: {
            position: [W / 2 - WALL_T / 2, wallY, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      }));

      // West wall
      add(ent({
        id: `wall-${lvl.id}-w`,
        type: "ELEMENT",
        name: `Wall W — ${lvl.name}`,
        parentId: lvl.id,
        childIds: [],
        category: "WALL",
        discipline: "ARCHITECTURE",
        properties: { level: lvl.number, thickness: WALL_T, orientation: "WEST" },
        geometry: {
          def: { primitive: "BOX", width: WALL_T, depth: D - WALL_T * 2, height: LEVEL_H },
          transform: {
            position: [-(W / 2 - WALL_T / 2), wallY, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      }));
    }
  }

  return { entities, rootIds: ["proj-demo"] };
}

// ── Level colour palette ──────────────────────────────────────────────────────
// Used by BimLevelMesh to colour-code each storey.

export const LEVEL_COLORS: Record<string, string> = {
  "lvl-00": "#2d6be4",   // blue — ground
  "lvl-01": "#17a059",   // green — first
  "lvl-02": "#8b3fc0",   // purple — second
  "lvl-03": "#c23b22",   // red — roof
};

export const WALL_COLOR = "#4b5563";
export const SLAB_COLOR_DEFAULT = "#334155";

export const SELECTED_COLOR = "#d4933c";
export const HOVERED_COLOR  = "#e8c080";
