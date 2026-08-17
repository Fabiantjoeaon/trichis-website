import BorderedIcon from "@/components/ui/BorderedIcon";
import SplitText from "@/components/ui/SplitText";
import ColumnRow, { columnRowTypeNames } from "@/components/blocks/ColumnRow";
import WhatWeDoServiceHeader from "./WhatWeDoHeader";

/**
 * One "what we do" service block: an oversized name, a stack of paragraphs, a
 * link, then any number of media rows. Replaces the five hand-written
 * WhatWeDoService* components — they differed only in their content.
 */
export default function ServiceTeaser({ data }) {
  const paragraphs = (data?.paragraphs ?? []).filter(Boolean);
  const rows = (data?.rows ?? [])
    .map((row) => ({
      columns: (row.columns ?? [])
        .filter((column) => column.media?.url)
        .map((column) => ({
          __typename: columnRowTypeNames.image,
          image: column.media,
          width: column.width,
        })),
    }))
    .filter((row) => row.columns.length > 0);

  return (
    <div className="wwd-service" id={data?.anchorId || undefined}>
      <WhatWeDoServiceHeader
        service={data?.serviceName}
        serviceBottom={data?.serviceNameBottom}
        fullServiceName={data?.fullServiceName}
        sectionTitle={data?.sectionTitle}
      >
        <div>
          {paragraphs.map((text, i) => (
            <SplitText key={i} tag="p" animateOnScroll>
              {text}
            </SplitText>
          ))}
        </div>
        {data?.ctaText && (
          <BorderedIcon text={data.ctaText} href={data?.ctaLink} />
        )}
      </WhatWeDoServiceHeader>

      {rows.map((row, i) => (
        <ColumnRow key={i} data={row} />
      ))}

      {data?.trailingText && (
        <div className="wwd-service__strategy-text inner-width">
          <div>
            <SplitText tag="p" animateOnScroll>
              {data.trailingText}
            </SplitText>
            {data?.trailingCtaText && (
              <BorderedIcon
                text={data.trailingCtaText}
                href={data?.trailingCtaLink}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
