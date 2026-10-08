import { useId, useState } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import HomeGlyph from "./HomeGlyph";

export default function HomeWhatWeDo({ data, currentService } = {}) {
  const services = data?.services ?? [];
  const [currIndex, setCurrIndex] = useState(Math.max(0,
    services.findIndex((service) => service.link?.endsWith(`/${currentService}`))));
  const current = services[currIndex] ?? services[0];
  const panelId = useId();
  const media = current?.media;
  const visual = media?.url ? (media.isVideo ? (
    <video key={media.url} src={media.url} autoPlay loop muted playsInline />
  ) : <img key={media.url} src={media.url} alt={media.alt || current.label} loading="lazy" />) : null;

  return (
    <section className="home-services home-section" id={data?.anchorId}>
      <h2>{data?.sectionTitle}</h2>
      <div className="home-services__intro">
        <div className="home-copy">{data?.intro}</div>
        <HomeGlyph className="home-services__glyph" media={data?.glyphMedia} />
      </div>
      {services.length > 0 && (
        <>
          <div className="home-services__nav" aria-label={data?.sectionTitle}>
            {services.map((service, index) => (
              <button key={index} type="button" aria-pressed={index === currIndex}
                aria-controls={panelId} onClick={() => setCurrIndex(index)}
                onMouseEnter={() => setCurrIndex(index)} onFocus={() => setCurrIndex(index)}>
                {service.label}
              </button>
            ))}
          </div>
          <div className="home-services__media" id={panelId}>
            {current?.link ? (
              <TransitionLink href={current.link} aria-label={current.label}>{visual}</TransitionLink>
            ) : visual}
          </div>
        </>
      )}
    </section>
  );
}
