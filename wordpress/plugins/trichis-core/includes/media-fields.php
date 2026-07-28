<?php
/**
 * Reusable "media" field builder.
 *
 * DatoCMS assets can be an image OR a video (Mux). A media group mirrors that:
 * an image field plus the Mux video metadata captured from DatoCMS
 * (streaming/HLS URL, playback ID, MP4 fallback, thumbnail). The frontend
 * renders the video when a streaming URL is present, else the image.
 */

if (!defined('ABSPATH')) exit;

/**
 * Build a media group field.
 *
 * @param string $key_prefix Globally unique ACF key prefix, e.g. "field_project_cover".
 * @param string $name       Field name, e.g. "cover".
 * @param string $label      Human label.
 */
function trichis_media_group(string $key_prefix, string $name, string $label): array {
    return [
        'key'        => $key_prefix,
        'label'      => $label,
        'name'       => $name,
        'type'       => 'group',
        'layout'     => 'block',
        'sub_fields' => [
            [
                'key'           => "{$key_prefix}_image",
                'label'         => 'Image',
                'name'          => 'image',
                'type'          => 'image',
                'return_format' => 'array',
                'preview_size'  => 'medium',
                'wrapper'       => ['width' => '40'],
            ],
            [
                'key'          => "{$key_prefix}_streaming_url",
                'label'        => 'Video streaming URL (HLS)',
                'name'         => 'video_streaming_url',
                'type'         => 'text',
                'instructions' => 'Mux HLS URL, e.g. https://stream.mux.com/{id}.m3u8. When set, the video is rendered instead of the image.',
                'wrapper'      => ['width' => '60'],
            ],
            [
                'key'     => "{$key_prefix}_mux_playback_id",
                'label'   => 'Mux playback ID',
                'name'    => 'video_mux_playback_id',
                'type'    => 'text',
                'wrapper' => ['width' => '33'],
            ],
            [
                'key'     => "{$key_prefix}_mp4_url",
                'label'   => 'Video MP4 URL',
                'name'    => 'video_mp4_url',
                'type'    => 'text',
                'wrapper' => ['width' => '34'],
            ],
            [
                'key'     => "{$key_prefix}_thumbnail_url",
                'label'   => 'Video thumbnail URL',
                'name'    => 'video_thumbnail_url',
                'type'    => 'text',
                'wrapper' => ['width' => '33'],
            ],
        ],
    ];
}
