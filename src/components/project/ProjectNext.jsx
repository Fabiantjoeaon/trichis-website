import TransitionLink from "@/components/ui/TransitionLink";
import { SectionTitle } from "@/components/ui/Divider";
import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import SplitText from "@/components/ui/SplitText";
import { useGlobalStore } from "@/stores/global";
import { t } from "@/lib/i18n";

export default function ProjectNext({ projects = [], project }) {
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const items = projects?.length ? projects : [project].filter(Boolean);

  if (!items.length) return null;

  return (
    <>
      <div className="next-lead">
        <SectionTitle>{t("project.whatsNext")}</SectionTitle>
      </div>

      <section className="project-next inner-width" aria-label={t("project.whatsNext")}>
        {items.slice(0, 2).map((item, i) => {
          const media = [isMobileLayout && item.mobileCoverImage, item.coverImage, item.featuredImage]
            .find((asset) => asset?.url);

          return (
            <TransitionLink key={item.slug || i} href={`/project/${item.slug}`}
              className={`project-next__card project-next__card--${i + 1}`}>
              {media && <NineGLImageElement key={media.url} className="project-next__image"
                src={media.url} alt={media.alt || item.title} width={media.width} height={media.height}
                isVideo={!!media.isVideo} animateOnScroll offset={0.1} isLink />}
              <SplitText tag="h3" className="project-next__label" type="chars" animation="charClipped" animateOnScroll>
                {item.title}
              </SplitText>
            </TransitionLink>
          );
        })}
      </section>

      <SectionTitle>{t("project.contact")}</SectionTitle>
    </>
  );
}
