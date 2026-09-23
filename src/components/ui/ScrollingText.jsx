import { useEffect, useRef } from "react";
import { SplitText } from "@/lib/gsap";
import { useGlobalStore } from "@/stores/global";
import { clamp, map } from "@/lib/math";

function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

const RANGE_START = 0.15;
const RANGE_END = 0.75;

export function ScrollingText({ children, maxWidth, className = "" }) {
  const el = useRef(null);
  const splitRef = useRef(null);
  const positions = useRef([]);

  useEffect(() => {
    const node = el.current;
    if (!node) return;

    const split = () => {
      splitRef.current?.revert?.();
      splitRef.current = new SplitText(node, { type: "words,chars" });
      const chars = splitRef.current.chars || [];
      const parent = node.getBoundingClientRect();
      positions.current = chars.map((word) => {
        const b = word.getBoundingClientRect();
        const lineHeight = b.height || 1;
        const numLines = Math.max(1, Math.ceil(parent.height / lineHeight));
        const lineNumber = Math.floor((b.top - parent.top) / lineHeight);
        const linePosition = (b.left - parent.left) / Math.max(1, parent.width);
        const raw = (lineNumber + linePosition) / numLines;
        return clamp(raw * 0.8, 0, 0.8);
      });
      chars.forEach((word, i) => {
        word.classList.add("scrolling-text-word");
        word.style.setProperty("--word-pos", positions.current[i]);
      });
    };

    split();

    const onScroll = () => {
      if (!el.current) return;
      const rect = el.current.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const start = vh * (1 - RANGE_START);
      const end = vh * (1 - RANGE_END);
      const progress = clamp(map(rect.top, start, end, 0, 1), 0, 1);
      el.current.style.setProperty("--scroll-progress", easeOutExpo(progress));
    };

    const lenis = useGlobalStore.getState().lenis;
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", split);
    lenis?.on?.("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", split);
      lenis?.off?.("scroll", onScroll);
      splitRef.current?.revert?.();
    };
  }, []);

  return (
    <h3
      ref={el}
      className={`scrolling-text ${className}`}
      style={{
        ...(maxWidth != null ? { maxWidth } : null),
        "--scroll-progress": 0,
      }}
    >
      {children}
    </h3>
  );
}
