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

export function SectionTitle({ children, meta, id }) {
  const wrapper = useRef();
  const divider = useRef();
  const title = useRef();
  const metaRef = useRef();

  const { animateIn } = useAnimation({
    inParams: {
      duration: 0.5,
      ease: EASE_CUSTOM_2,
      delay: 0.1,
      onUpdate: (v) => {
        if (title.current)
          title.current.style.transform = `translateY(${(1 - v) * 100}%)`;
        if (metaRef.current)
          metaRef.current.style.transform = `translateY(${(1 - v) * 100}%)`;
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
    <div ref={wrapper} className={`section-title${meta ? " section-title--with-meta" : ""}`} id={id}>
      <div className="section-title__row">
      {children && (
        <h6 ref={title} className="section-title__text">
          {children}
        </h6>
      )}
      {meta && <p className="section-title__meta" ref={metaRef}>{meta}</p>}
      </div>
      <Divider ref={divider} />
    </div>
  );
}
