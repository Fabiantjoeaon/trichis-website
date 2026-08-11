import { useMemo } from "react";
import { TransitionLink } from "@/components/ui/TransitionLink";

const DEFAULT_TITLE = "Klaar voor de\nvolgende stap?";
const DEFAULT_LEAD_HEAD = "Laten we kennismaken";
const DEFAULT_LEAD_BODY =
  "De beste ideeën beginnen met een goed gesprek. Heb je een vraag, een uitdaging of ben je benieuwd wat we voor je kunnen betekenen? Bel ons, stuur een bericht of kom langs voor een lekker bakkie. We maken graag tijd voor je.";

const DEFAULT_OFFICES = [
  {
    city: "Rotterdam",
    address: "Goudsesingel 194\n3011 KD Rotterdam",
    phone: "+31 10 477 85 25",
    phoneHref: "tel:+31104778525",
  },
  {
    city: "Breda",
    address: "Rozenlaan 1\n4835 PB Breda",
    phone: "+31 76 520 48 60",
    phoneHref: "tel:+31765204860",
  },
];

const DEFAULT_SOCIAL = [
  {
    label: "LinkedIn",
    url: "https://www.linkedin.com/company/trichis",
  },
  {
    label: "Instagram",
    url: "https://www.instagram.com/trichis",
  },
];

const DEFAULT_LEGAL = [
  { label: "Algemene voorwaarden", url: "#" },
  { label: "Privacy", url: "#" },
  { label: "Cookies", url: "#" },
  { label: "Sitemap", url: "/sitemap.xml" },
];

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

  const title = (footer.ctaTitle || DEFAULT_TITLE).replace(/<br\s*\/?>/gi, "\n");
  const email = footer.email || "info@trichis.nl";
  const sharedPhone = footer.phone || "";

  const offices = (footer.offices?.length ? footer.offices : DEFAULT_OFFICES).map(
    (office, index) => {
      const fallback = DEFAULT_OFFICES.find(
        (item) => item.city.toLowerCase() === String(office.city || "").toLowerCase(),
      );
      const phone = office.phone || fallback?.phone || (index === 0 ? sharedPhone : "");
      const phoneHref =
        office.phoneHref ||
        fallback?.phoneHref ||
        (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "");

      return {
        city: office.city,
        lines: addressLines(office.address || fallback?.address || ""),
        phone,
        phoneHref,
      };
    },
  );

  const socialItems = footer.socialLinks?.length
    ? footer.socialLinks
    : DEFAULT_SOCIAL;

  const legalItems = footer.legalItems?.length
    ? footer.legalItems
    : DEFAULT_LEGAL;

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
            <p className="site-footer__head">{DEFAULT_LEAD_HEAD}</p>
            <p>{DEFAULT_LEAD_BODY}</p>
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
                <FooterLink href={`mailto:${email}`}>{email}</FooterLink>
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
            <p className="site-footer__head">Follow us</p>
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
          Trichis {formatYear(year)}
        </span>
        <nav className="site-footer__legal" aria-label="Juridisch">
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
