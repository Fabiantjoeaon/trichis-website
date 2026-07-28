<?php
/**
 * Taxonomies. Deliverables mirror the DatoCMS `deliverables` links on projects
 * (e.g. "Landing page", "Webshop", "Rebranding").
 */

if (!defined('ABSPATH')) exit;

function trichis_register_taxonomies() {
    register_taxonomy('deliverable', ['project'], [
        'labels' => [
            'name'          => 'Deliverables',
            'singular_name' => 'Deliverable',
            'add_new_item'  => 'Add New Deliverable',
            'edit_item'     => 'Edit Deliverable',
            'search_items'  => 'Search Deliverables',
        ],
        'public'              => true,
        'hierarchical'        => false,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'deliverable',
        'graphql_plural_name' => 'deliverables',
        'rewrite'             => ['slug' => 'deliverable'],
    ]);
}
add_action('init', 'trichis_register_taxonomies');
