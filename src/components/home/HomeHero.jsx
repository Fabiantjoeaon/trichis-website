import { useEffect, useRef } from "react";
import { useGlobalStore } from "@/stores/global";
import { map } from "@/lib/math";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE_CUSTOM_4 } from "@/lib/easing";
import usePageEnter from "@/hooks/usePageEnter";

export default function HomeHero({ data, className = "" }) {
  const track = useRef(null);
  const mediaRef = useRef(null);
  const pageReady = useRef(false);
  const startEntrance = useRef(null);
  const isMobileLayout = useGlobalStore((state) => state.isMobileLayout);
  const media = (isMobileLayout && data?.mobileMedia) || data?.media;

  usePageEnter(() => {
    pageReady.current = true;
    startEntrance.current?.();
  });

  useGSAP(() => {
    const element = mediaRef.current;
    if (!element) return;
    let tween;
    let started = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    gsap.set(element, { opacity: 0, scale: motion.matches ? 1 : 0.5 });
    const start = () => {
      if (started || !pageReady.current) return;
      const ready = element.tagName === "VIDEO" ? element.readyState >= 2 : element.complete;
      if (!ready && !element.error) return;
      started = true;
      element.play?.()?.catch(() => {});
      tween = gsap.to(element, { opacity: 1, scale: 1, duration: motion.matches ? 0 : 1.2,
        ease: EASE_CUSTOM_4, clearProps: "opacity,transform" });
    };
    const stopMotion = () => {
      if (!motion.matches || !started) return;
      tween?.kill();
      gsap.set(element, { opacity: 1, scale: 1, clearProps: "opacity,transform" });
    };
    startEntrance.current = start;
    element.addEventListener("loadeddata", start);
    element.addEventListener("load", start);
    element.addEventListener("error", start);
    motion.addEventListener("change", stopMotion);
    // Astro adopts the next page from a parsed document. A video can arrive
    // with an empty/failed media state even though its src is unchanged.
    if (element.tagName === "VIDEO" && (!element.currentSrc || element.error)) element.load();
    start();
    return () => {
      startEntrance.current = null;
      tween?.kill();
      element.removeEventListener("loadeddata", start);
      element.removeEventListener("load", start);
      element.removeEventListener("error", start);
      motion.removeEventListener("change", stopMotion);
    };
  }, { scope: track, dependencies: [media?.url], revertOnUpdate: true });

  useEffect(() => {
    const element = track.current;
    const visual = element?.firstElementChild;
    if (!visual) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const rect = element.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      visual.style.transform = reducedMotion.matches ? "none" : `scale(${map(progress, 0.7, 1, 1, 0.7, true)})`;
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    reducedMotion.addEventListener("change", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, [media?.url]);

  if (!media?.url) return null;

  return (
    <section ref={track} id={data?.anchorId}
      className={`home-hero ${data?.fullscreen !== false ? "home-hero--fullscreen" : ""} ${className}`}>
      <div className="home-hero__visual">
        {media.isVideo ? (
          <video ref={mediaRef} key={media.url} className="home-hero__media" src={media.url}
            autoPlay muted loop playsInline preload="auto" aria-label={media.alt || undefined} />
        ) : (
          <img ref={mediaRef} className="home-hero__media" src={media.url} alt={media.alt || ""}
            fetchPriority="high" width={media.width || undefined} height={media.height || undefined} />
        )}
      </div>
    </section>
  );
}
