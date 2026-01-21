# Phase EM-22: Module Templates Library

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 8-10 hours
> **Prerequisites**: EM-01, EM-20, EM-21
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create a **comprehensive library of starter templates** for common module types:
1. Pre-built database schemas
2. Ready-to-use UI components
3. Common business logic patterns
4. Example API routes
5. Best practices built-in

---

## 🏗️ Template Categories

```
┌─────────────────────────────────────────────────────────────┐
│                   TEMPLATE LIBRARY                          │
├──────────────┬──────────────┬───────────────────────────────┤
│   BASIC      │   BUSINESS   │      INDUSTRY                 │
├──────────────┼──────────────┼───────────────────────────────┤
│ • Blank      │ • CRM        │ • Restaurant                  │
│ • Data List  │ • Booking    │ • Real Estate                 │
│ • Form       │ • E-commerce │ • Healthcare                  │
│ • Dashboard  │ • Inventory  │ • Education                   │
│ • CRUD       │ • Invoicing  │ • Fitness                     │
│              │ • Helpdesk   │ • Legal                       │
└──────────────┴──────────────┴───────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Template Registry (1 hour)

```typescript
// src/lib/modules/templates/template-registry.ts

export interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'business' | 'industry';
  tags: string[];
  
  // Preview
  thumbnail: string;
  screenshots: string[];
  
  // Contents
  files: TemplateFile[];
  dependencies: string[];
  
  // Customization
  variables: TemplateVariable[];
  
  // Metadata
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: string;
  features: string[];
}

export interface TemplateFile {
  path: string;
  content: string;
  type: 'static' | 'template';
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'number';
  default?: any;
  options?: { label: string; value: any }[];
  required?: boolean;
  description?: string;
}

export const MODULE_TEMPLATES: ModuleTemplate[] = [
  // ============= BASIC TEMPLATES =============
  {
    id: 'blank',
    name: 'Blank Module',
    description: 'Start from scratch with minimal setup',
    category: 'basic',
    tags: ['starter', 'minimal'],
    thumbnail: '/templates/blank.png',
    screenshots: [],
    complexity: 'beginner',
    estimatedSetupTime: '5 minutes',
    features: ['Basic config', 'Empty dashboard'],
    dependencies: ['@dramac/sdk'],
    variables: [
      { name: 'moduleName', label: 'Module Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'text' }
    ],
    files: [] // Defined in templates/blank/
  },
  
  {
    id: 'data-list',
    name: 'Data List',
    description: 'CRUD interface for managing a list of items',
    category: 'basic',
    tags: ['crud', 'list', 'table'],
    thumbnail: '/templates/data-list.png',
    screenshots: ['/templates/data-list-1.png', '/templates/data-list-2.png'],
    complexity: 'beginner',
    estimatedSetupTime: '10 minutes',
    features: ['Data table', 'Search', 'Pagination', 'Add/Edit/Delete'],
    dependencies: ['@dramac/sdk', '@tanstack/react-table'],
    variables: [
      { name: 'moduleName', label: 'Module Name', type: 'text', required: true },
      { name: 'itemName', label: 'Item Name (singular)', type: 'text', required: true, default: 'item' },
      { name: 'itemNamePlural', label: 'Item Name (plural)', type: 'text', required: true, default: 'items' },
      { 
        name: 'fields', 
        label: 'Custom Fields', 
        type: 'text', 
        description: 'Comma-separated field names',
        default: 'name,description,status'
      }
    ],
    files: []
  },
  
  {
    id: 'dashboard',
    name: 'Analytics Dashboard',
    description: 'Charts and metrics display',
    category: 'basic',
    tags: ['analytics', 'charts', 'metrics'],
    thumbnail: '/templates/dashboard.png',
    screenshots: [],
    complexity: 'intermediate',
    estimatedSetupTime: '15 minutes',
    features: ['Charts', 'KPI cards', 'Date filters', 'Export'],
    dependencies: ['@dramac/sdk', 'recharts', 'date-fns'],
    variables: [
      { name: 'moduleName', label: 'Module Name', type: 'text', required: true },
      { 
        name: 'chartTypes', 
        label: 'Chart Types', 
        type: 'select', 
        options: [
          { label: 'Line Charts', value: 'line' },
          { label: 'Bar Charts', value: 'bar' },
          { label: 'Pie Charts', value: 'pie' },
          { label: 'All', value: 'all' }
        ],
        default: 'all'
      }
    ],
    files: []
  },
  
  // ============= BUSINESS TEMPLATES =============
  {
    id: 'crm',
    name: 'CRM System',
    description: 'Full customer relationship management',
    category: 'business',
    tags: ['crm', 'contacts', 'deals', 'sales'],
    thumbnail: '/templates/crm.png',
    screenshots: [],
    complexity: 'advanced',
    estimatedSetupTime: '30 minutes',
    features: [
      'Contact management',
      'Company management',
      'Deal pipeline',
      'Activity tracking',
      'Email integration',
      'Reporting'
    ],
    dependencies: ['@dramac/sdk', 'recharts', '@tanstack/react-table', 'date-fns'],
    variables: [
      { name: 'moduleName', label: 'Module Name', type: 'text', required: true, default: 'CRM' },
      { name: 'enableDeals', label: 'Enable Deals/Pipeline', type: 'boolean', default: true },
      { name: 'enableCompanies', label: 'Enable Companies', type: 'boolean', default: true },
      { name: 'enableActivities', label: 'Enable Activities', type: 'boolean', default: true }
    ],
    files: []
  },
  
  {
    id: 'booking',
    name: 'Booking System',
    description: 'Appointment scheduling and calendar',
    category: 'business',
    tags: ['booking', 'scheduling', 'calendar', 'appointments'],
    thumbnail: '/templates/booking.png',
    screenshots: [],
    complexity: 'advanced',
    estimatedSetupTime: '25 minutes',
    features: [
      'Service management',
      'Staff scheduling',
      'Calendar view',
      'Online booking widget',
      'Reminders',
      'Payment integration'
    ],
    dependencies: ['@dramac/sdk', 'date-fns', '@fullcalendar/react'],
    variables: [
      { name: 'moduleName', label: 'Module Name', type: 'text', required: true, default: 'Booking' },
      { name: 'enablePayments', label: 'Enable Payments', type: 'boolean', default: false },
      { name: 'enableStaff', label: 'Multi-staff support', type: 'boolean', default: true }
    ],
    files: []
  },
  
  {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Track products and stock levels',
    category: 'business',
    tags: ['inventory', 'stock', 'products', 'warehouse'],
    thumbnail: '/templates/inventory.png',
    screenshots: [],
    complexity: 'intermediate',
    estimatedSetupTime: '20 minutes',
    features: [
      'Product catalog',
      'Stock tracking',
      'Low stock alerts',
      'Barcode support',
      'Multiple locations',
      'Stock adjustments'
    ],
    dependencies: ['@dramac/sdk', '@tanstack/react-table'],
    variables: [
      { name: 'moduleName', label: 'Module Name', type: 'text', required: true, default: 'Inventory' },
      { name: 'enableLocations', label: 'Multiple Locations', type: 'boolean', default: false },
      { name: 'enableBarcodes', label: 'Barcode Support', type: 'boolean', default: true }
    ],
    files: []
  },
  
  {
    id: 'helpdesk',
    name: 'Helpdesk / Ticketing',
    description: 'Support ticket management system',
    category: 'business',
    tags: ['helpdesk', 'tickets', 'support', 'customer service'],
    thumbnail: '/templates/helpdesk.png',
    screenshots: [],
    complexity: 'intermediate',
    estimatedSetupTime: '20 minutes',
    features: [
      'Ticket management',
      'Priority levels',
      'Assignment',
      'SLA tracking',
      'Knowledge base',
      'Canned responses'
    ],
    dependencies: ['@dramac/sdk', '@tanstack/react-table'],
    variables: [
      { name: 'moduleName', label: 'Module Name', type: 'text', required: true, default: 'Helpdesk' },
      { name: 'enableSLA', label: 'Enable SLA Tracking', type: 'boolean', default: true },
      { name: 'enableKnowledgeBase', label: 'Knowledge Base', type: 'boolean', default: false }
    ],
    files: []
  },
  
  // ============= INDUSTRY TEMPLATES =============
  {
    id: 'restaurant',
    name: 'Restaurant Management',
    description: 'Menu, orders, and reservations',
    category: 'industry',
    tags: ['restaurant', 'food', 'menu', 'orders', 'reservations'],
    thumbnail: '/templates/restaurant.png',
    screenshots: [],
    complexity: 'advanced',
    estimatedSetupTime: '30 minutes',
    features: [
      'Menu management',
      'Table reservations',
      'Order taking',
      'Kitchen display',
      'Bill splitting',
      'Reporting'
    ],
    dependencies: ['@dramac/sdk', 'date-fns'],
    variables: [
      { name: 'moduleName', label: 'Module Name', type: 'text', required: true, default: 'Restaurant' },
      { name: 'enableOnlineOrders', label: 'Online Orders', type: 'boolean', default: true },
      { name: 'enableReservations', label: 'Reservations', type: 'boolean', default: true }
    ],
    files: []
  },
  
  {
    id: 'real-estate',
    name: 'Real Estate Listings',
    description: 'Property listings and management',
    category: 'industry',
    tags: ['real estate', 'property', 'listings', 'agents'],
    thumbnail: '/templates/real-estate.png',
    screenshots: [],
    complexity: 'advanced',
    estimatedSetupTime: '30 minutes',
    features: [
      'Property listings',
      'Agent management',
      'Lead capture',
      'Property search',
      'Virtual tours',
      'Comparison tool'
    ],
    dependencies: ['@dramac/sdk', '@tanstack/react-table'],
    variables: [
      { name: 'moduleName', label: 'Module Name', type: 'text', required: true, default: 'Properties' },
      { name: 'propertyTypes', label: 'Property Types', type: 'text', default: 'house,apartment,condo,land' }
    ],
    files: []
  },
  
  {
    id: 'fitness',
    name: 'Fitness Studio',
    description: 'Classes, memberships, and trainers',
    category: 'industry',
    tags: ['fitness', 'gym', 'classes', 'memberships', 'trainers'],
    thumbnail: '/templates/fitness.png',
    screenshots: [],
    complexity: 'advanced',
    estimatedSetupTime: '25 minutes',
    features: [
      'Class scheduling',
      'Membership management',
      'Trainer profiles',
      'Check-in system',
      'Progress tracking',
      'Payment integration'
    ],
    dependencies: ['@dramac/sdk', 'date-fns', '@fullcalendar/react'],
    variables: [
      { name: 'moduleName', label: 'Module Name', type: 'text', required: true, default: 'Fitness' },
      { name: 'enableMemberships', label: 'Memberships', type: 'boolean', default: true },
      { name: 'enableTrainers', label: 'Personal Trainers', type: 'boolean', default: true }
    ],
    files: []
  }
];

export function getTemplateById(id: string): ModuleTemplate | undefined {
  return MODULE_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): ModuleTemplate[] {
  return MODULE_TEMPLATES.filter(t => t.category === category);
}

export function searchTemplates(query: string): ModuleTemplate[] {
  const lowerQuery = query.toLowerCase();
  return MODULE_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
```

---

### Task 2: Data List Template Files (2 hours)

```typescript
// templates/data-list/dramac.config.ts.hbs

import { defineModule } from '@dramac/sdk';

export default defineModule({
  id: '{{moduleId}}',
  name: '{{moduleName}}',
  version: '1.0.0',
  description: 'Manage your {{itemNamePlural}}',
  icon: 'List',
  category: 'utility',
  type: 'app',

  entry: {
    dashboard: './src/Dashboard.tsx',
    settings: './src/Settings.tsx',
  },

  database: {
    tables: [
      {
        name: '{{itemNamePlural}}',
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true },
          { name: 'site_id', type: 'uuid', nullable: false },
          { name: 'agency_id', type: 'uuid', nullable: false },
          {{#each fieldNames}}
          { name: '{{this}}', type: 'text' },
          {{/each}}
          { name: 'created_by', type: 'uuid' },
          { name: 'created_at', type: 'timestamp', default: 'NOW()' },
          { name: 'updated_at', type: 'timestamp' }
        ],
        rls: [
          {
            name: 'site_isolation',
            operation: 'ALL',
            using: "site_id = current_setting('app.site_id')::uuid"
          }
        ]
      }
    ]
  },

  permissions: [
    { key: 'view', name: 'View {{itemNamePlural}}', category: '{{itemName}}' },
    { key: 'create', name: 'Create {{itemNamePlural}}', category: '{{itemName}}' },
    { key: 'edit', name: 'Edit {{itemNamePlural}}', category: '{{itemName}}' },
    { key: 'delete', name: 'Delete {{itemNamePlural}}', category: '{{itemName}}' }
  ],

  roles: [
    { slug: 'admin', name: 'Admin', permissions: ['*'], hierarchyLevel: 100 },
    { slug: 'editor', name: 'Editor', permissions: ['view', 'create', 'edit'], hierarchyLevel: 50 },
    { slug: 'viewer', name: 'Viewer', permissions: ['view'], hierarchyLevel: 10, isDefault: true }
  ]
});
```

```tsx
// templates/data-list/src/Dashboard.tsx.hbs

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  useToast
} from '@dramac/sdk/ui';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { PermissionGuard, useModuleAuth } from '@dramac/sdk/auth';

interface {{itemNamePascal}} {
  id: string;
  {{#each fieldNames}}
  {{this}}: string;
  {{/each}}
  created_at: string;
}

export function Dashboard() {
  const [items, setItems] = useState<{{itemNamePascal}}[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<{{itemNamePascal}} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { hasPermission } = useModuleAuth();
  
  useEffect(() => {
    loadItems();
  }, []);
  
  async function loadItems() {
    try {
      const response = await fetch('/api/modules/{{moduleId}}/{{itemNamePlural}}');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      toast({ title: 'Error loading {{itemNamePlural}}', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }
  
  async function handleSave(formData: Partial<{{itemNamePascal}}>) {
    try {
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem 
        ? `/api/modules/{{moduleId}}/{{itemNamePlural}}/${editItem.id}`
        : '/api/modules/{{moduleId}}/{{itemNamePlural}}';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Save failed');
      
      toast({ title: `{{itemName}} ${editItem ? 'updated' : 'created'}` });
      setIsDialogOpen(false);
      setEditItem(null);
      loadItems();
    } catch (error) {
      toast({ title: 'Error saving {{itemName}}', variant: 'destructive' });
    }
  }
  
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this {{itemName}}?')) return;
    
    try {
      await fetch(`/api/modules/{{moduleId}}/{{itemNamePlural}}/${id}`, {
        method: 'DELETE'
      });
      toast({ title: '{{itemName}} deleted' });
      loadItems();
    } catch (error) {
      toast({ title: 'Error deleting {{itemName}}', variant: 'destructive' });
    }
  }
  
  const filteredItems = items.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{{moduleName}}</h1>
        
        <PermissionGuard permission="create">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditItem(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add {{itemName}}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editItem ? 'Edit' : 'Add'} {{itemName}}
                </DialogTitle>
              </DialogHeader>
              <ItemForm 
                item={editItem} 
                onSave={handleSave}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </PermissionGuard>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search {{itemNamePlural}}..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {{itemNamePlural}} found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {{#each fieldNames}}
                  <TableHead>{{toTitleCase this}}</TableHead>
                  {{/each}}
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id}>
                    {{#each fieldNames}}
                    <TableCell>{item.{{this}}}</TableCell>
                    {{/each}}
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <PermissionGuard permission="edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditItem(item);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ItemFormProps {
  item: {{itemNamePascal}} | null;
  onSave: (data: Partial<{{itemNamePascal}}>) => void;
  onCancel: () => void;
}

function ItemForm({ item, onSave, onCancel }: ItemFormProps) {
  const [formData, setFormData] = useState({
    {{#each fieldNames}}
    {{this}}: item?.{{this}} || '',
    {{/each}}
  });
  
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSave(formData);
      }}
      className="space-y-4"
    >
      {{#each fieldNames}}
      <div>
        <Label htmlFor="{{this}}">{{toTitleCase this}}</Label>
        <Input
          id="{{this}}"
          value={formData.{{this}}}
          onChange={e => setFormData({ ...formData, {{this}}: e.target.value })}
        />
      </div>
      {{/each}}
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {item ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
```

```typescript
// templates/data-list/src/api/{{itemNamePlural}}.ts.hbs

import { createHandler } from '@dramac/sdk';

// GET /api/modules/{{moduleId}}/{{itemNamePlural}}
export const get = createHandler(async (req, ctx) => {
  const { data, error } = await ctx.db.from('{{itemNamePlural}}').select('*');
  if (error) throw error;
  return data;
});

// POST /api/modules/{{moduleId}}/{{itemNamePlural}}
export const post = createHandler(async (req, ctx) => {
  const { data, error } = await ctx.db.from('{{itemNamePlural}}').insert(req.body).select().single();
  if (error) throw error;
  return data;
});

// GET /api/modules/{{moduleId}}/{{itemNamePlural}}/:id
export const getById = createHandler(async (req, ctx) => {
  const { data, error } = await ctx.db.from('{{itemNamePlural}}').get(ctx.params.id);
  if (error) throw error;
  return data;
});

// PUT /api/modules/{{moduleId}}/{{itemNamePlural}}/:id
export const put = createHandler(async (req, ctx) => {
  const { data, error } = await ctx.db.from('{{itemNamePlural}}').update(ctx.params.id, req.body);
  if (error) throw error;
  return data;
});

// DELETE /api/modules/{{moduleId}}/{{itemNamePlural}}/:id
export const del = createHandler(async (req, ctx) => {
  const { error } = await ctx.db.from('{{itemNamePlural}}').delete(ctx.params.id);
  if (error) throw error;
  return { success: true };
});
```

---

### Task 3: Template Generator (2 hours)

```typescript
// src/lib/modules/templates/template-generator.ts

import Handlebars from 'handlebars';
import { ModuleTemplate, getTemplateById } from './template-registry';
import fs from 'fs-extra';
import path from 'path';

// Register Handlebars helpers
Handlebars.registerHelper('toTitleCase', (str: string) => {
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
});

Handlebars.registerHelper('toPascalCase', (str: string) => {
  return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase());
});

Handlebars.registerHelper('toCamelCase', (str: string) => {
  return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
});

export interface GenerateOptions {
  templateId: string;
  outputDir: string;
  variables: Record<string, any>;
}

/**
 * Generate module from template
 */
export async function generateFromTemplate(options: GenerateOptions): Promise<void> {
  const template = getTemplateById(options.templateId);
  if (!template) {
    throw new Error(`Template not found: ${options.templateId}`);
  }
  
  // Process variables
  const context = processVariables(template, options.variables);
  
  // Get template directory
  const templateDir = path.join(__dirname, '..', '..', '..', 'templates', options.templateId);
  
  // Get all template files
  const files = await getTemplateFiles(templateDir);
  
  // Process each file
  for (const file of files) {
    const relativePath = path.relative(templateDir, file);
    const outputPath = processPath(relativePath, context);
    const fullOutputPath = path.join(options.outputDir, outputPath);
    
    // Read template content
    const content = await fs.readFile(file, 'utf-8');
    
    // Process content if it's a template file
    let processedContent = content;
    if (file.endsWith('.hbs')) {
      const compiled = Handlebars.compile(content);
      processedContent = compiled(context);
    }
    
    // Write output file
    const finalPath = fullOutputPath.replace('.hbs', '');
    await fs.ensureDir(path.dirname(finalPath));
    await fs.writeFile(finalPath, processedContent);
  }
  
  // Create package.json
  await createPackageJson(options.outputDir, template, context);
}

function processVariables(template: ModuleTemplate, variables: Record<string, any>) {
  const context: Record<string, any> = { ...variables };
  
  // Generate module ID from name
  if (variables.moduleName) {
    context.moduleId = variables.moduleName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Process item names
  if (variables.itemName) {
    context.itemNamePascal = variables.itemName
      .replace(/[-_](\w)/g, (_: string, c: string) => c.toUpperCase())
      .replace(/^\w/, (c: string) => c.toUpperCase());
  }
  
  // Process fields
  if (variables.fields) {
    context.fieldNames = variables.fields.split(',').map((f: string) => f.trim());
  }
  
  return context;
}

function processPath(filePath: string, context: Record<string, any>): string {
  let result = filePath;
  
  // Replace placeholders in path
  Object.entries(context).forEach(([key, value]) => {
    if (typeof value === 'string') {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
  });
  
  return result;
}

async function getTemplateFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getTemplateFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function createPackageJson(
  outputDir: string,
  template: ModuleTemplate,
  context: Record<string, any>
) {
  const pkg = {
    name: `@dramac-modules/${context.moduleId}`,
    version: '1.0.0',
    description: context.description || template.description,
    main: 'dist/index.js',
    scripts: {
      dev: 'dramac dev',
      build: 'dramac build',
      validate: 'dramac validate',
      deploy: 'dramac deploy'
    },
    dependencies: Object.fromEntries(
      template.dependencies.map(dep => [dep, 'latest'])
    ),
    devDependencies: {
      typescript: '^5.4.0',
      '@types/react': '^18.2.0'
    }
  };
  
  await fs.writeJson(path.join(outputDir, 'package.json'), pkg, { spaces: 2 });
}
```

---

### Task 4: Template Browser UI (2 hours)

```typescript
// src/components/modules/TemplateBrowser.tsx

'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label
} from '@/components/ui';
import { Search, Clock, Star, ArrowRight } from 'lucide-react';
import { MODULE_TEMPLATES, ModuleTemplate, TemplateVariable } from '@/lib/modules/templates/template-registry';

interface TemplateBrowserProps {
  onSelect: (template: ModuleTemplate, variables: Record<string, any>) => void;
}

export function TemplateBrowser({ onSelect }: TemplateBrowserProps) {
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ModuleTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});
  
  const categories = ['basic', 'business', 'industry'] as const;
  
  const filteredTemplates = MODULE_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );
  
  function handleSelectTemplate(template: ModuleTemplate) {
    setSelectedTemplate(template);
    // Initialize variables with defaults
    const defaults: Record<string, any> = {};
    template.variables.forEach(v => {
      if (v.default !== undefined) {
        defaults[v.name] = v.default;
      }
    });
    setVariables(defaults);
  }
  
  function handleCreate() {
    if (selectedTemplate) {
      onSelect(selectedTemplate, variables);
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="industry">Industry</TabsTrigger>
        </TabsList>
        
        {categories.map(category => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates
                .filter(t => t.category === category)
                .map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => handleSelectTemplate(template)}
                  />
                ))
              }
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Configuration Dialog */}
      <Dialog 
        open={!!selectedTemplate} 
        onOpenChange={() => setSelectedTemplate(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6">
              <div className="space-y-4">
                {selectedTemplate.variables.map(variable => (
                  <VariableInput
                    key={variable.name}
                    variable={variable}
                    value={variables[variable.name]}
                    onChange={value => setVariables({
                      ...variables,
                      [variable.name]: value
                    })}
                  />
                ))}
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Features included:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedTemplate.features.map(feature => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTemplate(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate}>
                  Create Module
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TemplateCardProps {
  template: ModuleTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const complexityColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };
  
  return (
    <Card 
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="mt-1">
              {template.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {template.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {template.estimatedSetupTime}
          </div>
          <Badge className={complexityColors[template.complexity]}>
            {template.complexity}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface VariableInputProps {
  variable: TemplateVariable;
  value: any;
  onChange: (value: any) => void;
}

function VariableInput({ variable, value, onChange }: VariableInputProps) {
  switch (variable.type) {
    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <div>
            <Label>{variable.label}</Label>
            {variable.description && (
              <p className="text-sm text-muted-foreground">{variable.description}</p>
            )}
          </div>
          <input
            type="checkbox"
            checked={value || false}
            onChange={e => onChange(e.target.checked)}
            className="h-4 w-4"
          />
        </div>
      );
      
    case 'select':
      return (
        <div>
          <Label>{variable.label}</Label>
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md"
          >
            {variable.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
      
    case 'number':
      return (
        <div>
          <Label>{variable.label}</Label>
          <Input
            type="number"
            value={value || ''}
            onChange={e => onChange(Number(e.target.value))}
          />
        </div>
      );
      
    default:
      return (
        <div>
          <Label>{variable.label} {variable.required && '*'}</Label>
          {variable.description && (
            <p className="text-sm text-muted-foreground mb-1">{variable.description}</p>
          )}
          <Input
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            required={variable.required}
          />
        </div>
      );
  }
}
```

---

## ✅ Verification Checklist

- [ ] Template registry loads correctly
- [ ] All templates have required files
- [ ] Variables are processed correctly
- [ ] Generated code compiles
- [ ] Database schema is valid
- [ ] API routes work
- [ ] UI components render
- [ ] Template browser functional

---

## 📍 Dependencies

- **Requires**: EM-01, EM-20 (SDK), EM-21 (CLI)
- **Required by**: Module developers
