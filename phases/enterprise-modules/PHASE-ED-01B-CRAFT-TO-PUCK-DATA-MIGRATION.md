# PHASE-ED-01B: Craft.js to Puck Data Migration

## Overview
- **Objective**: Create migration utilities to convert existing Craft.js page content to Puck format
- **Scope**: Data migration utilities, format conversion, backward compatibility
- **Dependencies**: PHASE-ED-01A (Puck Editor Core Integration)
- **Estimated Effort**: ~8 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified  
- [x] Patterns verified
- [x] No conflicts detected

## Data Format Comparison

### Craft.js Format (Current)
```typescript
// Stored in page_content.content as JSON
interface CraftJsState {
  ROOT: {
    type: { resolvedName: "Root" };
    isCanvas: true;
    props: { backgroundColor: "#ffffff"; padding: 0 };
    displayName: "Page";
    custom: {};
    nodes: ["node-1", "node-2"];
    linkedNodes: {};
  };
  "node-1": {
    type: { resolvedName: "Hero" };
    isCanvas: false;
    props: {
      title: "Welcome";
      subtitle: "Build amazing experiences";
      buttonText: "Get Started";
    };
    displayName: "Hero";
    custom: {};
    nodes: [];
    linkedNodes: {};
    parent: "ROOT";
  };
  // ... more nodes
}
```

### Puck Format (Target)
```typescript
interface PuckData {
  root: {
    props: {
      title?: string;
      // root-level settings
    };
  };
  content: Array<{
    type: string;  // Component name
    props: Record<string, any>;
  }>;
  zones?: Record<string, Array<{
    type: string;
    props: Record<string, any>;
  }>>;
}
```

## Implementation Steps

### Step 1: Create Migration Types
**File**: `src/lib/migration/types.ts`
**Action**: Create

Define TypeScript interfaces for both formats.

### Step 2: Create Migration Utility
**File**: `src/lib/migration/craft-to-puck.ts`
**Action**: Create

Core migration logic to convert Craft.js node tree to Puck content array.

### Step 3: Create Component Name Mapping
**File**: `src/lib/migration/component-mapping.ts`
**Action**: Create

Map Craft.js component names to Puck component names.

### Step 4: Create Props Transformation
**File**: `src/lib/migration/props-transform.ts`
**Action**: Create

Transform component props between formats (handle field name changes).

### Step 5: Create Migration API Route
**File**: `src/app/api/migrate-page/route.ts`
**Action**: Create

API endpoint to migrate a page's content on-demand.

### Step 6: Create Batch Migration Script
**File**: `scripts/migrate-pages-to-puck.ts`
**Action**: Create

Script to migrate all existing pages to Puck format.

### Step 7: Update Page Content Loader
**File**: `src/lib/actions/pages.ts`
**Action**: Modify

Add format detection and auto-migration on read.

## Migration Logic

### Core Algorithm
```typescript
function migrateCraftToPuck(craftData: CraftJsState): PuckData {
  // 1. Extract root props
  const rootProps = craftData.ROOT?.props || {};
  
  // 2. Build content array from node tree
  const content: PuckData['content'] = [];
  
  // 3. Process nodes in order (following nodes array)
  function processNode(nodeId: string): ComponentData | null {
    const node = craftData[nodeId];
    if (!node) return null;
    
    const componentName = mapComponentName(node.type.resolvedName);
    const props = transformProps(node.type.resolvedName, node.props);
    
    return { type: componentName, props };
  }
  
  // 4. Process ROOT's direct children
  for (const nodeId of craftData.ROOT?.nodes || []) {
    const component = processNode(nodeId);
    if (component) content.push(component);
  }
  
  return {
    root: { props: transformRootProps(rootProps) },
    content,
  };
}
```

### Component Name Mapping
```typescript
const COMPONENT_MAP: Record<string, string> = {
  // Layout
  "Root": "Root",
  "Section": "Section",
  "Container": "Container",
  "Columns": "Columns",
  "Column": "Column",
  "Card": "Card",
  "Spacer": "Spacer",
  "Divider": "Divider",
  
  // Typography
  "Heading": "Heading",
  "Text": "Text",
  
  // Buttons - normalize to single Button component
  "Button": "Button",
  "ButtonComponent": "Button",
  "ButtonNew": "Button",
  
  // Media
  "Image": "Image",
  "ImageComponent": "Image",
  "ImageNew": "Image",
  "Video": "Video",
  "MapEmbed": "Map",
  
  // Sections
  "Hero": "Hero",
  "HeroSection": "Hero",
  "Features": "Features",
  "FeatureGrid": "Features",
  "CTA": "CTA",
  "CTASection": "CTA",
  "Testimonials": "Testimonials",
  "FAQ": "FAQ",
  "Stats": "Stats",
  "Team": "Team",
  "Gallery": "Gallery",
  
  // Navigation
  "Navbar": "Navbar",
  "Navigation": "Navbar",
  "Footer": "Footer",
  "SocialLinks": "SocialLinks",
  
  // Forms
  "Form": "Form",
  "FormField": "FormField",
  "ContactForm": "ContactForm",
  "Newsletter": "Newsletter",
  
  // E-Commerce
  "ProductGrid": "ProductGrid",
  "ProductCard": "ProductCard",
  "CartWidget": "CartWidget",
  "FeaturedProducts": "FeaturedProducts",
  "AddToCartButton": "AddToCartButton",
  "CategoryMenu": "CategoryMenu",
};
```

### Props Transformation Examples
```typescript
// Hero props transformation
function transformHeroProps(craftProps: any): any {
  return {
    title: craftProps.title || "Welcome",
    subtitle: craftProps.subtitle || "",
    buttonText: craftProps.buttonText || "Get Started",
    buttonLink: craftProps.buttonLink || "#",
    alignment: craftProps.alignment || "center",
    backgroundColor: craftProps.backgroundColor || "",
    backgroundImage: craftProps.backgroundImage || "",
    textColor: craftProps.textColor || "#ffffff",
    minHeight: craftProps.minHeight || 500,
    overlay: craftProps.overlay ?? true,
    overlayOpacity: craftProps.overlayOpacity || 50,
  };
}
```

## Format Detection

```typescript
function isPuckFormat(content: unknown): content is PuckData {
  if (!content || typeof content !== 'object') return false;
  const data = content as any;
  return Array.isArray(data.content) && typeof data.root === 'object';
}

function isCraftFormat(content: unknown): content is CraftJsState {
  if (!content || typeof content !== 'object') return false;
  const data = content as any;
  return typeof data.ROOT === 'object' && data.ROOT.type?.resolvedName;
}
```

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| src/lib/migration/types.ts | Created | Migration type definitions |
| src/lib/migration/craft-to-puck.ts | Created | Core migration logic |
| src/lib/migration/component-mapping.ts | Created | Component name mapping |
| src/lib/migration/props-transform.ts | Created | Props transformation |
| src/lib/migration/index.ts | Created | Barrel exports |
| src/app/api/migrate-page/route.ts | Created | Migration API endpoint |
| scripts/migrate-pages-to-puck.ts | Created | Batch migration script |
| src/lib/actions/pages.ts | Modified | Auto-migration on read |

## Verification Steps
1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Manual testing:
   - Load page with Craft.js content
   - Verify auto-migration works
   - Check all components render correctly
   - Edit and save page in Puck format
   - Reload and verify persistence

## Backward Compatibility

### Strategy
1. **Format Detection**: Auto-detect content format on load
2. **On-Read Migration**: Convert Craft.js to Puck when loading
3. **Save as Puck**: Always save in Puck format
4. **Gradual Migration**: Pages migrate as they're edited
5. **Batch Migration**: Optional script for bulk conversion

### Fallback
If migration fails:
1. Log error with page ID
2. Return empty content structure
3. Allow user to start fresh
4. Original content preserved in database

## Rollback Plan
If issues arise:
1. Disable auto-migration flag
2. Revert to Craft.js editor
3. Run reverse migration if needed (Puck → Craft.js)

## Notes
- Craft.js uses node IDs and parent references
- Puck uses flat content array
- Some components may need manual adjustment
- E-Commerce components require special handling
- Nested DropZones need zone mapping
