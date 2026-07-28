import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useCanvasStore } from "@/lib/gl/canvasStore";

const DEFAULT_FOV = 50;

/**
 * Perspective camera sized so 1 world unit ≈ 1 CSS pixel × scaleMultiplier
 * (scroll-rig PerspectiveCamera pattern).
 */
export default function ScrollCamera({ makeDefault = true, margin = 0, fov: fovProp, ...props }) {
  const set = useThree((s) => s.set);
  const defaultCamera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const scaleMultiplier = useCanvasStore((s) => s.scaleMultiplier);
  const pageReflow = useCanvasStore((s) => s.pageReflow);
  const cameraRef = useRef();

  const { fov, distance, aspect } = useMemo(() => {
    const height = (size.height + margin * 2) * scaleMultiplier;
    const width = (size.width + margin * 2) * scaleMultiplier;
    const aspect = width / Math.max(height, 1);
    const fov = fovProp || DEFAULT_FOV;
    const ratio = Math.tan(((fov / 2) * Math.PI) / 180) * 2;
    const distance = height / Math.max(ratio, 0.0001);
    return { fov, distance, aspect };
  }, [size, scaleMultiplier, pageReflow, margin, fovProp]);

  useLayoutEffect(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.aspect = aspect;
    cam.fov = fov;
    cam.near = 0.1;
    cam.far = distance * 2;
    cam.position.set(0, 0, distance);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }, [fov, distance, aspect, pageReflow]);

  useLayoutEffect(() => {
    if (!makeDefault || !cameraRef.current) return;
    const prev = defaultCamera;
    set({ camera: cameraRef.current });
    return () => set({ camera: prev });
  }, [makeDefault, set, defaultCamera]);

  return (
    <perspectiveCamera
      ref={cameraRef}
      args={[fov, aspect, 0.1, distance * 2]}
      position={[0, 0, distance]}
      {...props}
    />
  );
}
