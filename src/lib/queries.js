// GraphQL queries for the WPGraphQL backend.
//
// Content model (mirrors nine-ca's DatoCMS models):
// - `project` CPT: projectDetails group (year, featured, cover/mobile/featured
//   media, page_blocks flexible content) + deliverable taxonomy terms.
// - `service` CPT: serviceDetails group (header + page_blocks).
// - WP Pages: pageBuilder group (pageKey + cover media + page_blocks).
// - Site-wide settings live on one options page (`siteSettings`).
// - Single-language site (NL) — no language filtering anywhere.

// One media library item. `mimeType` is what tells the front end whether to
// render an image or a video, so nothing has to be configured per field.
// `sourceUrl` resolves image sizes and is null on a video, hence mediaItemUrl.
const MEDIA = /* GraphQL */ `
  node {
    sourceUrl
    mediaItemUrl
    altText
    mimeType
    mediaDetails {
      width
      height
    }
  }
`;

/**
 * Inline fragments for every block layout of a given ACF flexible content
 * context. GraphQL type names follow wpgraphql-acf 2.x:
 *   {FieldGroup}PageBlocks{Layout}Layout, e.g.
 *   PageBuilderPageBlocksPageHeaderLayout,
 *   ProjectDetailsPageBlocksColumnRowLayout
 */
function blockFragments(prefix, blocks) {
  const defs = {
    page_header: `
      ... on ${prefix}PageHeaderLayout {
        sectionTitle
        title
        titleBottom
        paragraph
        ctaText
        ctaLink
      }
    `,
    project_header: `
      ... on ${prefix}ProjectHeaderLayout {
        sectionTitle
        bigTitle
        paragraphHeader
        paragraph
      }
    `,
    paragraph: `
      ... on ${prefix}ParagraphLayout {
        content
      }
    `,
    section_line: `
      ... on ${prefix}SectionLineLayout {
        title
      }
    `,
    scrolling_title: `
      ... on ${prefix}ScrollingTitleLayout {
        text
      }
    `,
    column_row: `
      ... on ${prefix}ColumnRowLayout {
        columns {
          columnType
          width
          mobileWidth
          media { ${MEDIA} }
          text
          align
          ctaText
          ctaUrl
          ctaIsExternal
        }
      }
    `,
    project_numbers: `
      ... on ${prefix}ProjectNumbersLayout {
        sectionTitle
        titleLeft
        titleRight
        numbers {
          number
          text
        }
      }
    `,
    accordion: `
      ... on ${prefix}AccordionLayout {
        title
        media { ${MEDIA} }
        items {
          question
          answer
        }
      }
    `,
    cta_section: `
      ... on ${prefix}CtaSectionLayout {
        title
        ctaText
        ctaLink
      }
    `,
    form_section: `
      ... on ${prefix}FormSectionLayout {
        title
        subtitle
        formName
        ctaText
        successTitle
        successMessage
        formFields {
          label
          name
          fieldType
          required
          width
          placeholder
          options
        }
      }
    `,

    // Page sections. No DatoCMS ancestor — these lift the formerly
    // hard-coded home / about / what-we-do sections into the page builder.
    home_hero: `
      ... on ${prefix}HomeHeroLayout {
        media { ${MEDIA} }
        mobileMedia { ${MEDIA} }
      }
    `,
    home_who_we_are: `
      ... on ${prefix}HomeWhoWeAreLayout {
        sectionTitle
        body
      }
    `,
    home_what_we_do: `
      ... on ${prefix}HomeWhatWeDoLayout {
        sectionTitle
        scrollingText
        intro
        services {
          label
          link
          media { ${MEDIA} }
        }
      }
    `,
    home_what_weve_created: `
      ... on ${prefix}HomeWhatWeveCreatedLayout {
        sectionTitle
        scrollingText
        intro
        listLabel
        ctaText
        ctaLink
      }
    `,
    how_we_do_it: `
      ... on ${prefix}HowWeDoItLayout {
        title
        glWord
        cards {
          title
          textTop
          textBottom
        }
      }
    `,
    home_showreel: `
      ... on ${prefix}HomeShowreelLayout {
        textTop
        textBottom
        media { ${MEDIA} }
        mobileMedia { ${MEDIA} }
      }
    `,
    link_band: `
      ... on ${prefix}LinkBandLayout {
        title
        link
      }
    `,
    service_hero: `
      ... on ${prefix}ServiceHeroLayout {
        title
        headerText
        paragraph
        ctaText
        ctaLink
      }
    `,
    about_hero: `
      ... on ${prefix}AboutHeroLayout {
        brandText
        brandMobile
      }
    `,
    about_intro: `
      ... on ${prefix}AboutIntroLayout {
        sectionTitle
        scrollingText
        lead
        ctaText
        ctaLink
        imageA { ${MEDIA} }
        imageB { ${MEDIA} }
        imageWide { ${MEDIA} }
        body
      }
    `,
    offices: `
      ... on ${prefix}OfficesLayout {
        sectionTitle
        intro
        offices {
          title
          address
          media { ${MEDIA} }
        }
      }
    `,
    expertises: `
      ... on ${prefix}ExpertisesLayout {
        sectionTitle
        heading
        body
        ctaText
        ctaLink
      }
    `,
    service_teaser: `
      ... on ${prefix}ServiceTeaserLayout {
        sectionTitle
        fullServiceName
        serviceName
        serviceNameBottom
        paragraphs {
          text
        }
        ctaText
        ctaLink
        rows {
          columns {
            width
            media { ${MEDIA} }
          }
        }
        trailingText
        trailingCtaText
        trailingCtaLink
      }
    `,
  };
  return blocks.map((name) => defs[name] ?? "").join("\n");
}

const PAGE_BLOCKS = blockFragments("PageBuilderPageBlocks", [
  "page_header",
  "project_header",
  "cta_section",
  "form_section",
  "column_row",
  "project_numbers",
  "accordion",
  "paragraph",
  "section_line",
  "scrolling_title",
  "home_hero",
  "home_who_we_are",
  "home_what_we_do",
  "home_what_weve_created",
  "how_we_do_it",
  "home_showreel",
  "link_band",
  "service_hero",
  "about_hero",
  "about_intro",
  "offices",
  "expertises",
  "service_teaser",
]);

// Per-record SEO, identical on every content type.
const SEO_FIELDS = /* GraphQL */ `
  seo {
    seoTitle
    seoDescription
    ogImage { ${MEDIA} }
    noindex
  }
`;

const PROJECT_BLOCKS = blockFragments("ProjectDetailsPageBlocks", [
  "project_header",
  "column_row",
  "project_numbers",
  "accordion",
  "paragraph",
]);

const SERVICE_BLOCKS = blockFragments("ServiceDetailsPageBlocks", [
  "section_line",
  "scrolling_title",
  "column_row",
]);

const PROJECT_FIELDS = /* GraphQL */ `
  id
  title
  slug
  featuredImage { ${MEDIA} }
  deliverables {
    nodes {
      databaseId
      name
    }
  }
  projectDetails {
    year
    featured
    featuredOrder
    cover { ${MEDIA} }
    mobileCover { ${MEDIA} }
    featuredMedia { ${MEDIA} }
  }
`;

// ── Projects ──

export const ALL_PROJECTS_QUERY = /* GraphQL */ `
  query GetProjects {
    projects(first: 100, where: { orderby: { field: DATE, order: ASC } }) {
      nodes {
        ${PROJECT_FIELDS}
      }
    }
  }
`;

export const PROJECT_QUERY = /* GraphQL */ `
  query GetProject($slug: ID!) {
    project(id: $slug, idType: SLUG) {
      ${PROJECT_FIELDS}
      ${SEO_FIELDS}
      projectDetails {
        year
        featured
        featuredOrder
        cover { ${MEDIA} }
        mobileCover { ${MEDIA} }
        featuredMedia { ${MEDIA} }
        pageBlocks {
          __typename
          ${PROJECT_BLOCKS}
        }
      }
    }
  }
`;

// ── Services ──

export const ALL_SERVICES_QUERY = /* GraphQL */ `
  query GetServices {
    services(first: 100) {
      nodes {
        id
        title
        slug
      }
    }
  }
`;

export const SERVICE_QUERY = /* GraphQL */ `
  query GetService($slug: ID!) {
    service(id: $slug, idType: SLUG) {
      id
      title
      slug
      ${SEO_FIELDS}
      serviceDetails {
        header {
          headerText
          paragraph
          ctaText
          ctaUrl
        }
        pageBlocks {
          __typename
          ${SERVICE_BLOCKS}
        }
      }
    }
  }
`;

// ── Pages ──

export const ALL_PAGES_QUERY = /* GraphQL */ `
  query GetPages {
    pages(first: 100) {
      nodes {
        id
        title
        slug
        ${SEO_FIELDS}
        pageBuilder {
          pageKey
          cover { ${MEDIA} }
          mobileCover { ${MEDIA} }
          pageBlocks {
            __typename
            ${PAGE_BLOCKS}
          }
        }
      }
    }
  }
`;

// ── Site settings ──

export const SITE_SETTINGS_QUERY = /* GraphQL */ `
  query GetSiteSettings {
    siteSettings {
      general {
        siteName
        logo { ${MEDIA} }
        logoAlt { ${MEDIA} }
        favicon { ${MEDIA} }
        seoTitleSuffix
        seoDefaultDescription
        seoDefaultOgImage { ${MEDIA} }
      }
      navigation {
        navLinks {
          label
          path
        }
        menuFooterLinks {
          label
          url
        }
      }
      footer {
        footerLeadHead
        footerLeadBody
        footerOffices {
          city
          address
          phone
          phoneHref
        }
        footerEmail
        footerPhone
        footerSocialLinks {
          label
          url
        }
        footerLegalItems {
          label
          url
        }
        footerCtaTitle
        footerCtaText
        footerCtaLink
      }
      cookieBanner {
        cookieTitle
        cookieMessage
        cookieAccept
        cookieReject
        cookieMoreLabel
        privacyDocument {
          node {
            mediaItemUrl
          }
        }
      }
      notFound {
        notFoundTitle
        notFoundCtaText
        notFoundCtaLink
      }
      uiStrings {
        uiStrings {
          stringKey
          text
        }
      }
    }
  }
`;
