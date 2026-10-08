export default function HowWeDoIt({ data }) {
  return (
    <section className="home-about home-section" id={data?.anchorId}>
      <h2>{data?.title}</h2>
      {data?.intro && <div className="home-copy home-about__intro">{data.intro}</div>}
      <div className="home-about__cards">
        {(data?.cards ?? []).map((card, index) => (
          <article className="home-about__card" key={index}>
            <h3>{card.title}</h3>
            {card.textTop && <p>{card.textTop}</p>}
            {card.textBottom && <p>{card.textBottom}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
