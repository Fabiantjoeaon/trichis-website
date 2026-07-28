// Port of nine-ca components/views/LoaderView.js, adapted for the MPA world:
// - first visit: full loader with progress counter (fonts + window load + images)
// - internal navigation (flag set by TransitionLink): quick wipe reveal only,
//   so page transitions read as one continuous move like the SPA original.
import { useEffect, useRef, useState } from "react";
import emitter from "@/lib/emitter";
import { events } from "@/lib/events";
import { gsap } from "@/lib/gsap";
import { useGlobalStore } from "@/stores/global";

export const LOADER_OUT_DURATION = 1;
export const NAVIGATED_FLAG = "trichis:navigated";

const format = (p) => `${p.toFixed(0)}`;

function waitForFonts() {
  return document.fonts?.ready ?? Promise.resolve();
}

function waitForBrowserLoad() {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((res) => window.addEventListener("load", res, { once: true }));
}

function waitForImages(onProgress) {
  const images = Array.from(document.images);
  if (images.length === 0) {
    onProgress(1);
    return Promise.resolve();
  }
  let loaded = 0;
  const bump = () => onProgress(++loaded / images.length);
  return Promise.all(
    images.map((img) => {
      if (img.complete) {
        bump();
        return Promise.resolve();
      }
      return new Promise((res) => {
        const done = () => {
          bump();
          res();
        };
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    }),
  );
}

export default function Loader() {
  const hasLoaded = useRef(false);
  const progressText = useRef();
  const wrapper = useRef();
  const [isClient, setIsClient] = useState(false);
  const isQuickReveal = useRef(false);

  useEffect(() => setIsClient(true), []);

  function writeDisplayProgress(v) {
    if (progressText.current) progressText.current.innerText = format(v);
  }

  function doAnimateOut() {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    if (progressText.current) {
      gsap.to(progressText.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }

    if (!wrapper.current) {
      useGlobalStore.setState({ loaderDone: true });
      emitter.emit(events.LOADING_DONE);
      emitter.emit(events.LOADING_OUT_COMPLETE);
      return;
    }

    // Wipe upward (clip from top → fully clipped), matching nine-ca LoaderView
    gsap.fromTo(
      wrapper.current,
      { clipPath: "inset(0% 0 0 0)" },
      {
        clipPath: "inset(100% 0 0 0)",
        duration: LOADER_OUT_DURATION,
        delay: isQuickReveal.current ? 0.1 : 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          if (wrapper.current) wrapper.current.style.display = "none";
          useGlobalStore.setState({ loaderDone: true });
          useGlobalStore.getState().lenis?.start();
          emitter.emit(events.LOADING_DONE);
          emitter.emit(events.LOADING_OUT_COMPLETE);
        },
      },
    );
  }

  useEffect(() => {
    if (!isClient) return;

    // React loader is mounted and covering — drop the static pre-hydration cover
    document.querySelector(".loader-background")?.remove();

    isQuickReveal.current = sessionStorage.getItem(NAVIGATED_FLAG) === "1";
    sessionStorage.removeItem(NAVIGATED_FLAG);

    // Lock scroll during load
    useGlobalStore.getState().lenis?.stop?.();
    window.scrollTo(0, 0);

    if (isQuickReveal.current) {
      // Page transition: no counter, reveal quickly
      if (progressText.current) progressText.current.style.display = "none";
      doAnimateOut();
      return;
    }

    writeDisplayProgress(0);
    if (progressText.current) {
      gsap.set(progressText.current, { opacity: 0 });
      gsap.to(progressText.current, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.inOut",
      });
    }

    // Unified progress: fonts (20%), browser load (20%), images (60%)
    const progress = { fonts: 0, load: 0, images: 0 };
    const update = () => {
      const total =
        progress.fonts * 20 + progress.load * 20 + progress.images * 60;
      writeDisplayProgress(total);
    };

    Promise.all([
      waitForFonts().then(() => {
        progress.fonts = 1;
        update();
      }),
      waitForBrowserLoad().then(() => {
        progress.load = 1;
        update();
      }),
      waitForImages((p) => {
        progress.images = p;
        update();
      }),
    ]).then(() => {
      writeDisplayProgress(100);
      doAnimateOut();
    });

    // Safety net: never hang more than 8s
    const timeout = setTimeout(doAnimateOut, 8000);
    return () => clearTimeout(timeout);
  }, [isClient]);

  if (!isClient) return null;

  return (
    <div className="loader" ref={wrapper}>
      <span className="loader-progress-text" ref={progressText} />
    </div>
  );
}
