import { useMemo } from "react";
import CTAFooter from "@/components/layout/CTAFooter";
import ProjectHeader from "./ProjectHeader";
import ProjectNumbers from "./ProjectNumbers";
import PageHeader from "./PageHeader";
import Paragraph from "./Paragraph";
import ColumnRow from "./ColumnRow";
import FormSection from "./FormSection";
import { SectionTitle } from "@/components/ui/Divider";
import { ScrollingText } from "@/components/ui/ScrollingText";
import { useGlobalStore } from "@/stores/global";
import { isMediaVideo } from "@/lib/cms";

function ScrollingTitle({ data }) {
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const maxWidth = useMemo(
    () => (isMobileLayout ? "100vw" : "50vw"),
    [isMobileLayout],
  );
  return (
    <div className="scrolling-title-block inner-width">
      <ScrollingText maxWidth={maxWidth}>{data?.text}</ScrollingText>
    </div>
  );
}

export const ContentComponents = {
  ProjectheaderRecord: ProjectHeader,
  ProjectnumberRecord: ProjectNumbers,
  PageheaderRecord: PageHeader,
  ParagraphRecord: Paragraph,
  ColumnrowRecord: ColumnRow,
  ScrollingTitleRecord: ScrollingTitle,
  SectionlineRecord: ({ data }) => <SectionTitle>{data?.title}</SectionTitle>,
  CtasectionRecord: ({ data }) => (
    <CTAFooter
      title={data?.title?.replace(/<\/?p>/g, "")}
      cta={{ href: data?.ctaLink, text: data?.ctaText }}
    />
  ),
  FormSectionRecord: ({ data }) => <FormSection data={data} />,
};

function hasVideoColumn(item) {
  return !!item?.columns?.some(
    (c) =>
      c.__typename === "ImagecolumnRecord" &&
      isMediaVideo(c.image?.url, c.image?.video),
  );
}

export default function DynamicContent({ content, page }) {
  if (!content?.length) return null;
  const pageType = page?.__typename;

  // The prototype hangs the yellow swoosh over the first video in the page
  const swooshIndex = content.findIndex(hasVideoColumn);

  return content.map((item, index) => {
    const Component = ContentComponents[item.__typename];
    if (!Component) return null;

    const nextItem = content[index + 1];
    let isImageColumnAndNextItemIsImageColumn = false;
    let isJustTextColumn = false;
    let isColumnRowAndNeedsMoreSpacingBottom = false;

    if (item.columns && nextItem?.columns) {
      isImageColumnAndNextItemIsImageColumn =
        item.columns.some((c) => c.__typename === "ImagecolumnRecord") &&
        nextItem.columns.some((c) => c.__typename === "ImagecolumnRecord");
    }

    if (item.columns && nextItem) {
      isColumnRowAndNeedsMoreSpacingBottom =
        item.columns.some((c) => c.__typename === "ImagecolumnRecord") &&
        nextItem.__typename === "SectionlineRecord";
    }

    if (
      !isColumnRowAndNeedsMoreSpacingBottom &&
      pageType === "ServiceRecord" &&
      index === content.length - 1
    ) {
      isColumnRowAndNeedsMoreSpacingBottom = true;
    }

    isJustTextColumn =
      item?.columns &&
      item.columns
        .filter((c) => c.__typename !== "EmptycolumnRecord")
        .every((c) => c.__typename === "TextcolumnRecord");

    const data = item.data ?? { ...item };

    return (
      <Component
        key={index}
        data={data}
        isImageColumnAndNextItemIsImageColumn={
          isImageColumnAndNextItemIsImageColumn
        }
        isJustTextColumn={isJustTextColumn}
        isColumnRowAndNeedsMoreSpacingBottom={
          isColumnRowAndNeedsMoreSpacingBottom
        }
        showSwoosh={index === swooshIndex}
        {...page}
      />
    );
  });
}
