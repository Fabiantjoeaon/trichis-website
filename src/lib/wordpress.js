// WordPress data source: fetches via WPGraphQL and maps everything into the
// normalized content shape used by the components.
//
// The normalized shape intentionally matches nine-ca's DatoCMS responses
// (same __typename discriminators, same field names) so components ported
// from nine-ca consume data unchanged, and the seed-JSON fallback
// (seed-source.js) can pass Dato exports through untouched.

import { gqlFetch } from "./graphql.js";
import {
  ALL_PAGES_QUERY,
  ALL_PROJECTS_QUERY,
  ALL_SERVICES_QUERY,
  PROJECT_QUERY,
  SERVICE_QUERY,
  SITE_SETTINGS_QUERY,
} from "./queries.js";

// ── media ──────────────────────────────────────────────────────────────

function mapMedia(media) {
  if (!media) return null;
  const node = media.image?.node;
  const hasVideo = media.videoStreamingUrl || media.videoMuxPlaybackId;
  if (!node && !hasVideo) return null;
  return {
    url: node?.sourceUrl ?? media.videoThumbnailUrl ?? null,
    alt: node?.altText ?? null,
    width: node?.mediaDetails?.width ?? null,
    height: node?.mediaDetails?.height ?? null,
    video: hasVideo
      ? {
          streamingUrl: media.videoStreamingUrl || null,
          muxPlaybackId: media.videoMuxPlaybackId || null,
          mp4Url: media.videoMp4Url || null,
          thumbnailUrl: media.videoThumbnailUrl || null,
        }
      : null,
  };
}

// ── blocks ─────────────────────────────────────────────────────────────

const LAYOUT_TO_TYPENAME = {
  PageHeaderLayout: "PageheaderRecord",
  ProjectHeaderLayout: "ProjectheaderRecord",
  ParagraphLayout: "ParagraphRecord",
  SectionLineLayout: "SectionlineRecord",
  ScrollingTitleLayout: "ScrollingTitleRecord",
  ColumnRowLayout: "ColumnrowRecord",
  ProjectNumbersLayout: "ProjectnumberRecord",
  CtaSectionLayout: "CtasectionRecord",
  FormSectionLayout: "FormSectionRecord",
};

function layoutName(gqlTypename) {
  for (const suffix of Object.keys(LAYOUT_TO_TYPENAME)) {
    if (gqlTypename?.endsWith(suffix)) return suffix;
  }
  return null;
}

function mapColumn(col) {
  const type = col.columnType;
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
      align: col.align,
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

export function mapBlocks(blocks) {
  const result = [];
  for (const block of blocks ?? []) {
    const layout = layoutName(block.__typename);
    if (!layout) continue;
    const typename = LAYOUT_TO_TYPENAME[layout];

    switch (typename) {
      case "PageheaderRecord":
        result.push({
          __typename: typename,
          sectionTitle: block.sectionTitle,
          title: block.title,
          titleBottom: block.titleBottom,
          paragraph: block.paragraph,
          ctaText: block.ctaText,
          ctaLink: block.ctaLink,
        });
        break;
      case "ProjectheaderRecord":
        result.push({
          __typename: typename,
          sectionTitle: block.sectionTitle,
          bigTitle: block.bigTitle,
          paragraphHeader: block.paragraphHeader,
          paragraph: block.paragraph,
        });
        break;
      case "ParagraphRecord":
        result.push({ __typename: typename, content: block.content });
        break;
      case "SectionlineRecord":
        result.push({ __typename: typename, title: block.title });
        break;
      case "ScrollingTitleRecord":
        result.push({ __typename: typename, text: block.text });
        break;
      case "ColumnrowRecord":
        result.push({
          __typename: typename,
          columns: (block.columns ?? []).map(mapColumn),
        });
        break;
      case "ProjectnumberRecord":
        result.push({
          __typename: typename,
          titleLeft: block.titleLeft,
          titleRight: block.titleRight,
          numbers: (block.numbers ?? []).map((n) => ({
            number: n.number,
            text: n.text,
          })),
        });
        break;
      case "CtasectionRecord":
        result.push({
          __typename: typename,
          title: block.title,
          ctaText: block.ctaText,
          ctaLink: block.ctaLink,
        });
        break;
      case "FormSectionRecord":
        result.push({
          __typename: typename,
          title: block.title,
          subtitle: block.subtitle,
          formName: block.formName,
          ctaText: block.ctaText,
          successTitle: block.successTitle,
          successMessage: block.successMessage,
          formFields: (block.formFields ?? []).map((f) => ({
            label: f.label,
            name: f.name,
            fieldType: f.fieldType,
            required: !!f.required,
            options: f.options,
            placeholder: f.placeholder,
            width: f.width,
          })),
        });
        break;
    }
  }
  return result;
}

// ── entities ───────────────────────────────────────────────────────────

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
    pageKey: b.pageKey ?? "custom",
    coverImage: mapMedia(b.cover),
    mobileCoverImage: mapMedia(b.mobileCover),
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
    navLinks: s.navigation?.navLinks ?? [],
    menuFooterLinks: s.navigation?.menuFooterLinks ?? [],
    footer: {
      offices: s.footer?.footerOffices ?? [],
      email: s.footer?.footerEmail ?? "",
      phone: s.footer?.footerPhone ?? "",
      socialLinks: s.footer?.footerSocialLinks ?? [],
      legalItems: s.footer?.footerLegalItems ?? [],
      ctaTitle: s.footer?.footerCtaTitle ?? "",
      ctaText: s.footer?.footerCtaText ?? "",
      ctaLink: s.footer?.footerCtaLink ?? "",
    },
    home: {
      howWeDoIt: {
        title: s.homeContent?.howWeDoIt?.title ?? "",
        text: s.homeContent?.howWeDoIt?.text ?? "",
        text2: s.homeContent?.howWeDoIt?.text2 ?? "",
        cards: (s.homeContent?.howWeDoIt?.cards ?? []).map((c) => ({
          title: c.title,
          textTop: c.textTop,
          textBottom: c.textBottom,
        })),
      },
      whatWeDo: s.homeContent?.whatWeDo ?? {},
      whatWeveCreated: s.homeContent?.whatWeveCreated ?? {},
      randomSentences: (s.homeContent?.randomSentences ?? []).map((r) => r.text),
      showreel: mapMedia(s.homeContent?.showreel),
    },
    cookieBanner: {
      message: s.cookieBanner?.cookieMessage ?? "",
      accept: s.cookieBanner?.cookieAccept ?? "",
      reject: s.cookieBanner?.cookieReject ?? "",
    },
    uiStrings: Object.fromEntries(
      (s.uiStrings?.uiStrings ?? []).map((u) => [u.stringKey, u.text]),
    ),
  };
}
