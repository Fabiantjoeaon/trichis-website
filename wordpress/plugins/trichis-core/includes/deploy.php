<?php
/**
 * Netlify deploy trigger.
 *
 * The frontend is a static Astro build that only reflects WordPress content at
 * build time. This module pings a Netlify build hook whenever content changes
 * so the site rebuilds automatically.
 *
 * The build hook URL can be set in WP Admin → Deploy, or hard coded via the
 * TRICHIS_NETLIFY_BUILD_HOOK constant (e.g. in wp-config.php), which takes
 * precedence and hides the field from the UI.
 *
 * Auto-deploy can be forced on/off with TRICHIS_NETLIFY_AUTO_DEPLOY (constant
 * or env). When set, it overrides the admin checkbox.
 */

if (!defined('ABSPATH')) exit;

const TRICHIS_DEPLOY_HOOK_OPTION   = 'trichis_netlify_build_hook';
const TRICHIS_DEPLOY_AUTO_OPTION   = 'trichis_netlify_auto_deploy';
const TRICHIS_DEPLOY_STATUS_OPTION = 'trichis_netlify_last_deploy';
const TRICHIS_DEPLOY_CRON_EVENT    = 'trichis_netlify_deploy_event';
const TRICHIS_DEPLOY_DELAY         = 45; // seconds — coalesces bursts of edits into one build.

function trichis_deploy_env($key) {
    if (defined($key) && constant($key)) {
        return (string) constant($key);
    }
    foreach ([getenv($key), $_ENV[$key] ?? null, $_SERVER[$key] ?? null] as $value) {
        if ($value !== false && $value !== null && $value !== '') {
            return (string) $value;
        }
    }
    return '';
}

function trichis_deploy_hook_url() {
    $from_env = trim(trichis_deploy_env('TRICHIS_NETLIFY_BUILD_HOOK'));
    if ($from_env) return $from_env;
    return trim((string) get_option(TRICHIS_DEPLOY_HOOK_OPTION, ''));
}

function trichis_deploy_hook_is_locked() {
    return trichis_deploy_env('TRICHIS_NETLIFY_BUILD_HOOK') !== '';
}

function trichis_deploy_parse_bool($value) {
    if (is_bool($value)) return $value;
    $v = strtolower(trim((string) $value));
    if (in_array($v, ['1', 'true', 'yes', 'on'], true)) return true;
    if (in_array($v, ['0', 'false', 'no', 'off', ''], true)) return false;
    return (bool) $value;
}

function trichis_deploy_auto_is_locked() {
    if (defined('TRICHIS_NETLIFY_AUTO_DEPLOY')) return true;
    return getenv('TRICHIS_NETLIFY_AUTO_DEPLOY') !== false;
}

function trichis_deploy_auto_enabled() {
    if (defined('TRICHIS_NETLIFY_AUTO_DEPLOY')) {
        return trichis_deploy_parse_bool(TRICHIS_NETLIFY_AUTO_DEPLOY);
    }
    $env = getenv('TRICHIS_NETLIFY_AUTO_DEPLOY');
    if ($env !== false) {
        return trichis_deploy_parse_bool($env);
    }
    return (bool) get_option(TRICHIS_DEPLOY_AUTO_OPTION, '1');
}

function trichis_deploy_fire($trigger = 'manual') {
    $url = trichis_deploy_hook_url();
    if (!$url) return false;

    $response = wp_remote_post($url, [
        'timeout'  => 15,
        'blocking' => true,
        'body'     => wp_json_encode(['trigger_title' => 'WP: ' . $trigger]),
        'headers'  => ['Content-Type' => 'application/json'],
    ]);

    $ok   = !is_wp_error($response) && wp_remote_retrieve_response_code($response) < 300;
    $code = is_wp_error($response) ? $response->get_error_message() : wp_remote_retrieve_response_code($response);

    update_option(TRICHIS_DEPLOY_STATUS_OPTION, [
        'time'    => time(),
        'ok'      => $ok,
        'code'    => $code,
        'trigger' => $trigger,
    ], false);

    return $ok;
}

function trichis_deploy_schedule($trigger = 'content update') {
    if (!trichis_deploy_hook_url()) return;
    if (!trichis_deploy_auto_enabled()) return;
    if (wp_next_scheduled(TRICHIS_DEPLOY_CRON_EVENT)) return;

    wp_schedule_single_event(time() + TRICHIS_DEPLOY_DELAY, TRICHIS_DEPLOY_CRON_EVENT, [$trigger]);
}
add_action(TRICHIS_DEPLOY_CRON_EVENT, 'trichis_deploy_fire', 10, 1);

// ── Content change triggers ──────────────────────────────────────────────

function trichis_deploy_watched_post_types() {
    return ['page', 'project', 'service'];
}

add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if (wp_is_post_revision($post) || wp_is_post_autosave($post)) return;
    if (!in_array($post->post_type, trichis_deploy_watched_post_types(), true)) return;
    if ($new_status !== 'publish' && $old_status !== 'publish') return;

    trichis_deploy_schedule($post->post_type . ' updated');
}, 10, 3);

foreach (['created_term', 'edited_term', 'delete_term'] as $term_hook) {
    add_action($term_hook, function ($term_id, $tt_id, $taxonomy) {
        if ($taxonomy !== 'deliverable') return;
        trichis_deploy_schedule('deliverable updated');
    }, 10, 3);
}

// Site Settings (navigation, footer, UI strings, …) are ACF options.
add_action('acf/save_post', function ($post_id) {
    if ($post_id === 'options' || (is_string($post_id) && strpos($post_id, 'options') === 0)) {
        trichis_deploy_schedule('site settings updated');
    }
}, 20);

// ── Admin UI ─────────────────────────────────────────────────────────────

add_action('admin_menu', function () {
    add_menu_page(
        'Deploy',
        'Deploy',
        'manage_options',
        'trichis-deploy',
        'trichis_deploy_render_page',
        'dashicons-cloud-upload',
        28
    );
}, 100);

add_action('admin_init', function () {
    register_setting('trichis_deploy', TRICHIS_DEPLOY_HOOK_OPTION, ['sanitize_callback' => 'esc_url_raw']);
    register_setting('trichis_deploy', TRICHIS_DEPLOY_AUTO_OPTION, [
        'sanitize_callback' => fn($v) => $v ? '1' : '',
    ]);
});

add_action('admin_post_trichis_deploy_now', function () {
    if (!current_user_can('manage_options')) wp_die('Unauthorized');
    check_admin_referer('trichis_deploy_now');

    $ok = trichis_deploy_fire('manual');
    wp_safe_redirect(add_query_arg(
        'trichis_deploy',
        $ok ? 'ok' : 'fail',
        admin_url('admin.php?page=trichis-deploy')
    ));
    exit;
});

function trichis_deploy_render_page() {
    $locked      = trichis_deploy_hook_is_locked();
    $auto_locked = trichis_deploy_auto_is_locked();
    $status      = get_option(TRICHIS_DEPLOY_STATUS_OPTION);
    $auto        = trichis_deploy_auto_enabled();
    $notice      = $_GET['trichis_deploy'] ?? '';
    ?>
    <div class="wrap">
        <h1>Deploy</h1>
        <p>The site is a static build. When content changes, WordPress pings
           a <strong>Netlify build hook</strong> to rebuild and publish the changes.</p>

        <?php if ($notice === 'ok'): ?>
            <div class="notice notice-success is-dismissible"><p>Build triggered. It takes a minute or two to go live.</p></div>
        <?php elseif ($notice === 'fail'): ?>
            <div class="notice notice-error is-dismissible"><p>Could not trigger the build. Check the build hook URL below.</p></div>
        <?php endif; ?>

        <form method="post" action="options.php">
            <?php settings_fields('trichis_deploy'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="<?php echo esc_attr(TRICHIS_DEPLOY_HOOK_OPTION); ?>">Netlify build hook URL</label></th>
                    <td>
                        <?php if ($locked): ?>
                            <p><code>Set via TRICHIS_NETLIFY_BUILD_HOOK constant.</code></p>
                        <?php else: ?>
                            <input type="url" class="regular-text" style="width:38rem;max-width:100%"
                                   id="<?php echo esc_attr(TRICHIS_DEPLOY_HOOK_OPTION); ?>"
                                   name="<?php echo esc_attr(TRICHIS_DEPLOY_HOOK_OPTION); ?>"
                                   value="<?php echo esc_attr(get_option(TRICHIS_DEPLOY_HOOK_OPTION, '')); ?>"
                                   placeholder="https://api.netlify.com/build_hooks/…">
                            <p class="description">Netlify → Site configuration → Build &amp; deploy → Build hooks → Add build hook.</p>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Automatic deploys</th>
                    <td>
                        <?php if ($auto_locked): ?>
                            <p>
                                <code>TRICHIS_NETLIFY_AUTO_DEPLOY</code> is
                                <strong><?php echo $auto ? 'on' : 'off'; ?></strong>
                                (set via constant or environment).
                            </p>
                            <p class="description">Manual “Deploy now” still works when auto-deploy is off.</p>
                        <?php else: ?>
                            <label>
                                <input type="checkbox" name="<?php echo esc_attr(TRICHIS_DEPLOY_AUTO_OPTION); ?>" value="1" <?php checked($auto); ?>>
                                Rebuild automatically when content changes
                            </label>
                            <p class="description">Edits made within <?php echo (int) TRICHIS_DEPLOY_DELAY; ?>s of each other are grouped into a single build. Override with <code>TRICHIS_NETLIFY_AUTO_DEPLOY</code>.</p>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>
            <?php submit_button('Save settings'); ?>
        </form>

        <hr>
        <h2>Deploy now</h2>
        <p>Trigger a rebuild immediately without changing content.</p>
        <?php if (!trichis_deploy_hook_url()): ?>
            <p class="description">Save a Netlify build hook URL above first. Deploy now will fail until one is set.</p>
        <?php endif; ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="trichis_deploy_now">
            <?php wp_nonce_field('trichis_deploy_now'); ?>
            <?php submit_button('Deploy now', 'primary', 'submit', false); ?>
        </form>

        <?php if (is_array($status) && !empty($status['time'])): ?>
            <p style="margin-top:1rem">
                <strong>Last deploy:</strong>
                <?php echo esc_html(wp_date('j M Y H:i', $status['time'])); ?>
                — <?php echo $status['ok'] ? 'success' : 'failed'; ?>
                (<?php echo esc_html((string) $status['code']); ?>, <?php echo esc_html($status['trigger']); ?>)
            </p>
        <?php endif; ?>
    </div>
    <?php
}

// Quick "Deploy" button in the admin toolbar.
add_action('admin_bar_menu', function ($bar) {
    if (!current_user_can('manage_options') || !trichis_deploy_hook_url()) return;
    $bar->add_node([
        'id'    => 'trichis-deploy',
        'title' => 'Deploy',
        'href'  => wp_nonce_url(admin_url('admin-post.php?action=trichis_deploy_now'), 'trichis_deploy_now'),
        'meta'  => ['title' => 'Rebuild the site now'],
    ]);
}, 100);

// Clean up the scheduled event on plugin deactivation.
register_deactivation_hook(TRICHIS_CORE_DIR . '/trichis-core.php', function () {
    wp_clear_scheduled_hook(TRICHIS_DEPLOY_CRON_EVENT);
});
