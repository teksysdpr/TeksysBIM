// ── Wall utility functions ──────────────────────────────────────────────────────
//
// Pure computation helpers for wall instance quantities.
// No React / Zustand dependencies — safe to call in any context.
//
// Units
//   All input coordinates and dimensions are in millimetres (mm).
//   Output quantities are in SI base units:
//     lengths  → metres (m)
//     areas    → square metres (m²)
//     volumes  → cubic metres (m³)
//     thickness references → mm (as labelled)

import type { WallInstance } from "../types/sceneTypes";
import type { LayerAssembly } from "../types/wallTypes";

// ── Geometry ────────────────────────────────────────────────────────────────────

/** Centreline length of a wall instance in millimetres */
export function wallLengthMm(wall: WallInstance): number {
  const dx = wall.endPoint[0] - wall.startPoint[0];
  const dy = wall.endPoint[1] - wall.startPoint[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Layer helpers ───────────────────────────────────────────────────────────────

/** Returns the assembly's layers sorted by ascending order (exterior → interior) */
function sortedLayers(asm: LayerAssembly) {
  return [...asm.layers].sort((a, b) => a.order - b.order);
}

/**
 * Total thickness of structural (load-bearing) layers in the assembly.
 * Sums layers where function === "STRUCTURE" or isStructural === true.
 */
export function coreThicknessMm(asm: LayerAssembly | undefined): number {
  if (!asm) return 0;
  return sortedLayers(asm)
    .filter((l) => l.function === "STRUCTURE" || l.isStructural)
    .reduce((sum, l) => sum + l.thickness, 0);
}

/**
 * Outer (exterior-face) finish/substrate layer thickness in mm.
 * Defined as the first SUBSTRATE or FINISH layer by sort order (lowest order number).
 * Returns 0 if no such layer exists.
 */
export function outerPlasterThicknessMm(asm: LayerAssembly | undefined): number {
  if (!asm || asm.layers.length === 0) return 0;
  const layer = sortedLayers(asm).find(
    (l) => l.function === "SUBSTRATE" || l.function === "FINISH",
  );
  return layer?.thickness ?? 0;
}

/**
 * Inner (interior-face) finish/substrate layer thickness in mm.
 * Defined as the last SUBSTRATE or FINISH layer by sort order (highest order number),
 * provided it is different from the outer layer.
 * Returns 0 if no inner layer exists or there is only one finish layer.
 */
export function innerPlasterThicknessMm(asm: LayerAssembly | undefined): number {
  if (!asm || asm.layers.length === 0) return 0;
  const finishes = sortedLayers(asm).filter(
    (l) => l.function === "SUBSTRATE" || l.function === "FINISH",
  );
  if (finishes.length < 2) return 0;
  return finishes[finishes.length - 1].thickness;
}

// ── Quantities ──────────────────────────────────────────────────────────────────

export interface WallQuantities {
  /** Centreline wall length in metres */
  lengthM: number;
  /**
   * Gross one-face wall area in m² (length × height).
   * Deductions for openings are not applied at this phase.
   */
  grossAreaM2: number;
  /** Structural core thickness in mm (sum of STRUCTURE layers) */
  coreThickMm: number;
  /** Structural core volume in m³ (length × coreThickness × height) */
  coreVolM3: number;
  /** Exterior plaster/substrate layer thickness in mm; 0 if absent */
  outerPlasterMm: number;
  /**
   * Gross outer plaster area in m².
   * Equals grossAreaM2 when a plaster layer is present; 0 otherwise.
   */
  outerPlasterAreaM2: number;
  /** Interior plaster/substrate layer thickness in mm; 0 if absent */
  innerPlasterMm: number;
  /**
   * Gross inner plaster area in m².
   * Equals grossAreaM2 when an inner plaster layer is present; 0 otherwise.
   */
  innerPlasterAreaM2: number;
}

/**
 * Computes the full set of BOQ-relevant quantities for a typed wall instance.
 *
 * @param wall     The placed WallInstance (carries height and endpoint geometry).
 * @param asm      The resolved LayerAssembly for the wall type; may be undefined
 *                 for assembly-less instances (core quantities will be zero).
 */
export function computeWallQuantities(
  wall: WallInstance,
  asm: LayerAssembly | undefined,
): WallQuantities {
  const lenMm = wallLengthMm(wall);
  const lenM = lenMm / 1000;
  const heightM = wall.height / 1000;
  const grossAreaM2 = lenM * heightM;

  const coreThickMm = coreThicknessMm(asm);
  const coreVolM3 = lenM * (coreThickMm / 1000) * heightM;

  const outerPlasterMm = outerPlasterThicknessMm(asm);
  const innerPlasterMm = innerPlasterThicknessMm(asm);

  return {
    lengthM: lenM,
    grossAreaM2,
    coreThickMm,
    coreVolM3,
    outerPlasterMm,
    outerPlasterAreaM2: outerPlasterMm > 0 ? grossAreaM2 : 0,
    innerPlasterMm,
    innerPlasterAreaM2: innerPlasterMm > 0 ? grossAreaM2 : 0,
  };
}
