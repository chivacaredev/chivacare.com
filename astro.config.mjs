// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.chivacare.com',
  trailingSlash: 'ignore',
  // An explicit host avoids "server.address.port" being null when the dev
  // server runs on Bun (no Node.js installed) on Windows.
  server: { host: '127.0.0.1' },
  vite: {
    plugins: [tailwindcss()],
  },
});
