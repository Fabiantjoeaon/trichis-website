// Port of nine-ca components/Footer/CTAFooter.js
import SplitText from "@/components/ui/SplitText";
import BorderedIcon from "@/components/ui/BorderedIcon";

export default function CTAFooter({ title = "", cta }) {
  if (!title && !cta?.text) return null;

  return (
    <div className="cta-footer inner-width">
      <div className="cta-footer__inner">
        <SplitText
          animateOnScroll={true}
          tag="h3"
          dangerouslySetInnerHTML={{ __html: title }}
        >
          {title}
        </SplitText>
        {cta?.text && (
          <div className="cta-footer__cta">
            <BorderedIcon
              dontTriggerPageTransition
              href={cta.href}
              text={cta.text}
            />
          </div>
        )}
      </div>
    </div>
  );
}
