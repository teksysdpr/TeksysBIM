"use client";

import { useRef } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useSceneStore, selectLevels, selectElementsForLevel } from "../../stores/sceneStore";
import { useViewerStore } from "../../stores/viewerStore";
import { useWorkbenchStore } from "../../stores/workbenchStore";
import { levelYOffset } from "../../lib/entityUtils";
import { LEVEL_COLORS, WALL_COLOR, SLAB_COLOR_DEFAULT, SELECTED_COLOR, HOVERED_COLOR } from "../../lib/mockScene";
import type { BimEntity } from "../../types/model";

// ── Single element mesh ───────────────────────────────────────────────────────

function ElementMesh({ entity, yOffset }: { entity: BimEntity; yOffset: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { selectedIds, hoveredId, setHovered, setSelection, activeTool } = useWorkbenchStore();
  const { setVisibility } = useSceneStore();

  const geo = entity.geometry;
  if (!geo) return null;
  if (geo.def.primitive !== "BOX") return null;

  const isSelected = selectedIds.includes(entity.id);
  const isHovered  = hoveredId === entity.id;

  const baseColor =
    entity.category === "WALL" || entity.category === "CURTAIN_WALL"
      ? WALL_COLOR
      : entity.category === "SLAB" || entity.category === "ROOF"
      ? SLAB_COLOR_DEFAULT
      : "#9ca3af";

  const meshColor = isSelected
    ? SELECTED_COLOR
    : isHovered
    ? HOVERED_COLOR
    : baseColor;

  const [px, py, pz] = geo.transform.position;
  const { width: w, depth: d, height: h } = geo.def;

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (activeTool !== "SELECT") return;
    if (entity.locked) return;
    if (e.nativeEvent.shiftKey) {
      useWorkbenchStore.getState().toggleSelection(entity.id);
    } else {
      setSelection([entity.id]);
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={[px, py + yOffset, pz]}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(entity.id); }}
      onPointerOut={() => setHovered(null)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={meshColor}
        transparent={isSelected || isHovered ? false : true}
        opacity={0.9}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}

// ── Level group ───────────────────────────────────────────────────────────────

function LevelGroup({ levelId, index }: { levelId: string; index: number }) {
  const entities = useSceneStore((s) => s.entities);
  const { viewMode, activeLevelId, explodeSpacing } = useViewerStore();

  const level = entities[levelId];
  if (!level) return null;

  const elevation = Number(level.properties.elevation ?? 0);
  const height    = Number(level.properties.height ?? 3.2);

  const isSoloMode   = viewMode === "SOLO";
  const isActiveLvl  = activeLevelId === levelId;
  const hidden       = isSoloMode && !isActiveLvl;

  if (hidden) return null;

  const yOff = levelYOffset(elevation, index, height, viewMode, explodeSpacing);
  const elements = selectElementsForLevel(entities, levelId);

  return (
    <group name={`level-${level.properties.number}`}>
      {elements.map((el) => (
        <ElementMesh key={el.id} entity={el} yOffset={yOff - elevation} />
      ))}
    </group>
  );
}

// ── Scene root ────────────────────────────────────────────────────────────────

export default function BimScene() {
  const entities = useSceneStore((s) => s.entities);
  const { showGrid, showAxes } = useViewerStore();
  const { clearSelection } = useWorkbenchStore();

  const levels = selectLevels(entities);

  return (
    <>
      {/* Controls */}
      <OrbitControls
        makeDefault
        target={[0, 5, 0]}
        maxPolarAngle={Math.PI / 2 + 0.3}
        enableDamping
        dampingFactor={0.06}
      />

      {/* Lighting */}
      <ambientLight intensity={0.45} color="#ffeedd" />
      <directionalLight
        position={[20, 30, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        color="#fff8f0"
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} color="#c0d0ff" />

      {/* Ground grid */}
      {showGrid && (
        <Grid
          args={[80, 80]}
          position={[0, -0.01, 0]}
          cellSize={1}
          cellThickness={0.4}
          sectionSize={5}
          sectionThickness={0.8}
          cellColor="#2b1e12"
          sectionColor="#4a2e12"
          fadeDistance={60}
          fadeStrength={1}
          infiniteGrid
        />
      )}

      {/* Axes helper */}
      {showAxes && <axesHelper args={[5]} />}

      {/* Ground plane (for shadow catch + click-to-deselect) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
        onClick={() => clearSelection()}
      >
        <planeGeometry args={[200, 200]} />
        <shadowMaterial opacity={0.25} />
      </mesh>

      {/* Building levels */}
      {levels.map((level, i) => (
        <LevelGroup key={level.id} levelId={level.id} index={i} />
      ))}
    </>
  );
}
