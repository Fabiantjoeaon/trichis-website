// GSAP-ticker based RAF hook (replacement for nine-ca's useTicker/useRafLoop)
import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export function useTicker(callback, { initiallyActive = false } = {}) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const active = useRef(false);

  const tick = useCallback((time, deltaTime) => {
    cbRef.current({ time, delta: deltaTime / 1000 });
  }, []);

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    gsap.ticker.add(tick);
  }, [tick]);

  const stop = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    gsap.ticker.remove(tick);
  }, [tick]);

  useEffect(() => {
    if (initiallyActive) start();
    return stop;
  }, [initiallyActive, start, stop]);

  return { start, stop };
}
