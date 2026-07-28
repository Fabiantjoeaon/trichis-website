import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Texture, SRGBColorSpace } from "three/webgpu";

/**
 * Build a Three texture from a DOM <img>/<video> ref (scroll-rig pattern).
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

    const commit = () => {
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
