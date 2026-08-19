import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), '');
const source = String(env.PUBLIC_WP_SOURCE || 'local').trim().toLowerCase();
const graphql = ['flywheel', 'remote', 'staging', 'prod', 'production'].includes(source)
  ? env.PUBLIC_WP_GRAPHQL_URL_FLYWHEEL || env.PUBLIC_WP_GRAPHQL_URL
  : env.PUBLIC_WP_GRAPHQL_URL_LOCAL || env.PUBLIC_WP_GRAPHQL_URL;
let wpOrigin = 'https://trichis.flywheelsites.com';
try {
  if (graphql) wpOrigin = new URL(graphql).origin;
} catch {
  // keep Flywheel default
}

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
    // WebGL textures need CORS. Flywheel (and most WP hosts) serve uploads
    // without Access-Control-Allow-Origin, so we fetch them same-origin via
    // this proxy in dev. Production uses the matching Netlify redirect.
    server: {
      proxy: {
        '/wp-uploads': {
          target: wpOrigin,
          changeOrigin: true,
          secure: true,
          rewrite: (path) =>
            path.replace(/^\/wp-uploads/, '/wp-content/uploads'),
        },
      },
    },
  },
});
