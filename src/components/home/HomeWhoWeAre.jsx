import HomeGlyph from "./HomeGlyph";
import SplitText from "@/components/ui/SplitText";

export default function HomeWhoWeAre({ data }) {
  return (
    <section className="home-story home-section" id={data?.anchorId}>
      <div className="home-story__heading">
        <SplitText tag="h2" animateOnScroll>{data?.sectionTitle}</SplitText>
        <HomeGlyph variant="question" className="home-story__glyph" media={data?.glyphMedia} />
      </div>
      <SplitText tag="div" className="home-copy" animateOnScroll>{data?.body}</SplitText>
    </section>
  );
}
