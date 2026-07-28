import { useRef } from "react";
import { UseCanvas } from "@/components/gl";
import ProjectsScene from "@/components/gl/Projects/ProjectsScene";
import { Project } from "@/components/Project";

/**
 * Projects list (nine-ca ProjectsBasicView) + TSL dotted background / tile field.
 */
export default function ProjectsBasicView({ projects = [] }) {
  const projectRefs = useRef([]);

  return (
    <section className="projects-basic relative w-full">
      <UseCanvas id="projects-scene">
        <ProjectsScene />
      </UseCanvas>

      <div className="projects-basic__grid inner-width relative z-[1] my-[50rem] flex flex-row-reverse flex-wrap justify-between gap-[100rem] max-[711px]:gap-[50rem]">
        {projects.map((project, index) => {
          const coverImage = project.featuredImage || project.coverImage;
          return (
            <div
              className="projects-basic__item relative w-[calc(50%-50rem)] max-[711px]:w-full"
              key={project.id || project.slug}
            >
              <Project
                i={index}
                {...project}
                ref={(r) => {
                  projectRefs.current[index] = r;
                }}
                coverImage={coverImage}
                animateOnScroll
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
