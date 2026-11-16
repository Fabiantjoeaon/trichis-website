import { useEffect, useState } from "react";
import { VideoTexture, SRGBColorSpace } from "three/webgpu";
import { playVideo, pauseVideo } from "@/lib/playVideo";

/** Share the DOM video with GL, including its loading and playback state. */
export function useVideoAsTexture(videoRef, src) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;
    let nextTexture;
    setTexture(null);

    const ready = () => {
      if (nextTexture || video.readyState < 2) return;
      nextTexture = new VideoTexture(video);
      nextTexture.colorSpace = SRGBColorSpace;
      setTexture(nextTexture);
    };
    // iOS ignores preload and buffers no frame until playback starts, so a
    // play() issued before metadata may be dropped; ask again once it lands.
    const retry = () => {
      if (!nextTexture && video.paused) playVideo(video);
    };

    video.addEventListener("loadedmetadata", retry);
    video.addEventListener("loadeddata", ready);
    video.addEventListener("canplay", ready);
    video.addEventListener("playing", ready);
    video.preload = "auto";
    // Astro's parsed documents can contain a video in a failed/empty state.
    if (video.error || !video.currentSrc) video.load();
    playVideo(video);
    ready();

    return () => {
      video.removeEventListener("loadedmetadata", retry);
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener("canplay", ready);
      video.removeEventListener("playing", ready);
      pauseVideo(video);
      nextTexture?.dispose();
    };
  }, [videoRef, src]);

  return texture;
}
