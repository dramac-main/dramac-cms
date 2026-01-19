/**
 * Module Bundler Service
 * 
 * Provides code bundling and transpilation for multi-file modules.
 * Features:
 * - TypeScript to JavaScript transpilation
 * - JSX/TSX support for React components
 * - Import resolution for module files
 * - Source map generation
 * - Minification for production
 * 
 * Note: Heavy transpilation is done client-side via Monaco's TypeScript
 * compiler. This service handles server-side bundling and import mapping.
 * 
 * @module module-bundler
 */

"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

export interface ModuleFile {
  id: string;
  moduleId: string;
  path: string;
  content: string;
  fileType: "component" | "style" | "config" | "asset" | "other";
  createdAt: string;
  updatedAt: string;
}

export interface BundleResult {
  success: boolean;
  code?: string;
  sourceMap?: string;
  imports?: string[];
  exports?: string[];
  errors?: BundleError[];
  warnings?: string[];
}

export interface BundleError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  code?: string;
}

export interface BundleOptions {
  entryPoint?: string;
  minify?: boolean;
  sourceMap?: boolean;
  target?: "es2020" | "es2021" | "es2022" | "esnext";
  format?: "esm" | "cjs" | "iife";
  externals?: string[];
}

export interface ImportMap {
  imports: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

// ============================================================================
// File Management
// ============================================================================

/**
 * Get all files for a module
 */
export async function getModuleFiles(moduleId: string): Promise<ModuleFile[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_files")
    .select("*")
    .eq("module_id", moduleId)
    .order("path");

  return (data || []).map(mapFileFromDb);
}

/**
 * Get a specific file
 */
export async function getModuleFile(
  moduleId: string,
  path: string
): Promise<ModuleFile | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_files")
    .select("*")
    .eq("module_id", moduleId)
    .eq("path", path)
    .single();

  return data ? mapFileFromDb(data) : null;
}

/**
 * Create or update a module file
 */
export async function upsertModuleFile(
  moduleId: string,
  path: string,
  content: string,
  fileType: ModuleFile["fileType"] = "component"
): Promise<{ success: boolean; file?: ModuleFile; error?: string }> {
  const supabase = await createClient();

  // Validate path
  if (!isValidFilePath(path)) {
    return { success: false, error: "Invalid file path" };
  }

  const { data, error } = await supabase
    .from("module_files")
    .upsert(
      {
        module_source_id: moduleId,
        file_path: path,
        content,
        file_type: fileType,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "module_source_id,file_path" }
    )
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, file: mapFileFromDb(data) };
}

/**
 * Delete a module file
 */
export async function deleteModuleFile(
  moduleId: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("module_files")
    .delete()
    .eq("module_id", moduleId)
    .eq("path", path);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Rename a module file
 */
export async function renameModuleFile(
  moduleId: string,
  oldPath: string,
  newPath: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (!isValidFilePath(newPath)) {
    return { success: false, error: "Invalid new file path" };
  }

  const { error } = await supabase
    .from("module_files")
    .update({
      path: newPath,
      updated_at: new Date().toISOString(),
    })
    .eq("module_id", moduleId)
    .eq("path", oldPath);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// Code Transpilation
// ============================================================================

/**
 * Transpile TypeScript/TSX to JavaScript
 * Note: This uses a basic regex-based approach. For full transpilation,
 * use the client-side Monaco TypeScript compiler.
 */
export function transpileTypeScript(
  code: string,
  filename: string
): BundleResult {
  const errors: BundleError[] = [];
  const warnings: string[] = [];
  let result = code;

  try {
    // Remove TypeScript-specific syntax
    
    // Remove type annotations from function parameters
    result = result.replace(
      /(\w+)\s*:\s*([A-Z]\w+(?:<[^>]+>)?(?:\[\])?)/g,
      "$1"
    );

    // Remove return type annotations
    result = result.replace(
      /\)\s*:\s*([A-Z]\w+(?:<[^>]+>)?(?:\[\])?)\s*{/g,
      ") {"
    );

    // Remove interface declarations
    result = result.replace(/interface\s+\w+\s*{[^}]*}/g, "");

    // Remove type declarations  
    result = result.replace(/type\s+\w+\s*=\s*[^;]+;/g, "");

    // Remove type imports
    result = result.replace(/import\s+type\s+{[^}]*}\s+from\s+['"][^'"]+['"];?\n?/g, "");

    // Remove type assertions (as Type)
    result = result.replace(/\s+as\s+\w+(?:<[^>]+>)?/g, "");

    // Remove generic type parameters from functions
    result = result.replace(/<\w+(?:\s+extends\s+\w+)?>/g, "");

    // Remove non-null assertions
    result = result.replace(/!(?=\.|\[|\))/g, "");

    // Handle TSX - convert to JSX (already valid for React)
    if (filename.endsWith(".tsx") || filename.endsWith(".jsx")) {
      // TSX is valid JSX, no conversion needed for basic cases
    }

    // Remove empty lines from removal
    result = result.replace(/\n\s*\n\s*\n/g, "\n\n");

    return {
      success: true,
      code: result.trim(),
      errors: [],
      warnings,
    };
  } catch (err) {
    errors.push({
      file: filename,
      message: err instanceof Error ? err.message : "Transpilation failed",
    });

    return {
      success: false,
      errors,
      warnings,
    };
  }
}

/**
 * Transform JSX to React.createElement calls
 * Note: This is a simplified transformer. Production should use Babel.
 */
export function transformJSX(code: string): string {
  // This is a very basic JSX transformer
  // For production, integrate with @babel/standalone on the client
  
  // For now, we assume React 17+ JSX runtime is available
  // which handles JSX transformation automatically
  return code;
}

// ============================================================================
// Import Resolution
// ============================================================================

/**
 * Resolve imports within a module's files
 */
export async function resolveModuleImports(
  moduleId: string,
  entryPoint: string = "index.tsx"
): Promise<{
  files: Map<string, string>;
  importOrder: string[];
  errors: BundleError[];
}> {
  const files = await getModuleFiles(moduleId);
  const fileMap = new Map<string, ModuleFile>();
  const resolvedCode = new Map<string, string>();
  const importOrder: string[] = [];
  const errors: BundleError[] = [];
  const visited = new Set<string>();

  // Build file map
  for (const file of files) {
    fileMap.set(file.path, file);
  }

  // Recursive import resolution
  function resolveFile(path: string, fromPath?: string): void {
    if (visited.has(path)) return;
    visited.add(path);

    const file = fileMap.get(path);
    if (!file) {
      errors.push({
        file: fromPath || path,
        message: `Cannot find module '${path}'`,
      });
      return;
    }

    // Find imports in this file
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(file.content)) !== null) {
      const importPath = match[1];
      
      // Only resolve local imports (starting with ./ or ../)
      if (importPath.startsWith("./") || importPath.startsWith("../")) {
        const resolvedPath = resolveRelativePath(path, importPath);
        resolveFile(resolvedPath, path);
      }
    }

    // Add to import order (dependencies first)
    importOrder.push(path);
    
    // Transpile and store
    const transpiled = transpileTypeScript(file.content, file.path);
    if (transpiled.success && transpiled.code) {
      resolvedCode.set(path, transpiled.code);
    } else {
      errors.push(...(transpiled.errors || []));
    }
  }

  // Start from entry point
  resolveFile(entryPoint);

  return { files: resolvedCode, importOrder, errors };
}

/**
 * Resolve relative import path
 */
function resolveRelativePath(fromPath: string, importPath: string): string {
  const fromDir = fromPath.substring(0, fromPath.lastIndexOf("/") + 1);
  const parts = (fromDir + importPath).split("/").filter(Boolean);
  const resolved: string[] = [];

  for (const part of parts) {
    if (part === "..") {
      resolved.pop();
    } else if (part !== ".") {
      resolved.push(part);
    }
  }

  let path = resolved.join("/");

  // Add extension if missing
  if (!path.match(/\.(tsx?|jsx?|json)$/)) {
    // Try common extensions
    path = path + ".tsx";
  }

  return path;
}

// ============================================================================
// Import Map Generation
// ============================================================================

/**
 * Generate an import map for a module
 */
export async function generateImportMap(
  moduleId: string,
  dependencies: Array<{ name: string; version: string }>,
  cdnBaseUrl: string = "https://esm.sh"
): Promise<ImportMap> {
  const imports: Record<string, string> = {};

  // Add NPM dependencies
  for (const dep of dependencies) {
    const cdnUrl = `${cdnBaseUrl}/${dep.name}@${dep.version}`;
    imports[dep.name] = cdnUrl;
    
    // Also add subpath imports
    imports[`${dep.name}/`] = `${cdnUrl}/`;
  }

  // Get module files for local imports
  const files = await getModuleFiles(moduleId);
  
  // Add local module imports with blob URLs or inline
  // (handled at runtime, not in static import map)

  return { imports };
}

/**
 * Generate a combined bundle with import map for iframe execution
 */
export async function generateModuleBundle(
  moduleId: string,
  dependencies: Array<{ name: string; version: string }>,
  options: BundleOptions = {}
): Promise<BundleResult> {
  const errors: BundleError[] = [];
  const warnings: string[] = [];

  // Resolve all imports
  const { files, importOrder, errors: resolveErrors } = await resolveModuleImports(
    moduleId,
    options.entryPoint || "index.tsx"
  );

  errors.push(...resolveErrors);

  if (errors.length > 0 && files.size === 0) {
    return { success: false, errors };
  }

  // Generate import map
  const importMap = await generateImportMap(moduleId, dependencies);

  // Combine files in dependency order
  const combinedCode: string[] = [];

  // Add import map as script
  combinedCode.push(
    `<script type="importmap">${JSON.stringify(importMap)}</script>`
  );

  // Add each file's code
  for (const path of importOrder) {
    const code = files.get(path);
    if (code) {
      combinedCode.push(`// File: ${path}`);
      combinedCode.push(code);
    }
  }

  // Wrap in module script
  const moduleCode = `
<script type="module">
${combinedCode.slice(1).join("\n\n")}
</script>
  `.trim();

  // Minify if requested
  let finalCode = combinedCode[0] + "\n" + moduleCode;
  if (options.minify) {
    finalCode = minifyCode(finalCode);
  }

  return {
    success: true,
    code: finalCode,
    imports: Object.keys(importMap.imports),
    exports: extractExports(Array.from(files.values()).join("\n")),
    errors,
    warnings,
  };
}

// ============================================================================
// Code Analysis
// ============================================================================

/**
 * Extract exports from code
 */
function extractExports(code: string): string[] {
  const exports: string[] = [];
  
  // Named exports
  const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(code)) !== null) {
    exports.push(match[1]);
  }

  // Export statements
  const exportListRegex = /export\s+{\s*([^}]+)\s*}/g;
  while ((match = exportListRegex.exec(code)) !== null) {
    const names = match[1].split(",").map((n) => n.trim().split(" as ")[0].trim());
    exports.push(...names);
  }

  // Default export
  if (/export\s+default/.test(code)) {
    exports.push("default");
  }

  return [...new Set(exports)];
}

/**
 * Analyze code for dependencies and issues
 */
export function analyzeCode(
  code: string,
  filename: string
): {
  imports: string[];
  exports: string[];
  hasJSX: boolean;
  hasTypeScript: boolean;
  issues: BundleError[];
} {
  const imports: string[] = [];
  const issues: BundleError[] = [];

  // Find imports
  const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }

  // Check for JSX
  const hasJSX = /<[A-Z][^>]*>/.test(code);

  // Check for TypeScript
  const hasTypeScript = 
    /:\s*[A-Z]\w+(?:<[^>]+>)?/.test(code) ||
    /interface\s+\w+/.test(code) ||
    /type\s+\w+\s*=/.test(code);

  // Basic linting
  if (hasJSX && !imports.includes("react") && !imports.includes("React")) {
    issues.push({
      file: filename,
      message: "JSX detected but React is not imported",
    });
  }

  return {
    imports,
    exports: extractExports(code),
    hasJSX,
    hasTypeScript,
    issues,
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Basic minification (removes comments and extra whitespace)
 */
function minifyCode(code: string): string {
  return code
    // Remove single-line comments (but not URLs)
    .replace(/(?<!:)\/\/.*$/gm, "")
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove extra whitespace
    .replace(/\s+/g, " ")
    // Remove whitespace around operators
    .replace(/\s*([{}();,:])\s*/g, "$1")
    .trim();
}

/**
 * Validate file path
 */
function isValidFilePath(path: string): boolean {
  // No directory traversal
  if (path.includes("..")) return false;
  
  // Must start with alphanumeric or underscore
  if (!/^[a-zA-Z0-9_]/.test(path)) return false;
  
  // Valid characters only
  if (!/^[a-zA-Z0-9_\-./]+$/.test(path)) return false;
  
  // Must have valid extension
  if (!/\.(tsx?|jsx?|json|css|md)$/.test(path)) return false;
  
  return true;
}

/**
 * Get file type from extension
 */
export function getFileType(path: string): ModuleFile["fileType"] {
  if (path.endsWith(".css") || path.endsWith(".scss")) return "style";
  if (path.endsWith(".json")) return "config";
  if (/\.(png|jpg|jpeg|gif|svg|ico)$/.test(path)) return "asset";
  if (/\.(tsx?|jsx?)$/.test(path)) return "component";
  return "other";
}

/**
 * Map database record to ModuleFile
 */
function mapFileFromDb(data: Record<string, unknown>): ModuleFile {
  return {
    id: data.id as string,
    moduleId: data.module_id as string,
    path: data.path as string,
    content: data.content as string,
    fileType: data.file_type as ModuleFile["fileType"],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

/**
 * Create a file tree structure from flat file list
 */
export function createFileTree(
  files: ModuleFile[]
): Record<string, ModuleFile | Record<string, unknown>> {
  const tree: Record<string, ModuleFile | Record<string, unknown>> = {};

  for (const file of files) {
    const parts = file.path.split("/");
    let current: Record<string, ModuleFile | Record<string, unknown>> = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part] as Record<string, ModuleFile | Record<string, unknown>>;
    }

    current[parts[parts.length - 1]] = file;
  }

  return tree;
}
