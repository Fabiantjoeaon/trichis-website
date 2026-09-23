import { Suspense, useEffect } from "react";
import { Canvas as R3FCanvas, extend } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { createWebGpuRenderer } from "@/lib/gl/createWebGpuRenderer";
import { useCanvasStore } from "@/lib/gl/canvasStore";
import { useGlobalStore } from "@/stores/global";
import ScrollCamera from "./ScrollCamera";
import { CanvasChildren } from "./UseCanvas";
import GLBackground from "./GLBackground";

// Register three/webgpu constructors as R3F JSX elements (meshBasicNodeMaterial, …)
extend(THREE);

function ReflowOnResize() {
  useEffect(() => {
    let raf = 0;
    const reflow = () => {
      cancelAnimationFrame(raf);
      // Wait two frames so vw-rem layout and Lenis internals settle, then
      // remasure every ScrollScene / HowWeDoIt card (nine-ca pageReflow).
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => {
          useGlobalStore.getState().lenis?.resize?.();
          useCanvasStore.getState().triggerReflow();
        });
      });
    };
    window.addEventListener("resize", reflow);

    const observer = new ResizeObserver(reflow);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("resize", reflow);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
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
