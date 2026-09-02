// Media URLs may come from three places:
//   1. WordPress uploads (local or Flywheel) — rewritten to a same-origin
//      `/wp-uploads/...` proxy so WebGL can read pixels without CORS.
//   2. The Dato/Mux CDN or its R2 mirror — rewritten to `/r2/...`, which
//      Netlify / the Vite proxy fetch from the bucket. The public r2.dev
//      host does not send Access-Control-Allow-Origin for this origin.
//   3. Site-relative paths (`/video/...`) — left alone.

const R2_PUBLIC_URL =
  import.meta.env.PUBLIC_R2_PUBLIC_URL || import.meta.env.R2_PUBLIC_URL;

const DEFAULT_R2_HOST = "pub-6d1ccefa62e04dcf8d87eb9cf388173b.r2.dev";

const WP_UPLOADS = /^https?:\/\/[^/]+\/wp-content\/uploads\/(.+)$/i;

const MIRRORED_HOSTS = [
  /datocms-assets\.com\/(.*)/,
  /stream\.mux\.com\/(.*)/,
  /image\.mux\.com\/(.*)/,
];

function r2Origin() {
  if (!R2_PUBLIC_URL) return `https://${DEFAULT_R2_HOST}`;
  try {
    return new URL(R2_PUBLIC_URL).origin;
  } catch {
    return `https://${DEFAULT_R2_HOST}`;
  }
}

function toR2Proxy(pathname) {
  return `/r2/${String(pathname).replace(/^\/+/, "")}`;
}

export function getProcessedSrc(srcUrl) {
  if (!srcUrl) return srcUrl;
  if (srcUrl.startsWith("/wp-uploads/") || srcUrl.startsWith("/r2/")) {
    return srcUrl;
  }

  const uploads = srcUrl.match(WP_UPLOADS);
  if (uploads) return `/wp-uploads/${uploads[1]}`;

  const origin = r2Origin();
  if (srcUrl.startsWith(`${origin}/`)) {
    return toR2Proxy(srcUrl.slice(origin.length));
  }

  const r2Host = srcUrl.match(/https?:\/\/([^/]*r2\.dev)\/(.*)/i);
  if (r2Host) return toR2Proxy(r2Host[2]);

  for (const host of MIRRORED_HOSTS) {
    const match = srcUrl.match(host);
    if (match) return toR2Proxy(match[1]);
  }

  return srcUrl;
}
