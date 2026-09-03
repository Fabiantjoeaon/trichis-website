import { useMemo } from "react";
import BorderedIcon from "@/components/ui/BorderedIcon";
import CmsHtml from "@/components/ui/CmsHtml";
import NineGLImageElement from "@/components/gl/NineGLImage/NineGLImageElement";
import { useGlobalStore } from "@/stores/global";

export const columnRowTypeNames = {
  image: "ImagecolumnRecord",
  text: "TextcolumnRecord",
  empty: "EmptycolumnRecord",
};

function ColumnTextItem({ text, cta, align = "center", applyMarginBottom }) {
  const alignMap = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
  };

  return (
    <div
      className={`column-text${applyMarginBottom ? " has-mb" : ""}`}
      style={{ justifyContent: alignMap[align] || "center" }}
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
  showSwoosh,
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
      {showSwoosh && (
        <img
          className="swoosh swoosh--b"
          src="/images/swoosh-b.svg"
          alt=""
          aria-hidden="true"
        />
      )}
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
        const width = isMobileLayout ? mobileWidth : _width;

        const style = {
          "--width": `${width}%`,
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
            {__typename === columnRowTypeNames.image && image && (
              <NineGLImageElement
                className={
                  isVideo ? "column-row-image-video" : "column-row-image"
                }
                isLink={false}
                src={image.url}
                isVideo={isVideo}
                offset={-0.5}
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
