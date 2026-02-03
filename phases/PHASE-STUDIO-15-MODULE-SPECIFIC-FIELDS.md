# PHASE-STUDIO-15: Module-Specific Fields

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-15 |
| Title | Module-Specific Fields |
| Priority | High |
| Estimated Time | 8-10 hours |
| Dependencies | STUDIO-14, STUDIO-08, STUDIO-09 |
| Risk Level | Medium |

## Problem Statement

While Phase 14 enables modules to provide Studio components, those components currently can only use the standard field types (text, number, select, etc.). Many module components need specialized fields:

- **E-Commerce**: Product selector, category picker, price range slider
- **Booking**: Event picker, time slot selector, calendar field
- **CRM**: Contact selector, pipeline stage picker, lead score slider
- **Social Media**: Platform selector, post preview

Without custom fields, users must manually enter IDs or rely on text inputs, which is error-prone and provides a poor user experience.

This phase implements:
1. Custom field type registration system
2. Module field data binding (fetch data from module APIs)
3. Example custom fields for E-Commerce module
4. Integration with properties panel

## Goals

- [ ] Create custom field type registration system
- [ ] Extend properties panel to render custom fields
- [ ] Implement product selector field for E-Commerce
- [ ] Implement category selector field for E-Commerce
- [ ] Create module API endpoint pattern for field data
- [ ] Ensure custom fields work with responsive editing
- [ ] Support field validation and error states

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PROPERTIES PANEL                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Field Renderer                                                  │   │
│  │                                                                  │   │
│  │  field.type === "custom" ?                                       │   │
│  │    → Look up field.customType in customFieldRegistry            │   │
│  │    → Render custom field component with siteId context          │   │
│  │  : → Render standard field (text, number, etc.)                 │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                           ▲                                             │
│                           │                                             │
│  ┌────────────────────────┼────────────────────────────────────────┐   │
│  │              Custom Field Registry                               │   │
│  │                                                                  │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │   │
│  │  │ ecommerce:       │  │ booking:         │  │ crm:         │  │   │
│  │  │ product-selector │  │ event-picker     │  │ contact-     │  │   │
│  │  │ category-selector│  │ timeslot-picker  │  │ selector     │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      MODULE API ENDPOINTS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /api/studio/modules/ecommerce/products?siteId=xxx&search=xxx           │
│  /api/studio/modules/ecommerce/categories?siteId=xxx                    │
│  /api/studio/modules/booking/events?siteId=xxx                          │
│  /api/studio/modules/crm/contacts?siteId=xxx&search=xxx                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Custom Field Interface

```typescript
// Custom fields receive these props
interface CustomFieldEditorProps {
  value: any;
  onChange: (value: any) => void;
  field: FieldDefinition;
  siteId: string;
  moduleId: string;
}

// Field definition specifies custom type
interface FieldDefinition {
  type: "custom";
  customType: string; // e.g., "ecommerce:product-selector"
  // ... other field props
}
```

### Data Flow

1. Properties panel renders field
2. Field type is "custom" with customType "ecommerce:product-selector"
3. Field renderer looks up custom renderer from registry
4. Custom renderer receives siteId and field props
5. Custom renderer fetches data from module API
6. User selects value, onChange updates component props
7. Value is saved with component data

## Implementation Tasks

### Task 1: Extend Field Definition Types

**Description:** Add custom field type support to field definitions.

**Files:**
- MODIFY: `src/types/studio.ts`

**Code Changes:**

```typescript
// Add to FieldDefinition interface (after existing props)

/**
 * Field definition for component properties
 */
export interface FieldDefinition {
  // ... existing props ...
  
  /**
   * Custom field type identifier for module-specific fields.
   * Format: "moduleSlug:fieldType" (e.g., "ecommerce:product-selector")
   * Only used when type is "custom"
   */
  customType?: string;
  
  /**
   * Additional options for custom fields.
   * Passed to the custom field component.
   */
  customOptions?: Record<string, unknown>;
  
  /**
   * API endpoint for fetching field data.
   * If provided, the custom field can use this to fetch options.
   */
  dataEndpoint?: string;
  
  /**
   * Whether the field supports multiple selection.
   */
  multiple?: boolean;
  
  /**
   * Whether to allow clearing the selection.
   */
  clearable?: boolean;
  
  /**
   * Whether the field supports search/filtering.
   */
  searchable?: boolean;
}
```

**Acceptance Criteria:**
- [ ] Types compile without errors
- [ ] Custom field props are available in FieldDefinition

---

### Task 2: Extend Field Registry for Custom Fields

**Description:** Add custom field management to the field registry.

**Files:**
- MODIFY: `src/lib/studio/registry/field-registry.ts`

**Code Changes:**

```typescript
// Add to imports
import type { CustomFieldEditor, CustomFieldEditorProps } from "@/types/studio-module";

// Add new type for custom field metadata
export interface CustomFieldDefinition {
  /** Custom field type identifier */
  type: string;
  
  /** Display name */
  label: string;
  
  /** Module this field belongs to */
  moduleId: string;
  moduleName: string;
  
  /** The editor component */
  render: CustomFieldEditor;
  
  /** Default options */
  defaultOptions?: Record<string, unknown>;
  
  /** Validate value */
  validate?: (value: unknown, options?: Record<string, unknown>) => string | null;
}

// Update FieldRegistry class
class FieldRegistry {
  private fields: Map<FieldType, FieldTypeDefinition> = new Map();
  private customRenderers: Map<string, CustomFieldEditor> = new Map();
  private customDefinitions: Map<string, CustomFieldDefinition> = new Map();

  // ... existing methods ...

  /**
   * Register a custom field from a module
   */
  registerCustomField(definition: CustomFieldDefinition): void {
    this.customDefinitions.set(definition.type, definition);
    this.customRenderers.set(definition.type, definition.render);
    
    console.debug(`[FieldRegistry] Registered custom field: ${definition.type}`);
  }

  /**
   * Unregister custom fields from a module
   */
  unregisterModuleFields(moduleId: string): void {
    for (const [type, def] of this.customDefinitions.entries()) {
      if (def.moduleId === moduleId) {
        this.customDefinitions.delete(type);
        this.customRenderers.delete(type);
      }
    }
  }

  /**
   * Get custom field definition
   */
  getCustomFieldDefinition(type: string): CustomFieldDefinition | undefined {
    return this.customDefinitions.get(type);
  }

  /**
   * Get all custom fields for a module
   */
  getModuleCustomFields(moduleId: string): CustomFieldDefinition[] {
    return Array.from(this.customDefinitions.values())
      .filter(def => def.moduleId === moduleId);
  }

  /**
   * Check if custom field exists
   */
  hasCustomField(type: string): boolean {
    return this.customDefinitions.has(type);
  }

  /**
   * Get all custom field types
   */
  getCustomFieldTypes(): string[] {
    return Array.from(this.customDefinitions.keys());
  }
}
```

**Acceptance Criteria:**
- [ ] Can register custom field definitions
- [ ] Can retrieve custom fields by type
- [ ] Can unregister module fields when module is removed
- [ ] All existing functionality preserved

---

### Task 3: Create Custom Field Wrapper Component

**Description:** Create a wrapper component that handles custom field rendering with context.

**Files:**
- CREATE: `src/components/studio/fields/custom-field-wrapper.tsx`

**Code:**

```typescript
/**
 * Custom Field Wrapper
 * 
 * Wraps custom field components with necessary context and error handling.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { FieldDefinition } from "@/types/studio";
import type { CustomFieldEditor } from "@/types/studio-module";
import { fieldRegistry } from "@/lib/studio/registry/field-registry";
import { useEditorStore } from "@/lib/studio/store/editor-store";

// =============================================================================
// TYPES
// =============================================================================

interface CustomFieldWrapperProps {
  /** Field definition */
  field: FieldDefinition;
  
  /** Current value */
  value: unknown;
  
  /** Change handler */
  onChange: (value: unknown) => void;
  
  /** Component type for context */
  componentType?: string;
  
  /** Disabled state */
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CustomFieldWrapper({
  field,
  value,
  onChange,
  componentType,
  disabled = false,
}: CustomFieldWrapperProps) {
  const [error, setError] = useState<string | null>(null);
  const siteId = useEditorStore(state => state.siteId);
  
  // Get custom field type
  const customType = field.customType;
  
  if (!customType) {
    return (
      <FieldError 
        label={field.label}
        error="Custom field type not specified"
      />
    );
  }
  
  // Get custom renderer
  const CustomRenderer = fieldRegistry.getCustomRenderer(customType);
  
  if (!CustomRenderer) {
    return (
      <FieldError 
        label={field.label}
        error={`Custom field type "${customType}" not found. Is the module installed?`}
      />
    );
  }
  
  // Extract module ID from custom type (format: "moduleSlug:fieldType")
  const moduleId = customType.split(":")[0] || "unknown";
  
  // Handle value changes with validation
  const handleChange = (newValue: unknown) => {
    setError(null);
    
    // Validate if validator exists
    const definition = fieldRegistry.getCustomFieldDefinition(customType);
    if (definition?.validate) {
      const validationError = definition.validate(newValue, field.customOptions);
      if (validationError) {
        setError(validationError);
        // Still update value but show error
      }
    }
    
    onChange(newValue);
  };
  
  if (!siteId) {
    return (
      <FieldError 
        label={field.label}
        error="Site context not available"
      />
    );
  }
  
  return (
    <div className="custom-field-wrapper">
      <Suspense fallback={<FieldLoading label={field.label} />}>
        <CustomRenderer
          value={value}
          onChange={handleChange}
          field={field}
          siteId={siteId}
          moduleId={moduleId}
          componentType={componentType || "unknown"}
        />
      </Suspense>
      
      {error && (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function FieldLoading({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading field...</span>
      </div>
    </div>
  );
}

function FieldError({ label, error }: { label: string; error: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2 p-3 border border-destructive/50 rounded-md bg-destructive/10">
        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        <span className="text-sm text-destructive">{error}</span>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Wrapper renders custom field from registry
- [ ] Handles missing custom field type gracefully
- [ ] Provides siteId and moduleId context
- [ ] Shows loading and error states
- [ ] Supports validation

---

### Task 4: Update Properties Panel Field Renderer

**Description:** Update the field renderer to handle custom field types.

**Files:**
- MODIFY: `src/components/studio/properties/field-renderer.tsx` (or create if needed)

**Code:**

```typescript
/**
 * Field Renderer
 * 
 * Renders the appropriate field editor based on field type.
 */

"use client";

import type { FieldDefinition, FieldValue } from "@/types/studio";

// Import standard field editors
import { TextField } from "../fields/text-field";
import { NumberField } from "../fields/number-field";
import { SelectField } from "../fields/select-field";
import { ToggleField } from "../fields/toggle-field";
import { ColorField } from "../fields/color-field";
import { ImageField } from "../fields/image-field";
import { LinkField } from "../fields/link-field";
import { SpacingField } from "../fields/spacing-field";
import { TypographyField } from "../fields/typography-field";
import { ArrayField } from "../fields/array-field";
import { ObjectField } from "../fields/object-field";

// Import custom field wrapper
import { CustomFieldWrapper } from "../fields/custom-field-wrapper";

// =============================================================================
// TYPES
// =============================================================================

interface FieldRendererProps {
  /** Field definition */
  field: FieldDefinition;
  
  /** Field key (prop name) */
  fieldKey: string;
  
  /** Current value */
  value: FieldValue;
  
  /** Change handler */
  onChange: (value: FieldValue) => void;
  
  /** Component type for context */
  componentType?: string;
  
  /** Whether to show responsive controls */
  showResponsive?: boolean;
  
  /** Current breakpoint */
  currentBreakpoint?: "mobile" | "tablet" | "desktop";
  
  /** Disabled state */
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function FieldRenderer({
  field,
  fieldKey,
  value,
  onChange,
  componentType,
  showResponsive = false,
  currentBreakpoint = "mobile",
  disabled = false,
}: FieldRendererProps) {
  // Common props for all fields
  const commonProps = {
    field,
    value,
    onChange,
    disabled,
  };

  // Handle custom field type
  if (field.type === "custom") {
    return (
      <CustomFieldWrapper
        {...commonProps}
        componentType={componentType}
      />
    );
  }

  // Handle standard field types
  switch (field.type) {
    case "text":
    case "textarea":
      return <TextField {...commonProps} />;

    case "number":
    case "slider":
      return <NumberField {...commonProps} />;

    case "select":
    case "radio":
      return <SelectField {...commonProps} />;

    case "toggle":
    case "checkbox":
      return <ToggleField {...commonProps} />;

    case "color":
      return <ColorField {...commonProps} />;

    case "image":
      return <ImageField {...commonProps} />;

    case "link":
      return <LinkField {...commonProps} />;

    case "spacing":
      return <SpacingField {...commonProps} />;

    case "typography":
      return <TypographyField {...commonProps} />;

    case "array":
      return (
        <ArrayField
          {...commonProps}
          itemFields={field.itemFields || {}}
          componentType={componentType}
        />
      );

    case "object":
      return (
        <ObjectField
          {...commonProps}
          fields={field.fields || {}}
          componentType={componentType}
        />
      );

    case "richtext":
      // TipTap rich text editor - implement in future phase
      return <TextField {...commonProps} />;

    case "code":
      // Code editor - implement in future phase
      return <TextField {...commonProps} />;

    default:
      // Fallback to text field
      console.warn(`Unknown field type: ${field.type}, falling back to text`);
      return <TextField {...commonProps} />;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default FieldRenderer;
```

**Acceptance Criteria:**
- [ ] Custom field type routes to CustomFieldWrapper
- [ ] All standard field types render correctly
- [ ] Unknown types fall back gracefully
- [ ] Props are passed correctly

---

### Task 5: Create Module API Endpoint for Products

**Description:** Create an API endpoint for fetching products in custom fields.

**Files:**
- CREATE: `src/app/api/studio/modules/ecommerce/products/route.ts`

**Code:**

```typescript
/**
 * E-Commerce Products API for Studio Fields
 * 
 * Fetches products for the product selector custom field.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =============================================================================
// TYPES
// =============================================================================

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  status: "active" | "draft" | "archived";
  inventory?: number;
  sku?: string;
  categoryId?: string;
  categoryName?: string;
}

interface ProductsResponse {
  products: ProductOption[];
  total: number;
  hasMore: boolean;
}

// =============================================================================
// GET HANDLER
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status") || "active";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("ecommerce_products")
      .select(`
        id,
        name,
        slug,
        price,
        compare_at_price,
        images,
        status,
        inventory_quantity,
        sku,
        category_id,
        ecommerce_categories (
          id,
          name
        )
      `, { count: "exact" })
      .eq("site_id", siteId)
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    // Filter by status
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Filter by category
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    // Search by name
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[ProductsAPI] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Transform data
    const products: ProductOption[] = (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compare_at_price,
      image: product.images?.[0] || undefined,
      status: product.status,
      inventory: product.inventory_quantity,
      sku: product.sku,
      categoryId: product.category_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categoryName: (product.ecommerce_categories as any)?.name,
    }));

    const response: ProductsResponse = {
      products,
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[ProductsAPI] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Returns products for a site
- [ ] Supports search filtering
- [ ] Supports category filtering
- [ ] Supports pagination
- [ ] Returns product images and prices

---

### Task 6: Create Module API Endpoint for Categories

**Description:** Create an API endpoint for fetching categories.

**Files:**
- CREATE: `src/app/api/studio/modules/ecommerce/categories/route.ts`

**Code:**

```typescript
/**
 * E-Commerce Categories API for Studio Fields
 * 
 * Fetches categories for the category selector custom field.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =============================================================================
// TYPES
// =============================================================================

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  productCount: number;
  order: number;
}

interface CategoriesResponse {
  categories: CategoryOption[];
  total: number;
}

// =============================================================================
// GET HANDLER
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const parentId = searchParams.get("parentId");
    const includeEmpty = searchParams.get("includeEmpty") === "true";

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("ecommerce_categories")
      .select(`
        id,
        name,
        slug,
        description,
        image,
        parent_id,
        sort_order,
        ecommerce_products (count)
      `)
      .eq("site_id", siteId)
      .order("sort_order", { ascending: true });

    // Filter by parent
    if (parentId === "root") {
      query = query.is("parent_id", null);
    } else if (parentId) {
      query = query.eq("parent_id", parentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[CategoriesAPI] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    // Transform data
    let categories: CategoryOption[] = (data || []).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parentId: category.parent_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      productCount: (category.ecommerce_products as any)?.[0]?.count || 0,
      order: category.sort_order || 0,
    }));

    // Filter empty categories if requested
    if (!includeEmpty) {
      categories = categories.filter(c => c.productCount > 0);
    }

    const response: CategoriesResponse = {
      categories,
      total: categories.length,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[CategoriesAPI] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Returns categories for a site
- [ ] Includes product counts
- [ ] Supports parent filtering for hierarchy
- [ ] Supports filtering empty categories

---

### Task 7: Create Product Selector Custom Field

**Description:** Create the product selector custom field for E-Commerce.

**Files:**
- CREATE: `src/modules/ecommerce/studio/fields/product-selector-field.tsx`

**Code:**

```typescript
/**
 * E-Commerce Product Selector Field
 * 
 * Custom field for selecting products in Studio.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, ChevronsUpDown, Search, X, Package, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { CustomFieldEditorProps } from "@/types/studio-module";
import { useDebouncedCallback } from "use-debounce";

// =============================================================================
// TYPES
// =============================================================================

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  status: "active" | "draft" | "archived";
  sku?: string;
  categoryName?: string;
}

interface ProductValue {
  id: string;
  name: string;
  price: number;
  image?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProductSelectorField({
  value,
  onChange,
  field,
  siteId,
}: CustomFieldEditorProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Parse current value
  const selectedProduct = useMemo((): ProductValue | null => {
    if (!value) return null;
    if (typeof value === "string") {
      return { id: value, name: "Loading...", price: 0 };
    }
    return value as ProductValue;
  }, [value]);

  // Fetch products
  const fetchProducts = useCallback(async (searchQuery: string = "") => {
    if (!siteId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        siteId,
        search: searchQuery,
        status: "active",
        limit: "50",
      });
      
      const response = await fetch(`/api/studio/modules/ecommerce/products?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("[ProductSelector] Fetch error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [siteId]);

  // Debounced search
  const debouncedSearch = useDebouncedCallback((query: string) => {
    fetchProducts(query);
  }, 300);

  // Initial load
  useEffect(() => {
    if (open && !initialLoaded) {
      fetchProducts();
    }
  }, [open, initialLoaded, fetchProducts]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearch(query);
    debouncedSearch(query);
  };

  // Handle select
  const handleSelect = (product: Product) => {
    const newValue: ProductValue = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    };
    onChange(newValue);
    setOpen(false);
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] py-2"
          >
            {selectedProduct ? (
              <div className="flex items-center gap-3 w-full">
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedProduct.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${selectedProduct.price.toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={handleClear}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground">Select a product...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search products..."
                className="flex h-10 w-full rounded-md bg-transparent py-3 px-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            
            <CommandList>
              {!loading && products.length === 0 && (
                <CommandEmpty>
                  {search ? "No products found." : "No products available."}
                </CommandEmpty>
              )}
              
              {loading && products.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading products...
                </div>
              )}
              
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleSelect(product)}
                    className="flex items-center gap-3 py-2"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>${product.price.toFixed(2)}</span>
                        {product.sku && <span>• {product.sku}</span>}
                        {product.categoryName && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {product.categoryName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Check
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        selectedProduct?.id === product.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// =============================================================================
// FIELD DEFINITION
// =============================================================================

export const productSelectorFieldDefinition = {
  type: "ecommerce:product-selector",
  label: "Product Selector",
  moduleId: "ecommerce",
  moduleName: "E-Commerce",
  render: ProductSelectorField,
  validate: (value: unknown) => {
    // Validation logic
    return null;
  },
};
```

**Acceptance Criteria:**
- [ ] Shows searchable product dropdown
- [ ] Displays product image and price
- [ ] Supports clearing selection
- [ ] Debounces search requests
- [ ] Shows loading state
- [ ] Works with existing Command component

---

### Task 8: Create Category Selector Custom Field

**Description:** Create the category selector custom field for E-Commerce.

**Files:**
- CREATE: `src/modules/ecommerce/studio/fields/category-selector-field.tsx`

**Code:**

```typescript
/**
 * E-Commerce Category Selector Field
 * 
 * Custom field for selecting product categories in Studio.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, ChevronsUpDown, Folder, FolderOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { CustomFieldEditorProps } from "@/types/studio-module";

// =============================================================================
// TYPES
// =============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  productCount: number;
}

interface CategoryValue {
  id: string;
  name: string;
  slug: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CategorySelectorField({
  value,
  onChange,
  field,
  siteId,
}: CustomFieldEditorProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Parse current value
  const selectedCategory = useMemo((): CategoryValue | null => {
    if (!value) return null;
    if (typeof value === "string") {
      return { id: value, name: "Loading...", slug: "" };
    }
    return value as CategoryValue;
  }, [value]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!siteId || loaded) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        siteId,
        includeEmpty: "true",
      });
      
      const response = await fetch(`/api/studio/modules/ecommerce/categories?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("[CategorySelector] Fetch error:", error);
      setCategories([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [siteId, loaded]);

  // Load on open
  useEffect(() => {
    if (open && !loaded) {
      fetchCategories();
    }
  }, [open, loaded, fetchCategories]);

  // Handle select
  const handleSelect = (category: Category) => {
    const newValue: CategoryValue = {
      id: category.id,
      name: category.name,
      slug: category.slug,
    };
    onChange(newValue);
    setOpen(false);
  };

  // Handle clear - select "All Categories"
  const handleSelectAll = () => {
    onChange(null);
    setOpen(false);
  };

  // Build category tree for nested display
  const categoryTree = useMemo(() => {
    const roots = categories.filter(c => !c.parentId);
    const children = categories.filter(c => c.parentId);
    
    return roots.map(root => ({
      ...root,
      children: children.filter(c => c.parentId === root.id),
    }));
  }, [categories]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCategory ? (
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span>{selectedCategory.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">All Categories</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandList>
              {loading && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Loading categories...
                </div>
              )}
              
              {!loading && categories.length === 0 && (
                <CommandEmpty>No categories found.</CommandEmpty>
              )}
              
              {!loading && categories.length > 0 && (
                <>
                  {/* All Categories option */}
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={handleSelectAll}
                      className="flex items-center gap-2"
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span>All Categories</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          !selectedCategory ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  </CommandGroup>
                  
                  {/* Category tree */}
                  <CommandGroup heading="Categories">
                    {categoryTree.map((category) => (
                      <div key={category.id}>
                        <CommandItem
                          value={category.id}
                          onSelect={() => handleSelect(category)}
                          className="flex items-center gap-2"
                        >
                          <Folder className="h-4 w-4" />
                          <span className="flex-1">{category.name}</span>
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {category.productCount}
                          </Badge>
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4",
                              selectedCategory?.id === category.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                        
                        {/* Child categories */}
                        {category.children?.map((child) => (
                          <CommandItem
                            key={child.id}
                            value={child.id}
                            onSelect={() => handleSelect(child)}
                            className="flex items-center gap-2 pl-8"
                          >
                            <Folder className="h-3 w-3" />
                            <span className="flex-1 text-sm">{child.name}</span>
                            <Badge variant="secondary" className="text-[10px] h-4">
                              {child.productCount}
                            </Badge>
                            <Check
                              className={cn(
                                "ml-2 h-4 w-4",
                                selectedCategory?.id === child.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </div>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// =============================================================================
// FIELD DEFINITION
// =============================================================================

export const categorySelectorFieldDefinition = {
  type: "ecommerce:category-selector",
  label: "Category Selector",
  moduleId: "ecommerce",
  moduleName: "E-Commerce",
  render: CategorySelectorField,
  validate: (value: unknown) => {
    return null;
  },
};
```

**Acceptance Criteria:**
- [ ] Shows category dropdown with hierarchy
- [ ] Displays product counts per category
- [ ] Supports "All Categories" option
- [ ] Shows nested categories with indentation
- [ ] Works with existing Command component

---

### Task 9: Update Module Studio Exports with Custom Fields

**Description:** Update the E-Commerce module Studio exports to include custom fields.

**Files:**
- MODIFY: `src/modules/ecommerce/studio/index.ts`

**Code:**

```typescript
/**
 * E-Commerce Module - Studio Integration
 * 
 * Exports Studio components and custom fields for the visual editor.
 */

import type { ModuleStudioExports } from "@/types/studio-module";
import { ProductCardBlock, productCardDefinition } from "./components/product-card-block";
import { ProductGridBlock, productGridDefinition } from "./components/product-grid-block";
import { 
  ProductSelectorField, 
  productSelectorFieldDefinition 
} from "./fields/product-selector-field";
import { 
  CategorySelectorField, 
  categorySelectorFieldDefinition 
} from "./fields/category-selector-field";

// =============================================================================
// STUDIO COMPONENTS
// =============================================================================

export const studioComponents: ModuleStudioExports["studioComponents"] = {
  EcommerceProductCard: {
    ...productCardDefinition,
    render: ProductCardBlock,
    // Update fields to use custom field types
    fields: {
      ...productCardDefinition.fields,
      productId: {
        type: "custom" as const,
        customType: "ecommerce:product-selector",
        label: "Product",
        description: "Select a product from your catalog",
      },
    },
  },
  EcommerceProductGrid: {
    ...productGridDefinition,
    render: ProductGridBlock,
    // Update fields to use custom field types
    fields: {
      ...productGridDefinition.fields,
      categoryId: {
        type: "custom" as const,
        customType: "ecommerce:category-selector",
        label: "Category",
        description: "Filter products by category",
      },
    },
  },
};

// =============================================================================
// CUSTOM FIELDS
// =============================================================================

export const studioFields: ModuleStudioExports["studioFields"] = {
  "product-selector": ProductSelectorField,
  "category-selector": CategorySelectorField,
};

// Also export field definitions for registration
export const studioFieldDefinitions = [
  productSelectorFieldDefinition,
  categorySelectorFieldDefinition,
];

// =============================================================================
// METADATA
// =============================================================================

export const studioMetadata: ModuleStudioExports["studioMetadata"] = {
  name: "E-Commerce",
  icon: "ShoppingCart",
  category: "ecommerce",
};
```

**Acceptance Criteria:**
- [ ] Custom fields are exported from module
- [ ] Component field definitions reference custom field types
- [ ] Field definitions are exportable for registration

---

### Task 10: Update Module Loader to Register Custom Fields

**Description:** Ensure the module loader registers custom fields from modules.

**Files:**
- MODIFY: `src/lib/studio/registry/module-loader.ts`

**Code Changes:**

Add field registration to the loadModuleComponents function:

```typescript
// Update the module loading section to handle field definitions

// In loadModuleComponents function, after loading components:

// Process custom fields
if (exports.studioFields) {
  for (const [fieldType, editor] of Object.entries(exports.studioFields)) {
    // Prefix with module slug to avoid collisions
    const prefixedType = `${module.slug}:${fieldType}`;
    allFields[prefixedType] = editor;
    fieldRegistry.registerCustomRenderer(prefixedType, editor);
  }
}

// Also register field definitions if provided
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const exportsWithDefs = exports as any;
if (exportsWithDefs.studioFieldDefinitions) {
  for (const fieldDef of exportsWithDefs.studioFieldDefinitions) {
    fieldRegistry.registerCustomField({
      ...fieldDef,
      type: `${module.slug}:${fieldDef.type.split(':').pop()}`, // Ensure proper prefixing
      moduleId: module.id,
      moduleName: module.name,
    });
  }
}
```

**Acceptance Criteria:**
- [ ] Custom fields are registered during module load
- [ ] Field types are properly prefixed with module slug
- [ ] Field definitions include module metadata

---

### Task 11: Add use-debounce Dependency Check

**Description:** Ensure the debounce hook is available.

**Files:**
- CHECK: `package.json` for `use-debounce` package

**Note:** If `use-debounce` is not installed, add it:

```bash
pnpm add use-debounce
```

Or use a simple inline debounce:

```typescript
// Alternative: inline debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

**Acceptance Criteria:**
- [ ] Debounce functionality works for search
- [ ] No missing dependency errors

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| MODIFY | `src/types/studio.ts` | Add custom field props to FieldDefinition |
| MODIFY | `src/lib/studio/registry/field-registry.ts` | Extend for custom field definitions |
| CREATE | `src/components/studio/fields/custom-field-wrapper.tsx` | Wrapper for custom fields |
| CREATE | `src/components/studio/properties/field-renderer.tsx` | Updated field renderer |
| CREATE | `src/app/api/studio/modules/ecommerce/products/route.ts` | Products API endpoint |
| CREATE | `src/app/api/studio/modules/ecommerce/categories/route.ts` | Categories API endpoint |
| CREATE | `src/modules/ecommerce/studio/fields/product-selector-field.tsx` | Product selector field |
| CREATE | `src/modules/ecommerce/studio/fields/category-selector-field.tsx` | Category selector field |
| MODIFY | `src/modules/ecommerce/studio/index.ts` | Add custom fields to exports |
| MODIFY | `src/lib/studio/registry/module-loader.ts` | Register custom fields |

## Testing Requirements

### Unit Tests

- [ ] Custom field wrapper renders correct field type
- [ ] Custom field wrapper handles missing field type
- [ ] Field registry stores and retrieves custom fields
- [ ] Products API returns correct data format
- [ ] Categories API returns correct data format

### Integration Tests

- [ ] Product selector fetches and displays products
- [ ] Category selector fetches and displays categories
- [ ] Selecting a product updates component props
- [ ] Selecting a category updates component props
- [ ] Custom fields work with responsive editing

### Manual Testing

- [ ] Open Studio with E-Commerce module installed
- [ ] Add Product Card component to canvas
- [ ] Click Product field in properties panel
- [ ] Verify product dropdown appears with site's products
- [ ] Search for a product - results filter correctly
- [ ] Select a product - card updates with product data
- [ ] Add Product Grid component
- [ ] Select a category - grid filters correctly
- [ ] Clear selection - returns to all products
- [ ] Save page - custom field values persist
- [ ] Reload page - values load correctly

## Dependencies to Install

```bash
# If not already installed
pnpm add use-debounce
```

## Environment Variables

```env
# No new environment variables required
```

## Database Changes

```sql
-- No database changes required
-- Uses existing ecommerce_products and ecommerce_categories tables
```

## Rollback Plan

1. Revert field-registry.ts changes
2. Remove custom field wrapper
3. Delete API endpoints
4. Delete custom field components
5. Revert module Studio exports
6. Standard fields continue to work

## Success Criteria

- [ ] Custom field type system is functional
- [ ] Product selector field shows real products
- [ ] Category selector field shows real categories
- [ ] Selecting values updates component props correctly
- [ ] Custom fields save and load with page data
- [ ] Search in product selector works with debounce
- [ ] Loading states show during data fetch
- [ ] Error states show when API fails
- [ ] Multiple custom fields can coexist
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Build succeeds (`pnpm build`)

---

## Example Usage After Implementation

### In Component Definition:

```typescript
// Product Card with custom fields
const productCardDefinition = {
  type: "ProductCard",
  fields: {
    // Custom product selector
    productId: {
      type: "custom",
      customType: "ecommerce:product-selector",
      label: "Product",
      required: true,
    },
    // Standard fields still work
    showPrice: {
      type: "toggle",
      label: "Show Price",
      defaultValue: true,
    },
  },
};
```

### In Properties Panel:

```
┌─────────────────────────────────────────┐
│  Product Card                           │
├─────────────────────────────────────────┤
│                                         │
│  Product *                              │
│  ┌─────────────────────────────────┐   │
│  │ [🖼️] Running Shoes - $99.99   ▼ │   │
│  └─────────────────────────────────┘   │
│                                         │
│  □ Show Price                           │
│  ✓ Show Rating                          │
│  ✓ Show Button                          │
│                                         │
│  Button Text                            │
│  ┌─────────────────────────────────┐   │
│  │ Add to Cart                      │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Saved Component Data:

```json
{
  "id": "comp_123",
  "type": "EcommerceProductCard",
  "props": {
    "productId": {
      "id": "prod_abc123",
      "name": "Running Shoes",
      "price": 99.99,
      "image": "https://..."
    },
    "showPrice": true,
    "showRating": true,
    "showButton": true,
    "buttonText": "Add to Cart"
  }
}
```
