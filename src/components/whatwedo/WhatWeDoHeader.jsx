import SplitText from "@/components/ui/SplitText";
import ShuffledText from "@/components/ui/ShuffledText";
import { SectionTitle } from "@/components/ui/Divider";
import { t } from "@/lib/i18n";

export function SmallTextSplit({ children, className = "" }) {
  return <div className={`small-text-split ${className}`}>{children}</div>;
}

export default function WhatWeDoServiceHeader({
  service,
  serviceBottom,
  children,
  className = "",
  fullServiceName = null,
  showSectionTitle = true,
  sectionTitle = null,
  anchorId = null,
}) {
  return (
    <>
      {showSectionTitle && (
        <SectionTitle>
          {sectionTitle ||
            t("service.sectionTitle").replace(
              "{name}",
              fullServiceName || service || "",
            )}
        </SectionTitle>
      )}
      <header
        className={`service-header inner-width ${className}`}
        id={anchorId || undefined}
      >
        <div className="service-header__left">
          {service && (
            <SplitText tag="h1" animateOnScroll animation="charClipped">
              {service}
            </SplitText>
          )}
          {serviceBottom && (
            <SplitText tag="h1" animateOnScroll>
              {serviceBottom}
            </SplitText>
          )}
          <ShuffledText
            wrapperClassName="shuffled-text-left"
            useRandomText
            animateOnScroll
          />
          <ShuffledText
            wrapperClassName="shuffled-text-right"
            useRandomText
            animateOnScroll
          />
        </div>
        <div className="service-header__right">{children}</div>
      </header>
    </>
  );
}
