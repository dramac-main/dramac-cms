/**
 * DRAMAC Studio HTML Generator
 * 
 * Generates optimized HTML from Studio components for:
 * - Static site export
 * - Server-side rendering
 * - Preview generation
 * 
 * @phase STUDIO-23 - Export & Render Optimization
 */

import type { StudioComponent } from "@/types/studio";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { generateClassName, generateInlineStyles } from "./css-generator";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Page data for HTML generation
 */
export interface StudioPageData {
  id: string;
  siteId: string;
  title: string;
  slug?: string;
  description?: string;
  status?: string;
  rootZone?: {
    id: string;
    componentIds: string[];
  };
  /** All components on the page (flat list, referenced by rootZone.componentIds) */
  components?: StudioComponent[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Drop zone data
 */
export interface DropZoneData {
  id: string;
  componentIds: string[];
}

export interface HTMLGeneratorOptions {
  /** Whether to inline critical CSS */
  inlineCriticalCSS?: boolean;
  /** Whether to minify HTML output */
  minify?: boolean;
  /** Whether to include data attributes for hydration */
  includeDataAttributes?: boolean;
  /** Custom class prefix */
  classPrefix?: string;
  /** Whether to use inline styles instead of classes */
  useInlineStyles?: boolean;
  /** Base URL for assets */
  assetBaseUrl?: string;
  /** Custom head content */
  headContent?: string;
  /** Custom body scripts */
  bodyScripts?: string;
}

interface RenderContext {
  options: HTMLGeneratorOptions;
  componentsMap: Map<string, StudioComponent>;
  renderedIds: Set<string>;
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
 * Minifies HTML by removing excess whitespace
 */
function minifyHTML(html: string): string {
  return html
    // Remove comments (except conditional comments)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, "")
    // Remove whitespace between tags
    .replace(/>\s+</g, "><")
    // Collapse multiple spaces
    .replace(/\s{2,}/g, " ")
    // Trim
    .trim();
}

/**
 * Converts props to HTML attributes string
 */
function propsToAttributes(
  props: Record<string, unknown>,
  _context: RenderContext
): string {
  const attrs: string[] = [];
  
  // Skip internal/style props
  const skipProps = new Set([
    "children",
    "className",
    "style",
    // Style props handled by CSS generator
    "backgroundColor",
    "color",
    "padding",
    "margin",
    "width",
    "height",
    "fontSize",
    "fontWeight",
  ]);
  
  for (const [key, value] of Object.entries(props)) {
    if (skipProps.has(key) || value === undefined || value === null) {
      continue;
    }
    
    // Convert camelCase to kebab-case for HTML
    const attrName = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    
    // Handle different value types
    if (typeof value === "boolean") {
      if (value) attrs.push(attrName);
    } else if (typeof value === "string" || typeof value === "number") {
      attrs.push(`${attrName}="${escapeHTML(String(value))}"`);
    }
  }
  
  return attrs.length > 0 ? " " + attrs.join(" ") : "";
}

/**
 * Extended component type with optional zones
 */
interface ComponentWithZones extends StudioComponent {
  zones?: Record<string, DropZoneData>;
}

/**
 * Builds a map of component IDs to components for fast lookup
 */
function buildComponentsMap(
  components: StudioComponent[]
): Map<string, StudioComponent> {
  const map = new Map<string, StudioComponent>();
  
  function addComponent(component: StudioComponent) {
    map.set(component.id, component);
    
    // Add children from zones (if zones exist)
    const compWithZones = component as ComponentWithZones;
    if (compWithZones.zones) {
      for (const zone of Object.values(compWithZones.zones)) {
        if (zone.componentIds) {
          // Zone references are resolved separately
        }
      }
    }
  }
  
  for (const component of components) {
    addComponent(component);
  }
  
  return map;
}

// =============================================================================
// COMPONENT RENDERERS
// =============================================================================

/**
 * Renders a single component to HTML
 */
export function generateComponentHTML(
  component: StudioComponent,
  allComponents: StudioComponent[],
  options: HTMLGeneratorOptions = {}
): string {
  const context: RenderContext = {
    options,
    componentsMap: buildComponentsMap(allComponents),
    renderedIds: new Set(),
  };
  
  return renderComponent(component, context);
}

/**
 * Internal component render function
 */
function renderComponent(
  component: StudioComponent,
  context: RenderContext
): string {
  // Prevent infinite loops from circular references
  if (context.renderedIds.has(component.id)) {
    return `<!-- Circular reference: ${component.id} -->`;
  }
  context.renderedIds.add(component.id);
  
  // Get component definition from registry
  const definition = componentRegistry.get(component.type);
  
  if (!definition) {
    // Handle missing component
    return `<!-- Missing component: ${component.type} (${component.id}) -->`;
  }
  
  const { options } = context;
  const classPrefix = options.classPrefix || "dc";
  const className = generateClassName(component.id, classPrefix);
  
  // Build class list
  const classes: string[] = [className];
  if (component.props.className) {
    classes.push(String(component.props.className));
  }
  
  // Build style attribute if using inline styles
  let styleAttr = "";
  if (options.useInlineStyles) {
    const styles = generateInlineStyles(component.props);
    if (Object.keys(styles).length > 0) {
      const styleStr = Object.entries(styles)
        .map(([prop, val]) => {
          const cssProperty = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
          return `${cssProperty}: ${val}`;
        })
        .join("; ");
      styleAttr = ` style="${escapeHTML(styleStr)}"`;
    }
  }
  
  // Data attributes for hydration
  let dataAttrs = "";
  if (options.includeDataAttributes) {
    dataAttrs = ` data-component-id="${component.id}" data-component-type="${component.type}"`;
  }
  
  // Get the HTML tag to use
  const tag = getComponentTag(component.type, component.props);
  
  // Build opening tag
  const classAttr = classes.length > 0 ? ` class="${classes.join(" ")}"` : "";
  const otherAttrs = propsToAttributes(component.props, context);
  
  // Handle void elements
  const voidElements = new Set(["img", "br", "hr", "input", "meta", "link"]);
  if (voidElements.has(tag)) {
    return `<${tag}${classAttr}${styleAttr}${dataAttrs}${otherAttrs} />`;
  }
  
  // Render children content
  let childrenHTML = "";
  
  // Text content
  if (component.props.text || component.props.content || component.props.children) {
    const text = String(component.props.text || component.props.content || component.props.children);
    childrenHTML = escapeHTML(text);
  }
  
  // Render zones (nested components) - cast to extended type
  const compWithZones = component as ComponentWithZones;
  if (compWithZones.zones) {
    for (const [zoneName, zone] of Object.entries(compWithZones.zones)) {
      const zoneHTML = renderZone(zone, zoneName, context);
      childrenHTML += zoneHTML;
    }
  }
  
  // Full element
  return `<${tag}${classAttr}${styleAttr}${dataAttrs}${otherAttrs}>${childrenHTML}</${tag}>`;
}

/**
 * Renders a drop zone and its children
 */
function renderZone(
  zone: DropZoneData,
  zoneName: string,
  context: RenderContext
): string {
  if (!zone.componentIds || zone.componentIds.length === 0) {
    return "";
  }
  
  const childHTML: string[] = [];
  
  for (const childId of zone.componentIds) {
    const childComponent = context.componentsMap.get(childId);
    if (childComponent) {
      childHTML.push(renderComponent(childComponent, context));
    }
  }
  
  // Wrap zone content
  const { options } = context;
  let zoneAttrs = "";
  if (options.includeDataAttributes) {
    zoneAttrs = ` data-zone="${zoneName}"`;
  }
  
  return `<div${zoneAttrs}>${childHTML.join("")}</div>`;
}

/**
 * Gets the appropriate HTML tag for a component type
 */
function getComponentTag(
  componentType: string,
  props: Record<string, unknown>
): string {
  // Map component types to semantic HTML tags
  const tagMap: Record<string, string> = {
    // Core components
    "heading": props.level ? `h${props.level}` : "h2",
    "text": "p",
    "paragraph": "p",
    "button": "button",
    "link": "a",
    "image": "img",
    "video": "video",
    "container": "div",
    "section": "section",
    "header": "header",
    "footer": "footer",
    "nav": "nav",
    "main": "main",
    "article": "article",
    "aside": "aside",
    "flex": "div",
    "grid": "div",
    "card": "div",
    "list": "ul",
    "list-item": "li",
    "form": "form",
    "input": "input",
    "textarea": "textarea",
    "select": "select",
    "label": "label",
    "icon": "span",
    "spacer": "div",
    "divider": "hr",
  };
  
  // Check for custom tag in props
  if (props.as && typeof props.as === "string") {
    return props.as;
  }
  
  return tagMap[componentType.toLowerCase()] || "div";
}

// =============================================================================
// PAGE RENDERER
// =============================================================================

/**
 * Generates a complete HTML page
 */
export function generatePageHTML(
  page: StudioPageData,
  options: HTMLGeneratorOptions = {}
): string {
  const {
    inlineCriticalCSS = true,
    minify: shouldMinify = false,
    headContent = "",
    bodyScripts = "",
    useInlineStyles = true,
    includeDataAttributes = false,
  } = options;

  // Build body content from component tree
  let bodyContent = "";

  try {
    const components = page.components || [];
    const rootIds = page.rootZone?.componentIds || [];

    if (components.length > 0 && rootIds.length > 0) {
      // Use the existing renderToStaticHTML engine for real serialization
      bodyContent = renderToStaticHTML(components, rootIds, {
        ...options,
        useInlineStyles,
        includeDataAttributes,
        minify: false, // We minify the whole doc at the end
      });
    } else if (rootIds.length > 0 && components.length === 0) {
      // Component IDs referenced but no component data provided
      bodyContent = `<!-- ${rootIds.length} component(s) referenced but component data not provided -->`;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    bodyContent = `<!-- Error rendering page components: ${escapeHTML(message)} -->`;
  }

  // Basic layout CSS for a self-contained document
  const layoutCSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background: #fff; }
    img { max-width: 100%; height: auto; display: block; }
    section { padding: 2rem 1rem; }
    h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin-bottom: 0.5em; }
    p { margin-bottom: 1em; }
    a { color: inherit; }
    button { font: inherit; cursor: pointer; }
    #page-root { max-width: 1200px; margin: 0 auto; }
  `;

  // Build full HTML document
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(page.title || "Untitled Page")}</title>
  ${page.description ? `<meta name="description" content="${escapeHTML(page.description)}">` : ""}
  ${inlineCriticalCSS ? `<style>${layoutCSS}</style>` : ""}
  ${headContent}
</head>
<body>
  <div id="page-root" data-page-id="${page.id}">
    ${bodyContent}
  </div>
  ${bodyScripts}
</body>
</html>`;

  if (shouldMinify) {
    html = minifyHTML(html);
  }

  return html;
}

/**
 * Renders components to static HTML string (for SSR)
 */
export function renderToStaticHTML(
  components: StudioComponent[],
  rootIds: string[],
  options: HTMLGeneratorOptions = {}
): string {
  const context: RenderContext = {
    options,
    componentsMap: buildComponentsMap(components),
    renderedIds: new Set(),
  };
  
  const htmlParts: string[] = [];
  
  for (const id of rootIds) {
    const component = context.componentsMap.get(id);
    if (component) {
      htmlParts.push(renderComponent(component, context));
    }
  }
  
  const html = htmlParts.join("\n");
  
  return options.minify ? minifyHTML(html) : html;
}
