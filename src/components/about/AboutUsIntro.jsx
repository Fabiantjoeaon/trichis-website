import BorderedIcon from "@/components/ui/BorderedIcon";
import Logo from "@/components/ui/Logo";
import SplitText from "@/components/ui/SplitText";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import ColumnRow, { columnRowTypeNames } from "@/components/blocks/ColumnRow";
import Paragraph from "@/components/blocks/Paragraph";
import { SmallTextSplit } from "@/components/whatwedo/WhatWeDoHeader";

const text =
  "Als je zegt dat de wereld snel verandert, ben je eigenlijk al een stap te laat. Anno nu is reageren niet meer genoeg. Daarom denken wij niet vanuit wat hip of on trend is, maar vanuit wat morgen impact maakt. Wij zien veranderingen, herkennen patronen en anticiperen erop voordat ze trends worden. ";

export default function AboutUsIntro() {
  return (
    <>
      <SectionTitle>First things first</SectionTitle>
      <section className="about-intro inner-width">
        <div className="about-intro__top">
          <div className="about-intro__left">
            <ScrollingText>Wij zijn nine creative agency.</ScrollingText>
          </div>
          <div className="about-intro__right">
            <SmallTextSplit>
              <div className="about-intro__copy">
                <SplitText tag="p" animateOnScroll>
                  {text}
                </SplitText>
                <BorderedIcon
                  text="Contact"
                  href="mailto:info@9ca.nl"
                  dontTriggerPageTransition
                />
              </div>
            </SmallTextSplit>
          </div>
        </div>
      </section>

      <div className="about-intro__logo inner-width">
        <Logo />
      </div>

      <ColumnRow
        data={{
          columns: [
            {
              __typename: columnRowTypeNames.image,
              image: { url: "/images/about-us/stick.jpeg" },
              width: 70,
            },
            {
              __typename: columnRowTypeNames.image,
              image: { url: "/images/about-us/quincy.jpeg" },
              width: 30,
            },
          ],
        }}
      />
      <Paragraph
        data={{
          content:
            "Al meer dan 20 jaar gaan we hard op creativiteit in elke vorm van het woord. Onze roots liggen bij icons als Adidas, Nike en MTV USA, ons hart klopt in Breda en Rotterdam. Met next level designs, een scherpe visie en concepten die echt anders zijn, zorgen we ervoor dat jouw merk niet alleen gezien wordt, maar ook onthouden. ",
        }}
      />
      <div className="section-bottom">
        <ColumnRow
          data={{
            columns: [
              {
                __typename: columnRowTypeNames.image,
                image: { url: "/images/about-us/collage.jpeg" },
                width: 100,
              },
            ],
          }}
          className="about-us__intro-final-image"
        />
      </div>
    </>
  );
}
