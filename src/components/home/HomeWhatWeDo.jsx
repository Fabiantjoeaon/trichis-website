import { useRef, useState } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import SplitText from "@/components/ui/SplitText";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import { serviceMap, SERVICE_IMAGE_URLS } from "@/lib/constants";
import useInView from "@/hooks/useInView";

export default function HomeWhatWeDo({ currentService } = {}) {
  const keys = Object.keys(serviceMap);
  const initial = Math.max(0, keys.indexOf(currentService));
  const [currIndex, setCurrIndex] = useState(initial >= 0 ? initial : 0);
  const track = useRef(null);
  const leftRefs = useRef([]);
  const rightRefs = useRef([]);

  useInView({
    el: track,
    handleIn: () => {
      leftRefs.current[currIndex]?.animateIn?.();
      rightRefs.current[currIndex]?.animateIn?.({ delay: 0.3 });
    },
  });

  const currentKey = keys[currIndex];
  const currentUrl = `/service/${currentKey}`;

  return (
    <>
      <SectionTitle>What we do</SectionTitle>
      <section className="home-what-we-do inner-width" ref={track}>
        <ScrollingText>
          You already look great, let us make you look fantastic!
        </ScrollingText>

        <div className="home-what-we-do__bottom">
          <div className="home-what-we-do__list">
            <ul>
              {keys.map((key, i) => (
                <li
                  key={key}
                  className={i === currIndex ? "is-active" : ""}
                  onMouseEnter={() => setCurrIndex(i)}
                >
                  <TransitionLink href={`/service/${key}`}>
                    <SplitText
                      tag="span"
                      ref={(r) => {
                        leftRefs.current[i] = r;
                      }}
                      animateOnScroll={false}
                    >
                      {serviceMap[key]}
                    </SplitText>
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
              ref={(r) => {
                rightRefs.current[currIndex] = r;
              }}
              animateOnScroll={false}
              className="home-what-we-do__caption"
            >
              {serviceMap[currentKey]}
            </SplitText>
          </TransitionLink>
        </div>
      </section>
    </>
  );
}
