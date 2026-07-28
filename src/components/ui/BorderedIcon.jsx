// Port of nine-ca components/BorderedIcon: circular-reveal icon button with
// duplicate-icon hover swap and optional label.
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import useAnimation from "@/hooks/useAnimation";
import useInView from "@/hooks/useInView";
import { map } from "@/lib/math";
import { EASE_CUSTOM_2 } from "@/lib/easing";
import SplitText from "./SplitText";
import { TransitionLink } from "./TransitionLink";

const ArrowIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
    <path d="M867.9 500 847 479.1 557.5 189.6l-20.9 21 274.6 274.6H142.5v29.6h668.8L536.6 789.4l20.9 21L847 520.9l20.9-20.9z" />
  </svg>
);

const ChevronIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 113 216">
    <path d="M110.2 105.2 4.90002 0 0 4.90002 102.9 107.8 0 210.5l4.90002 4.9L112.8 107.8l-2.6-2.6Z" />
  </svg>
);

const CloseIcon = (
  <svg width="406" height="406" viewBox="0 0 406 406" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 403.001L403 3.21094" stroke="currentColor" strokeWidth="26" strokeMiterlimit="10" />
    <path d="M3 3L403 402.79" stroke="currentColor" strokeWidth="26" strokeMiterlimit="10" />
  </svg>
);

const iconMap = {
  arrow: ArrowIcon,
  close: CloseIcon,
  chevronLeft: ChevronIcon,
  chevronRight: ChevronIcon,
};

const BorderedIcon = forwardRef(
  (
    {
      icon = "arrow",
      onClick,
      className = "",
      href,
      text,
      transparent,
      animateOnScroll = true,
      dontTriggerPageTransition = false,
      offset = 0,
      onScrollParams = {},
      size,
      disableSplitText = false,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const wrapper = useRef();
    const textRef = useRef();
    const isLink = !(href === undefined || href === "" || href === null);

    const onUpdate = (v) => {
      const rotation = map(v, 0, 1, -50, 0);
      if (wrapper.current) {
        wrapper.current.style.transform = `scale(${v}) rotateZ(${rotation}deg)`;
        wrapper.current.style.opacity = v;
      }
    };

    const { animateIn, animateOut } = useAnimation({
      inParams: { duration: 1.4, delay: 0.4, ease: EASE_CUSTOM_2, onUpdate },
      outParams: { duration: 1, ease: EASE_CUSTOM_2, onUpdate },
    });

    useImperativeHandle(ref, () => ({
      animateIn: (params = {}) => {
        animateIn(params);
        if (!animateOnScroll && text) {
          const delay = params.delay ?? 0;
          textRef.current?.animateIn({ delay: delay + 0.4 });
        }
      },
      animateOut,
    }));

    useInView({
      el: wrapper,
      offset,
      handleIn: () => {
        if (!animateOnScroll) return;
        animateIn(onScrollParams);
      },
    });

    const sizeStyle = useMemo(
      () => (size ? { "--icon-size": size } : undefined),
      [size],
    );

    const iconComponent = (
      <div
        className={`icon-container ${disabled ? "icon-container--disabled" : ""} ${className}`}
        style={sizeStyle}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        <div
          ref={wrapper}
          className={`icon-wrapper icon-${icon} ${transparent ? "icon-wrapper--transparent" : ""}`}
        >
          <div className="icon icon-first">{iconMap[icon]}</div>
          <div className="icon icon-duplicate">{iconMap[icon]}</div>
          <div className="icon-background"></div>
        </div>
        {text &&
          (disableSplitText ? (
            <h4>{text}</h4>
          ) : (
            <SplitText
              ref={textRef}
              dangerouslySetInnerHTML={{ __html: text }}
              animateOnScroll={animateOnScroll}
              tag="h4"
            />
          ))}
      </div>
    );

    if (dontTriggerPageTransition && isLink)
      return <a href={href ?? "#"}>{iconComponent}</a>;

    return isLink ? (
      <TransitionLink href={href ?? "#"}>{iconComponent}</TransitionLink>
    ) : (
      iconComponent
    );
  },
);

BorderedIcon.displayName = "BorderedIcon";
export default BorderedIcon;
