const blocked = new Set();
const GESTURES = ["touchend", "click", "keydown"];

function retryBlocked() {
  for (const video of blocked) {
    if (video.isConnected && video.paused) video.play()?.catch?.(() => {});
  }
  blocked.clear();
}

/**
 * Muted inline playback. iOS (Low Power Mode, data saver) rejects autoplay
 * until the first user gesture, so rejected videos retry on that gesture.
 */
export function playVideo(video) {
  if (!video?.play) return;
  video.muted = true;
  video.playsInline = true;
  video.play()?.catch?.((error) => {
    if (error?.name !== "NotAllowedError") return;
    blocked.add(video);
    GESTURES.forEach((type) =>
      window.addEventListener(type, retryBlocked, { once: true, capture: true, passive: true }),
    );
  });
}

export function pauseVideo(video) {
  if (!video) return;
  blocked.delete(video);
  video.pause?.();
}
