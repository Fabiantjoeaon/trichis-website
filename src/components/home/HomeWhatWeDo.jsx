import { useCallback, useEffect, useRef, useState } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import SplitText from "@/components/ui/SplitText";
import BorderedIcon from "@/components/ui/BorderedIcon";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import { useTicker } from "@/hooks/useTicker";
import { lerp } from "@/lib/math";
import { useGlobalStore } from "@/stores/global";

// Port of nine-ca WhatWeDoServicesMobile Navigation: chevron buttons with a
// horizontally sliding, centered list of service titles.
function ServicesMobileNav({ services, currIndex, setCurrIndex }) {
  const wrapper = useRef(null);
  const inner = useRef(null);
  const texts = useRef([]);
  const textWidths = useRef([]);
  const gap = useRef(0);
  const x = useRef(0);
  const _x = useRef(0);
  const currIndexRef = useRef(currIndex);
  currIndexRef.current = currIndex;

  const measure = useCallback(() => {
    texts.current.forEach((text, index) => {
      if (!text) return;
      textWidths.current[index] = text.getBoundingClientRect().width;
    });
    const secondLeft = texts.current[1]?.getBoundingClientRect()?.left;
    const firstRight = texts.current[0]?.getBoundingClientRect()?.right;
    gap.current = (secondLeft ?? 0) - (firstRight ?? 0);
  }, []);

  const setTarget = useCallback((index, snap = false) => {
    const wrapperWidth = wrapper.current?.offsetWidth || 0;
    const textWidth = textWidths.current[index] || 0;
    // Width of all texts before the current one (incl. gaps), then center it
    const totalWidth = textWidths.current
      .slice(0, index)
      .reduce((sum, width) => sum + width + gap.current, 0);
    x.current = totalWidth + textWidth / 2 - wrapperWidth / 2;
    if (snap) {
      _x.current = x.current;
      if (inner.current)
        inner.current.style.transform = `translateX(${-x.current}px)`;
    }
  }, []);

  useEffect(() => {
    const remeasure = (snap) => {
      measure();
      setTarget(currIndexRef.current, snap);
    };
    remeasure(true);
    document.fonts?.ready?.then(() => remeasure(true));
    const onResize = () => remeasure(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure, setTarget]);

  useEffect(() => {
    setTarget(currIndex);
  }, [currIndex, setTarget]);

  useTicker(
    ({ delta }) => {
      if (!inner.current) return;
      _x.current = lerp(_x.current, x.current, 0.05, delta);
      inner.current.style.transform = `translateX(${-_x.current}px)`;
    },
    { initiallyActive: true },
  );

  const move = (direction) =>
    setCurrIndex((i) => (i + direction + services.length) % services.length);

  return (
    <div className="what-we-do-mobile__navigation">
      <BorderedIcon
        className="what-we-do-mobile__navigation__icon icon-left"
        icon="chevronLeft"
        onClick={() => move(-1)}
      />
      <div
        className="what-we-do-mobile__navigation__inner-wrapper"
        ref={wrapper}
      >
        <div className="what-we-do-mobile__navigation__inner" ref={inner}>
          {services.map((service, index) => (
            <div
              key={service.link || service.label || index}
              className="what-we-do-mobile__navigation__item"
            >
              <TransitionLink href={service.link}>
                <span
                  ref={(el) => {
                    texts.current[index] = el;
                  }}
                  className={index === currIndex ? "active" : ""}
                >
                  {service.label}
                </span>
              </TransitionLink>
            </div>
          ))}
        </div>
      </div>
      <BorderedIcon
        className="what-we-do-mobile__navigation__icon icon-right"
        icon="chevronRight"
        onClick={() => move(1)}
      />
    </div>
  );
}

export default function HomeWhatWeDo({ data, currentService } = {}) {
  const services = data?.services ?? [];
  const initial = Math.max(
    0,
    services.findIndex((s) => s.link?.endsWith(`/${currentService}`)),
  );
  const [currIndex, setCurrIndex] = useState(initial);
  const track = useRef(null);
  const listRef = useRef(null);
  const itemsRef = useRef([]);
  const indicatorRef = useRef(null);
  const gap = useRef(0);
  const _pos = useRef(0);

  const isTabletOrSmallerLayout = useGlobalStore(
    (s) => s.isTabletOrSmallerLayout,
  );

  useEffect(() => {
    const first = itemsRef.current[0];
    if (!first) return;
    const computedStyle = window.getComputedStyle(first);
    const marginBottom = parseInt(computedStyle.marginBottom, 10) || 0;
    gap.current = first.offsetHeight + marginBottom;
  }, [services.length, isTabletOrSmallerLayout]);

  useTicker(
    ({ delta }) => {
      if (!indicatorRef.current) return;
      const target = gap.current * currIndex;
      _pos.current = lerp(_pos.current, target, 0.05, delta, 60);
      indicatorRef.current.style.transform = `translateY(${_pos.current}px)`;
    },
    { initiallyActive: true },
  );

  const current = services[currIndex];

  return (
    <>
      <SectionTitle>{data?.sectionTitle}</SectionTitle>
      <section
        className="home-what-we-do inner-width"
        id={data?.anchorId || undefined}
        ref={track}
      >
        <div className="home-what-we-do__top">
          <ScrollingText>{data?.scrollingText}</ScrollingText>
          <SplitText tag="p" className="home-what-we-do__intro t-paragraph" animateOnScroll>
            {data?.intro}
          </SplitText>
        </div>

        {isTabletOrSmallerLayout ? (
          <>
            <div className="what-we-do-mobile__media">
              <TransitionLink href={current?.link}>
                <img src={current?.media?.url} alt={current?.label} />
              </TransitionLink>
            </div>
            <ServicesMobileNav
              services={services}
              currIndex={currIndex}
              setCurrIndex={setCurrIndex}
            />
          </>
        ) : (
          <div className="home-what-we-do__bottom">
            <div className="home-what-we-do__list" ref={listRef}>
              <ul>
                {services.map((service, i) => (
                  <li
                    key={service.link || service.label || i}
                    ref={(el) => {
                      itemsRef.current[i] = el;
                    }}
                    className={i === currIndex ? "is-active" : ""}
                    onMouseEnter={() => setCurrIndex(i)}
                  >
                    {i === 0 && (
                      <div ref={indicatorRef} className="list-indicator" />
                    )}
                    <TransitionLink href={service.link}>
                      <span className="t-li">{service.label}</span>
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </div>

            <TransitionLink
              href={current?.link}
              className="home-what-we-do__media"
            >
              <article>
                <img src={current?.media?.url} alt={current?.label} />
              </article>
            </TransitionLink>
          </div>
        )}
      </section>
    </>
  );
}
