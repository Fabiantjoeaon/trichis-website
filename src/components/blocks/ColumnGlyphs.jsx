import HomeGlyph from "@/components/home/HomeGlyph";
import { boundedNumber } from "@/lib/home-layout";

// column=0 anchors to the row; positive numbers anchor to that column (1-based).
export default function ColumnGlyphs({ glyphs = [], column = 0 }) {
  const items = glyphs.filter((glyph) => Number(glyph.column || 0) === column);
  if (!items.length) return null;
  return <div className="column-glyphs" aria-hidden="true">
    {items.map((glyph, index) => {
      const x = boundedNumber(glyph.x, 0, -100, 200);
      const y = boundedNumber(glyph.y, 50, -100, 200);
      const width = boundedNumber(glyph.width, 30, 5, 150);
      const variant = ["question", "services", "work-left", "work-right"].includes(glyph.variant) ? glyph.variant : "services";
      return <HomeGlyph key={index} media={glyph.glyphMedia} variant={variant}
        className={`column-glyph${glyph.hideOnMobile ? " column-glyph--hide-mobile" : ""}`}
        style={{
          "--glyph-x": `${x}%`, "--glyph-y": `${y}%`, "--glyph-size": `${width}%`,
          "--glyph-mobile-x": `${boundedNumber(glyph.mobileX, x, -100, 200)}%`,
          "--glyph-mobile-y": `${boundedNumber(glyph.mobileY, y, -100, 200)}%`,
          "--glyph-mobile-size": `${boundedNumber(glyph.mobileWidth, width, 5, 150)}%`,
          "--glyph-rotation": `${boundedNumber(glyph.rotation, 0, -180, 180)}deg`,
          "--glyph-flip": glyph.flip ? -1 : 1,
          zIndex: glyph.layer === "behind" ? 1 : 5,
        }} />;
    })}
  </div>;
}
