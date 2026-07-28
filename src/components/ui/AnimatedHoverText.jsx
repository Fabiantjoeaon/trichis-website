// Port of nine-ca components/AnimatedHoverText: light text that swaps with a
// bold duplicate on hover via lerped translateY.
import { forwardRef, useImperativeHandle, useRef } from "react";
import useAnimation from "@/hooks/useAnimation";
import { useTicker } from "@/hooks/useTicker";
import { lerp, map } from "@/lib/math";
import { EASE_CUSTOM_2 } from "@/lib/easing";
import { useGlobalStore } from "@/stores/global";
import SplitText from "./SplitText";

const maxY = 110;

const AnimatedHoverText = forwardRef(
  (
    {
      children,
      className = "",
      secondaryTextClassName = "",
      enabled = true,
      ...props
    },
    ref,
  ) => {
    const splitText = useRef();
    const boldText = useRef();
    const y = useRef(0);
    const _y = useRef(0);
    const hoverVisible = useRef(false);

    const duration = 0.65;

    const isMobileLayout = useGlobalStore((state) => state.isMobileLayout);
    const isEnabled = useRef(enabled);

    function handleEnter() {
      if (isMobileLayout) return;
      if (!isEnabled.current) return;
      hoverVisible.current = true;
      animateIn();
    }

    function handleLeave() {
      if (isMobileLayout) return;
      if (!isEnabled.current) return;
      hoverVisible.current = false;
      animateOut();
    }

    useImperativeHandle(ref, () => ({
      animateIn: (params) => splitText.current?.animateIn(params),
      animateOut: (params) => splitText.current?.animateOut(params),
      toggleEnabled: (value) => {
        isEnabled.current = value ?? !isEnabled.current;
      },
      isHoverVisible: () => hoverVisible.current,
      triggerLeave: handleLeave,
    }));

    const { animateIn, animateOut } = useAnimation({
      inParams: {
        duration,
        ease: EASE_CUSTOM_2,
        onStart: () => start(),
        onUpdate: (v) => {
          y.current = v;
        },
      },
      outParams: {
        duration,
        ease: EASE_CUSTOM_2,
        onUpdate: (v) => {
          y.current = v;
        },
        onComplete: () => stop(),
      },
    });

    const { start, stop } = useTicker(({ delta }) => {
      if (isMobileLayout) return;

      _y.current = lerp(y.current, _y.current, 0.1, delta);
      const splitYLerped = lerp(_y.current, y.current, 0.1, delta);
      const boldYLerped = lerp(_y.current, y.current, 0.02, delta);

      const splitY = map(splitYLerped, 0, 1, 0, -maxY);
      const boldY = map(boldYLerped, 0, 1, maxY, 0);

      if (splitText.current?.element)
        splitText.current.element.style.transform = `translateY(${splitY}%)`;
      if (boldText.current)
        boldText.current.style.transform = `translateY(${boldY}%)`;
    });

    return (
      <div
        {...props}
        className={`${className} animated-hover-text`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <SplitText ref={splitText} animateOnScroll={false} tag="h2">
          {children}
        </SplitText>
        {!isMobileLayout && (
          <h2 ref={boldText} className={`${secondaryTextClassName} bold-text`}>
            {children}
          </h2>
        )}
      </div>
    );
  },
);

AnimatedHoverText.displayName = "AnimatedHoverText";
export default AnimatedHoverText;
