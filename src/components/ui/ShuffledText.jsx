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

const ShuffledText = forwardRef(
  (
    {
      tag = "span",
      className = "",
      wrapperClassName = "",
      text: initialText,
      immediate = false,
      removeOnOut = false,
      shuffleOptions: _shuffleOptions,
      hoverAnimation: _hoverAnimation,
      animateOnScroll: _animateOnScroll,
      noMeasure: _noMeasure,
      children,
      ...props
    },
    ref,
  ) => {
    const [text, setText] = useState(initialText);
    const textRef = useRef();
    const containerRef = useRef();

    useEffect(() => {
      if (initialText !== undefined) setText(initialText);
    }, [initialText]);

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

    const setTextHandler = useCallback(
      (newText) => {
        setText(newText);
        if (textRef.current) textRef.current.textContent = newText ?? "";
        return getTextWidth(newText);
      },
      [getTextWidth],
    );

    const animateIn = useCallback(() => {
      if (containerRef.current) containerRef.current.style.display = "";
      if (textRef.current) textRef.current.textContent = text ?? "";
    }, [text]);

    const animateOut = useCallback(
      (params) => {
        if (removeOnOut && containerRef.current) {
          containerRef.current.style.display = "none";
        }
        params?.onComplete?.();
      },
      [removeOnOut],
    );

    const imperativeValue = useMemo(
      () => ({
        animateIn,
        animateOut,
        shuffleInPlace: () => {},
        setText: setTextHandler,
        get element() {
          return textRef.current;
        },
        get container() {
          return containerRef.current;
        },
        getTextWidth,
      }),
      [animateIn, animateOut, setTextHandler, getTextWidth],
    );

    useImperativeHandle(ref, () => imperativeValue, [imperativeValue]);

    useEffect(() => {
      if (immediate && textRef.current) {
        textRef.current.textContent = text ?? "";
      }
    }, [text, immediate]);

    return (
      <div
        className={`txt-shuffle-wrapper ${wrapperClassName}`}
        ref={containerRef}
        {...props}
      >
        {createElement(
          tag,
          { ref: textRef, className: `txt-shuffle ${className}` },
          text,
        )}
        {children}
      </div>
    );
  },
);

ShuffledText.displayName = "ShuffledText";
export default ShuffledText;
