/**
 * DRAMAC Studio Build Engine
 * 
 * Builds optimized static output from Studio pages:
 * - Generates HTML files
 * - Extracts and optimizes CSS
 * - Processes and optimizes assets
 * - Creates deployment-ready bundles
 * 
 * @phase STUDIO-23 - Export & Render Optimization
 */

import type { StudioComponent } from "@/types/studio";
import { generatePageCSS, minifyCSS, extractCriticalCSS } from "./css-generator";
import { generatePageHTML, renderToStaticHTML, type HTMLGeneratorOptions, type StudioPageData } from "./html-generator";
import { extractAssets, optimizeAssets, generateAssetManifest, rewriteAssetUrls, type Asset } from "./asset-optimizer";

// =============================================================================
// TYPES
// =============================================================================

// Re-export for convenience
export type { StudioPageData };

export interface BuildOptions {
  /** Output directory path */
  outputDir?: string;
  /** Whether to minify output */
  minify?: boolean;
  /** Whether to optimize assets */
  optimizeAssets?: boolean;
  /** Whether to inline critical CSS */
  inlineCriticalCSS?: boolean;
  /** Whether to generate source maps */
  sourceMaps?: boolean;
  /** Base URL for the site */
  baseUrl?: string;
  /** Whether to generate sitemap */
  generateSitemap?: boolean;
  /** Whether to generate robots.txt */
  generateRobots?: boolean;
  /** Custom head content to inject */
  headContent?: string;
  /** Custom scripts to inject */
  bodyScripts?: string;
  /** Build mode */
  mode?: "production" | "development" | "preview";
}

export interface BuildResult {
  /** Whether build succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Build duration in ms */
  duration: number;
  /** Output files */
  files: BuildFile[];
  /** Asset manifest */
  assetManifest?: ReturnType<typeof generateAssetManifest>;
  /** Build statistics */
  stats: BuildStats;
}

export interface BuildFile {
  /** File path relative to output dir */
  path: string;
  /** File type */
  type: "html" | "css" | "js" | "asset" | "json" | "other";
  /** File size in bytes */
  size: number;
  /** File content (for in-memory builds) */
  content?: string;
  /** Whether file was minified */
  minified?: boolean;
}

export interface BuildStats {
  /** Total pages built */
  pagesBuilt: number;
  /** Total components rendered */
  componentsRendered: number;
  /** Total assets processed */
  assetsProcessed: number;
  /** Total output size in bytes */
  totalSize: number;
  /** Original size before optimization */
  originalSize: number;
  /** Size savings percentage */
  savingsPercent: number;
}

// =============================================================================
// BUILD FUNCTIONS
// =============================================================================

/**
 * Builds a single page to static output
 */
export async function buildPage(
  page: StudioPageData,
  components: StudioComponent[],
  options: BuildOptions = {}
): Promise<BuildResult> {
  const startTime = Date.now();
  const files: BuildFile[] = [];
  const stats: BuildStats = {
    pagesBuilt: 0,
    componentsRendered: 0,
    assetsProcessed: 0,
    totalSize: 0,
    originalSize: 0,
    savingsPercent: 0,
  };
  
  try {
    const {
      minify = true,
      optimizeAssets: shouldOptimizeAssets = true,
      inlineCriticalCSS = true,
      baseUrl = "",
      headContent = "",
      bodyScripts = "",
      mode = "production",
    } = options;
    
    const isProduction = mode === "production";
    
    // 1. Extract and process assets
    let assets: Asset[] = extractAssets(components);
    stats.assetsProcessed = assets.length;
    
    if (shouldOptimizeAssets && isProduction) {
      assets = await optimizeAssets(assets, { baseUrl });
    }
    
    // Rewrite asset URLs in components
    const processedComponents = rewriteAssetUrls(components, assets);
    stats.componentsRendered = processedComponents.length;
    
    // 2. Generate CSS
    let css = generatePageCSS(processedComponents, {
      minify: isProduction && minify,
      includeResponsive: true,
      includeStates: true,
    });
    
    const originalCSSSize = css.length;
    
    if (isProduction && minify) {
      css = minifyCSS(css);
    }
    
    // 3. Extract critical CSS if needed
    let criticalCSS = "";
    let deferredCSS = css;
    
    if (inlineCriticalCSS) {
      // For now, use all CSS as critical
      // A production implementation would analyze the viewport
      criticalCSS = extractCriticalCSS(css);
      deferredCSS = css; // Full CSS loaded async
    }
    
    // Add CSS file
    files.push({
      path: `${page.slug || page.id}/styles.css`,
      type: "css",
      size: css.length,
      content: css,
      minified: isProduction && minify,
    });
    
    // 4. Generate HTML
    const htmlOptions: HTMLGeneratorOptions = {
      minify: isProduction && minify,
      includeDataAttributes: !isProduction,
      inlineCriticalCSS,
      assetBaseUrl: baseUrl,
      headContent: `
        ${inlineCriticalCSS ? `<style>${criticalCSS}</style>` : `<link rel="stylesheet" href="styles.css">`}
        ${headContent}
      `,
      bodyScripts: `
        ${inlineCriticalCSS ? `
          <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
          <noscript><link rel="stylesheet" href="styles.css"></noscript>
        ` : ""}
        ${bodyScripts}
      `,
    };
    
    // Render component HTML
    const rootIds = page.rootZone?.componentIds || [];
    const bodyHTML = renderToStaticHTML(processedComponents, rootIds, htmlOptions);
    
    // Build full page HTML
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(page.title || "Untitled Page")}</title>
  ${page.description ? `<meta name="description" content="${escapeHTML(page.description)}">` : ""}
  <link rel="canonical" href="${baseUrl}/${page.slug || page.id}">
  ${htmlOptions.headContent}
</head>
<body>
  <div id="page-root">
    ${bodyHTML}
  </div>
  ${htmlOptions.bodyScripts}
</body>
</html>`;
    
    if (isProduction && minify) {
      html = minifyHTML(html);
    }
    
    files.push({
      path: `${page.slug || page.id}/index.html`,
      type: "html",
      size: html.length,
      content: html,
      minified: isProduction && minify,
    });
    
    // 5. Generate asset manifest
    const assetManifest = generateAssetManifest(assets);
    
    files.push({
      path: `${page.slug || page.id}/asset-manifest.json`,
      type: "json",
      size: JSON.stringify(assetManifest).length,
      content: JSON.stringify(assetManifest, null, isProduction ? 0 : 2),
    });
    
    // Calculate stats
    stats.pagesBuilt = 1;
    stats.totalSize = files.reduce((sum, f) => sum + f.size, 0);
    stats.originalSize = originalCSSSize + html.length; // Approximate
    stats.savingsPercent = stats.originalSize > 0
      ? Math.round(((stats.originalSize - stats.totalSize) / stats.originalSize) * 100)
      : 0;
    
    return {
      success: true,
      duration: Date.now() - startTime,
      files,
      assetManifest,
      stats,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
      files,
      stats,
    };
  }
}

/**
 * Builds an entire site with multiple pages
 */
export async function buildSite(
  pages: Array<{ page: StudioPageData; components: StudioComponent[] }>,
  options: BuildOptions = {}
): Promise<BuildResult> {
  const startTime = Date.now();
  const allFiles: BuildFile[] = [];
  const totalStats: BuildStats = {
    pagesBuilt: 0,
    componentsRendered: 0,
    assetsProcessed: 0,
    totalSize: 0,
    originalSize: 0,
    savingsPercent: 0,
  };
  
  try {
    const {
      generateSitemap = true,
      generateRobots = true,
      baseUrl = "",
    } = options;
    
    // Build each page
    for (const { page, components } of pages) {
      const result = await buildPage(page, components, options);
      
      if (!result.success) {
        throw new Error(`Failed to build page ${page.id}: ${result.error}`);
      }
      
      allFiles.push(...result.files);
      totalStats.pagesBuilt += result.stats.pagesBuilt;
      totalStats.componentsRendered += result.stats.componentsRendered;
      totalStats.assetsProcessed += result.stats.assetsProcessed;
      totalStats.totalSize += result.stats.totalSize;
      totalStats.originalSize += result.stats.originalSize;
    }
    
    // Generate sitemap
    if (generateSitemap) {
      const sitemap = generateSitemapXML(pages.map(p => p.page), baseUrl);
      allFiles.push({
        path: "sitemap.xml",
        type: "other",
        size: sitemap.length,
        content: sitemap,
      });
    }
    
    // Generate robots.txt
    if (generateRobots) {
      const robots = generateRobotsTxt(baseUrl);
      allFiles.push({
        path: "robots.txt",
        type: "other",
        size: robots.length,
        content: robots,
      });
    }
    
    // Calculate overall savings
    totalStats.savingsPercent = totalStats.originalSize > 0
      ? Math.round(((totalStats.originalSize - totalStats.totalSize) / totalStats.originalSize) * 100)
      : 0;
    
    return {
      success: true,
      duration: Date.now() - startTime,
      files: allFiles,
      stats: totalStats,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
      files: allFiles,
      stats: totalStats,
    };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Escapes HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Minifies HTML
 */
function minifyHTML(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Generates sitemap.xml
 */
function generateSitemapXML(pages: StudioPageData[], baseUrl: string): string {
  const urls = pages.map((page) => {
    const loc = `${baseUrl}/${page.slug || page.id}`;
    const lastmod = page.updatedAt || new Date().toISOString();
    
    return `
  <url>
    <loc>${escapeHTML(loc)}</loc>
    <lastmod>${lastmod.split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.slug === "" || page.slug === "home" ? "1.0" : "0.8"}</priority>
  </url>`;
  }).join("");
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`.trim();
}

/**
 * Generates robots.txt
 */
function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`.trim();
}
