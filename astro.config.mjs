// @ts-check
import { writeFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const site = 'https://www.chivacare.com';

/** Writes dist/sitemap.xml from every built page on each build (referenced from public/robots.txt). */
const sitemap = {
  name: 'sitemap',
  hooks: {
    'astro:build:done': async ({ pages, dir }) => {
      const urls = pages
        .map((p) => p.pathname)
        .filter((p) => !/appointment\/(step\d|success)/.test(p)) // same paths robots.txt disallows
        .map((p) => `<url><loc>${new URL(p, site).href.replaceAll('&', '&amp;')}</loc></url>`);
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
      await writeFile(new URL('sitemap.xml', dir), xml);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: [sitemap],
  // An explicit host avoids "server.address.port" being null when the dev
  // server runs on Bun (no Node.js installed) on Windows.
  server: { host: '127.0.0.1' },
  vite: {
    plugins: [tailwindcss()],
  },
});
