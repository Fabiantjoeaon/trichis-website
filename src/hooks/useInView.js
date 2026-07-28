// Scroll-trigger hook replacing nine-ca's useScrollRigScrollTrigger.
// Fires handleIn once when the element enters the viewport. `offset` shifts
// the trigger line as a fraction of viewport height (positive = element must
// scroll further in before firing; negative = fires early), mirroring the
// scroll-rig offset semantics closely enough for the entrance animations.
import { useEffect, useRef } from "react";

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

    const marginBottom = -(offset * 100);
    const observer = new IntersectionObserver(
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
        rootMargin: `0px 0px ${marginBottom}% 0px`,
        threshold: 0,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, offset, once]);
}
