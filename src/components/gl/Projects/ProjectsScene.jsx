/**
 * ProjectsScene — simplified TSL port of nine-ca ProjectsScene.
 * Shortcuts vs full infinite 3D masonry tile grid:
 * - DOM ProjectsGrid handles cards; this scene provides the drifting dot
 *   background + light parallax plane field for atmosphere.
 * - No ProjectTile GLSL shaders / gaze camera / service snap scroll.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  MeshBasicNodeMaterial,
  Vector2,
} from "three/webgpu";
import { Fn, float, uv, uniform, vec4, mix, sin, time } from "three/tsl";
import ProjectsBackground from "./ProjectsBackground";
import { gridStore } from "./stores";

function cssVar(name, fallback) {
  if (typeof document === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function approach(current, target, smoothTime, dt) {
  const t = 1 - Math.exp((-1 / Math.max(smoothTime, 0.0001)) * dt);
  return current + (target - current) * t;
}

function TileField({ count = 24 }) {
  const group = useRef();
  const accent = cssVar("--color-accent", "#00FFC2");

  const material = useMemo(() => {
    const uColor = uniform(new Color(accent));
    const uAlpha = uniform(0.12);
    const mat = new MeshBasicNodeMaterial();
    mat.transparent = true;
    mat.depthWrite = false;
    mat.fragmentNode = Fn(() => {
      const st = uv();
      const edge = st.x.mul(st.y).mul(float(1).sub(st.x)).mul(float(1).sub(st.y)).mul(16);
      const pulse = sin(time.mul(0.6).add(st.x.mul(4))).mul(0.5).add(0.5);
      return vec4(uColor, uAlpha.mul(edge).mul(mix(float(0.6), float(1), pulse)));
    })();
    return { mat, uColor };
  }, [accent]);

  const tiles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const col = i % 6;
      const row = (i / 6) | 0;
      return {
        key: i,
        position: [(col - 2.5) * 18, (row - 1.5) * 14, -2 - (i % 3)],
        scale: [10 + (i % 3) * 2, 7 + (i % 2) * 2, 1],
      };
    });
  }, [count]);

  useFrame(() => {
    if (!group.current) return;
    const { xy } = gridStore.getState();
    group.current.position.x += xy.x * 0.02;
    group.current.position.y += xy.y * 0.02;
    material.uColor.value.set(cssVar("--color-accent", "#00FFC2"));
  });

  return (
    <group ref={group}>
      {tiles.map((t) => (
        <mesh
          key={t.key}
          position={t.position}
          scale={t.scale}
          material={material.mat}
          frustumCulled={false}
        >
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
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

  return (
    <>
      <ProjectsBackground />
      <TileField />
    </>
  );
}
