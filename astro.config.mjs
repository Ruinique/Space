import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * Shiki transformer that attaches data-lang and optional data-title
 * attributes to <pre> elements for the editorial code header bar.
 */
function editorialCodeMeta() {
  return {
    name: 'editorial-code-meta',
    pre(node) {
      const lang = this.options.lang || 'text';
      node.properties['data-lang'] = lang;
      const rawMeta = this.options.meta?.__raw || '';
      const titleMatch = rawMeta.match(/(?:title|file)=["']?([^"'\s]+)["']?/);
      if (titleMatch) {
        node.properties['data-title'] = titleMatch[1];
      }
    },
  };
}

export default defineConfig({
  output: 'static',
  site: 'https://ruinique.com',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: {
        light: 'vitesse-light',
        dark: 'vitesse-dark',
      },
      defaultColor: false,
      transformers: [editorialCodeMeta()],
    },
  },
});
