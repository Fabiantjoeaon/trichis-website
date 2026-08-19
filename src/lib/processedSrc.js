// Media URLs may come from three places:
//   1. WordPress uploads (local or Flywheel) — rewritten to a same-origin
//      `/wp-uploads/...` proxy so WebGL can read pixels without CORS.
//   2. The Dato/Mux CDN (seed mode) — rewritten to the R2 mirror, which
//      already sends Access-Control-Allow-Origin.
//   3. Site-relative paths (`/video/...`) — left alone.

const R2_PUBLIC_URL =
  import.meta.env.PUBLIC_R2_PUBLIC_URL || import.meta.env.R2_PUBLIC_URL;

const WP_UPLOADS = /^https?:\/\/[^/]+\/wp-content\/uploads\/(.+)$/i;

const MIRRORED_HOSTS = [
  /datocms-assets\.com\/(.*)/,
  /stream\.mux\.com\/(.*)/,
  /image\.mux\.com\/(.*)/,
];

export function getProcessedSrc(srcUrl) {
  if (!srcUrl) return srcUrl;

  const uploads = srcUrl.match(WP_UPLOADS);
  if (uploads) return `/wp-uploads/${uploads[1]}`;

  if (!R2_PUBLIC_URL) return srcUrl;

  for (const host of MIRRORED_HOSTS) {
    const match = srcUrl.match(host);
    if (match) return `${R2_PUBLIC_URL}/${match[1]}`;
  }

  return srcUrl;
}
