import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GLOBAL_EXPORTS_KEY = 'customExports';

// Parse command line arguments for prefix URL
const args = process.argv.slice(2);
const prefixUrlArg = args.find(arg => arg.startsWith('--prefix-url='));
const PREFIX_URL = prefixUrlArg ? prefixUrlArg.split('=')[1] : process.env.CDN_PREFIX_URL || null;

function transformExports(code, filename) {
  let result = code;
  const moduleKey = filename.replace(/\.[^.]+$/, ''); // Remove .js extension

  const initCode = `window.${GLOBAL_EXPORTS_KEY} = window.${GLOBAL_EXPORTS_KEY} || {};\n`;

  // Transform: export const x = y
  result = result.replace(
    /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g,
    (match, name, value) => {
      return `
${initCode}
const ${name} = ${value};
window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"] = window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"] || {};
window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"]["${name}"] = ${name};
`;
    }
  );

  // Transform: export { x, y }
  result = result.replace(
    /export\s*\{\s*([^}]+)\s*\}/g,
    (match, exports) => {
      const names = exports.split(',').map(e => e.trim());
      let assignments = `
${initCode}
window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"] = window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"] || {};
`;
      names.forEach(name => {
        const parts = name.split(' as ');
        const localName = parts[0].trim();
        const exportName = parts[1] ? parts[1].trim() : localName;
        assignments += `
window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"]["${exportName}"] = ${localName};
`;
      });
      return assignments;
    }
  );

  // Transform: export default x
  result = result.replace(
    /export\s+default\s+([^;]+);?/g,
    (match, value) => {
      return `
${initCode}
const __default = ${value};
window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"] = window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"] || {};
window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"]["default"] = __default;
`;
    }
  );

  return result;
}

function transformImports(code) {
  let result = code;

  // Transform dynamic imports: import('./module') or import("./module")
  result = result.replace(
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    (match, modulePath) => {
      const moduleKey = path.basename(modulePath).replace(/\.[^.]+$/, '');
      return `loadModule('${moduleKey}')`;
    }
  );

  // Transform: import { x } from './module'
  result = result.replace(
    /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g,
    (match, imports, modulePath) => {
      const moduleKey = path.basename(modulePath).replace(/\.[^.]+$/, '');
      const names = imports.split(',').map(i => i.trim());
      let assignments = '';
      names.forEach(name => {
        const parts = name.split(' as ');
        const importName = parts[0].trim();
        const localName = parts[1] ? parts[1].trim() : importName;
        assignments += `const ${localName} = (await loadModule('${moduleKey}'))['${importName}'];\n`;
      });
      return assignments;
    }
  );

  // Transform: import x from './module'
  result = result.replace(
    /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"]([^'"]+)['"]/g,
    (match, name, modulePath) => {
      const moduleKey = path.basename(modulePath).replace(/\.[^.]+$/, '');
      return `const ${name} = (await loadModule('${moduleKey}'))['default'] || await loadModule('${moduleKey}');`;
    }
  );

  return result;
}

function createLoaderFunction(prefixUrl) {
  const baseUrl = prefixUrl ? prefixUrl : '/assets/';

  return `
async function loadModule(moduleName) {
  if (window.${GLOBAL_EXPORTS_KEY} && window.${GLOBAL_EXPORTS_KEY}[moduleName]) {
    // If module is still loading, wait for it
    if (window.${GLOBAL_EXPORTS_KEY}[moduleName]._loading) {
      await window.${GLOBAL_EXPORTS_KEY}[moduleName]._loading;
      delete window.${GLOBAL_EXPORTS_KEY}[moduleName]._loading;
    }
    return window.${GLOBAL_EXPORTS_KEY}[moduleName];
  }

  if (window.${GLOBAL_EXPORTS_KEY}) {
    const files = Object.keys(window.${GLOBAL_EXPORTS_KEY});
    const match = files.find(f => f.startsWith(moduleName + '-') || f === moduleName + '.js');
    if (match) {
      // If matched module is still loading, wait for it
      if (window.${GLOBAL_EXPORTS_KEY}[match]._loading) {
        await window.${GLOBAL_EXPORTS_KEY}[match]._loading;
        delete window.${GLOBAL_EXPORTS_KEY}[match]._loading;
      }
      return window.${GLOBAL_EXPORTS_KEY}[match];
    }
  }

  try {
    const baseUrl = '${baseUrl}';
    const url = baseUrl.endsWith('/') ? \`\${baseUrl}\${moduleName}.js\` : \`\${baseUrl}/\${moduleName}.js\`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(\`Failed to load module: \${response.status} \${response.statusText}\`);
    }

    const code = await response.text();
    eval(code);
    return window.${GLOBAL_EXPORTS_KEY}[moduleName] || {};
  } catch (error) {
    console.error('Error loading module:', moduleName, error);
    return {};
  }
}
`;
}

async function processAssets() {
  const assetsPath = path.resolve(__dirname, '../dist/assets');

  if (!fs.existsSync(assetsPath)) {
    console.log('Assets directory not found');
    return;
  }

  const files = fs.readdirSync(assetsPath).filter(f => f.endsWith('.js'));
  console.log(`Processing ${files.length} files...`);

  if (PREFIX_URL) {
    console.log(`Using prefix URL: ${PREFIX_URL}`);
  } else {
    console.log('Using default relative paths (/assets/)');
  }

  const initCode = `window.${GLOBAL_EXPORTS_KEY} = window.${GLOBAL_EXPORTS_KEY} || {};\n`;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(assetsPath, file);
    let code = fs.readFileSync(filePath, 'utf-8');

    code = initCode + createLoaderFunction(PREFIX_URL) + code;

    code = transformExports(code, file);
    code = transformImports(code);

    if (code.includes('await ')) {
      const moduleKey = file.replace(/\.[^.]+$/, ''); // Remove .js extension
      code = initCode + `
window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"] = window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"] || {};
window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"]._loading = (async function() {
${code}
})();
window.${GLOBAL_EXPORTS_KEY}["${moduleKey}"]._loading.catch(console.error);
`;
    }

    fs.writeFileSync(filePath, code);
    console.log(`✓ ${file}`);
  }

  console.log('Done!');
}

processAssets().catch(console.error);

/*
  Prefix script imports with url of your cdn, like
  https://cdn.jsdelivr.net/gh/username/repo...
  or local dev server

  example usage in console:
  pnpm build:postprocess --prefix-url=http://localhost:4173/assets/
*/
