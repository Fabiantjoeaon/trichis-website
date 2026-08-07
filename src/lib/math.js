// Math helpers ported from nine-ca mono/lib/math.js
export const lerp = (target, current, factor, delta = 1) =>
  current + (target - current) * (1 - Math.exp(-factor * 6 * delta * 60 * 0.016));

export const simpleLerp = (a, b, t) => a + (b - a) * t;

export const map = (value, inMin, inMax, outMin, outMax, clampOutput = false) => {
  const mapped =
    ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  if (!clampOutput) return mapped;
  const min = Math.min(outMin, outMax);
  const max = Math.max(outMin, outMax);
  return Math.min(Math.max(mapped, min), max);
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
