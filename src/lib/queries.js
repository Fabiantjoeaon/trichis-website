// GraphQL queries for the WPGraphQL backend.
//
// Content model (mirrors nine-ca's DatoCMS models):
// - `project` CPT: projectDetails group (year, featured, cover/mobile/featured
//   media, page_blocks flexible content) + deliverable taxonomy terms.
// - `service` CPT: serviceDetails group (header + page_blocks).
// - WP Pages: pageBuilder group (pageKey + cover media + page_blocks).
// - Site-wide settings live on one options page (`siteSettings`).
// - Single-language site (NL) — no language filtering anywhere.

const IMG = /* GraphQL */ `
  node {
    sourceUrl
    altText
    mediaDetails {
      width
      height
    }
  }
`;

// The trichis media group: image attachment + Mux video metadata.
const MEDIA = /* GraphQL */ `
  image { ${IMG} }
  videoStreamingUrl
  videoMuxPlaybackId
  videoMp4Url
  videoThumbnailUrl
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
        titleLeft
        titleRight
        numbers {
          number
          text
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
  };
  return blocks.map((name) => defs[name]).join("\n");
}

const PAGE_BLOCKS = blockFragments("PageBuilderPageBlocks", [
  "page_header",
  "project_header",
  "cta_section",
  "form_section",
  "column_row",
  "project_numbers",
  "paragraph",
  "section_line",
  "scrolling_title",
]);

const PROJECT_BLOCKS = blockFragments("ProjectDetailsPageBlocks", [
  "project_header",
  "column_row",
  "project_numbers",
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
        footerOffices {
          city
          address
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
      homeContent {
        howWeDoIt {
          title
          text
          text2
          cards {
            title
            textTop
            textBottom
          }
        }
        whatWeDo {
          title
          text
          text2
        }
        whatWeveCreated {
          title
          text
          text2
        }
        randomSentences {
          text
        }
        showreel { ${MEDIA} }
      }
      cookieBanner {
        cookieMessage
        cookieAccept
        cookieReject
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
