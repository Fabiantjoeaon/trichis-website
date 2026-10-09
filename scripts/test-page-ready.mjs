import test from 'node:test';
import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { waitForPageReady } from '../src/lib/page-ready.js';

function media(tagName, top = 0) {
  return Object.assign(new EventTarget(), {
    tagName, complete: false, readyState: 0,
    getBoundingClientRect: () => ({ width: 600, height: 400, top, bottom: top + 400 }),
  });
}

function page(t, assets = [], islands = []) {
  const previous = { document: globalThis.document, window: globalThis.window };
  const fonts = Object.assign(new EventTarget(), { status: 'loaded' });
  globalThis.window = { innerHeight: 1000 };
  globalThis.document = {
    fonts,
    querySelectorAll: (selector) => selector.includes('astro-island') ? islands : assets,
  };
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  });
  return fonts;
}

test('only visible assets delay reveal, and a video needs a playable frame', async (t) => {
  const video = media('VIDEO');
  const belowFold = media('IMG', 2000);
  page(t, [video, belowFold]);
  let ready = false;
  const waiting = waitForPageReady().then(() => { ready = true; });
  await Promise.resolve();
  video.readyState = 1;
  video.dispatchEvent(new Event('loadedmetadata'));
  await Promise.resolve();
  assert.equal(ready, false);
  video.readyState = 2;
  video.dispatchEvent(new Event('loadeddata'));
  await waiting;
  assert.equal(belowFold.complete, false);
  assert.equal(getEventListeners(video, 'error').length, 0);
});

test('hydration can replace desktop media before readiness is checked', async (t) => {
  const desktop = Object.assign(media('IMG'), { complete: true });
  const mobile = media('IMG');
  const assets = [desktop];
  let ssr = true;
  const island = Object.assign(new EventTarget(), { hasAttribute: () => ssr });
  page(t, assets, [island]);
  let ready = false;
  const waiting = waitForPageReady().then(() => { ready = true; });
  assets[0] = mobile;
  ssr = false;
  island.dispatchEvent(new Event('astro:hydrate'));
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(ready, false);
  mobile.complete = true;
  mobile.dispatchEvent(new Event('load'));
  await waiting;
});

test('cached assets, failed media and font completion all release their waiters', async (t) => {
  const cached = Object.assign(media('IMG'), { complete: true });
  const failed = media('VIDEO');
  const fonts = page(t, [cached, failed]);
  fonts.status = 'loading';
  const progress = [];
  const waiting = waitForPageReady({ onProgress: (value) => progress.push(value) });
  await Promise.resolve();
  failed.dispatchEvent(new Event('error'));
  fonts.status = 'loaded';
  fonts.dispatchEvent(new Event('loadingdone'));
  await waiting;
  assert.equal(progress.at(-1), 1);
  assert(progress.every((value, index) => !index || value >= progress[index - 1]));
  assert.equal(getEventListeners(fonts, 'loadingerror').length, 0);
});

test('a stalled resource has a bounded wait and leaves no listeners', async (t) => {
  const stalled = media('IMG');
  page(t, [stalled]);
  await waitForPageReady({ timeout: 20 });
  assert.equal(getEventListeners(stalled, 'load').length, 0);
  assert.equal(getEventListeners(stalled, 'error').length, 0);
});

test('superseded navigation cancels pending waits and progress updates', async (t) => {
  const stalled = media('IMG');
  const fonts = page(t, [stalled]);
  fonts.status = 'loading';
  const controller = new AbortController();
  const progress = [];
  const waiting = waitForPageReady({ signal: controller.signal, onProgress: (value) => progress.push(value) });
  await Promise.resolve();
  controller.abort();
  const before = progress.length;
  await waiting;
  assert.equal(progress.length, before);
  assert.equal(getEventListeners(stalled, 'load').length, 0);
  assert.equal(getEventListeners(fonts, 'loadingdone').length, 0);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});
