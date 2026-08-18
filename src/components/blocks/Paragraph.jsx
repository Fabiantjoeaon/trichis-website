import SplitText from "@/components/ui/SplitText";
import { convertMultiParagraphToNineFormat } from "@/lib/cms";

export default function Paragraph({ data }) {
  const formatted = convertMultiParagraphToNineFormat(data?.content);
  if (!formatted.length) return null;

  return (
    <section
      className="cms-paragraph inner-width"
      id={data?.anchorId || undefined}
    >
      <div className="cms-paragraph__inner">
        {formatted.map((p, i) => (
          <SplitText key={i} tag={p.tag} animateOnScroll>
            {p.text}
          </SplitText>
        ))}
      </div>
    </section>
  );
}
