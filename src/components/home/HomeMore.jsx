import SplitText from "@/components/ui/SplitText";
import BorderedIcon from "@/components/ui/BorderedIcon";

// The `link_band` block: one oversized link across the page.
export default function HomeMore({ data }) {
  if (!data?.title && !data?.link) return null;

  return (
    <section className="home-more inner-width" id={data?.anchorId || undefined}>
      <div className="home-more__inner">
        <SplitText
          tag="h3"
          animation="charDoubleClipped"
          type="chars"
          animateOnScroll
          dangerouslySetInnerHTML={{ __html: data?.title ?? "" }}
        />
        {data?.link && <BorderedIcon href={data.link} />}
      </div>
    </section>
  );
}
