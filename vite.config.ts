import { defineConfig } from 'vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import solidPlugin from 'vite-plugin-solid'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import tailwindcss from '@tailwindcss/vite'
import path,{resolve}from'node:path'
// import fs from 'node:fs';

// const entryFile = path.resolve('./src/entry.js');
// const loaderPath = path.resolve('./src/customImport.js');
// import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'solid', autoCodeSplitting: true }),
    solidPlugin(),
    tailwindcss(),
    cssInjectedByJsPlugin(
      {
        jsAssetsFilterFunction(chunk) {
            // no not touch module loader
            if(chunk.name === 'minimal-module-loader') return false;
            return chunk.isEntry
        },
      }
    //   {
    //   // By default this is injected on top of root module. Added queueMicrotask so that we can clear
    //   injectCodeFunction: (cssCode, { styleId, useStrictCSP, attributes }) => {
    //       let attributesInjection = '';
    //       for (const attribute in attributes) {
    //           attributesInjection += `elementStyle.setAttribute('${attribute}', '${attributes[attribute]}');`;
    //       }

    //       return `queueMicrotask(()=>try{if(typeof document != 'undefined'){var elementStyle = document.createElement('style');${typeof styleId == 'string' && styleId.length > 0 ? `elementStyle.id = '${styleId}';` : ''}${useStrictCSP ? `elementStyle.nonce = document.head.querySelector('meta[property=csp-nonce]')?.content;` : ''}${attributesInjection}elementStyle.appendChild(document.createTextNode(${cssCode}));document.head.appendChild(elementStyle);}}catch(e){console.error('vite-plugin-css-injected-by-js', e);})`;
    //   },
    //   // injectCode: (cssCode) => {
    //   //   return `
    //   //     // Store CSS for manual injection
    //   //     window.__TAILWIND_CSS__ = ${JSON.stringify(cssCode)};
    //   //   `;
    //   // }
    // }
  ),
    // {
    //   name: 'transform-esm-to-cjs',
    //   enforce: 'post',
    //   transform(code, id) {
    //     if (!id.endsWith('.js')) return null;

    //     // export const x = ...
    //     code = code.replace(
    //       /export\s+const\s+(\w+)\s*=\s*(.*?);?/g,
    //       (_, name, value) => `const ${name} = ${value}; module.exports.${name} = ${name};`
    //     );

    //     // export function foo() { ... }
    //     code = code.replace(
    //       /export\s+function\s+(\w+)\s*\((.*?)\)\s*{([\s\S]*?)}/g,
    //       (_, name, args, body) =>
    //         `function ${name}(${args}) {${body}} module.exports.${name} = ${name};`
    //     );

    //     // export default ...
    //     code = code.replace(
    //       /export\s+default\s+(.*?);?/g,
    //       (_, value) => `module.exports.default = ${value};`
    //     );

    //     return { code, map: null };
    //   }
    // },
    // {
    //   name: 'replace-imports',
    //   enforce: 'post',
    //   transform(code, id) {
    //     if (!id.endsWith('.js')) return null;

    //     // import { x } from './mod.js'
    //     code = code.replace(
    //       /import\s*{\s*([^}]+)\s*}\s*from\s*'"['"]\s*;?/g,
    //       (_, imports, path) => {
    //         const vars = imports.split(',').map(v => v.trim()).join(', ');
    //         return `const { ${vars} } = await customImport('${path}');`;
    //       }
    //     );

    //     // import x from './mod.js'
    //     code = code.replace(
    //       /import\s+([a-zA-Z_$][\w$]*)\s*from\s*'"['"]\s*;?/g,
    //       (_, defaultExport, path) => {
    //         return `const { default: ${defaultExport} } = await customImport('${path}');`;
    //       }
    //     );

    //     // import('./mod.js')
    //     code = code.replace(
    //       /import\s*\(\s*(['"][^'"]+['"])\s*\)\s*;?/g,
    //       'customImport($1)'
    //     );

    //     return { code, map: null };
    //   }
    // },
    // {
    //   name: 'inject-loader-into-entry',
    //   enforce: 'post',
    //   transform(code, id) {
    //     if (path.resolve(id) === entryFile) {
    //       const loader = fs.readFileSync(loaderPath, 'utf-8');
    //       return {
    //         code: loader + '\n' + code,
    //         map: null
    //       };
    //     }
    //     return null;
    //   }
    // }
  ],
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
  build: {
    assetsInlineLimit: ()=>true,
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
  }
})
