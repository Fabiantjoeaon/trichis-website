// Single-language (NL) UI strings. The editable source of truth lives in
// WordPress (Site Settings → UI Strings), fetched into i18n.overrides.json;
// this map is the build-time fallback.
import overrides from "./i18n.overrides.json";

export const SITE_LANG = "nl";
export const SITE_LOCALE = "nl-NL";

const strings = {
  "nav.home": "Home",
  "nav.whatWeDo": "What we do",
  "nav.projects": "Projects",
  "nav.aboutUs": "About us",
  "nav.menu": "Menu",
  "nav.close": "Sluiten",

  "footer.backToTop": "Back to top",

  "cookies.message":
    "Deze website gebruikt cookies om je ervaring te verbeteren.",
  "cookies.accept": "Accepteren",
  "cookies.reject": "Weigeren",

  "form.submit": "Verstuur",
  "form.required": "Verplicht veld",
  "form.error": "Er ging iets mis. Probeer het opnieuw.",

  "project.next": "Volgend project",
  "notFound.title": "Pagina niet gevonden",
  "notFound.cta": "Terug naar home",
};

export function t(key) {
  const override = overrides[key];
  if (typeof override === "string") return override;
  if (override?.[SITE_LANG]) return override[SITE_LANG];
  return strings[key] ?? key;
}
