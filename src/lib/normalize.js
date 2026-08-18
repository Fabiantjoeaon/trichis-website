// Shaping shared by both content sources (wordpress.js and seed-source.js), so
// components see one media shape and one anchor scheme no matter where the
// content came from.

// The block registry: ACF layout type ↔ the __typename components switch on.
// Anchors are derived from the same names, which is why it lives in one place.
const LAYOUTS = [
  ["PageHeaderLayout", "PageheaderRecord"],
  ["ProjectHeaderLayout", "ProjectheaderRecord"],
  ["ParagraphLayout", "ParagraphRecord"],
  ["SectionLineLayout", "SectionlineRecord"],
  ["ScrollingTitleLayout", "ScrollingTitleRecord"],
  ["ColumnRowLayout", "ColumnrowRecord"],
  ["ProjectNumbersLayout", "ProjectnumberRecord"],
  ["CtaSectionLayout", "CtasectionRecord"],
  ["FormSectionLayout", "FormSectionRecord"],
  ["HomeHeroLayout", "HomeheroRecord"],
  ["HomeWhoWeAreLayout", "HomewhoweareRecord"],
  ["HomeWhatWeDoLayout", "HomewhatwedoRecord"],
  ["HomeWhatWeveCreatedLayout", "HomewhatwevecreatedRecord"],
  ["HowWeDoItLayout", "HowwedoitRecord"],
  ["HomeShowreelLayout", "HomeshowreelRecord"],
  ["LinkBandLayout", "LinkbandRecord"],
  ["ServiceHeroLayout", "ServiceheroRecord"],
  ["AboutHeroLayout", "AboutheroRecord"],
  ["AboutIntroLayout", "AboutintroRecord"],
  ["OfficesLayout", "OfficesRecord"],
  ["ExpertisesLayout", "ExpertisesRecord"],
  ["ServiceTeaserLayout", "ServiceteaserRecord"],
];

const kebab = (pascal) =>
  pascal
    .replace(/Layout$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

export const LAYOUT_TO_TYPENAME = Object.fromEntries(LAYOUTS);

const RECORD_TO_ANCHOR = Object.fromEntries(
  LAYOUTS.map(([layout, record]) => [record, kebab(layout)]),
);

/**
 * Give every block on a page a stable id to link to. Derived from the block
 * type rather than its copy, so an editor rewriting a heading cannot silently
 * break an existing #link. Repeats of the same type are numbered.
 */
export function assignAnchors(blocks) {
  const seen = new Map();
  return blocks.map((block) => {
    const base = RECORD_TO_ANCHOR[block.__typename] ?? "section";
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return { ...block, anchorId: count === 1 ? base : `${base}-${count}` };
  });
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|m3u8)(\?|$)/i;

export function isVideoMedia(mimeType, url = "") {
  if (mimeType) return mimeType.startsWith("video/");
  return VIDEO_EXT.test(url);
}

/**
 * Seed JSON is a DatoCMS export, where a video is an image record carrying Mux
 * metadata. WordPress has no such split — an attachment is simply a video —
 * so the export is flattened to match rather than the other way round.
 */
export function normalizeAsset(asset) {
  if (!asset) return null;
  const video = asset.video ?? null;
  const url = video?.mp4Url || video?.streamingUrl || asset.url || null;
  if (!url) return null;
  return {
    url,
    alt: asset.alt || null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    isVideo: !!video || isVideoMedia(asset.mimeType, url),
  };
}

const MEDIA_KEYS = new Set([
  "coverImage",
  "mobileCoverImage",
  "featuredImage",
  "image",
  "media",
  "mobileMedia",
  "imageA",
  "imageB",
  "imageWide",
]);

/** Walk a seed record and flatten every media field it contains. */
export function normalizeMedia(value) {
  if (Array.isArray(value)) return value.map(normalizeMedia);
  if (!value || typeof value !== "object") return value;

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = MEDIA_KEYS.has(key) ? normalizeAsset(val) : normalizeMedia(val);
  }
  return out;
}
