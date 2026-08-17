<?php
/**
 * Per-record SEO. Attached to pages, projects and services alike; every field
 * is optional and falls back to the Site Settings defaults at render time.
 */

if (!defined('ABSPATH')) exit;

add_action('acf/init', function () {
    acf_add_local_field_group([
        'key'    => 'group_seo',
        'title'  => 'SEO',
        'fields' => [
            [
                'key'          => 'field_seo_title',
                'label'        => 'SEO title',
                'name'         => 'seo_title',
                'type'         => 'text',
                'instructions' => 'Leave empty to use the post title.',
            ],
            [
                'key'          => 'field_seo_description',
                'label'        => 'Meta description',
                'name'         => 'seo_description',
                'type'         => 'textarea',
                'rows'         => 3,
                'instructions' => 'Leave empty to use the site default.',
            ],
            [
                'key'           => 'field_seo_og_image',
                'label'         => 'Social share image',
                'name'          => 'og_image',
                'type'          => 'image',
                'return_format' => 'array',
                'preview_size'  => 'medium',
                'instructions'  => 'Leave empty to use the site default.',
                'wrapper'       => ['width' => '50'],
            ],
            [
                'key'          => 'field_seo_noindex',
                'label'        => 'Hide from search engines',
                'name'         => 'noindex',
                'type'         => 'true_false',
                'ui'           => 1,
                'instructions' => 'Adds a noindex robots tag.',
                'wrapper'      => ['width' => '50'],
            ],
        ],
        'location' => [
            [['param' => 'post_type', 'operator' => '==', 'value' => 'page']],
            [['param' => 'post_type', 'operator' => '==', 'value' => 'project']],
            [['param' => 'post_type', 'operator' => '==', 'value' => 'service']],
        ],
        'menu_order'         => 20,
        'position'           => 'normal',
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'seo',
    ]);
});
