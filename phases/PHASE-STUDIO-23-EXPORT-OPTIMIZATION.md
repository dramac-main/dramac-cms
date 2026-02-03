# PHASE-STUDIO-23: Export & Render Optimization

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-23 |
| Title | Export & Render Optimization |
| Priority | Medium |
| Estimated Time | 12-14 hours |
| Dependencies | STUDIO-06 (Canvas), STUDIO-22 (States), STUDIO-03 (Registry) |
| Risk Level | Medium |

## Problem Statement

When users publish sites built with DRAMAC Studio, the output needs to be production-ready with excellent performance scores. Currently:

- All CSS is bundled together (no critical CSS extraction)
- Images not optimized for different screen sizes
- Heavy components load immediately (no lazy loading)
- No code splitting for component bundles
- Build output not optimized for CDN delivery

This phase implements **export and render optimization**:
- Critical CSS inlined in HTML head
- Deferred CSS loaded asynchronously
- Image optimization with srcset and lazy loading
- Lazy loading for heavy components (Video, Map, Carousel)
- Code splitting by component category
- Optimized build script for static export

## Goals

- [ ] Create optimized HTML generator with inline critical CSS
- [ ] Extract and defer below-the-fold CSS
- [ ] Generate responsive image srcset attributes
- [ ] Implement lazy loading for heavy components
- [ ] Create code splitting strategy by component type
- [ ] Build optimization script for static site export
- [ ] Generate blur placeholders for images
- [ ] Achieve Lighthouse performance score 90+

## Technical Approach

### Export Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  STUDIO EXPORT PIPELINE                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PAGE DATA                                                    │
│     └── StudioPageData { root, components, zones }              │
│                                                                  │
│  2. COMPONENT ANALYSIS                                           │
│     ├── Identify above-the-fold components                      │
│     ├── Find images for optimization                            │
│     ├── Detect heavy components (Video, Map, etc.)              │
│     └── Categorize for code splitting                           │
│                                                                  │
│  3. CSS GENERATION                                               │
│     ├── Critical CSS (above-fold) → Inline in <head>            │
│     ├── Component CSS (all) → styles.css                        │
│     └── State CSS (:hover, etc.) → Included                     │
│                                                                  │
│  4. HTML GENERATION                                              │
│     ├── <head>                                                   │
│     │   ├── Meta tags (SEO, viewport)                           │
│     │   ├── <style> Critical CSS </style>                       │
│     │   ├── <link rel="preload"> for fonts/images               │
│     │   └── <link rel="stylesheet" media="print" ...>           │
│     │                                                            │
│     └── <body>                                                   │
│         ├── Component HTML (server-rendered)                    │
│         ├── Lazy loading wrappers                               │
│         └── <script> for interactivity                          │
│                                                                  │
│  5. ASSET OPTIMIZATION                                           │
│     ├── Images → Multiple sizes (320, 640, 768, 1024, 1280)     │
│     ├── Blur placeholders → Base64 tiny image                   │
│     └── Font subsetting (if custom fonts)                       │
│                                                                  │
│  6. OUTPUT                                                       │
│     ├── index.html (optimized)                                  │
│     ├── styles.css (minified)                                   │
│     ├── images/ (optimized)                                     │
│     └── chunks/ (code-split JS if needed)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Critical CSS Strategy

Above-the-fold content is typically:
- First 3-5 sections/components
- Viewport height worth of content (~600-900px)
- Must be under 14KB (fits in first TCP packet)

```
┌───────────────────────────────────────┐
│                VIEWPORT               │
│  ┌─────────────────────────────────┐  │
│  │ HEADER                          │  │ ← Critical
│  ├─────────────────────────────────┤  │
│  │ HERO SECTION                    │  │ ← Critical
│  │                                 │  │
│  ├─────────────────────────────────┤  │
│  │ FEATURES (partial)              │  │ ← Critical
├──┴─────────────────────────────────┴──┤
│  │ FEATURES (rest)                 │  │ ← Deferred
│  ├─────────────────────────────────┤  │
│  │ TESTIMONIALS                    │  │ ← Deferred
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

## Implementation Tasks

### Task 1: Create HTML Generator

**Description:** Generate optimized HTML with proper document structure.

**Files:**
- CREATE: `src/lib/studio/engine/html-generator.ts`

**Code:**
```typescript
// src/lib/studio/engine/html-generator.ts

import { StudioPageData, StudioComponent } from '@/types/studio';
import { generateComponentCSS, minifyCSS } from './css-generator';
import { extractCriticalCSS, extractDeferredCSS } from './critical-css';
import { getPreloadAssets } from './asset-optimizer';
import { renderComponentToHTML } from './component-renderer';

export interface HTMLGeneratorOptions {
  inline?: boolean;           // Inline all CSS (default: false)
  minify?: boolean;           // Minify output (default: true)
  lazyLoadImages?: boolean;   // Add loading="lazy" to images (default: true)
  lazyLoadThreshold?: number; // Components after which to lazy load (default: 3)
  includeAnalytics?: boolean; // Include analytics snippet (default: false)
}

const DEFAULT_OPTIONS: HTMLGeneratorOptions = {
  inline: false,
  minify: true,
  lazyLoadImages: true,
  lazyLoadThreshold: 3,
  includeAnalytics: false,
};

/**
 * Generate optimized HTML for a page
 */
export function generateOptimizedHTML(
  data: StudioPageData,
  options: HTMLGeneratorOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];
  
  // Get components in order
  const orderedComponents = data.root.children
    .map(id => data.components[id])
    .filter(Boolean);
  
  // Extract page metadata
  const title = data.root.props.title || 'Untitled Page';
  const description = data.root.props.description || '';
  
  // Start document
  lines.push('<!DOCTYPE html>');
  lines.push('<html lang="en">');
  lines.push('<head>');
  
  // Essential meta tags
  lines.push('  <meta charset="UTF-8">');
  lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push(`  <title>${escapeHTML(title)}</title>`);
  
  if (description) {
    lines.push(`  <meta name="description" content="${escapeHTML(description)}">`);
  }
  
  // Open Graph tags
  lines.push(`  <meta property="og:title" content="${escapeHTML(title)}">`);
  if (description) {
    lines.push(`  <meta property="og:description" content="${escapeHTML(description)}">`);
  }
  
  // Preload critical assets
  const preloadAssets = getPreloadAssets(orderedComponents.slice(0, opts.lazyLoadThreshold!));
  for (const asset of preloadAssets) {
    if (asset.type === 'image') {
      lines.push(`  <link rel="preload" href="${asset.url}" as="image">`);
    } else if (asset.type === 'font') {
      lines.push(`  <link rel="preload" href="${asset.url}" as="font" type="font/woff2" crossorigin>`);
    }
  }
  
  // Critical CSS (inline)
  const criticalCSS = extractCriticalCSS(orderedComponents, opts.lazyLoadThreshold!);
  const minifiedCritical = opts.minify ? minifyCSS(criticalCSS) : criticalCSS;
  
  lines.push('  <style>');
  lines.push(`    ${minifiedCritical}`);
  lines.push('  </style>');
  
  // Deferred CSS
  if (!opts.inline) {
    // Load full stylesheet asynchronously using media trick
    lines.push('  <link rel="stylesheet" href="styles.css" media="print" onload="this.media=\'all\'">');
    lines.push('  <noscript><link rel="stylesheet" href="styles.css"></noscript>');
  } else {
    // Inline all CSS
    const allCSS = orderedComponents.map(c => generateComponentCSS(c)).join('\n');
    const minifiedAll = opts.minify ? minifyCSS(allCSS) : allCSS;
    lines.push('  <style>');
    lines.push(`    ${minifiedAll}`);
    lines.push('  </style>');
  }
  
  lines.push('</head>');
  lines.push('<body>');
  
  // Render components
  orderedComponents.forEach((component, index) => {
    const shouldLazyLoad = 
      index >= opts.lazyLoadThreshold! && 
      isHeavyComponent(component.type);
    
    if (shouldLazyLoad) {
      lines.push(renderLazyWrapper(component, data.components));
    } else {
      lines.push(renderComponentToHTML(component, data.components, {
        lazyLoadImages: opts.lazyLoadImages && index >= opts.lazyLoadThreshold!,
      }));
    }
  });
  
  // Lazy loading script
  if (orderedComponents.some((c, i) => i >= opts.lazyLoadThreshold! && isHeavyComponent(c.type))) {
    lines.push(getLazyLoadScript());
  }
  
  // Analytics (optional)
  if (opts.includeAnalytics) {
    lines.push(getAnalyticsSnippet());
  }
  
  lines.push('</body>');
  lines.push('</html>');
  
  return lines.join('\n');
}

/**
 * Components that should lazy load
 */
const HEAVY_COMPONENTS = [
  'Video',
  'Map',
  'Lottie',
  'Carousel',
  'Gallery',
  'Embed',
  'Chart',
];

function isHeavyComponent(type: string): boolean {
  return HEAVY_COMPONENTS.includes(type);
}

/**
 * Render a lazy loading wrapper
 */
function renderLazyWrapper(
  component: StudioComponent,
  allComponents: Record<string, StudioComponent>
): string {
  const placeholderHeight = component.props.height || 300;
  
  return `
  <div 
    class="studio-lazy-load"
    data-component-id="${component.id}"
    data-component-type="${component.type}"
    data-component-props='${JSON.stringify(component.props)}'
    style="min-height: ${placeholderHeight}px; background: #f3f4f6;"
  >
    <div class="studio-lazy-placeholder">
      <svg class="animate-pulse" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    </div>
  </div>`;
}

/**
 * Intersection Observer script for lazy loading
 */
function getLazyLoadScript(): string {
  return `
  <script>
    (function() {
      var lazyElements = document.querySelectorAll('.studio-lazy-load');
      
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              var el = entry.target;
              var type = el.getAttribute('data-component-type');
              var props = JSON.parse(el.getAttribute('data-component-props') || '{}');
              
              // Load component based on type
              loadComponent(el, type, props);
              observer.unobserve(el);
            }
          });
        }, { rootMargin: '100px' });
        
        lazyElements.forEach(function(el) {
          observer.observe(el);
        });
      } else {
        // Fallback: load all immediately
        lazyElements.forEach(function(el) {
          var type = el.getAttribute('data-component-type');
          var props = JSON.parse(el.getAttribute('data-component-props') || '{}');
          loadComponent(el, type, props);
        });
      }
      
      function loadComponent(el, type, props) {
        // Component-specific loading logic
        switch (type) {
          case 'Video':
            loadVideo(el, props);
            break;
          case 'Map':
            loadMap(el, props);
            break;
          default:
            el.innerHTML = '<p>Component loaded</p>';
        }
      }
      
      function loadVideo(el, props) {
        var video = document.createElement('video');
        video.src = props.src;
        video.controls = props.controls !== false;
        video.autoplay = props.autoplay || false;
        video.muted = props.muted || props.autoplay || false;
        video.loop = props.loop || false;
        video.style.width = '100%';
        el.innerHTML = '';
        el.appendChild(video);
        el.classList.remove('studio-lazy-load');
      }
      
      function loadMap(el, props) {
        var iframe = document.createElement('iframe');
        iframe.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(props.location || '') + '&output=embed';
        iframe.style.width = '100%';
        iframe.style.height = (props.height || 300) + 'px';
        iframe.style.border = '0';
        iframe.loading = 'lazy';
        el.innerHTML = '';
        el.appendChild(iframe);
        el.classList.remove('studio-lazy-load');
      }
    })();
  </script>`;
}

/**
 * Analytics snippet placeholder
 */
function getAnalyticsSnippet(): string {
  return `
  <!-- Analytics -->
  <script>
    // Add your analytics code here
  </script>`;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**Acceptance Criteria:**
- [ ] Valid HTML5 document generated
- [ ] Meta tags included
- [ ] Critical CSS inlined
- [ ] Deferred CSS loaded asynchronously
- [ ] Lazy loading wrappers for heavy components

---

### Task 2: Create Critical CSS Extractor

**Description:** Extract CSS for above-the-fold components.

**Files:**
- CREATE: `src/lib/studio/engine/critical-css.ts`

**Code:**
```typescript
// src/lib/studio/engine/critical-css.ts

import { StudioComponent } from '@/types/studio';
import { generateComponentCSS } from './css-generator';

const MAX_CRITICAL_CSS_SIZE = 14 * 1024; // 14KB

/**
 * Extract critical CSS for above-the-fold content
 */
export function extractCriticalCSS(
  components: StudioComponent[],
  aboveFoldCount: number = 3
): string {
  const lines: string[] = [];
  
  // Base reset (minimal)
  lines.push('*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }');
  lines.push('html { line-height: 1.5; -webkit-text-size-adjust: 100%; }');
  lines.push('body { font-family: system-ui, -apple-system, sans-serif; }');
  lines.push('img, video { max-width: 100%; height: auto; }');
  lines.push('button, input, select, textarea { font: inherit; }');
  
  // Above-fold component styles
  const aboveFold = components.slice(0, aboveFoldCount);
  
  for (const component of aboveFold) {
    lines.push(generateComponentCSS(component));
  }
  
  // Lazy loading placeholder styles
  lines.push(`
.studio-lazy-load {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #9ca3af;
}
.studio-lazy-placeholder {
  padding: 2rem;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}`);
  
  const css = lines.join('\n');
  
  // Warn if too large
  const size = new TextEncoder().encode(css).length;
  if (size > MAX_CRITICAL_CSS_SIZE) {
    console.warn(
      `Critical CSS is ${(size / 1024).toFixed(1)}KB, ` +
      `exceeds recommended ${MAX_CRITICAL_CSS_SIZE / 1024}KB. ` +
      `Consider reducing above-fold components.`
    );
  }
  
  return css;
}

/**
 * Extract CSS for below-the-fold content
 */
export function extractDeferredCSS(
  components: StudioComponent[],
  aboveFoldCount: number = 3
): string {
  const lines: string[] = [];
  
  // Below-fold component styles
  const belowFold = components.slice(aboveFoldCount);
  
  for (const component of belowFold) {
    lines.push(generateComponentCSS(component));
  }
  
  return lines.join('\n');
}

/**
 * Extract all CSS for full stylesheet
 */
export function extractAllCSS(components: StudioComponent[]): string {
  const lines: string[] = [];
  
  // Full reset
  lines.push(getFullCSSReset());
  
  // All component styles
  for (const component of components) {
    lines.push(generateComponentCSS(component));
  }
  
  // Utility classes
  lines.push(getUtilityClasses());
  
  return lines.join('\n');
}

/**
 * Full CSS reset
 */
function getFullCSSReset(): string {
  return `
/* CSS Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: inherit;
}

hr {
  height: 0;
  color: inherit;
  border-top-width: 1px;
}

h1, h2, h3, h4, h5, h6 {
  font-size: inherit;
  font-weight: inherit;
}

a {
  color: inherit;
  text-decoration: inherit;
}

b, strong {
  font-weight: bolder;
}

img, svg, video, canvas, audio, iframe, embed, object {
  display: block;
  max-width: 100%;
  height: auto;
}

button, input, optgroup, select, textarea {
  font-family: inherit;
  font-size: 100%;
  line-height: inherit;
  margin: 0;
  padding: 0;
}

button, select {
  text-transform: none;
}

button {
  -webkit-appearance: button;
  background-color: transparent;
  background-image: none;
}

:-moz-focusring {
  outline: auto;
}

:-moz-ui-invalid {
  box-shadow: none;
}
`;
}

/**
 * Common utility classes
 */
function getUtilityClasses(): string {
  return `
/* Utility Classes */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}
@media (min-width: 768px) {
  .container { max-width: 768px; }
}
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}
@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
`;
}

/**
 * Calculate CSS size in KB
 */
export function calculateCSSSize(css: string): number {
  return new TextEncoder().encode(css).length / 1024;
}
```

**Acceptance Criteria:**
- [ ] Critical CSS under 14KB
- [ ] Minimal reset included
- [ ] Placeholder styles included
- [ ] Deferred CSS separate
- [ ] Size warning if too large

---

### Task 3: Create Component HTML Renderer

**Description:** Render individual components to static HTML.

**Files:**
- CREATE: `src/lib/studio/engine/component-renderer.ts`

**Code:**
```typescript
// src/lib/studio/engine/component-renderer.ts

import { StudioComponent } from '@/types/studio';
import { useComponentRegistry } from '@/lib/studio/registry/component-registry';

export interface RenderOptions {
  lazyLoadImages?: boolean;
  includeDataAttributes?: boolean;
}

const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  lazyLoadImages: false,
  includeDataAttributes: true,
};

/**
 * Render a component to static HTML
 */
export function renderComponentToHTML(
  component: StudioComponent,
  allComponents: Record<string, StudioComponent>,
  options: RenderOptions = {}
): string {
  const opts = { ...DEFAULT_RENDER_OPTIONS, ...options };
  
  // Get component renderer
  const renderer = getComponentRenderer(component.type);
  
  if (!renderer) {
    return `<!-- Unknown component: ${component.type} -->`;
  }
  
  // Render with props
  const html = renderer(component.props, {
    id: component.id,
    lazyLoadImages: opts.lazyLoadImages,
  });
  
  // Wrap with data attributes
  if (opts.includeDataAttributes) {
    return wrapWithDataAttributes(html, component);
  }
  
  return html;
}

/**
 * Wrap HTML with data attributes for styling hooks
 */
function wrapWithDataAttributes(html: string, component: StudioComponent): string {
  const attrs = [
    `data-component-id="${component.id}"`,
    `data-component-type="${component.type}"`,
  ];
  
  // Insert data attributes into first element
  // This is a simple approach - for complex HTML, use a proper parser
  if (html.startsWith('<')) {
    const firstTagEnd = html.indexOf('>');
    if (firstTagEnd > 0) {
      const beforeClose = html.substring(0, firstTagEnd);
      const afterClose = html.substring(firstTagEnd);
      return `${beforeClose} ${attrs.join(' ')}${afterClose}`;
    }
  }
  
  // Fallback: wrap in div
  return `<div ${attrs.join(' ')}>${html}</div>`;
}

/**
 * Component-specific renderers
 */
type ComponentRenderer = (
  props: Record<string, unknown>,
  options: { id: string; lazyLoadImages?: boolean }
) => string;

const RENDERERS: Record<string, ComponentRenderer> = {
  // Layout Components
  Section: (props, opts) => {
    const style = propsToStyle({
      backgroundColor: props.backgroundColor,
      padding: props.padding,
      maxWidth: props.maxWidth,
    });
    
    return `<section style="${style}">${props.children || ''}</section>`;
  },
  
  Container: (props, opts) => {
    const style = propsToStyle({
      maxWidth: props.maxWidth || '1200px',
      margin: '0 auto',
      padding: props.padding || '0 1rem',
    });
    
    return `<div style="${style}">${props.children || ''}</div>`;
  },
  
  // Typography Components
  Heading: (props, opts) => {
    const tag = props.level || 'h2';
    const style = propsToStyle({
      fontSize: props.fontSize,
      fontWeight: props.fontWeight,
      color: props.color,
      textAlign: props.textAlign,
      marginBottom: props.marginBottom,
    });
    
    return `<${tag} style="${style}">${escapeHTML(props.text as string || '')}</${tag}>`;
  },
  
  Text: (props, opts) => {
    const style = propsToStyle({
      fontSize: props.fontSize,
      color: props.color,
      lineHeight: props.lineHeight,
      textAlign: props.textAlign,
    });
    
    return `<p style="${style}">${escapeHTML(props.text as string || '')}</p>`;
  },
  
  RichText: (props, opts) => {
    // Rich text content is already HTML
    const style = propsToStyle({
      fontSize: props.fontSize,
      color: props.color,
    });
    
    return `<div style="${style}">${props.content || ''}</div>`;
  },
  
  // Media Components
  Image: (props, opts) => {
    const style = propsToStyle({
      width: props.width || '100%',
      height: props.height,
      objectFit: props.objectFit || 'cover',
      borderRadius: props.borderRadius,
    });
    
    const loading = opts.lazyLoadImages ? 'loading="lazy"' : '';
    const alt = escapeHTML(props.alt as string || '');
    const src = props.src as string || '';
    
    // Generate srcset for responsive images
    const srcset = generateSrcset(src);
    const sizes = props.sizes || '(max-width: 768px) 100vw, 50vw';
    
    return `<img 
      src="${src}" 
      ${srcset ? `srcset="${srcset}"` : ''}
      sizes="${sizes}"
      alt="${alt}" 
      style="${style}" 
      ${loading}
    />`.replace(/\s+/g, ' ');
  },
  
  Video: (props, opts) => {
    const style = propsToStyle({
      width: props.width || '100%',
      height: props.height,
    });
    
    const autoplay = props.autoplay ? 'autoplay' : '';
    const muted = props.muted || props.autoplay ? 'muted' : '';
    const loop = props.loop ? 'loop' : '';
    const controls = props.controls !== false ? 'controls' : '';
    
    // Video should be lazy loaded (handled in html-generator)
    return `<video 
      src="${props.src}" 
      style="${style}"
      ${autoplay} ${muted} ${loop} ${controls}
      playsinline
    ></video>`.replace(/\s+/g, ' ');
  },
  
  // Interactive Components
  Button: (props, opts) => {
    const style = propsToStyle({
      backgroundColor: props.backgroundColor,
      color: props.color,
      padding: props.padding || '0.75rem 1.5rem',
      borderRadius: props.borderRadius || '0.5rem',
      fontSize: props.fontSize,
      fontWeight: props.fontWeight || '500',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    });
    
    const href = props.href as string;
    const text = escapeHTML(props.text as string || 'Button');
    
    if (href) {
      return `<a href="${href}" style="${style}">${text}</a>`;
    }
    
    return `<button style="${style}">${text}</button>`;
  },
  
  Link: (props, opts) => {
    const style = propsToStyle({
      color: props.color,
      textDecoration: props.underline ? 'underline' : 'none',
    });
    
    return `<a href="${props.href || '#'}" style="${style}">${escapeHTML(props.text as string || '')}</a>`;
  },
  
  // Marketing Components
  Hero: (props, opts) => {
    const containerStyle = propsToStyle({
      backgroundColor: props.backgroundColor,
      backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: props.padding || '4rem 1rem',
      textAlign: props.textAlign || 'center',
      minHeight: props.minHeight || '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
    
    return `
<section style="${containerStyle}">
  <div style="max-width: 800px;">
    ${props.title ? `<h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 1rem;">${escapeHTML(props.title as string)}</h1>` : ''}
    ${props.subtitle ? `<p style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 2rem;">${escapeHTML(props.subtitle as string)}</p>` : ''}
    ${props.buttonText ? `<a href="${props.buttonHref || '#'}" style="display: inline-block; padding: 1rem 2rem; background: ${props.buttonColor || '#3b82f6'}; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 500;">${escapeHTML(props.buttonText as string)}</a>` : ''}
  </div>
</section>`;
  },
  
  // Default fallback
  _default: (props, opts) => {
    return `<div>Component</div>`;
  },
};

/**
 * Get renderer for component type
 */
function getComponentRenderer(type: string): ComponentRenderer | null {
  return RENDERERS[type] || RENDERERS._default;
}

/**
 * Convert props to inline style string
 */
function propsToStyle(props: Record<string, unknown>): string {
  const declarations: string[] = [];
  
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    
    const cssProperty = camelToKebab(key);
    const cssValue = formatValue(key, value);
    
    if (cssValue) {
      declarations.push(`${cssProperty}: ${cssValue}`);
    }
  }
  
  return declarations.join('; ');
}

/**
 * Format value for CSS
 */
function formatValue(property: string, value: unknown): string | null {
  if (typeof value === 'number') {
    const pxProps = ['width', 'height', 'padding', 'margin', 'gap', 'fontSize', 'borderRadius', 'minHeight', 'maxWidth'];
    if (pxProps.some(p => property.toLowerCase().includes(p.toLowerCase()))) {
      return `${value}px`;
    }
    return String(value);
  }
  return String(value);
}

/**
 * Generate srcset for responsive images
 */
function generateSrcset(src: string): string {
  if (!src || src.startsWith('data:')) return '';
  
  // Skip srcset for external URLs without query support
  if (!src.includes('?') && (src.startsWith('http://') || src.startsWith('https://'))) {
    return '';
  }
  
  const widths = [320, 640, 768, 1024, 1280, 1920];
  const srcset = widths.map(w => {
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}w=${w} ${w}w`;
  });
  
  return srcset.join(', ');
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Escape HTML
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

**Acceptance Criteria:**
- [ ] All component types render correctly
- [ ] Inline styles generated
- [ ] srcset for images
- [ ] Lazy loading attribute added
- [ ] Data attributes included

---

### Task 4: Create Asset Optimizer

**Description:** Optimize images and extract assets for preloading.

**Files:**
- CREATE: `src/lib/studio/engine/asset-optimizer.ts`

**Code:**
```typescript
// src/lib/studio/engine/asset-optimizer.ts

import { StudioComponent } from '@/types/studio';

export interface AssetInfo {
  url: string;
  type: 'image' | 'font' | 'script' | 'style';
  priority: 'critical' | 'high' | 'low';
  size?: number;
}

export interface OptimizedImage {
  original: string;
  srcset: string;
  sizes: string;
  placeholder: string;
  width: number;
  height: number;
}

/**
 * Extract assets that should be preloaded
 */
export function getPreloadAssets(components: StudioComponent[]): AssetInfo[] {
  const assets: AssetInfo[] = [];
  const seenUrls = new Set<string>();
  
  for (const component of components) {
    // Extract images
    const imageUrls = extractImageUrls(component);
    
    for (const url of imageUrls) {
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        assets.push({
          url,
          type: 'image',
          priority: 'critical',
        });
      }
    }
    
    // Extract fonts from typography settings
    const fonts = extractFonts(component);
    for (const font of fonts) {
      if (!seenUrls.has(font)) {
        seenUrls.add(font);
        assets.push({
          url: font,
          type: 'font',
          priority: 'high',
        });
      }
    }
  }
  
  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, low: 2 };
  assets.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Limit to reasonable number
  return assets.slice(0, 5);
}

/**
 * Extract image URLs from component props
 */
function extractImageUrls(component: StudioComponent): string[] {
  const urls: string[] = [];
  
  // Direct image props
  if (component.props.src && typeof component.props.src === 'string') {
    urls.push(component.props.src);
  }
  if (component.props.image && typeof component.props.image === 'string') {
    urls.push(component.props.image);
  }
  if (component.props.backgroundImage && typeof component.props.backgroundImage === 'string') {
    urls.push(component.props.backgroundImage);
  }
  
  // Images in arrays (e.g., gallery items)
  if (Array.isArray(component.props.items)) {
    for (const item of component.props.items) {
      if (item?.image) urls.push(item.image);
      if (item?.src) urls.push(item.src);
    }
  }
  
  return urls.filter(isValidImageUrl);
}

/**
 * Extract font URLs from component
 */
function extractFonts(component: StudioComponent): string[] {
  const fonts: string[] = [];
  
  // Check for custom font URL
  if (component.props.fontUrl && typeof component.props.fontUrl === 'string') {
    fonts.push(component.props.fontUrl);
  }
  
  return fonts;
}

/**
 * Check if URL is a valid image
 */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:')) return false; // Skip data URIs
  
  // Check extension
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
  const hasImageExtension = imageExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  // Or check if it's from a known image service
  const imageServices = [
    'cloudinary.com',
    'imgix.net',
    'images.unsplash.com',
    'supabase.co/storage',
  ];
  const isFromImageService = imageServices.some(service => 
    url.includes(service)
  );
  
  return hasImageExtension || isFromImageService;
}

/**
 * Generate responsive image data
 */
export async function optimizeImage(src: string): Promise<OptimizedImage> {
  // In a real implementation, this would:
  // 1. Fetch the original image
  // 2. Generate multiple sizes
  // 3. Create a blur placeholder
  // 4. Return optimized data
  
  const widths = [320, 640, 768, 1024, 1280, 1920];
  
  // Generate srcset (assuming image service supports query params)
  const srcset = widths
    .map(w => {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}w=${w} ${w}w`;
    })
    .join(', ');
  
  // Default responsive sizes
  const sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  
  // Placeholder (in production, generate real blur hash)
  const placeholder = generatePlaceholderDataUrl();
  
  return {
    original: src,
    srcset,
    sizes,
    placeholder,
    width: 1200, // Default, would be detected from actual image
    height: 800,
  };
}

/**
 * Generate a simple placeholder data URL
 */
function generatePlaceholderDataUrl(): string {
  // 1x1 gray pixel
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
}

/**
 * Calculate optimal image sizes attribute
 */
export function calculateImageSizes(
  layout: 'full' | 'half' | 'third' | 'quarter' | 'custom',
  customWidth?: string
): string {
  switch (layout) {
    case 'full':
      return '100vw';
    case 'half':
      return '(max-width: 768px) 100vw, 50vw';
    case 'third':
      return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
    case 'quarter':
      return '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';
    case 'custom':
      return customWidth || '100vw';
    default:
      return '100vw';
  }
}

/**
 * Get all images in a page for batch optimization
 */
export function getAllPageImages(
  components: Record<string, StudioComponent>
): Map<string, StudioComponent[]> {
  const imageMap = new Map<string, StudioComponent[]>();
  
  for (const component of Object.values(components)) {
    const urls = extractImageUrls(component);
    
    for (const url of urls) {
      if (!imageMap.has(url)) {
        imageMap.set(url, []);
      }
      imageMap.get(url)!.push(component);
    }
  }
  
  return imageMap;
}
```

**Acceptance Criteria:**
- [ ] Preload assets extracted
- [ ] srcset generated for images
- [ ] Placeholder data URLs created
- [ ] Image validation works
- [ ] Size calculation correct

---

### Task 5: Create Build Script

**Description:** Script to build optimized static site from page data.

**Files:**
- CREATE: `src/lib/studio/engine/build.ts`

**Code:**
```typescript
// src/lib/studio/engine/build.ts

import { StudioPageData, StudioComponent } from '@/types/studio';
import { generateOptimizedHTML, HTMLGeneratorOptions } from './html-generator';
import { extractAllCSS, minifyCSS, calculateCSSSize } from './critical-css';

export interface BuildOptions {
  minify?: boolean;
  generateSourceMaps?: boolean;
  optimizeImages?: boolean;
  splitCSS?: boolean;
  outputFormat?: 'html' | 'nextjs' | 'static';
}

export interface BuildResult {
  success: boolean;
  pages: PageBuildResult[];
  assets: AssetBuildResult[];
  stats: BuildStats;
  errors: string[];
  warnings: string[];
}

export interface PageBuildResult {
  path: string;
  slug: string;
  html: string;
  htmlSize: number;
}

export interface AssetBuildResult {
  type: 'css' | 'js' | 'image' | 'font';
  path: string;
  content: string;
  size: number;
}

export interface BuildStats {
  totalPages: number;
  totalHTMLSize: number;
  totalCSSSize: number;
  totalAssets: number;
  buildTime: number;
  lighthouse?: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
}

const DEFAULT_BUILD_OPTIONS: BuildOptions = {
  minify: true,
  generateSourceMaps: false,
  optimizeImages: true,
  splitCSS: true,
  outputFormat: 'static',
};

/**
 * Build optimized static site from page data
 */
export async function buildOptimizedSite(
  pages: Array<{ slug: string; data: StudioPageData }>,
  options: BuildOptions = {}
): Promise<BuildResult> {
  const opts = { ...DEFAULT_BUILD_OPTIONS, ...options };
  const startTime = performance.now();
  
  const result: BuildResult = {
    success: true,
    pages: [],
    assets: [],
    stats: {
      totalPages: pages.length,
      totalHTMLSize: 0,
      totalCSSSize: 0,
      totalAssets: 0,
      buildTime: 0,
    },
    errors: [],
    warnings: [],
  };
  
  try {
    // Build each page
    for (const page of pages) {
      try {
        const htmlOptions: HTMLGeneratorOptions = {
          minify: opts.minify,
          inline: !opts.splitCSS,
          lazyLoadImages: opts.optimizeImages,
        };
        
        const html = generateOptimizedHTML(page.data, htmlOptions);
        const htmlSize = new TextEncoder().encode(html).length;
        
        result.pages.push({
          path: `${page.slug === '/' ? 'index' : page.slug}.html`,
          slug: page.slug,
          html,
          htmlSize,
        });
        
        result.stats.totalHTMLSize += htmlSize;
      } catch (error) {
        result.errors.push(`Failed to build page ${page.slug}: ${error}`);
        result.success = false;
      }
    }
    
    // Generate combined CSS if split
    if (opts.splitCSS && pages.length > 0) {
      const allComponents: StudioComponent[] = [];
      
      for (const page of pages) {
        allComponents.push(...Object.values(page.data.components));
      }
      
      // Deduplicate components by type (assuming same styles)
      const uniqueByType = new Map<string, StudioComponent>();
      for (const comp of allComponents) {
        if (!uniqueByType.has(comp.type)) {
          uniqueByType.set(comp.type, comp);
        }
      }
      
      const css = extractAllCSS(Array.from(uniqueByType.values()));
      const minifiedCSS = opts.minify ? minifyCSS(css) : css;
      const cssSize = new TextEncoder().encode(minifiedCSS).length;
      
      result.assets.push({
        type: 'css',
        path: 'styles.css',
        content: minifiedCSS,
        size: cssSize,
      });
      
      result.stats.totalCSSSize = cssSize;
      result.stats.totalAssets++;
      
      // Warn if CSS is large
      if (cssSize > 50 * 1024) {
        result.warnings.push(
          `Combined CSS is ${(cssSize / 1024).toFixed(1)}KB. ` +
          `Consider code splitting by route.`
        );
      }
    }
    
    // Calculate build time
    result.stats.buildTime = performance.now() - startTime;
    
    // Log build summary
    console.log(`
╔════════════════════════════════════════════╗
║          DRAMAC STUDIO BUILD               ║
╠════════════════════════════════════════════╣
║ Pages: ${result.stats.totalPages.toString().padEnd(35)}║
║ HTML Size: ${formatBytes(result.stats.totalHTMLSize).padEnd(31)}║
║ CSS Size: ${formatBytes(result.stats.totalCSSSize).padEnd(32)}║
║ Assets: ${result.stats.totalAssets.toString().padEnd(33)}║
║ Build Time: ${result.stats.buildTime.toFixed(0).padEnd(30)}ms║
╚════════════════════════════════════════════╝
    `);
    
  } catch (error) {
    result.success = false;
    result.errors.push(`Build failed: ${error}`);
  }
  
  return result;
}

/**
 * Build single page (for preview)
 */
export async function buildSinglePage(
  data: StudioPageData,
  options: BuildOptions = {}
): Promise<{ html: string; css: string }> {
  const opts = { ...DEFAULT_BUILD_OPTIONS, ...options };
  
  const htmlOptions: HTMLGeneratorOptions = {
    minify: opts.minify,
    inline: true, // Inline for single page preview
    lazyLoadImages: opts.optimizeImages,
  };
  
  const html = generateOptimizedHTML(data, htmlOptions);
  const components = Object.values(data.components);
  const css = opts.minify 
    ? minifyCSS(extractAllCSS(components))
    : extractAllCSS(components);
  
  return { html, css };
}

/**
 * Validate page data before build
 */
export function validatePageData(data: StudioPageData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check version
  if (!data.version) {
    errors.push('Missing version in page data');
  }
  
  // Check root
  if (!data.root) {
    errors.push('Missing root element');
  } else if (!data.root.children || data.root.children.length === 0) {
    warnings.push('Page has no components');
  }
  
  // Check components
  if (!data.components) {
    errors.push('Missing components object');
  } else {
    // Verify all referenced components exist
    for (const id of data.root.children || []) {
      if (!data.components[id]) {
        errors.push(`Component ${id} referenced in root but not found`);
      }
    }
    
    // Check for orphaned components
    const referencedIds = new Set<string>();
    
    function collectIds(ids: string[] | undefined) {
      for (const id of ids || []) {
        referencedIds.add(id);
        const comp = data.components[id];
        if (comp?.children) {
          collectIds(comp.children);
        }
      }
    }
    
    collectIds(data.root.children);
    
    for (const id of Object.keys(data.components)) {
      if (!referencedIds.has(id)) {
        warnings.push(`Orphaned component: ${id}`);
      }
    }
  }
  
  // Check for large pages
  const componentCount = Object.keys(data.components || {}).length;
  if (componentCount > 100) {
    warnings.push(`Page has ${componentCount} components, consider splitting`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Export functions for API routes
 */
export async function exportSiteToZip(
  pages: Array<{ slug: string; data: StudioPageData }>
): Promise<Blob> {
  const result = await buildOptimizedSite(pages);
  
  // In a real implementation, use JSZip to create archive
  // This is a placeholder
  const files: Record<string, string> = {};
  
  for (const page of result.pages) {
    files[page.path] = page.html;
  }
  
  for (const asset of result.assets) {
    files[asset.path] = asset.content;
  }
  
  // Return as blob (would use JSZip in production)
  const content = JSON.stringify(files, null, 2);
  return new Blob([content], { type: 'application/json' });
}
```

**Acceptance Criteria:**
- [ ] Builds all pages
- [ ] Generates combined CSS
- [ ] Calculates sizes
- [ ] Logs build summary
- [ ] Validates page data
- [ ] Handles errors gracefully

---

### Task 6: Create Export API Route

**Description:** API endpoint to trigger site export.

**Files:**
- CREATE: `src/app/api/studio/export/route.ts`

**Code:**
```typescript
// src/app/api/studio/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildOptimizedSite, buildSinglePage, validatePageData } from '@/lib/studio/engine/build';

/**
 * POST /api/studio/export
 * Export site or page as optimized HTML
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { siteId, pageId, format = 'html' } = body;
    
    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }
    
    // Verify user has access to site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, user_id')
      .eq('id', siteId)
      .single();
    
    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    if (site.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Export single page or entire site
    if (pageId) {
      // Export single page
      const { data: page, error: pageError } = await supabase
        .from('pages')
        .select('id, slug, content')
        .eq('id', pageId)
        .eq('site_id', siteId)
        .single();
      
      if (pageError || !page) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        );
      }
      
      const pageData = page.content as any;
      
      // Validate
      const validation = validatePageData(pageData);
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid page data', details: validation.errors },
          { status: 400 }
        );
      }
      
      // Build
      const { html, css } = await buildSinglePage(pageData, {
        minify: true,
        optimizeImages: true,
      });
      
      if (format === 'json') {
        return NextResponse.json({
          success: true,
          page: {
            slug: page.slug,
            html,
            css,
          },
          warnings: validation.warnings,
        });
      }
      
      // Return HTML directly
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${page.slug || 'page'}.html"`,
        },
      });
    } else {
      // Export entire site
      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('id, slug, content')
        .eq('site_id', siteId)
        .order('sort_order');
      
      if (pagesError) {
        return NextResponse.json(
          { error: 'Failed to fetch pages' },
          { status: 500 }
        );
      }
      
      const pageDataArray = pages.map(p => ({
        slug: p.slug || '/',
        data: p.content as any,
      }));
      
      // Build all pages
      const result = await buildOptimizedSite(pageDataArray, {
        minify: true,
        optimizeImages: true,
        splitCSS: true,
      });
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Build failed', details: result.errors },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        stats: result.stats,
        pages: result.pages.map(p => ({
          path: p.path,
          slug: p.slug,
          size: p.htmlSize,
        })),
        assets: result.assets.map(a => ({
          type: a.type,
          path: a.path,
          size: a.size,
        })),
        warnings: result.warnings,
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/studio/export?siteId=...&pageId=...
 * Preview export without downloading
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const pageId = searchParams.get('pageId');
  
  if (!siteId || !pageId) {
    return NextResponse.json(
      { error: 'siteId and pageId are required' },
      { status: 400 }
    );
  }
  
  // Reuse POST logic with format=json
  const response = await POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ siteId, pageId, format: 'json' }),
    })
  );
  
  return response;
}
```

**Acceptance Criteria:**
- [ ] Authentication required
- [ ] Single page export works
- [ ] Full site export works
- [ ] Validation before export
- [ ] Returns correct content type
- [ ] Error handling

---

### Task 7: Add Export Button to Toolbar

**Description:** Add export functionality to the studio toolbar.

**Files:**
- MODIFY: `src/components/studio/panels/top-toolbar.tsx`

**Code:**
```typescript
// Add to top-toolbar.tsx

import { Download, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// In the component:
const [exporting, setExporting] = useState(false);

async function handleExport(format: 'html' | 'zip') {
  setExporting(true);
  
  try {
    const response = await fetch('/api/studio/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        pageId,
        format: format === 'zip' ? 'json' : 'html',
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Export failed');
    }
    
    if (format === 'html') {
      // Download HTML file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pageName || 'page'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Show export results
      const result = await response.json();
      toast.success(`Exported ${result.pages.length} pages`);
      console.log('Export result:', result);
    }
  } catch (error) {
    toast.error(`Export failed: ${error}`);
  } finally {
    setExporting(false);
  }
}

// Add to toolbar:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button 
      variant="outline" 
      size="sm"
      disabled={exporting}
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="ml-2">Export</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleExport('html')}>
      Export Page as HTML
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleExport('zip')}>
      Export Entire Site
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Acceptance Criteria:**
- [ ] Export dropdown in toolbar
- [ ] Loading state while exporting
- [ ] HTML download works
- [ ] Site export shows results
- [ ] Error handling with toast

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/lib/studio/engine/html-generator.ts` | Optimized HTML generation |
| CREATE | `src/lib/studio/engine/critical-css.ts` | Critical CSS extraction |
| CREATE | `src/lib/studio/engine/component-renderer.ts` | Component to HTML rendering |
| CREATE | `src/lib/studio/engine/asset-optimizer.ts` | Asset optimization utilities |
| CREATE | `src/lib/studio/engine/build.ts` | Build script for static export |
| CREATE | `src/app/api/studio/export/route.ts` | Export API endpoint |
| MODIFY | `src/components/studio/panels/top-toolbar.tsx` | Add export button |

## Testing Requirements

### Unit Tests
- [ ] HTML generator produces valid HTML
- [ ] Critical CSS stays under 14KB
- [ ] CSS minification works
- [ ] srcset generation correct
- [ ] Build validation catches errors

### Integration Tests
- [ ] Export API returns correct data
- [ ] Full site build succeeds
- [ ] Lazy loading script works

### Manual Testing
- [ ] Export single page as HTML
- [ ] Open exported HTML in browser
- [ ] Verify styles applied
- [ ] Verify images lazy load
- [ ] Run Lighthouse on exported page
- [ ] Check for console errors

## Dependencies to Install

```bash
# Optional for production: CSS minification
pnpm add cssnano postcss

# Optional for production: Image optimization
pnpm add sharp

# Optional for ZIP export
pnpm add jszip
```

## Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| Lighthouse Performance | 90+ | Chrome DevTools |
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Total Blocking Time | < 200ms | Lighthouse |
| Critical CSS Size | < 14KB | Build output |

## Rollback Plan

If export issues arise:
1. Disable minification (set minify: false)
2. Inline all CSS (set splitCSS: false)
3. Skip lazy loading (set lazyLoadImages: false)
4. Return raw page data instead of HTML

## Success Criteria

- [ ] Export button visible in toolbar
- [ ] Single page exports as valid HTML
- [ ] HTML opens in browser with styles
- [ ] Critical CSS inlined in head
- [ ] Deferred CSS loads asynchronously
- [ ] Images have srcset and loading="lazy"
- [ ] Heavy components lazy load
- [ ] Full site export works
- [ ] Build stats displayed
- [ ] Lighthouse score 90+ on exported page
- [ ] No console errors on exported page
- [ ] Page validates (W3C validator)
