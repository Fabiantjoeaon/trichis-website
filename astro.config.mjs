import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    // GSAP ships as ESM-only; without this Vite's SSR bundler loads it as CJS and throws.
    // three/webgpu must stay bundled for TSL node materials under SSR prerender.
    ssr: {
      noExternal: ['gsap', '@gsap/react', 'three'],
    },
    optimizeDeps: {
      include: ['three', 'three/webgpu', 'three/tsl'],
    },
  },
});
