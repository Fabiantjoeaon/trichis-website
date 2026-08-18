// WordPress data source: fetches via WPGraphQL and maps everything into the
// normalized content shape used by the components.
//
// The normalized shape intentionally matches nine-ca's DatoCMS responses
// (same __typename discriminators, same field names) so components ported
// from nine-ca consume data unchanged, and the seed-JSON fallback
// (seed-source.js) can pass Dato exports through untouched.

import { gqlFetch } from "./graphql.js";
import { LAYOUT_TO_TYPENAME, assignAnchors, isVideoMedia } from "./normalize.js";
import {
  ALL_PAGES_QUERY,
  ALL_PROJECTS_QUERY,
  ALL_SERVICES_QUERY,
  PROJECT_QUERY,
  SERVICE_QUERY,
  SITE_SETTINGS_QUERY,
} from "./queries.js";

// wpgraphql-acf types every `select` as a list, even when the field is
// single-value, so choice fields arrive as ["image"] rather than "image".
function choice(value) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

// ── media ──────────────────────────────────────────────────────────────

function mapMedia(media) {
  const node = media?.node;
  const url = node?.sourceUrl || node?.mediaItemUrl;
  if (!url) return null;
  return {
    url,
    alt: node.altText || null,
    width: node.mediaDetails?.width ?? null,
    height: node.mediaDetails?.height ?? null,
    isVideo: isVideoMedia(node.mimeType, url),
  };
}

// ── blocks ─────────────────────────────────────────────────────────────

function layoutName(gqlTypename) {
  for (const suffix of Object.keys(LAYOUT_TO_TYPENAME)) {
    if (gqlTypename?.endsWith(suffix)) return suffix;
  }
  return null;
}

function mapColumn(col) {
  const type = choice(col.columnType);
  if (type === "image") {
    return {
      __typename: "ImagecolumnRecord",
      image: mapMedia(col.media),
      width: col.width,
      mobileWidth: col.mobileWidth,
    };
  }
  if (type === "text") {
    return {
      __typename: "TextcolumnRecord",
      width: col.width,
      mobileWidth: col.mobileWidth,
      text: col.text,
      align: choice(col.align),
      cta: col.ctaText
        ? { text: col.ctaText, url: col.ctaUrl, isExternal: !!col.ctaIsExternal }
        : null,
    };
  }
  return {
    __typename: "EmptycolumnRecord",
    width: col.width,
    mobileWidth: col.mobileWidth,
  };
}

function mapBlock(typename, block) {
  switch (typename) {
    case "PageheaderRecord":
      return {
        sectionTitle: block.sectionTitle,
        title: block.title,
        titleBottom: block.titleBottom,
        paragraph: block.paragraph,
        ctaText: block.ctaText,
        ctaLink: block.ctaLink,
      };
    case "ProjectheaderRecord":
      return {
        sectionTitle: block.sectionTitle,
        bigTitle: block.bigTitle,
        paragraphHeader: block.paragraphHeader,
        paragraph: block.paragraph,
      };
    case "ParagraphRecord":
      return { content: block.content };
    case "SectionlineRecord":
      return { title: block.title };
    case "ScrollingTitleRecord":
      return { text: block.text };
    case "ColumnrowRecord":
      return { columns: (block.columns ?? []).map(mapColumn) };
    case "ProjectnumberRecord":
      return {
        sectionTitle: block.sectionTitle,
        titleLeft: block.titleLeft,
        titleRight: block.titleRight,
        numbers: (block.numbers ?? []).map((n) => ({
          number: n.number,
          text: n.text,
        })),
      };
    case "CtasectionRecord":
      return {
        title: block.title,
        ctaText: block.ctaText,
        ctaLink: block.ctaLink,
      };
    case "FormSectionRecord":
      return {
        title: block.title,
        subtitle: block.subtitle,
        formName: block.formName,
        ctaText: block.ctaText,
        successTitle: block.successTitle,
        successMessage: block.successMessage,
        formFields: (block.formFields ?? []).map((f) => ({
          label: f.label,
          name: f.name,
          fieldType: choice(f.fieldType),
          required: !!f.required,
          options: f.options,
          placeholder: f.placeholder,
          width: choice(f.width),
        })),
      };

    // ── page sections ──
    case "HomeheroRecord":
      return {
        media: mapMedia(block.media),
        mobileMedia: mapMedia(block.mobileMedia),
      };
    case "HomewhoweareRecord":
      return { sectionTitle: block.sectionTitle, body: block.body };
    case "HomewhatwedoRecord":
      return {
        sectionTitle: block.sectionTitle,
        scrollingText: block.scrollingText,
        intro: block.intro,
        services: (block.services ?? []).map((s) => ({
          label: s.label,
          link: s.link,
          media: mapMedia(s.media),
        })),
      };
    case "HomewhatwevecreatedRecord":
      return {
        sectionTitle: block.sectionTitle,
        scrollingText: block.scrollingText,
        intro: block.intro,
        listLabel: block.listLabel,
        ctaText: block.ctaText,
        ctaLink: block.ctaLink,
      };
    case "HowwedoitRecord":
      return {
        title: block.title,
        glWord: block.glWord,
        cards: (block.cards ?? []).map((c) => ({
          title: c.title,
          textTop: c.textTop,
          textBottom: c.textBottom,
        })),
      };
    case "HomeshowreelRecord":
      return {
        textTop: block.textTop,
        textBottom: block.textBottom,
        media: mapMedia(block.media),
        mobileMedia: mapMedia(block.mobileMedia),
      };
    case "LinkbandRecord":
      return { title: block.title, link: block.link };
    case "ServiceheroRecord":
      return {
        title: block.title,
        headerText: block.headerText,
        paragraph: block.paragraph,
        ctaText: block.ctaText,
        ctaLink: block.ctaLink,
      };
    case "AboutheroRecord":
      return { brandText: block.brandText, brandMobile: block.brandMobile };
    case "AboutintroRecord":
      return {
        sectionTitle: block.sectionTitle,
        scrollingText: block.scrollingText,
        lead: block.lead,
        ctaText: block.ctaText,
        ctaLink: block.ctaLink,
        imageA: mapMedia(block.imageA),
        imageB: mapMedia(block.imageB),
        imageWide: mapMedia(block.imageWide),
        body: block.body,
      };
    case "OfficesRecord":
      return {
        sectionTitle: block.sectionTitle,
        intro: block.intro,
        offices: (block.offices ?? []).map((o) => ({
          title: o.title,
          address: o.address,
          media: mapMedia(o.media),
        })),
      };
    case "ExpertisesRecord":
      return {
        sectionTitle: block.sectionTitle,
        heading: block.heading,
        body: block.body,
        ctaText: block.ctaText,
        ctaLink: block.ctaLink,
      };
    case "ServiceteaserRecord":
      return {
        sectionTitle: block.sectionTitle,
        fullServiceName: block.fullServiceName,
        serviceName: block.serviceName,
        serviceNameBottom: block.serviceNameBottom,
        paragraphs: (block.paragraphs ?? []).map((p) => p.text),
        ctaText: block.ctaText,
        ctaLink: block.ctaLink,
        rows: (block.rows ?? []).map((row) => ({
          columns: (row.columns ?? []).map((c) => ({
            width: c.width,
            media: mapMedia(c.media),
          })),
        })),
        trailingText: block.trailingText,
        trailingCtaText: block.trailingCtaText,
        trailingCtaLink: block.trailingCtaLink,
      };
    default:
      return null;
  }
}

export function mapBlocks(blocks) {
  const result = [];
  for (const block of blocks ?? []) {
    const layout = layoutName(block.__typename);
    if (!layout) continue;
    const typename = LAYOUT_TO_TYPENAME[layout];
    const mapped = mapBlock(typename, block);
    if (!mapped) continue;
    result.push({ __typename: typename, ...mapped });
  }
  return assignAnchors(result);
}

// ── entities ───────────────────────────────────────────────────────────

function mapSeo(seo) {
  if (!seo) return null;
  return {
    title: seo.seoTitle || null,
    description: seo.seoDescription || null,
    ogImage: seo.ogImage?.node?.sourceUrl || null,
    noindex: !!seo.noindex,
  };
}

function mapProject(node) {
  if (!node) return null;
  const d = node.projectDetails ?? {};
  return {
    id: node.id,
    title: node.title,
    slug: node.slug,
    year: d.year,
    featured: !!d.featured,
    featuredOrder: d.featuredOrder,
    deliverables: (node.deliverables?.nodes ?? []).map((t) => ({
      id: t.databaseId,
      title: t.name,
    })),
    coverImage: mapMedia(d.cover),
    mobileCoverImage: mapMedia(d.mobileCover),
    featuredImage: mapMedia(d.featuredMedia),
    seo: mapSeo(node.seo),
    content: mapBlocks(d.pageBlocks),
  };
}

function mapService(node) {
  if (!node) return null;
  const d = node.serviceDetails ?? {};
  return {
    id: node.id,
    title: node.title,
    slug: node.slug,
    header: d.header
      ? {
          headertext: d.header.headerText,
          paragraph: d.header.paragraph,
          cta: d.header.ctaText
            ? { text: d.header.ctaText, url: d.header.ctaUrl }
            : null,
        }
      : null,
    seo: mapSeo(node.seo),
    content: mapBlocks(d.pageBlocks),
  };
}

function mapPage(node) {
  if (!node) return null;
  const b = node.pageBuilder ?? {};
  return {
    id: node.id,
    title: node.title,
    slug: node.slug,
    pageKey: choice(b.pageKey) ?? "custom",
    coverImage: mapMedia(b.cover),
    mobileCoverImage: mapMedia(b.mobileCover),
    seo: mapSeo(node.seo),
    content: mapBlocks(b.pageBlocks),
  };
}

// ── public API ─────────────────────────────────────────────────────────

export async function getProjects() {
  const data = await gqlFetch(ALL_PROJECTS_QUERY);
  return (data.projects?.nodes ?? []).map(mapProject);
}

export async function getFeaturedProjects() {
  const projects = await getProjects();
  return projects
    .filter((p) => p.featured)
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
}

export async function getProject(slug) {
  const data = await gqlFetch(PROJECT_QUERY, { slug });
  return mapProject(data.project);
}

export async function getServices() {
  const data = await gqlFetch(ALL_SERVICES_QUERY);
  return data.services?.nodes ?? [];
}

export async function getService(slug) {
  const data = await gqlFetch(SERVICE_QUERY, { slug });
  return mapService(data.service);
}

async function getAllPages() {
  const data = await gqlFetch(ALL_PAGES_QUERY);
  return (data.pages?.nodes ?? []).map(mapPage);
}

export async function getPageByKey(key) {
  const pages = await getAllPages();
  return pages.find((p) => p.pageKey === key) ?? null;
}

export async function getCustomPages() {
  const pages = await getAllPages();
  return pages.filter((p) => p.pageKey === "custom");
}

export async function getCustomPage(slug) {
  const pages = await getCustomPages();
  return pages.find((p) => p.slug === slug) ?? null;
}

export async function getSiteSettings() {
  const data = await gqlFetch(SITE_SETTINGS_QUERY);
  const s = data.siteSettings ?? {};
  return {
    general: {
      siteName: s.general?.siteName ?? "",
      logo: s.general?.logo?.node?.sourceUrl ?? null,
      logoAlt: s.general?.logoAlt?.node?.sourceUrl ?? null,
      favicon: s.general?.favicon?.node?.sourceUrl ?? null,
      seoTitleSuffix: s.general?.seoTitleSuffix ?? "",
      seoDefaultDescription: s.general?.seoDefaultDescription ?? "",
      seoDefaultOgImage: s.general?.seoDefaultOgImage?.node?.sourceUrl ?? null,
    },
    navLinks: s.navigation?.navLinks ?? [],
    menuFooterLinks: s.navigation?.menuFooterLinks ?? [],
    footer: {
      leadHead: s.footer?.footerLeadHead ?? "",
      leadBody: s.footer?.footerLeadBody ?? "",
      offices: s.footer?.footerOffices ?? [],
      email: s.footer?.footerEmail ?? "",
      phone: s.footer?.footerPhone ?? "",
      socialLinks: s.footer?.footerSocialLinks ?? [],
      legalItems: s.footer?.footerLegalItems ?? [],
      ctaTitle: s.footer?.footerCtaTitle ?? "",
      ctaText: s.footer?.footerCtaText ?? "",
      ctaLink: s.footer?.footerCtaLink ?? "",
    },
    randomSentences: (s.interfaceSettings?.randomSentences ?? []).map(
      (r) => r.text,
    ),
    cookieBanner: {
      title: s.cookieBanner?.cookieTitle ?? "",
      message: s.cookieBanner?.cookieMessage ?? "",
      accept: s.cookieBanner?.cookieAccept ?? "",
      reject: s.cookieBanner?.cookieReject ?? "",
      moreLabel: s.cookieBanner?.cookieMoreLabel ?? "",
      privacyUrl: s.cookieBanner?.privacyDocument?.node?.mediaItemUrl ?? null,
    },
    notFound: {
      title: s.notFound?.notFoundTitle ?? "",
      ctaText: s.notFound?.notFoundCtaText ?? "",
      ctaLink: s.notFound?.notFoundCtaLink ?? "",
    },
    uiStrings: Object.fromEntries(
      (s.uiStrings?.uiStrings ?? []).map((u) => [u.stringKey, u.text]),
    ),
  };
}
