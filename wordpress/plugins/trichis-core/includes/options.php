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
        'menu_order'         => 0,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'navigation',
    ]);

    // ── Footer ──
    acf_add_local_field_group([
        'key'    => 'group_site_footer',
        'title'  => 'Footer',
        'fields' => [
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
        'menu_order'         => 1,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'footer',
    ]);

    // ── Home content (sections that were hard-coded in nine-ca) ──
    acf_add_local_field_group([
        'key'    => 'group_site_home_content',
        'title'  => 'Home Content',
        'fields' => [
            [
                'key'        => 'field_home_how_we_do_it',
                'label'      => 'How we do it',
                'name'       => 'how_we_do_it',
                'type'       => 'group',
                'layout'     => 'block',
                'sub_fields' => [
                    [
                        'key'   => 'field_hwdi_title',
                        'label' => 'Title',
                        'name'  => 'title',
                        'type'  => 'text',
                    ],
                    [
                        'key'   => 'field_hwdi_text',
                        'label' => 'Text',
                        'name'  => 'text',
                        'type'  => 'textarea',
                        'rows'  => 2,
                    ],
                    [
                        'key'   => 'field_hwdi_text2',
                        'label' => 'Text 2',
                        'name'  => 'text2',
                        'type'  => 'textarea',
                        'rows'  => 2,
                    ],
                    [
                        'key'          => 'field_hwdi_cards',
                        'label'        => 'Cards',
                        'name'         => 'cards',
                        'type'         => 'repeater',
                        'layout'       => 'block',
                        'button_label' => 'Add Card',
                        'sub_fields'   => [
                            [
                                'key'   => 'field_hwdi_card_title',
                                'label' => 'Title',
                                'name'  => 'title',
                                'type'  => 'text',
                            ],
                            [
                                'key'   => 'field_hwdi_card_text_top',
                                'label' => 'Text top',
                                'name'  => 'text_top',
                                'type'  => 'textarea',
                                'rows'  => 3,
                            ],
                            [
                                'key'   => 'field_hwdi_card_text_bottom',
                                'label' => 'Text bottom',
                                'name'  => 'text_bottom',
                                'type'  => 'textarea',
                                'rows'  => 3,
                            ],
                        ],
                    ],
                ],
            ],
            [
                'key'        => 'field_home_what_we_do',
                'label'      => 'What we do',
                'name'       => 'what_we_do',
                'type'       => 'group',
                'layout'     => 'block',
                'sub_fields' => [
                    [
                        'key'   => 'field_wwd_title',
                        'label' => 'Title',
                        'name'  => 'title',
                        'type'  => 'text',
                    ],
                    [
                        'key'   => 'field_wwd_text',
                        'label' => 'Text',
                        'name'  => 'text',
                        'type'  => 'textarea',
                        'rows'  => 2,
                    ],
                    [
                        'key'   => 'field_wwd_text2',
                        'label' => 'Text 2',
                        'name'  => 'text2',
                        'type'  => 'textarea',
                        'rows'  => 2,
                    ],
                ],
            ],
            [
                'key'        => 'field_home_what_weve_created',
                'label'      => "What we've created",
                'name'       => 'what_weve_created',
                'type'       => 'group',
                'layout'     => 'block',
                'sub_fields' => [
                    [
                        'key'   => 'field_wwc_title',
                        'label' => 'Title',
                        'name'  => 'title',
                        'type'  => 'text',
                    ],
                    [
                        'key'   => 'field_wwc_text',
                        'label' => 'Text',
                        'name'  => 'text',
                        'type'  => 'textarea',
                        'rows'  => 2,
                    ],
                    [
                        'key'   => 'field_wwc_text2',
                        'label' => 'Text 2',
                        'name'  => 'text2',
                        'type'  => 'textarea',
                        'rows'  => 3,
                    ],
                ],
            ],
            [
                'key'          => 'field_home_random_sentences',
                'label'        => 'Random sentences (hero / loader shuffle)',
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
            trichis_media_group('field_home_showreel', 'showreel', 'Showreel media'),
        ],
        'location' => [[
            ['param' => 'options_page', 'operator' => '==', 'value' => 'site-settings'],
        ]],
        'menu_order'         => 2,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'homeContent',
    ]);

    // ── Cookie banner ──
    acf_add_local_field_group([
        'key'    => 'group_site_cookie_banner',
        'title'  => 'Cookie Banner',
        'fields' => [
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
        ],
        'location' => [[
            ['param' => 'options_page', 'operator' => '==', 'value' => 'site-settings'],
        ]],
        'menu_order'         => 3,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'cookieBanner',
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
        'menu_order'         => 4,
        'show_in_graphql'    => 1,
        'graphql_field_name' => 'uiStrings',
    ]);
});
