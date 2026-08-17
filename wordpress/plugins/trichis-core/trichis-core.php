<?php
/**
 * Plugin Name: Trichis Core
 * Description: Content model for the Trichis headless site: post types, taxonomies, the shared block library, ACF field groups, site settings, admin menu, the forms REST adapter and the DatoCMS seeder.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) exit;

define('TRICHIS_CORE_DIR', __DIR__);

require_once TRICHIS_CORE_DIR . '/includes/post-types.php';
require_once TRICHIS_CORE_DIR . '/includes/taxonomies.php';
require_once TRICHIS_CORE_DIR . '/includes/media-fields.php';
require_once TRICHIS_CORE_DIR . '/includes/blocks.php';
require_once TRICHIS_CORE_DIR . '/includes/field-groups/page.php';
require_once TRICHIS_CORE_DIR . '/includes/field-groups/project.php';
require_once TRICHIS_CORE_DIR . '/includes/field-groups/service.php';
require_once TRICHIS_CORE_DIR . '/includes/field-groups/seo.php';
require_once TRICHIS_CORE_DIR . '/includes/options.php';
require_once TRICHIS_CORE_DIR . '/includes/admin-menu.php';
require_once TRICHIS_CORE_DIR . '/includes/rest-forms.php';
require_once TRICHIS_CORE_DIR . '/includes/deploy.php';

if (defined('WP_CLI') && WP_CLI) {
    require_once TRICHIS_CORE_DIR . '/includes/cli/seed.php';
}
