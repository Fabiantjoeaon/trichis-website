<?php
/**
 * WP-CLI seeder — imports the DatoCMS export produced by
 * `pnpm seed:export` (scripts/seed/data/) into WordPress.
 *
 *   wp trichis seed [--dir=<path>] [--fresh]
 *
 * What it does:
 *  - creates deliverable terms, projects, services, pages
 *  - creates the four fixed-route pages (home, about, what-we-do, projects)
 *    from route-pages.json, blocks and all
 *  - sideloads exported images into the media library (deduped by source URL)
 *  - stores Mux video fields so the site keeps the same video streaming
 *  - maps Dato modular content records onto the ACF flexible content blocks
 *  - fills Site Settings (general, nav, footer, cookie banner, 404, UI strings)
 *  - creates AF field groups for the quickscan/contact forms from the
 *    FormSection definitions
 *
 * Requires: ACF Pro active. Advanced Forms is used when active.
 *
 * Post fields are written by field key, not name: `page_blocks`, `cover` and
 * `mobile_cover` exist on the page, project and service groups alike, and
 * update_field() resolves an ambiguous name to whichever group registered last.
 */

if (!defined('ABSPATH') && !defined('WP_CLI')) exit;

class Trichis_Seed_Command {

    private string $data_dir;

    private string $public_dir;

    private ?string $r2_base = null;

    /** @var array<string,int> source URL → attachment ID */
    private array $attachment_cache = [];

    /** @var array<string,array{file:string}> */
    private array $manifest = [];

    /**
     * Seed WordPress from the DatoCMS export.
     *
     * ## OPTIONS
     *
     * [--dir=<path>]
     * : Path to the seed data directory. Defaults to the repo's
     *   scripts/seed/data relative to this plugin.
     *
     * [--fresh]
     * : Delete previously seeded posts (identified by _trichis_seeded meta)
     *   before importing.
     */
    public function __invoke($args, $assoc_args) {
        if (!function_exists('acf_add_local_field_group') || !function_exists('update_field')) {
            WP_CLI::error('ACF (Pro) must be active before seeding.');
        }

        $repo_root        = dirname(TRICHIS_CORE_DIR, 3);
        $default_dir      = "{$repo_root}/scripts/seed/data";
        $this->data_dir   = rtrim($assoc_args['dir'] ?? $default_dir, '/');
        $this->public_dir = "{$repo_root}/public";
        $this->r2_base    = $this->read_r2_base($repo_root);

        if (!is_dir($this->data_dir)) {
            WP_CLI::error("Seed data directory not found: {$this->data_dir}. Run `pnpm seed:export` first.");
        }

        $this->manifest = $this->read_json('assets-manifest.json') ?: [];

        if (!empty($assoc_args['fresh'])) {
            $this->delete_seeded();
        }

        $this->seed_projects();
        $this->seed_services();
        $this->seed_pages();
        $this->seed_route_pages();
        $this->seed_options();
        $this->seed_forms();

        WP_CLI::success('Seed complete.');
    }

    /**
     * The exporter never downloaded the videos, so importing them means
     * pulling from the same R2 mirror the front end reads. Its base URL lives
     * in the repo's .env rather than in WordPress.
     */
    private function read_r2_base(string $repo_root): ?string {
        $env = "{$repo_root}/.env";
        if (!file_exists($env)) return null;

        if (preg_match('/^\s*PUBLIC_R2_PUBLIC_URL\s*=\s*(\S+)/m', (string) file_get_contents($env), $m)) {
            return rtrim(trim($m[1], "\"'"), '/');
        }
        return null;
    }

    private function read_json(string $file) {
        $path = "{$this->data_dir}/{$file}";
        if (!file_exists($path)) return null;
        return json_decode((string) file_get_contents($path), true);
    }

    private function delete_seeded(): void {
        $posts = get_posts([
            'post_type'      => ['project', 'service', 'page', 'attachment'],
            'post_status'    => 'any',
            'posts_per_page' => -1,
            'meta_key'       => '_trichis_seeded',
            'fields'         => 'ids',
        ]);
        foreach ($posts as $id) {
            wp_delete_post($id, true);
        }
        WP_CLI::log('Deleted ' . count($posts) . ' previously seeded posts.');
    }

    // ── media ────────────────────────────────────────────────────────────

    /**
     * Sideload an exported asset into the media library, by its original
     * source URL. Returns the attachment ID or 0.
     *
     * The file is found in one of three places, in order: the export directory
     * (via assets-manifest.json), the repo's public/ directory for URLs that
     * are already site-relative, or the R2 mirror for anything the exporter
     * did not download — which is every video, since Dato served those through
     * Mux rather than as files.
     */
    private function attach_media(?array $asset): int {
        if (!$asset || empty($asset['url'])) return 0;
        $url = $asset['url'];

        if (isset($this->attachment_cache[$url])) return $this->attachment_cache[$url];

        // Reuse attachments from previous runs.
        $existing = get_posts([
            'post_type'      => 'attachment',
            'post_status'    => 'any',
            'posts_per_page' => 1,
            'meta_key'       => '_trichis_source_url',
            'meta_value'     => $url,
            'fields'         => 'ids',
        ]);
        if ($existing) {
            return $this->attachment_cache[$url] = (int) $existing[0];
        }

        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $entry = $this->manifest[$url] ?? null;
        $remote = null;

        if ($entry) {
            $local = "{$this->data_dir}/{$entry['file']}";
        } elseif (str_starts_with($url, '/')) {
            $local = $this->public_dir . $url;
        } else {
            $remote = $this->mirror_url($url);
            if (!$remote) {
                WP_CLI::warning("No local file and no mirror for {$url}");
                return 0;
            }
            $local = null;
        }

        if ($local !== null && !file_exists($local)) {
            WP_CLI::warning("Missing asset file {$local}");
            return 0;
        }

        // media_handle_sideload moves the file, so hand it a temp copy.
        if ($remote) {
            // Videos run to several megabytes and a seed pulls dozens of them,
            // so the odd timeout is expected rather than fatal.
            for ($attempt = 1; $attempt <= 3; $attempt++) {
                $tmp = download_url($remote, 120);
                if (!is_wp_error($tmp)) break;
                WP_CLI::warning("Download attempt {$attempt} failed for {$remote}: " . $tmp->get_error_message());
                sleep($attempt);
            }
            if (is_wp_error($tmp)) return 0;

            $name = basename(parse_url($url, PHP_URL_PATH));
        } else {
            $tmp = wp_tempnam(basename($local));
            copy($local, $tmp);
            $name = basename($local);
        }

        $id = media_handle_sideload([
            'name'     => preg_replace('/^[0-9a-f]{10}-/', '', $name),
            'tmp_name' => $tmp,
        ], 0);

        if (is_wp_error($id)) {
            @unlink($tmp);
            WP_CLI::warning("Sideload failed for {$url}: " . $id->get_error_message());
            return 0;
        }

        update_post_meta($id, '_trichis_source_url', $url);
        update_post_meta($id, '_trichis_seeded', 1);
        if (!empty($asset['alt'])) {
            update_post_meta($id, '_wp_attachment_image_alt', $asset['alt']);
        }

        WP_CLI::log('  media: ' . preg_replace('/^[0-9a-f]{10}-/', '', $name));
        return $this->attachment_cache[$url] = (int) $id;
    }

    /** Map a Dato or Mux URL onto the R2 bucket that mirrors both. */
    private function mirror_url(string $url): ?string {
        if (!$this->r2_base) return null;

        foreach (['datocms-assets\.com', 'stream\.mux\.com', 'image\.mux\.com'] as $host) {
            if (preg_match("#{$host}/(.*)#", $url, $m)) {
                return "{$this->r2_base}/{$m[1]}";
            }
        }
        return null;
    }

    /**
     * A media field now holds one attachment. Dato assets that were videos
     * carry Mux metadata next to a source URL; the source file is what gets
     * imported, and the front end detects the type from the mime.
     */
    private function media_value(?array $asset): int {
        return $this->attach_media($asset);
    }

    // ── content blocks ───────────────────────────────────────────────────

    /** Map normalized content records to ACF flexible content rows. */
    private function map_blocks(?array $content): array {
        $rows = [];
        foreach ((array) $content as $block) {
            $type = $block['__typename'] ?? '';

            switch ($type) {
                case 'ProjectheaderRecord':
                    $rows[] = [
                        'acf_fc_layout'    => 'project_header',
                        'section_title'    => $block['sectionTitle'] ?? '',
                        'big_title'        => $block['bigTitle'] ?? '',
                        'paragraph_header' => $block['paragraphHeader'] ?? '',
                        'paragraph'        => $block['paragraph'] ?? '',
                    ];
                    break;
                case 'PageheaderRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'page_header',
                        'section_title' => $block['sectionTitle'] ?? '',
                        'title'         => $block['title'] ?? '',
                        'title_bottom'  => $block['titleBottom'] ?? '',
                        'paragraph'     => $block['paragraph'] ?? '',
                        'cta_text'      => $block['ctaText'] ?? '',
                        'cta_link'      => $block['ctaLink'] ?? '',
                    ];
                    break;
                case 'CtasectionRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'cta_section',
                        'title'         => $block['title'] ?? '',
                        'cta_text'      => $block['ctaText'] ?? '',
                        'cta_link'      => $block['ctaLink'] ?? '',
                    ];
                    break;
                case 'FormSectionRecord':
                    $rows[] = [
                        'acf_fc_layout'   => 'form_section',
                        'title'           => $block['title'] ?? '',
                        'subtitle'        => $block['subtitle'] ?? '',
                        'form_name'       => $block['formName'] ?? '',
                        'cta_text'        => $block['ctaText'] ?? '',
                        'success_title'   => $block['successTitle'] ?? '',
                        'success_message' => $block['successMessage'] ?? '',
                        'form_fields'     => array_map(fn($f) => [
                            'label'       => $f['label'] ?? '',
                            'name'        => $f['name'] ?? '',
                            'field_type'  => $f['fieldType'] ?? 'text',
                            'required'    => !empty($f['required']),
                            'width'       => $this->field_width($f['width'] ?? null),
                            'placeholder' => $f['placeholder'] ?? '',
                            'options'     => $f['options'] ?? '',
                        ], (array) ($block['formFields'] ?? [])),
                    ];
                    break;
                case 'ColumnrowRecord':
                    $columns = [];
                    foreach ((array) ($block['columns'] ?? []) as $col) {
                        $ctype = match ($col['__typename'] ?? '') {
                            'ImagecolumnRecord' => 'image',
                            'TextcolumnRecord'  => 'text',
                            default             => 'empty',
                        };
                        $columns[] = [
                            'column_type'     => $ctype,
                            'width'           => $col['width'] ?? '',
                            'mobile_width'    => $col['mobileWidth'] ?? '',
                            'media'           => $ctype === 'image' ? $this->media_value($col['image'] ?? null) : $this->media_value(null),
                            'text'            => $col['text'] ?? '',
                            'align'           => $col['align'] ?? 'left',
                            'cta_text'        => $col['cta']['text'] ?? '',
                            'cta_url'         => $col['cta']['url'] ?? '',
                            'cta_is_external' => !empty($col['cta']['isExternal']),
                        ];
                    }
                    $rows[] = [
                        'acf_fc_layout' => 'column_row',
                        'columns'       => $columns,
                    ];
                    break;
                case 'ProjectnumberRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'project_numbers',
                        'section_title' => $block['sectionTitle'] ?? '',
                        'title_left'    => $block['titleLeft'] ?? '',
                        'title_right'   => $block['titleRight'] ?? '',
                        'numbers'       => array_map(fn($n) => [
                            'number' => $n['number'] ?? 0,
                            'text'   => $n['text'] ?? '',
                        ], (array) ($block['numbers'] ?? [])),
                    ];
                    break;
                case 'ParagraphRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'paragraph',
                        'content'       => $block['content'] ?? '',
                    ];
                    break;
                case 'SectionlineRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'section_line',
                        'title'         => $block['title'] ?? '',
                    ];
                    break;
                case 'ScrollingTitleRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'scrolling_title',
                        'text'          => $block['text'] ?? '',
                    ];
                    break;

                // ── page sections ──
                case 'HomeheroRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'home_hero',
                        'media'         => $this->media_value($block['media'] ?? null),
                        'mobile_media'  => $this->media_value($block['mobileMedia'] ?? null),
                    ];
                    break;
                case 'HomewhoweareRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'home_who_we_are',
                        'section_title' => $block['sectionTitle'] ?? '',
                        'body'          => $block['body'] ?? '',
                    ];
                    break;
                case 'HomewhatwedoRecord':
                    $rows[] = [
                        'acf_fc_layout'  => 'home_what_we_do',
                        'section_title'  => $block['sectionTitle'] ?? '',
                        'scrolling_text' => $block['scrollingText'] ?? '',
                        'intro'          => $block['intro'] ?? '',
                        'services'       => array_map(fn($s) => [
                            'label' => $s['label'] ?? '',
                            'link'  => $s['link'] ?? '',
                            'media' => $this->media_value($s['media'] ?? null),
                        ], (array) ($block['services'] ?? [])),
                    ];
                    break;
                case 'HomewhatwevecreatedRecord':
                    $rows[] = [
                        'acf_fc_layout'  => 'home_what_weve_created',
                        'section_title'  => $block['sectionTitle'] ?? '',
                        'scrolling_text' => $block['scrollingText'] ?? '',
                        'intro'          => $block['intro'] ?? '',
                        'list_label'     => $block['listLabel'] ?? '',
                        'cta_text'       => $block['ctaText'] ?? '',
                        'cta_link'       => $block['ctaLink'] ?? '',
                    ];
                    break;
                case 'HowwedoitRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'how_we_do_it',
                        'title'         => $block['title'] ?? '',
                        'gl_word'       => $block['glWord'] ?? '',
                        'cards'         => array_map(fn($c) => [
                            'title'       => $c['title'] ?? '',
                            'text_top'    => $c['textTop'] ?? '',
                            'text_bottom' => $c['textBottom'] ?? '',
                        ], (array) ($block['cards'] ?? [])),
                    ];
                    break;
                case 'HomeshowreelRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'home_showreel',
                        'text_top'      => $block['textTop'] ?? '',
                        'text_bottom'   => $block['textBottom'] ?? '',
                        'media'         => $this->media_value($block['media'] ?? null),
                        'mobile_media'  => $this->media_value($block['mobileMedia'] ?? null),
                    ];
                    break;
                case 'LinkbandRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'link_band',
                        'title'         => $block['title'] ?? '',
                        'link'          => $block['link'] ?? '',
                    ];
                    break;
                case 'ServiceheroRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'service_hero',
                        'title'         => $block['title'] ?? '',
                        'header_text'   => $block['headerText'] ?? '',
                        'paragraph'     => $block['paragraph'] ?? '',
                        'cta_text'      => $block['ctaText'] ?? '',
                        'cta_link'      => $block['ctaLink'] ?? '',
                    ];
                    break;
                case 'AboutheroRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'about_hero',
                        'brand_text'    => $block['brandText'] ?? '',
                        'brand_mobile'  => $block['brandMobile'] ?? '',
                    ];
                    break;
                case 'AboutintroRecord':
                    $rows[] = [
                        'acf_fc_layout'  => 'about_intro',
                        'section_title'  => $block['sectionTitle'] ?? '',
                        'scrolling_text' => $block['scrollingText'] ?? '',
                        'lead'           => $block['lead'] ?? '',
                        'cta_text'       => $block['ctaText'] ?? '',
                        'cta_link'       => $block['ctaLink'] ?? '',
                        'image_a'        => $this->media_value($block['imageA'] ?? null),
                        'image_b'        => $this->media_value($block['imageB'] ?? null),
                        'image_wide'     => $this->media_value($block['imageWide'] ?? null),
                        'body'           => $block['body'] ?? '',
                    ];
                    break;
                case 'OfficesRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'offices',
                        'section_title' => $block['sectionTitle'] ?? '',
                        'intro'         => $block['intro'] ?? '',
                        'offices'       => array_map(fn($o) => [
                            'title'   => $o['title'] ?? '',
                            'address' => $o['address'] ?? '',
                            'media'   => $this->media_value($o['media'] ?? null),
                        ], (array) ($block['offices'] ?? [])),
                    ];
                    break;
                case 'ExpertisesRecord':
                    $rows[] = [
                        'acf_fc_layout' => 'expertises',
                        'section_title' => $block['sectionTitle'] ?? '',
                        'heading'       => $block['heading'] ?? '',
                        'body'          => $block['body'] ?? '',
                        'cta_text'      => $block['ctaText'] ?? '',
                        'cta_link'      => $block['ctaLink'] ?? '',
                    ];
                    break;
                case 'ServiceteaserRecord':
                    $rows[] = [
                        'acf_fc_layout'       => 'service_teaser',
                        'section_title'       => $block['sectionTitle'] ?? '',
                        'full_service_name'   => $block['fullServiceName'] ?? '',
                        'service_name'        => $block['serviceName'] ?? '',
                        'service_name_bottom' => $block['serviceNameBottom'] ?? '',
                        'paragraphs'          => array_map(
                            fn($p) => ['text' => is_array($p) ? ($p['text'] ?? '') : $p],
                            (array) ($block['paragraphs'] ?? []),
                        ),
                        'cta_text'            => $block['ctaText'] ?? '',
                        'cta_link'            => $block['ctaLink'] ?? '',
                        'rows'                => array_map(fn($row) => [
                            'columns' => array_map(fn($c) => [
                                'width' => $c['width'] ?? '',
                                'media' => $this->media_value($c['media'] ?? null),
                            ], (array) ($row['columns'] ?? [])),
                        ], (array) ($block['rows'] ?? [])),
                        'trailing_text'     => $block['trailingText'] ?? '',
                        'trailing_cta_text' => $block['trailingCtaText'] ?? '',
                        'trailing_cta_link' => $block['trailingCtaLink'] ?? '',
                    ];
                    break;
            }
        }
        return $rows;
    }

    /** The Dato export stores form field widths as percentages; ACF uses full/half. */
    private function field_width($raw): string {
        if ($raw === 'half' || $raw === 'full') return $raw;
        if (is_numeric($raw) && (int) $raw > 0 && (int) $raw <= 50) return 'half';
        return 'full';
    }

    // ── post helpers ─────────────────────────────────────────────────────

    private function upsert_post(string $post_type, string $slug, string $title): int {
        $existing = get_posts([
            'post_type'      => $post_type,
            'name'           => $slug,
            'post_status'    => 'any',
            'posts_per_page' => 1,
            'fields'         => 'ids',
        ]);
        if ($existing) {
            $id = (int) $existing[0];
            wp_update_post(['ID' => $id, 'post_title' => $title]);
            return $id;
        }

        $id = wp_insert_post([
            'post_type'   => $post_type,
            'post_name'   => $slug,
            'post_title'  => $title,
            'post_status' => 'publish',
        ], true);

        if (is_wp_error($id)) {
            WP_CLI::warning("Could not create {$post_type} {$slug}: " . $id->get_error_message());
            return 0;
        }

        update_post_meta($id, '_trichis_seeded', 1);
        return (int) $id;
    }

    // ── seeding steps ────────────────────────────────────────────────────

    private function seed_projects(): void {
        $projects = $this->read_json('projects.json');
        if (!$projects) {
            WP_CLI::warning('projects.json missing, skipping projects.');
            return;
        }

        WP_CLI::log('Seeding ' . count($projects) . ' projects…');
        foreach ($projects as $p) {
            $id = $this->upsert_post('project', $p['slug'], $p['title']);
            if (!$id) continue;

            update_field('field_project_year', (string) ($p['year'] ?? ''), $id);
            update_field('field_project_featured', !empty($p['featured']), $id);
            update_field('field_project_featured_order', $p['featuredOrder'] ?? '', $id);
            update_field('field_project_cover', $this->media_value($p['coverImage'] ?? null), $id);
            update_field('field_project_mobile_cover', $this->media_value($p['mobileCoverImage'] ?? null), $id);
            update_field('field_project_featured_media', $this->media_value($p['featuredImage'] ?? null), $id);
            update_field('field_project_page_blocks', $this->map_blocks($p['content'] ?? []), $id);

            // Featured image doubles as the WP thumbnail for admin lists.
            $thumb = $this->attach_media($p['coverImage'] ?? null);
            if ($thumb) set_post_thumbnail($id, $thumb);

            $term_ids = [];
            foreach ((array) ($p['deliverables'] ?? []) as $d) {
                $term = term_exists($d['title'], 'deliverable') ?: wp_insert_term($d['title'], 'deliverable');
                if (!is_wp_error($term)) {
                    $term_ids[] = (int) (is_array($term) ? $term['term_id'] : $term);
                }
            }
            wp_set_object_terms($id, $term_ids, 'deliverable');
            $this->seed_seo($id, $p['seo'] ?? null);

            WP_CLI::log("  project: {$p['slug']}");
        }
    }

    private function seed_services(): void {
        $services = $this->read_json('services.json');
        if (!$services) {
            WP_CLI::warning('services.json missing, skipping services.');
            return;
        }

        WP_CLI::log('Seeding ' . count($services) . ' services…');
        foreach ($services as $s) {
            $id = $this->upsert_post('service', $s['slug'], $s['title']);
            if (!$id) continue;

            $header = $s['header'] ?? [];
            update_field('field_service_header', [
                'header_text' => $header['headertext'] ?? '',
                'paragraph'   => $header['paragraph'] ?? '',
                'cta_text'    => $header['cta']['text'] ?? '',
                'cta_url'     => $header['cta']['url'] ?? '',
            ], $id);
            update_field('field_service_page_blocks', $this->map_blocks($s['content'] ?? []), $id);
            $this->seed_seo($id, $s['seo'] ?? null);

            WP_CLI::log("  service: {$s['slug']}");
        }
    }

    /** Dato "Pages" become custom WP pages rendered by the [...slug] route. */
    private function seed_pages(): void {
        $pages = $this->read_json('pages.json');
        if (!$pages) {
            WP_CLI::warning('pages.json missing, skipping pages.');
            return;
        }

        WP_CLI::log('Seeding ' . count($pages) . ' CMS pages…');
        foreach ($pages as $p) {
            $id = $this->upsert_post('page', $p['slug'], $p['title']);
            if (!$id) continue;

            update_field('field_page_key', 'custom', $id);
            update_field('field_page_cover', $this->media_value($p['coverImage'] ?? null), $id);
            update_field('field_page_mobile_cover', $this->media_value($p['mobileCoverImage'] ?? null), $id);
            update_field('field_page_page_blocks', $this->map_blocks($p['content'] ?? []), $id);
            $this->seed_seo($id, $p['seo'] ?? null);

            WP_CLI::log("  page: {$p['slug']}");
        }
    }

    /** Fixed routes (home, about, what-we-do, projects) as WP pages. */
    private function seed_route_pages(): void {
        $pages = $this->read_json('route-pages.json');
        if (!$pages) {
            WP_CLI::warning('route-pages.json missing, skipping route pages.');
            return;
        }

        WP_CLI::log('Seeding ' . count($pages) . ' route pages…');
        foreach ($pages as $p) {
            $id = $this->upsert_post('page', $p['slug'], $p['title']);
            if (!$id) continue;

            update_field('field_page_key', $p['pageKey'] ?? 'custom', $id);
            update_field('field_page_cover', $this->media_value($p['coverImage'] ?? null), $id);
            update_field('field_page_mobile_cover', $this->media_value($p['mobileCoverImage'] ?? null), $id);
            update_field('field_page_page_blocks', $this->map_blocks($p['content'] ?? []), $id);
            $this->seed_seo($id, $p['seo'] ?? null);

            WP_CLI::log("  route page: {$p['slug']} ({$p['pageKey']})");
        }
    }

    private function seed_seo(int $post_id, ?array $seo): void {
        if (!$seo) return;
        update_field('field_seo_title', $seo['title'] ?? '', $post_id);
        update_field('field_seo_description', $seo['description'] ?? '', $post_id);
        update_field('field_seo_noindex', !empty($seo['noindex']), $post_id);
        if (!empty($seo['ogImage'])) {
            update_field('field_seo_og_image', $this->attach_media(['url' => $seo['ogImage']]), $post_id);
        }
    }

    private function seed_options(): void {
        $site = $this->read_json('site.json');
        if (!$site) {
            WP_CLI::warning('site.json missing, skipping site settings.');
            return;
        }

        WP_CLI::log('Seeding site settings…');

        $fields = [
            'site_name'               => $site['general']['site_name'] ?? '',
            'seo_title_suffix'        => $site['general']['seo_title_suffix'] ?? '',
            'seo_default_description' => $site['general']['seo_default_description'] ?? '',

            'nav_links'         => $site['navigation']['nav_links'] ?? [],
            'menu_footer_links' => $site['navigation']['menu_footer_links'] ?? [],

            'footer_lead_head'    => $site['footer']['footer_lead_head'] ?? '',
            'footer_lead_body'    => $site['footer']['footer_lead_body'] ?? '',
            'footer_offices'      => $site['footer']['footer_offices'] ?? [],
            'footer_email'        => $site['footer']['footer_email'] ?? '',
            'footer_phone'        => $site['footer']['footer_phone'] ?? '',
            'footer_social_links' => $site['footer']['footer_social_links'] ?? [],
            'footer_legal_items'  => $site['footer']['footer_legal_items'] ?? [],
            'footer_cta_title'    => $site['footer']['footer_cta_title'] ?? '',
            'footer_cta_text'     => $site['footer']['footer_cta_text'] ?? '',
            'footer_cta_link'     => $site['footer']['footer_cta_link'] ?? '',

            'random_sentences' => $site['interfaceSettings']['random_sentences'] ?? [],

            'cookie_title'      => $site['cookieBanner']['cookie_title'] ?? '',
            'cookie_message'    => $site['cookieBanner']['cookie_message'] ?? '',
            'cookie_accept'     => $site['cookieBanner']['cookie_accept'] ?? '',
            'cookie_reject'     => $site['cookieBanner']['cookie_reject'] ?? '',
            'cookie_more_label' => $site['cookieBanner']['cookie_more_label'] ?? '',

            'not_found_title'    => $site['notFound']['not_found_title'] ?? '',
            'not_found_cta_text' => $site['notFound']['not_found_cta_text'] ?? '',
            'not_found_cta_link' => $site['notFound']['not_found_cta_link'] ?? '',

            'ui_strings' => $site['uiStrings']['ui_strings'] ?? [],
        ];

        foreach ($fields as $name => $value) {
            update_field($name, $value, 'options');
        }
    }

    /**
     * Create AF field groups for the quickscan/contact forms based on the
     * FormSection blocks found in the exported pages.
     */
    private function seed_forms(): void {
        if (!function_exists('af_form_post_from_key')) {
            WP_CLI::warning('Advanced Forms not active, skipping form field groups.');
            return;
        }
        if (!function_exists('acf_update_field_group')) return;

        $sources = array_merge(
            $this->read_json('pages.json') ?: [],
            $this->read_json('route-pages.json') ?: [],
        );

        $form_sections = [];
        foreach ($sources as $p) {
            foreach ((array) ($p['content'] ?? []) as $block) {
                if (($block['__typename'] ?? '') === 'FormSectionRecord' && !empty($block['formName'])) {
                    $form_sections[$block['formName']] = $block;
                }
            }
        }

        trichis_bootstrap_forms();

        foreach ($form_sections as $name => $section) {
            $form_key  = 'form_' . sanitize_key($name);
            $group_key = 'group_' . $form_key . '_fields';

            // Make sure the AF form post exists (bootstrap covers quickscan/contact).
            if (!af_form_post_from_key($form_key)) {
                $post_id = wp_insert_post([
                    'post_type'   => 'af_form',
                    'post_title'  => ucfirst($name),
                    'post_status' => 'publish',
                ]);
                if (!is_wp_error($post_id)) {
                    update_post_meta($post_id, 'form_key', $form_key);
                    update_post_meta($post_id, 'form_create_entries', 1);
                    update_post_meta($post_id, '_form_create_entries', 'field_form_create_entries');
                }
            }

            if (acf_get_field_group($group_key)) continue;

            $group = acf_update_field_group([
                'key'      => $group_key,
                'title'    => ucfirst($name) . ' Form Fields',
                'location' => [[
                    ['param' => 'af_form', 'operator' => '==', 'value' => $form_key],
                ]],
                'show_in_graphql' => 0,
            ]);

            $group_id = $group['ID'] ?? 0;
            if (!$group_id) continue;

            foreach ((array) ($section['formFields'] ?? []) as $i => $f) {
                $type = match ($f['fieldType'] ?? 'text') {
                    'email'    => 'email',
                    'textarea' => 'textarea',
                    'select'   => 'select',
                    'checkbox' => 'checkbox',
                    'radio'    => 'radio',
                    default    => 'text',
                };
                acf_update_field([
                    'key'         => "field_{$form_key}_" . sanitize_key($f['name'] ?? "f{$i}"),
                    'label'       => $f['label'] ?? '',
                    'name'        => $f['name'] ?? "field_{$i}",
                    'type'        => $type,
                    'required'    => !empty($f['required']),
                    'placeholder' => $f['placeholder'] ?? '',
                    'choices'     => $this->parse_options($f['options'] ?? ''),
                    'wrapper'     => ['width' => $this->field_width($f['width'] ?? null) === 'half' ? '50' : '100'],
                    'parent'      => $group_id,
                    'menu_order'  => $i,
                ]);
            }

            WP_CLI::log("  form: {$form_key}");
        }
    }

    private function parse_options($raw): array {
        if (is_array($raw)) return $raw;
        $choices = [];
        foreach (preg_split('/\r?\n/', (string) $raw) as $line) {
            $line = trim($line);
            if ($line !== '') $choices[$line] = $line;
        }
        return $choices;
    }
}

WP_CLI::add_command('trichis seed', 'Trichis_Seed_Command');
