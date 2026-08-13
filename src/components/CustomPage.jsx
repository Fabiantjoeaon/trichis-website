import ProjectHero from "@/components/project/ProjectHero";
import DynamicContent from "@/components/blocks/DynamicContent";

export default function CustomPage({ page }) {
  if (!page) return null;
  return (
    <>
      <ProjectHero project={page} />
      <DynamicContent
        content={page.content}
        page={{ ...page, __typename: "PageRecord" }}
      />
    </>
  );
}
