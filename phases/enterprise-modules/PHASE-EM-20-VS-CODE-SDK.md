# Phase EM-20: VS Code SDK & Developer Experience

> **Priority**: 🟠 HIGH
> **Estimated Time**: 10-12 hours
> **Prerequisites**: EM-01, EM-05, EM-11
> **Status**: 📋 READY TO IMPLEMENT

---

## 🔗 Integration with Platform

The SDK wraps platform services from previous phases:

| SDK Feature | Platform Service | From Phase |
|-------------|-----------------|------------|
| `@dramac/sdk/database` | `createModuleDataClient()` | EM-11 |
| `@dramac/sdk/api` | Module API Gateway | EM-12 |
| `@dramac/sdk/types` | `ModuleType`, `ModuleCapabilities` | EM-10 |
| `@dramac/sdk/naming` | `generateModuleShortId()` | EM-05 |

**The SDK is published as an npm package** that external developers use. It communicates with the DRAMAC platform APIs.

---

## 🎯 Objective

Create a **world-class developer experience** for building Dramac modules:
1. VS Code extension with IntelliSense and snippets
2. Local development server with hot reload
3. TypeScript SDK with full type safety
4. Testing utilities and mocking tools
5. Documentation and examples

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  IntelliSense │ │   Snippets   │ │  Debugger    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  File Watcher │ │  Preview     │ │  Deploy      │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     @dramac/sdk                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │    Types     │ │   Database   │ │     UI       │        │
│  │  Definitions │ │     SDK      │ │  Components  │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Testing    │ │   Mocking    │ │    CLI       │        │
│  │   Helpers    │ │   Utilities  │ │  Commands    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Local Dev Server                           │
│  Port 3001 → Module Preview + Hot Reload + API Mock         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: SDK Package Structure (1 hour)

```
@dramac/sdk/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Main exports
│   ├── types/             # TypeScript definitions
│   │   ├── module.ts      # Module interfaces
│   │   ├── database.ts    # Database types
│   │   ├── ui.ts          # UI component types
│   │   └── events.ts      # Event types
│   ├── database/          # Database SDK
│   │   ├── client.ts      # Data client
│   │   ├── query.ts       # Query builder
│   │   └── migrations.ts  # Migration helpers
│   ├── ui/                # UI utilities
│   │   ├── components.ts  # Re-exported components
│   │   ├── hooks.ts       # Common hooks
│   │   └── styles.ts      # Style utilities
│   ├── testing/           # Testing utilities
│   │   ├── mocks.ts       # Mock factories
│   │   ├── fixtures.ts    # Test fixtures
│   │   └── helpers.ts     # Test helpers
│   └── cli/               # CLI commands
│       ├── init.ts        # Init new module
│       ├── dev.ts         # Dev server
│       └── deploy.ts      # Deploy module
├── templates/             # Module templates
│   ├── basic/
│   ├── crm/
│   └── booking/
└── README.md
```

---

### Task 2: Core SDK Types (2 hours)

```typescript
// @dramac/sdk/src/types/module.ts

/**
 * Module definition file (dramac.config.ts)
 */
export interface DramacModuleConfig {
  // Identity
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Display
  icon: string;
  category: ModuleCategory;
  tags?: string[];
  
  // Type (determines isolation level)
  type: 'app' | 'custom' | 'system';
  
  // Requirements
  requires?: {
    platform?: string;  // Min platform version
    modules?: string[]; // Required modules
  };
  
  // Pricing (for marketplace)
  pricing?: {
    type: 'free' | 'paid' | 'subscription';
    price?: number;
    currency?: string;
    interval?: 'monthly' | 'yearly';
  };
  
  // Entry points
  entry: {
    dashboard?: string;    // Dashboard component
    settings?: string;     // Settings component
    embed?: string;        // Embed component
    api?: string;          // API routes
  };
  
  // Database
  database?: {
    tables: TableDefinition[];
    migrations?: string;  // Path to migrations
  };
  
  // Permissions
  permissions?: PermissionDefinition[];
  
  // Roles
  roles?: RoleDefinition[];
  
  // API routes
  routes?: RouteDefinition[];
  
  // Webhooks
  webhooks?: WebhookDefinition[];
  
  // Settings schema
  settings?: SettingsSchema;
}

export type ModuleCategory =
  | 'crm'
  | 'booking'
  | 'ecommerce'
  | 'analytics'
  | 'marketing'
  | 'communication'
  | 'payments'
  | 'social'
  | 'content'
  | 'automation'
  | 'integration'
  | 'utility';

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  rls?: RLSPolicy[];
}

export interface ColumnDefinition {
  name: string;
  type: 'uuid' | 'text' | 'integer' | 'decimal' | 'boolean' | 'timestamp' | 'jsonb' | 'array';
  primaryKey?: boolean;
  nullable?: boolean;
  default?: any;
  references?: {
    table: string;
    column: string;
    onDelete?: 'cascade' | 'set null' | 'restrict';
  };
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
  where?: string;
}

export interface RLSPolicy {
  name: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  check?: string;
  using?: string;
}

export interface PermissionDefinition {
  key: string;
  name: string;
  description?: string;
  category?: string;
}

export interface RoleDefinition {
  slug: string;
  name: string;
  description?: string;
  permissions: string[];
  hierarchyLevel: number;
  isDefault?: boolean;
}

export interface RouteDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  handler: string;  // Path to handler function
  auth?: boolean;
  scopes?: string[];
  rateLimit?: number;
}

export interface WebhookDefinition {
  event: string;
  handler: string;
}

export interface SettingsSchema {
  sections: SettingsSection[];
}

export interface SettingsSection {
  id: string;
  title: string;
  fields: SettingsField[];
}

export interface SettingsField {
  id: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'json';
  label: string;
  description?: string;
  default?: any;
  options?: { label: string; value: any }[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}
```

---

### Task 3: Database SDK (2 hours)

```typescript
// @dramac/sdk/src/database/client.ts

import { SupabaseClient } from '@supabase/supabase-js';

export interface ModuleContext {
  moduleId: string;
  siteId: string;
  userId?: string;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Type-safe database client for modules
 */
export function createModuleClient<T extends Record<string, any>>(
  supabase: SupabaseClient,
  context: ModuleContext,
  tablePrefix: string
) {
  return {
    /**
     * Query a table
     */
    from<K extends keyof T>(tableName: K) {
      const fullTableName = `${tablePrefix}_${String(tableName)}`;
      const query = supabase.from(fullTableName);
      
      // Auto-filter by site_id for multi-tenancy
      return {
        /**
         * Select records
         */
        async select(columns = '*', options?: QueryOptions) {
          let q = query.select(columns).eq('site_id', context.siteId);
          
          if (options?.limit) q = q.limit(options.limit);
          if (options?.offset) q = q.range(options.offset, options.offset + (options.limit || 10));
          if (options?.orderBy) {
            q = q.order(options.orderBy, { 
              ascending: options.orderDirection !== 'desc' 
            });
          }
          
          return q;
        },
        
        /**
         * Get single record by ID
         */
        async get(id: string) {
          return query
            .select('*')
            .eq('id', id)
            .eq('site_id', context.siteId)
            .single();
        },
        
        /**
         * Insert records
         */
        async insert(data: T[K] | T[K][]) {
          const records = Array.isArray(data) ? data : [data];
          const withContext = records.map(r => ({
            ...r,
            site_id: context.siteId,
            created_by: context.userId
          }));
          
          return query.insert(withContext).select();
        },
        
        /**
         * Update records
         */
        async update(id: string, data: Partial<T[K]>) {
          return query
            .update({
              ...data,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('site_id', context.siteId)
            .select()
            .single();
        },
        
        /**
         * Delete records
         */
        async delete(id: string) {
          return query
            .delete()
            .eq('id', id)
            .eq('site_id', context.siteId);
        },
        
        /**
         * Count records
         */
        async count(filters?: Record<string, any>) {
          let q = query
            .select('id', { count: 'exact', head: true })
            .eq('site_id', context.siteId);
          
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              q = q.eq(key, value);
            });
          }
          
          const { count } = await q;
          return count || 0;
        },
        
        /**
         * Custom query builder
         */
        query() {
          return query.select('*').eq('site_id', context.siteId);
        }
      };
    },
    
    /**
     * Execute raw SQL (admin only)
     */
    async raw(sql: string) {
      return supabase.rpc('exec_ddl', { ddl_statement: sql });
    }
  };
}

// Type helper for defining table schemas
export type InferTableType<T extends TableDefinition> = {
  [K in T['columns'][number]['name']]: any;
};
```

---

### Task 4: UI Component Library (2 hours)

```typescript
// @dramac/sdk/src/ui/components.ts

/**
 * Re-export platform UI components for use in modules
 * These are the official Dramac design system components
 */

// Layout
export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
export { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
export { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

// Forms
export { Input } from '@/components/ui/input';
export { Button, buttonVariants } from '@/components/ui/button';
export { Label } from '@/components/ui/label';
export { Textarea } from '@/components/ui/textarea';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export { Checkbox } from '@/components/ui/checkbox';
export { Switch } from '@/components/ui/switch';
export { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Data Display
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
export { Badge } from '@/components/ui/badge';
export { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Feedback
export { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
export { useToast, toast } from '@/components/ui/use-toast';
export { Skeleton } from '@/components/ui/skeleton';

// Navigation
export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Icons (re-export lucide-react)
export * from 'lucide-react';
```

```typescript
// @dramac/sdk/src/ui/hooks.ts

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for paginated data fetching
 */
export function usePaginatedData<T>(
  fetcher: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  pageSize = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcher(page, pageSize);
      setData(result.data);
      setTotal(result.total);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, pageSize]);
  
  useEffect(() => {
    fetch();
  }, [fetch]);
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    loading,
    error,
    setPage,
    refresh: fetch
  };
}

/**
 * Hook for form state management
 */
export function useModuleForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  
  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);
  
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error: any) {
      if (error.fieldErrors) {
        setErrors(error.fieldErrors);
      }
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [values, onSubmit]);
  
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);
  
  return {
    values,
    errors,
    submitting,
    handleChange,
    handleSubmit,
    reset,
    setValues
  };
}

/**
 * Hook for module settings
 */
export function useModuleSettings<T extends Record<string, any>>(
  moduleId: string,
  defaults: T
) {
  const [settings, setSettings] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load settings from API
    async function load() {
      try {
        const response = await fetch(`/api/modules/${moduleId}/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings({ ...defaults, ...data });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [moduleId]);
  
  const updateSettings = useCallback(async (updates: Partial<T>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    await fetch(`/api/modules/${moduleId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }, [moduleId, settings]);
  
  return { settings, loading, updateSettings };
}
```

---

### Task 5: Testing Utilities (1.5 hours)

```typescript
// @dramac/sdk/src/testing/mocks.ts

import { vi } from 'vitest';
import { ModuleContext } from '../database/client';

/**
 * Create mock module context
 */
export function createMockContext(overrides?: Partial<ModuleContext>): ModuleContext {
  return {
    moduleId: 'test-module-id',
    siteId: 'test-site-id',
    userId: 'test-user-id',
    ...overrides
  };
}

/**
 * Create mock Supabase client
 */
export function createMockSupabase() {
  const mockData: Record<string, any[]> = {};
  
  const createMockQuery = (tableName: string) => {
    let filters: Record<string, any> = {};
    let selectColumns = '*';
    let orderColumn: string | null = null;
    let orderAsc = true;
    let limitCount: number | null = null;
    
    const query = {
      select(columns = '*') {
        selectColumns = columns;
        return query;
      },
      eq(column: string, value: any) {
        filters[column] = value;
        return query;
      },
      neq(column: string, value: any) {
        filters[`${column}:neq`] = value;
        return query;
      },
      in(column: string, values: any[]) {
        filters[`${column}:in`] = values;
        return query;
      },
      order(column: string, { ascending = true } = {}) {
        orderColumn = column;
        orderAsc = ascending;
        return query;
      },
      limit(count: number) {
        limitCount = count;
        return query;
      },
      range(from: number, to: number) {
        return query;
      },
      single() {
        const data = mockData[tableName]?.find(item =>
          Object.entries(filters).every(([key, value]) => item[key] === value)
        );
        return Promise.resolve({ data, error: null });
      },
      async then(resolve: Function) {
        let data = mockData[tableName] || [];
        
        // Apply filters
        data = data.filter(item =>
          Object.entries(filters).every(([key, value]) => {
            if (key.endsWith(':neq')) return item[key.slice(0, -4)] !== value;
            if (key.endsWith(':in')) return value.includes(item[key.slice(0, -3)]);
            return item[key] === value;
          })
        );
        
        // Apply order
        if (orderColumn) {
          data.sort((a, b) => {
            const aVal = a[orderColumn!];
            const bVal = b[orderColumn!];
            return orderAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
          });
        }
        
        // Apply limit
        if (limitCount) data = data.slice(0, limitCount);
        
        return resolve({ data, error: null });
      },
      insert(data: any | any[]) {
        const records = Array.isArray(data) ? data : [data];
        const inserted = records.map(r => ({
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          ...r
        }));
        mockData[tableName] = [...(mockData[tableName] || []), ...inserted];
        return {
          select() {
            return Promise.resolve({ data: inserted, error: null });
          }
        };
      },
      update(data: any) {
        const updated = mockData[tableName]?.map(item => {
          if (Object.entries(filters).every(([k, v]) => item[k] === v)) {
            return { ...item, ...data, updated_at: new Date().toISOString() };
          }
          return item;
        });
        mockData[tableName] = updated || [];
        return {
          select() {
            return {
              single() {
                const item = mockData[tableName]?.find(item =>
                  Object.entries(filters).every(([k, v]) => item[k] === v)
                );
                return Promise.resolve({ data: item, error: null });
              }
            };
          }
        };
      },
      delete() {
        mockData[tableName] = mockData[tableName]?.filter(item =>
          !Object.entries(filters).every(([k, v]) => item[k] === v)
        ) || [];
        return Promise.resolve({ error: null });
      }
    };
    
    return query;
  };
  
  return {
    from: (tableName: string) => createMockQuery(tableName),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    },
    rpc: vi.fn(),
    _mockData: mockData,
    _seed(table: string, data: any[]) {
      mockData[table] = data;
    }
  };
}

/**
 * Create mock module auth context
 */
export function createMockAuth(overrides?: {
  permissions?: string[];
  roles?: string[];
}) {
  return {
    user: { id: 'test-user-id', email: 'test@example.com' },
    isLoading: false,
    moduleId: 'test-module-id',
    siteId: 'test-site-id',
    roles: overrides?.roles?.map(r => ({ slug: r, permissions: [] })) || [],
    permissions: overrides?.permissions || ['*'],
    hasPermission: (p: string) => overrides?.permissions?.includes(p) || overrides?.permissions?.includes('*') || true,
    hasAnyPermission: (ps: string[]) => true,
    hasAllPermissions: (ps: string[]) => true,
    hasRole: (r: string) => overrides?.roles?.includes(r) || false,
    isAtLeastRole: (r: string) => true
  };
}
```

```typescript
// @dramac/sdk/src/testing/helpers.ts

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { ModuleAuthProvider } from '../ui/auth-context';
import { createMockAuth } from './mocks';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  moduleId?: string;
  siteId?: string;
  permissions?: string[];
}

/**
 * Custom render function that wraps components in module context
 */
export function renderWithModuleContext(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    moduleId = 'test-module',
    siteId = 'test-site',
    permissions = ['*'],
    ...renderOptions
  } = options;
  
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ModuleAuthProvider moduleId={moduleId} siteId={siteId}>
        {children}
      </ModuleAuthProvider>
    );
  }
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Create test fixtures
 */
export function createFixtures<T extends Record<string, any>>(
  factory: (overrides?: Partial<T>) => T
) {
  return {
    create: factory,
    createMany: (count: number, overrides?: Partial<T>) =>
      Array.from({ length: count }, () => factory(overrides))
  };
}
```

---

### Task 6: Local Dev Server (2 hours)

```typescript
// @dramac/sdk/src/cli/dev.ts

import express from 'express';
import { createServer } from 'vite';
import path from 'path';
import fs from 'fs';
import chokidar from 'chokidar';

interface DevServerOptions {
  port?: number;
  moduleDir?: string;
}

/**
 * Start local development server for module preview
 */
export async function startDevServer(options: DevServerOptions = {}) {
  const {
    port = 3001,
    moduleDir = process.cwd()
  } = options;
  
  // Load module config
  const configPath = path.join(moduleDir, 'dramac.config.ts');
  if (!fs.existsSync(configPath)) {
    console.error('❌ dramac.config.ts not found');
    process.exit(1);
  }
  
  const app = express();
  
  // Create Vite dev server for HMR
  const vite = await createServer({
    root: moduleDir,
    server: { middlewareMode: true },
    appType: 'custom'
  });
  
  app.use(vite.middlewares);
  
  // Mock API endpoints
  app.use('/api/modules/:moduleId', async (req, res, next) => {
    const { moduleId } = req.params;
    const modulePath = req.path.replace(`/api/modules/${moduleId}`, '');
    
    console.log(`📡 API: ${req.method} ${modulePath}`);
    
    // Load and execute local handler if exists
    const apiDir = path.join(moduleDir, 'src', 'api');
    const handlerPath = path.join(apiDir, `${modulePath}.ts`);
    
    if (fs.existsSync(handlerPath)) {
      try {
        const handler = await vite.ssrLoadModule(handlerPath);
        const method = req.method.toLowerCase();
        if (handler[method]) {
          const result = await handler[method](req, {
            moduleId,
            siteId: 'dev-site',
            userId: 'dev-user'
          });
          return res.json(result);
        }
      } catch (error) {
        console.error('Handler error:', error);
        return res.status(500).json({ error: 'Handler error' });
      }
    }
    
    next();
  });
  
  // Serve preview page
  app.get('*', async (req, res) => {
    const template = fs.readFileSync(
      path.join(moduleDir, 'index.html'),
      'utf-8'
    );
    
    const html = await vite.transformIndexHtml(req.url, template);
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  });
  
  // Watch for changes
  const watcher = chokidar.watch(moduleDir, {
    ignored: /node_modules/,
    persistent: true
  });
  
  watcher.on('change', (filePath) => {
    console.log(`♻️ File changed: ${path.relative(moduleDir, filePath)}`);
  });
  
  // Start server
  app.listen(port, () => {
    console.log('');
    console.log('🚀 Dramac Module Dev Server');
    console.log('');
    console.log(`   Preview:  http://localhost:${port}`);
    console.log(`   API Mock: http://localhost:${port}/api/modules/dev`);
    console.log('');
    console.log('   Watching for changes...');
    console.log('');
  });
}
```

---

### Task 7: VS Code Extension Features (2 hours)

```json
// vscode-extension/package.json
{
  "name": "dramac-modules",
  "displayName": "Dramac Modules",
  "description": "Build Dramac modules with IntelliSense and live preview",
  "version": "1.0.0",
  "publisher": "dramac",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "workspaceContains:dramac.config.ts"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "dramac.createModule",
        "title": "Dramac: Create New Module"
      },
      {
        "command": "dramac.startDevServer",
        "title": "Dramac: Start Dev Server"
      },
      {
        "command": "dramac.deployModule",
        "title": "Dramac: Deploy Module"
      },
      {
        "command": "dramac.generateTable",
        "title": "Dramac: Generate Database Table"
      }
    ],
    "snippets": [
      {
        "language": "typescript",
        "path": "./snippets/typescript.json"
      },
      {
        "language": "typescriptreact",
        "path": "./snippets/typescriptreact.json"
      }
    ],
    "jsonValidation": [
      {
        "fileMatch": "dramac.config.json",
        "url": "./schemas/dramac-config.json"
      }
    ],
    "views": {
      "explorer": [
        {
          "id": "dramacModules",
          "name": "Dramac Module",
          "when": "workspaceContains:dramac.config.ts"
        }
      ]
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "typescript": "^5.0.0"
  }
}
```

```json
// vscode-extension/snippets/typescript.json
{
  "Dramac Module Config": {
    "prefix": "dmc-config",
    "body": [
      "import { defineModule } from '@dramac/sdk';",
      "",
      "export default defineModule({",
      "  id: '${1:my-module}',",
      "  name: '${2:My Module}',",
      "  version: '1.0.0',",
      "  description: '${3:Description}',",
      "  icon: '${4:Package}',",
      "  category: '${5|crm,booking,ecommerce,analytics,marketing,communication,utility|}',",
      "  type: '${6|app,custom|}',",
      "",
      "  entry: {",
      "    dashboard: './src/Dashboard.tsx',",
      "    settings: './src/Settings.tsx',",
      "  },",
      "",
      "  database: {",
      "    tables: [",
      "      $0",
      "    ]",
      "  }",
      "});"
    ],
    "description": "Create a Dramac module configuration"
  },
  "Dramac Table Definition": {
    "prefix": "dmc-table",
    "body": [
      "{",
      "  name: '${1:items}',",
      "  columns: [",
      "    { name: 'id', type: 'uuid', primaryKey: true },",
      "    { name: 'site_id', type: 'uuid', nullable: false },",
      "    { name: '${2:name}', type: 'text' },",
      "    { name: 'created_at', type: 'timestamp', default: 'NOW()' },",
      "    { name: 'updated_at', type: 'timestamp' }",
      "  ],",
      "  rls: [",
      "    { name: 'site_isolation', operation: 'ALL', using: 'site_id = current_setting(\\'app.site_id\\')::uuid' }",
      "  ]",
      "}"
    ],
    "description": "Define a database table with RLS"
  },
  "Dramac API Route": {
    "prefix": "dmc-route",
    "body": [
      "import { createHandler } from '@dramac/sdk';",
      "",
      "export const ${1|get,post,put,patch,delete|} = createHandler(async (req, ctx) => {",
      "  const { db, user, site } = ctx;",
      "",
      "  $0",
      "",
      "  return { success: true };",
      "});"
    ],
    "description": "Create an API route handler"
  },
  "Dramac Permission Guard": {
    "prefix": "dmc-permission",
    "body": [
      "<PermissionGuard permission=\"${1:action.permission}\">",
      "  $0",
      "</PermissionGuard>"
    ],
    "description": "Add permission-based rendering"
  }
}
```

```json
// vscode-extension/snippets/typescriptreact.json  
{
  "Dramac Dashboard Component": {
    "prefix": "dmc-dashboard",
    "body": [
      "'use client';",
      "",
      "import { Card, CardContent, CardHeader, CardTitle } from '@dramac/sdk/ui';",
      "import { useModuleAuth } from '@dramac/sdk/auth';",
      "",
      "export function ${1:Dashboard}() {",
      "  const { user, hasPermission } = useModuleAuth();",
      "",
      "  return (",
      "    <div className=\"space-y-6\">",
      "      <div className=\"flex items-center justify-between\">",
      "        <h1 className=\"text-2xl font-bold\">${2:Dashboard}</h1>",
      "      </div>",
      "",
      "      <div className=\"grid gap-4 md:grid-cols-2 lg:grid-cols-4\">",
      "        <Card>",
      "          <CardHeader className=\"pb-2\">",
      "            <CardTitle className=\"text-sm font-medium\">",
      "              ${3:Metric}",
      "            </CardTitle>",
      "          </CardHeader>",
      "          <CardContent>",
      "            <div className=\"text-2xl font-bold\">${4:0}</div>",
      "          </CardContent>",
      "        </Card>",
      "      </div>",
      "",
      "      $0",
      "    </div>",
      "  );",
      "}"
    ],
    "description": "Create a module dashboard component"
  },
  "Dramac Data Table": {
    "prefix": "dmc-table-component",
    "body": [
      "'use client';",
      "",
      "import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from '@dramac/sdk/ui';",
      "import { usePaginatedData } from '@dramac/sdk/hooks';",
      "import { Pencil, Trash2 } from 'lucide-react';",
      "",
      "interface ${1:Item} {",
      "  id: string;",
      "  ${2:name}: string;",
      "}",
      "",
      "export function ${1}Table() {",
      "  const { data, loading, page, totalPages, setPage, refresh } = usePaginatedData<${1}>(",
      "    async (page, pageSize) => {",
      "      const res = await fetch(`/api/modules/\\${moduleId}/${3:items}?page=\\${page}&limit=\\${pageSize}`);",
      "      return res.json();",
      "    }",
      "  );",
      "",
      "  if (loading) return <div>Loading...</div>;",
      "",
      "  return (",
      "    <Table>",
      "      <TableHeader>",
      "        <TableRow>",
      "          <TableHead>${2:Name}</TableHead>",
      "          <TableHead className=\"w-[100px]\">Actions</TableHead>",
      "        </TableRow>",
      "      </TableHeader>",
      "      <TableBody>",
      "        {data.map((item) => (",
      "          <TableRow key={item.id}>",
      "            <TableCell>{item.${2}}</TableCell>",
      "            <TableCell>",
      "              <div className=\"flex gap-2\">",
      "                <Button variant=\"ghost\" size=\"icon\">",
      "                  <Pencil className=\"h-4 w-4\" />",
      "                </Button>",
      "                <Button variant=\"ghost\" size=\"icon\">",
      "                  <Trash2 className=\"h-4 w-4\" />",
      "                </Button>",
      "              </div>",
      "            </TableCell>",
      "          </TableRow>",
      "        ))}",
      "      </TableBody>",
      "    </Table>",
      "  );",
      "}"
    ],
    "description": "Create a data table component"
  }
}
```

---

## 📦 Package Exports

```typescript
// @dramac/sdk/src/index.ts

// Config
export { defineModule } from './config';
export type { DramacModuleConfig, TableDefinition, PermissionDefinition, RoleDefinition } from './types/module';

// Database
export { createModuleClient } from './database/client';
export type { ModuleContext, QueryOptions } from './database/client';

// Auth
export { ModuleAuthProvider, useModuleAuth } from './auth/module-auth-context';
export { PermissionGuard, RequireAuth, usePermission, withPermission } from './auth/permission-guard';

// UI (re-exports)
export * from './ui/components';
export * from './ui/hooks';

// Testing
export { createMockContext, createMockSupabase, createMockAuth } from './testing/mocks';
export { renderWithModuleContext, createFixtures } from './testing/helpers';

// CLI
export { startDevServer } from './cli/dev';
```

---

## ✅ Verification Checklist

- [ ] SDK package builds correctly
- [ ] TypeScript types are accurate
- [ ] Database client works with mock
- [ ] UI components render correctly
- [ ] Testing utilities work
- [ ] Dev server starts and hot reloads
- [ ] VS Code extension provides IntelliSense
- [ ] Snippets work correctly

---

## 📍 Dependencies

- **Requires**: EM-01, EM-05, EM-11
- **Required by**: EM-21 (CLI), All module development
