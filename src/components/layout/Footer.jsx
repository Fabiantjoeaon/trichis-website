import { useMemo } from "react";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { t } from "@/lib/i18n";

function addressLines(address = "") {
  return String(address)
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatYear(year) {
  return String(year).replaceAll("0", "☺");
}

function FooterLink({ href, children, external }) {
  if (!href || href === "#") {
    return <span>{children}</span>;
  }

  if (external || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a
        href={href}
        target={external || href.startsWith("http") ? "_blank" : undefined}
        rel={external || href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  return <TransitionLink href={href}>{children}</TransitionLink>;
}

export default function Footer({ settings = {} }) {
  const year = useMemo(() => new Date().getFullYear(), []);
  const footer = settings.footer ?? {};
  const siteName = settings.general?.siteName ?? "";

  const title = (footer.ctaTitle ?? "").replace(/<br\s*\/?>/gi, "\n");
  const email = footer.email ?? "";
  const sharedPhone = footer.phone ?? "";

  const offices = (footer.offices ?? []).map((office, index) => {
    const phone = office.phone || (index === 0 ? sharedPhone : "");
    const phoneHref =
      office.phoneHref ||
      (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "");

    return {
      city: office.city,
      lines: addressLines(office.address),
      phone,
      phoneHref,
    };
  });

  const socialItems = footer.socialLinks ?? [];
  const legalItems = footer.legalItems ?? [];

  return (
    <footer className="site-footer" id="contact">
      <div className="site-footer__inner inner-width">
        <p className="site-footer__title">
          {title.split("\n").map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>

        <div className="site-footer__cols">
          <div className="site-footer__col site-footer__col--lead">
            <p className="site-footer__head">{footer.leadHead}</p>
            <p>{footer.leadBody}</p>
          </div>

          {offices.map((office) => (
            <div className="site-footer__col" key={office.city}>
              <p className="site-footer__head">{office.city}</p>
              <p>
                {office.lines.map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
                {email ? (
                  <FooterLink href={`mailto:${email}`}>{email}</FooterLink>
                ) : null}
                {office.phone ? (
                  <>
                    <br />
                    <FooterLink href={office.phoneHref}>{office.phone}</FooterLink>
                  </>
                ) : null}
              </p>
            </div>
          ))}

          <div className="site-footer__col">
            <p className="site-footer__head">{t("footer.follow")}</p>
            <p>
              {socialItems.map((item, i) => (
                <span key={i}>
                  <FooterLink href={item.url} external>
                    {item.label}
                  </FooterLink>
                  {i < socialItems.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>

      <div className="site-footer__rule" />

      <div className="site-footer__bottom inner-width">
        <span>
          {siteName} {formatYear(year)}
        </span>
        <nav className="site-footer__legal" aria-label={t("footer.legalLabel")}>
          {legalItems.map((item, i) => (
            <FooterLink key={i} href={item.url} external={item.url?.startsWith("http")}>
              → {item.label}
            </FooterLink>
          ))}
        </nav>
      </div>

      <div className="site-footer__rule" />
      <div className="site-footer__tail" />
    </footer>
  );
}
