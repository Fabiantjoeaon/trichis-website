import BorderedIcon from "@/components/ui/BorderedIcon";
import SplitText from "@/components/ui/SplitText";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";

export default function WhatWeDoExpertises() {
  return (
    <>
      <SectionTitle>Our expertises</SectionTitle>
      <section className="what-we-do-expertises inner-width">
        <div className="what-we-do-expertises__left">
          <ScrollingText>Wij zorgen dat merken gezien worden.</ScrollingText>
        </div>
        <div className="what-we-do-expertises__right">
          <SplitText tag="p" animateOnScroll>
            Opvallen in een wereld waar iedereen aandacht wil hebben? Dit is de
            vraag waar wij elke dag de wekker voor zetten. Nine gaat altijd voor
            spraakmakend, buitengewoon & zoekt de randen op, met zoveel mogelijke
            impact voor je merk creëren als einddoel.
          </SplitText>
          <BorderedIcon text="Contact" href="mailto:cu@nine.nl" />
        </div>
      </section>
    </>
  );
}
