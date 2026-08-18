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
