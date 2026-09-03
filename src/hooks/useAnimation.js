// Progress-tween helper ported from nine-ca mono/lib/hooks/useAnimation.js:
// animateIn/animateOut drive a normalized 0→1 value through GSAP with the
// given ease/duration, reporting via onUpdate.
import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { EASE_CUSTOM_2 } from "@/lib/easing";

export default function useAnimation({ inParams = {}, outParams = {} } = {}) {
  const value = useRef({ v: 0 });
  const tween = useRef(null);
  const inRef = useRef(inParams);
  const outRef = useRef(outParams);
  inRef.current = inParams;
  outRef.current = outParams;

  const run = useCallback((target, baseRef, overrides = {}) => {
    const params = { ...baseRef.current, ...overrides };
    tween.current?.kill();

    // nine-ca: always tween the full 0→1 / 1→0 range so a remount or a
    // killed in-tween cannot collapse the out into a 0→0 snap.
    if (target === 1 && value.current.v === 1) value.current.v = 0;
    if (target === 0 && value.current.v === 0) value.current.v = 1;

    tween.current = gsap.to(value.current, {
      v: target,
      duration: params.duration ?? 1,
      delay: params.delay ?? 0,
      ease: params.ease ?? EASE_CUSTOM_2,
      onStart: () => params.onStart?.(),
      onUpdate: () => params.onUpdate?.(value.current.v),
      onComplete: () => params.onComplete?.(),
    });
    return tween.current;
  }, []);

  const animateIn = useCallback(
    (overrides) => run(1, inRef, overrides),
    [run],
  );
  const animateOut = useCallback(
    (overrides) => run(0, outRef, overrides),
    [run],
  );

  useEffect(() => () => tween.current?.kill(), []);

  const isActive = useCallback(() => tween.current?.isActive() ?? false, []);

  return { animateIn, animateOut, isActive };
}

// CSS-class based transition helper (adds/removes `active`), ported from
// nine-ca's useCSSClassTransition.
export function useCSSClassTransition({ element, className = "active" }) {
  const animateIn = useCallback(() => {
    requestAnimationFrame(() => element.current?.classList.add(className));
  }, [element, className]);
  const animateOut = useCallback(() => {
    element.current?.classList.remove(className);
  }, [element, className]);
  return { animateIn, animateOut };
}
