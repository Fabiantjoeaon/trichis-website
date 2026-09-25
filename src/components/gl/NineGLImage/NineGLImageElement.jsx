import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useGlobalStore } from "@/stores/global";
import useInView from "@/hooks/useInView";
import { getProcessedSrc } from "@/lib/processedSrc";
import { useCanvasStore } from "@/lib/gl/canvasStore";
import UseCanvas from "../UseCanvas";
import ScrollScene from "../ScrollScene";
import NineGLImage from "./index";

const EASE_CUSTOM_4_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

const DOM_WRAPPER_STYLE = {
  overflow: "hidden",
  borderRadius: "0px",
  position: "relative",
};

const DOM_MEDIA_RADIUS = "0px";
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

  const videoSrc = useMemo(
    () => (isVideo ? _src || null : null),
    [isVideo, _src],
  );

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
          className="gl-image-sizer"
          src={imageSrc}
          alt={alt || ""}
          width={props.width || undefined}
          height={props.height || undefined}
          loading="eager"
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
    width: mediaWidth,
    height: mediaHeight,
    url: _url,
    ...props
  },
  ref,
) {
  const el = useRef();
  const img = useRef();
  const internalRef = useRef();
  // The GL impl mounts only once its texture is loaded — queue imperative
  // calls made before that (nine-ca useDeferredFacade behavior) so e.g. an
  // animateIn fired for above-the-fold images isn't silently dropped.
  const pendingCalls = useRef([]);

  const call = useCallback((name, args = []) => {
    const target = internalRef.current;
    if (target?.[name]) return target[name](...args);
    pendingCalls.current.push([name, args]);
    return undefined;
  }, []);

  const attachInternal = useCallback(
    (instance) => {
      internalRef.current = instance;
      if (!instance) return;
      const queued = pendingCalls.current.splice(0);
      queued.forEach(([name, args]) => instance[name]?.(...args));
      onFacadeReady?.(instance);
    },
    [onFacadeReady],
  );

  useImperativeHandle(ref, () => ({
    animateIn: (...args) => call("animateIn", args),
    animateOut: (...args) => call("animateOut", args),
    getGroup: () => internalRef.current?.getGroup?.() ?? null,
    visible: () => internalRef.current?.visible?.() ?? false,
    playVideo: () => call("playVideo"),
    stopVideo: () => call("stopVideo"),
    seekVideo: (t) => call("seekVideo", [t]),
    triggerPointerOver: () => internalRef.current?.triggerPointerOver?.(),
    triggerPointerOut: () => internalRef.current?.triggerPointerOut?.(),
    getElementSize: () => internalRef.current?.getElementSize?.(),
  }));

  useInView({
    el: animateOnScroll ? el : { current: null },
    offset,
    handleIn: () => {
      if (!animateOnScroll || internalRef.current?.visible?.()) return;
      call("animateIn");
    },
  });

  useEffect(() => {
    const media = img.current;
    if (!media) return;
    const remasure = () => useCanvasStore.getState().triggerReflow();
    media.addEventListener("load", remasure);
    media.addEventListener("loadeddata", remasure);
    if (
      (media.tagName === "IMG" && media.complete && media.naturalWidth) ||
      (media.tagName === "VIDEO" && media.readyState >= 2)
    ) {
      remasure();
    }
    return () => {
      media.removeEventListener("load", remasure);
      media.removeEventListener("loadeddata", remasure);
    };
  }, [src]);

  return (
    <>
      <div className={className} ref={el}>
        {!isVideo && src && (
          <img
            className="gl-image-sizer"
            style={{
              // Tracker only — the GL plane renders the image (nine-ca parity)
              visibility: "hidden",
              opacity: 0,
            }}
            width={mediaWidth || undefined}
            height={mediaHeight || undefined}
            crossOrigin="anonymous"
            ref={img}
            src={src}
            alt={alt || ""}
          />
        )}
        {isVideo && src && (
          <video
            className="gl-image-sizer"
            ref={img}
            src={src}
            width={mediaWidth || undefined}
            height={mediaHeight || undefined}
            crossOrigin="anonymous"
            loop
            muted
            playsInline
            preload="auto"
            style={{
              visibility: "hidden",
            }}
          />
        )}
      </div>

      <UseCanvas>
        <ScrollScene
          track={el}
          hideOffscreen={animateOnScroll}
          overrideVisible={!animateOnScroll}
          inViewportMargin="20%"
        >
          {(scrollSceneProps) => (
            // Own boundary: a suspending texture (video canplay) must not
            // hide sibling images and kill their in-flight entrance tweens
            <Suspense fallback={null}>
              <NineGLImage
                ref={attachInternal}
                tMap={tMap}
                imgRef={img}
                isVideo={isVideo}
                src={src}
                {...scrollSceneProps}
                {...props}
                onReady={onTextureReady}
              />
            </Suspense>
          )}
        </ScrollScene>
      </UseCanvas>
    </>
  );
});

const NineGLImageElement = forwardRef(function NineGLImageElement(props, ref) {
  const noWebGLImages = useGlobalStore((s) => s.noWebGLImages);
  const src = useMemo(() => getProcessedSrc(props.src), [props.src]);
  const next = src === props.src ? props : { ...props, src };

  if (noWebGLImages) {
    return <DOMFallback ref={ref} {...next} />;
  }

  return <GLImageElement ref={ref} {...next} />;
});

export default NineGLImageElement;
