// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Pages are static (served from the Pages CDN); only /api/* opts into the
  // Worker runtime via `export const prerender = false`.
  output: 'static',
  // The adapter reads bindings from wrangler.jsonc automatically in dev (the
  // old `platformProxy` option was removed in @astrojs/cloudflare v13).
  adapter: cloudflare(),
});