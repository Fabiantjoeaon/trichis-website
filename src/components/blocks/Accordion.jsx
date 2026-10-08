import { useEffect, useId, useRef, useState } from "react";
import SplitText from "@/components/ui/SplitText";
import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import { gsap } from "@/lib/gsap";
import { EASE_CUSTOM_4 } from "@/lib/easing";
import { SectionTitle } from "@/components/ui/Divider";
import { useCanvasStore } from "@/lib/gl/canvasStore";

function AccordionItem({ question, answer, isOpen, onToggle }) {
  const panelRef = useRef(null);
  const didMount = useRef(false);
  const id = useId();

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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reflow = () => useCanvasStore.getState().triggerReflow();

    if (isOpen) {
      panel.hidden = false;
      gsap.fromTo(
        panel,
        { height: 0 },
        {
          height: "auto",
          duration: reducedMotion ? 0 : 0.4,
          ease: EASE_CUSTOM_4,
          onComplete: reflow,
        },
      );
    } else {
      gsap.to(panel, {
        height: 0,
        duration: reducedMotion ? 0 : 0.3,
        ease: EASE_CUSTOM_4,
        onComplete: () => {
          panel.hidden = true;
          reflow();
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
          id={`${id}-question`}
          aria-controls={`${id}-answer`}
          onClick={onToggle}
        >
          <span className="project-acc__ico" aria-hidden="true">
            ⮮
          </span>
          <SplitText tag="span" animateOnScroll>{question}</SplitText>
        </button>
      </h3>
      <div className="project-acc__a" ref={panelRef} hidden inert={!isOpen}
        id={`${id}-answer`} aria-labelledby={`${id}-question`} role="region">
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
  const [open, setOpen] = useState(null);

  if (!title && !media && !items.length) return null;

  return (
    <>
    {title && <SectionTitle>{title}</SectionTitle>}
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
              alt={media.alt || ""}
              width={media.width}
              height={media.height}
              isVideo={!!media.isVideo}
              offset={0.1}
            />
          </div>
        )}
        <div className="project-accordion__list">
          {items.map((item, index) => (
            <AccordionItem
              key={`${item.question}-${index}`}
              question={item.question}
              answer={item.answer}
              isOpen={open === index}
              onToggle={() => setOpen((current) => current === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
    </>
  );
}
