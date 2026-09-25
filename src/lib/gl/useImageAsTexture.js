import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Texture, SRGBColorSpace } from "three/webgpu";

const MAX_TEXTURE_DIMENSION = 4096;

/** Upload intrinsic pixels, independently of the hidden DOM tracker's layout. */
export function useImageAsTexture(imgRef, src) {
  const gl = useThree((s) => s.gl);
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const el = imgRef?.current;
    if (!el) return;

    let cancelled = false;
    let bitmap;
    const tex = new Texture();
    tex.colorSpace = SRGBColorSpace;
    tex.flipY = true;
    setTexture(null);

    const commit = async () => {
      if (cancelled) return;
      const w = el.naturalWidth;
      const h = el.naturalHeight;
      if (!w || !h) return;
      const ratio = Math.min(1, MAX_TEXTURE_DIMENSION / Math.max(w, h));
      const width = Math.max(1, Math.round(w * ratio));
      const height = Math.max(1, Math.round(h * ratio));

      // Three's WebGPU backend allocates from image.width/height and copies
      // that rectangle from the source. Passing the styled tracker uploads
      // only a corner of the photo. Use a bitmap for EVERY image, not just
      // oversized assets, so upload dimensions always describe real pixels.
      try {
        bitmap = await createImageBitmap(el, {
          resizeWidth: width,
          resizeHeight: height,
          resizeQuality: "high",
        });
        if (cancelled) {
          bitmap.close();
          return;
        }
        tex.image = bitmap;
      } catch {
        if (cancelled) return;
        // Preserve intrinsic sizing even when ImageBitmap is unavailable.
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(el, 0, 0, width, height);
        tex.image = canvas;
      }
      tex.needsUpdate = true;
      gl.initTexture?.(tex);
      setTexture(tex);
    };

    if (el.complete && el.naturalWidth > 0) commit();
    else el.addEventListener("load", commit, { once: true });

    return () => {
      cancelled = true;
      el.removeEventListener("load", commit);
      tex.dispose();
      bitmap?.close();
    };
  }, [imgRef, src, gl]);

  return texture;
}
