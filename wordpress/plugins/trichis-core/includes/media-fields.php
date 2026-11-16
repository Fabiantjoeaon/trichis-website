<?php
/**
 * Reusable "media" field builder.
 *
 * One media library item, image or video. The front end decides how to render
 * it from the attachment's mime type, so an editor never has to say which it
 * is — swapping a still for a clip is just picking a different file.
 */

if (!defined('ABSPATH')) exit;

const TRICHIS_MEDIA_MIME_TYPES = 'jpg,jpeg,png,webp,gif,svg,avif,mp4,webm,mov,m4v';

/**
 * Build a media field.
 *
 * @param string $key   Globally unique ACF key, e.g. "field_project_cover".
 * @param string $name  Field name, e.g. "cover".
 * @param string $label Human label.
 */
function trichis_media_group(string $key, string $name, string $label): array {
    return [
        'key'           => $key,
        'label'         => $label,
        'name'          => $name,
        'type'          => 'file',
        'return_format' => 'array',
        'library'       => 'all',
        'mime_types'    => TRICHIS_MEDIA_MIME_TYPES,
        'instructions'  => 'Image or video from the media library.',
    ];
}

/**
 * A media field plus its optional phone variant, stored as `mobile_{$name}`.
 * The front end falls back to the desktop media when the mobile one is empty.
 *
 * @return array Two fields; spread into the surrounding field list.
 */
function trichis_media_pair(string $key, string $name, string $label): array {
    $mobile_key = str_ends_with($key, "_{$name}")
        ? substr($key, 0, -strlen($name)) . "mobile_{$name}"
        : "{$key}_mobile";

    $desktop = trichis_media_group($key, $name, $label);
    $mobile  = trichis_media_group($mobile_key, "mobile_{$name}", "{$label} (mobile)");
    $mobile['instructions'] = 'Optional. Shown on phones instead; leave empty to use the media on the left.';
    $desktop['wrapper'] = $mobile['wrapper'] = ['width' => '50'];

    return [$desktop, $mobile];
}
