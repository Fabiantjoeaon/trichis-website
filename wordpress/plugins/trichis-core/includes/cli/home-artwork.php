<?php
/** Install the supplied homepage artwork and fill empty card paragraphs. */
if (!defined('WP_CLI') || !WP_CLI) return;

WP_CLI::add_command('trichis home-artwork', function ($args, $assoc) {
    $root = dirname(TRICHIS_CORE_DIR, 3);
    $names = ['question', 'services', 'work-left', 'work-right'];
    foreach ($names as $name) {
        if (!is_file("$root/public/images/glyphs/trichis-$name.svg")) WP_CLI::error("Missing optimized artwork: $name");
    }
    $ids = get_posts(['post_type' => 'page', 'post_status' => 'any', 'numberposts' => 2, 'fields' => 'ids', 'meta_key' => 'page_key', 'meta_value' => 'home']);
    if (count($ids) !== 1) WP_CLI::error('Expected exactly one homepage.');
    $id = $ids[0];
    $raw = get_field('field_page_page_blocks', $id, false);
    if (!$raw) WP_CLI::error('The homepage has no content blocks.');
    if (!isset($assoc['apply'])) {
        WP_CLI::success("Ready to import four SVGs, fill empty glyph slots and empty card paragraphs on homepage #$id. Use --apply.");
        return;
    }
    $to_names = function ($value) use (&$to_names) {
        if (!is_array($value)) return $value;
        $out = [];
        foreach ($value as $key => $item) {
            $field = is_string($key) && str_starts_with($key, 'field_') ? acf_get_field($key) : null;
            $out[$field['name'] ?? $key] = $to_names($item);
        }
        return $out;
    };
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    // These four bundled files were inspected and optimized. Do not enable arbitrary SVG uploads.
    $mime_filter = fn($types) => array_merge($types, ['svg' => 'image/svg+xml']);
    $type_filter = function ($check, $file, $filename) use ($names) {
        if (in_array($filename, array_map(fn($name) => "trichis-$name.svg", $names), true)) {
            return ['ext' => 'svg', 'type' => 'image/svg+xml', 'proper_filename' => false];
        }
        return $check;
    };
    add_filter('upload_mimes', $mime_filter);
    add_filter('wp_check_filetype_and_ext', $type_filter, 10, 3);
    $media = [];
    foreach ($names as $name) {
        $existing = get_posts(['post_type' => 'attachment', 'post_status' => 'inherit', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_trichis_glyph', 'meta_value' => $name]);
        if ($existing) { $media[$name] = $existing[0]; continue; }
        $file = "$root/public/images/glyphs/trichis-$name.svg";
        $temp = wp_tempnam(basename($file));
        if (!$temp || !copy($file, $temp)) WP_CLI::error("Could not stage $name artwork.");
        $attachment = media_handle_sideload(['name' => basename($file), 'tmp_name' => $temp], 0, "Trichis — $name glyph");
        if (is_wp_error($attachment)) { @unlink($temp); WP_CLI::error($attachment->get_error_message()); }
        update_post_meta($attachment, '_trichis_glyph', $name);
        $media[$name] = $attachment;
    }
    remove_filter('upload_mimes', $mime_filter);
    remove_filter('wp_check_filetype_and_ext', $type_filter, 10);
    $copy = [
        'We beginnen met luisteren. Samen ontdekken we de kern van jouw verhaal en vertalen die naar een helder concept. Van het eerste idee tot de laatste punt: we maken het samen.',
        'Nieuwsgierig, betrokken en met oog voor detail. We combineren scherpe vragen met frisse ideeën en een praktische aanpak. Zo maken we communicatie die bij jouw organisatie past.',
        'Een verhaal dat klopt, herkenbaar is en blijft hangen. We helpen je om keuzes te maken en geven je merk de woorden en beelden waarmee je verder kunt.',
    ];
    $blocks = $to_names($raw);
    foreach ($blocks as &$block) {
        $type = $block['acf_fc_layout'];
        if ($type === 'home_who_we_are' && empty($block['glyph_media'])) $block['glyph_media'] = $media['question'];
        if ($type === 'home_what_we_do' && empty($block['glyph_media'])) $block['glyph_media'] = $media['services'];
        if ($type === 'home_what_weve_created') {
            foreach ($block['project_rows'] as &$row) {
                if (!empty($row['glyph_enabled']) && empty($row['glyph_media'])) {
                    $row['glyph_media'] = $media[str_ends_with($row['glyph_position'] ?? 'top-right', 'left') ? 'work-left' : 'work-right'];
                }
            }
            unset($row);
        }
        if ($type === 'how_we_do_it') {
            foreach ($block['cards'] as $index => &$card) {
                if (empty($card['text_top']) && empty($card['text_bottom'])) $card['text_top'] = $copy[$index % count($copy)];
            }
            unset($card);
        }
    }
    unset($block);
    if (!get_option('trichis_home_artwork_backup_v1')) add_option('trichis_home_artwork_backup_v1', ['page_id' => $id, 'blocks' => $raw], '', false);
    update_field('field_page_page_blocks', $blocks, $id);
    WP_CLI::success('Four optimized glyphs installed; empty homepage glyph slots and card paragraphs updated. Existing editor content preserved.');
});
