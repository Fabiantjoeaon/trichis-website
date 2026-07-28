import {
  Fn,
  float,
  vec2,
  vec3,
  abs,
  max,
  min,
  length,
  mix,
  clamp,
  smoothstep,
  fwidth,
  step,
  cos,
  sin,
  dFdx,
  dFdy,
  mx_noise_float,
  mx_aastep,
} from "three/tsl";

/** Map value from one range to another (unclamped). */
export const mapRange = Fn(([value, oldMin, oldMax, newMin, newMax]) => {
  const oldRange = oldMax.sub(oldMin);
  const newRange = newMax.sub(newMin);
  return value.sub(oldMin).div(oldRange).mul(newRange).add(newMin);
});

/** Clamped map. */
export const crange = Fn(([value, oldMin, oldMax, newMin, newMax]) => {
  return clamp(mapRange(value, oldMin, oldMax, newMin, newMax), min(newMin, newMax), max(newMin, newMax));
});

export const cubicOut = Fn(([t]) => {
  const f = t.sub(1);
  return f.mul(f).mul(f).add(1);
});

export const cubicIn = Fn(([t]) => t.mul(t).mul(t));

export const translateUV = Fn(([uvCoord, offset]) => uvCoord.sub(offset));

export const scaleUV = Fn(([uvCoord, scale, origin]) => {
  const o = origin;
  return uvCoord.sub(o).div(scale).add(o);
});

export const rotateUV = Fn(([uvCoord, angle, origin]) => {
  const o = origin;
  const c = cos(angle);
  const s = sin(angle);
  const st = uvCoord.sub(o);
  return vec2(st.x.mul(c).sub(st.y.mul(s)), st.x.mul(s).add(st.y.mul(c))).add(o);
});

/**
 * Rounded-rect SDF border. Returns border mask; writes inside via return struct simulation
 * by returning vec2(border, inside).
 */
export const roundedBorder = Fn(
  ([thickness, radius, uvCoord, resolution]) => {
    const multiplier = max(resolution.x, resolution.y);
    const ratio = resolution.div(multiplier);
    const squareUv = uvCoord.mul(2).sub(1).mul(ratio);
    const squareThickness = thickness.div(multiplier);
    const squareRadius = radius.mul(2).div(multiplier);
    const size = ratio.sub(vec2(squareRadius.add(squareThickness)));

    const q = abs(squareUv).sub(size);
    const d = min(max(q.x, q.y), float(0)).add(length(max(q, float(0)))).sub(squareRadius);
    const dist = abs(d);
    const delta = fwidth(dist);
    const border = float(1).sub(smoothstep(delta.negate(), delta, dist.sub(squareThickness)));

    const deltaD = fwidth(d);
    const limit = squareThickness.mul(0.5);
    const inside = float(1).sub(smoothstep(deltaD.negate(), deltaD, d.sub(limit)));

    return vec2(border, inside);
  },
);

export const aastep = Fn(([threshold, value]) => {
  const afwidth = fwidth(value).mul(0.5);
  return smoothstep(threshold.sub(afwidth), threshold.add(afwidth), value);
});

export const cheapAA = Fn(([st, initialAlpha, cut]) => {
  let alpha = initialAlpha;
  alpha = alpha.mul(aastep(cut.x, st.x));
  alpha = alpha.mul(float(1).sub(aastep(float(1).sub(cut.x), st.x)));
  alpha = alpha.mul(aastep(cut.y, st.y));
  alpha = alpha.mul(float(1).sub(aastep(float(1).sub(cut.y), st.y)));
  return alpha;
});

export const sdBox = Fn(([p, b]) => {
  const q = abs(p).sub(b);
  return length(max(q, float(0))).add(min(max(q.x, max(q.y, q.z)), float(0)));
});

export const sdSphere = Fn(([p, s]) => length(p).sub(s));

export const opSmoothUnion = Fn(([d1, d2, k]) => {
  const h = max(k.sub(abs(d1.sub(d2))), float(0));
  return min(d1, d2).sub(h.mul(h).mul(0.25).div(k));
});

export const opSmoothSubtraction = Fn(([d1, d2, k]) =>
  opSmoothUnion(d1, d2.negate(), k).negate(),
);

export const opSmoothIntersection = Fn(([d1, d2, k]) =>
  opSmoothUnion(d1.negate(), d2.negate(), k).negate(),
);

export const resizeUVCover = Fn(([uvCoord, imageSize, containerSize]) => {
  const ratio = vec2(
    min(containerSize.x.div(containerSize.y).div(imageSize.x.div(imageSize.y)), float(1)),
    min(containerSize.y.div(containerSize.x).div(imageSize.y.div(imageSize.x)), float(1)),
  );
  return vec2(
    uvCoord.x.mul(ratio.x).add(float(1).sub(ratio.x).mul(0.5)),
    uvCoord.y.mul(ratio.y).add(float(1).sub(ratio.y).mul(0.5)),
  );
});

export const greyscale = Fn(([c, strength]) => {
  const g = c.dot(vec3(0.299, 0.587, 0.114));
  return mix(c, vec3(g), strength);
});

/** Simplex / perlin via MaterialX TSL noise. */
export const noise2D = (coord) => mx_noise_float(coord);

export { mx_aastep, mx_noise_float, fwidth, dFdx, dFdy };
