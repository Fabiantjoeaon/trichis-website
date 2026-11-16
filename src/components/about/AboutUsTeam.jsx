import { SectionTitle } from "@/components/ui/Divider";
import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";

function TeamMember({ member }) {
  const { media } = member;
  return (
    <div className="about-team__member">
      <NineGLImageElement
        className="project-image"
        src={media.url}
        alt={media.alt || member.name}
        width={media.width}
        height={media.height}
        isVideo={!!media.isVideo}
        mobile={media.mobile}
        isLink={false}
        offset={0.1}
      />
      <div className="about-team__caption">
        {member.name && <h3 className="about-team__name">{member.name}</h3>}
        {member.role && <p className="about-team__role">{member.role}</p>}
      </div>
    </div>
  );
}

export default function AboutUsTeam({ data }) {
  const members = (data?.members ?? []).filter((member) => member.media?.url);
  if (!members.length) return null;

  return (
    <>
      <SectionTitle>{data?.sectionTitle}</SectionTitle>
      <section className="about-team inner-width" id={data?.anchorId || undefined}>
        {members.map((member, i) => (
          <TeamMember key={`${member.name}-${i}`} member={member} />
        ))}
      </section>
    </>
  );
}
