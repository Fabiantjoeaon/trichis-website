import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import BorderedIcon from "@/components/ui/BorderedIcon";
import emitter from "@/lib/emitter";
import useEvent from "@/hooks/useEvent";
import { wait } from "@/lib/math";
import { events } from "@/lib/events";
import { getProcessedSrc } from "@/lib/processedSrc";
import { useGlobalStore } from "@/stores/global";
import { VIDEO_PLAYER_PLAY, VIDEO_PLAYER_STOP } from "@/lib/constants";
import { t } from "@/lib/i18n";

const DURATION = 0.4;

export { VIDEO_PLAYER_PLAY, VIDEO_PLAYER_STOP };

export default function VideoPlayer() {
  const [src, setSrc] = useState(null);
  const [active, setActive] = useState(false);
  const wrapper = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const closeIcon = useRef(null);

  const destroyHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  const playVideo = useCallback(({ src: rawSrc }) => {
    closeIcon.current?.animateIn?.();
    if (wrapper.current) wrapper.current.style.visibility = "visible";
    setActive(true);
    useGlobalStore.getState().lenis?.stop?.();
    const noGL = useGlobalStore.getState().noWebGLImages;
    const next = noGL ? rawSrc : getProcessedSrc(rawSrc);
    setSrc(next?.startsWith("http") || next?.startsWith("/") ? next : `/${next}`);
    emitter.emit(events.CURSOR_SHOW, { text: t("video.closeHint") });
  }, []);

  const stopVideo = useCallback(async () => {
    closeIcon.current?.animateOut?.();
    setActive(false);
    emitter.emit(events.CURSOR_HIDE);
    useGlobalStore.getState().lenis?.start?.();
    destroyHls();
    setSrc(null);
    await wait(DURATION * 1000);
    if (wrapper.current) wrapper.current.style.visibility = "hidden";
  }, []);

  useEvent(VIDEO_PLAYER_PLAY, playVideo);
  useEvent(VIDEO_PLAYER_STOP, stopVideo);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    destroyHls();
    const isHls = /\.m3u8(\?|$)/i.test(src);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().catch(() => {});
    } else {
      video.src = src;
      video.play().catch(() => {});
    }

    return () => destroyHls();
  }, [src]);

  useEffect(() => {
    if (!src) return;
    const onKey = (e) => {
      if (e.key === "Escape") stopVideo();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [src, stopVideo]);

  return (
    <div
      ref={wrapper}
      className={`video-player-overlay${active ? " active" : ""}`}
      onClick={() => stopVideo()}
    >
      <div className="video-player-overlay__inner">
        <BorderedIcon
          ref={closeIcon}
          animateOnScroll={false}
          icon="close"
          onClick={stopVideo}
        />
      </div>
      {src && (
        <video
          ref={videoRef}
          className="video-player-overlay__media"
          controls
          playsInline
          crossOrigin="anonymous"
          onEnded={async () => {
            await wait(400);
            stopVideo();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
