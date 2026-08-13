/**
 * HowWeDoItScene — TSL port of nine-ca HowWeDoItScene.
 * The scrolling brand text is drawn as a transparent white mask
 * (canvas texture); the section plane paints only the text pixels so the
 * page background shows through (transparent render-target look), and the
 * glass cards reconstruct the "scene" color from the same mask + theme
 * uniforms, which are tweened on SWITCH_THEME like nine-ca's GL theme lerp.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  Color,
  LinearFilter,
  MeshBasicNodeMaterial,
  NoColorSpace,
  RepeatWrapping,
} from "three/webgpu";
import { Fn, uv, uniform, vec4, texture as tslTexture } from "three/tsl";
import useEvent from "@/hooks/useEvent";
import useAnimation from "@/hooks/useAnimation";
import { gsap } from "@/lib/gsap";
import { clamp, lerp, map } from "@/lib/math";
import { events } from "@/lib/events";
import { useGlobalStore } from "@/stores/global";
import GlassCard from "./GlassCard";
import {
  howWeDoItProgress,
  howWeDoItScale,
  howWeDoItStore,
  howWeDoItTextScroll,
  howWeDoItTextTexture,
  howWeDoItX,
  minScale,
} from "./stores";

const MASK_WIDTH = 2048;
const MASK_HEIGHT = 256;
const MASK_ASPECT = MASK_WIDTH / MASK_HEIGHT;

function cssVar(name, fallback) {
  if (typeof document === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

// White-on-transparent, horizontally seamless text mask
function createScrollingTextMask({
  word = "nine",
  width = MASK_WIDTH,
  height = MASK_HEIGHT,
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.font = `500 ${Math.floor(height * 0.62)}px "SG Grotesk", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // Repeat the word with an exact advance so the texture tiles seamlessly
  const wordWidth = Math.max(1, ctx.measureText(word).width);
  const count = Math.max(1, Math.round(width / wordWidth));
  const advance = width / count;
  for (let i = 0; i < count; i++) {
    ctx.fillText(word, i * advance, height * 0.55);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { texture, dispose: () => texture.dispose() };
}

function HowWeDoItGlassCard({ i, themeColors }) {
  const cardTransforms = howWeDoItStore((s) => s.cardTransforms);
  const entry = useMemo(
    () => cardTransforms.find((t) => t.i === i),
    [cardTransforms, i],
  );
  if (!entry) return null;
  return (
    <GlassCard i={i} transform={entry.transform} themeColors={themeColors} />
  );
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
  const isTabletOrSmallerLayout = useGlobalStore(
    (s) => s.isTabletOrSmallerLayout,
  );
  const lenis = useGlobalStore((s) => s.lenis);

  // Theme colors as shared Color instances (each material wraps them in its
  // own uniform() node — TSL nodes must not be shared across materials).
  // Tweened on SWITCH_THEME like nine-ca's useThemeTransitionGLUniforms.
  const themeColors = useMemo(
    () => ({
      bg: new Color(cssVar("--color-background", "#f0ece1")),
      text: new Color(cssVar("--color-howWeDoItText", "#b84626")),
      border: new Color(cssVar("--color-text", "#231f20")),
    }),
    [],
  );

  useEvent(events.SWITCH_THEME, () => {
    // Read targets after data-theme has been applied to <html>
    requestAnimationFrame(() => {
      const targets = [
        [themeColors.bg, cssVar("--color-background", "#f0ece1")],
        [themeColors.text, cssVar("--color-howWeDoItText", "#b84626")],
        [themeColors.border, cssVar("--color-text", "#231f20")],
      ];
      for (const [color, css] of targets) {
        const to = new Color(css);
        gsap.to(color, {
          r: to.r,
          g: to.g,
          b: to.b,
          duration: 0.6,
          ease: "quad.out",
          overwrite: true,
        });
      }
    });
  });

  const builtTextPlane = useMemo(() => {
    const placeholder = createScrollingTextMask();
    textData.current = placeholder;
    // replace=true: zustand would otherwise merge the Texture into a plain
    // object and strip its prototype (breaks TSL texture sampling)
    howWeDoItTextTexture.setState(placeholder.texture, true);

    const uOffset = uniform(0);
    const uRepeat = uniform(1);
    const mapNode = tslTexture(placeholder.texture);
    const material = new MeshBasicNodeMaterial();
    // Transparent: only the text pixels paint, page background shows through
    material.transparent = true;
    material.depthTest = false;
    material.depthWrite = false;
    material.fragmentNode = Fn(() => {
      const st = uv().toVar();
      // Aspect-correct repeat so glyphs keep their proportions
      st.x.assign(st.x.add(uOffset).mul(uRepeat));
      const mask = mapNode.sample(st).a;
      return vec4(uniform(themeColors.text), mask);
    })();
    return { material, uOffset, uRepeat, mapNode, placeholder };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    const rebuild = () => {
      if (cancelled) return;
      const next = createScrollingTextMask();
      textData.current?.dispose?.();
      textData.current = next;
      howWeDoItTextTexture.setState(next.texture, true);
      builtTextPlane.mapNode.value = next.texture;
    };

    rebuild();
    // Redraw once the brand font is available
    document.fonts?.ready?.then(rebuild);

    return () => {
      cancelled = true;
    };
  }, [windowSize.width, builtTextPlane]);

  useEffect(() => {
    const compute = () => {
      const transforms = howWeDoItStore.getState().cardTransforms;
      if (transforms.length < 2) return;
      gapInUnits.current =
        howWeDoItStore.getState().getPosition(1) -
        (howWeDoItStore.getState().getPosition(0) +
          howWeDoItStore.getState().getWidth(0));
    };
    compute();
    // Card transforms are measured asynchronously (mount rAF / fonts /
    // reflow) — recompute the gap whenever they land or change.
    return howWeDoItStore.subscribe(compute);
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

    // Manual port of nine-ca's use-gesture drag config: x-axis lock with a
    // 6px threshold, velocity fling, and preventScroll while dragging.
    const DRAG_THRESHOLD = 6;
    const VELOCITY_MULTIPLIER = 3.7;
    const SPEED = 3.5;

    let pointerActive = false;
    let axis = null; // "x" | "y" once intent is known
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;

    const startDrag = () => {
      isDragging.current = true;
      animateScaleIn();
    };

    const onPointerDown = (e) => {
      if (!useGlobalStore.getState().isTabletOrSmallerLayout) return;
      pointerActive = true;
      axis = null;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = e.timeStamp;
    };
    const onPointerMove = (e) => {
      if (!pointerActive) return;

      if (!axis) {
        const dxTotal = e.clientX - lastX;
        const dyTotal = e.clientY - lastY;
        if (
          Math.abs(dxTotal) < DRAG_THRESHOLD &&
          Math.abs(dyTotal) < DRAG_THRESHOLD
        )
          return;
        axis = Math.abs(dxTotal) > Math.abs(dyTotal) ? "x" : "y";
        if (axis === "x") startDrag();
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = e.timeStamp;
        return;
      }
      if (axis !== "x" || !isDragging.current) return;

      const dx = e.clientX - lastX;
      const dt = Math.max(e.timeStamp - lastT, 1);
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = e.timeStamp;

      const velocity = Math.abs(dx) / dt; // px/ms, like use-gesture
      const x =
        dx + velocity * (VELOCITY_MULTIPLIER * Math.sign(dx)) * SPEED;

      const totalWidth =
        howWeDoItStore.getState().getTotalWidth() +
        gapInUnits.current * Math.max(cardCount - 1, 0);
      const singleWidth = howWeDoItStore.getState().getWidth(0);
      dragX.current = clamp(
        dragX.current + x,
        -totalWidth + singleWidth,
        0,
      );
    };
    const onPointerUp = () => {
      pointerActive = false;
      axis = null;
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

    // While dragging horizontally, keep the touch from reaching Lenis
    // (syncTouch would keep scrolling the page under the drag).
    const onTouchMove = (e) => {
      if (!isDragging.current) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
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
    scrollVel.current = lerp(scrollVel.current, velocity * velMul, 0.05, dt);
    textOffset.current += (0.015 + scrollVel.current) * dt * 60 * 0.016;
    builtTextPlane.uOffset.value = textOffset.current;

    const repeat =
      scale?.x && scale?.y ? scale.x / scale.y / MASK_ASPECT : 1;
    builtTextPlane.uRepeat.value = repeat;
    howWeDoItTextScroll.setState({ offset: textOffset.current, repeat });

    if (isTabletOrSmallerLayout && cards.current && scaleGroup.current) {
      const x = howWeDoItX.getState();
      const newX = lerp(x, dragX.current, 0.05, dt);
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
            <HowWeDoItGlassCard key={i} i={i} themeColors={themeColors} />
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
