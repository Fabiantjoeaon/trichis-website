// Port of nine-ca components/Footer/CTAFooter.js
import SplitText from "@/components/ui/SplitText";
import BorderedIcon from "@/components/ui/BorderedIcon";

export default function CTAFooter({
  title = "Klaar voor de <strong>volgende stap</strong>?",
  cta = { href: "mailto:info@trichis.nl", text: "Neem contact op" },
}) {
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
        <div className="cta-footer__cta">
          <BorderedIcon dontTriggerPageTransition href={cta.href} text={cta.text} />
        </div>
      </div>
    </div>
  );
}
