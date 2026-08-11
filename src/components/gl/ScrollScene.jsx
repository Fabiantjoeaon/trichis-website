import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTracker } from "@/lib/gl/useTracker";
import { useCanvasStore } from "@/lib/gl/canvasStore";

/**
 * Positions children over a tracked DOM element while scrolling.
 * Drop-in replacement for r3f-scroll-rig ScrollScene (no scissor).
 *
 * Uses live getBoundingClientRect each frame so Lenis / layout shifts
 * can't leave GL planes stuck on the fixed canvas.
 */
export default function ScrollScene({
  track,
  children,
  hideOffscreen = true,
  visible = true,
  overrideVisible = false,
  inViewportMargin = "0px",
  ...props
}) {
  const contentRef = useRef();
  const scaleMultiplier = useCanvasStore((s) => s.scaleMultiplier);
  const { scale, scrollState, inViewport } = useTracker(track, {
    rootMargin: inViewportMargin,
  });

  useFrame(() => {
    const group = contentRef.current;
    const el = track?.current;
    if (!group || !el) return;

    const r = el.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const inView = r.bottom > 0 && r.top < h && r.right > 0 && r.left < w;

    if (overrideVisible) {
      group.visible = true;
    } else if (hideOffscreen) {
      group.visible = inView && visible;
    } else {
      group.visible = visible;
    }

    if (!group.visible && hideOffscreen && !overrideVisible) return;

    const sm = scaleMultiplier;
    group.position.x = (r.left + r.width * 0.5 - w * 0.5) * sm;
    group.position.y = -(r.top + r.height * 0.5 - h * 0.5) * sm;
  });

  if (!scale.x || !scale.y) return null;

  return (
    <group ref={contentRef} {...props}>
      {typeof children === "function"
        ? children({
            track,
            scale,
            scrollState,
            inViewport,
            ...props,
          })
        : children}
    </group>
  );
}
