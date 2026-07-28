/**
 * GlassCard — TSL port of nine-ca GlassCard.
 * Shortcuts: scene refraction samples a scrolling canvas text texture (not a
 * live RenderTexture of troika GLText); blur is a lightweight noise warp +
 * dual sample instead of full gaussianBlur9 FBO path.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  Color,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Vector2,
} from "three/webgpu";
import {
  Fn,
  float,
  uv,
  uniform,
  vec2,
  vec3,
  vec4,
  mix,
  texture as tslTexture,
  abs,
  max,
  min,
  length,
  fwidth,
  smoothstep,
  pow,
  viewportCoordinate,
  viewportSize,
} from "three/tsl";
import { howWeDoItTextTexture } from "./stores";

const sharedGeometry = new PlaneGeometry(1, 1, 32, 32);

function cssVar(name, fallback) {
  if (typeof document === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function buildGlassMaterial({ tScene, tBlurNoise, tBlurNoise2, borderColor, size }) {
  const uBorderColor = uniform(new Color(borderColor));
  const uSize = uniform(new Vector2(size.x, size.y));
  const sceneNode = tslTexture(tScene);
  const noiseNode = tslTexture(tBlurNoise);
  const noise2Node = tslTexture(tBlurNoise2);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;

  material.fragmentNode = Fn(() => {
    const st = uv();
    // Screen-space UV (parity with nine-ca gl_FragCoord / uResolution)
    const screen = viewportCoordinate.xy.div(max(viewportSize, vec2(1)));
    let uuv = vec2(
      screen.x.sub(0.0635),
      st.y.mul(pow(float(0.84), st.y.mul(1.1))),
    ).toVar();

    const noise = noiseNode.sample(uuv.mul(40)).xy.mul(0.1);
    const noise2 = noise2Node.sample(uuv.mul(50)).xy.mul(0.05);
    const warped = uuv.add(noise).add(noise2);

    const blurred = sceneNode.sample(warped).rgb;
    const sharp = sceneNode.sample(uuv).rgb;
    let color = mix(blurred, sharp, float(0.5)).toVar();
    color.assign(pow(color, vec3(0.4545)).mul(0.9));

    const radius = float(10);
    const thickness = float(1);
    const multiplier = max(uSize.x, uSize.y);
    const ratio = uSize.div(multiplier);
    const squareUv = st.mul(2).sub(1).mul(ratio);
    const squareThickness = thickness.div(multiplier);
    const squareRadius = radius.mul(2).div(multiplier);
    const boxSize = ratio.sub(vec2(squareRadius.add(squareThickness)));
    const q = abs(squareUv).sub(boxSize);
    const d = min(max(q.x, q.y), float(0))
      .add(length(max(q, float(0))))
      .sub(squareRadius);
    const dist = abs(d);
    const delta = fwidth(dist);
    const border = float(1).sub(
      smoothstep(delta.negate(), delta, dist.sub(squareThickness)),
    );
    const deltaD = fwidth(d);
    const inside = float(1).sub(
      smoothstep(deltaD.negate(), deltaD, d.sub(squareThickness.mul(0.5))),
    );

    const final = mix(color, uBorderColor, border);
    return vec4(final, inside);
  })();

  return { material, uBorderColor, uSize, sceneNode };
}

export default function GlassCard({ i, transform }) {
  const group = useRef();
  const themeTick = useRef(0);
  const texture = howWeDoItTextTexture();

  const tBlurNoise = useTexture("/assets/rgba-noise-medium.png");
  const tBlurNoise2 = useTexture("/assets/blue_noise_rgba_1024.jpg");

  useEffect(() => {
    tBlurNoise.wrapS = tBlurNoise.wrapT = RepeatWrapping;
    tBlurNoise2.wrapS = tBlurNoise2.wrapT = RepeatWrapping;
  }, [tBlurNoise, tBlurNoise2]);

  const borderColor = cssVar("--color-text", "#2B393B");
  const size = {
    x: transform?.rect?.width || transform?.scale?.x || 1,
    y: transform?.rect?.height || transform?.scale?.y || 1,
  };

  const built = useMemo(() => {
    if (!texture) return null;
    return buildGlassMaterial({
      tScene: texture,
      tBlurNoise,
      tBlurNoise2,
      borderColor,
      size,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, tBlurNoise, tBlurNoise2]);

  useEffect(() => {
    if (!built || !transform) return;
    built.uSize.value.set(
      transform.rect?.width || transform.scale.x,
      transform.rect?.height || transform.scale.y,
    );
  }, [built, transform]);

  useFrame(() => {
    if (!built) return;
    const tex = howWeDoItTextTexture.getState();
    if (tex && built.sceneNode.value !== tex) {
      built.sceneNode.value = tex;
    }
    // Refresh border color occasionally for theme switches
    themeTick.current += 1;
    if (themeTick.current % 30 === 0) {
      built.uBorderColor.value.set(cssVar("--color-text", "#2B393B"));
    }
  });

  if (!transform?.scale || !built) return null;

  return (
    <group
      ref={group}
      scale={[transform.scale.x, transform.scale.y, (transform.scale.z || 1) * 520]}
      position={[transform.position.x, 0, transform.position.z || 0]}
    >
      <mesh
        geometry={sharedGeometry}
        material={built.material}
        renderOrder={100}
        frustumCulled={false}
      />
    </group>
  );
}
