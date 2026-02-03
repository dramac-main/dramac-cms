/**
 * Studio Rendering Engine
 * 
 * Page rendering and serialization.
 * Phase STUDIO-06+ will add: renderer, serializer, optimizer
 * 
 * @phase STUDIO-22 - Added CSS generator for component states
 * @phase STUDIO-23 - Added HTML generator and export utilities
 * @phase STUDIO-27 - Added StudioRenderer for page rendering
 */

// StudioRenderer (PHASE-STUDIO-27)
export { 
  StudioRenderer,
  ComponentRenderer,
  ZoneRenderer,
  type StudioRendererProps,
} from "./renderer";

// CSS Generator (PHASE-STUDIO-22)
export {
  generateComponentCSS,
  generatePageCSS,
  minifyCSS,
  extractCriticalCSS,
  generateInlineStyles,
  generateClassName,
  type CSSGeneratorOptions,
} from "./css-generator";

// HTML Generator (PHASE-STUDIO-23)
export {
  generateComponentHTML,
  generatePageHTML,
  renderToStaticHTML,
  type HTMLGeneratorOptions,
  type StudioPageData,
  type DropZoneData,
} from "./html-generator";

// Asset Optimizer (PHASE-STUDIO-23)
export {
  optimizeAssets,
  extractAssets,
  generateAssetManifest,
  type AssetOptimizerOptions,
} from "./asset-optimizer";

// Build Script (PHASE-STUDIO-23)
export {
  buildPage,
  buildSite,
  type BuildOptions,
  type BuildResult,
} from "./build";
