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
 *   cta_section      ← CtasectionRecord
 *   form_section     ← FormSectionRecord
 *   section_line     ← SectionlineRecord
 *   scrolling_title  ← ScrollingTitleRecord
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
                        'toolbar'           => 'basic',
                        'media_upload'      => 0,
                        'conditional_logic' => [[[
                            'field'    => "field_{$ctx}_blk_column_row_column_type",
                            'operator' => '==',
                            'value'    => 'text',
                        ]]],
                    ]),
                    trichis_bf($ctx, 'column_row', 'align', [
                        'label'         => 'Text align',
                        'type'          => 'select',
                        'choices'       => [
                            'left'   => 'Left',
                            'center' => 'Center',
                            'right'  => 'Right',
                            'bottom' => 'Bottom',
                        ],
                        'default_value' => 'left',
                        'wrapper'       => ['width' => '34'],
                        'conditional_logic' => [[[
                            'field'    => "field_{$ctx}_blk_column_row_column_type",
                            'operator' => '==',
                            'value'    => 'text',
                        ]]],
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
                        'label'   => 'Width (%)',
                        'type'    => 'number',
                        'min'     => 0,
                        'max'     => 100,
                        'wrapper' => ['width' => '15'],
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

/**
 * Which blocks each context offers. Mirrors the DatoCMS modular content
 * configuration per model in nine-ca.
 */
function trichis_blocks_for_context(string $ctx): array {
    switch ($ctx) {
        case 'page':
            return [
                'page_header', 'project_header', 'cta_section', 'form_section',
                'column_row', 'project_numbers', 'paragraph', 'section_line',
                'scrolling_title',
            ];
        case 'project':
            return ['project_header', 'column_row', 'project_numbers', 'paragraph'];
        case 'service':
            return ['section_line', 'scrolling_title', 'column_row'];
        default:
            return [];
    }
}
