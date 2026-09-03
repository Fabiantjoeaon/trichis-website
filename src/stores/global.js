import { create } from "zustand";

// Breakpoint mirrors of nine-ca's responsive helpers
const BREAKPOINT_TABLET = 712; // isMobileLayout: width < breakpointTablet
const BREAKPOINT_DESKTOP = 1025; // isTabletOrSmallerLayout: width < breakpointDesktop

export const useGlobalStore = create((set) => ({
  windowSize: { width: 0, height: 0 },
  isMobileLayout: false,
  isTabletOrSmallerLayout: false,
  theme: "light",
  lenis: null,
  menuOpen: false,
  loaderDone: false,
  // False while the loader / GL transition wipe covers the page; pages hold
  // their entrance animations until it flips true (see usePageEnter).
  pageRevealed: false,
  // True while the GL wipe is covering the screen. Survives a canvas remount
  // during an Astro swap so the out animation can still play from full cover.
  wipeCovered: false,
  mouse: { x: 0, y: 0 },
  // Set true to force DOM fallback for NineGLImageElement
  noWebGLImages: false,

  setWindowSize: (width, height) =>
    set({
      windowSize: { width, height },
      isMobileLayout: width < BREAKPOINT_TABLET,
      isTabletOrSmallerLayout: width < BREAKPOINT_DESKTOP,
    }),
  setTheme: (theme) => set({ theme }),
}));
