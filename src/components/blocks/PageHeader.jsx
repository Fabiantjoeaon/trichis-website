import { useMemo } from "react";
import SplitText from "@/components/ui/SplitText";
import BorderedIcon from "@/components/ui/BorderedIcon";
import TransitionLink from "@/components/ui/TransitionLink";
import WhatWeDoServiceHeader from "@/components/whatwedo/WhatWeDoHeader";
import { preserveSoftLineBreaks, splitParagraphs } from "@/lib/cms";

export default function PageHeader({ data }) {
  const paragraphs = useMemo(() => {
    const html = preserveSoftLineBreaks(data?.paragraph);
    return splitParagraphs(html);
  }, [data?.paragraph]);

  let strongSeen = 0;

  return (
    <WhatWeDoServiceHeader
      service={data?.title}
      serviceBottom={data?.titleBottom}
      showSectionTitle={!!data?.sectionTitle}
      sectionTitle={data?.sectionTitle}
      anchorId={data?.anchorId}
    >
      {paragraphs.length > 0 && (
        <div className="page-header__paragraph">
          {paragraphs.map((innerHtml, i) => {
            const hasStrong = /<strong\b/i.test(innerHtml);
            if (hasStrong) strongSeen += 1;
            const isSectionBreak = hasStrong && strongSeen > 1;
            return (
              <SplitText
                key={i}
                tag="p"
                className={
                  isSectionBreak ? "page-header__paragraph__section-break" : ""
                }
                animateOnScroll
                dangerouslySetInnerHTML={{ __html: innerHtml }}
              >
                {innerHtml}
              </SplitText>
            );
          })}
        </div>
      )}
      {data?.ctaLink && data?.ctaText && (
        <div style={{ marginTop: "20px" }}>
          <TransitionLink href={data.ctaLink}>
            <BorderedIcon text={data.ctaText} />
          </TransitionLink>
        </div>
      )}
    </WhatWeDoServiceHeader>
  );
}
