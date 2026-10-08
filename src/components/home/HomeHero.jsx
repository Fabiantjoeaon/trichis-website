import { useEffect, useRef } from "react";
import { useGlobalStore } from "@/stores/global";
import { map } from "@/lib/math";

export default function HomeHero({ data, className = "" }) {
  const track = useRef(null);
  const isMobileLayout = useGlobalStore((state) => state.isMobileLayout);
  const media = (isMobileLayout && data?.mobileMedia) || data?.media;

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
      {media.isVideo ? (
        <video key={media.url} className="home-hero__media" src={media.url}
          autoPlay muted loop playsInline preload="auto" aria-label={media.alt || undefined} />
      ) : (
        <img className="home-hero__media" src={media.url} alt={media.alt || ""}
          fetchPriority="high" width={media.width || undefined} height={media.height || undefined} />
      )}
    </section>
  );
}
