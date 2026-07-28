import { useMemo } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import SplitText from "@/components/ui/SplitText";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import { Project } from "@/components/Project";
import { useGlobalStore } from "@/stores/global";

export default function ProjectNext({ project }) {
  const { coverImage, mobileCoverImage, title, slug } = project || {};
  const str = useMemo(
    () =>
      title
        ? `There's way more to explore, take a look at ${title}!`
        : "",
    [title],
  );
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const src = isMobileLayout
    ? mobileCoverImage?.url || coverImage?.url
    : coverImage?.url;

  if (!project) return null;

  return (
    <>
      <SectionTitle>Next project</SectionTitle>
      <section className="project-next inner-width">
        <div className="project-next__top">
          <ScrollingText>{str}</ScrollingText>
          <TransitionLink href={`/project/${slug}`}>
            <SplitText tag="h1" animateOnScroll>
              Next project
            </SplitText>
          </TransitionLink>
        </div>
        <div className="project-next__bottom">
          <Project {...project} coverImage={src} i={0} />
        </div>
      </section>
    </>
  );
}
