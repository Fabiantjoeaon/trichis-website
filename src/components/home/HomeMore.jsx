import SplitText from "@/components/ui/SplitText";
import BorderedIcon from "@/components/ui/BorderedIcon";

export default function HomeMore() {
  return (
    <section className="home-more inner-width">
      <div className="home-more__inner">
        <SplitText
          tag="h3"
          animation="charDoubleClipped"
          type="chars"
          animateOnScroll
          dangerouslySetInnerHTML={{
            __html: "More About <strong>nine</strong>",
          }}
        />
        <BorderedIcon href="/about-us" />
      </div>
    </section>
  );
}
