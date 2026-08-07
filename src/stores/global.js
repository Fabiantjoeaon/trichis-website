import { create } from "zustand";

// Breakpoint mirror of nine-ca's isMobileLayout (width < breakpointTablet)
const BREAKPOINT_TABLET = 712;

export const useGlobalStore = create((set) => ({
  windowSize: { width: 0, height: 0 },
  isMobileLayout: false,
  theme: "light",
  lenis: null,
  menuOpen: false,
  loaderDone: false,
  // False while the loader / GL transition wipe covers the page; pages hold
  // their entrance animations until it flips true (see usePageEnter).
  pageRevealed: false,
  mouse: { x: 0, y: 0 },
  // Set true to force DOM fallback for NineGLImageElement
  noWebGLImages: false,

  setWindowSize: (width, height) =>
    set({
      windowSize: { width, height },
      isMobileLayout: width < BREAKPOINT_TABLET,
    }),
  setTheme: (theme) => set({ theme }),
}));
