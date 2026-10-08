import TransitionLink from "@/components/ui/TransitionLink";
import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import SplitText from "@/components/ui/SplitText";
import HomeGlyph from "./HomeGlyph";
import { boundedNumber, projectRows } from "@/lib/home-layout";

export default function HomeWhatWeveCreated({ data, projects = [] }) {
  const rows = projectRows(data?.projectRows, projects);
  return (
    <section className="home-work home-section" id={data?.anchorId}>
      <SplitText tag="h2" animateOnScroll>{data?.sectionTitle}</SplitText>
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
              {row.glyphEnabled && <HomeGlyph variant={position.endsWith("left") ? "work-left" : "work-right"} media={row.glyphMedia} className={`home-work__glyph home-work__glyph--${position}`}
                style={{ "--glyph-width": `${boundedNumber(row.glyphWidth, 35, 10, 60)}%`,
                  "--glyph-rotation": `${boundedNumber(row.glyphRotation, 0, -180, 180)}deg`,
                  "--glyph-flip": row.glyphFlip ? -1 : 1 }} />}
              <TransitionLink className="home-work__project" href={`/project/${project.slug}`}>
                {media?.url ? <NineGLImageElement className="home-work__image"
                  src={media.url} alt={media.alt || project.title} isVideo={media.isVideo}
                  width={media.width} height={media.height} animateOnScroll offset={0.1} isLink /> :
                  <div className="home-work__image" />}
                <SplitText tag="h3" type="chars" animation="charClipped" animateOnScroll>{project.title}</SplitText>
              </TransitionLink>
            </div>
          );
        })}
      </div>
      {data?.ctaLink && <TransitionLink className="home-work__more" href={data.ctaLink}>
        <SplitText type="chars" animation="charDoubleClipped" animateOnScroll>
          {`${data.ctaText?.replace(/<[^>]*>/g, "") || "Alle projecten"} →`}
        </SplitText>
      </TransitionLink>}
    </section>
  );
}
