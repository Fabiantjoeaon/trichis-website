/**
 * ProjectsScene — simplified TSL port of nine-ca ProjectsScene.
 * DOM cards handle the projects; this scene provides the drifting dot
 * background (no infinite 3D masonry / gaze camera / snap scroll).
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector2 } from "three/webgpu";
import ProjectsBackground from "./ProjectsBackground";
import { gridStore } from "./stores";

function approach(current, target, smoothTime, dt) {
  const t = 1 - Math.exp((-1 / Math.max(smoothTime, 0.0001)) * dt);
  return current + (target - current) * t;
}

export default function ProjectsScene() {
  const toXY = useRef({ x: 0, y: 0 });
  const xy = useMemo(() => new Vector2(), []);

  useEffect(() => {
    const onWheel = (e) => {
      gridStore.setState({
        scrollState: { delta: [e.deltaX, e.deltaY] },
      });
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const { scrollState } = gridStore.getState();
    if (scrollState?.delta) {
      toXY.current = {
        x: scrollState.delta[0] * 0.5 * -1,
        y: scrollState.delta[1] * 0.5,
      };
      // Consume so it doesn't keep accelerating
      gridStore.setState({ scrollState: null });
    } else {
      toXY.current.x = approach(toXY.current.x, 0, 0.25, dt);
      toXY.current.y = approach(toXY.current.y, 0, 0.25, dt);
    }

    xy.x = approach(xy.x, toXY.current.x, 0.3, dt);
    xy.y = approach(xy.y, toXY.current.y, 0.3, dt);
    gridStore.setState({ xy });
  });

  return <ProjectsBackground />;
}
