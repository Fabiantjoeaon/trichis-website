import { useEffect, useRef, useState } from "react";
import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import SplitText from "@/components/ui/SplitText";
import emitter from "@/lib/emitter";
import useEvent from "@/hooks/useEvent";
import { events } from "@/lib/events";
import { useGlobalStore } from "@/stores/global";
import { isMediaVideo } from "@/lib/cms";

export default function ProjectHero({
  project: { title, coverImage, mobileCoverImage } = {},
  isProject = true,
}) {
  const titleRef = useRef(null);
  const glImage = useRef(null);
  const noWebGLImages = useGlobalStore((s) => s.noWebGLImages);
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const [isLoading, setIsLoading] = useState(!noWebGLImages);

  const textureReadyRef = useRef(false);
  const transitionCompleteRef = useRef(false);
  const hasAnimatedRef = useRef(false);

  function tryAnimateIn() {
    if (hasAnimatedRef.current) return;
    if (!transitionCompleteRef.current) return;
    if (!noWebGLImages && !textureReadyRef.current) return;
    hasAnimatedRef.current = true;
    setIsLoading(false);
    glImage.current?.animateIn?.();
    setTimeout(() => titleRef.current?.animateIn?.({ stagger: 0.04 }), 200);
  }

  useEffect(() => {
    if (!noWebGLImages) return;
    emitter.emit("PROJECT:PAGE_READY");
    transitionCompleteRef.current = true;
    tryAnimateIn();
  }, [noWebGLImages]);

  useEvent(events.LOADING_OUT_COMPLETE, () => {
    transitionCompleteRef.current = true;
    tryAnimateIn();
  });

  useEffect(() => {
    const t = setTimeout(() => {
      transitionCompleteRef.current = true;
      tryAnimateIn();
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const activeAsset = isMobileLayout ? mobileCoverImage || coverImage : coverImage;
  const video = activeAsset?.video;
  const src = video?.mp4Url || video?.streamingUrl || activeAsset?.url;
  const isVideo = isMediaVideo(src, video);

  if (!src) return null;

  return (
    <section className="project-hero">
      <div className={`project-hero__spinner${isLoading ? " visible" : ""}`} />
      <NineGLImageElement
        ref={glImage}
        className="project-hero__gl"
        isVideo={isVideo}
        src={src}
        video={video}
        animateOnScroll={false}
        useHover={false}
        darken={0.2}
        onTextureReady={() => {
          textureReadyRef.current = true;
          emitter.emit("PROJECT:PAGE_READY");
          tryAnimateIn();
        }}
      />
      {isProject && (
        <SplitText
          tag="h1"
          ref={titleRef}
          animateOnScroll={false}
          animation="charClipped"
          type="chars"
        >
          {title}
        </SplitText>
      )}
    </section>
  );
}
