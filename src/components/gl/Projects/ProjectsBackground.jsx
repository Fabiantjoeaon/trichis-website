/**
 * ProjectsBackground — TSL port of nine-ca ProjectsBackground.
 * Dot grid drifts with gridStore.xy (wheel / scroll deltas from ProjectsScene).
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  Color,
  MeshBasicNodeMaterial,
  RepeatWrapping,
  Vector2,
} from "three/webgpu";
import {
  Fn,
  float,
  uv,
  uniform,
  vec2,
  vec4,
  mix,
  texture as tslTexture,
} from "three/tsl";
import { gridStore } from "./stores";

function cssVar(name, fallback) {
  if (typeof document === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function buildBackgroundMaterial({ tGrid, bg, grid }) {
  const uBackgroundColor = uniform(new Color(bg));
  const uGridColor = uniform(new Color(grid));
  const uGridXY = uniform(new Vector2());
  const mapNode = tslTexture(tGrid);

  const material = new MeshBasicNodeMaterial();
  material.depthTest = false;
  material.depthWrite = false;

  material.fragmentNode = Fn(() => {
    const st = uv().toVar();
    let gridUV = st.mul(300).toVar();
    gridUV.x.assign(gridUV.x.mul(2.5));
    gridUV.assign(gridUV.add(uGridXY.mul(0.002)));
    const g = float(1).sub(mapNode.sample(gridUV).r);
    const final = mix(uBackgroundColor, uGridColor, g);
    return vec4(final, float(1));
  })();

  return { material, uBackgroundColor, uGridColor, uGridXY };
}

export default function ProjectsBackground() {
  const mesh = useRef();
  const tGrid = useTexture("/assets/projects_background_dots.jpg");

  useEffect(() => {
    tGrid.wrapS = tGrid.wrapT = RepeatWrapping;
  }, [tGrid]);

  const built = useMemo(
    () =>
      buildBackgroundMaterial({
        tGrid,
        bg: cssVar("--color-background", "#eaeaea"),
        grid: cssVar("--color-text", "#2B393B"),
      }),
    [tGrid],
  );

  useFrame(() => {
    const { xy } = gridStore.getState();
    built.uGridXY.value.x -= xy.x;
    built.uGridXY.value.y -= xy.y;
    built.uBackgroundColor.value.set(
      cssVar("--color-background", "#eaeaea"),
    );
    built.uGridColor.value.set(cssVar("--color-text", "#2B393B"));
  });

  return (
    <mesh
      ref={mesh}
      position-z={-0.1}
      frustumCulled={false}
      renderOrder={-10}
    >
      <planeGeometry args={[200, 100]} />
      <primitive object={built.material} attach="material" />
    </mesh>
  );
}
