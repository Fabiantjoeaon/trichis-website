/**
 * HeroGrid — TSL port of nine-ca HomeHero/HeroGrid.
 *
 * Shortcuts vs original GPGPU simulator:
 * - No FBO ping-pong / useSimulator; per-instance values damp on CPU toward a
 *   canvas text mask (same look: accent tiles spell the brand glyph).
 * - Brand mask via 2D canvas texture instead of RenderTexture + troika GLText.
 * - Mouse proximity boosts tile value (original influence path was mostly unused).
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  Object3D,
  PlaneGeometry,
  MeshBasicNodeMaterial,
  Vector2,
} from "three/webgpu";
import {
  attribute,
  float,
  Fn,
  mix,
  sin,
  cos,
  step,
  abs,
  uv,
  uniform,
  vec3,
  vec4,
  time,
  positionLocal,
} from "three/tsl";
import { roundedBorder } from "@/lib/gl/shaderChunks";
import { clamp, map } from "@/lib/math";
import { mouseState } from "@/lib/mouse";
import { useGlobalStore } from "@/stores/global";
import { createTextMask, sampleMask } from "./createTextMask";

const GAP = 2;
const SIZE = 14;
const TOTAL_ITEM_WIDTH = SIZE + GAP;
const sharedGeometry = new PlaneGeometry(SIZE, SIZE);

const THEME_COLORS = {
  light: {
    background: "#eaeaea",
    heroGridSecondary: "#333e40",
    accent: "#00FFC2",
    accent2: "#ffd4e5",
  },
  dark: {
    background: "#2B393B",
    heroGridSecondary: "#333e40",
    accent: "#376A5D",
    accent2: "#ffd4e5",
  },
};

function getDimensions(scale) {
  const amountX = Math.max(1, Math.floor(scale.x / TOTAL_ITEM_WIDTH));
  const amountY = Math.max(1, Math.floor(scale.y / TOTAL_ITEM_WIDTH));
  return { amountX, amountY, total: amountX * amountY };
}

function cssVar(name, fallback) {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

function damp(target, current, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function buildHeroMaterial({ colors }) {
  const uGridColor = uniform(new Color(colors.background));
  const uGridColor2 = uniform(new Color(colors.heroGridSecondary));
  const uAccentColor = uniform(new Color(colors.accent));
  const uAccentColor2 = uniform(new Color(colors.accent2));
  const uSize = uniform(new Vector2(SIZE, SIZE));

  const aValue = attribute("aValue", "float");
  const aRandom = attribute("aRandom", "vec4");

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.depthTest = false;
  material.side = DoubleSide;

  material.positionNode = Fn(() => {
    const n = aValue;
    const shouldRotate = step(aRandom.y, float(0.5));
    const angle = n.mul(6.28).mul(shouldRotate);
    const c = cos(angle);
    const s = sin(angle);
    const p = positionLocal;
    return vec3(p.x.mul(c).add(p.z.mul(s)), p.y, p.z.mul(c).sub(p.x.mul(s)));
  })();

  material.fragmentNode = Fn(() => {
    const st = uv();
    const border = roundedBorder(float(0), float(4.1), st, uSize);
    const a = border.y;

    const gt = aRandom.x.mul(0.8);
    const gray = abs(sin(time.mul(gt)));
    let gridColor = mix(uGridColor2, uGridColor, gray).toVar();
    gridColor.assign(mix(uGridColor, gridColor, float(0.3)));

    let accent = mix(
      vec3(0, 1, 1).mul(0.9),
      uAccentColor.mul(0.9),
      aRandom.z,
    ).toVar();
    accent.assign(mix(accent, uAccentColor2, step(float(0.8), aRandom.y)));

    const active = float(1).sub(step(aValue, float(0.01)));
    let color = mix(gridColor, accent, active).toVar();
    color.assign(color.sub(aValue.mul(0.2)));

    return vec4(color, a);
  })();

  return {
    material,
    uniforms: { uGridColor, uGridColor2, uAccentColor, uAccentColor2, uSize },
  };
}

export default function HeroGrid({ scale, brandText = "trichis", brandMobile = "t" }) {
  const group = useRef();
  const mesh = useRef();
  const valuesRef = useRef(null);
  const refsRef = useRef(null);
  const randomsRef = useRef(null);
  const maskRef = useRef(null);
  const builtRef = useRef(null);

  const theme = useGlobalStore((s) => s.theme) || "light";
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);

  const { amountX, amountY, total } = useMemo(
    () => getDimensions(scale || { x: 1, y: 1 }),
    [scale?.x, scale?.y],
  );

  const colors = useMemo(() => {
    const base = THEME_COLORS[theme] || THEME_COLORS.light;
    return {
      background: cssVar("--color-background", base.background),
      heroGridSecondary: cssVar(
        "--color-heroGridSecondary",
        base.heroGridSecondary,
      ),
      accent: cssVar("--color-accent", base.accent),
      accent2: cssVar("--color-accent2", base.accent2),
    };
  }, [theme]);

  const built = useMemo(() => buildHeroMaterial({ colors }), [colors]);

  useEffect(() => {
    builtRef.current = built;
    built.uniforms.uGridColor.value.set(colors.background);
    built.uniforms.uGridColor2.value.set(colors.heroGridSecondary);
    built.uniforms.uAccentColor.value.set(colors.accent);
    built.uniforms.uAccentColor2.value.set(colors.accent2);
  }, [built, colors]);

  useEffect(() => {
    maskRef.current?.dispose?.();
    maskRef.current = createTextMask({
      text: brandText,
      mobileText: brandMobile,
      isMobile: isMobileLayout,
      size: 128,
    });
    return () => {
      maskRef.current?.dispose?.();
      maskRef.current = null;
    };
  }, [brandText, brandMobile, isMobileLayout]);

  useEffect(() => {
    const m = mesh.current;
    if (!m || !scale?.x || !scale?.y) return;

    const dummy = new Object3D();
    const reference = new Float32Array(total * 2);
    const random = new Float32Array(total * 4);
    const values = new Float32Array(total);

    const cols = amountX;
    const rows = amountY;
    const totalWidth = (cols - 1) * TOTAL_ITEM_WIDTH;
    const totalHeight = (rows - 1) * TOTAL_ITEM_WIDTH;

    for (let i = 0, j = 0; i < total; i++, j += 2) {
      const col = i % cols;
      const row = (i - col) / cols;
      dummy.position.set(col * TOTAL_ITEM_WIDTH, row * TOTAL_ITEM_WIDTH, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);

      reference[j] = map(col, 0, cols, 0, 1);
      reference[j + 1] = map(row, 0, rows, 0, 1);
    }

    for (let i = 0; i < total * 4; i++) random[i] = Math.random();

    m.geometry.setAttribute(
      "aReference",
      new InstancedBufferAttribute(reference, 2),
    );
    m.geometry.setAttribute(
      "aRandom",
      new InstancedBufferAttribute(random, 4),
    );
    m.geometry.setAttribute(
      "aValue",
      new InstancedBufferAttribute(values, 1),
    );
    m.instanceMatrix.needsUpdate = true;
    m.count = total;

    if (group.current) {
      group.current.position.set(-totalWidth / 2, -totalHeight / 2, 0);
    }

    valuesRef.current = values;
    refsRef.current = reference;
    randomsRef.current = random;
  }, [amountX, amountY, total, scale?.x, scale?.y]);

  useFrame((_, delta) => {
    const values = valuesRef.current;
    const refs = refsRef.current;
    const randoms = randomsRef.current;
    const maskData = maskRef.current;
    const m = mesh.current;
    if (!values || !refs || !maskData || !m) return;

    const mx = mouseState.normalized.x * 0.5 + 0.5;
    const my = mouseState.normalized.y * 0.5 + 0.5;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < values.length; i++) {
      const u = refs[i * 2];
      const v = refs[i * 2 + 1];
      const mask = sampleMask(maskData.mask, maskData.size, u, v);
      const dx = (u - mx) / 0.08;
      const dy = (v - my) / 0.08;
      const influence = clamp(Math.cos(Math.min(Math.hypot(dx, dy), Math.PI)) + 1, 0, 2) * 0.35;
      const target = Math.max(mask, influence);
      const lambda = Math.max(randoms[i * 4], 0.1) * 8;
      values[i] = damp(target, values[i], lambda, dt);
    }

    const attr = m.geometry.getAttribute("aValue");
    if (attr) attr.needsUpdate = true;
  });

  if (!scale?.x || !scale?.y) return null;

  return (
    <group ref={group}>
      <instancedMesh
        ref={mesh}
        args={[sharedGeometry, built.material, total]}
        frustumCulled={false}
      />
    </group>
  );
}
