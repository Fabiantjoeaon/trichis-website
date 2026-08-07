import { useRef } from "react";
import { UseCanvas } from "@/components/gl";
import ProjectsScene from "@/components/gl/Projects/ProjectsScene";
import { Project } from "@/components/Project";
import usePageEnter from "@/hooks/usePageEnter";

/**
 * Projects list (nine-ca ProjectsBasicView) + TSL dotted background.
 * Cards animate in staggered once the page is revealed, like nine-ca's
 * PROJECTS:ON_ENTERING flow.
 */
export default function ProjectsBasicView({ projects = [] }) {
  const projectRefs = useRef([]);

  usePageEnter(() => {
    projectRefs.current.forEach((r, i) => r?.animateIn?.({ delay: i * 0.2 }));
  });

  return (
    <section className="projects-basic">
      <UseCanvas id="projects-scene">
        <ProjectsScene />
      </UseCanvas>

      <div className="projects-basic__grid inner-width">
        {projects.map((project, index) => {
          const coverImage = project.featuredImage || project.coverImage;
          return (
            <div
              className="projects-basic__item"
              key={project.id || project.slug}
            >
              <Project
                i={index}
                {...project}
                ref={(r) => {
                  projectRefs.current[index] = r;
                }}
                coverImage={coverImage}
                animateOnScroll={false}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
