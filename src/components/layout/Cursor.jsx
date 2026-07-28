// Port of nine-ca components/Cursor.js — custom labeled cursor shown via
// CURSOR_SHOW/CURSOR_HIDE events.
import { useRef } from "react";
import { events } from "@/lib/events";
import { mouseState } from "@/lib/mouse";
import { lerp, map, wait } from "@/lib/math";
import { EASE_CUSTOM_4 } from "@/lib/easing";
import { useGlobalStore } from "@/stores/global";
import useEvent from "@/hooks/useEvent";
import useAnimation from "@/hooks/useAnimation";
import { useTicker } from "@/hooks/useTicker";
import ShuffledText from "@/components/ui/ShuffledText";

export function Cursor() {
  const wrapper = useRef();
  const cursor = useRef();
  const pos = useRef({ x: 0, y: 0 });

  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);

  const visible = useRef(false);
  const shuffledText = useRef();

  const [value, _value] = [useRef(0), useRef(0)];

  const { start, stop } = useTicker(({ delta }) => {
    const { x, y } = mouseState.mouse;

    pos.current.x = lerp(x, pos.current.x, 0.6, delta);
    pos.current.y = lerp(y, pos.current.y, 0.6, delta);

    _value.current = lerp(value.current, _value.current, 0.7, delta);

    const deg = 0;
    let rotation = map(_value.current, 0, 1, -deg, 0);
    if (!visible.current) rotation = map(_value.current, 0, 1, deg, 0);

    if (cursor.current)
      cursor.current.style.transform = `scale(${_value.current}) rotate(${rotation}deg)`;
    if (wrapper.current)
      wrapper.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
  });

  const { animateIn, animateOut } = useAnimation({
    inParams: {
      ease: EASE_CUSTOM_4,
      duration: 0.4,
      onStart: () => {
        visible.current = true;
        start();
        if (wrapper.current) wrapper.current.style.display = "block";
        shuffledText.current?.animateIn?.({ duration: 0.2 });
      },
      onUpdate: (v) => {
        value.current = v;
      },
    },
    outParams: {
      ease: EASE_CUSTOM_4,
      duration: 0.2,
      onStart: () => {
        visible.current = false;
        shuffledText.current?.animateOut?.({ duration: 0.2 });
      },
      onUpdate: (v) => {
        value.current = v;
      },
      onComplete: () => {
        if (wrapper.current) wrapper.current.style.display = "none";
        stop();
      },
    },
  });

  useEvent(events.CURSOR_SHOW, async ({ text } = {}) => {
    if (visible.current) return;
    const width = await shuffledText.current.setText(text);
    const padding = 40;
    if (width > 0 && wrapper.current)
      wrapper.current.style.width = `${width + padding * 2}px`;

    await wait(100);
    animateIn();
  });

  useEvent(events.CURSOR_HIDE, () => {
    if (!visible.current) return;
    animateOut();
  });

  if (isMobileLayout) return null;

  return (
    <div className="cursor" ref={wrapper}>
      <div className="cursor-inner" ref={cursor}>
        <div className="cursor-fill"></div>
        <ShuffledText immediate={false} ref={shuffledText} />
      </div>
    </div>
  );
}
