"use client";

import { useCallback, useEffect, useRef } from "react";
import { UseCanvas, ScrollScene } from "@/components/gl";
import { useTracker } from "@/lib/gl/useTracker";
import HowWeDoItScene from "@/components/gl/HowWeDoIt/HowWeDoItScene";
import {
  howWeDoItProgress,
  howWeDoItScale,
  howWeDoItStore,
  howWeDoItX,
} from "@/components/gl/HowWeDoIt/stores";
import useInView from "@/hooks/useInView";
import { useTicker } from "@/hooks/useTicker";
import emitter from "@/lib/emitter";
import { events } from "@/lib/events";
import { clamp, lerp } from "@/lib/math";
import { useGlobalStore } from "@/stores/global";

function Card({ children, i, trackRef }) {
  const innerRef = useRef(null);
  const cardTracker = useTracker(innerRef, { autoUpdate: false });
  const trackTracker = useTracker(trackRef, { autoUpdate: false });
  const cardTrackerRef = useRef(cardTracker);
  const trackTrackerRef = useRef(trackTracker);
  cardTrackerRef.current = cardTracker;
  trackTrackerRef.current = trackTracker;

  const sync = useCallback(() => {
    const card = cardTrackerRef.current;
    const section = trackTrackerRef.current;
    card.measure?.();
    card.update?.();
    section.measure?.();
    section.update?.();
    if (!card.scale.y || !section.scale.y) return;

    howWeDoItStore.getState().addTransform(
      {
        scale: { ...card.scale },
        position: {
          x: card.position.x - section.position.x,
          y: 0,
          z: 0,
        },
        rect: {
          width: card.bounds.width,
          height: card.bounds.height,
        },
      },
      i,
    );
  }, [i]);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  return (
    <article
      ref={innerRef}
      className="how-we-do-it__card flex flex-1 flex-col items-start justify-start select-none p-[100rem] min-w-0"
      style={{
        width: `calc(100% / var(--hwdi-count) - (var(--cardGap) * 2))`,
      }}
    >
      {children}
    </article>
  );
}

/**
 * How we do it — DOM cards + TSL glass / scrolling text scene.
 * Accepts either `data={{ title, cards }}` or a bare `cards` array (HomePage).
 */
export default function HowWeDoIt({ data, cards: cardsProp, title: titleProp }) {
  const track = useRef(null);
  const inner = useRef(null);
  const activeItem = useRef(null);
  const indicatorWrapper = useRef(null);
  const bounds = useRef(null);
  const itemBounds = useRef(null);
  const _x = useRef(0);
  const _scale = useRef(1);

  const cards = cardsProp ?? data?.cards ?? [];
  const title = titleProp || data?.title || "How we do it";

  const handleBounds = useCallback(() => {
    if (!indicatorWrapper.current || !activeItem.current) return;
    bounds.current = indicatorWrapper.current.getBoundingClientRect();
    itemBounds.current = activeItem.current.getBoundingClientRect();
  }, []);

  useEffect(() => {
    handleBounds();
  }, [handleBounds, cards.length]);

  const { start, stop } = useTicker(
    () => {
      if (!inner.current) return;
      inner.current.style.transform = `scale(${_scale.current}) translateX(${_x.current}px)`;

      let progress = howWeDoItProgress.getState();
      if (activeItem.current && bounds.current?.width > 0) {
        const indicatorWidth = itemBounds.current.width;
        const maxPosition = bounds.current.width - indicatorWidth;
        if (progress > 0.95) progress = clamp(progress * 1.05, 0, 1);
        activeItem.current.style.transform = `translateX(${maxPosition * progress}px)`;
      }
    },
    { initiallyActive: false },
  );

  useInView({
    el: track,
    once: false,
    handleIn: () => {
      start();
      emitter.emit(events.HOME_HOW_WE_DO_IT_IN);
    },
    handleOut: () => {
      stop();
      emitter.emit(events.HOME_HOW_WE_DO_IT_OUT);
    },
  });

  useTicker(
    ({ delta }) => {
      if (!useGlobalStore.getState().isMobileLayout) return;
      const x = howWeDoItX.getState();
      const scale = howWeDoItScale.getState();
      _scale.current = lerp(scale, _scale.current, 0.9, delta);
      _x.current = lerp(x, _x.current, 0.1, delta);
    },
    { initiallyActive: true },
  );

  return (
    <>
      <h2 className="inner-width text-text">{title}</h2>

      <section
        ref={track}
        className="how-we-do-it__wrapper relative w-full inner-width"
        style={{
          paddingTop: "100rem",
          paddingBottom: "100rem",
          touchAction: "pan-x",
          overscrollBehaviorY: "contain",
          ["--cardGap"]: "20rem",
          ["--hwdi-count"]: cards.length || 1,
        }}
      >
        <div
          ref={inner}
          className="how-we-do-it__card__inner flex w-full items-stretch justify-between gap-[var(--cardGap)]"
        >
          {cards.map((card, i) => (
            <Card i={i} key={`${card.title}-${i}`} trackRef={track}>
              <h3 className="t-glass-card-number mb-[50rem] text-text">
                0{i + 1}
              </h3>
              <h4 className="t-glass-card-title mb-[60rem] text-text">
                {card.title}
              </h4>
              {card.textTop && (
                <p className="t-glass-card-paragraph how-we-do-it__card__text-top mb-[40rem] text-text">
                  {card.textTop}
                </p>
              )}
              {card.textBottom && (
                <p className="t-glass-card-paragraph text-text">
                  {card.textBottom}
                </p>
              )}
            </Card>
          ))}
        </div>

        <UseCanvas id="how-we-do-it">
          <ScrollScene track={track}>
            {(props) => (
              <HowWeDoItScene {...props} cardCount={cards.length} />
            )}
          </ScrollScene>
        </UseCanvas>

        <div
          ref={indicatorWrapper}
          className="how-we-do-it__mobile-indicator absolute left-1/2 -translate-x-1/2 hidden max-[711px]:flex"
          style={{
            bottom: "calc(250rem * 0.5 - 40rem)",
            width: "50%",
            height: "40rem",
            justifyContent: "space-between",
          }}
        >
          {cards.map((_, i) => (
            <div
              key={i}
              className="h-full w-[40rem] rounded-[10px] border border-text"
            />
          ))}
          <div
            ref={activeItem}
            className="absolute left-0 top-0 h-full w-[40rem] rounded-[10px] bg-text"
          />
        </div>
      </section>
    </>
  );
}
