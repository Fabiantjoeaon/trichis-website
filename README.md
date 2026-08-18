# Trichis Website

Rebuild of the Nine Creative Agency site (nine-ca) on the plan-brabant stack:
Astro 5 static output, React 19 islands, Tailwind 3, GSAP, Lenis, and
three.js **TSL** (via `three/webgpu`, WebGPU with automatic WebGL2 fallback)
instead of raw GLSL. Content lives in a headless WordPress install
(`~/Local Sites/trichis`) exposed over WPGraphQL, replacing DatoCMS.

## Requirements

- Node >= 22.12 (pnpm)
- The trichis Local site running with these plugins active:
  ACF Pro, WPGraphQL, WPGraphQL for ACF, Advanced Forms, and the bundled
  `trichis-core` plugin (in `wordpress/plugins/trichis-core`, symlink or copy
  it into `wp-content/plugins`).

## Commands

- `pnpm dev` — dev server (uses seed JSON when `USE_SEED_DATA=1`)
- `pnpm build` — static production build to `dist/`
- `pnpm seed:export` — export all content from DatoCMS to `scripts/seed/data/`
  (uses `DATOCMS_READ_ONLY_API_TOKEN` from `.env`)
- `wp trichis seed` (WP-CLI, from the WP root) — import the exported data into
  WordPress: creates posts/pages/terms, sideloads images, stores Mux video
  fields

## Environment

Copy `.env.example` to `.env`. Key variables:

- `PUBLIC_WP_SOURCE` — `local` or `flywheel`
- `PUBLIC_WP_GRAPHQL_URL_LOCAL` — `http://trichis.local/graphql`
- `PUBLIC_WP_GRAPHQL_URL_FLYWHEEL` — `https://trichis.flywheelsites.com/graphql`
- `USE_SEED_DATA` — `1` builds pages from the exported DatoCMS JSON instead of
  WordPress (useful before WP is installed/seeded)

## Structure

- `src/pages/` — routes (single language, NL)
- `src/components/` — domain folders (home, projects, service, …), `gl/` for
  TSL/WebGPU components, `layout/` for chrome
- `src/lib/` — graphql client, queries, mappers, i18n
- `scripts/seed/` — DatoCMS export pipeline
- `wordpress/plugins/trichis-core` — custom WP plugin (CPTs, ACF field groups,
  flexible content blocks, Site Settings, forms REST adapter, WP-CLI seeder)

## Media

Images are sideloaded into the WP media library during seeding. Video keeps
streaming from the original Mux account (playback IDs stored in ACF fields) —
those streams stay online as long as the nine-ca DatoCMS project exists.
