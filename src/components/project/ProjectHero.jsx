import { useEffect, useRef, useState } from "react";
import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import emitter from "@/lib/emitter";
import usePageEnter from "@/hooks/usePageEnter";
import { useGlobalStore } from "@/stores/global";

export default function ProjectHero({
  project: { coverImage, mobileCoverImage } = {},
}) {
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
  }

  useEffect(() => {
    if (!noWebGLImages) return;
    emitter.emit("PROJECT:PAGE_READY");
  }, [noWebGLImages]);

  usePageEnter(() => {
    transitionCompleteRef.current = true;
    tryAnimateIn();
  });

  const activeAsset = isMobileLayout ? mobileCoverImage || coverImage : coverImage;
  const src = activeAsset?.url;
  const isVideo = !!activeAsset?.isVideo;

  if (!src) return null;

  return (
    <section className="project-hero">
      <div className={`project-hero__spinner${isLoading ? " visible" : ""}`} />
      <NineGLImageElement
        ref={glImage}
        className="project-hero__gl"
        isVideo={isVideo}
        src={src}
        animateOnScroll={false}
        useHover={false}
        darken={0.2}
        onTextureReady={() => {
          textureReadyRef.current = true;
          emitter.emit("PROJECT:PAGE_READY");
          tryAnimateIn();
        }}
      />
    </section>
  );
}
