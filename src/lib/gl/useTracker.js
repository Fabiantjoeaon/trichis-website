import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useGlobalStore } from "@/stores/global";
import { useCanvasStore } from "./canvasStore";
import { map } from "@/lib/math";

function updateBounds(bounds, rect, scrollY, scrollX, size) {
  bounds.top = rect.top - scrollY;
  bounds.bottom = rect.bottom - scrollY;
  bounds.left = rect.left - scrollX;
  bounds.right = rect.right - scrollX;
  bounds.width = rect.width;
  bounds.height = rect.height;
  bounds.x = bounds.left + rect.width * 0.5 - size.width * 0.5;
  bounds.y = bounds.top + rect.height * 0.5 - size.height * 0.5;
  bounds.positiveYUpBottom = size.height - bounds.bottom;
}

/**
 * Scroll-synced DOM tracker (scroll-rig useTracker pattern, without the package).
 * Positions are in viewport units (pixels × scaleMultiplier).
 */
export function useTracker(track, { autoUpdate = true, rootMargin = "0px" } = {}) {
  const windowSize = useGlobalStore((s) => s.windowSize);
  const lenis = useGlobalStore((s) => s.lenis);
  const scaleMultiplier = useCanvasStore((s) => s.scaleMultiplier);
  const pageReflow = useCanvasStore((s) => s.pageReflow);

  const [scale, setScale] = useState({ x: 0, y: 0, z: 1 });
  const [inViewport, setInViewport] = useState(false);

  const rect = useRef({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
  }).current;

  const bounds = useRef({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    positiveYUpBottom: 0,
  }).current;

  const position = useRef({ x: 0, y: 0, z: 0 }).current;

  const scrollState = useRef({
    inViewport: false,
    progress: -1,
    visibility: -1,
    viewport: -1,
  }).current;

  const getScroll = useCallback(() => {
    // Lenis keeps the authoritative animated scroll; window.scrollY can lag
    // a frame behind and leave tracked GL content visually stuck.
    const y =
      typeof lenis?.scroll === "number" ? lenis.scroll : window.scrollY;
    const x =
      typeof lenis?.scroll === "number" ? 0 : window.scrollX;
    return { scrollY: y, scrollX: x };
  }, [lenis]);

  const measure = useCallback(() => {
    const el = track?.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Skip collapsed frames so ScrollScene doesn't unmount (textures / tweens)
    if (!r.width || !r.height) return;
    const { scrollY, scrollX } = getScroll();
    rect.top = r.top + scrollY;
    rect.bottom = r.bottom + scrollY;
    rect.left = r.left + scrollX;
    rect.right = r.right + scrollX;
    rect.width = r.width;
    rect.height = r.height;
    const nextX = r.width * scaleMultiplier;
    const nextY = r.height * scaleMultiplier;
    setScale((prev) =>
      prev.x === nextX && prev.y === nextY
        ? prev
        : { x: nextX, y: nextY, z: 1 },
    );
  }, [track, scaleMultiplier, getScroll]);

  const update = useCallback(
    ({ onlyUpdateInViewport = false } = {}) => {
      if (!track?.current) return;
      if (onlyUpdateInViewport && !scrollState.inViewport) return;

      const size = {
        width: windowSize.width || window.innerWidth,
        height: windowSize.height || window.innerHeight,
      };
      const { scrollY, scrollX } = getScroll();

      updateBounds(bounds, rect, scrollY, scrollX, size);
      position.x = bounds.x * scaleMultiplier;
      position.y = -bounds.y * scaleMultiplier;

      const pxInside = size.height - bounds.top;
      scrollState.progress = map(
        pxInside,
        0,
        size.height + bounds.height,
        0,
        1,
      );
      scrollState.visibility = map(pxInside, 0, bounds.height, 0, 1);
      scrollState.viewport = map(pxInside, 0, size.height, 0, 1);
    },
    [track, windowSize, scaleMultiplier, getScroll],
  );

  // nine-ca remasures in useLayoutEffect so GL scale matches the post-resize
  // rem layout before paint.
  useLayoutEffect(() => {
    measure();
    update();
  }, [measure, update, pageReflow, windowSize]);

  useEffect(() => {
    const el = track?.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        measure();
        update();
      });
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [track, measure, update]);

  useEffect(() => {
    const el = track?.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setInViewport(visible);
        scrollState.inViewport = visible;
        update({ onlyUpdateInViewport: false });
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [track, rootMargin, update]);

  useEffect(() => {
    if (!autoUpdate) return;
    const onScroll = () => update({ onlyUpdateInViewport: true });
    if (lenis?.on) {
      lenis.on("scroll", onScroll);
      return () => lenis.off?.("scroll", onScroll);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [autoUpdate, lenis, update]);

  return { scale, position, bounds, rect, scrollState, inViewport, update, measure };
}
