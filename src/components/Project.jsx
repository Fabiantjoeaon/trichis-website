import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { TransitionLink } from "@/components/ui/TransitionLink";
import SplitText from "@/components/ui/SplitText";
import ShuffledText from "@/components/ui/ShuffledText";
import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import useInView from "@/hooks/useInView";

export const Project = forwardRef(function Project(
  {
    i = 0,
    title,
    slug,
    year,
    deliverables: _deliverables,
    coverImage: _coverImage,
    isLink = true,
    animateOnScroll = true,
    className = "",
  },
  ref,
) {
  const wrapper = useRef(null);
  const el = useRef(null);
  const titleRef = useRef(null);
  const glImage = useRef(null);
  const yearRef = useRef(null);
  const deliverableRefs = useRef([]);

  function animateIn(params = {}) {
    glImage.current?.animateIn?.(params);
    titleRef.current?.animateIn?.({ delay: 0.4, ...params });
    [yearRef.current, ...deliverableRefs.current].forEach((r, idx) =>
      r?.animateIn?.({ delay: idx * 0.2, ...params }),
    );
  }

  useImperativeHandle(ref, () => ({ animateIn }));

  useInView({
    el: animateOnScroll ? el : null,
    offset: 0.4,
    handleIn: () => {
      if (animateOnScroll) animateIn();
    },
  });

  const coverImage = useMemo(() => {
    if (!_coverImage) return null;
    if (typeof _coverImage === "string") return { url: _coverImage };
    return { ..._coverImage };
  }, [_coverImage]);

  const isVideo = !!coverImage?.isVideo;

  if (!coverImage?.url) return null;

  const media = (
    <NineGLImageElement
      src={coverImage.url}
      animateOnScroll={false}
      offset={-0.5}
      isVideo={isVideo}
      ref={glImage}
      alt={title}
      className="project-image"
      isLink={isLink}
      i={i}
      {...coverImage}
    />
  );

  return (
    <div
      ref={wrapper}
      className={`project-card project-img project-${i} ${className}`}
      data-link={isLink ? "1" : "0"}
    >
      <div className="project-card__title" ref={el}>
        <SplitText
          tag="h3"
          ref={titleRef}
          className="project-title"
          animateOnScroll={false}
          animation="charDoubleClipped"
          type="chars"
        >
          {title}
        </SplitText>
      </div>

      {isLink && slug ? (
        <TransitionLink href={`/project/${slug}`}>{media}</TransitionLink>
      ) : (
        media
      )}

      <div className="project-card__meta">
        {year != null && year !== "" && (
          <ShuffledText
            noMeasure
            text={String(year)}
            ref={yearRef}
            animateOnScroll={false}
          />
        )}
        {_deliverables?.map(({ title: dTitle }, idx) => (
          <ShuffledText
            noMeasure
            key={`${dTitle}-${idx}`}
            text={dTitle}
            ref={(r) => {
              deliverableRefs.current[idx] = r;
            }}
            animateOnScroll={false}
          />
        ))}
      </div>
    </div>
  );
});
