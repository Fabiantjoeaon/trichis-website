import { useMemo } from "react";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import { Project } from "@/components/Project";

export default function AboutUsOffices() {
  const rotterdamDeliverables = useMemo(
    () => [{ title: "Goudsesingel 194" }, { title: "3011KD Rotterdam" }],
    [],
  );
  const bredaDeliverables = useMemo(
    () => [{ title: "Willemstraat 16" }, { title: "4811AL Breda" }],
    [],
  );

  return (
    <>
      <SectionTitle>Our offices</SectionTitle>
      <section className="about-offices inner-width">
        <div className="about-offices__left">
          <ScrollingText>
            Bakske of bakkie pleur? Wees welkom in Breda en Rotterdam.
          </ScrollingText>
        </div>
        <div className="about-offices__right">
          <Project
            coverImage="/images/about-us/rotterdam.jpeg"
            title="R'dam"
            i={0}
            isLink={false}
            deliverables={rotterdamDeliverables}
          />
          <Project
            coverImage="/images/about-us/breda.jpeg"
            title="Breda"
            i={1}
            isLink={false}
            deliverables={bredaDeliverables}
          />
        </div>
      </section>
    </>
  );
}
