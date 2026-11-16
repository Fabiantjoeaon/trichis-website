// Run against an Astro dev server. Requires Playwright with Chromium/WebKit installed.
// Optional: BASE_URL, PLAYWRIGHT_MODULE (module path), CHROME_EXECUTABLE.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const artifacts = mkdtempSync(join(tmpdir(), 'trichis-ui-motion-'));
import assert from 'node:assert/strict';
const origin=process.env.BASE_URL || 'http://localhost:4321';
for (const [engine, width] of [[chromium,390],[webkit,390],[chromium,1440]]) {
 const browser=await engine.launch({ headless:true, ...(engine===chromium && process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {}) });
 try {
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<712,hasTouch:width<712});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.loader')?.style.display==='none');
  await page.addStyleTag({content:'.cookie-banner,astro-dev-toolbar{display:none!important}'});
  await page.evaluate(async()=>{window.roots=(await import('/node_modules/.vite/deps/@react-three_fiber.js'))._roots;window.site=(await import('/src/stores/global.js')).useGlobalStore;window.canvasState=(await import('/src/lib/gl/canvasStore.js')).useCanvasStore;window.emitter=(await import('/src/lib/emitter.js')).default;window.events=(await import('/src/lib/events.js')).events;});
  const scroll=async(selector,index=0)=>{
   await page.evaluate(({selector,index})=>window.site.getState().lenis.scrollTo(document.querySelectorAll(selector)[index],{immediate:true,force:true,offset:-180}),{selector,index});
  };
  const revealed=async(selector,index)=>{
   await scroll(selector,index);
   await page.waitForFunction(({selector,index})=>{
    const el=document.querySelectorAll(selector)[index];let visible=false;
    for(const root of window.roots.values())root.store.getState().scene.traverse(mesh=>{
     if(mesh.name.startsWith('NineGLImage')&&mesh.parent.track?.current===el)visible=mesh.visible&&mesh.parent.parent.visible&&mesh.parent.scale.x>.995;
    });return visible;
   },{selector,index},{timeout:20000});
  };
  const glyphs=await page.locator('.home-glyph').evaluateAll(elements=>elements.map(e=>({variant:e.dataset.glyph,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
  console.log(engine.name(),width,'glyphs',glyphs);
  for(const glyph of glyphs) assert(Math.abs(Math.max(glyph.width,glyph.height)-Math.min(360,Math.max(140,width*.24)))<2);
  assert(await page.locator('.home-story__heading').evaluate(el=>el.getBoundingClientRect().bottom >= el.querySelector('.home-glyph').getBoundingClientRect().bottom));
  assert(await page.locator('.home-work').evaluate(el=>el.querySelector('.home-work__glyph').getBoundingClientRect().top > el.querySelector('h2').getBoundingClientRect().bottom));
  await scroll('.home-story');await page.waitForTimeout(1800);await page.screenshot({path:`${artifacts}/home-story-${engine.name()}-${width}.png`});
  await scroll('.home-services');await page.waitForTimeout(1800);await page.screenshot({path:`${artifacts}/home-services-${engine.name()}-${width}.png`});
  const count=await page.locator('.home-work__image').count();
  for(let i=0;i<count;i++)await revealed('.home-work__image',i);
  await page.setViewportSize({width,height:740});
  await revealed('.home-work__image',0);
  await page.screenshot({path:`${artifacts}/home-work-${engine.name()}-${width}.png`});
  // Recreate canvas contents after the one-shot observers have fired.
  await page.evaluate(()=>{window.savedEntries=window.canvasState.getState().entries;window.canvasState.setState({entries:{}});});
  await page.waitForTimeout(100);
  await page.evaluate(()=>window.canvasState.setState({entries:window.savedEntries}));
  await revealed('.home-work__image',0);
  await page.evaluate(()=>window.emitter.emit(window.events.MENU_OPEN));
  assert.equal(await page.locator('.menu-detail').first().evaluate(e=>Number(getComputedStyle(e).opacity)),0);
  await page.waitForTimeout(1400);
  assert((await page.locator('.menu-detail').evaluateAll(es=>es.map(e=>Number(getComputedStyle(e).opacity)))).every(v=>v===1));
  await page.evaluate(()=>window.emitter.emit(window.events.MENU_CLOSE));
  await page.waitForTimeout(350);
  assert((await page.locator('.menu-detail').evaluateAll(es=>es.map(e=>Number(getComputedStyle(e).opacity)))).every(v=>v===0));
  await page.waitForTimeout(450);
  await page.evaluate(()=>window.emitter.emit(window.events.MENU_OPEN));await page.waitForTimeout(100);
  await page.evaluate(()=>window.emitter.emit(window.events.MENU_CLOSE));await page.waitForTimeout(100);
  await page.evaluate(()=>window.emitter.emit(window.events.MENU_OPEN));await page.waitForTimeout(1500);
  assert((await page.locator('.menu-detail').evaluateAll(es=>es.map(e=>Number(getComputedStyle(e).opacity)))).every(v=>v===1));
  await page.locator('.menu__links a').filter({hasText:/werk|work|projects/i}).first().click();
  await page.waitForFunction(()=>!document.querySelector('.gl-canvas-root--overlay'));
  assert.equal(await page.locator('.menu').evaluate(e=>getComputedStyle(e).display),'none');
  console.log(engine.name(),width,'homepage media, reattachment, resize, menu repeat/interrupt/navigation passed');
  await page.waitForTimeout(2500);
  await page.goto(origin+'/project/test-project/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.loader')?.style.display==='none');
  await page.addStyleTag({content:'.cookie-banner,astro-dev-toolbar{display:none!important}'});
  await page.evaluate(async()=>{window.roots=(await import('/node_modules/.vite/deps/@react-three_fiber.js'))._roots;window.site=(await import('/src/stores/global.js')).useGlobalStore;window.canvasState=(await import('/src/lib/gl/canvasStore.js')).useCanvasStore;});
  for(let i=0;i<2;i++)await revealed('.project-next__image',i);
  await page.screenshot({path:`${artifacts}/project-next-${engine.name()}-${width}.png`});
  await page.locator('.project-next__card').last().click();await page.waitForURL('**/test-project/video');
  await page.waitForFunction(()=>!document.querySelector('.gl-canvas-root--overlay'));
  await revealed('.project-hero__gl',0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);
  console.log(engine.name(),width,'next images/video and project navigation passed');
 }finally{await browser.close();}
}

console.log('Screenshots:', artifacts);
