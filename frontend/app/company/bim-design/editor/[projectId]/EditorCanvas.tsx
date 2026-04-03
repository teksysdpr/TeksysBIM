"use client";

// ── EditorCanvas ───────────────────────────────────────────────────────────────
//
// Auxiliary plan-mode authoring surface for the BIM editor shell.
//
// Architectural role
//   This component is a PLAN-VIEW helper surface rendered inside the editor
//   page shell (`/company/bim-design/editor/[projectId]/page.tsx`).
//   It is NOT a standalone app, and is NOT a replacement for the direct-3D,
//   library-first BIM authoring architecture.  The 3D canvas is the primary
//   authoring surface; this 2D plan view is an auxiliary complement.
//
//   Integration: EditorCanvas is slot-mounted inside the editor's <main> area.
//   State contracts:
//     • Reads tool / palette selection from workbenchStore (never writes to it
//       except to call setDirty when a wall is committed).
//     • Reads type / assembly / material data from libraryStore (read-only).
//     • Writes placed instances to sceneStore via addWall.
//
// Coordinate system
//   World : mm, x → right, y → up, origin (0, 0) at scene centre
//   Canvas: px, x → right, y → down (standard browser canvas)
//   Transform: cx = cw/2 + panX + wx * scale
//              cy = ch/2 + panY - wy * scale
//
// Wall placement tool (Phase 4A)
//   idle    → click → set startPoint  → "placing"
//   placing → click → commit wall, chain startPoint to ep → stay "placing"
//   placing → double-click or Escape  → "idle"
//
// Select tool (Phase 4A-3)
//   left-click on a wall → select it (teal ring + endpoint handles)
//   left-click on empty space OR Escape → deselect
//   Switching away from SELECT tool also clears selection.
//
// Zoom: scroll-wheel, centred on cursor (non-passive listener)
// Pan : middle-mouse drag OR PAN tool + left drag

import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkbenchStore, workbenchSelectors } from "@/app/editor/stores/workbenchStore";
import { useLibraryStore, librarySelectors } from "@/app/editor/stores/libraryStore";
import { useSceneStore, sceneSelectors } from "@/app/editor/stores/sceneStore";
import type { WallInstance } from "@/app/editor/types/sceneTypes";
import type { LayerAssembly, Material } from "@/app/editor/types/libraryTypes";

// ── View transform ─────────────────────────────────────────────────────────────

const DEFAULT_SCALE = 0.18; // px / mm  →  1 metre ≈ 180 px

interface VT {
  scale: number;
  panX: number; // canvas-pixel offset of world origin from canvas centre
  panY: number;
}

// ── Pure coordinate utilities ──────────────────────────────────────────────────

function w2c(
  [wx, wy]: [number, number],
  { scale, panX, panY }: VT,
  cw: number,
  ch: number,
): [number, number] {
  return [cw / 2 + panX + wx * scale, ch / 2 + panY - wy * scale];
}

function c2w(
  [cx, cy]: [number, number],
  { scale, panX, panY }: VT,
  cw: number,
  ch: number,
): [number, number] {
  return [
    (cx - cw / 2 - panX) / scale,
    -(cy - ch / 2 - panY) / scale,
  ];
}

/** Snap world coordinate to nearest 50mm grid point */
function snapPt([wx, wy]: [number, number]): [number, number] {
  return [Math.round(wx / 50) * 50, Math.round(wy / 50) * 50];
}

// ── Wall geometry ──────────────────────────────────────────────────────────────

/**
 * Returns four corners [A, B, C, D] of a wall rectangle in world mm.
 * A–D are the exterior-left, interior-left, interior-right, exterior-right corners.
 */
function wallCorners(
  [sx, sy]: [number, number],
  [ex, ey]: [number, number],
  thickness: number,
): [[number, number], [number, number], [number, number], [number, number]] {
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.1) return [[sx, sy], [sx, sy], [ex, ey], [ex, ey]];
  const nx = (-dy / len) * (thickness / 2); // left-normal × half thickness
  const ny = (dx / len) * (thickness / 2);
  return [
    [sx + nx, sy + ny], // A: start, exterior face
    [sx - nx, sy - ny], // B: start, interior face
    [ex - nx, ey - ny], // C: end,   interior face
    [ex + nx, ey + ny], // D: end,   exterior face
  ];
}

// ── Drawing primitives ─────────────────────────────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D, vt: VT, cw: number, ch: number) {
  // Compute visible world bounds from canvas corners
  const [wl] = c2w([0, 0], vt, cw, ch);
  const [wr] = c2w([cw, 0], vt, cw, ch);
  const [, wb] = c2w([0, ch], vt, cw, ch);
  const [, wt] = c2w([0, 0], vt, cw, ch);

  // Minor grid — 100mm (10cm)
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 0.5;
  for (let x = Math.floor(wl / 100) * 100; x <= wr + 100; x += 100) {
    const [cx] = w2c([x, 0], vt, cw, ch);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, ch);
  }
  for (let y = Math.floor(wb / 100) * 100; y <= wt + 100; y += 100) {
    const [, cy] = w2c([0, y], vt, cw, ch);
    ctx.moveTo(0, cy);
    ctx.lineTo(cw, cy);
  }
  ctx.stroke();

  // Major grid — 1000mm (1m)
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  for (let x = Math.floor(wl / 1000) * 1000; x <= wr + 1000; x += 1000) {
    const [cx] = w2c([x, 0], vt, cw, ch);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, ch);
  }
  for (let y = Math.floor(wb / 1000) * 1000; y <= wt + 1000; y += 1000) {
    const [, cy] = w2c([0, y], vt, cw, ch);
    ctx.moveTo(0, cy);
    ctx.lineTo(cw, cy);
  }
  ctx.stroke();

  // Origin cross
  const [ox, oy] = w2c([0, 0], vt, cw, ch);
  ctx.strokeStyle = "rgba(20,184,166,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox - 14, oy);
  ctx.lineTo(ox + 14, oy);
  ctx.moveTo(ox, oy - 14);
  ctx.lineTo(ox, oy + 14);
  ctx.stroke();
}

/**
 * Draws a wall in plan view.
 * If the wall has an assembly, each layer is drawn as a coloured band using
 * the material's hex colour. Otherwise a solid grey fill is used.
 */
function drawWall(
  ctx: CanvasRenderingContext2D,
  wall: WallInstance,
  vt: VT,
  cw: number,
  ch: number,
  assemblies: LayerAssembly[],
  materials: Material[],
  alpha = 1,
) {
  const asm = wall.assemblyId
    ? assemblies.find((a) => a.id === wall.assemblyId)
    : undefined;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Fallback: no assembly → solid grey rect
  if (!asm || asm.layers.length === 0) {
    const pts = wallCorners(wall.startPoint, wall.endPoint, wall.thickness).map(
      (p) => w2c(p, vt, cw, ch),
    );
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    ctx.fillStyle = "#6b7280";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Layered plan view — each layer is a band across the wall width
  const sorted = [...asm.layers].sort((a, b) => a.order - b.order);

  const dx = wall.endPoint[0] - wall.startPoint[0];
  const dy = wall.endPoint[1] - wall.startPoint[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.1) {
    ctx.restore();
    return;
  }

  const nx = -dy / len; // left unit normal (exterior direction)
  const ny = dx / len;

  // Walk from exterior face inward
  let extOffset = wall.thickness / 2;

  for (const layer of sorted) {
    const intOffset = extOffset - layer.thickness;
    const mat = materials.find((m) => m.id === layer.materialId);
    const fill = mat?.colour ?? "#6b7280";

    const A: [number, number] = [
      wall.startPoint[0] + nx * extOffset,
      wall.startPoint[1] + ny * extOffset,
    ];
    const B: [number, number] = [
      wall.startPoint[0] + nx * intOffset,
      wall.startPoint[1] + ny * intOffset,
    ];
    const C: [number, number] = [
      wall.endPoint[0] + nx * intOffset,
      wall.endPoint[1] + ny * intOffset,
    ];
    const D: [number, number] = [
      wall.endPoint[0] + nx * extOffset,
      wall.endPoint[1] + ny * extOffset,
    ];

    const pts = [A, B, C, D].map((p) => w2c(p, vt, cw, ch));
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    extOffset = intOffset;
  }

  // Outer stroke on the whole wall outline
  const outline = wallCorners(wall.startPoint, wall.endPoint, wall.thickness).map(
    (p) => w2c(p, vt, cw, ch),
  );
  ctx.beginPath();
  ctx.moveTo(outline[0][0], outline[0][1]);
  outline.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

/** Ghost preview wall drawn while the second point is being positioned */
function drawPreview(
  ctx: CanvasRenderingContext2D,
  start: [number, number],
  end: [number, number],
  thickness: number,
  vt: VT,
  cw: number,
  ch: number,
) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lenMm = Math.sqrt(dx * dx + dy * dy);
  if (lenMm < 1) return;

  const pts = wallCorners(start, end, thickness).map((p) => w2c(p, vt, cw, ch));

  ctx.save();

  // Ghost fill
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.fillStyle = "#0d9488";
  ctx.fill();
  ctx.setLineDash([5, 3]);
  ctx.strokeStyle = "#5eead4";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // Length label at midpoint
  const mid: [number, number] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
  const [mx, my] = w2c(mid, vt, cw, ch);
  const label = `${(lenMm / 1000).toFixed(2)} m`;
  ctx.globalAlpha = 1;
  ctx.font = "bold 11px system-ui, sans-serif";
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(mx - tw / 2 - 4, my - 9, tw + 8, 18);
  ctx.fillStyle = "#ccfbf1";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, mx, my);

  ctx.restore();
}

/** Small snap indicator dot drawn at a snapped world point */
function drawDot(
  ctx: CanvasRenderingContext2D,
  pt: [number, number],
  vt: VT,
  cw: number,
  ch: number,
  color: string,
) {
  const [cx, cy] = w2c(pt, vt, cw, ch);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// ── Hit testing ────────────────────────────────────────────────────────────────

/**
 * Returns true if a world-coordinate point is inside the wall's oriented
 * rectangular footprint.  Uses wall-local coordinates: projects the test point
 * onto the wall's axis (along) and its left-normal (across), then checks both
 * projections against the wall's length and half-thickness bounds.
 */
function pointInWall(pt: [number, number], wall: WallInstance): boolean {
  const [px, py] = pt;
  const [sx, sy] = wall.startPoint;
  const [ex, ey] = wall.endPoint;
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return false;
  const ux = dx / len; // unit vector along wall
  const uy = dy / len;
  const rpx = px - sx;
  const rpy = py - sy;
  const along = rpx * ux + rpy * uy;         // distance along wall axis
  const across = Math.abs(rpx * (-uy) + rpy * ux); // perpendicular distance from centre line
  return along >= 0 && along <= len && across <= wall.thickness / 2;
}

// ── Selection drawing ──────────────────────────────────────────────────────────

/**
 * Draws the teal selection ring around a wall's outline plus small handle dots
 * at the start and end points (future drag targets for resize).
 */
function drawSelectionRing(
  ctx: CanvasRenderingContext2D,
  wall: WallInstance,
  vt: VT,
  cw: number,
  ch: number,
) {
  const outline = wallCorners(wall.startPoint, wall.endPoint, wall.thickness).map(
    (p) => w2c(p, vt, cw, ch),
  );
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(outline[0][0], outline[0][1]);
  outline.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.strokeStyle = "#2dd4bf"; // teal-400
  ctx.lineWidth = 2.5;
  ctx.setLineDash([]);
  ctx.stroke();
  ctx.restore();
  // Endpoint handles
  drawDot(ctx, wall.startPoint, vt, cw, ch, "#2dd4bf");
  drawDot(ctx, wall.endPoint, vt, cw, ch, "#2dd4bf");
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Canvas size (driven by ResizeObserver) ─────────────────────────────────
  const [size, setSize] = useState({ w: 800, h: 500 });
  const sizeRef = useRef(size);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  // ── View transform ─────────────────────────────────────────────────────────
  const [vt, setVt] = useState<VT>({ scale: DEFAULT_SCALE, panX: 0, panY: 0 });
  const vtRef = useRef(vt);
  useEffect(() => {
    vtRef.current = vt;
  }, [vt]);

  // ── Wall tool state ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<"idle" | "placing">("idle");
  const [startPt, setStartPt] = useState<[number, number] | null>(null);
  const [mousePt, setMousePt] = useState<[number, number] | null>(null);
  const phaseRef = useRef(phase);
  const startPtRef = useRef(startPt);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    startPtRef.current = startPt;
  }, [startPt]);

  // ── Pan state ──────────────────────────────────────────────────────────────
  const isPanningRef = useRef(false);
  const panOriginRef = useRef<{
    cx: number;
    cy: number;
    px: number;
    py: number;
  } | null>(null);

  // ── Selection state ────────────────────────────────────────────────────────
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);

  // ── Store values — also mirrored to refs for stable callbacks ──────────────
  const activeTool = useWorkbenchStore(workbenchSelectors.activeTool);
  const palette = useWorkbenchStore(workbenchSelectors.palette);
  const walls = useSceneStore(sceneSelectors.walls);
  const addWall = useSceneStore((s) => s.addWall);
  const allTypes = useLibraryStore(librarySelectors.activeTypes);
  const allAssemblies = useLibraryStore(librarySelectors.activeAssemblies);
  const allMaterials = useLibraryStore(librarySelectors.activeMaterials);

  const activeToolRef = useRef(activeTool);
  const paletteRef = useRef(palette);
  const addWallRef = useRef(addWall);
  const allTypesRef = useRef(allTypes);
  const allAssembliesRef = useRef(allAssemblies);
  /** Mirrors walls for use inside stable event-handler callbacks. */
  const wallsRef = useRef(walls);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);
  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);
  useEffect(() => {
    addWallRef.current = addWall;
  }, [addWall]);
  useEffect(() => {
    allTypesRef.current = allTypes;
  }, [allTypes]);
  useEffect(() => {
    allAssembliesRef.current = allAssemblies;
  }, [allAssemblies]);
  useEffect(() => {
    wallsRef.current = walls;
  }, [walls]);

  // ── Reset placement / selection when tool changes ─────────────────────────
  useEffect(() => {
    if (activeTool !== "WALL") {
      setPhase("idle");
      setStartPt(null);
    }
    if (activeTool !== "SELECT") {
      setSelectedWallId(null);
    }
  }, [activeTool]);

  // ── ResizeObserver ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) {
        setSize({
          w: Math.max(Math.floor(r.width), 1),
          h: Math.max(Math.floor(r.height), 1),
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Non-passive wheel listener (zoom) ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newScale = Math.min(3, Math.max(0.04, vtRef.current.scale * factor));
      const rect = canvas!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const { w, h } = sizeRef.current;
      const [wx, wy] = c2w([cx, cy], vtRef.current, w, h);
      setVt({
        scale: newScale,
        panX: cx - w / 2 - wx * newScale,
        panY: cy - h / 2 + wy * newScale,
      });
    }
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  // ── Escape key — cancel wall chain / clear selection ──────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (phaseRef.current === "placing") {
          setPhase("idle");
          setStartPt(null);
        }
        setSelectedWallId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = size;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, w, h);

    drawGrid(ctx, vt, w, h);

    // Placed walls — selected wall drawn last so its ring renders on top.
    // Non-selected walls are dimmed when a selection is active.
    const hasSelection = selectedWallId !== null;
    const selWall = walls.find((wall) => wall.id === selectedWallId);
    for (const wall of walls) {
      if (wall.id === selectedWallId) continue; // draw selected last
      drawWall(ctx, wall, vt, w, h, allAssemblies, allMaterials,
        hasSelection ? 0.45 : 1);
    }
    if (selWall) {
      drawWall(ctx, selWall, vt, w, h, allAssemblies, allMaterials);
      drawSelectionRing(ctx, selWall, vt, w, h);
    }

    // Preview while placing
    if (phase === "placing" && startPt && mousePt) {
      const type = palette.typeId
        ? allTypes.find((t) => t.id === palette.typeId)
        : undefined;
      const asm = palette.assemblyId
        ? allAssemblies.find((a) => a.id === palette.assemblyId)
        : undefined;
      const thickness = asm?.totalThickness ?? type?.nominalThickness ?? 230;
      drawPreview(ctx, startPt, mousePt, thickness, vt, w, h);
      drawDot(ctx, startPt, vt, w, h, "#f59e0b"); // amber = pinned start
      drawDot(ctx, mousePt, vt, w, h, "#5eead4"); // teal = live cursor
    } else if (activeTool === "WALL" && mousePt) {
      drawDot(ctx, mousePt, vt, w, h, "#5eead4");
    }

    // HUD labels
    ctx.font = "bold 9px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("PLAN VIEW  ·  major grid = 1m", 10, 10);
    ctx.textAlign = "right";
    const selLabel = selectedWallId ? "  ·  1 selected" : "";
    ctx.fillText(
      `${(vt.scale * 1000).toFixed(0)} px/m  ·  ${walls.length} wall${walls.length !== 1 ? "s" : ""}${selLabel}`,
      w - 10,
      10,
    );
  }, [
    size,
    vt,
    walls,
    allAssemblies,
    allMaterials,
    phase,
    startPt,
    mousePt,
    palette,
    activeTool,
    allTypes,
    selectedWallId,
  ]);

  // ── Stable helpers (read from refs) ───────────────────────────────────────

  const getSnapped = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const { w, h } = sizeRef.current;
      return snapPt(c2w([cx, cy], vtRef.current, w, h));
    },
    [],
  );

  const commitWall = useCallback(
    (sp: [number, number], ep: [number, number]) => {
      const pal = paletteRef.current;
      if (!pal.typeId) return;
      const type = allTypesRef.current.find((t) => t.id === pal.typeId);
      if (!type) return;

      const asm = pal.assemblyId
        ? allAssembliesRef.current.find((a) => a.id === pal.assemblyId)
        : undefined;

      // Thickness: prefer assembly's authoritative totalThickness, then type's nominal
      const thickness = asm?.totalThickness ?? type.nominalThickness ?? 230;
      // Height: nominalHeight = 0 means storey height → use 3000mm default
      const height =
        type.nominalHeight != null && type.nominalHeight > 0
          ? type.nominalHeight
          : 3000;

      const wall: WallInstance = {
        id: `wall-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        wallTypeId: pal.typeId,
        assemblyId: pal.assemblyId ?? null,
        startPoint: sp,
        endPoint: ep,
        height,
        thickness,
        createdAt: new Date().toISOString(),
      };

      addWallRef.current(wall);
      // Mark scene as dirty so the Save button lights up
      useWorkbenchStore.getState().setDirty(true);
    },
    [],
  );

  // ── Mouse handlers ─────────────────────────────────────────────────────────

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Middle mouse button → pan
      if (e.button === 1) {
        e.preventDefault();
        panOriginRef.current = {
          cx: e.clientX,
          cy: e.clientY,
          px: vtRef.current.panX,
          py: vtRef.current.panY,
        };
        isPanningRef.current = true;
        return;
      }
      if (e.button !== 0) return;

      const tool = activeToolRef.current;

      // PAN tool → left drag pans
      if (tool === "PAN") {
        panOriginRef.current = {
          cx: e.clientX,
          cy: e.clientY,
          px: vtRef.current.panX,
          py: vtRef.current.panY,
        };
        isPanningRef.current = true;
        return;
      }

      // SELECT tool — hit-test placed walls; use raw (unsnapped) world coords
      if (tool === "SELECT") {
        const rect = canvasRef.current!.getBoundingClientRect();
        const rawCx = e.clientX - rect.left;
        const rawCy = e.clientY - rect.top;
        const { w: sw, h: sh } = sizeRef.current;
        const worldPt = c2w([rawCx, rawCy], vtRef.current, sw, sh);
        const hit = wallsRef.current.find((wall) => pointInWall(worldPt, wall));
        setSelectedWallId(hit?.id ?? null);
        return;
      }

      if (tool !== "WALL") return;
      if (!paletteRef.current.typeId) return; // require a type to be selected

      const pt = getSnapped(e);

      if (phaseRef.current === "idle") {
        setPhase("placing");
        setStartPt(pt);
        setMousePt(pt);
      } else {
        // Second click — finalise wall
        const sp = startPtRef.current!;
        const dx = pt[0] - sp[0];
        const dy = pt[1] - sp[1];
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
          // Degenerate (sub-10mm) — cancel chain
          setPhase("idle");
          setStartPt(null);
          return;
        }
        commitWall(sp, pt);
        // Chain: new start = this end point
        setStartPt(pt);
        setMousePt(pt);
      }
    },
    [commitWall, getSnapped],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanningRef.current && panOriginRef.current) {
        const dx = e.clientX - panOriginRef.current.cx;
        const dy = e.clientY - panOriginRef.current.cy;
        setVt({
          ...vtRef.current,
          panX: panOriginRef.current.px + dx,
          panY: panOriginRef.current.py + dy,
        });
        return;
      }
      if (activeToolRef.current === "WALL") {
        setMousePt(getSnapped(e));
      }
    },
    [getSnapped],
  );

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || isPanningRef.current) {
      isPanningRef.current = false;
      panOriginRef.current = null;
    }
  }, []);

  const onDoubleClick = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phaseRef.current === "placing") {
        setPhase("idle");
        setStartPt(null);
      }
    },
    [],
  );

  const onMouseLeave = useCallback(() => {
    setMousePt(null);
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panOriginRef.current = null;
    }
  }, []);

  // ── Cursor style ──────────────────────────────────────────────────────────

  const cursor =
    activeTool === "WALL"
      ? "crosshair"
      : activeTool === "PAN"
        ? "grab"
        : "default";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#111827]">
      <canvas
        ref={canvasRef}
        width={size.w}
        height={size.h}
        style={{ display: "block", cursor }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onDoubleClick={onDoubleClick}
        onMouseLeave={onMouseLeave}
      />

      {/* ── HUD overlay messages ────────────────────────────────────────── */}

      {/* No type selected with WALL tool active */}
      {activeTool === "WALL" && !palette.typeId && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center">
          <span className="rounded-lg bg-amber-950/80 px-3 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-sm">
            Select a Wall Type from the palette first
          </span>
        </div>
      )}

      {/* Placement instruction */}
      {activeTool === "WALL" && palette.typeId && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center">
          <span className="rounded-lg bg-black/55 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
            {phase === "idle"
              ? "Click to set wall start point  ·  Scroll to zoom  ·  Middle-drag to pan"
              : "Click to set end point  ·  Double-click or Esc to finish chain"}
          </span>
        </div>
      )}

      {/* SELECT tool — nothing selected */}
      {activeTool === "SELECT" && !selectedWallId && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center">
          <span className="rounded-lg bg-black/55 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
            Click a wall to select it  ·  Esc to deselect
          </span>
        </div>
      )}

      {/* SELECT tool — wall selected */}
      {activeTool === "SELECT" && selectedWallId && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center">
          <span className="rounded-lg bg-teal-900/70 px-3 py-1.5 text-xs font-semibold text-teal-200 backdrop-blur-sm">
            Wall selected  ·  Esc to deselect
          </span>
        </div>
      )}

      {/* No tool active */}
      {!activeTool && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm font-semibold text-white/40">
              Select a tool from the toolbar
            </p>
            <p className="mt-1 text-xs text-white/25">
              Choose WALL to start placing walls
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
