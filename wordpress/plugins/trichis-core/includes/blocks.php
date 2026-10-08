<?php
/**
 * Shared block library.
 *
 * Each block mirrors a DatoCMS modular-content record from nine-ca:
 *
 *   page_header      ← PageheaderRecord
 *   project_header   ← ProjectheaderRecord
 *   paragraph        ← ParagraphRecord
 *   column_row       ← ColumnrowRecord (Image/Text/Empty columns)
 *   project_numbers  ← ProjectnumberRecord
 *   accordion        ← AccordionRecord
 *   cta_section      ← CtasectionRecord
 *   form_section     ← FormSectionRecord
 *   section_line     ← SectionlineRecord
 *   scrolling_title  ← ScrollingTitleRecord
 *
 * A second set of blocks (home_hero, home_who_we_are, home_what_we_do,
 * home_what_weve_created, how_we_do_it, home_showreel, link_band, about_hero,
 * about_intro, offices, expertises, service_teaser) has no DatoCMS ancestor.
 * Those lift the sections that used to be hard-coded into React, so the home,
 * about and what-we-do routes become ordinary editable pages.
 *
 * Every content type gets the same flexible content field (`page_blocks`),
 * assembled from block layouts defined once in this file. A "context" prefix
 * keeps ACF field keys globally unique per content type.
 */

if (!defined('ABSPATH')) exit;

/**
 * Build the `page_blocks` flexible content field for a context.
 *
 * @param string   $ctx         Unique context slug, e.g. 'page', 'project', 'service'.
 * @param string[] $block_names Blocks to enable for this context (registry keys below).
 */
function trichis_page_blocks_field(string $ctx, array $block_names): array {
    $layouts = [];
    foreach ($block_names as $name) {
        $fn = "trichis_block_{$name}";
        if (function_exists($fn)) {
            $layouts["layout_{$ctx}_{$name}"] = $fn($ctx);
        }
    }

    return [
        'key'          => "field_{$ctx}_page_blocks",
        'label'        => 'Content Blocks',
        'name'         => 'page_blocks',
        'type'         => 'flexible_content',
        'button_label' => 'Add Block',
        'instructions' => 'Build the page by stacking blocks. Drag to reorder.',
        'layouts'      => $layouts,
    ];
}

/** Shorthand for a block sub field with a context-unique key. */
function trichis_bf(string $ctx, string $block, string $name, array $def): array {
    return array_merge([
        'key'  => "field_{$ctx}_blk_{$block}_{$name}",
        'name' => $name,
    ], $def);
}

/** Shorthand for a media sub field inside a block. */
function trichis_block_media(string $ctx, string $block, string $name, string $label): array {
    return trichis_media_group("field_{$ctx}_blk_{$block}_{$name}", $name, $label);
}

/** Decorative artwork only; video is not a glyph. */
function trichis_block_glyph(string $ctx, string $block): array {
    $field = trichis_block_media($ctx, $block, 'glyph_media', 'Yellow glyph artwork (optional)');
    $field['mime_types'] = 'jpg,jpeg,png,webp,gif,svg,avif';
    $field['instructions'] = 'Uses the supplied yellow glyph by default. Select another image to replace it.';
    return $field;
}

// ─────────────────────────────────────────
// Header blocks
// ─────────────────────────────────────────

function trichis_block_page_header(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_page_header",
        'name'       => 'page_header',
        'label'      => 'Page Header',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'page_header', 'section_title', [
                'label'   => 'Section title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'page_header', 'title', [
                'label'   => 'Title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'page_header', 'title_bottom', [
                'label'   => 'Title bottom line',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'page_header', 'paragraph', [
                'label'        => 'Paragraph',
                'type'         => 'wysiwyg',
                'toolbar'      => 'basic',
                'media_upload' => 0,
            ]),
            trichis_bf($ctx, 'page_header', 'cta_text', [
                'label'   => 'CTA text',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'page_header', 'cta_link', [
                'label'   => 'CTA link',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
        ],
    ];
}

function trichis_block_project_header(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_project_header",
        'name'       => 'project_header',
        'label'      => 'Project Header',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'project_header', 'section_title', [
                'label'   => 'Section title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'project_header', 'big_title', [
                'label'   => 'Big title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'project_header', 'paragraph_header', [
                'label'        => 'Paragraph header',
                'type'         => 'text',
                'instructions' => 'Small meta line above the paragraph, e.g. "2023 - New beer brand - Website".',
            ]),
            trichis_bf($ctx, 'project_header', 'paragraph', [
                'label' => 'Paragraph',
                'type'  => 'textarea',
                'rows'  => 4,
            ]),
        ],
    ];
}

// ─────────────────────────────────────────
// Text blocks
// ─────────────────────────────────────────

function trichis_block_paragraph(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_paragraph",
        'name'       => 'paragraph',
        'label'      => 'Paragraph',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'paragraph', 'content', [
                'label'        => 'Content',
                'type'         => 'wysiwyg',
                'toolbar'      => 'basic',
                'media_upload' => 0,
            ]),
        ],
    ];
}

function trichis_block_section_line(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_section_line",
        'name'       => 'section_line',
        'label'      => 'Section Line',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'section_line', 'title', [
                'label' => 'Title',
                'type'  => 'text',
            ]),
        ],
    ];
}

function trichis_block_scrolling_title(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_scrolling_title",
        'name'       => 'scrolling_title',
        'label'      => 'Scrolling Title (marquee)',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'scrolling_title', 'text', [
                'label' => 'Text',
                'type'  => 'text',
            ]),
        ],
    ];
}

// ─────────────────────────────────────────
// Layout blocks
// ─────────────────────────────────────────

function trichis_block_column_glyphs(string $ctx): array {
    $fields = [
        trichis_bf($ctx, 'column_glyph', 'variant', [
            'label' => 'Artwork', 'type' => 'select', 'default_value' => 'services',
            'choices' => ['services' => 'Loop', 'work-left' => 'Left loop', 'work-right' => 'Right loop', 'question' => 'Question mark'],
        ]),
        trichis_block_glyph($ctx, 'column_glyph'),
        trichis_bf($ctx, 'column_glyph', 'column', [
            'label' => 'Anchor column', 'type' => 'number', 'min' => 0, 'step' => 1, 'default_value' => 0,
            'instructions' => '0 = entire row content area; 1 = first column, 2 = second column, etc.',
        ]),
    ];
    foreach ([
        'x' => ['Horizontal offset (%)', 0, -100, 200],
        'y' => ['Vertical offset (%)', 50, -100, 200],
        'width' => ['Width (% of anchor)', 30, 5, 150],
        'rotation' => ['Rotation (degrees)', 0, -180, 180],
        'mobile_x' => ['Mobile horizontal offset (%)', null, -100, 200],
        'mobile_y' => ['Mobile vertical offset (%)', null, -100, 200],
        'mobile_width' => ['Mobile width (% of anchor)', null, 5, 150],
    ] as $name => [$label, $default, $min, $max]) {
        $fields[] = trichis_bf($ctx, 'column_glyph', $name, [
            'label' => $label, 'type' => 'number', 'default_value' => $default,
            'min' => $min, 'max' => $max, 'wrapper' => ['width' => '33'],
            'instructions' => str_starts_with($name, 'mobile_') ? 'Leave blank to inherit the desktop value.' : '',
        ]);
    }
    $fields[] = trichis_bf($ctx, 'column_glyph', 'flip', ['label' => 'Mirror horizontally', 'type' => 'true_false', 'ui' => 1]);
    $fields[] = trichis_bf($ctx, 'column_glyph', 'hide_on_mobile', ['label' => 'Hide on mobile', 'type' => 'true_false', 'ui' => 1]);
    $fields[] = trichis_bf($ctx, 'column_glyph', 'layer', [
        'label' => 'Layer', 'type' => 'select', 'default_value' => 'above',
        'choices' => ['above' => 'Above images', 'behind' => 'Behind images'],
    ]);
    return trichis_bf($ctx, 'column_row', 'glyphs', [
        'label' => 'Decorative glyphs', 'type' => 'repeater', 'layout' => 'block',
        'button_label' => 'Add Glyph', 'sub_fields' => $fields,
        'instructions' => 'The centre of the glyph is positioned at the offsets: 0/0 = top left, 100/100 = bottom right. Negative offsets extend outside the anchor. Existing rows have no glyphs until you add one.',
    ]);
}

function trichis_block_column_row(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_column_row",
        'name'       => 'column_row',
        'label'      => 'Column Row',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'column_row', 'columns', [
                'label'        => 'Columns',
                'type'         => 'repeater',
                'layout'       => 'block',
                'button_label' => 'Add Column',
                'sub_fields'   => [
                    trichis_bf($ctx, 'column_row', 'column_type', [
                        'label'         => 'Type',
                        'type'          => 'select',
                        'choices'       => [
                            'image' => 'Image / Video',
                            'text'  => 'Text',
                            'empty' => 'Empty (spacer)',
                        ],
                        'default_value' => 'image',
                        'wrapper'       => ['width' => '30'],
                    ]),
                    trichis_bf($ctx, 'column_row', 'width', [
                        'label'        => 'Width (%)',
                        'type'         => 'number',
                        'min'          => 0,
                        'max'          => 100,
                        'wrapper'      => ['width' => '35'],
                    ]),
                    trichis_bf($ctx, 'column_row', 'mobile_width', [
                        'label'   => 'Mobile width (%)',
                        'type'    => 'number',
                        'min'     => 0,
                        'max'     => 100,
                        'wrapper' => ['width' => '35'],
                    ]),
                    trichis_media_group("field_{$ctx}_blk_column_row_media", 'media', 'Media'),
                    trichis_bf($ctx, 'column_row', 'text', [
                        'label'             => 'Text',
                        'type'              => 'wysiwyg',
                        'toolbar'           => 'full',
                        'tabs'              => 'all',
                        'instructions'      => 'Rich text and HTML are supported, including headings, links, blockquotes and text alignment. For a quote attribution, add a <cite> inside the <blockquote> in Text mode.',
                        'media_upload'      => 0,
                        'conditional_logic' => [[[
                            'field'    => "field_{$ctx}_blk_column_row_column_type",
                            'operator' => '==',
                            'value'    => 'text',
                        ]]],
                    ]),
                    trichis_bf($ctx, 'column_row', 'align', [
                        'label'         => 'Vertical alignment',
                        'type'          => 'select',
                        'choices'       => [
                            'left'   => 'Middle (legacy left)',
                            'top'    => 'Top',
                            'center' => 'Center',
                            'right'  => 'Middle (legacy right)',
                            'bottom' => 'Bottom',
                        ],
                        'default_value' => 'center',
                        'wrapper'       => ['width' => '34'],
                        'conditional_logic' => [[[
                            'field'    => "field_{$ctx}_blk_column_row_column_type",
                            'operator' => '==',
                            'value'    => 'text',
                        ]]],
                    ]),
                    trichis_bf($ctx, 'column_row', 'text_align', [
                        'label' => 'Horizontal text alignment', 'type' => 'select',
                        'choices' => ['inherit' => 'Use editor formatting', 'left' => 'Left', 'center' => 'Centre', 'right' => 'Right'],
                        'default_value' => 'inherit',
                        'conditional_logic' => [[['field' => "field_{$ctx}_blk_column_row_column_type", 'operator' => '==', 'value' => 'text']]],
                    ]),
                    trichis_bf($ctx, 'column_row', 'cta_text', [
                        'label'   => 'CTA text',
                        'type'    => 'text',
                        'wrapper' => ['width' => '33'],
                        'conditional_logic' => [[[
                            'field'    => "field_{$ctx}_blk_column_row_column_type",
                            'operator' => '==',
                            'value'    => 'text',
                        ]]],
                    ]),
                    trichis_bf($ctx, 'column_row', 'cta_url', [
                        'label'   => 'CTA URL',
                        'type'    => 'text',
                        'wrapper' => ['width' => '33'],
                        'conditional_logic' => [[[
                            'field'    => "field_{$ctx}_blk_column_row_column_type",
                            'operator' => '==',
                            'value'    => 'text',
                        ]]],
                    ]),
                    trichis_bf($ctx, 'column_row', 'cta_is_external', [
                        'label'   => 'CTA opens externally',
                        'type'    => 'true_false',
                        'ui'      => 1,
                        'wrapper' => ['width' => '34'],
                        'conditional_logic' => [[[
                            'field'    => "field_{$ctx}_blk_column_row_column_type",
                            'operator' => '==',
                            'value'    => 'text',
                        ]]],
                    ]),
                ],
            ]),
            trichis_block_column_glyphs($ctx),
        ],
    ];
}

// ─────────────────────────────────────────
// Structured content blocks
// ─────────────────────────────────────────

function trichis_block_project_numbers(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_project_numbers",
        'name'       => 'project_numbers',
        'label'      => 'Project Numbers',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'project_numbers', 'section_title', [
                'label'        => 'Section title',
                'type'         => 'text',
                'instructions' => 'Small label above the block.',
                'wrapper'      => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'project_numbers', 'title_left', [
                'label'   => 'Title left',
                'type'    => 'textarea',
                'rows'    => 2,
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'project_numbers', 'title_right', [
                'label'   => 'Title right',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'project_numbers', 'numbers', [
                'label'        => 'Numbers',
                'type'         => 'repeater',
                'layout'       => 'table',
                'button_label' => 'Add Number',
                'sub_fields'   => [
                    trichis_bf($ctx, 'project_numbers', 'number', [
                        'label'   => 'Number',
                        'type'    => 'number',
                        'wrapper' => ['width' => '30'],
                    ]),
                    trichis_bf($ctx, 'project_numbers', 'text', [
                        'label'   => 'Text',
                        'type'    => 'text',
                        'wrapper' => ['width' => '70'],
                    ]),
                ],
            ]),
        ],
    ];
}

function trichis_block_accordion(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_accordion",
        'name'       => 'accordion',
        'label'      => 'Accordion',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'accordion', 'title', [
                'label'   => 'Title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_block_media($ctx, 'accordion', 'media', 'Media'),
            trichis_bf($ctx, 'accordion', 'items', [
                'label'        => 'Items',
                'type'         => 'repeater',
                'layout'       => 'block',
                'button_label' => 'Add Item',
                'sub_fields'   => [
                    trichis_bf($ctx, 'accordion', 'question', [
                        'label' => 'Question',
                        'type'  => 'text',
                    ]),
                    trichis_bf($ctx, 'accordion', 'answer', [
                        'label' => 'Answer',
                        'type'  => 'wysiwyg',
                        'toolbar' => 'basic',
                        'media_upload' => 0,
                    ]),
                ],
            ]),
        ],
    ];
}

function trichis_block_cta_section(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_cta_section",
        'name'       => 'cta_section',
        'label'      => 'CTA Section',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'cta_section', 'title', [
                'label'        => 'Title',
                'type'         => 'wysiwyg',
                'toolbar'      => 'basic',
                'media_upload' => 0,
            ]),
            trichis_bf($ctx, 'cta_section', 'cta_text', [
                'label'   => 'CTA text',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'cta_section', 'cta_link', [
                'label'   => 'CTA link',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
        ],
    ];
}

function trichis_block_form_section(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_form_section",
        'name'       => 'form_section',
        'label'      => 'Form Section',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'form_section', 'title', [
                'label'        => 'Title',
                'type'         => 'wysiwyg',
                'toolbar'      => 'basic',
                'media_upload' => 0,
            ]),
            trichis_bf($ctx, 'form_section', 'subtitle', [
                'label' => 'Subtitle',
                'type'  => 'text',
            ]),
            trichis_bf($ctx, 'form_section', 'form_name', [
                'label'        => 'Form key',
                'type'         => 'text',
                'instructions' => 'Advanced Forms key (e.g. quickscan or contact). Submissions POST to /wp-json/trichis/v1/forms/{key}.',
                'wrapper'      => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'form_section', 'cta_text', [
                'label'   => 'Submit button label',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'form_section', 'success_title', [
                'label'   => 'Success title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'form_section', 'success_message', [
                'label'        => 'Success message',
                'type'         => 'wysiwyg',
                'toolbar'      => 'basic',
                'media_upload' => 0,
                'wrapper'      => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'form_section', 'form_fields', [
                'label'        => 'Form fields',
                'type'         => 'repeater',
                'layout'       => 'block',
                'button_label' => 'Add Field',
                'sub_fields'   => [
                    trichis_bf($ctx, 'form_section', 'label', [
                        'label'   => 'Label',
                        'type'    => 'text',
                        'wrapper' => ['width' => '25'],
                    ]),
                    trichis_bf($ctx, 'form_section', 'name', [
                        'label'   => 'Name',
                        'type'    => 'text',
                        'wrapper' => ['width' => '25'],
                    ]),
                    trichis_bf($ctx, 'form_section', 'field_type', [
                        'label'         => 'Type',
                        'type'          => 'select',
                        'choices'       => [
                            'text'     => 'Text',
                            'email'    => 'Email',
                            'tel'      => 'Phone',
                            'textarea' => 'Textarea',
                            'select'   => 'Select',
                            'checkbox' => 'Checkbox',
                            'radio'    => 'Radio',
                        ],
                        'default_value' => 'text',
                        'wrapper'       => ['width' => '20'],
                    ]),
                    trichis_bf($ctx, 'form_section', 'required', [
                        'label'   => 'Required',
                        'type'    => 'true_false',
                        'ui'      => 1,
                        'wrapper' => ['width' => '15'],
                    ]),
                    trichis_bf($ctx, 'form_section', 'width', [
                        'label'         => 'Width',
                        'type'          => 'select',
                        'choices'       => [
                            'full' => 'Full',
                            'half' => 'Half',
                        ],
                        'default_value' => 'full',
                        'wrapper'       => ['width' => '15'],
                    ]),
                    trichis_bf($ctx, 'form_section', 'placeholder', [
                        'label'   => 'Placeholder',
                        'type'    => 'text',
                        'wrapper' => ['width' => '50'],
                    ]),
                    trichis_bf($ctx, 'form_section', 'options', [
                        'label'        => 'Options',
                        'type'         => 'textarea',
                        'rows'         => 3,
                        'instructions' => 'One option per line (select/checkbox/radio).',
                        'wrapper'      => ['width' => '50'],
                    ]),
                ],
            ]),
        ],
    ];
}

// ─────────────────────────────────────────
// Page section blocks
//
// These have no DatoCMS ancestor. They lift the sections that nine-ca (and,
// until now, Trichis) hard-coded into React out of the components, so the
// home, about and what-we-do routes become ordinary editable pages.
// ─────────────────────────────────────────

function trichis_block_home_hero(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_home_hero",
        'name'       => 'home_hero',
        'label'      => 'Home Hero (fullscreen showreel)',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'home_hero', 'fullscreen', [
                'label' => 'Fullscreen hero', 'type' => 'true_false', 'ui' => 1,
                'default_value' => 1,
                'instructions' => 'Fill the screen below the navigation. Disable for an inset hero.',
            ]),
            trichis_block_media($ctx, 'home_hero', 'media', 'Media (desktop)'),
            trichis_block_media($ctx, 'home_hero', 'mobile_media', 'Media (mobile)'),
        ],
    ];
}

function trichis_block_home_who_we_are(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_home_who_we_are",
        'name'       => 'home_who_we_are',
        'label'      => 'Who We Are',
        'display'    => 'block',
        'sub_fields' => [
            trichis_block_glyph($ctx, 'home_who_we_are'),
            trichis_bf($ctx, 'home_who_we_are', 'section_title', [
                'label'   => 'Section title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'home_who_we_are', 'body', [
                'label' => 'Body',
                'type'  => 'textarea',
                'rows'  => 4,
            ]),
        ],
    ];
}

function trichis_block_home_what_we_do(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_home_what_we_do",
        'name'       => 'home_what_we_do',
        'label'      => 'What We Do (service carousel)',
        'display'    => 'block',
        'sub_fields' => [
            trichis_block_glyph($ctx, 'home_what_we_do'),
            trichis_bf($ctx, 'home_what_we_do', 'section_title', [
                'label'   => 'Section title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'home_what_we_do', 'intro', [
                'label' => 'Intro',
                'type'  => 'textarea',
                'rows'  => 3,
            ]),
            trichis_bf($ctx, 'home_what_we_do', 'services', [
                'label'        => 'Services',
                'type'         => 'repeater',
                'layout'       => 'block',
                'button_label' => 'Add Service',
                'sub_fields'   => [
                    trichis_bf($ctx, 'home_what_we_do', 'label', [
                        'label'   => 'Label',
                        'type'    => 'text',
                        'wrapper' => ['width' => '50'],
                    ]),
                    trichis_bf($ctx, 'home_what_we_do', 'link', [
                        'label'        => 'Link',
                        'type'         => 'text',
                        'instructions' => 'e.g. /service/identity',
                        'wrapper'      => ['width' => '50'],
                    ]),
                    trichis_block_media($ctx, 'home_what_we_do', 'media', 'Media'),
                ],
            ]),
        ],
    ];
}

function trichis_block_home_what_weve_created(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_home_what_weve_created",
        'name'       => 'home_what_weve_created',
        'label'      => "What We've Created (featured projects)",
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'home_what_weve_created', 'section_title', [
                'label'   => 'Section title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'home_what_weve_created', 'project_rows', [
                'label' => 'Project rows', 'type' => 'repeater', 'layout' => 'block',
                'button_label' => 'Add project row',
                'instructions' => 'Drag to reorder. Empty uses featured projects. On phones widths are at least 70%. Glyph slots stay empty until artwork is supplied.',
                'sub_fields' => [
                    trichis_bf($ctx, 'home_what_weve_created', 'project_slug', [
                        'label' => 'Project', 'type' => 'select', 'ui' => 1,
                        'choices' => [], 'required' => 1,
                    ]),
                    trichis_bf($ctx, 'home_what_weve_created', 'width', [
                        'label' => 'Project width (%)', 'type' => 'number',
                        'min' => 20, 'max' => 100, 'default_value' => 66,
                    ]),
                    trichis_bf($ctx, 'home_what_weve_created', 'alignment', [
                        'label' => 'Alignment', 'type' => 'select',
                        'choices' => ['left' => 'Left', 'center' => 'Center', 'right' => 'Right'], 'default_value' => 'left',
                    ]),
                    trichis_bf($ctx, 'home_what_weve_created', 'image_ratio', [
                        'label' => 'Image shape', 'type' => 'select',
                        'choices' => ['landscape' => 'Landscape', 'portrait' => 'Portrait', 'square' => 'Square', 'wide' => 'Wide', 'original' => 'Original'], 'default_value' => 'landscape',
                    ]),
                    trichis_bf($ctx, 'home_what_weve_created', 'glyph_enabled', [
                        'label' => 'Show yellow glyph', 'type' => 'true_false', 'ui' => 1,
                    ]),
                    trichis_block_glyph($ctx, 'home_what_weve_created'),
                    trichis_bf($ctx, 'home_what_weve_created', 'glyph_position', [
                        'label' => 'Glyph position', 'type' => 'select',
                        'choices' => ['top-left' => 'Top left', 'top-right' => 'Top right', 'bottom-left' => 'Bottom left', 'bottom-right' => 'Bottom right'], 'default_value' => 'top-right',
                    ]),
                    trichis_bf($ctx, 'home_what_weve_created', 'glyph_width', [
                        'label' => 'Glyph width (% of row)', 'type' => 'number', 'min' => 10, 'max' => 60, 'default_value' => 35,
                    ]),
                    trichis_bf($ctx, 'home_what_weve_created', 'glyph_rotation', [
                        'label' => 'Glyph rotation (degrees)', 'type' => 'number', 'min' => -180, 'max' => 180, 'default_value' => 0,
                    ]),
                    trichis_bf($ctx, 'home_what_weve_created', 'glyph_flip', [
                        'label' => 'Mirror glyph horizontally', 'type' => 'true_false', 'ui' => 1,
                    ]),
                ],
            ]),
            trichis_bf($ctx, 'home_what_weve_created', 'cta_text', [
                'label'        => 'CTA text',
                'type'         => 'text',
                'instructions' => 'Basic HTML allowed, e.g. All our <strong>projects</strong>.',
                'wrapper'      => ['width' => '33'],
            ]),
            trichis_bf($ctx, 'home_what_weve_created', 'cta_link', [
                'label'   => 'CTA link',
                'type'    => 'text',
                'wrapper' => ['width' => '33'],
            ]),
        ],
    ];
}

function trichis_block_how_we_do_it(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_how_we_do_it",
        'name'       => 'how_we_do_it',
        'label'      => 'Wij zijn Trichis (cards)',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'how_we_do_it', 'title', [
                'label'   => 'Title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'how_we_do_it', 'intro', [
                'label' => 'Intro', 'type' => 'textarea', 'rows' => 4,
            ]),
            trichis_bf($ctx, 'how_we_do_it', 'cards', [
                'label'        => 'Cards',
                'type'         => 'repeater',
                'layout'       => 'block',
                'button_label' => 'Add Card',
                'sub_fields'   => [
                    trichis_bf($ctx, 'how_we_do_it', 'title', [
                        'key'   => "field_{$ctx}_blk_how_we_do_it_card_title",
                        'label' => 'Title',
                        'type'  => 'text',
                    ]),
                    trichis_bf($ctx, 'how_we_do_it', 'text_top', [
                        'label'   => 'Text top',
                        'type'    => 'textarea',
                        'rows'    => 3,
                        'wrapper' => ['width' => '50'],
                    ]),
                    trichis_bf($ctx, 'how_we_do_it', 'text_bottom', [
                        'label'   => 'Text bottom',
                        'type'    => 'textarea',
                        'rows'    => 3,
                        'wrapper' => ['width' => '50'],
                    ]),
                ],
            ]),
        ],
    ];
}

function trichis_block_home_showreel(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_home_showreel",
        'name'       => 'home_showreel',
        'label'      => 'Showreel (inline player)',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'home_showreel', 'text_top', [
                'label'   => 'Text top',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'home_showreel', 'text_bottom', [
                'label'   => 'Text bottom',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_block_media($ctx, 'home_showreel', 'media', 'Media (desktop)'),
            trichis_block_media($ctx, 'home_showreel', 'mobile_media', 'Media (mobile)'),
        ],
    ];
}

function trichis_block_link_band(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_link_band",
        'name'       => 'link_band',
        'label'      => 'Link Band (big centred link)',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'link_band', 'title', [
                'label'        => 'Title',
                'type'         => 'text',
                'instructions' => 'Basic HTML allowed, e.g. More About <strong>trichis</strong>.',
            ]),
            trichis_bf($ctx, 'link_band', 'link', [
                'label'   => 'Link',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
        ],
    ];
}

function trichis_block_service_hero(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_service_hero",
        'name'       => 'service_hero',
        'label'      => 'Service Hero',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'service_hero', 'title', [
                'label'   => 'Title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'service_hero', 'header_text', [
                'label'   => 'Header',
                'type'    => 'textarea',
                'rows'    => 2,
            ]),
            trichis_bf($ctx, 'service_hero', 'paragraph', [
                'label'        => 'Paragraph',
                'type'         => 'textarea',
                'rows'         => 4,
                'instructions' => 'Blank lines separate paragraphs. **Double asterisks** render bold.',
            ]),
            trichis_bf($ctx, 'service_hero', 'cta_text', [
                'label'   => 'CTA text',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'service_hero', 'cta_link', [
                'label'   => 'CTA link',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
        ],
    ];
}

function trichis_block_about_hero(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_about_hero",
        'name'       => 'about_hero',
        'label'      => 'About Hero (WebGL wordmark grid)',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'about_hero', 'brand_text', [
                'label'        => 'Wordmark',
                'type'         => 'text',
                'instructions' => 'Word cut out of the hero grid on desktop.',
                'wrapper'      => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'about_hero', 'brand_mobile', [
                'label'        => 'Wordmark (mobile)',
                'type'         => 'text',
                'instructions' => 'Usually a single character.',
                'wrapper'      => ['width' => '50'],
            ]),
        ],
    ];
}

function trichis_block_about_intro(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_about_intro",
        'name'       => 'about_intro',
        'label'      => 'About Intro',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'about_intro', 'section_title', [
                'label'   => 'Section title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'about_intro', 'scrolling_text', [
                'label'   => 'Scrolling text',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'about_intro', 'lead', [
                'label' => 'Lead paragraph',
                'type'  => 'textarea',
                'rows'  => 4,
            ]),
            trichis_bf($ctx, 'about_intro', 'cta_text', [
                'label'   => 'CTA text',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'about_intro', 'cta_link', [
                'label'   => 'CTA link',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_block_media($ctx, 'about_intro', 'image_a', 'Image A (small, left)'),
            trichis_block_media($ctx, 'about_intro', 'image_b', 'Image B (small, right)'),
            trichis_block_media($ctx, 'about_intro', 'image_wide', 'Image wide (full width)'),
            trichis_bf($ctx, 'about_intro', 'body', [
                'label' => 'Body',
                'type'  => 'textarea',
                'rows'  => 4,
            ]),
        ],
    ];
}

function trichis_block_offices(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_offices",
        'name'       => 'offices',
        'label'      => 'Offices',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'offices', 'section_title', [
                'label'   => 'Section title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'offices', 'intro', [
                'label' => 'Intro',
                'type'  => 'textarea',
                'rows'  => 2,
            ]),
            trichis_bf($ctx, 'offices', 'offices', [
                'label'        => 'Offices',
                'type'         => 'repeater',
                'layout'       => 'block',
                'button_label' => 'Add Office',
                'sub_fields'   => [
                    trichis_bf($ctx, 'offices', 'title', [
                        'label'        => 'Title',
                        'type'         => 'text',
                        'instructions' => 'Short label shown on the card, e.g. R\'dam.',
                        'wrapper'      => ['width' => '40'],
                    ]),
                    trichis_bf($ctx, 'offices', 'address', [
                        'label'        => 'Address',
                        'type'         => 'textarea',
                        'rows'         => 3,
                        'instructions' => 'One line per row.',
                        'wrapper'      => ['width' => '60'],
                    ]),
                    trichis_block_media($ctx, 'offices', 'media', 'Media'),
                ],
            ]),
        ],
    ];
}

function trichis_block_expertises(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_expertises",
        'name'       => 'expertises',
        'label'      => 'Expertises',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'expertises', 'section_title', [
                'label'   => 'Section title',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'expertises', 'heading', [
                'label'   => 'Heading',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'expertises', 'body', [
                'label' => 'Body',
                'type'  => 'textarea',
                'rows'  => 4,
            ]),
            trichis_bf($ctx, 'expertises', 'cta_text', [
                'label'   => 'CTA text',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'expertises', 'cta_link', [
                'label'   => 'CTA link',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
        ],
    ];
}

function trichis_block_service_teaser(string $ctx): array {
    return [
        'key'        => "layout_key_{$ctx}_service_teaser",
        'name'       => 'service_teaser',
        'label'      => 'Service Teaser',
        'display'    => 'block',
        'sub_fields' => [
            trichis_bf($ctx, 'service_teaser', 'section_title', [
                'label'        => 'Section title',
                'type'         => 'text',
                'instructions' => 'Leave empty to use "What we do - {full service name}".',
                'wrapper'      => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'service_teaser', 'full_service_name', [
                'label'        => 'Full service name',
                'type'         => 'text',
                'instructions' => 'Used in the section title when the name is split over two lines.',
                'wrapper'      => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'service_teaser', 'service_name', [
                'label'   => 'Service name',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'service_teaser', 'service_name_bottom', [
                'label'        => 'Service name (second line)',
                'type'         => 'text',
                'instructions' => 'For two-line treatments, e.g. "Web-" / "design".',
                'wrapper'      => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'service_teaser', 'paragraphs', [
                'label'        => 'Paragraphs',
                'type'         => 'repeater',
                'layout'       => 'block',
                'button_label' => 'Add Paragraph',
                'sub_fields'   => [
                    trichis_bf($ctx, 'service_teaser', 'text', [
                        'label' => 'Text',
                        'type'  => 'textarea',
                        'rows'  => 4,
                    ]),
                ],
            ]),
            trichis_bf($ctx, 'service_teaser', 'cta_text', [
                'label'        => 'CTA text',
                'type'         => 'text',
                'instructions' => 'Basic HTML allowed.',
                'wrapper'      => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'service_teaser', 'cta_link', [
                'label'   => 'CTA link',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            // Rows of media below the header. Each row lays its columns out
            // side by side, exactly like a Column Row block.
            trichis_bf($ctx, 'service_teaser', 'rows', [
                'label'        => 'Media rows',
                'type'         => 'repeater',
                'layout'       => 'block',
                'button_label' => 'Add Row',
                'sub_fields'   => [
                    trichis_bf($ctx, 'service_teaser', 'columns', [
                        'label'        => 'Columns',
                        'type'         => 'repeater',
                        'layout'       => 'block',
                        'button_label' => 'Add Column',
                        'sub_fields'   => [
                            trichis_bf($ctx, 'service_teaser', 'width', [
                                'label'   => 'Width (%)',
                                'type'    => 'number',
                                'min'     => 0,
                                'max'     => 100,
                                'wrapper' => ['width' => '30'],
                            ]),
                            trichis_block_media($ctx, 'service_teaser', 'media', 'Media'),
                        ],
                    ]),
                ],
            ]),
            // Optional closing text block, used by the Strategy teaser.
            trichis_bf($ctx, 'service_teaser', 'trailing_text', [
                'label' => 'Closing text',
                'type'  => 'textarea',
                'rows'  => 3,
            ]),
            trichis_bf($ctx, 'service_teaser', 'trailing_cta_text', [
                'label'   => 'Closing CTA text',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
            trichis_bf($ctx, 'service_teaser', 'trailing_cta_link', [
                'label'   => 'Closing CTA link',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ]),
        ],
    ];
}

/**
 * Which blocks each context offers. Projects and services mirror the DatoCMS
 * modular content configuration per model in nine-ca; pages get everything,
 * because the fixed routes (home, about, what we do) are pages too.
 */
function trichis_blocks_for_context(string $ctx): array {
    switch ($ctx) {
        case 'page':
            return [
                'page_header', 'project_header', 'cta_section', 'form_section',
                'column_row', 'project_numbers', 'accordion', 'paragraph',
                'section_line',
                'scrolling_title',
                'home_hero', 'home_who_we_are', 'home_what_we_do',
                'home_what_weve_created', 'how_we_do_it', 'home_showreel',
                'link_band', 'service_hero', 'about_hero', 'about_intro',
                'offices', 'expertises', 'service_teaser',
            ];
        case 'project':
            return ['project_header', 'section_line', 'column_row', 'project_numbers', 'accordion', 'paragraph', 'cta_section'];
        case 'service':
            return ['section_line', 'scrolling_title', 'column_row'];
        default:
            return [];
    }
}

// Store project slugs so both WordPress and the static frontend resolve the same row.
add_filter('acf/load_field/name=project_slug', function ($field) {
    if (!str_contains($field['key'], 'home_what_weve_created')) return $field;
    $field['choices'] = [];
    foreach (get_posts(['post_type' => 'project', 'numberposts' => -1, 'orderby' => 'title', 'order' => 'ASC']) as $project) {
        $field['choices'][$project->post_name] = $project->post_title;
    }
    return $field;
});
