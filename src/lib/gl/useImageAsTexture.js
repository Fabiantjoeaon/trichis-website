import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Texture, SRGBColorSpace } from "three/webgpu";

// Longest side for GL uploads: full-res assets (8000px+) exceed WebGPU's
// default 8192 texture limit and waste VRAM at display sizes
const MAX_TEXTURE_DIMENSION = 4096;

/**
 * Build a Three texture from a DOM <img>/<video> ref (scroll-rig pattern).
 * Oversized images are downscaled through createImageBitmap before upload.
 */
export function useImageAsTexture(imgRef) {
  const gl = useThree((s) => s.gl);
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const el = imgRef?.current;
    if (!el) return;

    let cancelled = false;
    const tex = new Texture(el);
    tex.colorSpace = SRGBColorSpace;
    tex.flipY = true;

    const commit = async () => {
      if (cancelled) return;
      try {
        const w = el.naturalWidth || 0;
        const h = el.naturalHeight || 0;
        if (
          el.tagName !== "VIDEO" &&
          Math.max(w, h) > MAX_TEXTURE_DIMENSION &&
          typeof createImageBitmap === "function"
        ) {
          const ratio = MAX_TEXTURE_DIMENSION / Math.max(w, h);
          const bitmap = await createImageBitmap(el, {
            resizeWidth: Math.round(w * ratio),
            resizeHeight: Math.round(h * ratio),
            resizeQuality: "high",
          });
          if (cancelled) {
            bitmap.close?.();
            return;
          }
          tex.image = bitmap;
        }
      } catch {
        // Bitmap resize failed (e.g. tainted image) — upload the element as-is
      }
      if (cancelled) return;
      tex.needsUpdate = true;
      gl.initTexture?.(tex);
      setTexture(tex);
    };

    if (el.tagName === "VIDEO") {
      if (el.readyState >= 2) commit();
      else el.addEventListener("loadeddata", commit, { once: true });
    } else if (el.complete && el.naturalWidth > 0) {
      commit();
    } else {
      el.addEventListener("load", commit, { once: true });
    }

    return () => {
      cancelled = true;
      tex.dispose();
    };
  }, [imgRef, gl]);

  return texture;
}
