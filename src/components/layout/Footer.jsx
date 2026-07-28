// Port of nine-ca components/Footer/Footer.js — content comes from Site
// Settings (seeded with nine-ca's hardcoded offices/links) via props.
import { useMemo, useRef } from "react";
import SplitText from "@/components/ui/SplitText";
import BorderedIcon from "@/components/ui/BorderedIcon";
import { SectionTitle } from "@/components/ui/Divider";
import { TransitionLink } from "@/components/ui/TransitionLink";
import useInView from "@/hooks/useInView";

function FooterList({ heading, items, registerItem }) {
  return (
    <ul>
      <li>
        <SplitText tag="strong" animateOnScroll={false} ref={registerItem}>
          {heading}
        </SplitText>
      </li>
      {items.map((item, i) => (
        <li key={i}>
          {item.href ? (
            item.internal ? (
              <TransitionLink href={item.href}>
                <SplitText tag="p" animateOnScroll={false} ref={registerItem}>
                  {item.label}
                </SplitText>
              </TransitionLink>
            ) : (
              <a href={item.href} target={item.blank ? "_blank" : undefined} rel={item.blank ? "noopener noreferrer" : undefined}>
                <SplitText tag="p" animateOnScroll={false} ref={registerItem}>
                  {item.label}
                </SplitText>
              </a>
            )
          ) : (
            <SplitText tag="p" animateOnScroll={false} ref={registerItem}>
              {item.label}
            </SplitText>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function Footer({ settings = {} }) {
  const items = useRef([]);
  const wrapper = useRef();
  const indexRef = useRef(0);

  const registerItem = (r) => {
    if (r) items.current[indexRef.current++] = r;
  };

  useInView({
    el: wrapper,
    offset: -0.25,
    handleIn: () => {
      items.current.forEach((item, index) => {
        item?.animateIn({ delay: index * 0.04 });
      });
    },
  });

  const year = useMemo(() => new Date().getFullYear(), []);

  const footer = settings.footer ?? {};
  const email = footer.email || "cu@nine.nl";

  const officeLists = (footer.offices ?? []).map((office) => ({
    heading: office.city,
    items: (office.address ?? "")
      .split("\n")
      .filter(Boolean)
      .map((line) => ({ label: line })),
  }));

  // First office column also carries the email link (nine-ca layout)
  if (officeLists[0]) {
    officeLists[0].items.push({ label: email, href: `mailto:${email}` });
  }

  const menuItems = (settings.navLinks ?? [])
    .filter((l) => l.path !== "/")
    .map((l) => ({ label: l.label, href: l.path, internal: true }));
  menuItems.push({ label: "Contact", href: `mailto:${email}` });

  const socialItems = (footer.socialLinks ?? []).map((s) => ({
    label: s.label,
    href: s.url,
    blank: true,
  }));

  const legalItems = footer.legalItems ?? [];

  return (
    <footer ref={wrapper}>
      <SectionTitle>Get in touch</SectionTitle>
      <div className="footer-wrapper inner-width">
        <div className="footer-inner">
          <div className="footer-inner__left">
            {officeLists.map((list, i) => (
              <FooterList
                key={i}
                heading={list.heading}
                items={list.items}
                registerItem={registerItem}
              />
            ))}
            <FooterList heading="Menu" items={menuItems} registerItem={registerItem} />
            <FooterList heading="Follow us" items={socialItems} registerItem={registerItem} />
          </div>

          <div className="footer-inner__right">
            <BorderedIcon
              offset={-0.25}
              href={`mailto:${email}`}
              text="Contact us"
              dontTriggerPageTransition
            />
          </div>
        </div>
      </div>
      <SectionTitle />

      <div className="footer-bottom">
        <p>Nine Creative Agency - {year}</p>
        <div className="footer-bottom__right">
          {legalItems.map((item, i) => (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer">
              <SplitText tag="p" animateOnScroll>
                {item.label}
              </SplitText>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
