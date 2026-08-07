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
import { SectionTitle } from "@/components/ui/Divider";

function Card({ children, i, trackRef }) {
  const innerRef = useRef(null);
  const cardTracker = useTracker(innerRef, { autoUpdate: false });
  const trackTracker = useTracker(trackRef, { autoUpdate: false });
  const cardTrackerRef = useRef(cardTracker);
  const trackTrackerRef = useRef(trackTracker);
  const lastKey = useRef("");
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

    const key = `${card.scale.x.toFixed(2)}:${card.scale.y.toFixed(2)}:${(card.position.x - section.position.x).toFixed(2)}:${card.bounds.width}:${card.bounds.height}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

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
    const run = () => requestAnimationFrame(sync);
    run();
    window.addEventListener("resize", run);
    return () => window.removeEventListener("resize", run);
  }, [sync]);

  useTicker(
    () => {
      sync();
    },
    { initiallyActive: true },
  );

  return (
    <article ref={innerRef} className="how-we-do-it__card">
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
      <SectionTitle>{title}</SectionTitle>

      <section
        ref={track}
        className="how-we-do-it__wrapper"
        style={{
          ["--hwdi-count"]: cards.length || 1,
        }}
      >
        <div ref={inner} className="how-we-do-it__card__inner">
          {cards.map((card, i) => (
            <Card i={i} key={`${card.title}-${i}`} trackRef={track}>
              <h3 className="t-glass-card-number">0{i + 1}</h3>
              <h4 className="t-glass-card-title">{card.title}</h4>
              {card.textTop && (
                <p className="t-glass-card-paragraph how-we-do-it__card__text-top">
                  {card.textTop}
                </p>
              )}
              {card.textBottom && (
                <p className="t-glass-card-paragraph">{card.textBottom}</p>
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
          className="how-we-do-it__mobile-indicator"
        >
          {cards.map((_, i) => (
            <div key={i} className="how-we-do-it__card__mobile-indicator-item" />
          ))}
          <div
            ref={activeItem}
            className="how-we-do-it__card__mobile-indicator-item active"
          />
        </div>
      </section>

      <SectionTitle />
    </>
  );
}
