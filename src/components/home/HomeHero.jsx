// Port of nine-ca HomeHero: fullscreen showreel video (GL) inside
// util.heroSizing, shrinking slightly as it scrolls out of view.
import { useEffect, useRef } from "react";
import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import usePageEnter from "@/hooks/usePageEnter";
import { map } from "@/lib/math";
import { useGlobalStore } from "@/stores/global";

function HeroVideo({ track, ...props }) {
  const videoRef = useRef();
  const textureReadyRef = useRef(false);
  const transitionCompleteRef = useRef(false);
  const hasAnimatedRef = useRef(false);
  const noWebGLImages = useGlobalStore((s) => s.noWebGLImages);
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);

  const videoSrc = isMobileLayout
    ? "/video/showreel_mobile.mp4"
    : "/video/showreel.mp4";

  function tryAnimateIn() {
    if (hasAnimatedRef.current) return;
    if (!transitionCompleteRef.current) return;
    if (!noWebGLImages && !textureReadyRef.current) return;
    hasAnimatedRef.current = true;

    videoRef.current?.animateIn?.();
    videoRef.current?.playVideo?.();
  }

  usePageEnter(() => {
    transitionCompleteRef.current = true;
    tryAnimateIn();
  });

  // Scroll-out scale, like nine-ca's useScrollRigScrollTrigger update
  useEffect(() => {
    if (noWebGLImages) return;

    const update = () => {
      const el = track.current;
      const group = videoRef.current?.getGroup?.();
      if (!el || !group) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 = top enters viewport bottom, 1 = bottom leaves viewport top
      const progress = (vh - rect.top) / (vh + rect.height);
      const scale = map(progress, 0.7, 1, 1, 0.7, true);
      group.scale.setScalar(scale);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [noWebGLImages, track]);

  return (
    <NineGLImageElement
      ref={videoRef}
      className="home-hero__gl"
      isVideo
      src={videoSrc}
      animateOnScroll={false}
      useHover={false}
      isLink={false}
      onTextureReady={() => {
        textureReadyRef.current = true;
        tryAnimateIn();
      }}
      {...props}
    />
  );
}

export default function HomeHero({ className = "" }) {
  const track = useRef(null);

  return (
    <section ref={track} className={`home-hero ${className}`}>
      <HeroVideo track={track} />
    </section>
  );
}
