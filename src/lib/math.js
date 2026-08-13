// Math helpers ported from nine-ca mono/lib/math.js

const dampExp = (t) => 1 / (1 + t + 0.48 * t * t + 0.235 * t * t * t);

// Inlined maath/easing `damp` (MIT) — SmoothDamp step where `smoothTime` is
// in seconds. Velocity state is kept on the passed object, so persistent
// objects (e.g. the cursor position) get true critically-damped motion.
export function damp(
  current,
  prop,
  target,
  smoothTime = 0.25,
  delta = 0.01,
  maxSpeed = Infinity,
  easing = dampExp,
  eps = 0.001,
) {
  const vel = "velocity_" + prop;
  if (current.__damp === undefined) current.__damp = {};
  if (current.__damp[vel] === undefined) current.__damp[vel] = 0;

  if (Math.abs(current[prop] - target) <= eps) {
    current[prop] = target;
    return false;
  }

  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const t = easing(omega * delta);
  let change = current[prop] - target;
  const originalTo = target;
  const maxChange = maxSpeed * smoothTime;
  change = Math.min(Math.max(change, -maxChange), maxChange);
  target = current[prop] - change;
  const temp = (current.__damp[vel] + omega * change) * delta;
  current.__damp[vel] = (current.__damp[vel] - omega * temp) * t;
  let output = target + (change + temp) * t;
  // Prevent overshooting
  if (originalTo - current[prop] > 0.0 === output > originalTo) {
    output = originalTo;
    current.__damp[vel] = (output - originalTo) / delta;
  }
  current[prop] = output;
  return true;
}

// Port of nine-ca's lerp (stateless maath-damp step, `alpha` is a smooth-time
// in seconds — smaller = snappier). The damp step itself drifts slightly with
// frame rate, so we match its per-frame decay at `targetFps` exactly and
// apply it as a true exponential, which composes identically at any refresh
// rate (60Hz, 120Hz, 144Hz… all produce the same motion).
export function lerp(source, target, alpha, frameDelta, targetFps = 60) {
  if (Math.abs(source - target) <= 0.001) return target;
  const x = 2 / (Math.max(0.0001, alpha) * targetFps);
  const remainingPerFrame = Math.min((1 + x) * dampExp(x), 0.999999);
  const k = -Math.log(remainingPerFrame) * targetFps;
  const dt = frameDelta || 0.01; // nine-ca fallback when delta is undefined
  return target + (source - target) * Math.exp(-k * dt);
}

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
