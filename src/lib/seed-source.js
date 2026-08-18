// Seed-JSON data source: serves the DatoCMS export (scripts/seed/data/) with
// the same API as wordpress.js, so the whole site can be developed and built
// before WordPress is installed/seeded. Enabled with USE_SEED_DATA=1.
//
// The export still carries Dato's asset shape, so records pass through the
// shared normalizer on the way out and come back looking exactly like the
// WordPress ones. Media URLs point at the Dato/Mux CDN mirror.

import { readFileSync } from "node:fs";
import path from "node:path";

import { assignAnchors, normalizeMedia } from "./normalize.js";

const DATA_DIR = path.resolve(process.cwd(), "scripts/seed/data");

const cache = {};

function readJson(file) {
  if (!(file in cache)) {
    try {
      cache[file] = normalize(
        JSON.parse(readFileSync(path.join(DATA_DIR, file), "utf8")),
      );
    } catch {
      cache[file] = null;
    }
  }
  return cache[file];
}

function normalize(records) {
  if (!Array.isArray(records)) return records;
  return records.map((record) => {
    const mapped = normalizeMedia(record);
    return mapped.content
      ? { ...mapped, content: assignAnchors(mapped.content) }
      : mapped;
  });
}

export async function getProjects() {
  return readJson("projects.json") ?? [];
}

export async function getFeaturedProjects() {
  const projects = await getProjects();
  return projects
    .filter((p) => p.featured)
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
}

export async function getProject(slug) {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function getServices() {
  const services = readJson("services.json") ?? [];
  return services.map(({ id, title, slug }) => ({ id, title, slug }));
}

export async function getService(slug) {
  const services = readJson("services.json") ?? [];
  return services.find((s) => s.slug === slug) ?? null;
}

export async function getPageByKey(key) {
  const pages = readJson("route-pages.json") ?? [];
  return pages.find((p) => p.pageKey === key) ?? null;
}

export async function getCustomPages() {
  const pages = readJson("pages.json") ?? [];
  return pages.map((p) => ({ ...p, pageKey: "custom" }));
}

export async function getCustomPage(slug) {
  const pages = await getCustomPages();
  return pages.find((p) => p.slug === slug) ?? null;
}

export async function getSiteSettings() {
  const site = readJson("site.json") ?? {};
  return {
    general: {
      siteName: site.general?.site_name ?? "",
      logo: site.general?.logo ?? null,
      logoAlt: site.general?.logo_alt ?? null,
      favicon: site.general?.favicon ?? null,
      seoTitleSuffix: site.general?.seo_title_suffix ?? "",
      seoDefaultDescription: site.general?.seo_default_description ?? "",
      seoDefaultOgImage: site.general?.seo_default_og_image ?? null,
    },
    navLinks: site.navigation?.nav_links ?? [],
    menuFooterLinks: site.navigation?.menu_footer_links ?? [],
    footer: {
      leadHead: site.footer?.footer_lead_head ?? "",
      leadBody: site.footer?.footer_lead_body ?? "",
      offices: (site.footer?.footer_offices ?? []).map((o) => ({
        city: o.city,
        address: o.address,
        phone: o.phone ?? "",
        phoneHref: o.phone_href ?? "",
      })),
      email: site.footer?.footer_email ?? "",
      phone: site.footer?.footer_phone ?? "",
      socialLinks: site.footer?.footer_social_links ?? [],
      legalItems: site.footer?.footer_legal_items ?? [],
      ctaTitle: site.footer?.footer_cta_title ?? "",
      ctaText: site.footer?.footer_cta_text ?? "",
      ctaLink: site.footer?.footer_cta_link ?? "",
    },
    randomSentences: (
      site.interfaceSettings?.random_sentences ?? []
    ).map((r) => r.text),
    cookieBanner: {
      title: site.cookieBanner?.cookie_title ?? "",
      message: site.cookieBanner?.cookie_message ?? "",
      accept: site.cookieBanner?.cookie_accept ?? "",
      reject: site.cookieBanner?.cookie_reject ?? "",
      moreLabel: site.cookieBanner?.cookie_more_label ?? "",
      privacyUrl: site.cookieBanner?.privacy_document ?? null,
    },
    notFound: {
      title: site.notFound?.not_found_title ?? "",
      ctaText: site.notFound?.not_found_cta_text ?? "",
      ctaLink: site.notFound?.not_found_cta_link ?? "",
    },
    uiStrings: Object.fromEntries(
      (site.uiStrings?.ui_strings ?? []).map((u) => [u.string_key, u.text]),
    ),
  };
}
