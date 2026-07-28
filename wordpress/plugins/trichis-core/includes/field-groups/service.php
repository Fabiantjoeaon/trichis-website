<?php
/**
 * Service fields. Mirrors the DatoCMS Service model: header group (big hero
 * text, paragraph, CTA) plus modular content blocks.
 */

if (!defined('ABSPATH')) exit;

add_action('acf/init', function () {
    acf_add_local_field_group([
        'key'    => 'group_service_details',
        'title'  => 'Service',
        'fields' => [
            [
                'key'        => 'field_service_header',
                'label'      => 'Header',
                'name'       => 'header',
                'type'       => 'group',
                'layout'     => 'block',
                'sub_fields' => [
                    [
                        'key'   => 'field_service_header_text',
                        'label' => 'Header text',
                        'name'  => 'header_text',
                        'type'  => 'textarea',
                        'rows'  => 2,
                    ],
                    [
                        'key'   => 'field_service_header_paragraph',
                        'label' => 'Paragraph',
                        'name'  => 'paragraph',
                        'type'  => 'textarea',
                        'rows'  => 4,
                    ],
                    [
                        'key'     => 'field_service_header_cta_text',
                        'label'   => 'CTA text',
                        'name'    => 'cta_text',
                        'type'    => 'text',
                        'wrapper' => ['width' => '50'],
                    ],
                    [
                        'key'     => 'field_service_header_cta_url',
                        'label'   => 'CTA URL',
                        'name'    => 'cta_url',
                        'type'    => 'text',
                        'wrapper' => ['width' => '50'],
                    ],
                ],
            ],
            trichis_page_blocks_field('service', trichis_blocks_for_context('service')),
        ],
        'location' => [[
            ['param' => 'post_type', 'operator' => '==', 'value' => 'service'],
        ]],
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'serviceDetails',
    ]);
});
