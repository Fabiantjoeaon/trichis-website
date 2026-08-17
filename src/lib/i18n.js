// Single-language (NL) UI strings.
//
// The source of truth is WordPress (Site Settings → UI Strings). Nothing is
// hard-coded here: `scripts/fetch-ui-strings.mjs` fetches the strings into
// i18n.overrides.json before dev and build, so `t()` resolves identically on
// the server and in the browser without prop drilling.
import overrides from "./i18n.overrides.json";

export const SITE_LANG = "nl";
export const SITE_LOCALE = "nl-NL";

export function t(key, fallback = "") {
  const value = overrides[key];
  if (typeof value === "string" && value) return value;
  return fallback;
}
