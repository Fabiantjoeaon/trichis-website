import { useId, useMemo, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import useInView from "@/hooks/useInView";
import question from "../../../public/images/glyphs/trichis-question.svg?raw";
import services from "../../../public/images/glyphs/trichis-services.svg?raw";
import workLeft from "../../../public/images/glyphs/trichis-work-left.svg?raw";
import workRight from "../../../public/images/glyphs/trichis-work-right.svg?raw";

const artwork = { question, services, "work-left": workLeft, "work-right": workRight };
// Reveal the filled question mark along its centreline, preserving its original outline.
const questionStroke = "M9.7 5.7C24 18 32 36 34 52C36 68 28 78 18 73C3 68 5 47 23 36C39 26 58 26 74 42C89 59 86 82 72 94C59 106 42 111 33 127C24 143 24 161 32 175";

function drawMarkup(svg, variant, id) {
  if (variant !== "question") return svg.replace(/<path /g, '<path data-draw="" ');
  let index = 0;
  const masked = svg.replace(/<path /g, () => index++ === 0
    ? `<path mask="url(#${id})" ` : '<path data-dot="" ');
  return masked.replace(/(<svg[^>]*>)/, `$1<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="130" height="240"><path data-draw="" d="${questionStroke}" fill="none" stroke="white" stroke-width="21" stroke-linecap="round" stroke-linejoin="round"/></mask></defs>`);
}

export default function HomeGlyph({ media, variant = "services", className = "", style }) {
  const track = useRef(null);
  const timeline = useRef(null);
  const revealed = useRef(false);
  const maskId = `glyph-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const supplied = media?.url?.match(/trichis-(question|services|work-left|work-right)(?:-\d+)?\.svg(?:\?|$)/)?.[1];
  const selected = supplied || variant;
  // Only bundled, trusted SVGs are inlined; other CMS media stays an ordinary image.
  const svg = !media?.url || supplied ? artwork[selected] : null;
  const markup = useMemo(() => ({ __html: svg ? drawMarkup(svg, selected, maskId) : "" }), [svg, selected, maskId]);

  useGSAP(() => {
    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      const paths = track.current.querySelectorAll("[data-draw]");
      const dot = track.current.querySelector("[data-dot]");
      const image = track.current.querySelector("img");
      const animation = gsap.timeline({ paused: true });
      paths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        animation.to(path, { strokeDashoffset: 0, duration: 1.65, ease: "power2.inOut" }, 0);
      });
      if (dot) {
        gsap.set(dot, { autoAlpha: 0 });
        animation.to(dot, { autoAlpha: 1, duration: 0.25 }, 1.4);
      }
      if (image) animation.from(image, { autoAlpha: 0, duration: 0.7 }, 0);
      timeline.current = animation;
      if (revealed.current) animation.progress(1);
      return () => { timeline.current = null; };
    });
    return () => motion.revert();
  }, { scope: track, dependencies: [svg, media?.url], revertOnUpdate: true });

  useInView({ el: track, offset: 0.15, handleIn: () => { revealed.current = true; timeline.current?.play(); } });

  return (
    <span ref={track} className={`home-glyph ${className}`} data-glyph={selected} style={style} aria-hidden="true">
      {svg ? <span className="home-glyph__art" dangerouslySetInnerHTML={markup} />
        : <img src={media.url} alt="" loading="lazy" />}
    </span>
  );
}
