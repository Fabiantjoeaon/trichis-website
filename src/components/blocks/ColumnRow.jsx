import { useMemo } from "react";
import BorderedIcon from "@/components/ui/BorderedIcon";
import CmsHtml from "@/components/ui/CmsHtml";
import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import { useGlobalStore } from "@/stores/global";
import { boundedNumber } from "@/lib/home-layout";
import ColumnGlyphs from "./ColumnGlyphs";

export const columnRowTypeNames = {
  image: "ImagecolumnRecord",
  text: "TextcolumnRecord",
  empty: "EmptycolumnRecord",
};

function ColumnTextItem({ text, cta, align = "center", textAlign, applyMarginBottom }) {
  const alignMap = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
  };

  return (
    <div
      className={`column-text${applyMarginBottom ? " has-mb" : ""}`}
      style={{ justifyContent: alignMap[align] || "center",
        textAlign: ["left", "center", "right"].includes(textAlign) ? textAlign : undefined }}
    >
      <div className="column-text__inner">
        <CmsHtml text={text} />
        {cta && (
          <BorderedIcon
            dontTriggerPageTransition={cta.isExternal}
            className="column-text__cta"
            text={cta.text}
            href={cta.url}
          />
        )}
      </div>
    </div>
  );
}

export default function ColumnRow({
  data,
  className = "",
  isImageColumnAndNextItemIsImageColumn,
  isJustTextColumn,
  isColumnRowAndNeedsMoreSpacingBottom,
}) {
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const columns = data?.columns || [];

  const hasMultipleColumns = useMemo(() => {
    if (isMobileLayout) return columns.some((c) => (c.mobileWidth ?? 100) < 100);
    return columns.some((c) => c.width < 100);
  }, [columns, isMobileLayout]);

  return (
    <div
      id={data?.anchorId || undefined}
      className={`column-row-wrap inner-width${hasMultipleColumns ? " multi" : ""}${isColumnRowAndNeedsMoreSpacingBottom ? " more-bottom" : ""}`}
    >
      <ColumnGlyphs glyphs={data?.glyphs} />
      {columns.map((column, index) => {
        const {
          __typename,
          width: _width,
          mobileWidth: _mobileWidth,
          image,
          text,
          ...rest
        } = column;
        const mobileWidth = _mobileWidth !== null && _mobileWidth !== undefined
          ? _mobileWidth
          : 100;
        const width = boundedNumber(isMobileLayout ? mobileWidth : _width, 100, 0, 100);

        const style = {
          "--width": `${width}%`,
          "--gap-share": 1 - width / 100,
          ...(width === 0 ? { display: "none" } : null),
          marginBottom: isImageColumnAndNextItemIsImageColumn ? "150rem" : "0",
          ...(isJustTextColumn ? { margin: "250rem 0" } : null),
        };

        const isVideo = !!image?.isVideo;

        return (
          <div
            className={`column-row ${className} ${__typename || ""}`}
            key={index}
            style={style}
          >
            <ColumnGlyphs glyphs={data?.glyphs} column={index + 1} />
            {__typename === columnRowTypeNames.image && image && (
              <NineGLImageElement
                className={
                  isVideo ? "column-row-image-video" : "column-row-image"
                }
                isLink={false}
                src={image.url}
                alt={image.alt || ""}
                width={image.width}
                height={image.height}
                isVideo={isVideo}
                offset={0.1}
              />
            )}
            {__typename === columnRowTypeNames.text && text && (
              <ColumnTextItem
                text={text}
                width={width}
                mobileWidth={mobileWidth}
                applyMarginBottom={mobileWidth === 100}
                {...rest}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
