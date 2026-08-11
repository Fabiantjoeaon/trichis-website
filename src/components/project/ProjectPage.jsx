import { useMemo } from "react";
import ProjectHero from "./ProjectHero";
import ProjectNext from "./ProjectNext";
import DynamicContent from "@/components/blocks/DynamicContent";

export default function ProjectPage({ project, nextProject }) {
  const sortedContent = useMemo(() => {
    if (!project?.content) return [];
    return [...project.content].sort((a, b) => {
      if (a.__typename === "ProjectheaderRecord") return -1;
      if (b.__typename === "ProjectheaderRecord") return 1;
      return 0;
    });
  }, [project?.content]);

  return (
    <>
      <ProjectHero project={project} />
      <DynamicContent
        content={sortedContent}
        page={{ ...project, __typename: "ProjectRecord" }}
      />
      <ProjectNext project={nextProject} />
    </>
  );
}
