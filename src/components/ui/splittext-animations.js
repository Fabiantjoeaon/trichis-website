// Animation presets ported 1:1 from nine-ca mono/components/SplitText/animations.js
import {
  EASE_CUSTOM_1,
  EASE_CUSTOM_3,
  EASE_CUSTOM_4,
} from "@/lib/easing";

const lineClippedInAnimation = (params) => ({
  original: {
    y: "0%",
    ease: params.ease ?? EASE_CUSTOM_1,
    duration: params.duration ?? 1,
    stagger: 0.1,
    delay: params?.delay ?? 0.4,
    clearProps: "all",
  },
});

const charClippedInAnimation = (params) => ({
  original: {
    y: "0%",
    duration: params.duration ?? 1.4,
    stagger: params.stagger ?? 0.02,
    delay: params?.delay ?? 0,
  },
});

const charClippedOutAnimation = () => ({
  original: {
    y: "100%",
  },
});

const charDoubleClippedInAnimation = (params) => ({
  double: {
    y: "-100%",
    ease: params.ease || EASE_CUSTOM_4,
    duration: params.duration || 1,
    stagger: 0.02,
    delay: params?.delay || 0,
  },
  original: {
    y: "0%",
    ease: params.ease || EASE_CUSTOM_1,
    duration: params.duration || 1,
    stagger: 0.02,
    delay: (params?.delay || 0) + 0.1,
  },
});

const charDoubleClippedHoverInAnimation = (params) => ({
  original: {
    y: "-100%",
    ease: params.ease ?? EASE_CUSTOM_3,
    duration: params.duration ?? 0.4,
    stagger: 0.005,
    delay: params?.delay ?? 0,
  },
  double: {
    y: "0%",
    ease: params.ease ?? EASE_CUSTOM_3,
    duration: params.duration ?? 0.4,
    stagger: 0.005,
  },
});

const charDoubleClippedHoverOutAnimation = (params) => ({
  original: {
    y: "0%",
    ease: params.ease ?? EASE_CUSTOM_3,
    duration: params.duration ?? 0.4,
    stagger: params.stagger ?? 0.005,
    delay: params?.delay ?? 0,
  },
  double: {
    y: "100%",
    ease: params.ease ?? EASE_CUSTOM_3,
    duration: params.duration ?? 0.4,
  },
});

const fadeOutAndMoveUpAnimation = (params, type = "lines") => ({
  type,
  original: {
    opacity: 0,
    y: "-100%",
    ease: params.ease ?? EASE_CUSTOM_1,
    duration: params.duration ?? 0.1,
    stagger: 0,
  },
  double: {
    opacity: 0,
    y: "-100%",
    stagger: 0,
    ease: params.ease ?? EASE_CUSTOM_1,
    duration: params.duration ?? 0.1,
  },
});

const wordDoubleClippedInAnimation = (params) => ({
  double: {
    y: "-100%",
    ease: params.ease || EASE_CUSTOM_4,
    duration: params.duration || 1,
    stagger: 0.009,
    delay: params?.delay || 0,
  },
  original: {
    y: "0%",
    ease: params.ease || EASE_CUSTOM_1,
    duration: params.duration || 1,
    stagger: 0.009,
    delay: (params?.delay || 0) + 0.1,
  },
});

const wordDoubleClippedHoverInAnimation = (params) => ({
  original: {
    y: "-100%",
    ease: params.ease ?? EASE_CUSTOM_3,
    duration: params.duration ?? 0.4,
    stagger: 0.005,
    delay: params?.delay ?? 0,
  },
  double: {
    y: "0%",
    ease: params.ease ?? EASE_CUSTOM_3,
    duration: params.duration ?? 0.4,
    stagger: 0.005,
  },
});

const wordDoubleClippedHoverOutAnimation = (params) => ({
  original: {
    y: "0%",
    ease: params.ease ?? EASE_CUSTOM_3,
    duration: params.duration ?? 0.4,
    stagger: 0.005,
    delay: params?.delay ?? 0,
  },
  double: {
    y: "100%",
    ease: params.ease ?? EASE_CUSTOM_3,
    duration: params.duration ?? 0.4,
  },
});

const fadeOutAnimation = (params) => ({
  type: "lines",
  original: {
    opacity: 0,
    ease: params.ease ?? EASE_CUSTOM_1,
    duration: params.duration ?? 0.1,
    stagger: 0,
  },
  double: {
    opacity: 0,
    stagger: 0,
    ease: params.ease ?? EASE_CUSTOM_1,
    duration: params.duration ?? 0.1,
  },
});

const _animations = {
  lineClipped: {
    set: {
      original: { y: "100%", opacity: 1 },
    },
    in: lineClippedInAnimation,
    out: (params) => fadeOutAndMoveUpAnimation(params, "lines"),
  },
  charClipped: {
    set: {
      original: { y: "100%" },
    },
    in: charClippedInAnimation,
    out: charClippedOutAnimation,
  },
  charDoubleClipped: {
    set: {
      original: { y: "100%", opacity: 1 },
      double: { y: "100%", opacity: 1 },
    },
    setHover: {
      original: { y: "0%" },
      double: { y: "100%" },
    },
    in: charDoubleClippedInAnimation,
    out: (params) => fadeOutAndMoveUpAnimation(params, "chars"),
    hoverIn: charDoubleClippedHoverInAnimation,
    hoverOut: charDoubleClippedHoverOutAnimation,
  },
  wordDoubleClipped: {
    set: {
      original: { y: "100%", opacity: 1 },
      double: { y: "100%", opacity: 1 },
    },
    setHover: {
      original: { y: "0%" },
      double: { y: "100%" },
    },
    in: wordDoubleClippedInAnimation,
    out: fadeOutAnimation,
    hoverIn: wordDoubleClippedHoverInAnimation,
    hoverOut: wordDoubleClippedHoverOutAnimation,
  },
};

export const animations = Object.keys(_animations).reduce((acc, key) => {
  acc[key] = { ..._animations[key], name: key };
  return acc;
}, {});
