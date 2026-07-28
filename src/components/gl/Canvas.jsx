import { Suspense, useEffect } from "react";
import { Canvas as R3FCanvas, extend } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { createWebGpuRenderer } from "@/lib/gl/createWebGpuRenderer";
import { useCanvasStore } from "@/lib/gl/canvasStore";
import ScrollCamera from "./ScrollCamera";
import { CanvasChildren } from "./UseCanvas";
import GLBackground from "./GLBackground";

// Register three/webgpu constructors as R3F JSX elements (meshBasicNodeMaterial, …)
extend(THREE);

function ReflowOnResize() {
  useEffect(() => {
    const onResize = () => useCanvasStore.getState().triggerReflow();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return null;
}

/**
 * Fixed fullscreen WebGPU canvas (WebGL2 fallback).
 * Hosts GLBackground wipe + UseCanvas children (NineGLImage, etc.).
 */
export default function GLCanvas({ style, ...props }) {
  return (
    <div className="gl-canvas-root" style={style}>
      <R3FCanvas
        className="gl-canvas"
        flat
        dpr={[1, 1.5]}
        gl={createWebGpuRenderer}
        camera={{ manual: true }}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100%",
          pointerEvents: "none",
          zIndex: 7,
        }}
        eventSource={typeof document !== "undefined" ? document.documentElement : undefined}
        eventPrefix="client"
        {...props}
      >
        <ScrollCamera makeDefault />
        <ReflowOnResize />
        <Suspense fallback={null}>
          <GLBackground />
          <CanvasChildren />
        </Suspense>
      </R3FCanvas>
    </div>
  );
}
