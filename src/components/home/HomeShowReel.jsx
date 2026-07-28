import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import BorderedIcon from "@/components/ui/BorderedIcon";
import SplitText from "@/components/ui/SplitText";
import emitter from "@/lib/emitter";
import { VIDEO_PLAYER_PLAY } from "@/lib/constants";
import { useGlobalStore } from "@/stores/global";

export default function HomeShowReel() {
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const videoSrc = isMobileLayout
    ? "/video/showreel_mobile.mp4"
    : "/video/showreel.mp4";

  return (
    <section className="home-showreel inner-width">
      <div className="home-showreel__reel">
        <NineGLImageElement
          className="home-showreel__gl"
          isVideo
          src={videoSrc}
          animateOnScroll
          useHover={false}
          darken={0.5}
        />
        <div className="home-showreel__overlay">
          <SplitText animateOnScroll tag="h3">
            Watch our
          </SplitText>
          <SplitText
            animateOnScroll
            tag="h3"
            className="home-showreel__text-bottom"
          >
            showreel
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
