import SplitText from "@/components/ui/SplitText";
import { Divider, SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";

export default function ProjectNumbers({ data }) {
  const { titleLeft, titleRight, numbers = [] } = data || {};

  return (
    <>
      <SectionTitle>It's all about the numbers right?</SectionTitle>
      <section className="project-numbers inner-width">
        <div className="project-numbers__top">
          {titleLeft && <ScrollingText maxWidth="40%">{titleLeft}</ScrollingText>}
          {titleRight && (
            <div className="project-numbers__title-right">
              <SplitText tag="h1" animateOnScroll>
                {titleRight}
              </SplitText>
            </div>
          )}
        </div>
        <Divider />
        {numbers.map(({ number, text }, i) => (
          <div className="project-numbers__row" key={`${number}-${i}`}>
            <div className="project-numbers__inner">
              <SplitText tag="h2" animateOnScroll>
                {number}
              </SplitText>
              <SplitText tag="p" animateOnScroll>
                {text}
              </SplitText>
            </div>
            <Divider />
          </div>
        ))}
      </section>
    </>
  );
}
