// Top-level chrome island (port of nine-ca's ClientLayout responsibilities):
// Lenis smooth scroll, viewport tracking, theme switching, GL page-transition
// wipe, nav, menu, loader, cursor and cookie banner.
import { useEffect } from "react";
import Lenis from "lenis";
import emitter from "@/lib/emitter";
import { events } from "@/lib/events";
import { gsap } from "@/lib/gsap";
import { bindMouse } from "@/lib/mouse";
import { wait } from "@/lib/math";
import { TRANSITION_DURATION, waitForEvent } from "@/lib/transitions";
import { useCanvasStore } from "@/lib/gl/canvasStore";
import { useGlobalStore } from "@/stores/global";
import useEvent from "@/hooks/useEvent";
import NavigationBar from "./NavigationBar";
import Menu from "./Menu";
import Loader from "./Loader";
import CookieBanner from "./CookieBanner";
import { Cursor } from "./Cursor";
import VideoPlayer from "@/components/VideoPlayer";
import GLCanvas from "@/components/gl/Canvas";

const THEME_KEY = "trichis:theme";
// Matches --theme-transition-duration in global.css
const THEME_TRANSITION_MS = 600;

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
      useGlobalStore.getState().lenis?.resize?.();
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
    const root = document.documentElement;

    // Temporarily enable global color/background transitions (nine-ca
    // ThemeWrapper behavior) so the switch animates instead of snapping.
    root.classList.add("theme-transitioning");
    if (window.__themeTransitionTO) clearTimeout(window.__themeTransitionTO);
    window.__themeTransitionTO = setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, THEME_TRANSITION_MS + 50);

    root.dataset.theme = theme;
    useGlobalStore.setState({ theme });
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  });
}

// Astro view-transition lifecycle: this island (and the GL canvas inside it)
// persists across client-side navigations. The GL wipe is woven into the
// router's own phases so every navigation — TransitionLink, plain links,
// back/forward — gets the same choreography:
//
//   before-preparation  cover the screen (wipe in) while Astro loads the
//                       next page in parallel; the swap only happens covered
//   after-swap          reset scroll/theme behind the cover
//   page-load           let islands hydrate + trackers re-measure, reveal
//                       (wipe out), then fire the page entrance animations
function useAstroNavigation() {
  useEffect(() => {
    let navigated = false;

    const coverScreen = async (route) => {
      useGlobalStore.setState({ pageRevealed: false });
      useGlobalStore.getState().lenis?.stop();

      if (useGlobalStore.getState().menuOpen) {
        // The menu (and its GL background) already covers the screen —
        // just give its links a moment to animate out.
        emitter.emit(events.ROUTE_CHANGE_START, { route });
        await wait(400);
        return;
      }

      const covered = waitForEvent(events.GL_BACKGROUND_IN_COMPLETE, {
        timeout: TRANSITION_DURATION + 800,
      });
      emitter.emit(events.ROUTE_CHANGE_START, { route });
      await covered;
    };

    const onBeforePreparation = (event) => {
      navigated = true;
      const originalLoader = event.loader;
      event.loader = async function (...args) {
        await Promise.all([
          originalLoader.apply(this, args),
          coverScreen(event.to?.pathname),
        ]);
      };
    };

    const onAfterSwap = () => {
      if (!navigated) return;

      // The static pre-hydration cover comes back with the swapped body
      document.querySelector(".loader-background")?.remove();

      // The swapped <html> carries the page's default theme; keep the user's
      let stored;
      try {
        stored = localStorage.getItem(THEME_KEY);
      } catch {}
      if (stored) document.documentElement.dataset.theme = stored;

      window.scrollTo(0, 0);
      const lenis = useGlobalStore.getState().lenis;
      lenis?.scrollTo?.(0, { immediate: true, force: true });
    };

    const onPageLoad = async () => {
      if (!navigated) return;
      navigated = false;

      // Screen is covered — let the new page's islands hydrate and fonts
      // settle so the reveal shows a finished page (nine-ca waits too).
      await document.fonts.ready;
      await wait(300);

      useGlobalStore.setState({ menuOpen: false });
      window.scrollTo(0, 0);
      const lenis = useGlobalStore.getState().lenis;
      lenis?.scrollTo?.(0, { immediate: true, force: true });
      lenis?.resize?.();
      useCanvasStore.getState().triggerReflow();

      // Reveal (wipe out), then start the page entrances — same order as
      // nine-ca: content animates in on an already-visible page.
      const revealed = waitForEvent(events.GL_BACKGROUND_OUT_COMPLETE, {
        timeout: TRANSITION_DURATION + 800,
      });
      emitter.emit(events.GL_BACKGROUND_OUT);
      await revealed;

      lenis?.start();
      emitter.emit(events.LOADING_OUT_COMPLETE);
    };

    document.addEventListener("astro:before-preparation", onBeforePreparation);
    document.addEventListener("astro:after-swap", onAfterSwap);
    document.addEventListener("astro:page-load", onPageLoad);
    return () => {
      document.removeEventListener(
        "astro:before-preparation",
        onBeforePreparation,
      );
      document.removeEventListener("astro:after-swap", onAfterSwap);
      document.removeEventListener("astro:page-load", onPageLoad);
    };
  }, []);
}

export default function SiteChrome({ settings = {}, siteName }) {
  useViewport();
  useLenis();
  useTheme();
  useAstroNavigation();

  useEffect(() => {
    bindMouse();
  }, []);

  useEvent(events.LOADING_OUT_COMPLETE, () => {
    useGlobalStore.setState({ pageRevealed: true });
    useGlobalStore.getState().lenis?.start();
  });

  return (
    <>
      <GLCanvas />
      <Loader />
      <Menu settings={settings} />
      <NavigationBar siteName={siteName} />
      <CookieBanner content={settings.cookieBanner} />
      <Cursor />
      <VideoPlayer />
    </>
  );
}
