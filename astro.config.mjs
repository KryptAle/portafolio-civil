import { defineConfig } from 'astro/config';

// En local la base es '/'. En GitHub Pages se compila con
// BASE_PATH=/portafolio-civil para servir el sitio bajo /portafolio-civil/.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: 'https://kryptale.github.io',
  base,
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
});
