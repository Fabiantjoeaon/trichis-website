import SplitText from "@/components/ui/SplitText";
import CmsHtml from "@/components/ui/CmsHtml";
import { SectionTitle } from "@/components/ui/Divider";
import { t } from "@/lib/i18n";

export default function ProjectHeader({ title, data, __typename, deliverables = [] }) {
  const isProject = __typename === "ProjectRecord";
  const displayTitle = data?.bigTitle || title;
  const sectionTitle =
    data?.sectionTitle ||
    data?.paragraphHeader ||
    t(isProject ? "project.aboutProject" : "project.aboutCampaign");

  return (
    <>
      <SectionTitle meta={isProject ? deliverables.map((item) => item.title).filter(Boolean).join(" · ") : null}>
        {sectionTitle}
      </SectionTitle>
      <section
        id={data?.anchorId || undefined}
        className={`project-header inner-width${isProject ? " is-project" : " is-page"}`}
      >
        <div className="project-header__title">
          <SplitText tag="h1" animateOnScroll>
            {displayTitle}
          </SplitText>
        </div>
        <div className="project-header__copy">
          {data?.paragraphHeader && data.paragraphHeader !== sectionTitle && (
            <SplitText tag="h6" animateOnScroll>
              {data.paragraphHeader}
            </SplitText>
          )}
          {data?.paragraph && <CmsHtml text={data.paragraph} />}
        </div>
      </section>
    </>
  );
}
