import { useEffect, useRef, useState } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import SplitText from "@/components/ui/SplitText";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import { serviceMap, SERVICE_IMAGE_URLS } from "@/lib/constants";
import useInView from "@/hooks/useInView";
import { useTicker } from "@/hooks/useTicker";
import { lerp } from "@/lib/math";

export default function HomeWhatWeDo({ currentService } = {}) {
  const keys = Object.keys(serviceMap);
  const initial = Math.max(0, keys.indexOf(currentService));
  const [currIndex, setCurrIndex] = useState(initial >= 0 ? initial : 0);
  const track = useRef(null);
  const listRef = useRef(null);
  const itemsRef = useRef([]);
  const indicatorRef = useRef(null);
  const captionRef = useRef(null);
  const gap = useRef(0);
  const _pos = useRef(0);

  useInView({
    el: track,
    handleIn: () => {
      captionRef.current?.animateIn?.({ delay: 0.3 });
    },
  });

  useEffect(() => {
    const first = itemsRef.current[0];
    if (!first) return;
    const computedStyle = window.getComputedStyle(first);
    const marginBottom = parseInt(computedStyle.marginBottom, 10) || 0;
    gap.current = first.offsetHeight + marginBottom;
  }, [keys.length]);

  useEffect(() => {
    captionRef.current?.animateIn?.({ delay: 0.1 });
  }, [currIndex]);

  useTicker(
    ({ delta }) => {
      if (!indicatorRef.current) return;
      const target = gap.current * currIndex;
      _pos.current = lerp(target, _pos.current, 0.05, delta);
      indicatorRef.current.style.transform = `translateY(${_pos.current}px)`;
    },
    { initiallyActive: true },
  );

  const currentKey = keys[currIndex];
  const currentUrl = `/service/${currentKey}`;

  return (
    <>
      <SectionTitle>What we do</SectionTitle>
      <section className="home-what-we-do inner-width" ref={track}>
        <div className="home-what-we-do__top">
          <ScrollingText>
            You got the vibe, we got the tools.
          </ScrollingText>
          <SplitText tag="p" className="home-what-we-do__intro t-paragraph" animateOnScroll>
            Opvallen is niet genoeg. Wij zorgen ervoor dat jouw merk onthouden
            wordt. Voorbij de hype, recht het hart in. Alleen zo blijf je top of
            mind.
          </SplitText>
        </div>

        <div className="home-what-we-do__bottom">
          <div className="home-what-we-do__list" ref={listRef}>
            <ul>
              {keys.map((key, i) => (
                <li
                  key={key}
                  ref={(el) => {
                    itemsRef.current[i] = el;
                  }}
                  className={i === currIndex ? "is-active" : ""}
                  onMouseEnter={() => setCurrIndex(i)}
                >
                  {i === 0 && (
                    <div ref={indicatorRef} className="list-indicator" />
                  )}
                  <TransitionLink href={`/service/${key}`}>
                    <span className="t-li">{serviceMap[key]}</span>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>

          <TransitionLink href={currentUrl} className="home-what-we-do__media">
            <article>
              <img
                src={SERVICE_IMAGE_URLS[currentKey]}
                alt={serviceMap[currentKey]}
              />
            </article>
            <SplitText
              tag="p"
              ref={captionRef}
              animateOnScroll={false}
              className="home-what-we-do__caption t-li"
            >
              {serviceMap[currentKey]}
            </SplitText>
          </TransitionLink>
        </div>
      </section>
    </>
  );
}
