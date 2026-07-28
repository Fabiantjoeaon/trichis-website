import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import { AcronymLogo } from "@/components/ui/Logo";

export default function HomeWhoWeAre() {
  return (
    <>
      <SectionTitle>Who we are</SectionTitle>
      <section className="home-who-we-are inner-width">
        <ScrollingText>
          Nine is een onafhankelijk creatief bureau met een culture driven
          visie. Met strategy, identity en design, creëren we nieuwe werelden
          voor brands we love.
        </ScrollingText>
        <AcronymLogo />
      </section>
    </>
  );
}
