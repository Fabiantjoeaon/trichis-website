import BorderedIcon from "@/components/ui/BorderedIcon";
import Logo from "@/components/ui/Logo";
import SplitText from "@/components/ui/SplitText";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import ColumnRow, { columnRowTypeNames } from "@/components/blocks/ColumnRow";
import Paragraph from "@/components/blocks/Paragraph";
import { SmallTextSplit } from "@/components/whatwedo/WhatWeDoHeader";

function imageColumns(...entries) {
  return entries
    .filter(([media]) => media?.url)
    .map(([media, width]) => ({
      __typename: columnRowTypeNames.image,
      image: media,
      width,
    }));
}

export default function AboutUsIntro({ data }) {
  const pair = imageColumns([data?.imageA, 70], [data?.imageB, 30]);
  const wide = imageColumns([data?.imageWide, 100]);

  return (
    <>
      <SectionTitle>{data?.sectionTitle}</SectionTitle>
      <section
        className="about-intro inner-width"
        id={data?.anchorId || undefined}
      >
        <div className="about-intro__top">
          <div className="about-intro__left">
            <ScrollingText>{data?.scrollingText}</ScrollingText>
          </div>
          <div className="about-intro__right">
            <SmallTextSplit>
              <div className="about-intro__copy">
                <SplitText tag="p" animateOnScroll>
                  {data?.lead}
                </SplitText>
                {data?.ctaText && (
                  <BorderedIcon
                    text={data.ctaText}
                    href={data?.ctaLink}
                    dontTriggerPageTransition
                  />
                )}
              </div>
            </SmallTextSplit>
          </div>
        </div>
      </section>

      <div className="about-intro__logo inner-width">
        <Logo />
      </div>

      {pair.length > 0 && <ColumnRow data={{ columns: pair }} />}

      {data?.body && <Paragraph data={{ content: data.body }} />}

      {wide.length > 0 && (
        <div className="section-bottom">
          <ColumnRow
            data={{ columns: wide }}
            className="about-us__intro-final-image"
          />
        </div>
      )}
    </>
  );
}
