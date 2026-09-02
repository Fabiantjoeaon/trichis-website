import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

function readEnv() {
  const env = { ...process.env };
  try {
    const text = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of text.split('\n')) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, raw] = match;
      if (env[key] != null && env[key] !== '') continue;
      env[key] = raw.replace(/^['"]|['"]$/g, '').trim();
    }
  } catch {
    // no .env — Netlify injects vars into process.env
  }
  return env;
}

const env = readEnv();
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
