import SplitText from "@/components/ui/SplitText";
import { SectionTitle } from "@/components/ui/Divider";

export default function ProjectHeader({ title, data, __typename }) {
  const isProject = __typename === "ProjectRecord";
  const displayTitle = data?.bigTitle || title;
  const sectionTitle =
    data?.sectionTitle ||
    (isProject ? "About the project" : "About the campaign");

  return (
    <>
      <SectionTitle>{sectionTitle}</SectionTitle>
      <section
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
          {data?.paragraph && (
            <SplitText tag="p" animateOnScroll>
              {data.paragraph}
            </SplitText>
          )}
        </div>
      </section>
    </>
  );
}
