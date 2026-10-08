import { useGlobalStore } from "@/stores/global";

export default function HomeHero({ data, className = "" }) {
  const isMobileLayout = useGlobalStore((state) => state.isMobileLayout);
  const media = (isMobileLayout && data?.mobileMedia) || data?.media;
  if (!media?.url) return null;

  return (
    <section id={data?.anchorId}
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
