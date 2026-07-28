import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTracker } from "@/lib/gl/useTracker";

/**
 * Positions children over a tracked DOM element while scrolling.
 * Drop-in replacement for r3f-scroll-rig ScrollScene (no scissor).
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
  const { scale, position, scrollState, inViewport } = useTracker(track, {
    rootMargin: inViewportMargin,
  });

  useEffect(() => {
    if (!contentRef.current) return;
    if (overrideVisible) {
      contentRef.current.visible = true;
    } else {
      contentRef.current.visible = hideOffscreen
        ? inViewport && visible
        : visible;
    }
  }, [inViewport, hideOffscreen, visible, overrideVisible]);

  useFrame(() => {
    if (!contentRef.current) return;
    contentRef.current.position.x = position.x;
    contentRef.current.position.y = position.y;
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
