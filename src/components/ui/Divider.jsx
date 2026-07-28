// Port of nine-ca's Divider + SectionTitle (components/SectionTitle.js)
import { forwardRef, useImperativeHandle, useRef } from "react";
import useAnimation from "@/hooks/useAnimation";
import useInView from "@/hooks/useInView";
import { EASE_CUSTOM_2 } from "@/lib/easing";

export const Divider = forwardRef(({ className = "", ...props }, ref) => {
  const localRef = useRef();

  const { animateIn } = useAnimation({
    inParams: {
      ease: EASE_CUSTOM_2,
      duration: 2,
      onUpdate: (v) => {
        if (localRef.current) localRef.current.style.transform = `scaleX(${v})`;
      },
    },
  });

  useImperativeHandle(ref, () => ({ animateIn }));

  return <div className={`divider ${className}`} ref={localRef} {...props} />;
});

Divider.displayName = "Divider";

export function SectionTitle({ children }) {
  const wrapper = useRef();
  const divider = useRef();
  const title = useRef();

  const { animateIn } = useAnimation({
    inParams: {
      duration: 0.5,
      ease: EASE_CUSTOM_2,
      delay: 0.1,
      onUpdate: (v) => {
        if (title.current)
          title.current.style.transform = `translateY(${(1 - v) * 100}%)`;
      },
    },
  });

  useInView({
    el: wrapper,
    handleIn: () => {
      divider.current?.animateIn({ delay: 0.1 });
      animateIn();
    },
  });

  return (
    <div ref={wrapper} className="section-title">
      {children && (
        <h6 ref={title} className="section-title__text">
          {children}
        </h6>
      )}
      <Divider ref={divider} />
    </div>
  );
}
