const R2_PUBLIC_URL =
  import.meta.env.PUBLIC_R2_PUBLIC_URL || import.meta.env.R2_PUBLIC_URL;

function extractR2Path(url) {
  if (!R2_PUBLIC_URL) return null;

  const datoMatch = url.match(/datocms-assets\.com\/(.*)/);
  if (datoMatch) return `${R2_PUBLIC_URL}/${datoMatch[1]}`;

  const muxStreamMatch = url.match(/stream\.mux\.com\/(.*)/);
  if (muxStreamMatch) return `${R2_PUBLIC_URL}/${muxStreamMatch[1]}`;

  const muxImageMatch = url.match(/image\.mux\.com\/(.*)/);
  if (muxImageMatch) return `${R2_PUBLIC_URL}/${muxImageMatch[1]}`;

  return null;
}

export function getProcessedSrc(srcUrl) {
  if (!srcUrl) return srcUrl;
  if (srcUrl.startsWith("/api/video-proxy?url=")) return srcUrl;

  const r2Direct = extractR2Path(srcUrl);
  if (r2Direct) return r2Direct;

  if (
    srcUrl.includes("datocms-assets.com") ||
    srcUrl.includes("stream.mux.com")
  ) {
    return `/api/video-proxy?url=${encodeURIComponent(srcUrl)}`;
  }

  return srcUrl;
}
