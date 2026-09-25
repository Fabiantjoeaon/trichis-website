import { useEffect, useRef, useState } from "react";
import SplitText from "@/components/ui/SplitText";
import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import { gsap } from "@/lib/gsap";
import { EASE_CUSTOM_4 } from "@/lib/easing";

function AccordionItem({ question, answer, isOpen, onToggle }) {
  const panelRef = useRef(null);
  const didMount = useRef(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (!didMount.current) {
      didMount.current = true;
      if (!isOpen) {
        panel.hidden = true;
        panel.style.height = "0px";
      }
      return;
    }

    gsap.killTweensOf(panel);

    if (isOpen) {
      panel.hidden = false;
      gsap.fromTo(
        panel,
        { height: 0 },
        {
          height: "auto",
          duration: 0.4,
          ease: EASE_CUSTOM_4,
        },
      );
    } else {
      gsap.to(panel, {
        height: 0,
        duration: 0.3,
        ease: EASE_CUSTOM_4,
        onComplete: () => {
          panel.hidden = true;
        },
      });
    }

    return () => gsap.killTweensOf(panel);
  }, [isOpen]);

  return (
    <div className={`project-acc${isOpen ? " is-open" : ""}`}>
      <h3>
        <button
          className="project-acc__q"
          type="button"
          aria-expanded={isOpen}
          onClick={onToggle}
        >
          <span className="project-acc__ico" aria-hidden="true">
            ⮮
          </span>
          <span>{question}</span>
        </button>
      </h3>
      <div className="project-acc__a" ref={panelRef} hidden>
        {answer && (
          /<\/?[a-z][\s\S]*>/i.test(answer) ? (
            <div
              className="project-acc__html"
              dangerouslySetInnerHTML={{ __html: answer }}
            />
          ) : (
            <p>{answer}</p>
          )
        )}
      </div>
    </div>
  );
}

export default function Accordion({ data }) {
  const { title, media, items = [], anchorId } = data || {};
  const [open, setOpen] = useState([]);

  if (!title && !media && !items.length) return null;

  return (
    <section
      className="project-accordion inner-width"
      id={anchorId || undefined}
    >
      <div className={`project-accordion__grid${media ? "" : " is-text-only"}`}>
        {media && (
          <div className="project-accordion__media">
            <NineGLImageElement
              className="project-accordion__image"
              isLink={false}
              src={media.url}
              width={media.width}
              height={media.height}
              isVideo={!!media.isVideo}
              offset={-0.5}
            />
          </div>
        )}
        <div className="project-accordion__list">
          {title && (
            <SplitText tag="h2" className="project-accordion__title" animateOnScroll>
              {title}
            </SplitText>
          )}
          {items.map((item, index) => (
            <AccordionItem
              key={`${item.question}-${index}`}
              question={item.question}
              answer={item.answer}
              isOpen={open.includes(index)}
              onToggle={() =>
                setOpen((current) =>
                  current.includes(index)
                    ? current.filter((i) => i !== index)
                    : [...current, index],
                )
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
