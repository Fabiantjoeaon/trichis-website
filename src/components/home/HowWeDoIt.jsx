import SplitText from "@/components/ui/SplitText";

export default function HowWeDoIt({ data }) {
  return (
    <section className="home-about home-section" id={data?.anchorId}>
      <SplitText tag="h2" animateOnScroll>{data?.title}</SplitText>
      {data?.intro && <SplitText tag="div" className="home-copy home-about__intro" animateOnScroll>{data.intro}</SplitText>}
      <div className="home-about__cards">
        {(data?.cards ?? []).map((card, index) => (
          <article className="home-about__card" key={index}>
            <div className="home-about__card-content">
              <SplitText tag="h3" animateOnScroll>{card.title}</SplitText>
              {card.textTop && <SplitText tag="p" animateOnScroll>{card.textTop}</SplitText>}
              {card.textBottom && <SplitText tag="p" animateOnScroll>{card.textBottom}</SplitText>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
