import BorderedIcon from "@/components/ui/BorderedIcon";
import SplitText from "@/components/ui/SplitText";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";

export default function WhatWeDoExpertises({ data }) {
  return (
    <>
      <SectionTitle>{data?.sectionTitle}</SectionTitle>
      <section
        className="what-we-do-expertises inner-width"
        id={data?.anchorId || undefined}
      >
        <div className="what-we-do-expertises__left">
          <ScrollingText>{data?.heading}</ScrollingText>
        </div>
        <div className="what-we-do-expertises__right">
          <SplitText tag="p" animateOnScroll>
            {data?.body}
          </SplitText>
          {data?.ctaText && (
            <BorderedIcon text={data.ctaText} href={data?.ctaLink} />
          )}
        </div>
      </section>
    </>
  );
}
