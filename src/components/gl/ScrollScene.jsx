import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTracker } from "@/lib/gl/useTracker";

/**
 * Positions children over a tracked DOM element while scrolling.
 * Drop-in replacement for r3f-scroll-rig ScrollScene (no scissor).
 *
 * Like nine-ca's scroll-rig: the element rect is measured on resize/reflow
 * and the per-frame position derives from the Lenis scroll value, so GL stays
 * in sync with what Lenis paints without forcing layout every frame.
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
  const { scale, position, bounds, scrollState, inViewport, update } =
    useTracker(track, {
      rootMargin: inViewportMargin,
      autoUpdate: false,
    });

  useFrame(() => {
    const group = contentRef.current;
    if (!group || !track?.current) return;

    update();

    const w = window.innerWidth;
    const h = window.innerHeight;
    const inView =
      bounds.bottom > 0 && bounds.top < h && bounds.right > 0 && bounds.left < w;

    if (overrideVisible) {
      group.visible = true;
    } else if (hideOffscreen) {
      group.visible = inView && visible;
    } else {
      group.visible = visible;
    }

    if (!group.visible && hideOffscreen && !overrideVisible) return;

    group.position.x = position.x;
    group.position.y = position.y;
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
