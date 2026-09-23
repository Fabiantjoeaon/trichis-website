// Scroll-trigger hook replacing nine-ca's useScrollRigScrollTrigger.
// `offset` is an IntersectionObserver threshold (fraction of the element that
// must be visible), matching scroll-rig's useTracker({ threshold: abs(offset) }).
import { useEffect, useRef } from "react";
import { useGlobalStore } from "@/stores/global";

export default function useInView({
  el,
  offset = 0,
  once = true,
  handleIn,
  handleOut,
} = {}) {
  const handlers = useRef({ handleIn, handleOut });
  handlers.current = { handleIn, handleOut };
  const hasFired = useRef(false);

  useEffect(() => {
    const element = el?.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    let observer;

    const start = () => {
      if (observer) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              if (once && hasFired.current) return;
              hasFired.current = true;
              handlers.current.handleIn?.();
              if (once) observer.disconnect();
            } else if (!once) {
              handlers.current.handleOut?.();
            }
          }
        },
        {
          rootMargin: "0px",
          threshold: Math.abs(offset),
        },
      );
      observer.observe(element);
    };

    // Don't fire while the loader / wipe still covers the page — otherwise
    // the entrance plays (or completes) behind the cover and never reads.
    let unsub;
    if (useGlobalStore.getState().pageRevealed) {
      start();
    } else {
      unsub = useGlobalStore.subscribe((state) => {
        if (state.pageRevealed) start();
      });
    }

    return () => {
      unsub?.();
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, offset, once]);
}
