<?php
/**
 * Project fields. Mirrors the DatoCMS Project model: year, featured flags,
 * cover / mobile cover / featured media (image-or-video), plus the modular
 * content blocks. Deliverables are a taxonomy (see taxonomies.php).
 */

if (!defined('ABSPATH')) exit;

add_action('acf/init', function () {
    acf_add_local_field_group([
        'key'    => 'group_project_details',
        'title'  => 'Project',
        'fields' => [
            [
                'key'     => 'field_project_year',
                'label'   => 'Year',
                'name'    => 'year',
                'type'    => 'text',
                'wrapper' => ['width' => '34'],
            ],
            [
                'key'     => 'field_project_featured',
                'label'   => 'Featured on homepage',
                'name'    => 'featured',
                'type'    => 'true_false',
                'ui'      => 1,
                'wrapper' => ['width' => '33'],
            ],
            [
                'key'     => 'field_project_featured_order',
                'label'   => 'Featured order',
                'name'    => 'featured_order',
                'type'    => 'number',
                'wrapper' => ['width' => '33'],
            ],
            trichis_media_group('field_project_cover', 'cover', 'Cover media'),
            trichis_media_group('field_project_mobile_cover', 'mobile_cover', 'Mobile cover media'),
            trichis_media_group('field_project_featured_media', 'featured_media', 'Featured media (homepage)'),
            trichis_page_blocks_field('project', trichis_blocks_for_context('project')),
        ],
        'location' => [[
            ['param' => 'post_type', 'operator' => '==', 'value' => 'project'],
        ]],
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'projectDetails',
    ]);
});
