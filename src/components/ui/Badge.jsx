// Port of nine-ca components/Badge (theme switcher pills)
import { forwardRef, useImperativeHandle, useRef } from "react";
import { wait } from "@/lib/math";
import { useCSSClassTransition } from "@/hooks/useAnimation";
import ShuffledText from "./ShuffledText";

const Badge = forwardRef(({ selected, children, className = "", ...props }, ref) => {
  const wrapper = useRef();
  const text = useRef();
  const { animateIn } = useCSSClassTransition({ element: wrapper });

  useImperativeHandle(ref, () => ({
    animateIn: async ({ delay = 0 } = {}) => {
      await wait(delay * 1000);
      animateIn();
      text.current?.animateIn({ delay: 0.2 });
    },
  }));

  return (
    <div
      {...props}
      ref={wrapper}
      className={`badge ${selected ? "badge--selected" : ""} ${className}`}
    >
      <ShuffledText immediate={!!ref} text={children} ref={text} />
    </div>
  );
});

Badge.displayName = "Badge";
export default Badge;
