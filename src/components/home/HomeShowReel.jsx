import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import BorderedIcon from "@/components/ui/BorderedIcon";
import SplitText from "@/components/ui/SplitText";
import emitter from "@/lib/emitter";
import { VIDEO_PLAYER_PLAY } from "@/lib/constants";
import { useGlobalStore } from "@/stores/global";

export default function HomeShowReel({ data }) {
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);

  const active = (isMobileLayout && data?.mobileMedia) || data?.media;
  const videoSrc = active?.url ?? "";
  if (!videoSrc) return null;

  return (
    <section
      className="home-showreel inner-width"
      id={data?.anchorId || undefined}
    >
      <div className="home-showreel__reel">
        <NineGLImageElement
          className="home-showreel__gl"
          isVideo={!!active?.isVideo}
          src={videoSrc}
          animateOnScroll
          useHover={false}
          darken={0.5}
        />
        <div className="home-showreel__overlay">
          <SplitText animateOnScroll tag="h3">
            {data?.textTop}
          </SplitText>
          <SplitText
            animateOnScroll
            tag="h3"
            className="home-showreel__text-bottom"
          >
            {data?.textBottom}
          </SplitText>
          <BorderedIcon
            dontTriggerPageTransition
            icon="chevronRight"
            onClick={() =>
              emitter.emit(VIDEO_PLAYER_PLAY, {
                src: videoSrc.replace(/^\//, ""),
              })
            }
          />
        </div>
      </div>
    </section>
  );
}
