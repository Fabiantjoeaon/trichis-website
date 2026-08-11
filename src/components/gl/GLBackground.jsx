import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  MeshBasicNodeMaterial,
  Color,
  RepeatWrapping,
} from "three/webgpu";
import {
  uv,
  uniform,
  vec4,
  float,
  mix,
  step,
  texture as tslTexture,
  Fn,
  positionLocal,
} from "three/tsl";
import { fullscreenTriangle } from "@/lib/gl/geometry";
import useAnimation from "@/hooks/useAnimation";
import useEvent from "@/hooks/useEvent";
import emitter from "@/lib/emitter";
import { events } from "@/lib/events";
import { EASE_CUSTOM_3 } from "@/lib/easing";
import { useGlobalStore } from "@/stores/global";
import { TRANSITION_DURATION } from "@/lib/transitions";

const overlayDelay = 0.125;

// The wipe must cover the navigation (like nine-ca's separate z-7 overlay
// canvas), but tracked GL media should stay below it — so the shared canvas
// is only raised above the nav while the wipe is visible.
function setCanvasOverlay(on) {
  document
    .querySelector(".gl-canvas-root")
    ?.classList.toggle("gl-canvas-root--overlay", on);
}

const COLORS = {
  light: { background: "#161817", accent: "#b84626" },
  dark: { background: "#0f1010", accent: "#b84626" },
};

function buildWipeMaterial({ backgroundColor, borderColor, tTransition }) {
  const uTransition = uniform(0);
  const uDirection = uniform(1);
  const uTime = uniform(0);
  const uBackgroundColor = uniform(backgroundColor);
  const uBorderColor = uniform(borderColor);
  // Texture kept on material for future edge-noise (nine-ca swirl path)
  const mapNode = tslTexture(tTransition);

  const fragment = Fn(() => {
    const st = uv();
    const scrolling = st.toVar();
    scrolling.y.assign(scrolling.y.sub(uTime.mul(0.1)));
    const n = mapNode.sample(scrolling.mul(4)).r;

    const dir = float(1).sub(st.y).toVar();
    dir.assign(mix(st.y, dir, step(float(0), uDirection)));

    const th = float(0.01).add(n.mul(0.0));
    const edge0 = uTransition.sub(th);
    const edge1 = uTransition;
    const a = step(dir, uTransition);
    const border = step(edge0, dir).sub(step(edge1, dir));

    let color = uBackgroundColor.toVar();
    color.assign(mix(color, uBorderColor, border));
    color.assign(mix(color, uBackgroundColor, uTransition));

    return vec4(color, a);
  });

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.depthTest = false;
  material.vertexNode = vec4(positionLocal.xy, 0, 1);
  material.fragmentNode = fragment();

  return { material, uTransition, uDirection, uTime, uBackgroundColor, uBorderColor };
}

export default memo(function GLBackground() {
  const theme = useGlobalStore((s) => s.theme) || "light";
  const group = useRef();
  const visible = useRef(false);
  const isAnimating = useRef(false);

  const tTransition = useTexture("/assets/transition.jpeg");
  tTransition.wrapS = tTransition.wrapT = RepeatWrapping;

  const colors = useMemo(() => {
    const c = COLORS[theme] || COLORS.light;
    return {
      background: new Color(c.background),
      accent: new Color(c.accent),
    };
  }, [theme]);

  const wipe = useMemo(
    () =>
      buildWipeMaterial({
        backgroundColor: colors.background,
        borderColor: colors.accent,
        tTransition,
      }),
    // Rebuild when theme/texture identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, tTransition],
  );

  useEffect(() => {
    wipe.uBackgroundColor.value.copy(colors.background);
    wipe.uBorderColor.value.copy(colors.accent);
  }, [colors, wipe]);

  const { animateIn: animateBackgroundIn, animateOut: animateBackgroundOut } =
    useAnimation({
      inParams: {
        duration: TRANSITION_DURATION / 1000,
        delay: overlayDelay,
        ease: EASE_CUSTOM_3,
        onStart: () => {
          isAnimating.current = true;
          wipe.uDirection.value = 1;
          wipe.uTransition.value = 0;
        },
        onUpdate: (v) => {
          wipe.uTransition.value = v;
        },
        onComplete: () => {
          isAnimating.current = false;
          emitter.emit(events.GL_BACKGROUND_IN_COMPLETE);
        },
      },
      outParams: {
        duration: TRANSITION_DURATION / 1000,
        ease: EASE_CUSTOM_3,
        onStart: () => {
          isAnimating.current = true;
          wipe.uDirection.value = -1;
          wipe.uTransition.value = 0;
        },
        onUpdate: (v) => {
          wipe.uTransition.value = v;
        },
        onComplete: () => {
          isAnimating.current = false;
          if (group.current) group.current.visible = false;
          setCanvasOverlay(false);
          emitter.emit(events.GL_BACKGROUND_OUT_COMPLETE);
        },
      },
    });

  function animateIn() {
    if (visible.current) {
      // Already covering — let waiters (router loader) proceed immediately
      if (!isAnimating.current)
        emitter.emit(events.GL_BACKGROUND_IN_COMPLETE);
      return;
    }
    if (group.current) group.current.visible = true;
    visible.current = true;
    setCanvasOverlay(true);
    animateBackgroundIn();
  }

  function animateOut() {
    if (!visible.current) {
      emitter.emit(events.GL_BACKGROUND_OUT_COMPLETE);
      return;
    }
    visible.current = false;
    animateBackgroundOut();
  }

  useEvent(events.GL_BACKGROUND_IN, animateIn);
  useEvent(events.GL_BACKGROUND_OUT, animateOut);
  useEvent(events.ROUTE_CHANGE_START, () => {
    if (useGlobalStore.getState().menuOpen) return;
    animateIn();
  });

  useFrame(({ clock }) => {
    wipe.uTime.value = clock.elapsedTime;
  });

  useEffect(() => {
    if (group.current) group.current.visible = false;
  }, []);

  return (
    <group ref={group} visible={false}>
      <mesh renderOrder={1000} geometry={fullscreenTriangle} frustumCulled={false}>
        <primitive object={wipe.material} attach="material" />
      </mesh>
    </group>
  );
});
