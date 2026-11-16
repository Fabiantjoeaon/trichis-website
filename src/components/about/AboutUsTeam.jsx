import { SectionTitle } from "@/components/ui/Divider";
import { Project } from "@/components/Project";

export default function AboutUsTeam({ data }) {
  const members = (data?.members ?? []).filter((member) => member.media?.url);
  if (!members.length) return null;

  return (
    <>
      <SectionTitle>{data?.sectionTitle}</SectionTitle>
      <section className="about-team inner-width" id={data?.anchorId || undefined}>
        {members.map((member, i) => (
          <Project
            key={`${member.name}-${i}`}
            className="about-team__member"
            coverImage={member.media}
            title={member.name}
            i={i}
            isLink={false}
            deliverables={member.role ? [{ title: member.role }] : []}
          />
        ))}
      </section>
    </>
  );
}
