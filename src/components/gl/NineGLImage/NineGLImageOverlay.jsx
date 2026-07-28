import { forwardRef, useImperativeHandle, useRef } from "react";
import { useTexture } from "@react-three/drei";
import useAnimation from "@/hooks/useAnimation";
import { map } from "@/lib/math";

const SIZE = 0.5;

const NineGLImageOverlay = forwardRef(function NineGLImageOverlay(
  { z = 0.25, scale, ...props },
  ref,
) {
  const overlay = useRef();
  const tArrow = useTexture("/assets/arrow_light.png");

  const maxScale = 0.35;
  const aspect = scale ? scale.x / scale.y : 1;

  const onUpdateOverlay = (v) => {
    if (!overlay.current) return;
    overlay.current.scale.set(v * maxScale, v * maxScale * aspect, 1);
    overlay.current.rotation.set(0, 0, map(v, 0, 1, 0.6, 0));
    overlay.current.material.opacity = v;
  };

  const { animateIn: animateOverlayIn, animateOut: animateOverlayOut } =
    useAnimation({
      inParams: { duration: 0.7, onUpdate: onUpdateOverlay, delay: 0.1 },
      outParams: { duration: 0.5, onUpdate: onUpdateOverlay },
    });

  useImperativeHandle(ref, () => ({
    animateIn: animateOverlayIn,
    animateOut: animateOverlayOut,
  }));

  return (
    <group {...props}>
      <mesh scale={[0, 0, 0]} renderOrder={2} position-z={z} ref={overlay}>
        <planeGeometry args={[SIZE, SIZE]} />
        <meshBasicMaterial transparent map={tArrow} />
      </mesh>
    </group>
  );
});

export default NineGLImageOverlay;
