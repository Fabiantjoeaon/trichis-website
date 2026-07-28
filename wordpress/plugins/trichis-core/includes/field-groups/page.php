<?php
/**
 * Page builder for WP Pages. Every page is composed from the shared block
 * library. `page_key` tells the headless frontend which route a page powers.
 * Cover media mirror the DatoCMS Page coverImage/mobileCoverImage fields.
 */

if (!defined('ABSPATH')) exit;

add_action('acf/init', function () {
    acf_add_local_field_group([
        'key'    => 'group_page_builder',
        'title'  => 'Page Builder',
        'fields' => [
            [
                'key'          => 'field_page_key',
                'label'        => 'Page',
                'name'         => 'page_key',
                'type'         => 'select',
                'choices'      => [
                    'home'       => 'Homepage',
                    'about'      => 'About us',
                    'whatWeDo'   => 'What we do',
                    'projects'   => 'Projects overview',
                    'custom'     => 'Custom page',
                ],
                'default_value' => 'custom',
                'instructions'  => 'Which route on the website this page powers.',
                'wrapper'       => ['width' => '50'],
            ],
            trichis_media_group('field_page_cover', 'cover', 'Cover media'),
            trichis_media_group('field_page_mobile_cover', 'mobile_cover', 'Mobile cover media'),
            trichis_page_blocks_field('page', trichis_blocks_for_context('page')),
        ],
        'location' => [[
            ['param' => 'post_type', 'operator' => '==', 'value' => 'page'],
        ]],
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'pageBuilder',
    ]);
});
