// Content facade: picks the data source at build time.
//
//   USE_SEED_DATA=1 → seed-source.js (the DatoCMS export in scripts/seed/data)
//   otherwise       → wordpress.js   (live WPGraphQL)
//
// Both expose the same API and return the same normalized shapes, so pages
// and components never know which backend they're talking to.

import * as seed from "./seed-source.js";
import * as wp from "./wordpress.js";

const useSeed = String(import.meta.env.USE_SEED_DATA ?? "") === "1";

const source = useSeed ? seed : wp;

export const {
  getProjects,
  getFeaturedProjects,
  getProject,
  getServices,
  getService,
  getPageByKey,
  getCustomPages,
  getCustomPage,
  getSiteSettings,
} = source;

export const isSeedData = useSeed;
