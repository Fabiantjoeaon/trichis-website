/**
 * Export all nine-ca content from DatoCMS to JSON + downloaded image assets.
 *
 * Usage: pnpm seed:export   (needs DATOCMS_READ_ONLY_API_TOKEN in .env)
 *
 * Output (scripts/seed/data/):
 *   projects.json  — all projects incl. modular content blocks
 *   pages.json     — all CMS pages incl. modular content blocks
 *   services.json  — all services incl. header + content blocks
 *   site.json      — site chrome content that was hard-coded in nine-ca
 *                    (nav, footer, how-we-do-it cards, loader sentences, …)
 *   assets/…       — downloaded images (Dato CDN originals)
 *   assets-manifest.json — remote URL → local file + metadata
 *
 * Mux video fields (streamingUrl / muxPlaybackId / mp4Url / thumbnailUrl) are
 * kept as remote URLs: the WP seeder stores them in text fields so the site
 * keeps using the exact same video streaming.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DATA_DIR = path.join(__dirname, "data");
const ASSETS_DIR = path.join(DATA_DIR, "assets");

// ── env ──────────────────────────────────────────────────────────────────

async function loadEnv() {
  try {
    const raw = await readFile(path.join(ROOT, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  } catch {
    // .env optional when the token is already in the environment
  }
}

// ── DatoCMS GraphQL ──────────────────────────────────────────────────────

async function dato(query, variables = {}) {
  const res = await fetch("https://graphql.datocms.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DATOCMS_READ_ONLY_API_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`DatoCMS HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) {
    throw new Error(`DatoCMS errors:\n${json.errors.map((e) => e.message).join("\n")}`);
  }
  return json.data;
}

const IMAGE_FIELDS = `
  width
  height
  url
  alt
  video {
    streamingUrl
    muxPlaybackId
    mp4Url
    thumbnailUrl
  }
`;

// Fragment sets differ per model: DatoCMS only allows fragments for record
// types actually configured on that model's modular content field. These
// mirror nine-ca's PROJECT_QUERY / PAGE_QUERY / SERVICE_QUERY exactly.

const PROJECT_HEADER_FRAGMENT = `
  ... on ProjectheaderRecord {
    __typename
    paragraph(markdown: false)
    paragraphHeader
    bigTitle
    sectionTitle
  }
`;

const PROJECT_NUMBERS_FRAGMENT = `
  ... on ProjectnumberRecord {
    __typename
    numbers { number text }
    titleLeft
    titleRight
  }
`;

const PARAGRAPH_FRAGMENT = `
  ... on ParagraphRecord {
    __typename
    content(markdown: false)
  }
`;

const COLUMN_ROW_FRAGMENT = `
  ... on ColumnrowRecord {
    __typename
    columns {
      ... on ImagecolumnRecord {
        __typename
        image { ${IMAGE_FIELDS} }
        width
        mobileWidth
      }
      ... on EmptycolumnRecord {
        __typename
        width
        mobileWidth
      }
      ... on TextcolumnRecord {
        __typename
        width
        mobileWidth
        text(markdown: false)
      }
    }
  }
`;

const COLUMN_ROW_WITH_CTA_FRAGMENT = `
  ... on ColumnrowRecord {
    __typename
    columns {
      ... on ImagecolumnRecord {
        __typename
        image { ${IMAGE_FIELDS} }
        width
        mobileWidth
      }
      ... on EmptycolumnRecord {
        __typename
        width
        mobileWidth
      }
      ... on TextcolumnRecord {
        __typename
        width
        mobileWidth
        text(markdown: false)
        align
        cta {
          text
          url
          isExternal
        }
      }
    }
  }
`;

const PROJECT_CONTENT_FRAGMENTS = `
  ${PROJECT_HEADER_FRAGMENT}
  ${COLUMN_ROW_FRAGMENT}
  ${PROJECT_NUMBERS_FRAGMENT}
  ${PARAGRAPH_FRAGMENT}
`;

const PAGE_CONTENT_FRAGMENTS = `
  ${PROJECT_HEADER_FRAGMENT}
  ... on PageheaderRecord {
    __typename
    sectionTitle
    title
    titleBottom
    paragraph(markdown: true)
    ctaText
    ctaLink
  }
  ... on CtasectionRecord {
    __typename
    title(markdown: true)
    ctaText
    ctaLink
  }
  ... on FormSectionRecord {
    __typename
    title(markdown: true)
    subtitle
    ctaText
    successTitle
    successMessage(markdown: true)
    formName
    formFields {
      label
      name
      fieldType
      required
      options
      placeholder
      width
    }
  }
  ${COLUMN_ROW_FRAGMENT}
  ${PROJECT_NUMBERS_FRAGMENT}
  ${PARAGRAPH_FRAGMENT}
`;

const SERVICE_CONTENT_FRAGMENTS = `
  ... on SectionlineRecord {
    __typename
    title
  }
  ... on ScrollingTitleRecord {
    __typename
    text
  }
  ${COLUMN_ROW_WITH_CTA_FRAGMENT}
`;

const ALL_PROJECTS_QUERY = `
{
  allProjects(first: 100, orderBy: [id_ASC]) {
    id
    title
    slug
    year
    featured
    featuredOrder
    deliverables { id title }
    coverImage { ${IMAGE_FIELDS} }
    mobileCoverImage { ${IMAGE_FIELDS} }
    featuredImage { ${IMAGE_FIELDS} }
    content { ${PROJECT_CONTENT_FRAGMENTS} }
  }
}
`;

const ALL_PAGES_QUERY = `
{
  allPages(first: 100) {
    id
    title
    slug
    coverImage { ${IMAGE_FIELDS} }
    mobileCoverImage { ${IMAGE_FIELDS} }
    content { ${PAGE_CONTENT_FRAGMENTS} }
  }
}
`;

const ALL_SERVICES_QUERY = `
{
  allServices(first: 100) {
    id
    slug
    title
    header {
      headertext
      paragraph
      cta { text url }
    }
    content { ${SERVICE_CONTENT_FRAGMENTS} }
  }
}
`;

// ── asset download ───────────────────────────────────────────────────────

const manifest = {};

function collectImageUrls(node, urls = new Set()) {
  if (!node || typeof node !== "object") return urls;
  if (Array.isArray(node)) {
    node.forEach((n) => collectImageUrls(n, urls));
    return urls;
  }
  // Dato image assets have an absolute CDN url + width/height; videos are
  // kept remote and CTA objects (url without dimensions) are links, not media.
  if (
    typeof node.url === "string" &&
    /^https?:\/\//.test(node.url) &&
    (node.width != null || node.height != null || node.url.includes("datocms-assets")) &&
    !node.video?.streamingUrl
  ) {
    urls.add(node.url);
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") collectImageUrls(value, urls);
  }
  return urls;
}

async function downloadAsset(url) {
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 10);
  const base = path.basename(new URL(url).pathname) || "asset";
  const filename = `${hash}-${base}`;
  const dest = path.join(ASSETS_DIR, filename);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ! failed to download ${url} (HTTP ${res.status})`);
      return;
    }
    await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
    manifest[url] = { file: `assets/${filename}` };
    console.log(`  ↓ ${filename}`);
  } catch (err) {
    console.warn(`  ! failed to download ${url}: ${err.message}`);
  }
}

// ── site chrome content (hard-coded in nine-ca, moved to Site Settings) ──

const SITE_CONTENT = {
  navigation: {
    nav_links: [
      { label: "Home", path: "/" },
      { label: "About us", path: "/about-us" },
      { label: "Projects", path: "/projects" },
      { label: "What we do", path: "/what-we-do" },
    ],
    menu_footer_links: [
      { label: "+31765156463", url: "tel:+31765156463" },
      { label: "cu@nine.nl", url: "mailto:cu@nine.nl" },
      { label: "LinkedIn", url: "https://www.linkedin.com/company/nine-nl/" },
      { label: "Instagram", url: "https://www.instagram.com/ninecreativeagency/" },
      { label: "Vimeo", url: "https://vimeo.com/nine" },
    ],
  },
  footer: {
    footer_offices: [
      { city: "Breda", address: "Willemstraat 16\n4811 AL Breda\nThe Netherlands" },
      { city: "Rotterdam", address: "Goudsesingel 194\n3011 KD Rotterdam\nThe Netherlands" },
    ],
    footer_email: "cu@nine.nl",
    footer_phone: "+31765156463",
    footer_social_links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/company/938792/admin/dashboard/" },
      { label: "Instagram", url: "https://www.instagram.com/ninecreativeagency/" },
      { label: "Vimeo", url: "https://vimeo.com/ninefilms" },
    ],
    footer_legal_items: [
      { label: "Algemene voorwaarden", url: "/files/algemene-voorwaarden.pdf" },
      { label: "Privacy", url: "/files/privacy-beleid.pdf" },
    ],
    footer_cta_title: "Let's get in touch",
    footer_cta_text: "Contact us",
    footer_cta_link: "mailto:cu@nine.nl",
  },
  homeContent: {
    how_we_do_it: {
      title: "How we do it",
      text: "We are a design studio that reinvents reality for a smart and cultured future.",
      text2:
        "With design, voice and forward thinking ideas, we create worlds for brands we love.",
      cards: [
        {
          title: "Identity",
          text_top:
            "Mensen moeten in 1 sec. weten dat het om jouw merk gaat. Maar hoe blijf je onderscheidend, met zoveel indrukken? Met een sterke en heldere identiteit.",
          text_bottom:
            "Dus zoeken wij naar de kern, de stickiness van jouw merk. We maken het onmiskenbaar jou en zorgen dat het blijft plakken.",
        },
        {
          title: "Impact",
          text_top:
            "Impact maken betekent zelf de toekomst vormgeven. Als creatief bureau staan wij middenin de samenleving. ",
          text_bottom:
            "Wij weten precies wat er speelt, zien veranderingen al vroeg en anticiperen op wat komen gaat. Zo zorgen wij ervoor dat jouw merk de koers niet volgt, maar bepaalt.",
        },
        {
          title: "Reach",
          text_top:
            "In een wereld vol ruis wil je niet hoeven schreeuwen om een punt te maken. Wij helpen je om de juiste mensen te bereiken",
          text_bottom:
            "Samen met onze partners creëren we de perfecte balans tussen impact, frequentie en bereik. Zodat jij je merk kan laten spreken.",
        },
        {
          title: "Result",
          text_top:
            "We streven vaak naar hetzelfde: groei, succes en bereik. We nemen verschillende routes, maar bewegen in dezelfde richting. Alleen, hoe maak je dan nog het verschil?",
          text_bottom:
            "Wij zorgen ervoor dat jouw merk niet alleen doet wat het belooft, maar dat elke stap gericht is op concrete resultaten die je ziet en voelt. ",
        },
      ],
    },
    what_we_do: {
      title: "What we do",
      text: "You already look great, let us make you look fantastic!",
      text2:
        "We live for great design, making you look good is our life's mission. If clothes.",
    },
    what_weve_created: {
      title: "What we've created",
      text: "Take a look at our track record",
      text2:
        "Nine is an independent design studio that reinvents reality for a smart and cultured future. With design, voice and forward thinking ideas, we create worlds for brands we love.",
    },
  },
  cookieBanner: {
    cookie_message:
      "Deze website maakt gebruik van cookies.\nWe gebruiken cookies om uw ervaring te verbeteren, gepersonaliseerde advertenties of inhoud weer te geven en ons verkeer te analyseren.",
    cookie_accept: "Alles accepteren",
    cookie_reject: "Alles weigeren",
  },
};

// ── main ─────────────────────────────────────────────────────────────────

async function main() {
  await loadEnv();

  if (!process.env.DATOCMS_READ_ONLY_API_TOKEN) {
    console.error("DATOCMS_READ_ONLY_API_TOKEN missing (set it in .env)");
    process.exit(1);
  }

  await mkdir(ASSETS_DIR, { recursive: true });

  console.log("Fetching projects…");
  const { allProjects } = await dato(ALL_PROJECTS_QUERY);
  console.log(`  ${allProjects.length} projects`);

  console.log("Fetching pages…");
  const { allPages } = await dato(ALL_PAGES_QUERY);
  console.log(`  ${allPages.length} pages`);

  console.log("Fetching services…");
  const { allServices } = await dato(ALL_SERVICES_QUERY);
  console.log(`  ${allServices.length} services`);

  const urls = new Set();
  collectImageUrls(allProjects, urls);
  collectImageUrls(allPages, urls);
  collectImageUrls(allServices, urls);

  console.log(`Downloading ${urls.size} image assets…`);
  for (const url of urls) {
    await downloadAsset(url);
  }

  await writeFile(path.join(DATA_DIR, "projects.json"), JSON.stringify(allProjects, null, 2));
  await writeFile(path.join(DATA_DIR, "pages.json"), JSON.stringify(allPages, null, 2));
  await writeFile(path.join(DATA_DIR, "services.json"), JSON.stringify(allServices, null, 2));
  await writeFile(path.join(DATA_DIR, "site.json"), JSON.stringify(SITE_CONTENT, null, 2));
  await writeFile(
    path.join(DATA_DIR, "assets-manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log("Done. Data written to scripts/seed/data/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
