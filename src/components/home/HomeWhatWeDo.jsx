import { useEffect, useId, useRef, useState } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import SplitText from "@/components/ui/SplitText";
import usePageEnter from "@/hooks/usePageEnter";
import HomeGlyph from "./HomeGlyph";

function ServiceButton({ service, selected, panelId, onSelect }) {
  const label = useRef(null);
  usePageEnter(() => label.current?.animateIn({ duration: 0.01, delay: 0 }));
  const hover = (active) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    label.current?.[active ? "hoverIn" : "hoverOut"]({ duration: 0.45 });
  };
  return (
    <button type="button" aria-label={service.label} aria-pressed={selected} aria-controls={panelId}
      onClick={onSelect}
      onMouseEnter={() => { onSelect(); hover(true); }}
      onMouseLeave={(event) => { if (document.activeElement !== event.currentTarget) hover(false); }}
      onFocus={() => { onSelect(); hover(true); }}
      onBlur={(event) => { if (!event.currentTarget.matches(":hover")) hover(false); }}>
      <SplitText ref={label} tag="span" type="chars" animation="charDoubleClipped"
        className="home-services__label" aria-hidden="true">{service.label}</SplitText>
    </button>
  );
}

function ServiceMedia({ service, active }) {
  const video = useRef(null);
  const media = service.media;
  useEffect(() => {
    if (!video.current) return;
    if (active) video.current.play()?.catch(() => {});
    else video.current.pause();
  }, [active, media?.url]);
  if (!media?.url) return null;
  return media.isVideo ? (
    <video ref={video} src={media.url} loop muted playsInline preload="metadata" />
  ) : <img src={media.url} alt={media.alt || service.label} loading="lazy" />;
}

export default function HomeWhatWeDo({ data, currentService } = {}) {
  const services = data?.services ?? [];
  const [currIndex, setCurrIndex] = useState(Math.max(0,
    services.findIndex((service) => service.link?.endsWith(`/${currentService}`))));
  const panelId = useId();

  return (
    <section className="home-services home-section" id={data?.anchorId}>
      <SplitText tag="h2" animateOnScroll>{data?.sectionTitle}</SplitText>
      <div className="home-services__intro">
        <SplitText tag="div" className="home-copy" animateOnScroll>{data?.intro}</SplitText>
        <HomeGlyph variant="services" className="home-services__glyph" media={data?.glyphMedia} />
      </div>
      {services.length > 0 && (
        <>
          <div className="home-services__nav" aria-label={data?.sectionTitle}>
            {services.map((service, index) => (
              <ServiceButton key={index} service={service} selected={index === currIndex}
                panelId={panelId} onSelect={() => setCurrIndex(index)} />
            ))}
          </div>
          <div className="home-services__media" id={panelId}>
            {services.map((service, index) => {
              const active = index === currIndex;
              return (
                <div key={index} className={`home-services__slide${active ? " is-active" : ""}`}
                  aria-hidden={!active} inert={!active}>
                  {service.link ? (
                    <TransitionLink href={service.link} aria-label={service.label} tabIndex={active ? 0 : -1}>
                      <ServiceMedia service={service} active={active} />
                    </TransitionLink>
                  ) : <ServiceMedia service={service} active={active} />}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
