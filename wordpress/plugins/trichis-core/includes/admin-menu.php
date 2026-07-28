<?php
/**
 * Admin menu cleanup.
 *
 * Target order: Dashboard · Pages · Projects · Services · Media ·
 * Site Settings · Deploy · Forms — with unused core items hidden and
 * developer tooling (GraphQL, ACF) kept at the bottom.
 */

if (!defined('ABSPATH')) exit;

// Hide unused core menus: blog posts and comments are not used by the site.
add_action('admin_menu', function () {
    remove_menu_page('edit.php');          // Posts
    remove_menu_page('edit-comments.php'); // Comments
}, 999);

// Enforce a predictable top-level order.
add_filter('custom_menu_order', '__return_true');
add_filter('menu_order', function ($menu_order) {
    $desired = [
        'index.php',
        'separator1',
        'edit.php?post_type=page',
        'edit.php?post_type=project',
        'edit.php?post_type=service',
        'upload.php',
        'separator2',
        'site-settings',
        'trichis-deploy',
        'edit.php?post_type=af_form',
    ];

    $rest = array_values(array_diff($menu_order, $desired));
    return array_merge($desired, $rest);
});
