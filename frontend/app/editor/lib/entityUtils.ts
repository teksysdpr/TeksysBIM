// ── Entity utilities ──────────────────────────────────────────────────────────

import type { BimEntity, EntityType } from "../types/model";

// ── Tree traversal ────────────────────────────────────────────────────────────

/** Collect all descendant IDs (depth-first) */
export function collectDescendants(
  entities: Record<string, BimEntity>,
  rootId: string
): string[] {
  const result: string[] = [];
  function walk(id: string) {
    const e = entities[id];
    if (!e) return;
    result.push(id);
    for (const cid of e.childIds) walk(cid);
  }
  walk(rootId);
  return result;
}

/** Get all ancestors from entity up to (but not including) the root */
export function getAncestorChain(
  entities: Record<string, BimEntity>,
  id: string
): BimEntity[] {
  const chain: BimEntity[] = [];
  let cur = entities[id];
  while (cur && cur.parentId) {
    cur = entities[cur.parentId];
    if (cur) chain.push(cur);
  }
  return chain;
}

/** Find the nearest ancestor of a given type */
export function nearestAncestorOfType(
  entities: Record<string, BimEntity>,
  id: string,
  type: EntityType
): BimEntity | undefined {
  return getAncestorChain(entities, id).find((e) => e.type === type);
}

/** Collect all entities of a given type */
export function entitiesOfType(
  entities: Record<string, BimEntity>,
  type: EntityType
): BimEntity[] {
  return Object.values(entities).filter((e) => e.type === type);
}

// ── Visibility ────────────────────────────────────────────────────────────────

/** An entity is effectively hidden if it or any ancestor is invisible */
export function isEffectivelyVisible(
  entities: Record<string, BimEntity>,
  id: string
): boolean {
  let cur: BimEntity | undefined = entities[id];
  while (cur) {
    if (!cur.visible) return false;
    cur = cur.parentId ? entities[cur.parentId] : undefined;
  }
  return true;
}

// ── Level/view-mode position ──────────────────────────────────────────────────

/**
 * Compute the Y-offset for a level entity based on the current view mode.
 * In STACKED: use real elevation.
 * In EXPLODED: spread levels by index × (height + explodeSpacing).
 * In SOLO: same as STACKED but non-active levels are hidden.
 */
export function levelYOffset(
  elevation: number,
  levelIndex: number,
  levelHeight: number,
  viewMode: "STACKED" | "EXPLODED" | "SOLO",
  explodeSpacing: number
): number {
  if (viewMode === "EXPLODED") {
    return levelIndex * (levelHeight + explodeSpacing);
  }
  return elevation;
}

// ── Property display ─────────────────────────────────────────────────────────

export function formatPropertyValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return String(v);
  return String(v);
}

export function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// ── Geometry dimensions ───────────────────────────────────────────────────────

export function getEntityDimensions(
  entity: BimEntity
): { w: number; d: number; h: number } | null {
  if (!entity.geometry) return null;
  const def = entity.geometry.def;
  if (def.primitive === "BOX") {
    return { w: def.width, d: def.depth, h: def.height };
  }
  return null;
}
