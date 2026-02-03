/**
 * Puck to Studio Data Migration Utility
 * 
 * Automatically migrates old Puck editor page data to the new Studio format.
 * This runs transparently at render time, ensuring backward compatibility.
 * 
 * @phase STUDIO-27 - Platform Integration & Puck Removal
 */

import type { StudioPageData, StudioComponent } from "@/types/studio";
import { nanoid } from "nanoid";

// ============================================================================
// Puck Data Types (for migration reference)
// ============================================================================

interface PuckData {
  root: { 
    props: Record<string, unknown>;
  };
  content: PuckComponent[];
  zones?: Record<string, PuckComponent[]>;
}

interface PuckComponent {
  type: string;
  props: Record<string, unknown>;
}

// ============================================================================
// Type Mapping
// ============================================================================

/**
 * Map old Puck component types to new Studio types
 */
function mapPuckTypeToStudio(puckType: string): string {
  const typeMap: Record<string, string> = {
    // Layout Components
    "Section": "Section",
    "Container": "Container",
    "Columns": "Columns",
    "Column": "Column",
    "Flex": "Flex",
    "Grid": "Grid",
    "Spacer": "Spacer",
    "Divider": "Divider",
    
    // Typography Components
    "Heading": "Heading",
    "Text": "Text",
    "Paragraph": "Text",
    "RichText": "RichText",
    "Quote": "Quote",
    "Label": "Label",
    
    // Media Components
    "Image": "Image",
    "Video": "Video",
    "Icon": "Icon",
    "Gallery": "Gallery",
    "Logo": "Logo",
    
    // Interactive Components
    "Button": "Button",
    "ButtonGroup": "ButtonGroup",
    "Link": "Link",
    "Accordion": "Accordion",
    "Tabs": "Tabs",
    "Modal": "Modal",
    
    // Marketing Components
    "Hero": "Hero",
    "HeroSection": "Hero",
    "FeatureList": "Features",
    "Features": "Features",
    "FeatureGrid": "Features",
    "Testimonial": "Testimonials",
    "Testimonials": "Testimonials",
    "CTA": "CTA",
    "CallToAction": "CTA",
    "Pricing": "Pricing",
    "PricingTable": "Pricing",
    "FAQ": "FAQ",
    "ContactForm": "ContactForm",
    "Team": "Team",
    "Stats": "Stats",
    "Newsletter": "Newsletter",
    
    // Navigation Components
    "Navbar": "Navbar",
    "Footer": "Footer",
    "Breadcrumb": "Breadcrumb",
    "Menu": "Menu",
    
    // Form Components
    "Form": "Form",
    "FormField": "FormField",
    "Input": "Input",
    "Select": "Select",
    "Checkbox": "Checkbox",
    "Radio": "Radio",
    "Textarea": "Textarea",
  };
  
  // Return mapped type or original if not in map
  return typeMap[puckType] || puckType;
}

// ============================================================================
// Props Migration
// ============================================================================

/**
 * Props that should be wrapped in ResponsiveValue format
 */
const RESPONSIVE_PROPS = [
  "fontSize",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "gap",
  "textAlign",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "flexDirection",
  "columns",
  "gridCols",
  "display",
  "alignItems",
  "justifyContent",
];

/**
 * Check if a value is already in ResponsiveValue format
 */
function isResponsiveValue(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return "mobile" in v || "tablet" in v || "desktop" in v;
}

/**
 * Migrate props to Studio format (add responsive wrapper if needed)
 */
function migrateProps(
  _type: string,
  props: Record<string, unknown>
): Record<string, unknown> {
  const migratedProps: Record<string, unknown> = {};
  
  Object.entries(props).forEach(([key, value]) => {
    // Skip null/undefined
    if (value === null || value === undefined) {
      return;
    }
    
    // Wrap responsive props in ResponsiveValue format if not already
    if (RESPONSIVE_PROPS.includes(key) && !isResponsiveValue(value)) {
      migratedProps[key] = { mobile: value };
    } else {
      migratedProps[key] = value;
    }
  });
  
  return migratedProps;
}

// ============================================================================
// Main Migration Functions
// ============================================================================

/**
 * Generate a unique component ID
 */
function generateId(prefix: string = "comp"): string {
  return `${prefix}-${nanoid(8)}`;
}

/**
 * Migrates old Puck page data to Studio format.
 * Run this on pages that were created before Studio.
 */
export function migratePuckToStudio(puckData: PuckData): StudioPageData {
  const components: Record<string, StudioComponent> = {};
  const rootChildren: string[] = [];
  
  // Create base Studio data structure
  const studioData: StudioPageData = {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: puckData.root?.props || {},
      children: rootChildren,
    },
    components,
    zones: {},
  };
  
  // Migrate content components
  if (puckData.content && Array.isArray(puckData.content)) {
    puckData.content.forEach((puckComp) => {
      const id = generateId("migrated");
      
      components[id] = {
        id,
        type: mapPuckTypeToStudio(puckComp.type),
        props: migrateProps(puckComp.type, puckComp.props || {}),
        parentId: "root",
      };
      
      rootChildren.push(id);
    });
  }
  
  // Migrate zones if present
  if (puckData.zones && typeof puckData.zones === "object") {
    Object.entries(puckData.zones).forEach(([zoneId, zoneContent]) => {
      if (!Array.isArray(zoneContent)) return;
      
      studioData.zones![zoneId] = [];
      
      zoneContent.forEach((puckComp) => {
        const id = generateId(`zone-${zoneId}`);
        
        components[id] = {
          id,
          type: mapPuckTypeToStudio(puckComp.type),
          props: migrateProps(puckComp.type, puckComp.props || {}),
          zoneId,
        };
        
        studioData.zones![zoneId].push(id);
      });
    });
  }
  
  return studioData;
}

/**
 * Check if data is already in Studio format
 */
export function isStudioFormat(data: unknown): data is StudioPageData {
  if (!data || typeof data !== "object") return false;
  
  const d = data as Record<string, unknown>;
  
  // Studio format has version "1.0", root object, and components record
  return (
    d.version === "1.0" && 
    typeof d.root === "object" && 
    d.root !== null &&
    typeof d.components === "object" &&
    d.components !== null
  );
}

/**
 * Check if data is in Puck format
 */
export function isPuckFormat(data: unknown): data is PuckData {
  if (!data || typeof data !== "object") return false;
  
  const d = data as Record<string, unknown>;
  
  // Puck format has content array and root object
  return (
    Array.isArray(d.content) && 
    typeof d.root === "object" &&
    d.root !== null
  );
}

/**
 * Auto-migrate data to Studio format if needed
 * This is the main entry point for migration
 */
export function ensureStudioFormat(data: unknown): StudioPageData {
  // Already Studio format
  if (isStudioFormat(data)) {
    return data;
  }
  
  // Empty data - return empty Studio format
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return createEmptyStudioData();
  }
  
  // Parse if string
  let parsed = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      console.warn("[Migration] Failed to parse data string, returning empty");
      return createEmptyStudioData();
    }
  }
  
  // Check again after parsing
  if (isStudioFormat(parsed)) {
    return parsed;
  }
  
  // Puck format - migrate
  if (isPuckFormat(parsed)) {
    console.log("[Migration] Converting Puck format to Studio format");
    return migratePuckToStudio(parsed);
  }
  
  // Unknown format - return empty
  console.warn("[Migration] Unknown data format, returning empty");
  return createEmptyStudioData();
}

/**
 * Create empty Studio page data
 */
export function createEmptyStudioData(): StudioPageData {
  return {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: {},
      children: [],
    },
    components: {},
    zones: {},
  };
}

/**
 * Validate Studio data structure
 */
export function validateStudioData(data: StudioPageData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (data.version !== "1.0") {
    errors.push(`Invalid version: ${data.version}`);
  }
  
  if (!data.root || typeof data.root !== "object") {
    errors.push("Missing or invalid root object");
  }
  
  if (!data.components || typeof data.components !== "object") {
    errors.push("Missing or invalid components object");
  }
  
  // Validate component references
  if (data.root?.children) {
    data.root.children.forEach((childId) => {
      if (!data.components[childId]) {
        errors.push(`Root references missing component: ${childId}`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
