/**
 * Look at this crazy slop!
 *
 * Minimal Browser ES Module Transformer
 * Transforms ES modules to run in browser without native module support
 * Recursively processes dependencies on-demand
 */

window.createModuleLoader = function(baseUrl = '') {
  console.log('🏗️ DEBUG createModuleLoader called with baseUrl:', baseUrl);

  const exports = {};
  const cache = new Map();
  const processing = new Map();

  // Transform exports to global object
  function transformExports(code, moduleKey) {
    let transformedCode = code;

    // Handle export function statements - need to be more careful with braces
    transformedCode = transformedCode.replace(/export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      (match, name) => {
        // Simply remove 'export ' and add the export assignment after the function
        return `function ${name}`;
      });

    // Handle export class statements
    transformedCode = transformedCode.replace(/export\s+class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      (match, name) => {
        // Simply remove 'export ' and add the export assignment after the class
        return `class ${name}`;
      });

    // After transforming function and class declarations, add the export assignments
    // Find all function declarations that were originally exported
    const exportedFunctions = [];
    const exportedClasses = [];
    const originalCode = code;

    const exportFunctionMatches = originalCode.matchAll(/export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    for (const match of exportFunctionMatches) {
      exportedFunctions.push(match[1]);
    }

    const exportClassMatches = originalCode.matchAll(/export\s+class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    for (const match of exportClassMatches) {
      exportedClasses.push(match[1]);
    }

    // Add export assignments for functions and classes at the end
    const allExported = [...exportedFunctions, ...exportedClasses];
    if (allExported.length > 0) {
      let exportStatements = `\nexports["${moduleKey}"] = exports["${moduleKey}"] || {};\n`;
      allExported.forEach(name => {
        exportStatements += `exports["${moduleKey}"]["${name}"] = ${name};\n`;
      });
      transformedCode += exportStatements;
    }

    // Handle other export types
    transformedCode = transformedCode
      .replace(/export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g,
        (_, name, value) => `const ${name} = ${value}; exports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["${name}"] = ${name};`)
      // Handle empty export {} statements (TypeScript module marker)
      .replace(/export\s*\{\s*\}\s*;?/g, '')
      // Handle regular export { ... } (not export...from) - make sure it doesn't have "from" after it
      .replace(/export\s*\{\s*([^}]+)\s*\}(?!\s*from)/g,
        (_, exportList) => {
          const names = exportList.split(',').map(e => e.trim()).filter(name => name.length > 0); // Filter out empty names
          let result = `exports["${moduleKey}"] = exports["${moduleKey}"] || {};`;
          names.forEach(name => {
            const [localName, exportName] = name.includes(' as ') ? name.split(' as ').map(s => s.trim()) : [name, name];
            result += ` exports["${moduleKey}"]["${exportName}"] = ${localName};`;
          });
          return result;
        })
      .replace(/export\s+default\s+([^;]+);?/g,
        (_, value) => `const __default = ${value}; exports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["default"] = __default;`);

    // Final check: catch any remaining 'export' statements that weren't handled
    const remainingExports = transformedCode.match(/\bexport\s+/g);
    if (remainingExports) {
      console.warn('⚠️  WARNING: Found unhandled export statements in module:', moduleKey);
      console.warn('Remaining exports:', remainingExports);
      console.warn('Code snippet:', transformedCode.substring(0, 500));
    }

    return transformedCode;
  }



  // Transform import.meta references
  function transformImportMeta(code, moduleKey) {
    // Create a mock import.meta object using baseUrl instead of window.location
    const mockImportMeta = `
      const importMeta = {
        hot: {
          dispose: function(callback) {
            // Mock HMR dispose - in production this would be a no-op
            if (typeof callback === 'function') {
              // Store cleanup callback for potential future use
              window.__hmr_cleanups = window.__hmr_cleanups || [];
              window.__hmr_cleanups.push(callback);
            }
          },
          accept: function(callback) {
            // Mock HMR accept - in production this would be a no-op
            console.log('HMR accept called (mocked)');
          }
        },
        url: '${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${moduleKey}.js',
        env: {
          DEV: true,
          PROD: false,
          MODE: 'development'
        }
      };
    `;

    return code
      // Replace import.meta with our mock object
      .replace(/import\.meta/g, 'importMeta')
      // Prepend the mock import.meta definition
      .replace(/^/, mockImportMeta);
  }

  // Transform imports to loadModule calls
  function transformImports(code, currentModuleKey = '', moduleBaseUrl = baseUrl) {
    console.log('🚀 DEBUG transformImports called with:');
    console.log('  - currentModuleKey:', currentModuleKey);
    console.log('  - moduleBaseUrl:', moduleBaseUrl);
    console.log('  - baseUrl (closure):', baseUrl);
    console.log('  - original code snippet:', code.substring(0, 200) + '...');

    // Handle namespace imports (import * as name from "path")
    let transformedCode = code.replace(/import\s*\*\s*as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"]([^'"]+)['"]\s*;?/g,
      (match, name, path) => {
        console.log('🔍 DEBUG REGEX - processing namespace import:', match, 'path:', path);

        const moduleKey = resolveModulePath(path, currentModuleKey);
        return `const ${name} = await loadModule('${moduleKey}');`;
      });

    // Handle named imports with or without spaces (minified: import{a,b}from"path" and normal: import { a, b } from "path")
    transformedCode = transformedCode.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]\s*;?/g,
      (match, imports, path) => {
        console.log('🔍 DEBUG REGEX - processing named import:', match, 'path:', path);

        const moduleKey = resolveModulePath(path, currentModuleKey);
        const names = imports.split(',').map(i => i.trim()).filter(name => name.length > 0); // Filter out empty names
        return names.map(name => {
          const [importName, localName] = name.includes(' as ') ? name.split(' as ').map(s => s.trim()) : [name, name];
          return `const ${localName} = (await loadModule('${moduleKey}'))['${importName}'];`;
        }).join('\n');
      });

    // Handle default imports (import name from "path")
    transformedCode = transformedCode.replace(/import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"]([^'"]+)['"]\s*;?/g,
      (match, name, path) => {
        console.log('🔍 DEBUG REGEX - processing default import:', match, 'path:', path);
        const moduleKey = resolveModulePath(path, currentModuleKey);
        return `const ${name} = (await loadModule('${moduleKey}'))['default'] || await loadModule('${moduleKey}');`;
      });

    // Handle side effect imports (import "path")
    transformedCode = transformedCode.replace(/import\s*['"]([^'"]+)['"]\s*;?/g,
      (match, path) => {
        console.log('🔍 DEBUG REGEX - processing side effect import:', match, 'path:', path);
        const moduleKey = resolveModulePath(path, currentModuleKey);
        return `await loadModule('${moduleKey}');`;
      });

    // Handle dynamic imports (import("path")) - but skip our own generated imports
    transformedCode = transformedCode.replace(/import\(['"]([^'"]+)['"]\)/g,
      (match, path) => {
        // Skip imports that we already generated (full URLs)
        if (path.startsWith('http://') || path.startsWith('https://')) {
          console.log('🔍 DEBUG Dynamic Import - skipping already generated import:', match);
          return match; // Return unchanged
        }

        console.log('🔍 DEBUG REGEX - processing dynamic import:', match, 'path:', path);
        const moduleKey = resolveModulePath(path, currentModuleKey);
        return `loadModule('${moduleKey}')`;
      });

    if (transformedCode !== code) {
      console.log('🔧 DEBUG transformImports - code was transformed');
      console.log('  - transformed snippet:', transformedCode.substring(0, 200) + '...');
    }

    return transformedCode;
  }

  // Resolve module path based on current module location
  function resolveModulePath(importPath, currentModuleKey) {
    console.log('🔧 DEBUG resolveModulePath called with importPath:', importPath, 'currentModuleKey:', currentModuleKey);

    // Handle node_modules paths (both absolute and relative to project root)
    if (importPath.startsWith('/node_modules/') || importPath.startsWith('node_modules/')) {
      // For node_modules paths, preserve the exact path structure
      // Remove leading slash if present
      let resolved = importPath.startsWith('/') ? importPath.substring(1) : importPath;

      console.log('🔧 DEBUG resolveModulePath resolved node_modules path to:', resolved);
      return resolved;
    }

    // Preserve path as-is, just remove leading slash if present (for non-node_modules paths)
    let resolved = importPath.startsWith('/') ? importPath.substring(1) : importPath;

    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // For relative imports, we need to resolve based on the current module's directory
      let currentDir = '';

      if (currentModuleKey.includes('/')) {
        currentDir = currentModuleKey.substring(0, currentModuleKey.lastIndexOf('/'));
      }

      // Handle ./path - same directory
      if (importPath.startsWith('./')) {
        const relativePath = importPath.substring(2); // Remove './'
        resolved = currentDir ? `${currentDir}/${relativePath}` : relativePath;
      }
      // Handle ../path - parent directory
      else if (importPath.startsWith('../')) {
        // Start with current directory parts
        let pathParts = currentDir ? currentDir.split('/') : [];

        // Split the import path and handle each part
        let remainingPath = importPath;
        while (remainingPath.startsWith('../')) {
          pathParts.pop(); // Go up one directory for each '../'
          remainingPath = remainingPath.substring(3); // Remove '../'
        }

        // Add the remaining path if any
        if (remainingPath) {
          pathParts = pathParts.concat(remainingPath.split('/'));
        }

        resolved = pathParts.join('/');
      }
    }

    console.log('🔧 DEBUG resolveModulePath resolved to:', resolved);
    return resolved;
  }

  // Transform export...from statements (needs to be called before transformExports)
  function transformExportFrom(code, moduleKey) {
    console.log('🔄 DEBUG transformExportFrom called with moduleKey:', moduleKey);

    let tempModuleCounter = 0;

    return code
      // Handle export * from statements (export * from "path")
      .replace(/export\s*\*\s*from\s*['"]([^'"]+)['"]\s*;?/g,
        (match, path) => {
          console.log('🔍 DEBUG REGEX - processing export * from:', match, 'path:', path);

          const resolvedPath = resolveModulePath(path, moduleKey);
          const tempVarName = `__temp_module_${tempModuleCounter++}`;
          return `
const ${tempVarName} = await loadModule('${resolvedPath}');
exports["${moduleKey}"] = exports["${moduleKey}"] || {};
Object.keys(${tempVarName}).forEach(key => {
  if (key !== 'default') {
    exports["${moduleKey}"][key] = ${tempVarName}[key];
  }
});
`;
        })
      // Handle export { default } from statements and similar
      .replace(/export\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]\s*;?/g,
        (match, exportedNames, path) => {
          console.log('🔍 DEBUG REGEX - processing export...from:', match, 'path:', path);

          const resolvedPath = resolveModulePath(path, moduleKey);
          const tempVarName = `__temp_module_${tempModuleCounter++}`;
          const names = exportedNames.split(',').map(e => e.trim()).filter(name => name.length > 0); // Filter out empty names
          let result = `const ${tempVarName} = await loadModule('${resolvedPath}');\n`;
          result += `exports["${moduleKey}"] = exports["${moduleKey}"] || {};\n`;
          names.forEach(name => {
            const [importName, exportName] = name.includes(' as ') ? name.split(' as ').map(s => s.trim()) : [name, name];
            result += `exports["${moduleKey}"]["${exportName}"] = ${tempVarName}["${importName}"];\n`;
          });
          return result;
        })
      // Handle export default from statements (export default from "path" or export { default } from "path")
      .replace(/export\s+default\s+from\s*['"]([^'"]+)['"]\s*;?/g,
        (match, path) => {
          console.log('🔍 DEBUG REGEX - processing export default from:', match, 'path:', path);

          const resolvedPath = resolveModulePath(path, moduleKey);
          const tempVarName = `__temp_module_${tempModuleCounter++}`;
          return `
const ${tempVarName} = await loadModule('${resolvedPath}');
exports["${moduleKey}"] = exports["${moduleKey}"] || {};
exports["${moduleKey}"]["default"] = ${tempVarName}["default"] || ${tempVarName};
`;
        });
  }

  // Load module function
  async function loadModule(moduleKey) {
    if (exports[moduleKey] && !exports[moduleKey]._loading) {
      console.log('🚚 DEBUG loadModule - module already loaded:', moduleKey);
      return exports[moduleKey];
    }

    if (processing.has(moduleKey)) {
      console.log('🚚 DEBUG loadModule - module is being processed (circular dependency):', moduleKey);
      // For circular dependencies, return the current (potentially incomplete) exports
      // This allows circular imports to work by providing the exports object that will be populated
      if (exports[moduleKey]) {
        console.log('🔄 DEBUG loadModule - returning partially loaded exports for circular dependency:', moduleKey);
        return exports[moduleKey];
      }
      await processing.get(moduleKey);
      return exports[moduleKey] || {};
    }

    if (cache.has(moduleKey)) {
      console.log('🚚 DEBUG loadModule - module found in cache:', moduleKey);
      await executeModule(cache.get(moduleKey), moduleKey);
      return exports[moduleKey] || {};
    }

    console.log('🚚 DEBUG loadModule - loading module:', moduleKey);
    const promise = processModule(moduleKey);
    processing.set(moduleKey, promise);

    try {
      await promise;
      console.log('🚚 DEBUG loadModule - module loaded successfully:', moduleKey);
      return exports[moduleKey] || {};
    } finally {
      processing.delete(moduleKey);
    }
  }

  // Process module: fetch and transform
  async function processModule(moduleKey) {
    console.log('📦 DEBUG processModule called with moduleKey:', moduleKey);

    // Initialize exports object immediately to handle circular dependencies
    if (!exports[moduleKey]) {
      exports[moduleKey] = {};
    }

    // Build URL - preserve extensions if present, otherwise add .js
    let url;
    url = baseUrl.endsWith('/') ? `${baseUrl}${moduleKey}` : `${baseUrl}/${moduleKey}`;

    console.log('📦 DEBUG processModule - fetching URL:', url);
    let response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load ${moduleKey}: ${response.status}`);
    }

    let code = await response.text();
    console.log('📦 DEBUG processModule original code length:', code.length, "module", moduleKey, code);

    code = transformImportMeta(code, moduleKey);
    code = transformExportFrom(code, moduleKey); // Process export...from first
    code = transformExports(code, moduleKey);
    code = transformImports(code, moduleKey, baseUrl);

    console.log("📦 DEBUG processModule transformed code length:", code.length, "module", moduleKey, code);

    cache.set(moduleKey, code);
    await executeModule(code, moduleKey);
  }

  // Execute transformed code
  async function executeModule(code, moduleKey) {
    // Initialize exports object immediately to handle circular dependencies
    if (!exports[moduleKey]) {
      exports[moduleKey] = {};
    }
    exports[moduleKey]._loading = true;

    try {
      if (code.includes('await ')) {
        await new Function('loadModule', 'exports', 'moduleKey', `return (async () => { ${code} \n})();`)(loadModule, exports, moduleKey);
      } else {
        new Function('loadModule', 'exports', 'moduleKey', code)(loadModule, exports, moduleKey);
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
        console.log('🔧 DEBUG loadScript extracted moduleKey:', moduleKey, 'from url:', url);
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
        let response = await fetch(url);

        if (!response.ok) throw new Error(`Failed to fetch ${url}`);

        let code = await response.text();

        console.log('📦 DEBUG loadScript original code length:', code.length, "module", moduleKey, code);

        code = transformImportMeta(code, moduleKey);
        code = transformExportFrom(code, moduleKey); // Process export...from first
        code = transformExports(code, moduleKey);
        console.log('🎯 DEBUG loadScript calling transformImports with baseUrl:', baseUrl);
        code = transformImports(code, moduleKey, baseUrl);

        console.log('📦 DEBUG loadScript transformed code length:', code.length, "module", moduleKey, code);

        cache.set(moduleKey, code);
        await executeModule(code, moduleKey);
      })();

      processing.set(moduleKey, promise);

      try {
        await promise;
        return exports[moduleKey] || {};
      } finally {
        processing.delete(moduleKey);
      }
    },

    // Process script string
    async processScript(scriptCode, moduleKey = 'main') {
      let code = transformImportMeta(scriptCode, moduleKey);

      console.log('📦 DEBUG processScript original code length:', code.length, "module", moduleKey, code);

      code = transformExportFrom(code, moduleKey); // Process export...from first
      code = transformExports(code, moduleKey);
      console.log('📝 DEBUG processScript calling transformImports with baseUrl:', baseUrl);
      code = transformImports(code, moduleKey, baseUrl);

      console.log("📦 DEBUG processScript transformed code length:", code.length, "module", moduleKey, code);

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
// const loader = createModuleLoader('http://localhost:3000');
// loader.loadScript('http://localhost:3000/src/entryPoint.ts')
