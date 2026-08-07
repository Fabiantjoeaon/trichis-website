// Progress-tween helper ported from nine-ca mono/lib/hooks/useAnimation.js:
// animateIn/animateOut drive a normalized 0→1 value through GSAP with the
// given ease/duration, reporting via onUpdate.
import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { EASE_CUSTOM_2 } from "@/lib/easing";

export default function useAnimation({ inParams = {}, outParams = {} } = {}) {
  const value = useRef({ v: 0 });
  const tween = useRef(null);

  const run = useCallback((target, base, overrides = {}) => {
    const params = { ...base, ...overrides };
    tween.current?.kill();

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
    (overrides) => run(1, inParams, overrides),
    [run],
  );
  const animateOut = useCallback(
    (overrides) => run(0, outParams, overrides),
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
