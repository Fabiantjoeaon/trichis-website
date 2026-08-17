<?php
/**
 * Site Settings — single options page.
 *
 * Holds everything that was hard-coded in nine-ca (navigation, footer,
 * "How we do it" cards, section intros, loader sentences, cookie banner) so
 * it becomes CMS-managed. Queried headlessly via `siteSettings`.
 */

if (!defined('ABSPATH')) exit;

add_action('acf/init', function () {
    if (function_exists('acf_add_options_page')) {
        acf_add_options_page([
            'page_title'         => 'Site Settings',
            'menu_title'         => 'Site Settings',
            'menu_slug'          => 'site-settings',
            'capability'         => 'edit_posts',
            'icon_url'           => 'dashicons-admin-site-alt3',
            'position'           => 27,
            'show_in_graphql'    => true,
            'graphql_field_name' => 'siteSettings',
        ]);
    }

    // ── General / branding / SEO defaults ──
    acf_add_local_field_group([
        'key'    => 'group_site_general',
        'title'  => 'General',
        'fields' => [
            [
                'key'     => 'field_general_site_name',
                'label'   => 'Site name',
                'name'    => 'site_name',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key'           => 'field_general_logo',
                'label'         => 'Logo',
                'name'          => 'logo',
                'type'          => 'image',
                'return_format' => 'array',
                'preview_size'  => 'medium',
                'wrapper'       => ['width' => '25'],
            ],
            [
                'key'           => 'field_general_logo_alt',
                'label'         => 'Logo (alternate)',
                'name'          => 'logo_alt',
                'type'          => 'image',
                'return_format' => 'array',
                'preview_size'  => 'medium',
                'instructions'  => 'Inverted variant for dark backgrounds.',
                'wrapper'       => ['width' => '25'],
            ],
            [
                'key'           => 'field_general_favicon',
                'label'         => 'Favicon',
                'name'          => 'favicon',
                'type'          => 'image',
                'return_format' => 'array',
                'wrapper'       => ['width' => '50'],
            ],
            [
                'key'          => 'field_general_seo_title_suffix',
                'label'        => 'SEO title suffix',
                'name'         => 'seo_title_suffix',
                'type'         => 'text',
                'instructions' => 'Appended to every page title, e.g. " — Trichis".',
                'wrapper'      => ['width' => '50'],
            ],
            [
                'key'          => 'field_general_seo_description',
                'label'        => 'Default meta description',
                'name'         => 'seo_default_description',
                'type'         => 'textarea',
                'rows'         => 3,
            ],
            [
                'key'           => 'field_general_seo_og_image',
                'label'         => 'Default social share image',
                'name'          => 'seo_default_og_image',
                'type'          => 'image',
                'return_format' => 'array',
                'preview_size'  => 'medium',
            ],
        ],
        'location' => [[
            ['param' => 'options_page', 'operator' => '==', 'value' => 'site-settings'],
        ]],
        'menu_order'         => 0,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'general',
    ]);

    // ── Navigation ──
    acf_add_local_field_group([
        'key'    => 'group_site_nav',
        'title'  => 'Navigation',
        'fields' => [
            [
                'key'          => 'field_main_nav_links',
                'label'        => 'Menu links',
                'name'         => 'nav_links',
                'type'         => 'repeater',
                'layout'       => 'table',
                'button_label' => 'Add Link',
                'instructions' => 'Links shown in the full-screen menu.',
                'sub_fields'   => [
                    [
                        'key'     => 'field_main_nav_link_label',
                        'label'   => 'Label',
                        'name'    => 'label',
                        'type'    => 'text',
                        'wrapper' => ['width' => '50'],
                    ],
                    [
                        'key'          => 'field_main_nav_link_path',
                        'label'        => 'Path',
                        'name'         => 'path',
                        'type'         => 'text',
                        'instructions' => 'e.g. /projects or /about-us',
                        'wrapper'      => ['width' => '50'],
                    ],
                ],
            ],
            [
                'key'          => 'field_menu_footer_links',
                'label'        => 'Menu footer links (socials)',
                'name'         => 'menu_footer_links',
                'type'         => 'repeater',
                'layout'       => 'table',
                'button_label' => 'Add Link',
                'sub_fields'   => [
                    [
                        'key'     => 'field_menu_footer_link_label',
                        'label'   => 'Label',
                        'name'    => 'label',
                        'type'    => 'text',
                        'wrapper' => ['width' => '50'],
                    ],
                    [
                        'key'     => 'field_menu_footer_link_url',
                        'label'   => 'URL',
                        'name'    => 'url',
                        'type'    => 'text',
                        'wrapper' => ['width' => '50'],
                    ],
                ],
            ],
        ],
        'location' => [[
            ['param' => 'options_page', 'operator' => '==', 'value' => 'site-settings'],
        ]],
        'menu_order'         => 1,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'navigation',
    ]);

    // ── Footer ──
    acf_add_local_field_group([
        'key'    => 'group_site_footer',
        'title'  => 'Footer',
        'fields' => [
            [
                'key'     => 'field_footer_lead_head',
                'label'   => 'Lead heading',
                'name'    => 'footer_lead_head',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key'     => 'field_footer_lead_body',
                'label'   => 'Lead body',
                'name'    => 'footer_lead_body',
                'type'    => 'textarea',
                'rows'    => 3,
            ],
            [
                'key'          => 'field_footer_offices',
                'label'        => 'Offices',
                'name'         => 'footer_offices',
                'type'         => 'repeater',
                'layout'       => 'block',
                'button_label' => 'Add Office',
                'sub_fields'   => [
                    [
                        'key'     => 'field_footer_office_city',
                        'label'   => 'City',
                        'name'    => 'city',
                        'type'    => 'text',
                        'wrapper' => ['width' => '40'],
                    ],
                    [
                        'key'       => 'field_footer_office_address',
                        'label'     => 'Address',
                        'name'      => 'address',
                        'type'      => 'textarea',
                        'rows'      => 3,
                        'new_lines' => 'br',
                        'wrapper'   => ['width' => '60'],
                    ],
                    [
                        'key'     => 'field_footer_office_phone',
                        'label'   => 'Phone',
                        'name'    => 'phone',
                        'type'    => 'text',
                        'wrapper' => ['width' => '50'],
                    ],
                    [
                        'key'          => 'field_footer_office_phone_href',
                        'label'        => 'Phone link',
                        'name'         => 'phone_href',
                        'type'         => 'text',
                        'instructions' => 'Leave empty to derive a tel: link from the number.',
                        'wrapper'      => ['width' => '50'],
                    ],
                ],
            ],
            [
                'key'     => 'field_footer_email',
                'label'   => 'Email',
                'name'    => 'footer_email',
                'type'    => 'email',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key'     => 'field_footer_phone',
                'label'   => 'Phone',
                'name'    => 'footer_phone',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key'          => 'field_footer_social_links',
                'label'        => 'Social links',
                'name'         => 'footer_social_links',
                'type'         => 'repeater',
                'layout'       => 'table',
                'button_label' => 'Add Link',
                'sub_fields'   => [
                    [
                        'key'     => 'field_footer_social_label',
                        'label'   => 'Label',
                        'name'    => 'label',
                        'type'    => 'text',
                        'wrapper' => ['width' => '50'],
                    ],
                    [
                        'key'     => 'field_footer_social_url',
                        'label'   => 'URL',
                        'name'    => 'url',
                        'type'    => 'text',
                        'wrapper' => ['width' => '50'],
                    ],
                ],
            ],
            [
                'key'          => 'field_footer_legal_items',
                'label'        => 'Legal / bottom bar items',
                'name'         => 'footer_legal_items',
                'type'         => 'repeater',
                'layout'       => 'table',
                'button_label' => 'Add Item',
                'sub_fields'   => [
                    [
                        'key'     => 'field_footer_legal_label',
                        'label'   => 'Text',
                        'name'    => 'label',
                        'type'    => 'text',
                        'wrapper' => ['width' => '60'],
                    ],
                    [
                        'key'     => 'field_footer_legal_url',
                        'label'   => 'Link (optional)',
                        'name'    => 'url',
                        'type'    => 'text',
                        'wrapper' => ['width' => '40'],
                    ],
                ],
            ],
            [
                'key'          => 'field_footer_cta_title',
                'label'        => 'CTA footer — title',
                'name'         => 'footer_cta_title',
                'type'         => 'textarea',
                'rows'         => 2,
                'wrapper'      => ['width' => '50'],
            ],
            [
                'key'     => 'field_footer_cta_text',
                'label'   => 'CTA footer — button label',
                'name'    => 'footer_cta_text',
                'type'    => 'text',
                'wrapper' => ['width' => '25'],
            ],
            [
                'key'     => 'field_footer_cta_link',
                'label'   => 'CTA footer — button link',
                'name'    => 'footer_cta_link',
                'type'    => 'text',
                'wrapper' => ['width' => '25'],
            ],
        ],
        'location' => [[
            ['param' => 'options_page', 'operator' => '==', 'value' => 'site-settings'],
        ]],
        'menu_order'         => 2,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'footer',
    ]);

    // ── Interface ──
    //
    // Chrome that belongs to no single page. The former "Home Content" group
    // lived here too; its sections are now page blocks (how_we_do_it,
    // home_what_we_do, home_what_weve_created, home_hero) so an editor can
    // place and reorder them like any other section.
    acf_add_local_field_group([
        'key'    => 'group_site_interface',
        'title'  => 'Interface',
        'fields' => [
            [
                'key'          => 'field_home_random_sentences',
                'label'        => 'Random sentences (loader shuffle)',
                'name'         => 'random_sentences',
                'type'         => 'repeater',
                'layout'       => 'table',
                'button_label' => 'Add Sentence',
                'sub_fields'   => [
                    [
                        'key'   => 'field_home_random_sentence_text',
                        'label' => 'Text',
                        'name'  => 'text',
                        'type'  => 'text',
                    ],
                ],
            ],
        ],
        'location' => [[
            ['param' => 'options_page', 'operator' => '==', 'value' => 'site-settings'],
        ]],
        'menu_order'         => 4,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'interfaceSettings',
    ]);

    // ── Cookie banner ──
    acf_add_local_field_group([
        'key'    => 'group_site_cookie_banner',
        'title'  => 'Cookie Banner',
        'fields' => [
            [
                'key'   => 'field_cookie_title',
                'label' => 'Title',
                'name'  => 'cookie_title',
                'type'  => 'text',
            ],
            [
                'key'   => 'field_cookie_message',
                'label' => 'Message',
                'name'  => 'cookie_message',
                'type'  => 'textarea',
                'rows'  => 3,
            ],
            [
                'key'     => 'field_cookie_accept',
                'label'   => 'Accept label',
                'name'    => 'cookie_accept',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key'     => 'field_cookie_reject',
                'label'   => 'Reject label',
                'name'    => 'cookie_reject',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key'     => 'field_cookie_more_label',
                'label'   => 'More info label',
                'name'    => 'cookie_more_label',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key'           => 'field_cookie_privacy_document',
                'label'         => 'Privacy document',
                'name'          => 'privacy_document',
                'type'          => 'file',
                'return_format' => 'array',
                'instructions'  => 'The "more info" link is hidden when this is empty.',
                'wrapper'       => ['width' => '50'],
            ],
        ],
        'location' => [[
            ['param' => 'options_page', 'operator' => '==', 'value' => 'site-settings'],
        ]],
        'menu_order'         => 3,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'cookieBanner',
    ]);

    // ── 404 ──
    //
    // Not a WP page: the 404 route is prerendered and has no slug to look up,
    // so its copy has to resolve from settings alone.
    acf_add_local_field_group([
        'key'    => 'group_site_not_found',
        'title'  => '404 page',
        'fields' => [
            [
                'key'   => 'field_not_found_title',
                'label' => 'Title',
                'name'  => 'not_found_title',
                'type'  => 'text',
            ],
            [
                'key'     => 'field_not_found_cta_text',
                'label'   => 'CTA text',
                'name'    => 'not_found_cta_text',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key'     => 'field_not_found_cta_link',
                'label'   => 'CTA link',
                'name'    => 'not_found_cta_link',
                'type'    => 'text',
                'wrapper' => ['width' => '50'],
            ],
        ],
        'location' => [[
            ['param' => 'options_page', 'operator' => '==', 'value' => 'site-settings'],
        ]],
        'menu_order'         => 5,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'notFound',
    ]);

    // ── UI strings (interface copy previously hardcoded in the frontend) ──
    acf_add_local_field_group([
        'key'    => 'group_site_ui_strings',
        'title'  => 'UI Strings',
        'fields' => [
            [
                'key'          => 'field_ui_strings',
                'label'        => 'Strings',
                'name'         => 'ui_strings',
                'type'         => 'repeater',
                'layout'       => 'table',
                'button_label' => 'Add String',
                'instructions' => 'Interface copy (button labels, section headings, empty states). The key identifies where the string is used — do not change keys, only the text.',
                'sub_fields'   => [
                    [
                        'key'     => 'field_ui_string_key',
                        'label'   => 'Key',
                        'name'    => 'string_key',
                        'type'    => 'text',
                        'wrapper' => ['width' => '40'],
                    ],
                    [
                        'key'     => 'field_ui_string_text',
                        'label'   => 'Text',
                        'name'    => 'text',
                        'type'    => 'text',
                        'wrapper' => ['width' => '60'],
                    ],
                ],
            ],
        ],
        'location' => [[
            ['param' => 'options_page', 'operator' => '==', 'value' => 'site-settings'],
        ]],
        'menu_order'         => 6,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'uiStrings',
    ]);
});
