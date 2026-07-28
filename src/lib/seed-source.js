// Seed-JSON data source: serves the DatoCMS export (scripts/seed/data/) with
// the same API as wordpress.js, so the whole site can be developed and built
// before WordPress is installed/seeded. Enabled with USE_SEED_DATA=1.
//
// The exported JSON is already in the normalized (nine-ca/Dato) shape the
// components consume; images point at the Dato CDN.

import { readFileSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "scripts/seed/data");

const cache = {};

function readJson(file) {
  if (!(file in cache)) {
    try {
      cache[file] = JSON.parse(readFileSync(path.join(DATA_DIR, file), "utf8"));
    } catch {
      cache[file] = null;
    }
  }
  return cache[file];
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

export async function getPageByKey() {
  // Fixed routes (home/about/what-we-do/projects) had no CMS pages in Dato;
  // their content comes from site settings + hard-wired sections.
  return null;
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
    navLinks: site.navigation?.nav_links ?? [],
    menuFooterLinks: site.navigation?.menu_footer_links ?? [],
    footer: {
      offices: site.footer?.footer_offices ?? [],
      email: site.footer?.footer_email ?? "",
      phone: site.footer?.footer_phone ?? "",
      socialLinks: site.footer?.footer_social_links ?? [],
      legalItems: site.footer?.footer_legal_items ?? [],
      ctaTitle: site.footer?.footer_cta_title ?? "",
      ctaText: site.footer?.footer_cta_text ?? "",
      ctaLink: site.footer?.footer_cta_link ?? "",
    },
    home: {
      howWeDoIt: {
        title: site.homeContent?.how_we_do_it?.title ?? "",
        text: site.homeContent?.how_we_do_it?.text ?? "",
        text2: site.homeContent?.how_we_do_it?.text2 ?? "",
        cards: (site.homeContent?.how_we_do_it?.cards ?? []).map((c) => ({
          title: c.title,
          textTop: c.text_top,
          textBottom: c.text_bottom,
        })),
      },
      whatWeDo: site.homeContent?.what_we_do ?? {},
      whatWeveCreated: site.homeContent?.what_weve_created ?? {},
      randomSentences: (site.homeContent?.random_sentences ?? []).map((r) => r.text),
      showreel: null,
    },
    cookieBanner: {
      message: site.cookieBanner?.cookie_message ?? "",
      accept: site.cookieBanner?.cookie_accept ?? "",
      reject: site.cookieBanner?.cookie_reject ?? "",
    },
    uiStrings: {},
  };
}
