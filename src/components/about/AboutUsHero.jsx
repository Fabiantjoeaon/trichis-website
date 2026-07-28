import { useRef } from "react";
import UseCanvas from "@/components/gl/UseCanvas";
import ScrollScene from "@/components/gl/ScrollScene";
import HeroGrid from "@/components/gl/HeroGrid";

export default function AboutUsHero() {
  const track = useRef(null);

  return (
    <section ref={track} className="about-hero home-hero">
      <UseCanvas>
        <ScrollScene track={track}>
          {(props) => <HeroGrid {...props} brandText="nine" brandMobile="n" />}
        </ScrollScene>
      </UseCanvas>
      {/* DOM fallback visible until GL paints */}
      <div className="about-hero__grid" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="about-hero__cell" />
        ))}
      </div>
    </section>
  );
}
