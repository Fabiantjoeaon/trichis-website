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
import { howWeDoItTextScroll, howWeDoItTextTexture } from "./stores";

const sharedGeometry = new PlaneGeometry(1, 1, 32, 32);

function buildGlassMaterial({
  tMask,
  tBlurNoise,
  tBlurNoise2,
  themeColors,
  size,
}) {
  const uSize = uniform(new Vector2(size.x, size.y));
  const uOffset = uniform(0);
  const uRepeat = uniform(1);
  const maskNode = tslTexture(tMask);
  const noiseNode = tslTexture(tBlurNoise);
  const noise2Node = tslTexture(tBlurNoise2);
  // Own uniform nodes per material, backed by the shared Color instances
  // (TSL uniform nodes can't be shared across materials).
  const uBgColor = uniform(themeColors.bg);
  const uTextColor = uniform(themeColors.text);
  const uCardBorderColor = uniform(themeColors.border);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.depthTest = false;

  material.fragmentNode = Fn(() => {
    const st = uv();
    // Screen-space UV (parity with nine-ca gl_FragCoord / uResolution)
    const screen = viewportCoordinate.xy.div(max(viewportSize, vec2(1)));
    const screenUv = vec2(
      screen.x,
      st.y.mul(pow(float(0.84), st.y.mul(1.1))),
    ).toVar();
    // Mask-space UV: scrolled + aspect-correct repeat, lines up with the
    // section text plane behind the card
    const maskUv = vec2(
      screenUv.x.sub(0.0635).add(uOffset).mul(uRepeat),
      screenUv.y,
    ).toVar();

    // Noise sampled in screen space; displacement scaled into mask space so
    // the on-screen warp amplitude matches nine-ca
    const noise = noiseNode.sample(screenUv.mul(40)).xy.mul(0.1);
    const noise2 = noise2Node.sample(screenUv.mul(50)).xy.mul(0.05);
    const warped = maskUv.add(noise.add(noise2).mul(vec2(uRepeat, float(1))));

    // Reconstruct the render-target scene color (background + text) from
    // the transparent text mask, matching nine-ca's RenderTexture contents.
    const blurred = mix(uBgColor, uTextColor, maskNode.sample(warped).a);
    const sharp = mix(uBgColor, uTextColor, maskNode.sample(maskUv).a);
    const color = mix(blurred, sharp, float(0.5)).toVar();
    // nine-ca darkens by 0.9 in gamma space; the render pipeline already
    // outputs sRGB, so apply the linear-space equivalent (0.9^2.2)
    color.assign(color.mul(float(0.79)));

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

    const final = mix(color, uCardBorderColor, border);
    return vec4(final, max(inside, border));
  })();

  return { material, uSize, uOffset, uRepeat, maskNode };
}

export default function GlassCard({ i, transform, themeColors }) {
  const group = useRef();
  const texture = howWeDoItTextTexture();

  const tBlurNoise = useTexture("/assets/rgba-noise-medium.png");
  const tBlurNoise2 = useTexture("/assets/blue_noise_rgba_1024.jpg");

  useEffect(() => {
    tBlurNoise.wrapS = tBlurNoise.wrapT = RepeatWrapping;
    tBlurNoise2.wrapS = tBlurNoise2.wrapT = RepeatWrapping;
  }, [tBlurNoise, tBlurNoise2]);

  const size = {
    x: transform?.rect?.width || transform?.scale?.x || 1,
    y: transform?.rect?.height || transform?.scale?.y || 1,
  };

  const built = useMemo(() => {
    if (!texture || !themeColors) return null;
    return buildGlassMaterial({
      tMask: texture,
      tBlurNoise,
      tBlurNoise2,
      themeColors,
      size,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, tBlurNoise, tBlurNoise2, themeColors]);

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
    if (tex && built.maskNode.value !== tex) {
      built.maskNode.value = tex;
    }
    const { offset, repeat } = howWeDoItTextScroll.getState();
    built.uOffset.value = offset;
    built.uRepeat.value = repeat;
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
