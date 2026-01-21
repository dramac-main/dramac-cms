// AI Module Builder Prompt Templates
// Phase EM-23: AI-powered module generation

export const SYSTEM_PROMPT = `You are an expert module architect for the DRAMAC platform.
Your job is to help users design and build modules (business applications) that run on the platform.

DRAMAC modules can be:
- Widgets: Simple embeddable components (chat buttons, analytics badges)
- Apps: Full applications with databases and multiple pages (CRM, booking systems)
- Integrations: Connectors to external services (Stripe, QuickBooks)
- Systems: Complete enterprise solutions (hotel management, POS systems)

When designing a module, consider:
1. What data entities are needed (with fields and relationships)
2. What pages/views the user will interact with
3. What API endpoints are needed
4. What components should be generated
5. What permissions and roles are needed

Always structure your response as valid JSON when generating specifications.
Be helpful, ask clarifying questions when needed, and guide users through the module design process.`;

export const SPEC_GENERATION_PROMPT = `Based on the conversation, generate a complete module specification.

The specification should include:
{
  "name": "Module Name",
  "slug": "module-name",
  "description": "What the module does",
  "type": "widget" | "app" | "integration" | "system",
  "tier": "free" | "starter" | "pro" | "enterprise",
  
  "features": [
    "Feature 1 description",
    "Feature 2 description"
  ],
  
  "entities": [
    {
      "name": "entity_name",
      "displayName": "Entity Name",
      "description": "What this entity represents",
      "fields": [
        {
          "name": "field_name",
          "type": "text" | "integer" | "decimal" | "boolean" | "timestamp" | "uuid" | "jsonb",
          "required": true | false,
          "unique": true | false,
          "indexed": true | false,
          "default": "default value or null",
          "references": { "entity": "other_entity", "field": "id" } | null
        }
      ]
    }
  ],
  
  "pages": [
    {
      "name": "page-slug",
      "title": "Page Title",
      "path": "/path",
      "description": "What this page shows",
      "components": ["component1", "component2"]
    }
  ],
  
  "api_endpoints": [
    {
      "path": "/api/module/[moduleId]/resource",
      "method": "GET" | "POST" | "PUT" | "DELETE",
      "description": "What this endpoint does",
      "auth": "public" | "user" | "admin"
    }
  ],
  
  "components": [
    {
      "name": "ComponentName",
      "type": "list" | "form" | "detail" | "dashboard" | "widget",
      "entity": "entity_name or null",
      "description": "What this component renders"
    }
  ],
  
  "permissions": {
    "roles": ["admin", "user", "viewer"],
    "default_role": "user"
  },
  
  "settings": [
    {
      "key": "setting_key",
      "type": "string" | "boolean" | "number",
      "label": "Setting Label",
      "default": "default value"
    }
  ]
}

Return ONLY the JSON specification, no additional text.`;

export const CODE_GENERATION_PROMPTS = {
  schema: `Generate PostgreSQL migration SQL for the following entities:
{{entities}}

Requirements:
- Use snake_case for table and column names
- Add UUID primary key 'id' to each table
- Add site_id foreign key for multi-tenancy
- Add created_at and updated_at timestamps
- Add proper indexes on foreign keys and commonly queried fields
- Enable RLS with policies for site_id isolation
- Use the naming pattern: mod_{{prefix}}_tablename

Return ONLY the SQL, no explanations.`,

  service: `Generate a TypeScript service for the following entity:
{{entity}}

The service should include:
- Type definitions for the entity
- CRUD operations (create, getById, getAll, update, delete)
- Use Supabase client for database operations
- Add pagination for list operations
- Add filtering and search capabilities
- Proper error handling and TypeScript types

Return ONLY the TypeScript code, no explanations.`,

  component: `Generate a React component for:
{{component}}

Requirements:
- Use TypeScript with proper types
- Use components from @/components/ui (Button, Card, Table, etc.)
- Handle loading and error states
- Use React Query for data fetching
- Support the entity: {{entity}}
- Make it responsive and accessible

Return ONLY the TypeScript React code, no explanations.`,

  api: `Generate a Next.js API route for:
{{endpoint}}

Requirements:
- Use Next.js 15 App Router format
- Proper request validation
- Error handling with appropriate HTTP status codes
- Use Supabase for database operations
- Verify authentication and authorization

Return ONLY the TypeScript code, no explanations.`,

  page: `Generate a Next.js page component for:
{{page}}

Requirements:
- Use Next.js 15 App Router format with 'use client' directive
- Import and use the following components: {{components}}
- Proper layout with responsive design
- Handle loading states with Suspense
- Use Tailwind CSS for styling

Return ONLY the TypeScript React code, no explanations.`,

  manifest: `Generate a module.json manifest for the following module:
{{module}}

The manifest should include:
- name, slug, version, description
- type and tier
- entry point
- icon (Lucide icon name)
- category
- permissions and settings
- pages with their paths
- database and api flags

Return ONLY the JSON, no explanations.`
};

// Refinement prompts for specific improvements
export const REFINEMENT_PROMPTS = {
  addEntity: `Based on the current specification:
{{spec}}

Add a new entity for: {{description}}

The entity should have appropriate fields, relationships to existing entities if relevant, 
and fit well with the existing module design.

Return the UPDATED full specification JSON.`,

  modifyEntity: `Based on the current specification:
{{spec}}

Modify the entity "{{entityName}}" according to: {{changes}}

Return the UPDATED full specification JSON.`,

  addPage: `Based on the current specification:
{{spec}}

Add a new page for: {{description}}

The page should include appropriate components that reference existing entities.

Return the UPDATED full specification JSON.`,

  addFeature: `Based on the current specification:
{{spec}}

Add the following feature: {{description}}

This may require adding new entities, components, pages, or API endpoints.

Return the UPDATED full specification JSON.`,

  optimize: `Based on the current specification:
{{spec}}

Optimize this module design by:
1. Adding any missing indexes for commonly queried fields
2. Ensuring proper relationships between entities
3. Adding any missing CRUD pages or components
4. Ensuring all API endpoints have proper authentication

Return the UPDATED full specification JSON.`
};

// Example modules for reference
export const EXAMPLE_MODULES = {
  inventoryTracker: {
    name: "Inventory Tracker",
    slug: "inventory-tracker",
    description: "Track products, stock levels, and receive low-stock alerts",
    type: "app",
    tier: "starter",
    features: [
      "Product management with categories",
      "Stock level tracking",
      "Low-stock alerts",
      "Stock history"
    ],
    entities: [
      {
        name: "category",
        displayName: "Category",
        description: "Product categories for organization",
        fields: [
          { name: "name", type: "text", required: true, unique: true, indexed: true, default: null, references: null },
          { name: "description", type: "text", required: false, unique: false, indexed: false, default: null, references: null },
          { name: "parent_id", type: "uuid", required: false, unique: false, indexed: true, default: null, references: { entity: "category", field: "id" } }
        ]
      },
      {
        name: "product",
        displayName: "Product",
        description: "Products in inventory",
        fields: [
          { name: "name", type: "text", required: true, unique: false, indexed: true, default: null, references: null },
          { name: "sku", type: "text", required: true, unique: true, indexed: true, default: null, references: null },
          { name: "description", type: "text", required: false, unique: false, indexed: false, default: null, references: null },
          { name: "category_id", type: "uuid", required: false, unique: false, indexed: true, default: null, references: { entity: "category", field: "id" } },
          { name: "quantity", type: "integer", required: true, unique: false, indexed: true, default: "0", references: null },
          { name: "min_quantity", type: "integer", required: true, unique: false, indexed: false, default: "10", references: null },
          { name: "unit_price", type: "decimal", required: false, unique: false, indexed: false, default: null, references: null }
        ]
      }
    ],
    pages: [
      { name: "dashboard", title: "Dashboard", path: "/", description: "Overview of inventory status", components: ["InventoryDashboard"] },
      { name: "products", title: "Products", path: "/products", description: "List and manage products", components: ["ProductList", "ProductForm"] },
      { name: "categories", title: "Categories", path: "/categories", description: "Manage product categories", components: ["CategoryList", "CategoryForm"] }
    ],
    api_endpoints: [
      { path: "/api/module/[moduleId]/products", method: "GET", description: "List all products", auth: "user" },
      { path: "/api/module/[moduleId]/products", method: "POST", description: "Create a product", auth: "admin" },
      { path: "/api/module/[moduleId]/products/[id]", method: "GET", description: "Get product details", auth: "user" },
      { path: "/api/module/[moduleId]/products/[id]", method: "PUT", description: "Update a product", auth: "admin" },
      { path: "/api/module/[moduleId]/products/[id]", method: "DELETE", description: "Delete a product", auth: "admin" }
    ],
    components: [
      { name: "InventoryDashboard", type: "dashboard", entity: null, description: "Shows inventory overview with low-stock alerts" },
      { name: "ProductList", type: "list", entity: "product", description: "Table of all products with search and filters" },
      { name: "ProductForm", type: "form", entity: "product", description: "Form to create/edit products" },
      { name: "CategoryList", type: "list", entity: "category", description: "List of categories with hierarchy" },
      { name: "CategoryForm", type: "form", entity: "category", description: "Form to create/edit categories" }
    ],
    permissions: {
      roles: ["admin", "manager", "viewer"],
      default_role: "viewer"
    },
    settings: [
      { key: "low_stock_threshold", type: "number", label: "Default Low Stock Threshold", default: 10 },
      { key: "enable_alerts", type: "boolean", label: "Enable Low Stock Alerts", default: true }
    ]
  },

  feedbackWidget: {
    name: "Feedback Widget",
    slug: "feedback-widget",
    description: "Embeddable widget for collecting customer feedback",
    type: "widget",
    tier: "free",
    features: [
      "Floating feedback button",
      "Simple feedback form",
      "Rating system",
      "Feedback dashboard"
    ],
    entities: [
      {
        name: "feedback",
        displayName: "Feedback",
        description: "Customer feedback submissions",
        fields: [
          { name: "rating", type: "integer", required: true, unique: false, indexed: true, default: null, references: null },
          { name: "message", type: "text", required: false, unique: false, indexed: false, default: null, references: null },
          { name: "email", type: "text", required: false, unique: false, indexed: true, default: null, references: null },
          { name: "page_url", type: "text", required: false, unique: false, indexed: false, default: null, references: null },
          { name: "status", type: "text", required: true, unique: false, indexed: true, default: "'new'", references: null }
        ]
      }
    ],
    pages: [
      { name: "dashboard", title: "Feedback Dashboard", path: "/", description: "View and manage feedback", components: ["FeedbackDashboard", "FeedbackList"] }
    ],
    api_endpoints: [
      { path: "/api/module/[moduleId]/feedback", method: "GET", description: "List all feedback", auth: "user" },
      { path: "/api/module/[moduleId]/feedback", method: "POST", description: "Submit feedback", auth: "public" },
      { path: "/api/module/[moduleId]/feedback/[id]", method: "PUT", description: "Update feedback status", auth: "admin" }
    ],
    components: [
      { name: "FeedbackWidget", type: "widget", entity: null, description: "Embeddable feedback button and form" },
      { name: "FeedbackDashboard", type: "dashboard", entity: "feedback", description: "Overview of feedback stats" },
      { name: "FeedbackList", type: "list", entity: "feedback", description: "List of all feedback with filters" }
    ],
    permissions: {
      roles: ["admin", "viewer"],
      default_role: "viewer"
    },
    settings: [
      { key: "button_color", type: "string", label: "Widget Button Color", default: "#6366f1" },
      { key: "button_position", type: "string", label: "Button Position", default: "bottom-right" },
      { key: "require_email", type: "boolean", label: "Require Email", default: false }
    ]
  }
};

// Helper function to build prompts with replacements
export function buildPrompt(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// Validation helpers
export function validateSpec(spec: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!spec || typeof spec !== 'object') {
    return { valid: false, errors: ['Specification must be an object'] };
  }

  const s = spec as Record<string, unknown>;

  // Required fields
  if (!s.name || typeof s.name !== 'string') {
    errors.push('Module name is required');
  }
  if (!s.slug || typeof s.slug !== 'string') {
    errors.push('Module slug is required');
  }
  if (!s.type || !['widget', 'app', 'integration', 'system'].includes(s.type as string)) {
    errors.push('Valid module type is required (widget, app, integration, system)');
  }

  // Entities validation
  if (s.entities && Array.isArray(s.entities)) {
    for (const entity of s.entities as Array<Record<string, unknown>>) {
      if (!entity.name) {
        errors.push('Each entity must have a name');
      }
      if (!entity.fields || !Array.isArray(entity.fields)) {
        errors.push(`Entity "${entity.name}" must have a fields array`);
      }
    }
  }

  // Pages validation
  if (s.pages && Array.isArray(s.pages)) {
    for (const page of s.pages as Array<Record<string, unknown>>) {
      if (!page.name || !page.path) {
        errors.push('Each page must have a name and path');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
