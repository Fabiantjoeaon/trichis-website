import { useEffect, useMemo, useRef, useState } from "react";
import SplitText from "@/components/ui/SplitText";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import { MEET_IMAGE_COUNT } from "@/lib/constants";
import { useGlobalStore } from "@/stores/global";
import { simpleLerp as lerp } from "@/lib/math";

function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const DEFAULT_DIMS = { width: 400, height: 600 };

export function NiceToMeetYou() {
  const wrapper = useRef(null);
  const overlay = useRef(null);
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const [imageDims, setImageDims] = useState(() =>
    Array.from({ length: MEET_IMAGE_COUNT }, () => ({ ...DEFAULT_DIMS })),
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      Array.from(
        { length: MEET_IMAGE_COUNT },
        (_, i) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () =>
              resolve({
                width: img.naturalWidth || DEFAULT_DIMS.width,
                height: img.naturalHeight || DEFAULT_DIMS.height,
              });
            img.onerror = () => resolve({ ...DEFAULT_DIMS });
            img.src = `/images/meet-us/${i + 1}.webp`;
          }),
      ),
    ).then((dims) => {
      if (!cancelled) setImageDims(dims);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const imageOverlayStyle = useMemo(() => {
    return Object.assign(
      {},
      ...imageDims.map((img, i) => {
        const baseWidth = 400;
        const baseMargin = 300;
        let scale = baseWidth / img.width;
        if (img.width > img.height) scale *= 2;
        const r = seededRandom(i * 3) * 200;
        let randomOffset =
          lerp(r, r * (Math.sin(i) * 0.5), seededRandom(i * 3 + 1) * 0.8) - 100;
        let randomMargin = baseMargin + seededRandom(i * 3 + 2) * 100;
        if (isMobileLayout) {
          scale *= 0.8;
          randomOffset *= 0.9;
        }
        return {
          [`--image-${i + 1}-width`]: `${Math.round(img.width * scale)}rem`,
          [`--image-${i + 1}-height`]: `${Math.round(img.height * scale)}rem`,
          [`--image-${i + 1}-offset-y`]: `${Math.round(randomOffset)}rem`,
          [`--image-${i + 1}-margin`]: `${Math.round(randomMargin)}rem`,
        };
      }),
    );
  }, [imageDims, isMobileLayout]);

  useEffect(() => {
    const row = overlay.current;
    if (!row) return;
    let raf = 0;
    let x = 0;
    const tick = () => {
      x -= 0.35;
      const width = row.scrollWidth / 2;
      if (width > 0 && Math.abs(x) >= width) x = 0;
      row.style.transform = `translate3d(${x}px, -50%, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [imageDims]);

  const imgs = [...imageDims, ...imageDims];

  return (
    <>
      <SectionTitle>Nice to meet you</SectionTitle>
      <section ref={wrapper} className="nice-to-meet-you inner-width">
        <ScrollingText>Dream big and make it real</ScrollingText>
        <div className="nice-to-meet-you__center">
          <SplitText animateOnScroll tag="h1">
            Come say hi!
          </SplitText>
          <SplitText animateOnScroll tag="h3">
            Lets meet <b>at the bar?</b>
          </SplitText>
        </div>
        <div className="nice-to-meet-you__spacer" />
        <div
          ref={overlay}
          className="nice-to-meet-you__overlay"
          style={imageOverlayStyle}
        >
          {imgs.map((_, i) => {
            const idx = (i % MEET_IMAGE_COUNT) + 1;
            return (
              <div
                key={`${i}-${idx}`}
                className={`meet-image image-overlay-${idx}`}
                style={{
                  width: `var(--image-${idx}-width)`,
                  height: `var(--image-${idx}-height)`,
                  marginRight: `var(--image-${idx}-margin)`,
                  transform: `translateY(var(--image-${idx}-offset-y))`,
                }}
              >
                <img src={`/images/meet-us/${idx}.webp`} alt="" />
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
