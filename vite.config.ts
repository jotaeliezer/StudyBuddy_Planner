import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

/** Vite/Rollup can emit script/link/modulepreload tags with crossorigin; strip for static hosts where it sometimes breaks module graphs. */
function stripBuiltHtmlCrossOrigin(): Plugin {
  return {
    name: 'strip-built-html-crossorigin',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(/\s+crossorigin(?:=(?:"[^"]*"|'[^']*'))?/gi, '');
      },
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  /** Explicit VITE_BASE wins; prod default is ./ so GH Pages works even if repo name/url drifts */
  const envBase = process.env.VITE_BASE ?? env.VITE_BASE;
  const base =
    envBase !== undefined && String(envBase).trim() !== ''
      ? String(envBase).trim()
      : mode === 'production'
        ? './'
        : '/';
  return {
    base,
    plugins: [react(), tailwindcss(), stripBuiltHtmlCrossOrigin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
