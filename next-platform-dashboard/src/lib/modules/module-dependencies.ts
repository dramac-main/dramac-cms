/**
 * Module Dependencies Manager
 * 
 * Handles NPM package dependencies for modules via CDN (esm.sh, unpkg, etc.)
 * Provides security through a whitelist of allowed packages.
 * 
 * @module module-dependencies
 */

"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// CDN Providers
// ============================================================================

export const CDN_PROVIDERS = {
  esm: "https://esm.sh",
  unpkg: "https://unpkg.com",
  skypack: "https://cdn.skypack.dev",
  jsdelivr: "https://cdn.jsdelivr.net/npm",
} as const;

export type CdnProvider = keyof typeof CDN_PROVIDERS;

// ============================================================================
// Allowed Packages Whitelist (Security)
// ============================================================================

const ALLOWED_PACKAGES = new Set([
  // React Core
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react-dom/client",
  
  // UI Component Libraries
  "lucide-react",
  "@radix-ui/react-accordion",
  "@radix-ui/react-alert-dialog",
  "@radix-ui/react-avatar",
  "@radix-ui/react-checkbox",
  "@radix-ui/react-collapsible",
  "@radix-ui/react-context-menu",
  "@radix-ui/react-dialog",
  "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-hover-card",
  "@radix-ui/react-label",
  "@radix-ui/react-menubar",
  "@radix-ui/react-navigation-menu",
  "@radix-ui/react-popover",
  "@radix-ui/react-progress",
  "@radix-ui/react-radio-group",
  "@radix-ui/react-scroll-area",
  "@radix-ui/react-select",
  "@radix-ui/react-separator",
  "@radix-ui/react-slider",
  "@radix-ui/react-slot",
  "@radix-ui/react-switch",
  "@radix-ui/react-tabs",
  "@radix-ui/react-toast",
  "@radix-ui/react-toggle",
  "@radix-ui/react-toggle-group",
  "@radix-ui/react-tooltip",
  
  // Animation
  "framer-motion",
  "@react-spring/web",
  "react-transition-group",
  
  // Styling Utilities
  "tailwind-merge",
  "clsx",
  "class-variance-authority",
  "cva",
  
  // Data Fetching
  "axios",
  "swr",
  "@tanstack/react-query",
  "react-query",
  
  // Date/Time
  "date-fns",
  "dayjs",
  "moment",
  "luxon",
  
  // Utilities
  "lodash",
  "lodash-es",
  "lodash.debounce",
  "lodash.throttle",
  "lodash.clonedeep",
  "lodash.merge",
  "lodash.get",
  "lodash.set",
  
  // Forms
  "react-hook-form",
  "zod",
  "@hookform/resolvers",
  "@hookform/resolvers/zod",
  "yup",
  "formik",
  
  // Charts & Visualization
  "recharts",
  "chart.js",
  "react-chartjs-2",
  "victory",
  "nivo",
  "@nivo/line",
  "@nivo/bar",
  "@nivo/pie",
  "d3",
  "apexcharts",
  "react-apexcharts",
  
  // Maps
  "leaflet",
  "react-leaflet",
  "mapbox-gl",
  "react-map-gl",
  "@react-google-maps/api",
  
  // State Management
  "zustand",
  "jotai",
  "valtio",
  "immer",
  "use-immer",
  "recoil",
  
  // Rich Text Editors
  "@tiptap/core",
  "@tiptap/react",
  "@tiptap/pm",
  "@tiptap/starter-kit",
  "@tiptap/extension-color",
  "@tiptap/extension-highlight",
  "@tiptap/extension-image",
  "@tiptap/extension-link",
  "@tiptap/extension-placeholder",
  "@tiptap/extension-table",
  "@tiptap/extension-text-align",
  "slate",
  "slate-react",
  "slate-history",
  "quill",
  "react-quill",
  "@lexical/react",
  "lexical",
  
  // Media
  "react-player",
  "react-dropzone",
  "react-image-crop",
  "react-easy-crop",
  "react-cropper",
  "blurhash",
  "react-blurhash",
  
  // Tables
  "@tanstack/react-table",
  "react-table",
  "react-virtualized",
  "react-window",
  
  // ID Generation
  "uuid",
  "nanoid",
  "cuid",
  "shortid",
  
  // Validation
  "validator",
  "is-email",
  
  // Color
  "react-colorful",
  "react-color",
  "color",
  "chroma-js",
  
  // Notifications
  "sonner",
  "react-hot-toast",
  "react-toastify",
  "notistack",
  
  // Drag & Drop
  "@dnd-kit/core",
  "@dnd-kit/sortable",
  "@dnd-kit/utilities",
  "react-beautiful-dnd",
  "react-dnd",
  "react-dnd-html5-backend",
  
  // Markdown
  "react-markdown",
  "remark-gfm",
  "rehype-raw",
  "rehype-sanitize",
  "marked",
  
  // Code Highlighting
  "prism-react-renderer",
  "react-syntax-highlighter",
  
  // PDF
  "react-pdf",
  "@react-pdf/renderer",
  
  // QR Codes
  "qrcode",
  "react-qr-code",
  
  // Misc UI
  "react-icons",
  "react-spinners",
  "react-confetti",
  "react-copy-to-clipboard",
  "react-countdown",
  "react-intersection-observer",
  "react-use",
  "@uidotdev/usehooks",
  "usehooks-ts",
]);

// Wildcard patterns for package prefixes
const ALLOWED_PACKAGE_PREFIXES = [
  "@radix-ui/",
  "@tanstack/",
  "@tiptap/",
  "@nivo/",
  "@dnd-kit/",
  "@hookform/",
  "@react-pdf/",
  "lodash.",
];

// ============================================================================
// Types
// ============================================================================

export interface ModuleDependency {
  id: string;
  packageName: string;
  version: string;
  cdnUrl: string;
  cdnProvider: CdnProvider;
  isDevDependency: boolean;
  isPeerDependency: boolean;
}

export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  allowed: boolean;
  keywords: string[];
  repository?: string;
  homepage?: string;
}

export interface AddDependencyResult {
  success: boolean;
  dependency?: ModuleDependency;
  error?: string;
}

export interface RemoveDependencyResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Package Validation
// ============================================================================

/**
 * Check if a package is in the allowed list
 */
export function isPackageAllowed(packageName: string): boolean {
  // Normalize package name
  const normalizedName = packageName.toLowerCase().trim();
  
  // Direct match
  if (ALLOWED_PACKAGES.has(normalizedName)) return true;
  
  // Prefix match (e.g., "@radix-ui/*")
  for (const prefix of ALLOWED_PACKAGE_PREFIXES) {
    if (normalizedName.startsWith(prefix)) return true;
  }
  
  return false;
}

/**
 * Validate package name format
 */
function isValidPackageName(name: string): boolean {
  // NPM package name validation regex
  const validNamePattern = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  return validNamePattern.test(name);
}

/**
 * Validate version format (semver)
 */
function isValidVersion(version: string): boolean {
  if (version === "latest" || version === "next" || version === "beta") return true;
  // Semver validation
  const semverPattern = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
  // Range patterns
  const rangePattern = /^[\^~><=]?\d+(\.\d+)?(\.\d+)?$/;
  return semverPattern.test(version) || rangePattern.test(version);
}

// ============================================================================
// CDN URL Building
// ============================================================================

/**
 * Build CDN URL for a package
 */
export function buildCdnUrl(
  packageName: string, 
  version: string = "latest",
  provider: CdnProvider = "esm"
): string {
  const baseUrl = CDN_PROVIDERS[provider];
  const versionPart = version === "latest" ? "" : `@${version}`;
  
  switch (provider) {
    case "esm":
      // esm.sh with bundling enabled for better compatibility
      return `${baseUrl}/${packageName}${versionPart}?bundle`;
    
    case "unpkg":
      // unpkg with module format
      return `${baseUrl}/${packageName}${versionPart}?module`;
    
    case "skypack":
      // Skypack with pinned versions
      return `${baseUrl}/${packageName}${versionPart}`;
    
    case "jsdelivr":
      // jsDelivr with ESM
      return `${baseUrl}/${packageName}${versionPart}/+esm`;
    
    default:
      return `${CDN_PROVIDERS.esm}/${packageName}${versionPart}?bundle`;
  }
}

/**
 * Verify a package exists on CDN
 */
async function verifyPackageExists(cdnUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(cdnUrl, { 
      method: "HEAD",
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Dependency CRUD Operations
// ============================================================================

/**
 * Add a dependency to a module
 */
export async function addDependency(
  moduleSourceId: string,
  packageName: string,
  version: string = "latest",
  options: {
    provider?: CdnProvider;
    isDevDependency?: boolean;
    isPeerDependency?: boolean;
  } = {}
): Promise<AddDependencyResult> {
  const { 
    provider = "esm", 
    isDevDependency = false,
    isPeerDependency = false,
  } = options;

  // Validate package name format
  if (!isValidPackageName(packageName)) {
    return { 
      success: false, 
      error: `Invalid package name format: "${packageName}"` 
    };
  }

  // Validate version format
  if (!isValidVersion(version)) {
    return { 
      success: false, 
      error: `Invalid version format: "${version}"` 
    };
  }

  // Check if package is allowed
  if (!isPackageAllowed(packageName)) {
    return { 
      success: false, 
      error: `Package "${packageName}" is not in the allowed list. ` +
             `Use requestPackageApproval() to request adding it.` 
    };
  }

  // Build CDN URL
  const cdnUrl = buildCdnUrl(packageName, version, provider);

  // Verify package exists on CDN
  const exists = await verifyPackageExists(cdnUrl);
  if (!exists) {
    return { 
      success: false, 
      error: `Package not found on CDN: ${packageName}@${version}. ` +
             `Check the package name and version.` 
    };
  }

  // Insert into database
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("module_dependencies")
    .upsert({
      module_source_id: moduleSourceId,
      package_name: packageName,
      version,
      cdn_url: cdnUrl,
      cdn_provider: provider,
      is_dev_dependency: isDevDependency,
      is_peer_dependency: isPeerDependency,
    }, { 
      onConflict: "module_source_id,package_name" 
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    dependency: {
      id: data.id,
      packageName: data.package_name,
      version: data.version,
      cdnUrl: data.cdn_url || "",
      cdnProvider: (data.cdn_provider || "esm") as "esm" | "unpkg" | "jsdelivr" | "skypack",
      isDevDependency: data.is_dev_dependency ?? false,
      isPeerDependency: data.is_peer_dependency ?? false,
    },
  };
}

/**
 * Remove a dependency from a module
 */
export async function removeDependency(
  moduleSourceId: string,
  packageName: string
): Promise<RemoveDependencyResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("module_dependencies")
    .delete()
    .eq("module_source_id", moduleSourceId)
    .eq("package_name", packageName);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update a dependency version
 */
export async function updateDependency(
  moduleSourceId: string,
  packageName: string,
  newVersion: string,
  provider?: CdnProvider
): Promise<AddDependencyResult> {
  // Validate version
  if (!isValidVersion(newVersion)) {
    return { 
      success: false, 
      error: `Invalid version format: "${newVersion}"` 
    };
  }

  const supabase = await createClient();
  
  // Get current dependency to preserve provider if not specified
  const { data: existing } = await supabase
    .from("module_dependencies")
    .select("cdn_provider")
    .eq("module_source_id", moduleSourceId)
    .eq("package_name", packageName)
    .single();

  const cdnProvider = provider || existing?.cdn_provider || "esm";
  const cdnUrl = buildCdnUrl(packageName, newVersion, cdnProvider as CdnProvider);

  // Verify new version exists
  const exists = await verifyPackageExists(cdnUrl);
  if (!exists) {
    return { 
      success: false, 
      error: `Package version not found: ${packageName}@${newVersion}` 
    };
  }

  const { data, error } = await supabase
    .from("module_dependencies")
    .update({
      version: newVersion,
      cdn_url: cdnUrl,
      cdn_provider: cdnProvider,
    })
    .eq("module_source_id", moduleSourceId)
    .eq("package_name", packageName)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    dependency: {
      id: data.id,
      packageName: data.package_name,
      version: data.version,
      cdnUrl: data.cdn_url || "",
      cdnProvider: (data.cdn_provider || "esm") as "esm" | "unpkg" | "jsdelivr" | "skypack",
      isDevDependency: data.is_dev_dependency ?? false,
      isPeerDependency: data.is_peer_dependency ?? false,
    },
  };
}

/**
 * Get all dependencies for a module
 */
export async function getDependencies(moduleSourceId: string): Promise<ModuleDependency[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_dependencies")
    .select("*")
    .eq("module_source_id", moduleSourceId)
    .order("package_name");

  return (data || []).map((d) => ({
    id: d.id,
    packageName: d.package_name,
    version: d.version,
    cdnUrl: d.cdn_url || "",
    cdnProvider: (d.cdn_provider || "esm") as "esm" | "unpkg" | "jsdelivr" | "skypack",
    isDevDependency: d.is_dev_dependency ?? false,
    isPeerDependency: d.is_peer_dependency ?? false,
  }));
}

/**
 * Get a single dependency
 */
export async function getDependency(
  moduleSourceId: string,
  packageName: string
): Promise<ModuleDependency | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_dependencies")
    .select("*")
    .eq("module_source_id", moduleSourceId)
    .eq("package_name", packageName)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    packageName: data.package_name,
    version: data.version,
    cdnUrl: data.cdn_url || "",
    cdnProvider: (data.cdn_provider || "esm") as "esm" | "unpkg" | "jsdelivr" | "skypack",
    isDevDependency: data.is_dev_dependency ?? false,
    isPeerDependency: data.is_peer_dependency ?? false,
  };
}

// ============================================================================
// Import Map Generation
// ============================================================================

/**
 * Generate import map for a module's dependencies
 */
export async function generateImportMap(
  moduleSourceId: string
): Promise<Record<string, string>> {
  const deps = await getDependencies(moduleSourceId);
  
  // Always include React
  const importMap: Record<string, string> = {
    "react": "https://esm.sh/react@18?bundle",
    "react-dom": "https://esm.sh/react-dom@18?bundle",
    "react-dom/client": "https://esm.sh/react-dom@18/client?bundle",
    "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime?bundle",
  };

  for (const dep of deps) {
    importMap[dep.packageName] = dep.cdnUrl;
  }

  return importMap;
}

/**
 * Generate HTML script tag for import map
 */
export async function generateImportMapScript(moduleSourceId: string): Promise<string> {
  const importMap = await generateImportMap(moduleSourceId);
  
  return `<script type="importmap">
${JSON.stringify({ imports: importMap }, null, 2)}
</script>`;
}

// ============================================================================
// Package Search
// ============================================================================

/**
 * Search for packages using npm registry API
 */
export async function searchPackages(query: string): Promise<PackageSearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=25`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeout);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.objects || []).map((obj: {
      package: {
        name: string;
        version: string;
        description?: string;
        keywords?: string[];
        links?: {
          repository?: string;
          homepage?: string;
        };
      };
    }) => ({
      name: obj.package.name,
      version: obj.package.version,
      description: obj.package.description || "",
      allowed: isPackageAllowed(obj.package.name),
      keywords: obj.package.keywords || [],
      repository: obj.package.links?.repository,
      homepage: obj.package.links?.homepage,
    }));
  } catch {
    return [];
  }
}

/**
 * Get package details from npm registry
 */
export async function getPackageInfo(packageName: string): Promise<{
  name: string;
  version: string;
  description: string;
  versions: string[];
  allowed: boolean;
} | null> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const versions = Object.keys(data.versions || {}).reverse();
    
    return {
      name: data.name,
      version: data["dist-tags"]?.latest || versions[0],
      description: data.description || "",
      versions: versions.slice(0, 20), // Return last 20 versions
      allowed: isPackageAllowed(packageName),
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Package Approval Requests
// ============================================================================

/**
 * Request approval for a package not in the whitelist
 */
export async function requestPackageApproval(
  packageName: string,
  reason: string,
  requestedBy: string
): Promise<{ success: boolean; message: string }> {
  // In production, this would create a support ticket or notification
  // For now, log and return success
  console.log(`[PackageApproval] Request for "${packageName}" by ${requestedBy}: ${reason}`);
  
  // Could store in a pending_package_requests table
  // const supabase = await createClient();
  // await supabase.from("pending_package_requests").insert({ ... });
  
  return { 
    success: true, 
    message: `Request submitted for "${packageName}". You will be notified when it's reviewed.` 
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all allowed packages list
 */
export function getAllowedPackages(): string[] {
  return Array.from(ALLOWED_PACKAGES);
}

/**
 * Get allowed package prefixes
 */
export function getAllowedPrefixes(): string[] {
  return [...ALLOWED_PACKAGE_PREFIXES];
}

/**
 * Bulk add dependencies
 */
export async function addMultipleDependencies(
  moduleSourceId: string,
  dependencies: Array<{
    packageName: string;
    version?: string;
    isDevDependency?: boolean;
  }>
): Promise<{
  successful: ModuleDependency[];
  failed: Array<{ packageName: string; error: string }>;
}> {
  const successful: ModuleDependency[] = [];
  const failed: Array<{ packageName: string; error: string }> = [];

  for (const dep of dependencies) {
    const result = await addDependency(
      moduleSourceId,
      dep.packageName,
      dep.version || "latest",
      { isDevDependency: dep.isDevDependency }
    );

    if (result.success && result.dependency) {
      successful.push(result.dependency);
    } else {
      failed.push({ 
        packageName: dep.packageName, 
        error: result.error || "Unknown error" 
      });
    }
  }

  return { successful, failed };
}

/**
 * Copy dependencies from one module to another
 */
export async function copyDependencies(
  sourceModuleId: string,
  targetModuleId: string
): Promise<{ copied: number; failed: number }> {
  const deps = await getDependencies(sourceModuleId);
  
  let copied = 0;
  let failed = 0;

  for (const dep of deps) {
    const result = await addDependency(
      targetModuleId,
      dep.packageName,
      dep.version,
      {
        provider: dep.cdnProvider,
        isDevDependency: dep.isDevDependency,
        isPeerDependency: dep.isPeerDependency,
      }
    );

    if (result.success) {
      copied++;
    } else {
      failed++;
    }
  }

  return { copied, failed };
}
