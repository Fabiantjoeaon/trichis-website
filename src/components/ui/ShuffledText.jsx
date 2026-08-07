// Port of nine-ca mono/components/ShuffledText (txt-shuffle based)
import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { shuffle } from "txt-shuffle";
import { useGlobalStore } from "@/stores/global";
import useInView from "@/hooks/useInView";

const fps = 15;

// Random sentences (from Site Settings) — populated by the chrome island.
let randomSentences = [];
export const setRandomSentences = (sentences) => {
  if (Array.isArray(sentences)) randomSentences = sentences;
};

const getRandomSentence = () => {
  if (randomSentences.length === 0) return "";
  return randomSentences[Math.floor(Math.random() * randomSentences.length)];
};

const ShuffledText = forwardRef(
  (
    {
      tag = "span",
      className = "",
      wrapperClassName = "",
      text: initialText,
      immediate = false,
      shuffleOptions = {},
      hoverAnimation = true,
      removeOnOut = false,
      animateOnScroll = false,
      noMeasure = false,
      useRandomText = false,
      ...props
    },
    ref,
  ) => {
    const [text, setText] = useState(initialText);

    useEffect(() => {
      if (useRandomText) setText(getRandomSentence());
    }, [useRandomText]);

    const [textRef, containerRef] = [useRef(), useRef()];
    const windowSize = useGlobalStore((s) => s.windowSize);
    const measurementRef = useRef(null);

    const shuffleText = useCallback(
      (_text, _options) => {
        const options = _options ?? shuffleOptions;

        return shuffle({
          text: _text,
          fps,
          direction: "random",
          ...options,
          onUpdate: (output) => {
            if (textRef.current) textRef.current.textContent = output;
          },
          onComplete: () => {
            _options?.onComplete?.();
          },
        });
      },
      [shuffleOptions],
    );

    // Reserve height with a persistent hidden measurement element so the
    // shuffle animation doesn't cause layout shift.
    useLayoutEffect(() => {
      if (noMeasure || !containerRef.current) return;

      if (!measurementRef.current) {
        measurementRef.current = document.createElement("div");
        measurementRef.current.style.visibility = "hidden";
        measurementRef.current.style.position = "absolute";
        measurementRef.current.style.pointerEvents = "none";
        measurementRef.current.style.top = "-9999px";
        measurementRef.current.style.left = "-9999px";
        document.body.appendChild(measurementRef.current);
      }

      const measureEl = measurementRef.current;
      measureEl.style.width = `${containerRef.current.offsetWidth}px`;
      measureEl.className = wrapperClassName;
      measureEl.innerHTML = "";

      const innerText = document.createElement(tag);
      innerText.className = `txt-shuffle ${className}`;
      innerText.textContent = text;
      measureEl.appendChild(innerText);

      const height = measureEl.offsetHeight;
      if (height > 0) containerRef.current.style.height = `${height}px`;
    }, [text, tag, className, wrapperClassName, windowSize, noMeasure]);

    useEffect(() => {
      return () => {
        // .remove() is safe even after Astro swaps document.body, in which
        // case the node's parent is the detached old body
        measurementRef.current?.remove();
        measurementRef.current = null;
      };
    }, []);

    const animateIn = useCallback(
      (params) => {
        shuffleText(text, { ...params, animation: "show", fps });
      },
      [text, shuffleText],
    );

    const animateOut = useCallback(
      (params) => {
        shuffleText(text, {
          ...params,
          animation: "hide",
          fps,
          onComplete: () => {
            if (removeOnOut && containerRef.current)
              containerRef.current.style.display = "none";
            params?.onComplete?.();
          },
        });
      },
      [text, shuffleText, removeOnOut],
    );

    useInView({
      el: animateOnScroll ? containerRef : null,
      handleIn: () => {
        if (animateOnScroll) animateIn();
      },
    });

    useEffect(() => {
      if (immediate) shuffleText(text);
    }, [text, immediate, shuffleText]);

    const getTextWidth = useCallback((newText) => {
      return new Promise((resolve) => {
        if (!textRef.current) {
          resolve(0);
          return;
        }

        requestAnimationFrame(() => {
          const originalText = textRef.current.textContent;
          textRef.current.textContent = newText;
          const width = textRef.current.offsetWidth;
          textRef.current.textContent = originalText;
          resolve(width);
        });
      });
    }, []);

    const shuffleInPlace = useCallback(() => {
      shuffleText(text, { animation: "stay", fps });
    }, [text, shuffleText]);

    const setTextHandler = useCallback(
      (newText) => {
        setText(newText);
        return getTextWidth(newText);
      },
      [getTextWidth],
    );

    const imperativeValue = useMemo(
      () => ({
        animateIn,
        animateOut,
        shuffleInPlace,
        setText: setTextHandler,
        get element() {
          return textRef.current;
        },
        get container() {
          return containerRef.current;
        },
        getTextWidth,
      }),
      [animateIn, animateOut, shuffleInPlace, setTextHandler, getTextWidth],
    );

    useImperativeHandle(ref, () => imperativeValue, [imperativeValue]);

    return (
      <div
        className={`txt-shuffle-wrapper ${wrapperClassName}`}
        ref={containerRef}
        onMouseEnter={() => {
          if (!hoverAnimation) return;
          shuffleText(text, {
            duration: 0.4,
            animation: "stay",
            direction: "random",
            fps,
          });
        }}
        {...props}
      >
        {createElement(
          tag,
          { ref: textRef, className: `txt-shuffle ${className}` },
          text,
        )}
        {props.children}
      </div>
    );
  },
);

ShuffledText.displayName = "ShuffledText";
export default ShuffledText;
