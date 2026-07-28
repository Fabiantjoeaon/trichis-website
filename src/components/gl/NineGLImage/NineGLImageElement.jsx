import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useGlobalStore } from "@/stores/global";
import useInView from "@/hooks/useInView";
import UseCanvas from "../UseCanvas";
import ScrollScene from "../ScrollScene";
import NineGLImage from "./index";

const EASE_CUSTOM_4_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

const DOM_WRAPPER_STYLE = {
  overflow: "hidden",
  borderRadius: "10px",
  position: "relative",
};

const DOM_MEDIA_RADIUS = "10px";
const DOM_MEDIA_HOVER_STYLE = {
  transform: "scale(1.05)",
  filter: "brightness(0.75)",
};

const MAX_RETRIES = 2;

const DOMFallback = forwardRef(function DOMFallback(
  {
    src: _src,
    alt,
    className = "",
    isVideo = false,
    animateOnScroll = true,
    offset = 0,
    onFacadeReady,
    onTextureReady,
    darken,
    video,
    ...props
  },
  ref,
) {
  const el = useRef();
  const mediaRef = useRef();
  const isVisible = useRef(false);
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const scaleDuration = isMobileLayout ? 1 : 1.4;
  const useHover = props.useHover !== false;
  const isLink = props.isLink !== false;
  const canHover = useHover && isLink;
  const baseFilter = darken ? `brightness(${1 - darken})` : "";

  const videoSrc = useMemo(() => {
    if (!isVideo) return null;
    return video?.mp4Url || _src || video?.streamingUrl || null;
  }, [isVideo, video, _src]);

  const imageSrc = useMemo(
    () => (!isVideo && _src ? _src : null),
    [isVideo, _src],
  );

  const applyHover = useCallback(
    (hover) => {
      if (!canHover || !mediaRef.current) return;
      if (hover) {
        mediaRef.current.style.transform = DOM_MEDIA_HOVER_STYLE.transform;
        mediaRef.current.style.filter = DOM_MEDIA_HOVER_STYLE.filter;
      } else {
        mediaRef.current.style.transform = "scale(1)";
        mediaRef.current.style.filter = baseFilter;
      }
    },
    [canHover, baseFilter],
  );

  const facade = useMemo(
    () => ({
      animateIn: () => {
        if (!mediaRef.current) return;
        isVisible.current = true;
        requestAnimationFrame(() => {
          if (!mediaRef.current) return;
          mediaRef.current.style.opacity = "1";
          mediaRef.current.style.transform = "scale(1)";
          mediaRef.current.style.filter = baseFilter || "";
        });
      },
      animateOut: () => {
        if (!mediaRef.current) return;
        mediaRef.current.style.opacity = "0";
        mediaRef.current.style.transform = "scale(0.5)";
        isVisible.current = false;
      },
      visible: () => isVisible.current,
      playVideo: () => mediaRef.current?.play?.(),
      stopVideo: () => mediaRef.current?.pause?.(),
      seekVideo: (time) => {
        if (mediaRef.current) mediaRef.current.currentTime = time || 0;
      },
      triggerPointerOver: () => applyHover(true),
      triggerPointerOut: () => applyHover(false),
      getElementSize: () => {
        if (!el.current) return { width: 0, height: 0 };
        const r = el.current.getBoundingClientRect();
        return { width: r.width, height: r.height };
      },
    }),
    [applyHover, baseFilter],
  );

  useImperativeHandle(ref, () => facade, [facade]);

  useInView({
    el: animateOnScroll ? el : { current: null },
    offset,
    handleIn: () => {
      if (!animateOnScroll || isVisible.current) return;
      facade.animateIn();
    },
  });

  useEffect(() => {
    onFacadeReady?.(facade);
  }, [facade, onFacadeReady]);

  return (
    <div
      className={className}
      ref={el}
      style={DOM_WRAPPER_STYLE}
      onMouseEnter={canHover ? () => applyHover(true) : undefined}
      onMouseLeave={canHover ? () => applyHover(false) : undefined}
    >
      {isVideo && videoSrc ? (
        <video
          ref={mediaRef}
          src={videoSrc}
          poster={video?.thumbnailUrl}
          loop
          muted
          playsInline
          preload="none"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "cover",
            opacity: 0,
            transform: "scale(0.5)",
            transition: `transform ${scaleDuration}s ${EASE_CUSTOM_4_CSS}, opacity ${scaleDuration}s ${EASE_CUSTOM_4_CSS}, filter 0.6s ease`,
            filter: baseFilter,
            borderRadius: DOM_MEDIA_RADIUS,
          }}
          onLoadedData={() => onTextureReady?.()}
        />
      ) : imageSrc ? (
        <img
          ref={mediaRef}
          src={imageSrc}
          alt={alt || ""}
          loading="eager"
          style={{
            width: "100%",
            display: "block",
            objectFit: "cover",
            opacity: 0,
            transform: "scale(0.5)",
            transition: `transform ${scaleDuration}s ${EASE_CUSTOM_4_CSS}, opacity ${scaleDuration}s ${EASE_CUSTOM_4_CSS}, filter 0.6s ease`,
            filter: baseFilter,
            borderRadius: DOM_MEDIA_RADIUS,
          }}
          onLoad={() => onTextureReady?.()}
          onError={(e) => {
            const imgEl = e.target;
            if (!imgEl._retryCount) imgEl._retryCount = 0;
            if (imgEl._retryCount < MAX_RETRIES) {
              imgEl._retryCount++;
              imgEl.src = `${imageSrc}${imageSrc.includes("?") ? "&" : "?"}_retry=${imgEl._retryCount}`;
            }
          }}
        />
      ) : null}
    </div>
  );
});

const GLImageElement = forwardRef(function GLImageElement(
  {
    src,
    alt,
    animateOnScroll = true,
    className = "",
    isVideo = false,
    offset = 0,
    tMap = null,
    onFacadeReady,
    onTextureReady,
    ...props
  },
  ref,
) {
  const el = useRef();
  const img = useRef();
  const internalRef = useRef();

  useImperativeHandle(ref, () => ({
    animateIn: (...args) => internalRef.current?.animateIn?.(...args),
    animateOut: (...args) => internalRef.current?.animateOut?.(...args),
    visible: () => internalRef.current?.visible?.() ?? false,
    playVideo: () => internalRef.current?.playVideo?.(),
    stopVideo: () => internalRef.current?.stopVideo?.(),
    seekVideo: (t) => internalRef.current?.seekVideo?.(t),
    triggerPointerOver: () => internalRef.current?.triggerPointerOver?.(),
    triggerPointerOut: () => internalRef.current?.triggerPointerOut?.(),
    getElementSize: () => internalRef.current?.getElementSize?.(),
  }));

  useInView({
    el: animateOnScroll ? el : { current: null },
    offset,
    handleIn: () => {
      const target = internalRef.current;
      if (!target || !animateOnScroll || target.visible?.()) return;
      target.animateIn();
    },
  });

  useEffect(() => {
    if (internalRef.current) onFacadeReady?.(internalRef.current);
  }, [onFacadeReady]);

  return (
    <>
      <div className={className} ref={el}>
        {!isVideo && src && (
          <img
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              visibility: "hidden",
            }}
            crossOrigin="anonymous"
            ref={img}
            src={src}
            alt={alt || ""}
          />
        )}
        {isVideo && src && (
          <video
            ref={img}
            src={src}
            crossOrigin="anonymous"
            loop
            muted
            playsInline
            preload="auto"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              visibility: "hidden",
            }}
          />
        )}
      </div>

      <UseCanvas>
        <ScrollScene track={el} hideOffscreen={animateOnScroll} overrideVisible={!animateOnScroll}>
          {(scrollSceneProps) => (
            <NineGLImage
              ref={internalRef}
              tMap={tMap}
              imgRef={img}
              isVideo={isVideo}
              src={src}
              {...scrollSceneProps}
              {...props}
              onReady={onTextureReady}
            />
          )}
        </ScrollScene>
      </UseCanvas>
    </>
  );
});

const NineGLImageElement = forwardRef(function NineGLImageElement(props, ref) {
  const noWebGLImages = useGlobalStore((s) => s.noWebGLImages);

  if (noWebGLImages) {
    return <DOMFallback ref={ref} {...props} />;
  }

  return <GLImageElement ref={ref} {...props} />;
});

export default NineGLImageElement;
