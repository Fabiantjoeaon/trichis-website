import CmsHtml from "@/components/ui/CmsHtml";

export default function Paragraph({ data }) {
  if (!data?.content) return null;

  return (
    <section
      className="cms-paragraph inner-width"
      id={data?.anchorId || undefined}
    >
      <div className="cms-paragraph__inner">
        <CmsHtml text={data.content} />
      </div>
    </section>
  );
}
