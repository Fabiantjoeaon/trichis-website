import { CanvasTexture, LinearFilter, NoColorSpace } from "three/webgpu";

/**
 * 2D canvas stand-in for nine-ca's RenderTexture + troika GLText
 * (troika is WebGL-bound; canvas-texture works on WebGPU + WebGL2).
 */
export function createTextMask({
  text = "trichis",
  mobileText = "t",
  isMobile = false,
  size = 128,
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  const label = isMobile ? mobileText : text;
  const fontSize = isMobile ? Math.floor(size * 0.72) : Math.floor(size * 0.28);
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${fontSize}px "SG Grotesk", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, size * 0.5, size * 0.52);

  const { data } = ctx.getImageData(0, 0, size, size);
  const mask = new Float32Array(size * size);
  for (let i = 0; i < mask.length; i++) {
    mask[i] = data[i * 4] / 255;
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return { texture, mask, size, dispose: () => texture.dispose() };
}

export function sampleMask(mask, size, u, v) {
  const x = Math.min(size - 1, Math.max(0, (u * size) | 0));
  const y = Math.min(size - 1, Math.max(0, ((1 - v) * size) | 0));
  return mask[y * size + x];
}
