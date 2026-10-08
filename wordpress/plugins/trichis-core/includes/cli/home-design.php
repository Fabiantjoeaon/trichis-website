<?php
/** Migrate the existing homepage without reimporting media or other pages. */
if (!defined('WP_CLI') || !WP_CLI) return;

WP_CLI::add_command('trichis home-design', function ($args, $assoc) {
    if (!function_exists('get_field')) WP_CLI::error('ACF Pro must be active.');
    $backup_key = 'trichis_home_design_backup_v1';
    $backup = get_option($backup_key);
    if (isset($assoc['restore'])) {
        if (!$backup) WP_CLI::error('No homepage migration backup exists.');
        update_field('field_page_page_blocks', $backup['blocks'], $backup['page_id']);
        foreach ($backup['footer'] as $key => $value) update_field($key, $value, 'option');
        delete_option($backup_key);
        WP_CLI::success('Restored the homepage and footer from the migration backup.');
        return;
    }
    if ($backup) {
        WP_CLI::success('Homepage migration already applied; editor changes have been preserved.');
        return;
    }
    $dir = rtrim($assoc['dir'] ?? dirname(TRICHIS_CORE_DIR, 3) . '/scripts/seed/data', '/');
    $pages = json_decode((string) @file_get_contents("$dir/route-pages.json"), true);
    $site = json_decode((string) @file_get_contents("$dir/site.json"), true);
    if (!$pages || !$site) WP_CLI::error('Pass --dir pointing to the updated scripts/seed/data directory.');
    $template = null;
    foreach ($pages as $page) if (($page['pageKey'] ?? '') === 'home') $template = $page;
    $ids = get_posts(['post_type' => 'page', 'post_status' => 'any', 'numberposts' => 2, 'fields' => 'ids', 'meta_key' => 'page_key', 'meta_value' => 'home']);
    if (count($ids) !== 1 || !$template) WP_CLI::error('Expected exactly one homepage and a home design template.');
    $id = $ids[0];
    // Unformatted ACF values preserve attachment IDs. Convert ACF field keys to names.
    $to_names = function ($value) use (&$to_names) {
        if (!is_array($value)) return $value;
        $out = [];
        foreach ($value as $key => $item) {
            $field = is_string($key) && str_starts_with($key, 'field_') ? acf_get_field($key) : null;
            $out[$field['name'] ?? $key] = $to_names($item);
        }
        return $out;
    };
    $raw = get_field('field_page_page_blocks', $id, false) ?: [];
    $existing = $to_names($raw);
    $by_type = [];
    foreach ($existing as $block) $by_type[$block['acf_fc_layout']] = $block;
    foreach (['home_hero', 'home_who_we_are', 'home_what_we_do', 'how_we_do_it', 'home_what_weve_created'] as $type) {
        if (!isset($by_type[$type])) WP_CLI::error("Homepage is missing $type; no changes made.");
    }
    $types = ['HomeheroRecord' => 'home_hero', 'HomewhoweareRecord' => 'home_who_we_are', 'HomewhatwedoRecord' => 'home_what_we_do', 'HowwedoitRecord' => 'how_we_do_it', 'HomewhatwevecreatedRecord' => 'home_what_weve_created'];
    $blocks = [];
    foreach ($template['content'] as $source) {
        $type = $types[$source['__typename']];
        $block = $by_type[$type];
        if (isset($source['sectionTitle'])) $block['section_title'] = $source['sectionTitle'];
        if ($type === 'home_hero') $block['fullscreen'] = true;
        if ($type === 'home_who_we_are') $block['body'] = $source['body'];
        if ($type === 'home_what_we_do') {
            $block['intro'] = $source['intro'];
            // Keep real service links and images; new services can be completed in ACF.
            $old_services = $block['services'] ?? [];
            $aliases = ['Visual identity' => 'identity', 'Huisstijlbewaking' => 'identity', 'Strategie' => 'strategy', 'Websites' => 'webdesign', 'Campagnes' => 'campaign'];
            $block['services'] = array_map(function ($service) use ($old_services, $aliases) {
                foreach ($old_services as $old) {
                    if (strcasecmp($old['label'], $service['label']) === 0 || (!empty($aliases[$service['label']]) && str_ends_with(rtrim($old['link'] ?? '', '/'), '/' . $aliases[$service['label']]))) {
                        return array_merge($old, ['label' => $service['label']]);
                    }
                }
                return ['label' => $service['label'], 'link' => '', 'media' => null];
            }, $source['services']);
        }
        if ($type === 'how_we_do_it') {
            $block['title'] = $source['title'];
            $block['intro'] = $source['intro'];
            $block['cards'] = array_map(fn($card) => ['title' => $card['title'], 'text_top' => $card['textTop'], 'text_bottom' => $card['textBottom']], $source['cards']);
        }
        if ($type === 'home_what_weve_created') {
            $projects = get_posts(['post_type' => 'project', 'numberposts' => -1, 'meta_key' => 'featured', 'meta_value' => '1']);
            usort($projects, fn($a, $b) => (int) get_field('featured_order', $a->ID) <=> (int) get_field('featured_order', $b->ID));
            $block['project_rows'] = [];
            foreach ($projects as $i => $project) $block['project_rows'][] = [
                'project_slug' => $project->post_name, 'width' => [40, 66, 66, 40, 100][$i % 5],
                'alignment' => $i % 2 ? 'right' : 'left', 'image_ratio' => $i % 5 === 3 ? 'portrait' : 'landscape',
                'glyph_enabled' => in_array($i % 5, [0, 2], true), 'glyph_position' => $i % 5 === 0 ? 'top-left' : 'top-right',
                'glyph_width' => 35, 'glyph_rotation' => 0, 'glyph_flip' => false,
            ];
            $block['cta_text'] = '';
            $block['cta_link'] = '';
        }
        $blocks[] = $block;
    }
    $footer_keys = ['field_footer_cta_title', 'field_footer_form', 'field_footer_form_enabled'];
    $footer_backup = [];
    foreach ($footer_keys as $key) $footer_backup[$key] = get_field($key, 'option', false);
    $form = $to_names($footer_backup['field_footer_form']);
    if (empty($form['form_fields'])) $form = $by_type['form_section'] ?? null;
    if (!$form || empty($form['form_fields'])) WP_CLI::error('No existing homepage/footer form to move. Configure the footer form first.');
    unset($form['acf_fc_layout']);
    $form['title'] = '';
    $form['subtitle'] = '';
    WP_CLI::log("Homepage #$id: five design sections, editable project rows, existing form moved into footer. Existing media retained; missing service images remain empty.");
    if (!isset($assoc['apply'])) {
        WP_CLI::success('Dry run complete. Use --apply to write; --restore reverses the migration.');
        return;
    }
    add_option($backup_key, ['page_id' => $id, 'blocks' => $raw, 'footer' => $footer_backup], '', false);
    update_field('field_footer_form', $form, 'option');
    update_field('field_footer_form_enabled', true, 'option');
    update_field('field_footer_cta_title', $site['footer']['footer_cta_title'], 'option');
    update_field('field_page_page_blocks', $blocks, $id);
    WP_CLI::success('Homepage design applied. Rebuild the frontend against this updated CMS.');
});
