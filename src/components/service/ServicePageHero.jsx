import { useRef } from "react";
import SplitText from "@/components/ui/SplitText";
import BorderedIcon from "@/components/ui/BorderedIcon";
import { convertMultiParagraphToNineFormat } from "@/lib/cms";
import usePageEnter from "@/hooks/usePageEnter";

export default function ServicePageHero({
  title = "Web-design",
  header,
  paragraph,
  cta,
}) {
  const titleRef = useRef(null);
  const headerRef = useRef(null);
  const formatted = convertMultiParagraphToNineFormat(paragraph);

  function animateIn() {
    titleRef.current?.animateIn?.();
    headerRef.current?.animateIn?.();
  }

  usePageEnter(() => {
    setTimeout(animateIn, 400);
  });

  return (
    <section className="service-page-hero inner-width">
      <div className="service-page-hero__titles" aria-hidden>
        <div className="service-page-hero__titles-inner">
          <SplitText tag="h1" ref={titleRef} animateOnScroll={false} className="t-service-hero-title">
            {title}
          </SplitText>
          <SplitText tag="h1" animateOnScroll={false} className="t-service-hero-title">
            {title}
          </SplitText>
          <SplitText tag="h1" animateOnScroll={false} className="t-service-hero-title">
            {title}
          </SplitText>
        </div>
      </div>

      {header && (
        <div className="service-page-hero__header-wrap">
          <SplitText
            tag="h3"
            ref={headerRef}
            animateOnScroll={false}
            className="service-page-hero__header t-service-hero-subtitle"
          >
            {header}
          </SplitText>
        </div>
      )}

      <div className="service-page-hero__content">
        <div className="service-page-hero__paragraph">
          {formatted.map((p, i) => (
            <SplitText key={i} tag={p.tag} animateOnScroll={false}>
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
