import HomeGlyph from "./HomeGlyph";

export default function HomeWhoWeAre({ data }) {
  return (
    <section className="home-story home-section" id={data?.anchorId}>
      <div className="home-story__heading">
        <h2>{data?.sectionTitle}</h2>
        <HomeGlyph className="home-story__glyph" media={data?.glyphMedia} />
      </div>
      <div className="home-copy">{data?.body}</div>
    </section>
  );
}
