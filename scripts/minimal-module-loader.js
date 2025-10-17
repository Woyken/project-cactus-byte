/**
 * Minimal Browser ES Module Transformer
 * Transforms ES modules to run in browser without native module support
 * Recursively processes dependencies on-demand
 */

window.createModuleLoader = function(baseUrl = '') {
  const exports = {};
  const cache = new Map();
  const processing = new Map();

  // Transform exports to global object
  function transformExports(code, moduleKey) {
    return code
      .replace(/export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g,
        (_, name, value) => `const ${name} = ${value}; exports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["${name}"] = ${name};`)
      .replace(/export\s*\{\s*([^}]+)\s*\}/g,
        (_, exportList) => {
          const names = exportList.split(',').map(e => e.trim());
          let result = `exports["${moduleKey}"] = exports["${moduleKey}"] || {};`;
          names.forEach(name => {
            const [localName, exportName] = name.includes(' as ') ? name.split(' as ').map(s => s.trim()) : [name, name];
            result += ` exports["${moduleKey}"]["${exportName}"] = ${localName};`;
          });
          return result;
        })
      .replace(/export\s+default\s+([^;]+);?/g,
        (_, value) => `const __default = ${value}; exports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["default"] = __default;`)
      .replace(/export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        (match, name) => `${match.replace('export ', '')} exports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["${name}"] = ${name};`);
  }

  // Transform imports to loadModule calls
  function transformImports(code, currentModuleKey = '') {
    return code
      // Handle named imports with or without spaces (minified: import{a,b}from"path" and normal: import { a, b } from "path")
      .replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]\s*;?/g,
        (_, imports, path) => {
          const moduleKey = resolveModulePath(path, currentModuleKey);
          const names = imports.split(',').map(i => i.trim());
          return names.map(name => {
            const [importName, localName] = name.includes(' as ') ? name.split(' as ').map(s => s.trim()) : [name, name];
            return `const ${localName} = (await loadModule('${moduleKey}'))['${importName}'];`;
          }).join('\n');
        })
      // Handle default imports (import name from "path")
      .replace(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"]([^'"]+)['"]\s*;?/g,
        (_, name, path) => {
          const moduleKey = resolveModulePath(path, currentModuleKey);
          return `const ${name} = (await loadModule('${moduleKey}'))['default'] || await loadModule('${moduleKey}');`;
        })
      // Handle side effect imports (import "path")
      .replace(/import\s*['"]([^'"]+)['"]\s*;?/g,
        (_, path) => {
          const moduleKey = resolveModulePath(path, currentModuleKey);
          return `await loadModule('${moduleKey}');`;
        })
      // Handle dynamic imports (import("path"))
      .replace(/import\(['"]([^'"]+)['"]\)/g,
        (_, path) => {
          const moduleKey = resolveModulePath(path, currentModuleKey);
          return `loadModule('${moduleKey}')`;
        });
  }

  // Resolve module path based on current module location
  function resolveModulePath(importPath, currentModuleKey) {
    // Remove file extension
    const pathWithoutExt = importPath.replace(/\.[^.]+$/, '');

    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // For relative imports, we need to resolve based on the current module's directory
      let currentDir = '';

      if (currentModuleKey.includes('/')) {
        currentDir = currentModuleKey.substring(0, currentModuleKey.lastIndexOf('/'));
      }

      // Handle ./path - same directory
      if (importPath.startsWith('./')) {
        const relativePath = pathWithoutExt.substring(2); // Remove './'
        const resolved = currentDir ? `${currentDir}/${relativePath}` : relativePath;
        return resolved;
      }

      // Handle ../path - parent directory (FIXED)
      if (importPath.startsWith('../')) {
        // Start with current directory parts
        let pathParts = currentDir ? currentDir.split('/') : [];

        // Split the import path and handle each part
        let remainingPath = pathWithoutExt;
        while (remainingPath.startsWith('../')) {
          pathParts.pop(); // Go up one directory for each '../'
          remainingPath = remainingPath.substring(3); // Remove '../'
        }

        // Add the remaining path if any
        if (remainingPath) {
          pathParts = pathParts.concat(remainingPath.split('/'));
        }

        const resolved = pathParts.join('/');
        return resolved;
      }
    } else {
      // Absolute import - use as is (remove leading slash if present)
      const resolved = pathWithoutExt.replace(/^\//, '');
      return resolved;
    }

    // Fallback
    return pathWithoutExt;
  }

  // Load module function
  async function loadModule(moduleKey) {
    if (exports[moduleKey] && !exports[moduleKey]._loading) {
      return exports[moduleKey];
    }

    if (processing.has(moduleKey)) {
      await processing.get(moduleKey);
      return exports[moduleKey] || {};
    }

    if (cache.has(moduleKey)) {
      await executeModule(cache.get(moduleKey), moduleKey);
      return exports[moduleKey] || {};
    }

    const promise = processModule(moduleKey);
    processing.set(moduleKey, promise);

    try {
      await promise;
      return exports[moduleKey] || {};
    } finally {
      processing.delete(moduleKey);
    }
  }

  // Process module: fetch and transform
  async function processModule(moduleKey) {
    const url = baseUrl.endsWith('/') ? `${baseUrl}${moduleKey}.js` : `${baseUrl}/${moduleKey}.js`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load ${moduleKey}: ${response.status}`);
    }

    let code = await response.text();
    code = transformExports(code, moduleKey);
    code = transformImports(code, moduleKey);

    cache.set(moduleKey, code);
    await executeModule(code, moduleKey);
  }

  // Execute transformed code
  async function executeModule(code, moduleKey) {
    exports[moduleKey] = exports[moduleKey] || {};
    exports[moduleKey]._loading = true;

    try {
      if (code.includes('await ')) {
        await new Function('loadModule', 'exports', `return (async () => { ${code} })();`)(loadModule, exports);
      } else {
        new Function('loadModule', 'exports', code)(loadModule, exports);
      }
    } finally {
      delete exports[moduleKey]._loading;
    }
  }

  // Public API
  return {
    // Load script from URL
    async loadScript(url, moduleKey) {
      if (!moduleKey) {
        // Extract path relative to baseUrl
        let relativePath = url;
        if (url.startsWith(baseUrl)) {
          relativePath = url.substring(baseUrl.length);
          if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
          }
        }
        moduleKey = relativePath.replace(/\.[^.]+$/, '');
      }

      // Check if already loaded or being processed
      if (exports[moduleKey] && !exports[moduleKey]._loading) {
        return exports[moduleKey];
      }

      if (processing.has(moduleKey)) {
        await processing.get(moduleKey);
        return exports[moduleKey] || {};
      }

      if (cache.has(moduleKey)) {
        await executeModule(cache.get(moduleKey), moduleKey);
        return exports[moduleKey] || {};
      }

      // Create processing promise to prevent duplicate loading
      const promise = (async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);

        let code = await response.text();
        code = transformExports(code, moduleKey);
        code = transformImports(code, moduleKey);

        cache.set(moduleKey, code);
        await executeModule(code, moduleKey);
      })();      processing.set(moduleKey, promise);

      try {
        await promise;
        return exports[moduleKey] || {};
      } finally {
        processing.delete(moduleKey);
      }
    },

    // Process script string
    async processScript(scriptCode, moduleKey = 'main') {
      let code = transformExports(scriptCode, moduleKey);
      code = transformImports(code, moduleKey);
      await executeModule(code, moduleKey);
      return exports[moduleKey] || {};
    },

    // Load module by key
    loadModule,

    // Get module exports
    getModule: (moduleKey) => exports[moduleKey],

    // Check if loaded
    isLoaded: (moduleKey) => exports[moduleKey] && !exports[moduleKey]._loading,

    // Clear cache
    clear: () => {
      cache.clear();
      processing.clear();
      Object.keys(exports).forEach(key => delete exports[key]);
    },

    // Get all exports (for debugging)
    getAllExports: () => exports
  };
};

// Example usage:
/*
const loader = createModuleLoader('https://example.com/assets');

// Load script from URL
loader.loadScript('https://example.com/assets/script.js')
  .then(module => console.log('Loaded:', module));

// Process script string
const script = `
  import { helper } from './helper';
  export const myFunc = () => helper.doWork();
`;
loader.processScript(script, 'myModule')
  .then(module => console.log('Processed:', module));
*/

// this file
// https://cdn.jsdelivr.net/gh/Woyken/project-cactus-byte@latest/scripts/minimal-module-loader.js

document.body.innerHTML = '';
document.head.innerHTML = '';
document.body.appendChild(document.createElement('div')).id = 'app';

const loader = createModuleLoader('https://cdn.jsdelivr.net/gh/Woyken/project-cactus-byte@latest/dist/');
loader.loadScript('https://cdn.jsdelivr.net/gh/Woyken/project-cactus-byte@latest/dist/entryPoint.js')
// const loader = createModuleLoader('http://localhost:4173');
// loader.loadScript('http://localhost:4173/entryPoint.js')
