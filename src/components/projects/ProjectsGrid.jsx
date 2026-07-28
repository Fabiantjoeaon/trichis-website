"use client";

import { useEffect, useRef } from "react";
import { UseCanvas } from "@/components/gl";
import ProjectsScene from "@/components/gl/Projects/ProjectsScene";
import { TransitionLink } from "@/components/ui/TransitionLink";
import useEvent from "@/hooks/useEvent";
import { events } from "@/lib/events";
import emitter from "@/lib/emitter";

function ProjectCard({ project, index, cardRef }) {
  const cover = project.featuredImage || project.coverImage;
  const src = cover?.url || cover?.src || "";
  const el = useRef(null);

  useEffect(() => {
    if (cardRef) cardRef(el.current);
  }, [cardRef]);

  return (
    <article
      ref={el}
      className="project-card relative w-[calc(50%-50rem)] max-[711px]:w-full opacity-0 translate-y-8 transition-[opacity,transform] duration-700 ease-out"
      data-project-index={index}
    >
      <TransitionLink href={`/project/${project.slug}`}>
        <div className="project-image relative aspect-[6/5] overflow-hidden rounded-[10px]">
          {src ? (
            <img
              src={src}
              alt={cover?.alt || project.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-backgroundAccent text-text">
              {project.title}
            </div>
          )}
        </div>
        <h3 className="t-project-title mt-[30rem] text-text">{project.title}</h3>
        {project.year && (
          <p className="t-small-paragraph mt-[10rem] text-inactiveText">
            {project.year}
          </p>
        )}
      </TransitionLink>
    </article>
  );
}

/**
 * Projects grid — DOM masonry-ish list (ProjectsBasicView) + TSL dotted
 * background / tile field via UseCanvas → ProjectsScene.
 */
export default function ProjectsGrid({ projects = [] }) {
  const cardRefs = useRef([]);
  const track = useRef(null);

  useEvent(events.PROJECTS_ON_ENTERING, () => {
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.transitionDelay = `${i * 0.08}s`;
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
  });

  useEffect(() => {
    // Fire enter once mounted (pages can also emit PROJECTS_ON_ENTERING)
    const t = requestAnimationFrame(() => {
      emitter.emit(events.PROJECTS_ON_ENTERING);
    });
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <section ref={track} className="projects-grid relative w-full">
      <UseCanvas id="projects-scene">
        <ProjectsScene />
      </UseCanvas>

      <div className="inner-width relative z-[1]">
        <div className="my-[50rem] flex flex-row-reverse flex-wrap justify-between gap-[100rem] max-[711px]:gap-[50rem]">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id || project.slug || index}
              project={project}
              index={index}
              cardRef={(r) => {
                cardRefs.current[index] = r;
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
