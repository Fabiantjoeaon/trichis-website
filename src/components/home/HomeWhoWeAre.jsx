import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import { AcronymLogo } from "@/components/ui/Logo";

export default function HomeWhoWeAre({ data }) {
  return (
    <>
      <SectionTitle>{data?.sectionTitle}</SectionTitle>
      <section
        className="home-who-we-are inner-width"
        id={data?.anchorId || undefined}
      >
        <ScrollingText>{data?.body}</ScrollingText>
        <AcronymLogo />
      </section>
    </>
  );
}
