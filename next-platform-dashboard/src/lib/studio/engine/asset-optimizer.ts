/**
 * DRAMAC Studio Asset Optimizer
 * 
 * Optimizes and manages assets for static export:
 * - Image optimization
 * - Asset extraction and deduplication
 * - Manifest generation
 * 
 * @phase STUDIO-23 - Export & Render Optimization
 */

import type { StudioComponent } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

export interface AssetOptimizerOptions {
  /** Base URL for assets */
  baseUrl?: string;
  /** Whether to optimize images */
  optimizeImages?: boolean;
  /** Maximum image width */
  maxImageWidth?: number;
  /** Image quality (1-100) */
  imageQuality?: number;
  /** Whether to generate WebP versions */
  generateWebP?: boolean;
  /** Whether to generate AVIF versions */
  generateAVIF?: boolean;
  /** Whether to inline small assets */
  inlineSmallAssets?: boolean;
  /** Max size for inline assets (bytes) */
  inlineThreshold?: number;
}

export interface Asset {
  /** Unique asset ID (hash) */
  id: string;
  /** Original URL/path */
  originalUrl: string;
  /** Optimized URL/path */
  optimizedUrl: string;
  /** Asset type */
  type: "image" | "video" | "font" | "script" | "style" | "other";
  /** MIME type */
  mimeType: string;
  /** Original file size in bytes */
  originalSize?: number;
  /** Optimized file size in bytes */
  optimizedSize?: number;
  /** Width (for images/videos) */
  width?: number;
  /** Height (for images/videos) */
  height?: number;
  /** Alternative formats available */
  alternateFormats?: {
    format: string;
    url: string;
    size?: number;
  }[];
  /** Whether asset is inlined */
  inlined?: boolean;
  /** Base64 data URI (if inlined) */
  dataUri?: string;
  /** Components using this asset */
  usedBy: string[];
}

export interface AssetManifest {
  /** Generated timestamp */
  generatedAt: string;
  /** Version */
  version: string;
  /** Total assets count */
  totalAssets: number;
  /** Total original size */
  totalOriginalSize: number;
  /** Total optimized size */
  totalOptimizedSize: number;
  /** Savings percentage */
  savingsPercent: number;
  /** Assets list */
  assets: Asset[];
  /** Assets by type count */
  byType: Record<string, number>;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generates a simple hash for an asset URL
 */
function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

/**
 * Gets the asset type from URL or MIME type
 */
function getAssetType(url: string, mimeType?: string): Asset["type"] {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  
  // Check by extension
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "ico"];
  const videoExts = ["mp4", "webm", "ogg", "mov", "avi"];
  const fontExts = ["woff", "woff2", "ttf", "otf", "eot"];
  const scriptExts = ["js", "mjs"];
  const styleExts = ["css"];
  
  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (fontExts.includes(ext)) return "font";
  if (scriptExts.includes(ext)) return "script";
  if (styleExts.includes(ext)) return "style";
  
  // Check by MIME type
  if (mimeType) {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("font/") || mimeType.includes("font")) return "font";
    if (mimeType.includes("javascript")) return "script";
    if (mimeType.includes("css")) return "style";
  }
  
  return "other";
}

/**
 * Gets MIME type from file extension
 */
function getMimeType(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  
  const mimeMap: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    // Videos
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    // Fonts
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    eot: "application/vnd.ms-fontobject",
    // Scripts/Styles
    js: "application/javascript",
    mjs: "application/javascript",
    css: "text/css",
  };
  
  return mimeMap[ext] || "application/octet-stream";
}

/**
 * Extracts URLs from component props
 */
function extractUrlsFromProps(
  props: Record<string, unknown>,
  componentId: string
): { url: string; componentId: string }[] {
  const urls: { url: string; componentId: string }[] = [];
  
  // Common URL prop names
  const urlProps = ["src", "href", "backgroundImage", "poster", "source", "url", "image"];
  
  for (const [key, value] of Object.entries(props)) {
    if (!value) continue;
    
    // Direct URL props
    if (urlProps.includes(key) && typeof value === "string") {
      if (isAssetUrl(value)) {
        urls.push({ url: value, componentId });
      }
    }
    
    // Check nested objects
    if (typeof value === "object" && value !== null) {
      const nested = extractUrlsFromProps(
        value as Record<string, unknown>,
        componentId
      );
      urls.push(...nested);
    }
    
    // Check arrays
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "object" && item !== null) {
          const nested = extractUrlsFromProps(
            item as Record<string, unknown>,
            componentId
          );
          urls.push(...nested);
        } else if (typeof item === "string" && isAssetUrl(item)) {
          urls.push({ url: item, componentId });
        }
      }
    }
  }
  
  return urls;
}

/**
 * Checks if a string is an asset URL
 */
function isAssetUrl(str: string): boolean {
  // Skip data URIs, javascript:, mailto:, tel:
  if (
    str.startsWith("data:") ||
    str.startsWith("javascript:") ||
    str.startsWith("mailto:") ||
    str.startsWith("tel:")
  ) {
    return false;
  }
  
  // Check for file extensions
  const ext = str.split(".").pop()?.toLowerCase().split("?")[0] || "";
  const assetExts = [
    "jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "ico",
    "mp4", "webm", "ogg", "mov",
    "woff", "woff2", "ttf", "otf", "eot",
    "js", "css", "pdf",
  ];
  
  return assetExts.includes(ext) || str.startsWith("http") || str.startsWith("/");
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Extracts all assets from components
 */
export function extractAssets(
  components: StudioComponent[],
  options: AssetOptimizerOptions = {}
): Asset[] {
  const { baseUrl = "" } = options;
  const assetsMap = new Map<string, Asset>();
  
  // Extract URLs from all components
  for (const component of components) {
    const urls = extractUrlsFromProps(component.props, component.id);
    
    for (const { url, componentId } of urls) {
      const id = hashUrl(url);
      
      if (assetsMap.has(id)) {
        // Add to usedBy list
        const asset = assetsMap.get(id)!;
        if (!asset.usedBy.includes(componentId)) {
          asset.usedBy.push(componentId);
        }
      } else {
        // Create new asset entry
        const type = getAssetType(url);
        const mimeType = getMimeType(url);
        
        assetsMap.set(id, {
          id,
          originalUrl: url,
          optimizedUrl: `${baseUrl}/assets/${id}${getExtension(url)}`,
          type,
          mimeType,
          usedBy: [componentId],
        });
      }
    }
  }
  
  return Array.from(assetsMap.values());
}

/**
 * Gets file extension from URL
 */
function getExtension(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0];
  return ext ? `.${ext}` : "";
}

/**
 * Optimizes assets (placeholder - actual optimization requires server-side processing)
 */
export async function optimizeAssets(
  assets: Asset[],
  options: AssetOptimizerOptions = {}
): Promise<Asset[]> {
  const {
    optimizeImages = true,
    maxImageWidth = 1920,
    imageQuality = 85,
    generateWebP = true,
    generateAVIF = false,
    inlineSmallAssets = true,
    inlineThreshold = 4096, // 4KB
  } = options;
  
  const optimizedAssets: Asset[] = [];
  
  for (const asset of assets) {
    const optimized: Asset = { ...asset };
    
    // Image optimization placeholder
    if (asset.type === "image" && optimizeImages) {
      // In production, this would:
      // 1. Fetch/read the image
      // 2. Resize if needed
      // 3. Compress with specified quality
      // 4. Generate alternate formats
      
      if (generateWebP) {
        optimized.alternateFormats = optimized.alternateFormats || [];
        optimized.alternateFormats.push({
          format: "webp",
          url: asset.optimizedUrl.replace(/\.[^.]+$/, ".webp"),
        });
      }
      
      if (generateAVIF) {
        optimized.alternateFormats = optimized.alternateFormats || [];
        optimized.alternateFormats.push({
          format: "avif",
          url: asset.optimizedUrl.replace(/\.[^.]+$/, ".avif"),
        });
      }
    }
    
    // Small asset inlining placeholder
    if (inlineSmallAssets && asset.originalSize && asset.originalSize < inlineThreshold) {
      // In production, this would read the file and convert to base64
      optimized.inlined = true;
      // optimized.dataUri = `data:${asset.mimeType};base64,...`;
    }
    
    optimizedAssets.push(optimized);
  }
  
  return optimizedAssets;
}

/**
 * Generates an asset manifest
 */
export function generateAssetManifest(
  assets: Asset[],
  version = "1.0.0"
): AssetManifest {
  // Calculate totals
  const totalOriginalSize = assets.reduce(
    (sum, a) => sum + (a.originalSize || 0),
    0
  );
  const totalOptimizedSize = assets.reduce(
    (sum, a) => sum + (a.optimizedSize || a.originalSize || 0),
    0
  );
  const savingsPercent = totalOriginalSize > 0
    ? Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100)
    : 0;
  
  // Count by type
  const byType: Record<string, number> = {};
  for (const asset of assets) {
    byType[asset.type] = (byType[asset.type] || 0) + 1;
  }
  
  return {
    generatedAt: new Date().toISOString(),
    version,
    totalAssets: assets.length,
    totalOriginalSize,
    totalOptimizedSize,
    savingsPercent,
    assets,
    byType,
  };
}

/**
 * Rewrites asset URLs in components to optimized versions
 */
export function rewriteAssetUrls(
  components: StudioComponent[],
  assets: Asset[]
): StudioComponent[] {
  const urlMap = new Map<string, string>();
  
  // Build URL mapping
  for (const asset of assets) {
    urlMap.set(asset.originalUrl, asset.inlined ? asset.dataUri || asset.originalUrl : asset.optimizedUrl);
  }
  
  // Deep clone and rewrite
  return components.map((component) => {
    const cloned = JSON.parse(JSON.stringify(component)) as StudioComponent;
    rewritePropsUrls(cloned.props, urlMap);
    return cloned;
  });
}

/**
 * Recursively rewrites URLs in props
 */
function rewritePropsUrls(
  props: Record<string, unknown>,
  urlMap: Map<string, string>
): void {
  const urlProps = ["src", "href", "backgroundImage", "poster", "source", "url", "image"];
  
  for (const [key, value] of Object.entries(props)) {
    if (!value) continue;
    
    if (urlProps.includes(key) && typeof value === "string") {
      const newUrl = urlMap.get(value);
      if (newUrl) {
        props[key] = newUrl;
      }
    }
    
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      rewritePropsUrls(value as Record<string, unknown>, urlMap);
    }
    
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "object" && item !== null) {
          rewritePropsUrls(item as Record<string, unknown>, urlMap);
        }
      }
    }
  }
}
