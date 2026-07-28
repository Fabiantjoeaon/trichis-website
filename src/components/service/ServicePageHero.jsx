import { useEffect, useRef } from "react";
import SplitText from "@/components/ui/SplitText";
import BorderedIcon from "@/components/ui/BorderedIcon";
import { convertMultiParagraphToNineFormat } from "@/lib/cms";
import useEvent from "@/hooks/useEvent";
import { events } from "@/lib/events";

export default function ServicePageHero({
  title = "Web-design",
  header,
  paragraph,
  cta,
}) {
  const titleRef = useRef(null);
  const formatted = convertMultiParagraphToNineFormat(paragraph);

  useEvent(events.LOADING_OUT_COMPLETE, () => {
    titleRef.current?.animateIn?.();
  });

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.animateIn?.(), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="service-page-hero inner-width">
      <div className="service-page-hero__titles" aria-hidden>
        <div className="service-page-hero__titles-inner">
          <SplitText tag="h1" ref={titleRef} animateOnScroll={false}>
            {title}
          </SplitText>
          <SplitText tag="h1" animateOnScroll={false}>
            {title}
          </SplitText>
          <SplitText tag="h1" animateOnScroll={false}>
            {title}
          </SplitText>
        </div>
      </div>

      <div className="service-page-hero__content">
        {header && (
          <SplitText tag="h3" animateOnScroll className="service-page-hero__header">
            {header}
          </SplitText>
        )}
        <div className="service-page-hero__paragraph">
          {formatted.map((p, i) => (
            <SplitText key={i} tag={p.tag} animateOnScroll>
              {p.text}
            </SplitText>
          ))}
        </div>
        {cta?.text && (
          <BorderedIcon
            text={cta.text}
            href={cta.href || cta.url || "mailto:cu@nine.nl"}
            dontTriggerPageTransition={(cta.href || cta.url || "").startsWith(
              "mailto:",
            )}
          />
        )}
      </div>
    </section>
  );
}
