import { useRef } from "react";
import UseCanvas from "@/components/gl/UseCanvas";
import ScrollScene from "@/components/gl/ScrollScene";
import HeroGrid from "@/components/gl/HeroGrid";

export default function AboutUsHero() {
  const track = useRef(null);

  return (
    <section ref={track} className="about-hero home-hero">
      <div className="about-hero__grid" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="about-hero__cell" />
        ))}
      </div>
      <UseCanvas id="about-hero-grid">
        <ScrollScene track={track}>
          {(props) => <HeroGrid {...props} brandText="nine" brandMobile="n" />}
        </ScrollScene>
      </UseCanvas>
    </section>
  );
}
