/**
 * Minimal Browser ES Module Transformer
 * Transforms ES modules to run in browser without native module support
 * Recursively processes dependencies on-demand
 *
 * Now using acorn for proper JavaScript parsing instead of complex regex!
 */

import { parse } from "acorn";

interface ModuleExports {
	[key: string]: any;
	_loading?: boolean;
}

interface ModuleCache {
	[moduleKey: string]: ModuleExports;
}

export interface ModuleLoader {
	loadScript: (url: string, moduleKey?: string) => Promise<ModuleExports>;
	processScript: (
		scriptCode: string,
		moduleKey?: string,
	) => Promise<ModuleExports>;
	loadModule: (moduleKey: string) => Promise<ModuleExports>;
	getModule: (moduleKey: string) => ModuleExports | undefined;
	isLoaded: (moduleKey: string) => boolean;
	clear: () => void;
	getAllExports: () => ModuleCache;
}

declare global {
	interface Window {
		createModuleLoader: (baseUrl?: string) => ModuleLoader;
		__hmr_cleanups?: (() => void)[];
		loadPageFromCdn: () => void;
	}
}

window.createModuleLoader = (baseUrl: string = ""): ModuleLoader => {
	console.log("🏗️ DEBUG createModuleLoader called with baseUrl:", baseUrl);

	const exports: ModuleCache = {};
	const cache = new Map<string, string>();
	const processing = new Map<string, Promise<void>>();

	// Helper function to parse JavaScript code using acorn
	function parseJS(code: string) {
		try {
			return parse(code, {
				ecmaVersion: "latest",
				sourceType: "module",
				allowHashBang: true,
				allowImportExportEverywhere: true,
				allowAwaitOutsideFunction: true,
			});
		} catch (error) {
			console.warn("⚠️ Failed to parse JavaScript with acorn:", error);
			throw new Error(`Failed to parse module code: ${error}`);
		}
	}

	// Transform exports using AST
	function transformExports(code: string, moduleKey: string): string {
		const ast = parseJS(code);
		const exportDeclarations: any[] = [];

		// Find all export declarations in the AST
		function findExports(node: any) {
			if (!node || typeof node !== "object") return;

			if (
				node.type === "ExportDefaultDeclaration" ||
				node.type === "ExportNamedDeclaration" ||
				node.type === "ExportAllDeclaration"
			) {
				exportDeclarations.push(node);
			}

			// Recursively search
			for (const key in node) {
				const value = node[key];
				if (Array.isArray(value)) {
					value.forEach(findExports);
				} else if (value && typeof value === "object") {
					findExports(value);
				}
			}
		}

		findExports(ast);

		let transformedCode = code;
		let additions = "";

		// Process exports from end to start to maintain positions
		const sortedExports = exportDeclarations.sort(
			(a, b) => (b.end || 0) - (a.end || 0),
		);

		for (const exportNode of sortedExports) {
			const start = exportNode.start || 0;
			const end = exportNode.end || 0;

			if (exportNode.type === "ExportDefaultDeclaration") {
				if (
					exportNode.declaration.type === "FunctionDeclaration" &&
					exportNode.declaration.id
				) {
					// export default function name() {}
					const funcName = exportNode.declaration.id.name;
					const funcCode = code.substring(
						exportNode.declaration.start,
						exportNode.declaration.end,
					);
					transformedCode =
						transformedCode.substring(0, start) +
						funcCode +
						transformedCode.substring(end);
					additions += `\nexports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["default"] = ${funcName};`;
				} else if (
					exportNode.declaration.type === "ClassDeclaration" &&
					exportNode.declaration.id
				) {
					// export default class Name {}
					const className = exportNode.declaration.id.name;
					const classCode = code.substring(
						exportNode.declaration.start,
						exportNode.declaration.end,
					);
					transformedCode =
						transformedCode.substring(0, start) +
						classCode +
						transformedCode.substring(end);
					additions += `\nexports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["default"] = ${className};`;
				} else {
					// export default expression
					const defaultValue = code.substring(
						exportNode.declaration.start,
						exportNode.declaration.end,
					);
					transformedCode =
						transformedCode.substring(0, start) +
						`const __default = ${defaultValue};` +
						transformedCode.substring(end);
					additions += `\nexports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["default"] = __default;`;
				}
			} else if (
				exportNode.type === "ExportNamedDeclaration" &&
				exportNode.declaration
			) {
				if (
					exportNode.declaration.type === "FunctionDeclaration" &&
					exportNode.declaration.id
				) {
					const funcName = exportNode.declaration.id.name;
					const funcCode = code.substring(
						exportNode.declaration.start,
						exportNode.declaration.end,
					);
					transformedCode =
						transformedCode.substring(0, start) +
						funcCode +
						transformedCode.substring(end);
					additions += `\nexports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["${funcName}"] = ${funcName};`;
				} else if (
					exportNode.declaration.type === "ClassDeclaration" &&
					exportNode.declaration.id
				) {
					const className = exportNode.declaration.id.name;
					const classCode = code.substring(
						exportNode.declaration.start,
						exportNode.declaration.end,
					);
					transformedCode =
						transformedCode.substring(0, start) +
						classCode +
						transformedCode.substring(end);
					additions += `\nexports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["${className}"] = ${className};`;
				} else if (exportNode.declaration.type === "VariableDeclaration") {
					const declarations = exportNode.declaration.declarations || [];
					const declCode = code.substring(
						exportNode.declaration.start,
						exportNode.declaration.end,
					);
					transformedCode =
						transformedCode.substring(0, start) +
						declCode +
						transformedCode.substring(end);

					for (const decl of declarations) {
						if (decl.id?.name) {
							additions += `\nexports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["${decl.id.name}"] = ${decl.id.name};`;
						}
					}
				}
			} else if (
				exportNode.type === "ExportNamedDeclaration" &&
				exportNode.specifiers
			) {
				// export { a, b }
				const specifiers = exportNode.specifiers || [];
				transformedCode =
					transformedCode.substring(0, start) + transformedCode.substring(end);

				for (const spec of specifiers) {
					const localName = spec.local?.name || "";
					const exportedName = spec.exported?.name || localName;
					additions += `\nexports["${moduleKey}"] = exports["${moduleKey}"] || {}; exports["${moduleKey}"]["${exportedName}"] = ${localName};`;
				}
			}
		}

		return transformedCode + additions;
	}

	// Transform imports using AST
	// Helper function to check if import should be handled by our module loader
	function isRelativeImport(source: string): boolean {
		// Handle relative paths
		if (source.startsWith("./") || source.startsWith("../")) return true;

		// Handle absolute paths from our source
		if (source.startsWith("/src/")) return true;

		// Handle node_modules paths (both absolute and relative)
		if (
			source.startsWith("/node_modules/") ||
			source.startsWith("node_modules/")
		)
			return true;

		// Handle root-level assets (SVG, CSS, etc.)
		if (source.startsWith("/") && !source.startsWith("//")) {
			// It's an absolute path relative to the server root
			return true;
		}

		// Skip external URLs
		if (source.startsWith("http://") || source.startsWith("https://"))
			return false;

		// Default: treat as relative if it doesn't look like an external URL
		return true;
	}

	function transformImports(
		code: string,
		currentModuleKey: string = "",
	): string {
		console.log("🚀 DEBUG transformImports called with:", currentModuleKey);
		console.log("🚀 DEBUG code snippet:", code.substring(0, 200) + "...");

		try {
			const ast = parseJS(code);
			console.log("🚀 DEBUG AST parsed successfully, type:", ast.type);

			const importDeclarations: any[] = [];

			// Find all import declarations and dynamic imports
			function findImports(node: any, depth = 0) {
				if (!node || typeof node !== "object") return;

				// Log some nodes to see what we're traversing (increase depth limit)
				if (depth < 8) {
					console.log(`🔍 DEBUG traversing node at depth ${depth}:`, node.type);
				}

				// Special check for Import type nodes
				if (node.type === "Import" || node.type === "ImportExpression") {
					console.log(`🔍 DEBUG found ${node.type} node at depth ${depth}!`);

					if (node.type === "ImportExpression") {
						const source = node.source?.value || "";
						console.log("🔍 DEBUG found ImportExpression with source:", source);
						if (source && isRelativeImport(source)) {
							console.log(
								"🔍 DEBUG ImportExpression is relative, adding to imports list",
							);
							importDeclarations.push({
								type: "DynamicImport",
								start: node.start,
								end: node.end,
								source: source,
							});
						} else {
							console.log(
								"🔍 DEBUG ImportExpression is NOT relative, skipping:",
								source,
							);
						}
					}
				}

				if (node.type === "ImportDeclaration") {
					importDeclarations.push(node);
					console.log("🔍 DEBUG found ImportDeclaration:", node.source?.value);
				} else if (node.type === "CallExpression") {
					// Log ALL CallExpressions to debug
					const calleeName =
						node.callee?.name || node.callee?.type || "unknown";
					if (depth < 8) {
						console.log(
							`🔍 DEBUG CallExpression at depth ${depth}, callee:`,
							calleeName,
						);
					}

					// Check all CallExpressions to see what we're dealing with
					if (node.callee?.type === "Import") {
						const source = node.arguments?.[0]?.value || "";
						console.log(
							"🔍 DEBUG found dynamic import CallExpression (Import callee):",
							source,
						);
						importDeclarations.push({
							type: "DynamicImport",
							start: node.start,
							end: node.end,
							source: source,
						});
					} else if (
						node.callee?.name === "import" ||
						(node.callee?.type === "Identifier" &&
							node.callee?.name === "import")
					) {
						const source = node.arguments?.[0]?.value || "";
						console.log(
							"🔍 DEBUG found dynamic import CallExpression (import identifier):",
							source,
						);
						importDeclarations.push({
							type: "DynamicImport",
							start: node.start,
							end: node.end,
							source: source,
						});
					} else if (
						node.callee?.type === "MemberExpression" &&
						node.callee?.object?.type === "CallExpression" &&
						node.callee?.object?.callee?.type === "Import"
					) {
						// Handle import("...").then() pattern
						const source = node.callee.object.arguments?.[0]?.value || "";
						console.log(
							"🔍 DEBUG found dynamic import in MemberExpression (.then pattern):",
							source,
						);
						// For this case, we want to transform the inner import() call
						const importCall = node.callee.object;
						importDeclarations.push({
							type: "DynamicImport",
							start: importCall.start,
							end: importCall.end,
							source: source,
						});
					} else {
						// Log all CallExpressions to debug
						if (
							node.arguments?.[0]?.value &&
							typeof node.arguments[0].value === "string" &&
							node.arguments[0].value.includes("./assets/")
						) {
							console.log(
								"🔍 DEBUG found CallExpression with asset path:",
								calleeName,
								node.arguments[0].value,
							);
						}

						// Also check if this is the depth 4 MemberExpression we saw
						if (depth === 4 && calleeName === "MemberExpression") {
							console.log("🔍 DEBUG inspecting depth 4 MemberExpression:", {
								object: node.callee?.object?.type,
								property: node.callee?.property?.name,
								objectCallee: node.callee?.object?.callee?.type,
							});
						}
					}
				} // Recursively search
				for (const key in node) {
					const value = node[key];
					if (Array.isArray(value)) {
						value.forEach((child) => {
							findImports(child, depth + 1);
						});
					} else if (value && typeof value === "object") {
						findImports(value, depth + 1);
					}
				}
			}
			findImports(ast);
			console.log("🔍 DEBUG total imports found:", importDeclarations.length);
			let transformedCode = code;

			// Process imports from end to start to maintain positions
			const sortedImports = importDeclarations.sort(
				(a, b) => (b.end || 0) - (a.end || 0),
			);

			for (const importNode of sortedImports) {
				const start = importNode.start || 0;
				const end = importNode.end || 0;

				let replacement = "";

				if (importNode.type === "DynamicImport") {
					// Handle dynamic imports like import("./module")
					const source = importNode.source || "";
					console.log("🔄 DEBUG found dynamic import:", source);

					if (isRelativeImport(source)) {
						const moduleKey = resolveModulePath(source, currentModuleKey);
						replacement = `loadModule('${moduleKey}')`;
						console.log(
							"🔄 DEBUG transforming dynamic import from:",
							source,
							"to loadModule call for:",
							moduleKey,
						);

						transformedCode =
							transformedCode.substring(0, start) +
							replacement +
							transformedCode.substring(end);
					} else {
						console.log(
							"🔄 DEBUG skipping non-relative dynamic import:",
							source,
						);
					}
				} else {
					// Handle static imports
					const source = importNode.source?.value || "";
					const moduleKey = resolveModulePath(source, currentModuleKey);

					if (!importNode.specifiers || importNode.specifiers.length === 0) {
						// Side effect import: import "path"
						replacement = `await loadModule('${moduleKey}');`;
					} else {
						for (const spec of importNode.specifiers) {
							if (spec.type === "ImportDefaultSpecifier") {
								// Default import: import name from "path"
								replacement += `const ${spec.local.name} = (await loadModule('${moduleKey}'))['default'] || await loadModule('${moduleKey}');\n`;
							} else if (spec.type === "ImportNamespaceSpecifier") {
								// Namespace import: import * as name from "path"
								replacement += `const ${spec.local.name} = await loadModule('${moduleKey}');\n`;
							} else if (spec.type === "ImportSpecifier") {
								// Named import: import { name } from "path" or import { name as alias } from "path"
								const importName = spec.imported.name;
								const localName = spec.local.name;
								replacement += `const ${localName} = (await loadModule('${moduleKey}'))['${importName}'];\n`;
							}
						}
					}

					transformedCode =
						transformedCode.substring(0, start) +
						replacement.trim() +
						transformedCode.substring(end);
				}
			}

			return transformedCode;
		} catch (error) {
			console.error("🔥 DEBUG transformImports failed:", error);
			return code; // Return original code if transformation fails
		}
	}

	// Transform import.meta references using simple string replacement (no need for AST here)
	function transformImportMeta(code: string, moduleKey: string): string {
		const mockImportMeta = `
      const importMeta = {
        hot: {
          dispose: function(callback) {
            if (typeof callback === 'function') {
              window.__hmr_cleanups = window.__hmr_cleanups || [];
              window.__hmr_cleanups.push(callback);
            }
          },
          accept: function(callback) {
            console.log('HMR accept called (mocked)');
          }
        },
        url: '${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}${moduleKey}.js',
        env: {
          DEV: true,
          PROD: false,
          MODE: 'development'
        }
      };
    `;

		return code
			.replace(/import\.meta/g, "importMeta")
			.replace(/^/, mockImportMeta);
	}

	// Transform export...from statements using AST
	function transformExportFrom(code: string, moduleKey: string): string {
		const ast = parseJS(code);
		const exportFromDeclarations: any[] = [];
		let tempModuleCounter = 0;

		// Find all export...from declarations
		function findExportFroms(node: any) {
			if (!node || typeof node !== "object") return;

			if (
				(node.type === "ExportNamedDeclaration" ||
					node.type === "ExportAllDeclaration") &&
				node.source
			) {
				exportFromDeclarations.push(node);
			}

			// Recursively search
			for (const key in node) {
				const value = node[key];
				if (Array.isArray(value)) {
					value.forEach(findExportFroms);
				} else if (value && typeof value === "object") {
					findExportFroms(value);
				}
			}
		}

		findExportFroms(ast);

		let transformedCode = code;

		// Process export...from statements from end to start
		const sortedExports = exportFromDeclarations.sort(
			(a, b) => (b.end || 0) - (a.end || 0),
		);

		for (const exportNode of sortedExports) {
			const start = exportNode.start || 0;
			const end = exportNode.end || 0;
			const source = exportNode.source?.value || "";
			const resolvedPath = resolveModulePath(source, moduleKey);
			const tempVarName = `__temp_module_${tempModuleCounter++}`;

			let replacement = "";

			if (exportNode.type === "ExportAllDeclaration") {
				// export * from "path"
				replacement = `
const ${tempVarName} = await loadModule('${resolvedPath}');
exports["${moduleKey}"] = exports["${moduleKey}"] || {};
Object.keys(${tempVarName}).forEach(key => {
  if (key !== 'default') {
    exports["${moduleKey}"][key] = ${tempVarName}[key];
  }
});
`;
			} else if (
				exportNode.type === "ExportNamedDeclaration" &&
				exportNode.specifiers
			) {
				// export { a, b } from "path"
				const specifiers = exportNode.specifiers || [];
				replacement = `const ${tempVarName} = await loadModule('${resolvedPath}');\n`;
				replacement += `exports["${moduleKey}"] = exports["${moduleKey}"] || {};\n`;

				for (const spec of specifiers) {
					const importName = spec.local?.name || "";
					const exportName = spec.exported?.name || importName;
					replacement += `exports["${moduleKey}"]["${exportName}"] = ${tempVarName}["${importName}"];\n`;
				}
			}

			transformedCode =
				transformedCode.substring(0, start) +
				replacement.trim() +
				transformedCode.substring(end);
		}

		return transformedCode;
	}

	// Resolve module path based on current module location
	function resolveModulePath(
		importPath: string,
		currentModuleKey: string,
	): string {
		console.log(
			"🔧 DEBUG resolveModulePath called with importPath:",
			importPath,
			"currentModuleKey:",
			currentModuleKey,
		);

		// Always ensure we work with paths relative to the CDN baseUrl
		// Never use absolute URLs from other domains

		// Handle node_modules paths
		if (
			importPath.startsWith("/node_modules/") ||
			importPath.startsWith("node_modules/")
		) {
			let resolved = importPath.startsWith("/")
				? importPath.substring(1)
				: importPath;
			console.log(
				"🔧 DEBUG resolveModulePath resolved node_modules path to:",
				resolved,
			);
			return resolved;
		}

		// If it's an absolute URL, extract just the path part if it's from our CDN
		if (importPath.startsWith("http://") || importPath.startsWith("https://")) {
			try {
				const url = new URL(importPath);
				const baseUrlObj = new URL(baseUrl);

				// Only allow URLs from the same origin as our baseUrl
				if (url.origin === baseUrlObj.origin) {
					let resolved = url.pathname;
					// Remove leading slash and any base path
					if (resolved.startsWith("/")) resolved = resolved.substring(1);
					if (
						baseUrlObj.pathname !== "/" &&
						resolved.startsWith(baseUrlObj.pathname.substring(1))
					) {
						resolved = resolved.substring(baseUrlObj.pathname.length - 1);
					}
					console.log(
						"🔧 DEBUG resolveModulePath resolved absolute URL to:",
						resolved,
					);
					return resolved;
				} else {
					console.warn("⚠️ WARNING: Blocked cross-origin import:", importPath);
					throw new Error(`Cross-origin imports not allowed: ${importPath}`);
				}
			} catch (error) {
				console.warn("⚠️ WARNING: Invalid URL in import:", importPath, error);
				throw new Error(`Invalid import URL: ${importPath}`);
			}
		}

		// Preserve path as-is, just remove leading slash if present
		let resolved = importPath.startsWith("/")
			? importPath.substring(1)
			: importPath;

		// Handle relative imports - resolve them relative to current module location
		if (importPath.startsWith("./") || importPath.startsWith("../")) {
			let currentDir = "";

			if (currentModuleKey.includes("/")) {
				currentDir = currentModuleKey.substring(
					0,
					currentModuleKey.lastIndexOf("/"),
				);
			}

			if (importPath.startsWith("./")) {
				const relativePath = importPath.substring(2);
				resolved = currentDir ? `${currentDir}/${relativePath}` : relativePath;
			} else if (importPath.startsWith("../")) {
				let pathParts = currentDir ? currentDir.split("/") : [];
				let remainingPath = importPath;

				while (remainingPath.startsWith("../")) {
					pathParts.pop();
					remainingPath = remainingPath.substring(3);
				}

				if (remainingPath) {
					pathParts = pathParts.concat(remainingPath.split("/"));
				}

				resolved = pathParts.join("/");
			}
		}

		console.log("🔧 DEBUG resolveModulePath resolved to:", resolved);
		return resolved;
	}

	// Load module function
	async function loadModule(moduleKey: string): Promise<ModuleExports> {
		if (exports[moduleKey] && !exports[moduleKey]._loading) {
			console.log("🚚 DEBUG loadModule - module already loaded:", moduleKey);
			return exports[moduleKey];
		}

		if (processing.has(moduleKey)) {
			console.log(
				"🚚 DEBUG loadModule - module is being processed (circular dependency):",
				moduleKey,
			);
			if (exports[moduleKey]) {
				console.log(
					"🔄 DEBUG loadModule - returning partially loaded exports for circular dependency:",
					moduleKey,
				);
				return exports[moduleKey];
			}
			await processing.get(moduleKey);
			return exports[moduleKey] || {};
		}

		if (cache.has(moduleKey)) {
			console.log("🚚 DEBUG loadModule - module found in cache:", moduleKey);
			await executeModule(cache.get(moduleKey)!, moduleKey);
			return exports[moduleKey] || {};
		}

		console.log("🚚 DEBUG loadModule - loading module:", moduleKey);
		const promise = processModule(moduleKey);
		processing.set(moduleKey, promise);

		try {
			await promise;
			console.log(
				"🚚 DEBUG loadModule - module loaded successfully:",
				moduleKey,
			);
			return exports[moduleKey] || {};
		} finally {
			processing.delete(moduleKey);
		}
	}

	// Process module: fetch and transform
	async function processModule(moduleKey: string): Promise<void> {
		console.log("📦 DEBUG processModule called with moduleKey:", moduleKey);

		if (!exports[moduleKey]) {
			exports[moduleKey] = {};
		}

		// Ensure URL is properly constructed with baseUrl
		let url: string;
		if (moduleKey.startsWith("http://") || moduleKey.startsWith("https://")) {
			// If moduleKey is already a full URL, use it directly (but validate it's from our domain)
			url = moduleKey;
		} else {
			// Construct URL from baseUrl and moduleKey
			url = baseUrl.endsWith("/")
				? `${baseUrl}${moduleKey}`
				: `${baseUrl}/${moduleKey}`;
		}

		console.log("📦 DEBUG processModule - fetching URL:", url);

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`Failed to load ${moduleKey}: ${response.status} ${response.statusText}`,
				);
			}

			// Check if we got HTML instead of JavaScript (common with incorrect URLs)
			const contentType = response.headers.get("content-type") || "";
			if (contentType.includes("text/html")) {
				throw new Error(
					`Received HTML instead of JavaScript for ${moduleKey}. Check if the URL is correct: ${url}`,
				);
			}

			let code = await response.text();
			console.log("📦 DEBUG processModule original code length:", code.length);

			code = transformImports(code, moduleKey);
			code = transformImportMeta(code, moduleKey);
			code = transformExportFrom(code, moduleKey);
			code = transformExports(code, moduleKey);

			console.log(
				"📦 DEBUG processModule transformed code length:",
				code.length,
			);

			cache.set(moduleKey, code);
			await executeModule(code, moduleKey);
		} catch (error) {
			console.error("❌ Error processing module:", moduleKey, error);
			throw error;
		}
	}

	// Execute transformed code
	async function executeModule(code: string, moduleKey: string): Promise<void> {
		if (!exports[moduleKey]) {
			exports[moduleKey] = {};
		}
		exports[moduleKey]._loading = true;

		try {
			if (code.includes("await ")) {
				await new Function(
					"loadModule",
					"exports",
					"moduleKey",
					`return (async () => { ${code}\n})();`,
				)(loadModule, exports, moduleKey);
			} else {
				new Function("loadModule", "exports", "moduleKey", code)(
					loadModule,
					exports,
					moduleKey,
				);
			}
		} finally {
			delete exports[moduleKey]._loading;
		}
	}

	// Public API
	return {
		async loadScript(url: string, moduleKey?: string): Promise<ModuleExports> {
			if (!moduleKey) {
				let relativePath = url;
				if (url.startsWith(baseUrl)) {
					relativePath = url.substring(baseUrl.length);
					if (relativePath.startsWith("/")) {
						relativePath = relativePath.substring(1);
					}
				}
				moduleKey = relativePath.replace(/\.[^.]+$/, "");
				console.log(
					"🔧 DEBUG loadScript extracted moduleKey:",
					moduleKey,
					"from url:",
					url,
				);
			}

			if (exports[moduleKey] && !exports[moduleKey]._loading) {
				return exports[moduleKey];
			}

			if (processing.has(moduleKey)) {
				await processing.get(moduleKey);
				return exports[moduleKey] || {};
			}

			if (cache.has(moduleKey)) {
				await executeModule(cache.get(moduleKey)!, moduleKey);
				return exports[moduleKey] || {};
			}

			const promise = (async () => {
				const response = await fetch(url);
				if (!response.ok) throw new Error(`Failed to fetch ${url}`);

				let code = await response.text();
				console.log("📦 DEBUG loadScript original code length:", code.length);

				code = transformImports(code, moduleKey);
				code = transformImportMeta(code, moduleKey);
				code = transformExportFrom(code, moduleKey);
				code = transformExports(code, moduleKey);

				console.log(
					"📦 DEBUG loadScript transformed code length:",
					code.length,
				);

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

		async processScript(
			scriptCode: string,
			moduleKey: string = "main",
		): Promise<ModuleExports> {
			console.log(
				"📦 DEBUG processScript original code length:",
				scriptCode.length,
			);

			let code = transformImports(scriptCode, moduleKey);
			code = transformImportMeta(code, moduleKey);
			code = transformExportFrom(code, moduleKey);
			code = transformExports(code, moduleKey);

			console.log(
				"📦 DEBUG processScript transformed code length:",
				code.length,
			);

			await executeModule(code, moduleKey);
			return exports[moduleKey] || {};
		},

		loadModule,
		getModule: (moduleKey: string): ModuleExports | undefined =>
			exports[moduleKey],
		isLoaded: (moduleKey: string): boolean =>
			!!exports[moduleKey] && !exports[moduleKey]._loading,
		clear: (): void => {
			cache.clear();
			processing.clear();
			Object.keys(exports).forEach((key) => {
				delete exports[key];
			});
		},
		getAllExports: (): ModuleCache => exports,
	};
};

import { version as packageJsonVersion } from "../package.json" with {
	type: "json",
};

window.loadPageFromCdn = () => {
	// Initialize the module loader
	document.body.innerHTML = "";
	document.head.innerHTML = "";
	document.body.appendChild(document.createElement("div")).id = "app";

	const loader = window.createModuleLoader(
		`https://cdn.jsdelivr.net/gh/Woyken/project-cactus-byte@${packageJsonVersion}/`,
	);
	loader.loadScript(
		`https://cdn.jsdelivr.net/gh/Woyken/project-cactus-byte@${packageJsonVersion}/entryPoint.js`,
	);

	// const loader = window.createModuleLoader('http://localhost:3000/');
	// loader.loadScript('http://localhost:3000/src/entryPoint.ts');
};
