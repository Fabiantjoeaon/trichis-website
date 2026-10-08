import TransitionLink from "@/components/ui/TransitionLink";
import HomeGlyph from "./HomeGlyph";
import { boundedNumber, projectRows } from "@/lib/home-layout";

export default function HomeWhatWeveCreated({ data, projects = [] }) {
  const rows = projectRows(data?.projectRows, projects);
  return (
    <section className="home-work home-section" id={data?.anchorId}>
      <h2>{data?.sectionTitle}</h2>
      <div className="home-work__rows">
        {rows.map((row, index) => {
          const { project } = row;
          const media = project.featuredImage || project.coverImage;
          const alignment = ["left", "center", "right"].includes(row.alignment) ? row.alignment : "left";
          const ratio = { landscape: "5 / 3", square: "1", portrait: "4 / 5", wide: "8 / 3", original: "auto" }[row.imageRatio] || "5 / 3";
          const position = ["top-left", "top-right", "bottom-left", "bottom-right"].includes(row.glyphPosition) ? row.glyphPosition : "top-right";
          return (
            <div className={`home-work__row home-work__row--${alignment}`} key={`${project.slug}-${index}`}
              style={{ "--project-width": `${boundedNumber(row.width, 66, 20, 100)}%`, "--project-ratio": ratio }}>
              {row.glyphEnabled && <HomeGlyph media={row.glyphMedia} className={`home-work__glyph home-work__glyph--${position}`}
                style={{ "--glyph-width": `${boundedNumber(row.glyphWidth, 35, 10, 60)}%`,
                  "--glyph-rotation": `${boundedNumber(row.glyphRotation, 0, -180, 180)}deg`,
                  "--glyph-flip": row.glyphFlip ? -1 : 1 }} />}
              <TransitionLink className="home-work__project" href={`/project/${project.slug}`}>
                <div className="home-work__image">
                  {media?.url && (media.isVideo ? <video src={media.url} autoPlay loop muted playsInline /> :
                    <img src={media.url} alt={media.alt || project.title} loading="lazy" />)}
                </div>
                <h3>{project.title}</h3>
              </TransitionLink>
            </div>
          );
        })}
      </div>
      {data?.ctaLink && <TransitionLink className="home-work__more" href={data.ctaLink}>
        {data.ctaText?.replace(/<[^>]*>/g, "") || "Alle projecten"} →
      </TransitionLink>}
    </section>
  );
}
