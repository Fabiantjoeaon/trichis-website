import { useMemo } from "react";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import { Project } from "@/components/Project";

// The Project card renders its "deliverables" as a stack of small lines, which
// is what the address rows become here.
function addressLines(address = "") {
  return String(address)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title) => ({ title }));
}

export default function AboutUsOffices({ data }) {
  const offices = useMemo(
    () =>
      (data?.offices ?? []).map((office) => ({
        ...office,
        lines: addressLines(office.address),
      })),
    [data?.offices],
  );

  return (
    <>
      <SectionTitle>{data?.sectionTitle}</SectionTitle>
      <section
        className="about-offices inner-width"
        id={data?.anchorId || undefined}
      >
        <div className="about-offices__left">
          <ScrollingText>{data?.intro}</ScrollingText>
        </div>
        <div className="about-offices__right">
          {offices.map((office, i) => (
            <Project
              key={office.title || i}
              coverImage={office.media?.url}
              title={office.title}
              i={i}
              isLink={false}
              deliverables={office.lines}
            />
          ))}
        </div>
      </section>
    </>
  );
}
