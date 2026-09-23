// Port of nine-ca's CustomSplitText (mono/components/SplitText) to the Astro
// island world: GSAP SplitText + IntersectionObserver instead of scroll-rig.
import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap, SplitText as SplitTextLib, useGSAP } from "@/lib/gsap";
import useInView from "@/hooks/useInView";
import { animations } from "./splittext-animations";

// GSAP warns on undefined/empty targets (e.g. component unmounted mid-wait
// during an Astro page swap)
const hasTargets = (t) => (Array.isArray(t) ? t.length > 0 : !!t);

const SplitText = forwardRef(
  (
    {
      tag = "span",
      className = "",
      children,
      animation: _animation = "lineClipped",
      type = "lines",
      splitTextOptions = { smartWrap: true },
      onScrollParams = {},
      dangerouslySetInnerHTML = false,
      animateOnScroll = false,
      ...props
    },
    ref,
  ) => {
    const localRef = useRef(null);
    const splitRefChild = useRef(null);
    const [elOriginal, elDouble] = [useRef(null), useRef(null)];
    const [splitRefOriginal, splitRefDouble] = [useRef(null), useRef(null)];

    const [isMounted, setIsMounted] = useState(false);
    const isAnimatedIn = useRef(false);
    const isAnimatingIn = useRef(false);
    const hasSplitOnce = useRef(false);
    const lastInParams = useRef(undefined);

    const hasSplitPromise = useRef(null);
    const hasSplitPromiseResolve = useRef(null);

    function resetSplitPromises() {
      if (hasSplitPromiseResolve.current) hasSplitPromiseResolve.current();
      hasSplitPromise.current = new Promise((res) => {
        hasSplitPromiseResolve.current = res;
      });
    }

    const tweens = useRef([]);
    const killAll = useCallback(() => {
      tweens.current.forEach((t) => t?.kill());
      tweens.current = [];
    }, []);
    const track = (tween) => {
      tweens.current.push(tween);
      return tween;
    };

    const content = useMemo(
      () => (typeof children === "string" ? children : ""),
      [children],
    );

    const typeKey = useMemo(() => {
      const t = typeof type === "string" ? type : "lines";
      if (t.includes("chars")) return "chars";
      if (t.includes("words")) return "words";
      return "lines";
    }, [type]);

    const splitType = useMemo(() => {
      const t = typeof type === "string" ? type : "lines";
      if (t.includes("chars") && !t.includes("words")) return `${t},words`;
      return t;
    }, [type]);

    const animation = useMemo(
      () =>
        typeof _animation === "string" ? animations[_animation] : _animation,
      [_animation],
    );

    const [isDouble, isMasked, shouldDangerouslySetInnerHTML] = useMemo(() => {
      const animationName = (animation?.name || "").toLowerCase();
      return [
        animationName.includes("double"),
        animationName.includes("masked") || animationName.includes("clip"),
        !!dangerouslySetInnerHTML?.__html,
      ];
    }, [animation, dangerouslySetInnerHTML]);

    const show = () => {
      if (isDouble) {
        if (elOriginal.current) elOriginal.current.style.visibility = "visible";
        if (elDouble.current) elDouble.current.style.visibility = "visible";
      } else if (localRef.current) {
        localRef.current.style.visibility = "visible";
      }
    };

    const hide = () => {
      if (isDouble) {
        if (elOriginal.current) elOriginal.current.style.visibility = "hidden";
        if (elDouble.current) elDouble.current.style.visibility = "hidden";
      } else if (localRef.current) {
        localRef.current.style.visibility = "hidden";
      }
    };

    const setAnimateIn = useCallback(() => {
      isAnimatedIn.current = false;

      if (isDouble) {
        if (hasTargets(splitRefOriginal.current?.[typeKey]))
          gsap.set(splitRefOriginal.current[typeKey], animation.set.original);
        if (hasTargets(splitRefDouble.current?.[typeKey]))
          gsap.set(splitRefDouble.current[typeKey], animation.set.double);
      } else if (hasTargets(splitRefChild.current?.[typeKey])) {
        gsap.set(splitRefChild.current[typeKey], animation.set.original);
      }
    }, [typeKey, isDouble, animation]);

    // After autoSplit replaces nodes, put them at the completed in-state so
    // we never replay the entrance (double anim / clip) or leave chars at
    // y:100% (invisible). nine-ca skips setAnimateIn once isAnimatedIn.
    const snapToInEnd = useCallback(() => {
      const params = lastInParams.current || {};
      if (isDouble) {
        const { original, double } = animation.in(params);
        if (hasTargets(splitRefOriginal.current?.[typeKey]))
          gsap.set(splitRefOriginal.current[typeKey], {
            y: original.y,
            opacity: 1,
          });
        if (hasTargets(splitRefDouble.current?.[typeKey]))
          gsap.set(splitRefDouble.current[typeKey], {
            y: double.y,
            opacity: 1,
          });
      } else if (hasTargets(splitRefChild.current?.[typeKey])) {
        const { original } = animation.in(params);
        gsap.set(splitRefChild.current[typeKey], {
          y: original.y,
          opacity: 1,
        });
      }
    }, [animation, typeKey, isDouble]);

    const setup = useCallback(async () => {
      if (!isMounted) return;

      hasSplitOnce.current = false;
      localRef.current?.classList.remove("splittext-ready");
      hide();
      resetSplitPromises();

      await document.fonts.ready;

      const handleOnSplit = () => {
        // First split: same as nine-ca — park chars at the in-start pose.
        // Later autoSplit (collage measure / image load): never replay the
        // entrance. If it already played or is playing, snap to the in-end
        // so fresh nodes aren't left clipped at y:100% or stacked twice.
        if (
          hasSplitOnce.current &&
          (isAnimatedIn.current || isAnimatingIn.current)
        ) {
          killAll();
          show();
          snapToInEnd();
          isAnimatedIn.current = true;
          isAnimatingIn.current = false;
        } else {
          setAnimateIn();
        }
        hasSplitOnce.current = true;
        if (hasSplitPromiseResolve.current) hasSplitPromiseResolve.current();
        localRef.current?.classList.add("splittext-ready");
      };

      if (shouldDangerouslySetInnerHTML) {
        if (isDouble) {
          if (elOriginal.current)
            elOriginal.current.innerHTML = dangerouslySetInnerHTML.__html;
          if (elDouble.current)
            elDouble.current.innerHTML = dangerouslySetInnerHTML.__html;
        } else if (localRef.current) {
          localRef.current.innerHTML = dangerouslySetInnerHTML.__html;
        }
      }

      const commonOptions = {
        type: splitType,
        linesClass: "splittext-child",
        charsClass: "splittext-char",
        wordsClass: "splittext-word",
        mask: isMasked ? typeKey : undefined,
        autoSplit: true,
        onInterrupt: () => {},
      };

      if (isDouble) {
        splitRefOriginal.current = new SplitTextLib(elOriginal.current, {
          ...commonOptions,
          onSplit: () => {
            splitRefDouble.current = new SplitTextLib(elDouble.current, {
              ...commonOptions,
              onSplit: handleOnSplit,
            });
          },
          ...splitTextOptions,
        });
      } else {
        splitRefChild.current = new SplitTextLib(localRef.current, {
          ...commonOptions,
          onSplit: handleOnSplit,
          ...splitTextOptions,
        });
      }
    }, [
      isDouble,
      isMasked,
      type,
      typeKey,
      splitType,
      shouldDangerouslySetInnerHTML,
      isMounted,
      setAnimateIn,
      snapToInEnd,
      killAll,
    ]);

    const animateIn = useCallback(
      async (params = {}) => {
        if (isAnimatedIn.current || isAnimatingIn.current) return;
        isAnimatingIn.current = true;
        lastInParams.current = params;

        // Wait until GSAP SplitText has produced targets — animateIn can be
        // triggered (scroll/parent) before setup has run after hydration.
        const targetSplit = isDouble ? splitRefOriginal : splitRefChild;
        let attempts = 0;
        while (!targetSplit.current?.[typeKey] && attempts < 100) {
          if (hasSplitPromise.current) await hasSplitPromise.current;
          else await new Promise((r) => requestAnimationFrame(r));
          attempts++;
        }
        if (isDouble && !splitRefDouble.current?.[typeKey]) {
          if (hasSplitPromise.current) await hasSplitPromise.current;
        }

        // autoSplit may have snapped to the in-state while we waited
        if (isAnimatedIn.current) return;
        if (!hasTargets(targetSplit.current?.[typeKey])) {
          isAnimatingIn.current = false;
          return;
        }

        killAll();
        setAnimateIn();
        show();

        const handleOnComplete = () => {
          isAnimatedIn.current = true;
          isAnimatingIn.current = false;
          params?.onComplete?.();
        };

        if (isDouble) {
          const { original, double } = animation.in(params);
          track(
            gsap.to(splitRefOriginal.current?.[typeKey], {
              ...original,
              onComplete: handleOnComplete,
            }),
          );
          if (hasTargets(splitRefDouble.current?.[typeKey]))
            track(gsap.to(splitRefDouble.current?.[typeKey], { ...double }));
        } else {
          const { original } = animation.in(params);
          track(
            gsap.to(splitRefChild.current?.[typeKey], {
              ...original,
              onComplete: handleOnComplete,
            }),
          );
        }
      },
      [animation, typeKey, isDouble, setAnimateIn, killAll],
    );

    const animateOut = useCallback(
      (params = {}) => {
        killAll();
        isAnimatingIn.current = false;

        const initialParams = animation.out(params);
        const tp = initialParams.type ?? typeKey;

        const handleOnComplete = () => {
          params?.onComplete?.();
          setAnimateIn();
          hide();
        };

        if (isDouble) {
          if (!hasTargets(splitRefDouble.current?.[tp])) return;
          const { double } = initialParams;
          track(
            gsap.to(splitRefDouble.current?.[tp], {
              ...double,
              onComplete: handleOnComplete,
            }),
          );
        } else {
          if (!hasTargets(splitRefChild.current?.[tp])) return;
          const { original } = initialParams;
          track(
            gsap.to(splitRefChild.current?.[tp], {
              ...original,
              onComplete: handleOnComplete,
            }),
          );
        }
      },
      [animation, typeKey, setAnimateIn, isDouble, killAll],
    );

    const hoverIn = useCallback(
      (params = {}) => {
        if (!animation.hoverIn) return;
        killAll();

        if (isDouble && hasTargets(splitRefDouble.current?.[typeKey])) {
          gsap.set(splitRefDouble.current?.[typeKey], animation.setHover.double);
          const { double } = animation.hoverIn(params);
          track(gsap.to(splitRefDouble.current?.[typeKey], { ...double }));
        }

        if (!hasTargets(splitRefOriginal.current?.[typeKey])) return;
        gsap.set(splitRefOriginal.current?.[typeKey], animation.setHover.original);
        const { original } = animation.hoverIn(params);
        track(gsap.to(splitRefOriginal.current?.[typeKey], { ...original }));
      },
      [animation, typeKey, isDouble, killAll],
    );

    const hoverOut = useCallback(
      (params = {}) => {
        if (!animation.hoverOut) return;
        killAll();

        if (isDouble && hasTargets(splitRefDouble.current?.[typeKey])) {
          const { double } = animation.hoverOut(params);
          track(gsap.to(splitRefDouble.current?.[typeKey], { ...double }));
        }

        if (!hasTargets(splitRefOriginal.current?.[typeKey])) return;
        const { original } = animation.hoverOut(params);
        track(gsap.to(splitRefOriginal.current?.[typeKey], { ...original }));
      },
      [animation, typeKey, isDouble, killAll],
    );

    const isReady = () => hasSplitPromise.current;

    useEffect(() => {
      setIsMounted(true);
    }, []);

    useEffect(() => {
      return () => {
        killAll();
        splitRefChild.current?.revert();
        splitRefChild.current = null;
        splitRefOriginal.current?.revert();
        splitRefOriginal.current = null;
        splitRefDouble.current?.revert();
        splitRefDouble.current = null;
        localRef.current?.classList.remove("splittext-ready");
        if (hasSplitPromiseResolve.current) hasSplitPromiseResolve.current();
      };
    }, [killAll]);

    useGSAP(setup, {
      scope: localRef,
      dependencies: [
        content,
        isDouble,
        isMasked,
        type,
        typeKey,
        splitType,
        isMounted,
        shouldDangerouslySetInnerHTML,
      ],
      revertOnUpdate: true,
    });

    useImperativeHandle(ref, () => ({
      animateIn,
      animateOut,
      show,
      hide,
      hoverIn,
      hoverOut,
      isReady,
      get element() {
        return localRef.current;
      },
    }));

    useInView({
      el: animateOnScroll && isMounted ? localRef : null,
      offset: 0.1,
      ...onScrollParams,
      handleIn: () => {
        if (!animateOnScroll || !isMounted) return;
        animateIn();
      },
    });

    const createTextContent = (text) => {
      const _content = shouldDangerouslySetInnerHTML ? null : text;

      if (isDouble) {
        return (
          <span className="splittext-parent">
            <span
              ref={elOriginal}
              className="splittext-original"
              style={{ visibility: "hidden" }}
            >
              {_content}
            </span>
            <span
              ref={elDouble}
              className="splittext-double"
              style={{ visibility: "hidden" }}
            >
              {_content}
            </span>
          </span>
        );
      }

      return _content;
    };

    if (!isMounted) {
      if (shouldDangerouslySetInnerHTML) {
        return createElement(tag, {
          className,
          dangerouslySetInnerHTML,
          ...props,
        });
      }
      return createElement(tag, { className, ...props }, content);
    }

    return createElement(
      tag,
      {
        ref: localRef,
        className,
        style: { visibility: "hidden" },
        ...props,
      },
      createTextContent(content),
    );
  },
);

SplitText.displayName = "SplitText";
export default SplitText;
