// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Pages are static (served from the Pages CDN); only /api/* opts into the
  // Worker runtime via `export const prerender = false`.
  output: 'static',
  adapter: cloudflare({
    // Exposes D1/env bindings to `astro dev` from wrangler config.
    platformProxy: { enabled: true },
  }),
});