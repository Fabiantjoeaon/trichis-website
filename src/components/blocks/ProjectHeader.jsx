import SplitText from "@/components/ui/SplitText";
import CmsHtml from "@/components/ui/CmsHtml";
import { SectionTitle } from "@/components/ui/Divider";
import { t } from "@/lib/i18n";

export default function ProjectHeader({ title, data, __typename }) {
  const isProject = __typename === "ProjectRecord";
  const displayTitle = data?.bigTitle || title;
  const sectionTitle =
    data?.sectionTitle ||
    t(isProject ? "project.aboutProject" : "project.aboutCampaign");

  return (
    <>
      <SectionTitle>{sectionTitle}</SectionTitle>
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
          {data?.paragraphHeader && (
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
