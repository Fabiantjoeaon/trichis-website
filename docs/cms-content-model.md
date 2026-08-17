# Trichis content model (step 2)

The full field spec for the WordPress content model. Implemented in
`wordpress/plugins/trichis-core/`. Derived from the audit in
[cms-audit.md](./cms-audit.md).

Conventions, unchanged from Plan Brabant and the existing plugin:

- Field group keys `group_{name}`, field keys `field_{name}`.
- Block sub-field keys `field_{ctx}_blk_{block}_{name}`, built by `trichis_bf()`.
- Flexible content layout keys `layout_key_{ctx}_{block}`, registered under
  `layout_{ctx}_{block}`.
- The flexible content field is always named `page_blocks`.
- Every group carries `show_in_graphql` and a camelCase `graphql_field_name`.
- GraphQL layout typenames resolve to `{Group}PageBlocks{Layout}Layout`.

---

## 1. Post types and taxonomies

Unchanged from the existing plugin. No new post types or taxonomies.

- `project` — GraphQL `project`/`projects`, archive, `deliverable` taxonomy.
- `service` — GraphQL `service`/`services`, no archive.
- WP core `page` — carries `pageBuilder`.
- `deliverable` — non-hierarchical taxonomy on `project`.

Deliberately **not** created: `project_category`, `project_tag`, project↔service relation.

---

## 2. Block library

### 2.1 Shared additions to every layout

Every layout gains one field, prepended:

- `anchor_id` — text. Renders as the `id` attribute on the section wrapper for in-page
  linking. Empty means no id.

### 2.2 Existing layouts (unchanged)

`page_header`, `project_header`, `paragraph`, `section_line`, `scrolling_title`,
`column_row`, `project_numbers`, `cta_section`, `form_section`. Field lists are in
section 2b of the audit.

### 2.3 New layouts

Twelve layouts, each mapping 1:1 to a component that currently hardcodes its content.

#### `home_hero` → `home/HomeHero.jsx`

- `media` — media group (desktop showreel)
- `mobile_media` — media group

#### `home_who_we_are` → `home/HomeWhoWeAre.jsx`

- `section_title` — text
- `body` — textarea

#### `home_what_we_do` → `home/HomeWhatWeDo.jsx`

- `section_title` — text
- `scrolling_text` — text
- `intro` — textarea
- `services` — repeater
  - `label` — text
  - `link` — text
  - `media` — media group

#### `home_what_weve_created` → `home/HomeWhatWeveCreated.jsx`

- `section_title` — text
- `scrolling_text` — text
- `intro` — textarea
- `list_label` — text
- `cta_text` — text (HTML allowed, e.g. `All our <strong>projects</strong>`)
- `cta_link` — text

Projects come from the `project` post type filtered on `featured`, not from this block.

#### `how_we_do_it` → `home/HowWeDoIt.jsx`

- `title` — text
- `gl_word` — text (word rendered into the WebGL mask)
- `cards` — repeater
  - `title` — text
  - `text_top` — textarea
  - `text_bottom` — textarea

Replaces `siteSettings.homeContent.how_we_do_it`, which is removed.

#### `home_showreel` → `home/HomeShowReel.jsx`

- `media` — media group
- `mobile_media` — media group
- `text_top` — text
- `text_bottom` — text

#### `link_band` → `home/HomeMore.jsx`

- `title` — text (HTML allowed)
- `link` — text

#### `about_hero` → `about/AboutUsHero.jsx`

- `brand_text` — text (WebGL wordmark, desktop)
- `brand_mobile` — text (single character, mobile)

#### `about_intro` → `about/AboutUsIntro.jsx`

- `section_title` — text
- `scrolling_text` — text
- `lead` — textarea
- `cta_text` — text
- `cta_link` — text
- `image_a` — media group
- `image_b` — media group
- `image_wide` — media group
- `body` — textarea

#### `offices` → `about/AboutUsOffices.jsx`

- `section_title` — text
- `intro` — textarea
- `offices` — repeater
  - `title` — text (short label, e.g. `R'dam`)
  - `address` — textarea, one line per row
  - `media` — media group

#### `expertises` → `whatwedo/WhatWeDoExpertises.jsx`

- `section_title` — text
- `heading` — text
- `body` — textarea
- `cta_text` — text
- `cta_link` — text

#### `service_teaser` → the five `whatwedo/WhatWeDoService*.jsx` components

One layout replaces all five. `service_name` and `service_name_bottom` reproduce the
two-line treatment (`Web-` / `design`, `Photo /` / `video`).

- `section_title` — text (empty falls back to `What we do - {service_name}`)
- `service_name` — text
- `service_name_bottom` — text
- `paragraphs` — repeater
  - `text` — textarea
- `cta_text` — text (HTML allowed)
- `cta_link` — text
- `media` — repeater
  - `media` — media group

### 2.4 Context assignment

- `page` — all nine existing layouts plus all twelve new ones. A page can be anything.
- `project` — `project_header`, `column_row`, `project_numbers`, `paragraph` (unchanged).
- `service` — `section_line`, `scrolling_title`, `column_row` (unchanged).

The four fixed routes are `page` records distinguished by `page_key`, so they draw from the
full page block set.

---

## 3. SEO

A new group, `group_seo`, attached to `page`, `project` and `service`.
`graphql_field_name: seo`.

- `seo_title` — text. Falls back to the post title.
- `seo_description` — textarea. Falls back to the options-page default.
- `og_image` — image. Falls back to the options-page default.
- `noindex` — true/false. Emits `<meta name="robots" content="noindex">`.

Options-page defaults live in a new `general` group (section 4).

---

## 4. Site Settings additions

### 4.1 New group `general` (`group_site_general`, menu_order 0)

- `site_name` — text
- `logo` — image
- `logo_alt` — image (inverted/dark variant)
- `favicon` — image
- `seo_title_suffix` — text, e.g. ` — Trichis`
- `seo_default_description` — textarea
- `seo_default_og_image` — image

### 4.2 New group `notFound` (`group_site_not_found`, menu_order 5)

- `not_found_title` — text
- `not_found_cta_text` — text
- `not_found_cta_link` — text

### 4.3 Changes to `footer`

Added:

- `footer_lead_head` — text (currently `DEFAULT_LEAD_HEAD` in `Footer.jsx`)
- `footer_lead_body` — textarea (currently `DEFAULT_LEAD_BODY`)

### 4.4 Changes to `cookieBanner`

Added:

- `cookie_title` — text
- `cookie_more_label` — text
- `privacy_document` — file. The "more info" link is hidden when empty.

### 4.5 Changes to `homeContent`

The group is **removed entirely**. Its contents move:

- `how_we_do_it` → the `how_we_do_it` block layout
- `what_we_do` → the `home_what_we_do` block layout
- `what_weve_created` → the `home_what_weve_created` block layout
- `showreel` → the `home_hero` and `home_showreel` block layouts
- `random_sentences` → moves to a new `interface` group, since it is chrome, not home content

### 4.6 New group `interface` (`group_site_interface`, menu_order 4)

- `random_sentences` — repeater of `text`, used by the loader shuffle

### 4.7 `uiStrings`

Unchanged in shape. The key set grows to cover every remaining microcopy string found in
the audit:

`nav.menu`, `nav.close`, `nav.light`, `nav.dark`, `footer.follow`, `footer.legalLabel`,
`footer.backToTop`, `project.aboutProject`, `project.aboutCampaign`, `project.whatsNext`,
`project.contact`, `projectNumbers.sectionTitle`, `form.submit`, `form.submitting`,
`form.required`, `form.chooseOption`, `form.minOneOption`, `form.checkEmail`, `form.error`,
`form.selectPlaceholder`, `video.closeHint`.

---

## 5. Page keys

`page_key` choices, unchanged: `home`, `about`, `whatWeDo`, `projects`, `custom`.

- `home` → `/`
- `about` → `/about-us`
- `whatWeDo` → `/what-we-do`
- `projects` → `/projects`
- `custom` → `/{slug}` via the catch-all route

The `projects` page holds only SEO and an optional header block; the project list itself
comes from the post type.

---

## 6. GraphQL surface

`queries.js` gains fragments for the twelve new layouts under all three prefixes it already
uses, plus:

- `seo { seoTitle seoDescription ogImage { node { sourceUrl } } noindex }` on page, project
  and service queries
- `general`, `notFound` and `interface` on `SITE_SETTINGS_QUERY`
- `homeContent` removed from `SITE_SETTINGS_QUERY`

`wordpress.js` gains matching entries in `LAYOUT_TO_TYPENAME` and `mapBlocks`. Normalised
`__typename` values follow the existing Dato-style convention, so new blocks are named
`HomeheroRecord`, `HomewhoweareRecord`, `HomewhatwedoRecord`, `HomewhatwevecreatedRecord`,
`HowwedoitRecord`, `HomeshowreelRecord`, `LinkbandRecord`, `AboutheroRecord`,
`AboutintroRecord`, `OfficesRecord`, `ExpertisesRecord`, `ServiceteaserRecord`.

---

## 7. Seed data

`scripts/seed/data/` gains `route-pages.json`, holding the four fixed-route pages with their
`page_blocks` populated from the copy currently hardcoded in the components. This keeps the
site renderable in `USE_SEED_DATA=1` mode and gives `wp trichis seed` something to import for
the route pages, which it currently creates as empty shells.

`wp trichis seed` now covers all 22 layouts, the SEO group on pages, projects and services,
the route pages, and every Site Settings group. Two details worth knowing:

- Route-page media reference files in `public/` (`/video/showreel.mp4`,
  `/images/services/identity.webp`). The seeder resolves any URL starting with `/` against
  `public/` and sideloads it, so those assets end up in the media library like the Dato ones.
  Video paths are stored in `video_mp4_url` rather than the image field.
- Form field widths were a number (0–100) in ACF but the renderer only understands
  `"half"`. The field is now a `full`/`half` select, and the seeder normalises the numeric
  values in the Dato export.

## 8. WordPress bring-up

Done. The local install runs ACF Pro 6.8, WPGraphQL 2.11, WPGraphQL for ACF 2.5 and Advanced
Forms 1.9 (copied from the Plan Brabant install), `wp trichis seed --fresh` has run, and
`.env` has `USE_SEED_DATA=0`. Seed JSON is still a working fallback: flip the flag back and
the build produces the same pages.

Two things about the WPGraphQL/ACF surface that are easy to trip over again:

- **Every ACF `select` is typed as a list**, even single-value ones, so `columnType` arrives
  as `["image"]`. `wordpress.js` unwraps these through a `choice()` helper. Five fields are
  affected: `page_key`, `column_type`, `align`, `field_type` and the form field `width`.
- **`page_blocks`, `cover` and `mobile_cover` exist on the page, project and service groups
  alike.** `update_field()` resolves an ambiguous name to whichever group registered last, so
  the seeder writes every post field by key (`field_page_page_blocks`), never by name.

Layout type names come out as `{FieldGroup}PageBlocks{Layout}Layout`, matching what
`src/lib/queries.js` assumes — verified against the live schema for all 22 layouts.

### CORS on uploads

`NineGLImageElement` requests every image with `crossorigin="anonymous"` so WebGL can read
its pixels, which means the host serving `/wp-content/uploads/` must send
`Access-Control-Allow-Origin`. nginx serves uploads directly, so no WordPress filter can add
it — it has to come from the server config. Locally that means a block in
`Local Sites/trichis/conf/nginx/site.conf.hbs` (Local's own template already does this for
fonts):

```nginx
location ^~ /wp-content/uploads/ {
    access_log        off;
    log_not_found     off;

    expires           5m;
    add_header        Cache-Control "public";
    add_header        Access-Control-Allow-Origin *;
}
```

This file lives outside the repo, so anyone setting up a fresh Local site has to add it
again, and the production WordPress host needs the equivalent. Without it every GL image
fails to load with an opaque CORS error while the network tab shows `200 OK`.
