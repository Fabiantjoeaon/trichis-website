/**
 * HowWeDoItScene — TSL port of nine-ca HowWeDoItScene.
 * Shortcuts:
 * - Scrolling brand text is a canvas-texture strip (troika GLText is WebGL-bound).
 * - No live RenderTexture of orthographic GLText + colored plane; cards sample
 *   the canvas strip via howWeDoItTextTexture store.
 * - Mobile drag uses pointer events on the DOM wrapper (no @use-gesture).
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  LinearFilter,
  MeshBasicNodeMaterial,
  NoColorSpace,
  RepeatWrapping,
} from "three/webgpu";
import { Fn, uv, uniform, texture as tslTexture } from "three/tsl";
import useEvent from "@/hooks/useEvent";
import useAnimation from "@/hooks/useAnimation";
import { clamp, lerp, map } from "@/lib/math";
import { events } from "@/lib/events";
import { useGlobalStore } from "@/stores/global";
import GlassCard from "./GlassCard";
import {
  howWeDoItProgress,
  howWeDoItScale,
  howWeDoItStore,
  howWeDoItTextTexture,
  howWeDoItX,
  minScale,
} from "./stores";

function cssVar(name, fallback) {
  if (typeof document === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function createScrollingTextTexture({
  text = "trichistrichistrichis",
  color = "#00ffc2",
  bg = "#eaeaea",
  width = 1024,
  height = 256,
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.font = `500 ${Math.floor(height * 0.55)}px "Restart Soft", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 24, height * 0.55);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { texture, canvas, ctx, width, height, dispose: () => texture.dispose() };
}

function HowWeDoItGlassCard({ i }) {
  const cardTransforms = howWeDoItStore((s) => s.cardTransforms);
  const entry = useMemo(
    () => cardTransforms.find((t) => t.i === i),
    [cardTransforms, i],
  );
  if (!entry) return null;
  return <GlassCard i={i} transform={entry.transform} />;
}

export default function HowWeDoItScene({ scale, cardCount = 4 }) {
  const cards = useRef();
  const scaleGroup = useRef();
  const bg = useRef();
  const textOffset = useRef(0);
  const scrollVel = useRef(0);
  const dragX = useRef(0);
  const isDragging = useRef(false);
  const targetScale = useRef(1);
  const currentScale = useRef(1);
  const textData = useRef(null);
  const gapInUnits = useRef(0);

  const windowSize = useGlobalStore((s) => s.windowSize);
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const lenis = useGlobalStore((s) => s.lenis);

  const builtTextPlane = useMemo(() => {
    const placeholder = createScrollingTextTexture();
    textData.current = placeholder;
    howWeDoItTextTexture.setState(placeholder.texture);

    const uOffset = uniform(0);
    const mapNode = tslTexture(placeholder.texture);
    const material = new MeshBasicNodeMaterial();
    material.transparent = false;
    material.depthTest = false;
    material.depthWrite = false;
    material.fragmentNode = Fn(() => {
      const st = uv().toVar();
      st.x.assign(st.x.add(uOffset));
      // Tile text strip across the section width
      st.x.assign(st.x.mul(3));
      return mapNode.sample(st);
    })();
    return { material, uOffset, mapNode, placeholder };
  }, []);

  useEffect(() => {
    const color = cssVar("--color-howWeDoItText", "#00ffc2");
    const bgColor = cssVar("--color-background", "#eaeaea");
    const next = createScrollingTextTexture({ color, bg: bgColor });
    textData.current?.dispose?.();
    textData.current = next;
    howWeDoItTextTexture.setState(next.texture);
    builtTextPlane.mapNode.value = next.texture;
    return () => {
      next.dispose();
      howWeDoItTextTexture.setState(null);
    };
  }, [windowSize.width, builtTextPlane]);

  useEffect(() => {
    const transforms = howWeDoItStore.getState().cardTransforms;
    if (transforms.length < 2) return;
    gapInUnits.current =
      howWeDoItStore.getState().getPosition(1) -
      (howWeDoItStore.getState().getPosition(0) +
        howWeDoItStore.getState().getWidth(0));
  }, [windowSize.width, cardCount]);

  const { animateIn: animateScaleIn, animateOut: animateScaleOut } =
    useAnimation({
      inParams: {
        onUpdate: (v) => {
          targetScale.current = map(v, 0, 1, 1, minScale);
        },
      },
      outParams: {
        onUpdate: (v) => {
          targetScale.current = map(v, 0, 1, 1, minScale);
        },
      },
    });

  useEffect(() => {
    const el = document.querySelector(".how-we-do-it__wrapper");
    if (!el) return;

    let lastX = 0;

    const onPointerDown = (e) => {
      if (!useGlobalStore.getState().isMobileLayout) return;
      isDragging.current = true;
      lastX = e.clientX;
      animateScaleIn();
    };
    const onPointerMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      const totalWidth =
        howWeDoItStore.getState().getTotalWidth() +
        gapInUnits.current * Math.max(cardCount - 1, 0);
      const singleWidth = howWeDoItStore.getState().getWidth(0);
      dragX.current = clamp(
        dragX.current + dx,
        -totalWidth + singleWidth,
        0,
      );
    };
    const onPointerUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      animateScaleOut();
      const singleWidth =
        howWeDoItStore.getState().getWidth(0) + gapInUnits.current;
      if (!singleWidth) return;
      const nearest = Math.round(Math.abs(dragX.current) / singleWidth);
      const totalWidth =
        howWeDoItStore.getState().getTotalWidth() +
        gapInUnits.current * Math.max(cardCount - 1, 0);
      dragX.current = clamp(-nearest * singleWidth, -totalWidth + singleWidth, 0);
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [animateScaleIn, animateScaleOut, cardCount]);

  function reset() {
    dragX.current = 0;
    targetScale.current = 1;
    currentScale.current = 1;
    howWeDoItX.setState(0);
    howWeDoItScale.setState(1);
    howWeDoItProgress.setState(0);
    if (cards.current) cards.current.position.x = 0;
    if (scaleGroup.current) scaleGroup.current.scale.setScalar(1);
  }

  useEvent(events.HOME_HOW_WE_DO_IT_IN, () => {});
  useEvent(events.HOME_HOW_WE_DO_IT_OUT, reset);
  useEffect(() => () => reset(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const velocity = Math.abs(lenis?.velocity || 0);
    const velMul = isMobileLayout ? 0.01 : 0.025;
    scrollVel.current = lerp(velocity * velMul, scrollVel.current, 0.05, dt);
    textOffset.current += (0.015 + scrollVel.current) * dt * 60 * 0.016;
    builtTextPlane.uOffset.value = textOffset.current;

    if (isMobileLayout && cards.current && scaleGroup.current) {
      const x = howWeDoItX.getState();
      const newX = lerp(dragX.current, x, 0.05, dt);
      howWeDoItX.setState(newX);
      cards.current.position.x = newX;

      currentScale.current = lerp(
        targetScale.current,
        currentScale.current,
        0.05,
        dt,
      );
      scaleGroup.current.scale.setScalar(currentScale.current);
      howWeDoItScale.setState(currentScale.current);

      const totalWidth =
        howWeDoItStore.getState().getTotalWidth() +
        gapInUnits.current * Math.max(cardCount - 1, 0);
      const w0 = howWeDoItStore.getState().getWidth(0);
      const progress =
        totalWidth > w0 ? Math.abs(newX) / (totalWidth - w0) : 0;
      howWeDoItProgress.setState(clamp(progress, 0, 1));
    }
  });

  return (
    <group>
      <group ref={scaleGroup}>
        <group ref={cards}>
          {Array.from({ length: cardCount }, (_, i) => (
            <HowWeDoItGlassCard key={i} i={i} />
          ))}
        </group>
      </group>

      <mesh
        ref={bg}
        scale={[scale?.x || 1, scale?.y || 1, 1]}
        renderOrder={2}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <primitive object={builtTextPlane.material} attach="material" />
      </mesh>
    </group>
  );
}
