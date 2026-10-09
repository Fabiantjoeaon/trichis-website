// Wait for the page that will actually be revealed, not every asset below it.
function waitUntil(target, events, ready, signal) {
  if (signal.aborted || ready()) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      events.forEach((event) => target.removeEventListener(event, finish));
      signal.removeEventListener("abort", finish);
      resolve();
    };
    events.forEach((event) => target.addEventListener(event, finish, { once: true }));
    signal.addEventListener("abort", finish, { once: true });
    if (ready()) finish();
  });
}

export async function waitForPageReady({ timeout = 4000, onProgress = () => {}, signal } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, timeout);
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const progress = { fonts: 0, islands: 0, media: 0 };
  const update = (part, value) => {
    progress[part] = value;
    if (!controller.signal.aborted) onProgress(progress.fonts * .2 + progress.islands * .2 + progress.media * .6);
  };
  try {
    const fonts = waitUntil(document.fonts, ["loadingdone", "loadingerror"],
      () => document.fonts.status === "loaded", controller.signal).then(() => update("fonts", 1));
    const islands = Array.from(document.querySelectorAll('main astro-island[client="load"][ssr]'));
    await Promise.all(islands.map((island) => waitUntil(island, ["astro:hydrate"],
      () => !island.hasAttribute("ssr"), controller.signal)));
    update("islands", 1);

    // Hydration selects mobile media before we collect the visible assets.
    const media = Array.from(document.querySelectorAll("main img, main video")).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
    });
    let loaded = 0;
    if (!media.length) update("media", 1);
    await Promise.all([fonts, ...media.map((element) => waitUntil(element,
      ["load", "loadeddata", "error"],
      () => element.tagName === "IMG" ? element.complete : element.readyState >= 2 || !!element.error,
      controller.signal).then(() => update("media", ++loaded / media.length)))]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    controller.abort();
  }
}

export function waitForLayout() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
