import { defineConfig } from 'vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import solidPlugin from 'vite-plugin-solid'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import tailwindcss from '@tailwindcss/vite'
import path, { resolve } from 'node:path'
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'solid', autoCodeSplitting: true }),
    solidPlugin(),
    tailwindcss(),
    cssInjectedByJsPlugin(
      {
        jsAssetsFilterFunction(chunk) {
          // no not touch module loader
          if (chunk.name === 'minimal-module-loader') return false;
          return chunk.isEntry
        },
      }
    ),
  ],
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
  build: {
    assetsInlineLimit: () => true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        entryPoint: resolve(__dirname, 'src/entryPoint.ts'),
        ['minimal-module-loader']: resolve(__dirname, 'src/minimal-module-loader.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'entryPoint') return 'entryPoint.js';
          if (chunkInfo.name === 'minimal-module-loader') return 'minimal-module-loader.js';
          return 'assets/[name]-[hash].js';
        }
      }
    },
    modulePreload: false
  },
  server: {
    cors: true
  },
  base: './',
})
