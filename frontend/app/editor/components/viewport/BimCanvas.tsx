"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Loader2 } from "lucide-react";
import BimScene from "./BimScene";
import { useSceneStore } from "../../stores/sceneStore";
import { useViewerStore } from "../../stores/viewerStore";

// ── WebGL support check ───────────────────────────────────────────────────────

function canUseWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// ── Viewport loading overlay ──────────────────────────────────────────────────

function ViewportLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#050302]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#5a3e22]" />
        <p className="text-xs text-[#5a3e22]">Initialising viewport…</p>
      </div>
    </div>
  );
}

// ── Viewport fallback (no WebGL) ──────────────────────────────────────────────

function NoWebGL() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#050302]">
      <div className="rounded-2xl border border-[#2b1e12] bg-[#110e0a] p-8 text-center">
        <p className="text-base font-bold text-[#f87171]">WebGL not available</p>
        <p className="mt-2 text-sm text-[#7a5e3e]">
          Enable hardware acceleration in your browser settings to use the BIM Editor.
        </p>
      </div>
    </div>
  );
}

// ── Main canvas ───────────────────────────────────────────────────────────────

export default function BimCanvas() {
  const loadMockScene = useSceneStore((s) => s.loadMockScene);
  const activeProjectId = useSceneStore((s) => s.activeProjectId);
  const renderMode = useViewerStore((s) => s.renderMode);
  const hasWebGL = typeof window !== "undefined" ? canUseWebGL() : true;

  // Load mock scene on first mount if no real project loaded
  useEffect(() => {
    if (!activeProjectId) {
      loadMockScene();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasWebGL) return <NoWebGL />;

  return (
    <div className="relative h-full w-full bg-[#050302]">
      <Canvas
        shadows
        camera={{ position: [20, 14, 20], fov: 55, near: 0.1, far: 2000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        style={{ background: "#070503" }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <BimScene />
        </Suspense>
      </Canvas>

      {/* Viewport info overlay */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2">
        <span className="rounded border border-[#2b1e12] bg-[#0e0b07]/80 px-2 py-0.5 font-mono text-[9px] text-[#5a3e22] backdrop-blur-sm">
          PERSPECTIVE · {renderMode}
        </span>
      </div>

      {/* Origin indicator */}
      <div className="pointer-events-none absolute right-3 top-3 text-[9px] font-mono text-[#3a2410]">
        DEMO SCENE
      </div>
    </div>
  );
}
