<?php
/**
 * Custom post types. All exposed via REST + WPGraphQL for the headless frontend.
 *
 * Mirrors the nine-ca DatoCMS models: Project, Service. "Pages" reuse the core
 * WP page post type (see field-groups/page.php).
 */

if (!defined('ABSPATH')) exit;

function trichis_register_post_types() {

    register_post_type('project', [
        'labels'              => ['name' => 'Projects', 'singular_name' => 'Project'],
        'public'              => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'project',
        'graphql_plural_name' => 'projects',
        'supports'            => ['title', 'thumbnail', 'slug'],
        'has_archive'         => true,
        'rewrite'             => ['slug' => 'project'],
        'menu_icon'           => 'dashicons-portfolio',
        'menu_position'       => 21,
    ]);

    register_post_type('service', [
        'labels'              => ['name' => 'Services', 'singular_name' => 'Service'],
        'public'              => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'service',
        'graphql_plural_name' => 'services',
        'supports'            => ['title', 'slug'],
        'has_archive'         => false,
        'rewrite'             => ['slug' => 'service'],
        'menu_icon'           => 'dashicons-hammer',
        'menu_position'       => 22,
    ]);
}
add_action('init', 'trichis_register_post_types');
