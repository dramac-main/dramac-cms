# TASK: Generate Implementation Phases - WAVE 5 (Module Integration)

You are a senior software architect. Wave 4 (AI Integration) has been successfully implemented. Now generate the **next 2 module integration phases** for DRAMAC Studio.

## ✅ Wave 4 Completion Status

The following has been implemented:

### Files Created (Wave 4):
```
src/components/studio/ai/
  ├── ai-component-chat.tsx          ✅ Chat UI with component context
  ├── ai-page-generator.tsx          ✅ Full page generation wizard
  ├── quick-actions.tsx              ✅ One-click AI improvements
  ├── ai-suggestions.tsx             ✅ Contextual suggestions
  └── change-preview.tsx             ✅ Preview AI changes

src/lib/studio/
  ├── store/
  │   └── ai-store.ts                ✅ AI chat state management
  └── ai/
      ├── prompts.ts                 ✅ System prompt builders
      └── page-generation-prompts.ts ✅ Page generation prompts

src/app/api/studio/ai/
  ├── component/route.ts             ✅ Component AI endpoint
  └── generate-page/route.ts         ✅ Page generation endpoint

Integration:
  ✅ "Ask AI" button in properties panel
  ✅ "Generate Page" button in toolbar
  ✅ Quick action chips for text components
```

### Current State:
- ✅ AI can suggest prop changes via natural language
- ✅ Preview AI changes before applying
- ✅ Generate entire pages from text prompts
- ✅ Quick actions (Translate, Shorten, Improve, etc.)
- ✅ Chat history per session
- ✅ AI respects field types and ResponsiveValue<T>
- ✅ AI generates mobile-first responsive pages
- ✅ Error handling and loading states

### What's Missing (Wave 5 Will Add):
- ❌ Dynamic loading of components from installed modules
- ❌ Module components appear in component library
- ❌ Module-specific custom field types
- ❌ Module data binding (e.g., product selector for e-commerce)
- ❌ Module enable/disable handling
- ❌ Module component categories in sidebar

---

## 🎯 Generate These Phases (Wave 5):

1. **PHASE-STUDIO-14: Module Component Loader**
2. **PHASE-STUDIO-15: Module-Specific Fields**

## Expected Outcome After Wave 5

After implementing these 2 phases, we should have:
- ✅ Modules can export Studio components via standardized interface
- ✅ Module components automatically discovered on editor load
- ✅ Module components appear in component library (under their category)
- ✅ Module components work like core components (drag, edit, AI)
- ✅ Modules can define custom field types
- ✅ Module field types render in properties panel
- ✅ Module data binding (connect to module APIs/data)
- ✅ Enable/disable module updates component library
- ✅ Module components support responsive, AI, all features

---

## Key Implementation Context

### Existing Module System (Already in DRAMAC)

The platform already has a module system:

```typescript
// Existing module infrastructure (DO NOT RECREATE)
// src/lib/modules/
// - Module installation tracking in database
// - Module marketplace
// - Module configuration

// Database tables (already exist):
// - site_modules (tracks installed modules per site)
// - modules (module marketplace catalog)
```

### Module Package Structure

Modules are in `src/modules/` or external packages. Example:

```
src/modules/ecommerce/
├── index.ts                    # Main module exports
├── components/                 # Frontend components
│   ├── product-card.tsx
│   └── cart-widget.tsx
└── studio/                     # NEW: Studio integration
    ├── index.ts                # Studio component exports
    ├── components/
    │   ├── product-card-block.tsx
    │   ├── cart-widget-block.tsx
    │   └── product-grid-block.tsx
    └── fields/                 # Custom field types
        └── product-selector-field.tsx
```

### Module Studio Export Format

```typescript
// src/modules/ecommerce/studio/index.ts
import { ComponentDefinition, FieldDefinition } from '@/types/studio';

export const studioComponents: Record<string, ComponentDefinition> = {
  ProductCard: {
    type: 'ProductCard',
    label: 'Product Card',
    description: 'Display a product with image, title, price, and buy button',
    category: 'E-Commerce',
    icon: 'shopping-bag',
    module: {
      id: 'ecommerce',
      name: 'E-Commerce',
    },
    fields: {
      productId: {
        type: 'custom',
        label: 'Product',
        customType: 'product-selector', // References custom field
      },
      showPrice: {
        type: 'toggle',
        label: 'Show Price',
        defaultValue: true,
      },
      showRating: {
        type: 'toggle',
        label: 'Show Rating',
        defaultValue: true,
      },
      variant: {
        type: 'select',
        label: 'Layout',
        options: [
          { label: 'Card', value: 'card' },
          { label: 'List', value: 'list' },
        ],
        defaultValue: 'card',
      },
    },
    defaultProps: {
      productId: null,
      showPrice: true,
      showRating: true,
      variant: 'card',
    },
    render: ProductCardBlock,
    acceptsChildren: false,
    ai: {
      description: 'Displays a product from your catalog with customizable display options',
      canModify: ['showPrice', 'showRating', 'variant'],
      suggestions: [
        'Show product with price',
        'Hide rating stars',
        'Change to list layout',
      ],
    },
  },
  
  // More components...
};

export const studioFields: Record<string, CustomFieldEditor> = {
  'product-selector': ProductSelectorField,
  'category-selector': CategorySelectorField,
};
```

---

## Requirements for Each Phase

### PHASE-STUDIO-14: Module Component Loader

Must implement:

#### 1. Module Discovery System

```typescript
// src/lib/studio/registry/module-loader.ts

interface ModuleStudioExports {
  studioComponents?: Record<string, ComponentDefinition>;
  studioFields?: Record<string, CustomFieldEditor>;
}

async function loadModuleComponents(
  siteId: string
): Promise<ComponentDefinition[]> {
  // 1. Query database for installed modules
  const installedModules = await getInstalledModules(siteId);
  
  // 2. For each module, try to import studio exports
  const allComponents: ComponentDefinition[] = [];
  
  for (const module of installedModules) {
    try {
      // Dynamic import from module
      const studioExports = await import(`@/modules/${module.id}/studio`);
      
      if (studioExports.studioComponents) {
        // Add module info to each component
        const components = Object.values(studioExports.studioComponents).map(comp => ({
          ...comp,
          module: {
            id: module.id,
            name: module.name,
          },
        }));
        
        allComponents.push(...components);
      }
    } catch (error) {
      // Module doesn't have studio integration - skip
      console.log(`Module ${module.id} has no studio components`);
    }
  }
  
  return allComponents;
}
```

#### 2. Registry Integration

Update existing component registry to include modules:

```typescript
// Modify src/lib/studio/registry/component-registry.ts

interface ComponentRegistryState {
  coreComponents: Record<string, ComponentDefinition>;
  moduleComponents: Record<string, ComponentDefinition>;
  customFields: Record<string, CustomFieldEditor>;
  isLoadingModules: boolean;
}

const useComponentRegistry = create<ComponentRegistryState>((set, get) => ({
  coreComponents: {}, // From core-components.ts
  moduleComponents: {}, // Loaded dynamically
  customFields: {},
  isLoadingModules: false,
  
  async loadModuleComponents(siteId: string) {
    set({ isLoadingModules: true });
    
    const moduleComps = await loadModuleComponents(siteId);
    const compMap = Object.fromEntries(
      moduleComps.map(c => [c.type, c])
    );
    
    // Also load custom fields
    const customFields = await loadModuleFields(siteId);
    
    set({ 
      moduleComponents: compMap,
      customFields,
      isLoadingModules: false,
    });
  },
  
  getAllComponents() {
    return {
      ...get().coreComponents,
      ...get().moduleComponents,
    };
  },
  
  getComponentsByCategory(category: string) {
    const all = get().getAllComponents();
    return Object.values(all).filter(c => c.category === category);
  },
}));
```

#### 3. Load Modules on Editor Mount

```typescript
// Modify src/app/studio/[siteId]/[pageId]/page.tsx

export default function StudioEditorPage({ params }: Props) {
  const { siteId, pageId } = params;
  const { loadModuleComponents, isLoadingModules } = useComponentRegistry();
  
  useEffect(() => {
    // Load module components for this site
    loadModuleComponents(siteId);
  }, [siteId]);
  
  if (isLoadingModules) {
    return <div>Loading modules...</div>;
  }
  
  return <StudioEditor />;
}
```

#### 4. Component Library Shows Module Components

```typescript
// Modify src/components/studio/panels/left-panel.tsx

const LeftPanel = () => {
  const allComponents = useComponentRegistry(s => s.getAllComponents());
  const categories = groupByCategory(Object.values(allComponents));
  
  return (
    <div>
      {Object.entries(categories).map(([category, components]) => (
        <CategoryAccordion key={category} category={category}>
          {components.map(comp => (
            <ComponentItem
              key={comp.type}
              component={comp}
              badge={comp.module ? comp.module.name : undefined} // Show module badge
            />
          ))}
        </CategoryAccordion>
      ))}
    </div>
  );
};
```

#### 5. Module Enable/Disable Handling

```typescript
// src/lib/studio/hooks/use-module-sync.ts

export function useModuleSync(siteId: string) {
  const { loadModuleComponents } = useComponentRegistry();
  
  // Subscribe to module changes (installation, uninstallation)
  useEffect(() => {
    const subscription = supabase
      .channel('module-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'site_modules',
        filter: `site_id=eq.${siteId}`,
      }, () => {
        // Module list changed - reload
        loadModuleComponents(siteId);
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [siteId]);
}

// Use in editor page
function StudioEditorPage({ params }) {
  useModuleSync(params.siteId);
  // ...
}
```

#### 6. Module Component Rendering

Module components render just like core components:

```typescript
// No special handling needed in canvas
// ComponentWrapper already uses definition.render from registry
// Module components work automatically once registered
```

---

### PHASE-STUDIO-15: Module-Specific Fields

Must implement:

#### 1. Custom Field Type System

```typescript
// src/types/studio.ts (add to existing types)

type CustomFieldEditor = React.FC<{
  value: any;
  onChange: (value: any) => void;
  field: FieldDefinition;
  siteId: string; // For fetching module data
}>;

interface FieldDefinition {
  // ... existing props ...
  customType?: string; // References custom field editor
}
```

#### 2. Custom Field Registry

```typescript
// Extend src/lib/studio/registry/field-registry.ts

const customFieldEditors: Record<string, CustomFieldEditor> = {};

export function registerCustomField(
  type: string,
  editor: CustomFieldEditor
) {
  customFieldEditors[type] = editor;
}

export function getCustomFieldEditor(type: string): CustomFieldEditor | undefined {
  return customFieldEditors[type];
}

// Load from modules
async function loadModuleFields(siteId: string) {
  const installedModules = await getInstalledModules(siteId);
  
  for (const module of installedModules) {
    try {
      const studioExports = await import(`@/modules/${module.id}/studio`);
      
      if (studioExports.studioFields) {
        Object.entries(studioExports.studioFields).forEach(([type, editor]) => {
          registerCustomField(type, editor as CustomFieldEditor);
        });
      }
    } catch (error) {
      // Module doesn't have custom fields
    }
  }
}
```

#### 3. Field Renderer Handles Custom Types

```typescript
// Modify src/components/studio/panels/right-panel.tsx

const FieldRenderer = ({ field, value, onChange }) => {
  // Check if custom field type
  if (field.type === 'custom' && field.customType) {
    const CustomEditor = getCustomFieldEditor(field.customType);
    
    if (CustomEditor) {
      return (
        <CustomEditor
          value={value}
          onChange={onChange}
          field={field}
          siteId={currentSiteId}
        />
      );
    }
    
    // Fallback if custom field not found
    return <div>Custom field type '{field.customType}' not found</div>;
  }
  
  // Regular field types
  switch (field.type) {
    case 'text': return <TextFieldEditor {...props} />;
    // ... other types
  }
};
```

#### 4. Example Custom Field: Product Selector

```typescript
// src/modules/ecommerce/studio/fields/product-selector-field.tsx

import { useState, useEffect } from 'react';
import { Select } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  image?: string;
  price: number;
}

export const ProductSelectorField: CustomFieldEditor = ({
  value,
  onChange,
  field,
  siteId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch products for this site from module API
    async function fetchProducts() {
      const response = await fetch(`/api/modules/ecommerce/products?siteId=${siteId}`);
      const data = await response.json();
      setProducts(data.products || []);
      setIsLoading(false);
    }
    
    fetchProducts();
  }, [siteId]);
  
  if (isLoading) {
    return <div>Loading products...</div>;
  }
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{field.label}</label>
      <Select
        value={value?.id || ''}
        onValueChange={(productId) => {
          const product = products.find(p => p.id === productId);
          onChange(product);
        }}
      >
        <option value="">Select a product</option>
        {products.map(product => (
          <option key={product.id} value={product.id}>
            {product.name} - ${product.price}
          </option>
        ))}
      </Select>
      
      {value && (
        <div className="p-2 border rounded">
          <p className="text-sm">Selected: {value.name}</p>
          {value.image && (
            <img src={value.image} alt={value.name} className="w-20 h-20 object-cover mt-2" />
          )}
        </div>
      )}
    </div>
  );
};
```

#### 5. Module Data Binding Pattern

Custom fields can fetch data from module APIs:

```typescript
// Module provides API endpoints
// src/app/api/modules/[moduleId]/[...endpoint]/route.ts

export async function GET(
  request: Request,
  { params }: { params: { moduleId: string; endpoint: string[] } }
) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  
  // Route to appropriate module handler
  const module = await loadModule(params.moduleId);
  return module.handleAPIRequest(params.endpoint, siteId);
}
```

#### 6. Other Example Custom Fields

**Category Selector:**
```typescript
// Dropdown of e-commerce categories
// Fetches from /api/modules/ecommerce/categories
```

**Event Picker:**
```typescript
// For booking module
// Shows calendar with available events
// Fetches from /api/modules/booking/events
```

**CRM Contact Selector:**
```typescript
// For CRM module
// Search/select contacts
// Fetches from /api/modules/crm/contacts
```

---

## Important Constraints

1. **Graceful degradation** - If module uninstalled, component shows placeholder
2. **Security** - Module APIs must verify site ownership
3. **Performance** - Cache module component definitions
4. **Hot reload** - Support adding modules without editor restart
5. **Error handling** - Invalid module exports don't break editor
6. **TypeScript** - Module types must be properly inferred
7. **Backward compatibility** - Core components unaffected by module system

---

## Module Integration Checklist

After Wave 5, verify:

- [ ] Install a test module (e.g., ecommerce)
- [ ] Module components appear in component library
- [ ] Can drag module component to canvas
- [ ] Module component renders correctly
- [ ] Module component props editable
- [ ] Custom fields (product selector) work
- [ ] Custom field fetches data from module API
- [ ] AI works with module components
- [ ] Module components support responsive values
- [ ] Uninstalling module removes components from library
- [ ] Re-installing module adds components back
- [ ] Multiple modules can be loaded simultaneously
- [ ] Module components work in generated pages

---

## Example: E-Commerce Module Integration

After Wave 5, creating an e-commerce site:

1. Install E-Commerce module from marketplace
2. Open Studio editor
3. Component library now shows:
   - **E-Commerce** category
   - Product Card (with module badge)
   - Product Grid
   - Cart Widget
   - Checkout Form
4. Drag "Product Card" to canvas
5. Select it → Properties panel shows:
   - **Product** field → Custom dropdown with site's products
   - Show Price toggle
   - Show Rating toggle
   - Layout select
6. Choose product from dropdown → Immediately renders with product data
7. AI can edit: "Make the button green" → Updates button color
8. Generate page: "E-commerce product page" → Includes Product Card component

---

## Output Format

Generate each phase as a complete markdown document with:

```markdown
# PHASE-STUDIO-XX: [Title]

## Overview
| Property | Value |
|----------|-------|
| Phase | STUDIO-XX |
| Priority | High |
| Estimated Time | X hours |
| Dependencies | STUDIO-11, STUDIO-12, STUDIO-13 |

## Problem Statement
[What this phase solves]

## Implementation Tasks

### Task 1: [Specific task name]

**Files to create:**
- `src/path/to/file.tsx`

**Complete code:**
```typescript
// Full implementation
```

**Acceptance Criteria:**
- [ ] Specific testable criterion

## Testing Instructions

## Success Criteria
```

---

## Dependencies Already Installed

No new packages needed for Wave 5! Everything uses existing infrastructure.

---

## Start Now

Generate **PHASE-STUDIO-14** first (Module Component Loader), then **PHASE-STUDIO-15** (Module-Specific Fields).

Each phase should be detailed enough that an AI agent can implement it without additional context beyond this prompt and the master prompt.

---

# MASTER PROMPT FOLLOWS BELOW

[Paste the contents of PHASE-STUDIO-00-MASTER-PROMPT.md here]
