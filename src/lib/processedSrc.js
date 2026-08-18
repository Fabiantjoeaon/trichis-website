// WordPress media is served from the site itself and needs no rewriting. This
// only matters in seed mode, where the DatoCMS export still points at Dato and
// Mux — both mirrored to R2, which unlike the originals sends CORS headers and
// so can be read back into a WebGL texture.

const R2_PUBLIC_URL =
  import.meta.env.PUBLIC_R2_PUBLIC_URL || import.meta.env.R2_PUBLIC_URL;

const MIRRORED_HOSTS = [
  /datocms-assets\.com\/(.*)/,
  /stream\.mux\.com\/(.*)/,
  /image\.mux\.com\/(.*)/,
];

export function getProcessedSrc(srcUrl) {
  if (!srcUrl || !R2_PUBLIC_URL) return srcUrl;

  for (const host of MIRRORED_HOSTS) {
    const match = srcUrl.match(host);
    if (match) return `${R2_PUBLIC_URL}/${match[1]}`;
  }

  return srcUrl;
}
