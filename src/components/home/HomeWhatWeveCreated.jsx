import { useCallback, useEffect, useRef } from "react";
import SplitText from "@/components/ui/SplitText";
import ShuffledText from "@/components/ui/ShuffledText";
import BorderedIcon from "@/components/ui/BorderedIcon";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import { Project } from "@/components/Project";

export default function HomeWhatWeveCreated({ projects = [] }) {
  const projectsRef = useRef(null);

  const measureProjectsHeight = useCallback(() => {
    if (!projectsRef.current) return;
    const children = projectsRef.current.children;
    let maxHeight = 0;
    for (const child of children) {
      const rect = child.getBoundingClientRect();
      const bottom = child.offsetTop + rect.height;
      if (bottom > maxHeight) maxHeight = bottom;
    }
    projectsRef.current.style.height = `${maxHeight}px`;
  }, []);

  useEffect(() => {
    if (!projectsRef.current) return;
    requestAnimationFrame(() => {
      measureProjectsHeight();
      requestAnimationFrame(measureProjectsHeight);
    });
    const ro = new ResizeObserver(() => measureProjectsHeight());
    Array.from(projectsRef.current.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [projects, measureProjectsHeight]);

  return (
    <>
      <SectionTitle>What we've done so far</SectionTitle>
      <section className="home-wwc inner-width">
        <div className="home-wwc__top">
          <ScrollingText>Discover your impact</ScrollingText>
          <SplitText tag="p" animateOnScroll>
            Nine is een onafhankelijk creatief bureau dat de toekomst opnieuw
            vormgeeft. Met slim design, een heldere visie en grensverleggende
            ideeën bouwen we samen aan een nieuwe wereld.
          </SplitText>
        </div>

        <div className="home-wwc__projects-title">
          <SplitText className="home-wwc__projects-label" tag="h5" animateOnScroll>
            Projects
          </SplitText>
          <div className="home-wwc__random">
            <ShuffledText animateOnScroll useRandomText />
            <ShuffledText animateOnScroll useRandomText />
            <ShuffledText animateOnScroll useRandomText />
          </div>
        </div>

        <div className="home-wwc__projects" ref={projectsRef}>
          {projects.map((project, index) => {
            const coverImage = project.featuredImage || project.coverImage;
            return (
              <Project
                i={index}
                key={project.id || project.slug || index}
                {...project}
                coverImage={coverImage}
              />
            );
          })}
        </div>

        <div className="home-wwc__more">
          <div className="home-wwc__more-inner">
            <SplitText
              tag="h3"
              animation="charDoubleClipped"
              type="chars"
              animateOnScroll
              dangerouslySetInnerHTML={{
                __html: "All our <strong>projects</strong>",
              }}
            />
            <BorderedIcon href="/projects" />
          </div>
        </div>
      </section>
    </>
  );
}
