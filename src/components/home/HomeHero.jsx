"use client";

import { useRef } from "react";
import { UseCanvas, ScrollScene } from "@/components/gl";
import HeroGrid from "@/components/gl/HeroGrid";

/**
 * Home hero section — full-bleed tracked region with the TSL HeroGrid.
 * Pages can mount this inside the home layout; GL portals into SiteChrome's canvas.
 */
export default function HomeHero({
  className = "",
  brandText = "nine",
  brandMobile = "n",
}) {
  const track = useRef(null);

  return (
    <section
      ref={track}
      className={`home-hero relative w-full overflow-hidden ${className}`}
      style={{
        height:
          "calc(100vh - var(--navigationHeight) - var(--basePadding) * 2)",
        marginTop: "calc(var(--navigationHeight) + var(--basePadding))",
        marginBottom: "150rem",
        width: "calc(100% - var(--pagePadding) * 2)",
        marginLeft: "var(--pagePadding)",
        marginRight: "var(--pagePadding)",
      }}
    >
      <UseCanvas id="home-hero-grid">
        <ScrollScene track={track}>
          {(props) => (
            <HeroGrid
              {...props}
              brandText={brandText}
              brandMobile={brandMobile}
            />
          )}
        </ScrollScene>
      </UseCanvas>
    </section>
  );
}
