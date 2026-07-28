<?php
/**
 * FORMS — Advanced Forms for ACF as the source of truth.
 *
 * Architecture:
 *  - Editors define forms in WP Admin → Forms (Advanced Forms for ACF). They
 *    add ACF field groups and attach them to the form via the AF location rule
 *    `Form == <form name>`.
 *  - The headless frontend POSTs JSON to /wp-json/trichis/v1/forms/{form_key}.
 *  - This REST adapter is thin: it validates the payload against AF/ACF field
 *    metadata, builds an AF submission object, and fires `af/form/submission`.
 *  - AF then auto-creates an `af_entry` post (visible under Forms → Entries),
 *    sends emails configured per-form by editors, and fires any AF integrations.
 *
 * The two site forms (quickscan, contact — previously Netlify Forms in
 * nine-ca) are bootstrapped on activation; their field groups are created by
 * the seeder from the DatoCMS FormSection definitions.
 *
 * AF is REQUIRED. If it is deactivated the REST endpoint returns 503 and an
 * admin notice explains how to recover.
 */

if (!defined('ABSPATH')) exit;

const TRICHIS_FORM_KEYS = ['form_quickscan', 'form_contact'];

// REST endpoints — POST to submit, GET to fetch the form schema.
add_action('rest_api_init', function () {
    register_rest_route('trichis/v1', '/forms/(?P<form_key>[a-z0-9_-]+)', [
        [
            'methods'             => WP_REST_Server::READABLE,
            'permission_callback' => '__return_true',
            'callback'            => 'trichis_handle_form_schema',
        ],
        [
            'methods'             => WP_REST_Server::CREATABLE,
            'permission_callback' => '__return_true',
            'callback'            => 'trichis_handle_form_submission',
        ],
    ]);
});

/**
 * GET /wp-json/trichis/v1/forms/{form_key}
 * Returns the form's metadata and field schema so the frontend can render
 * inputs dynamically without hardcoding field names.
 */
function trichis_handle_form_schema(WP_REST_Request $request) {
    if (!function_exists('af_get_form')) {
        return new WP_Error('af_required', 'Advanced Forms for ACF is required.', ['status' => 503]);
    }

    $form_key = trichis_resolve_form_key((string) $request['form_key']);
    $form     = af_get_form($form_key);
    if (!$form) {
        return new WP_Error('form_not_found', sprintf('Unknown form "%s".', $form_key), ['status' => 404]);
    }

    $field_groups = af_get_form_field_groups($form_key);
    $fields       = [];
    foreach ($field_groups as $group) {
        foreach ((array) acf_get_fields($group) as $f) {
            if (empty($f['name'])) continue;
            $fields[] = [
                'name'         => $f['name'],
                'label'        => $f['label'] ?? $f['name'],
                'type'         => $f['type'] ?? 'text',
                'required'     => (bool) ($f['required'] ?? false),
                'placeholder'  => $f['placeholder'] ?? '',
                'instructions' => $f['instructions'] ?? '',
                'default'      => $f['default_value'] ?? '',
                'choices'      => $f['choices'] ?? null,
                'maxlength'    => $f['maxlength'] ?? null,
                'width'        => $f['wrapper']['width'] ?? '',
                'autocomplete' => trichis_guess_autocomplete($f['name'], $f['type'] ?? 'text'),
            ];
        }
    }

    return new WP_REST_Response([
        'key'    => $form['key'],
        'id'     => $form['post_id'] ?? 0,
        'title'  => $form['title'] ?? '',
        'display' => [
            'description'     => $form['display']['description'] ?? '',
            'success_message' => $form['display']['success_message'] ?? '',
        ],
        'fields' => $fields,
    ], 200);
}

function trichis_resolve_form_key(string $raw): string {
    $key = sanitize_key($raw);
    return str_starts_with($key, 'form_') ? $key : 'form_' . $key;
}

function trichis_guess_autocomplete(string $name, string $type): string {
    $map = [
        'firstname'  => 'given-name',
        'first_name' => 'given-name',
        'lastname'   => 'family-name',
        'last_name'  => 'family-name',
        'fullname'   => 'name',
        'name'       => 'name',
        'email'      => 'email',
        'phone'      => 'tel',
        'tel'        => 'tel',
        'organization' => 'organization',
        'company'    => 'organization',
        'role'       => 'organization-title',
        'title'      => 'organization-title',
    ];
    if (isset($map[$name])) return $map[$name];
    if ($type === 'email') return 'email';
    if ($type === 'url')   return 'url';
    return 'on';
}

function trichis_handle_form_submission(WP_REST_Request $request) {
    if (!function_exists('af_get_form')) {
        return new WP_Error(
            'af_required',
            'Advanced Forms for ACF is required but not active.',
            ['status' => 503]
        );
    }

    $form_key = trichis_resolve_form_key((string) $request['form_key']);

    $form = af_get_form($form_key);
    if (!$form) {
        return new WP_Error('form_not_found', sprintf('Unknown form "%s".', $form_key), ['status' => 404]);
    }

    $field_groups = af_get_form_field_groups($form_key);
    if (!$field_groups) {
        return new WP_Error(
            'form_no_fields',
            sprintf('Form "%s" has no fields. Attach an ACF field group to it in the AF admin.', $form_key),
            ['status' => 500]
        );
    }

    $body = (array) ($request->get_json_params() ?: $request->get_body_params());

    [$af_fields, $values, $errors] = trichis_build_af_fields($field_groups, $body);

    if ($errors) {
        return new WP_REST_Response(['ok' => false, 'errors' => $errors], 422);
    }

    // Populate AF()->submission so af_save_all_fields(), AF emails and any
    // af/form/submission listeners (entry creation, integrations) can run.
    $args = [
        'redirect'    => null,
        'filter_mode' => false,
        'source'      => 'headless-rest',
        'lang'        => 'nl',
    ];
    $submission = [
        'form'       => $form,
        'args'       => $args,
        'fields'     => $af_fields,
        'errors'     => [],
        'origin_url' => esc_url_raw((string) ($request->get_header('referer') ?: '')),
    ];
    AF()->submission = $submission;

    do_action('af/form/before_submission', $form, $af_fields, $args);
    do_action('af/form/before_submission/key=' . $form['key'], $form, $af_fields, $args);

    do_action('af/form/submission', $form, $af_fields, $args);
    do_action('af/form/submission/key=' . $form['key'], $form, $af_fields, $args);

    $entry_id = AF()->submission['entry'] ?? 0;

    return new WP_REST_Response([
        'ok'              => true,
        'entry_id'        => $entry_id,
        'success_message' => $form['display']['success_message'] ?? '',
        'values'          => $values,
    ], $entry_id ? 201 : 200);
}

/**
 * Walk the form's field groups, validate JSON payload, and build the AF-shaped
 * fields array (each entry annotated with `_input` and `value`) that AF expects
 * on AF()->submission['fields'].
 *
 * @return array{0: array<int, array>, 1: array<string, mixed>, 2: array<string, string>}
 *               [af_fields, sanitized_values, errors]
 */
function trichis_build_af_fields(array $field_groups, array $body): array {
    $af_fields = [];
    $values    = [];
    $errors    = [];

    foreach ($field_groups as $group) {
        $fields = (array) acf_get_fields($group);
        foreach ($fields as $field) {
            $name = $field['name'] ?? '';
            if (!$name) continue;

            $raw   = array_key_exists($name, $body) ? $body[$name] : '';
            $label = $field['label'] ?? $name;
            $type  = $field['type'] ?? 'text';

            $clean = is_string($raw) ? trim($raw) : $raw;

            if (!empty($field['required']) && ($clean === '' || $clean === null || $clean === [])) {
                $errors[$name] = sprintf('%s is required.', $label);
                continue;
            }

            $sanitized = $clean;
            if ($clean !== '' && $clean !== null) {
                switch ($type) {
                    case 'email':
                        if (!is_email($clean)) {
                            $errors[$name] = sprintf('%s must be a valid email.', $label);
                            continue 2;
                        }
                        $sanitized = sanitize_email($clean);
                        break;
                    case 'url':
                        $sanitized = esc_url_raw($clean);
                        break;
                    case 'textarea':
                    case 'wysiwyg':
                        $sanitized = sanitize_textarea_field((string) $clean);
                        break;
                    default:
                        $sanitized = is_scalar($clean) ? sanitize_text_field((string) $clean) : $clean;
                }
            }

            $values[$name] = $sanitized;

            $field['_input'] = $sanitized;
            $field['value']  = function_exists('acf_format_value') ? acf_format_value($sanitized, 0, $field) : $sanitized;
            $af_fields[]     = $field;
        }
    }

    return [$af_fields, $values, $errors];
}

// Bootstrap the site form posts on activation so the seeder / editors can
// attach field groups to them. Runs again on admin loads as a self-heal.
register_activation_hook(TRICHIS_CORE_DIR . '/trichis-core.php', 'trichis_bootstrap_forms');
add_action('admin_init', 'trichis_bootstrap_forms');

function trichis_bootstrap_forms() {
    if (!function_exists('af_form_post_from_key')) return;

    $titles = [
        'form_quickscan' => 'Quickscan',
        'form_contact'   => 'Contact',
    ];

    foreach (TRICHIS_FORM_KEYS as $key) {
        if (af_form_post_from_key($key)) continue;

        $form_post_id = wp_insert_post([
            'post_type'   => 'af_form',
            'post_title'  => $titles[$key] ?? $key,
            'post_status' => 'publish',
        ], true);

        if (is_wp_error($form_post_id)) continue;

        update_post_meta($form_post_id, 'form_key', $key);
        update_post_meta($form_post_id, 'form_create_entries', 1);
        update_post_meta($form_post_id, '_form_create_entries', 'field_form_create_entries');
    }
}

// CORS — allow the headless frontend to POST to the REST endpoint.
add_action('rest_api_init', function () {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function ($value) {
        $origin  = get_http_origin();
        $allowed = array_filter(array_map('trim', explode(',', (string) getenv('TRICHIS_ALLOWED_ORIGINS'))));
        if (defined('TRICHIS_ALLOWED_ORIGINS')) {
            $allowed = array_merge($allowed, array_map('trim', explode(',', TRICHIS_ALLOWED_ORIGINS)));
        }
        if (!$allowed) {
            $allowed = ['http://localhost:4321', 'http://localhost:3000'];
        }
        if ($origin && in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
            header('Access-Control-Allow-Credentials: false');
            header('Access-Control-Allow-Headers: Authorization, Content-Type');
            header('Vary: Origin');
        }
        return $value;
    });
}, 15);

// Hard requirement notice — AF must be active.
add_action('admin_notices', function () {
    if (function_exists('af_get_form')) return;
    if (!current_user_can('activate_plugins')) return;

    echo '<div class="notice notice-error"><p><strong>Trichis:</strong> ';
    echo 'The site forms require the <em>Advanced Forms for ACF</em> plugin. The /wp-json/trichis/v1/forms endpoint will return 503 until it is activated. ';
    echo '<a href="' . esc_url(admin_url('plugins.php?s=Advanced+Forms')) . '">Open plugins</a> · ';
    echo '<a href="' . esc_url(admin_url('plugin-install.php?s=Advanced+Forms&tab=search')) . '">Install</a>.';
    echo '</p></div>';
});
