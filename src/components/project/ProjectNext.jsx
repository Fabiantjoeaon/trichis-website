import { Fragment } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import { SectionTitle } from "@/components/ui/Divider";
import { Project } from "@/components/Project";
import { useGlobalStore } from "@/stores/global";

export default function ProjectNext({ projects = [], project }) {
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const items = projects?.length ? projects : [project].filter(Boolean);

  if (!items.length) return null;

  return (
    <>
      <div className="next-lead">
        <img
          className="swoosh swoosh--a"
          src="/images/swoosh-a.svg"
          alt=""
          aria-hidden="true"
        />
        <SectionTitle>What&rsquo;s next</SectionTitle>
      </div>

      <section className="project-next">
        {items.slice(0, 2).map((item, i) => {
          const src = isMobileLayout
            ? item.mobileCoverImage?.url || item.coverImage?.url
            : item.coverImage?.url;

          return (
            <Fragment key={item.slug || i}>
              <div className={`project-next__card project-next__card--${i + 1}`}>
                <Project {...item} coverImage={src} i={i} />
              </div>
              <TransitionLink
                href={`/project/${item.slug}`}
                className={`project-next__label project-next__label--${i + 1}`}
              >
                {item.title}
              </TransitionLink>
            </Fragment>
          );
        })}
      </section>

      <SectionTitle>Neem contact op</SectionTitle>
    </>
  );
}
