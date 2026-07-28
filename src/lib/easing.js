// Easing constants ported from nine-ca src/mono/lib/styles/easing.js
import { CustomEase } from "./gsap.js";

export const easeInSine = "cubic-bezier(0.470, 0.000, 0.745, 0.715)";
export const easeOutSine = "cubic-bezier(0.390, 0.575, 0.565, 1.000)";
export const easeInOutSine = "cubic-bezier(0.445, 0.050, 0.550, 0.950)";
export const easeInQuad = "cubic-bezier(0.550, 0.085, 0.680, 0.530)";
export const easeOutQuad = "cubic-bezier(0.250, 0.460, 0.450, 0.940)";
export const easeInOutQuad = "cubic-bezier(0.455, 0.030, 0.515, 0.955)";
export const easeInCubic = "cubic-bezier(0.550, 0.055, 0.675, 0.190)";
export const easeOutCubic = "cubic-bezier(0.215, 0.610, 0.355, 1.000)";
export const easeInOutCubic = "cubic-bezier(0.645, 0.045, 0.355, 1.000)";
export const easeInExpo = "cubic-bezier(0.950, 0.050, 0.795, 0.035)";
export const easeOutExpo = "cubic-bezier(0.190, 1.000, 0.220, 1.000)";
export const easeInOutExpo = "cubic-bezier(1.000, 0.000, 0.000, 1.000)";
export const easeInCirc = "cubic-bezier(0.600, 0.040, 0.980, 0.335)";
export const easeOutCirc = "cubic-bezier(0.075, 0.820, 0.165, 1.000)";
export const easeInOutCirc = "cubic-bezier(0.785, 0.135, 0.150, 0.860)";

// Tween.js-style easing functions (used by theme transitions etc.)
export function outQuad(n) {
  return n * (2 - n);
}

const isBrowser = typeof window !== "undefined";

// GSAP CustomEases (SSR-safe: fall back to bezier strings during prerender)
export const EASE_CUSTOM_1 = isBrowser
  ? CustomEase.create("customEase1", ".25, .46, .45, .94")
  : "power1.out";
export const EASE_CUSTOM_2 = isBrowser
  ? CustomEase.create("customEase2", ".19, 1, .22, 1")
  : "expo.out";
export const EASE_CUSTOM_3 = isBrowser
  ? CustomEase.create("customEase3", ".77, 0, .175, 1")
  : "power3.inOut";
export const EASE_CUSTOM_4 = isBrowser
  ? CustomEase.create("customEase4", ".22, 1, .36, 1")
  : "expo.out";
export const EASE_CUSTOM_5 = isBrowser
  ? CustomEase.create("customEase5", "0.215, 1.61, 0.355, 1")
  : "back.out";
