<?php
/**
 * WP-CLI seeder — imports the DatoCMS export produced by
 * `pnpm seed:export` (scripts/seed/data/) into WordPress.
 *
 *   wp trichis seed [--dir=<path>] [--fresh]
 *
 * What it does:
 *  - creates deliverable terms, projects, services, pages
 *  - sideloads exported images into the media library (deduped by source URL)
 *  - stores Mux video fields so the site keeps the same video streaming
 *  - maps Dato modular content records onto the ACF flexible content blocks
 *  - fills Site Settings (nav, footer, home content, cookie banner)
 *  - creates AF field groups for the quickscan/contact forms from the
 *    FormSection definitions
 *
 * Requires: ACF Pro active. Advanced Forms is used when active.
 */

if (!defined('ABSPATH') && !defined('WP_CLI')) exit;

class Trichis_Seed_Command {

    private string $data_dir;

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

        $default_dir = dirname(TRICHIS_CORE_DIR, 3) . '/scripts/seed/data';
        $this->data_dir = rtrim($assoc_args['dir'] ?? $default_dir, '/');

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
     * Sideload an exported image (by its original Dato URL) into the media
     * library. Returns the attachment ID or 0.
     */
    private function attach_image(?array $asset): int {
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

        $entry = $this->manifest[$url] ?? null;
        if (!$entry) {
            WP_CLI::warning("No local file for {$url}");
            return 0;
        }

        $local = "{$this->data_dir}/{$entry['file']}";
        if (!file_exists($local)) {
            WP_CLI::warning("Missing asset file {$local}");
            return 0;
        }

        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        // media_handle_sideload moves the file, so hand it a temp copy.
        $tmp = wp_tempnam(basename($local));
        copy($local, $tmp);

        $id = media_handle_sideload([
            'name'     => preg_replace('/^[0-9a-f]{10}-/', '', basename($local)),
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

        WP_CLI::log('  media: ' . basename($local));
        return $this->attachment_cache[$url] = (int) $id;
    }

    /** Build the value for a trichis media group from a Dato image asset. */
    private function media_value(?array $asset): array {
        $video = $asset['video'] ?? null;
        return [
            'image'                 => $this->attach_image($asset),
            'video_streaming_url'   => $video['streamingUrl'] ?? '',
            'video_mux_playback_id' => $video['muxPlaybackId'] ?? '',
            'video_mp4_url'         => $video['mp4Url'] ?? '',
            'video_thumbnail_url'   => $video['thumbnailUrl'] ?? '',
        ];
    }

    // ── content blocks ───────────────────────────────────────────────────

    /** Map Dato modular content records to ACF flexible content rows. */
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
                            'width'       => $f['width'] ?? '',
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
            }
        }
        return $rows;
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

            update_field('year', (string) ($p['year'] ?? ''), $id);
            update_field('featured', !empty($p['featured']), $id);
            update_field('featured_order', $p['featuredOrder'] ?? '', $id);
            update_field('cover', $this->media_value($p['coverImage'] ?? null), $id);
            update_field('mobile_cover', $this->media_value($p['mobileCoverImage'] ?? null), $id);
            update_field('featured_media', $this->media_value($p['featuredImage'] ?? null), $id);
            update_field('page_blocks', $this->map_blocks($p['content'] ?? []), $id);

            // Featured image doubles as the WP thumbnail for admin lists.
            $thumb = $this->attach_image($p['coverImage'] ?? null);
            if ($thumb) set_post_thumbnail($id, $thumb);

            $term_ids = [];
            foreach ((array) ($p['deliverables'] ?? []) as $d) {
                $term = term_exists($d['title'], 'deliverable') ?: wp_insert_term($d['title'], 'deliverable');
                if (!is_wp_error($term)) {
                    $term_ids[] = (int) (is_array($term) ? $term['term_id'] : $term);
                }
            }
            wp_set_object_terms($id, $term_ids, 'deliverable');

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
            update_field('header', [
                'header_text' => $header['headertext'] ?? '',
                'paragraph'   => $header['paragraph'] ?? '',
                'cta_text'    => $header['cta']['text'] ?? '',
                'cta_url'     => $header['cta']['url'] ?? '',
            ], $id);
            update_field('page_blocks', $this->map_blocks($s['content'] ?? []), $id);

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

            update_field('page_key', 'custom', $id);
            update_field('cover', $this->media_value($p['coverImage'] ?? null), $id);
            update_field('mobile_cover', $this->media_value($p['mobileCoverImage'] ?? null), $id);
            update_field('page_blocks', $this->map_blocks($p['content'] ?? []), $id);

            WP_CLI::log("  page: {$p['slug']}");
        }
    }

    /** Fixed routes (home, about, what-we-do, projects) as WP pages. */
    private function seed_route_pages(): void {
        $routes = [
            'home'      => ['slug' => 'home', 'title' => 'Home'],
            'about'     => ['slug' => 'about-us', 'title' => 'About us'],
            'whatWeDo'  => ['slug' => 'what-we-do', 'title' => 'What we do'],
            'projects'  => ['slug' => 'projects', 'title' => 'Projects'],
        ];

        WP_CLI::log('Seeding route pages…');
        foreach ($routes as $key => $route) {
            $id = $this->upsert_post('page', $route['slug'], $route['title']);
            if (!$id) continue;
            update_field('page_key', $key, $id);
            WP_CLI::log("  route page: {$route['slug']} ({$key})");
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
            'nav_links'         => $site['navigation']['nav_links'] ?? [],
            'menu_footer_links' => $site['navigation']['menu_footer_links'] ?? [],
            'footer_offices'      => $site['footer']['footer_offices'] ?? [],
            'footer_email'        => $site['footer']['footer_email'] ?? '',
            'footer_phone'        => $site['footer']['footer_phone'] ?? '',
            'footer_social_links' => $site['footer']['footer_social_links'] ?? [],
            'footer_legal_items'  => $site['footer']['footer_legal_items'] ?? [],
            'footer_cta_title'    => $site['footer']['footer_cta_title'] ?? '',
            'footer_cta_text'     => $site['footer']['footer_cta_text'] ?? '',
            'footer_cta_link'     => $site['footer']['footer_cta_link'] ?? '',
            'how_we_do_it'      => $site['homeContent']['how_we_do_it'] ?? [],
            'what_we_do'        => $site['homeContent']['what_we_do'] ?? [],
            'what_weve_created' => $site['homeContent']['what_weve_created'] ?? [],
            'random_sentences'  => $site['homeContent']['random_sentences'] ?? [],
            'cookie_message' => $site['cookieBanner']['cookie_message'] ?? '',
            'cookie_accept'  => $site['cookieBanner']['cookie_accept'] ?? '',
            'cookie_reject'  => $site['cookieBanner']['cookie_reject'] ?? '',
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

        $pages = $this->read_json('pages.json') ?: [];
        $form_sections = [];
        foreach ($pages as $p) {
            foreach ((array) ($p['content'] ?? []) as $block) {
                if (($block['__typename'] ?? '') === 'FormSectionRecord' && !empty($block['formName'])) {
                    $form_sections[$block['formName']] = $block;
                }
            }
        }

        // The quickscan form lives on the (hard-coded) homepage in nine-ca;
        // ensure it exists with the known fields even when no CMS page uses it.
        if (!isset($form_sections['quickscan'])) {
            $form_sections['quickscan'] = [
                'formName'   => 'quickscan',
                'formFields' => [
                    ['label' => 'Naam', 'name' => 'name', 'fieldType' => 'text', 'required' => true, 'width' => 50],
                    ['label' => 'Bedrijf', 'name' => 'company', 'fieldType' => 'text', 'required' => false, 'width' => 50],
                    ['label' => 'E-mail', 'name' => 'email', 'fieldType' => 'email', 'required' => true, 'width' => 50],
                    ['label' => 'Website', 'name' => 'website', 'fieldType' => 'text', 'required' => false, 'width' => 50],
                ],
            ];
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
                    'wrapper'     => ['width' => (string) ($f['width'] ?? '')],
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
