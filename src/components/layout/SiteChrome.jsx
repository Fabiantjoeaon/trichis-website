// Top-level chrome island (port of nine-ca's ClientLayout responsibilities):
// Lenis smooth scroll, viewport tracking, theme switching, GL page-transition
// wipe, nav, menu, loader, cursor and cookie banner.
import { useEffect, lazy, Suspense } from "react";
import Lenis from "lenis";
import emitter from "@/lib/emitter";
import { events } from "@/lib/events";
import { gsap } from "@/lib/gsap";
import { bindMouse } from "@/lib/mouse";
import { useGlobalStore } from "@/stores/global";
import useEvent from "@/hooks/useEvent";
import { setRandomSentences } from "@/components/ui/ShuffledText";
import NavigationBar from "./NavigationBar";
import Menu from "./Menu";
import Loader from "./Loader";
import CookieBanner from "./CookieBanner";
import { Cursor } from "./Cursor";
import VideoPlayer from "@/components/VideoPlayer";

const GLCanvas = lazy(() => import("@/components/gl/Canvas"));

const THEME_KEY = "trichis:theme";

function useViewport() {
  useEffect(() => {
    const setSize = () => {
      useGlobalStore
        .getState()
        .setWindowSize(window.innerWidth, window.innerHeight);
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`,
      );
    };
    setSize();
    window.addEventListener("resize", setSize);
    return () => window.removeEventListener("resize", setSize);
  }, []);
}

function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      syncTouch: true,
      syncTouchLerp: 0.1,
      touchInertiaMultiplier: 10,
      lerp: 0.07,
    });
    useGlobalStore.setState({ lenis });

    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      useGlobalStore.setState({ lenis: null });
    };
  }, []);
}

function useTheme() {
  useEffect(() => {
    let stored;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {}
    if (stored) {
      document.documentElement.dataset.theme = stored;
      useGlobalStore.setState({ theme: stored });
    } else {
      useGlobalStore.setState({
        theme: document.documentElement.dataset.theme || "light",
      });
    }
  }, []);

  useEvent(events.SWITCH_THEME, (theme) => {
    document.documentElement.dataset.theme = theme;
    useGlobalStore.setState({ theme });
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  });
}

export default function SiteChrome({ settings = {}, siteName }) {
  useViewport();
  useLenis();
  useTheme();

  useEffect(() => {
    bindMouse();
    setRandomSentences(settings.home?.randomSentences ?? []);
  }, [settings]);

  useEvent(events.LOADING_OUT_COMPLETE, () => {
    useGlobalStore.getState().lenis?.start();
  });

  useEvent(events.GL_BACKGROUND_IN_COMPLETE, () => {
    window.scrollTo(0, 0);
    useGlobalStore.getState().lenis?.scrollTo?.(0, { immediate: true });
  });

  return (
    <>
      <Suspense fallback={null}>
        <GLCanvas />
      </Suspense>
      <Loader />
      <Menu settings={settings} />
      <NavigationBar siteName={siteName} />
      <CookieBanner content={settings.cookieBanner} />
      <Cursor />
      <VideoPlayer />
    </>
  );
}
