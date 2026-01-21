# @dramac/sdk

The official SDK for building Dramac modules. This package provides everything you need to create, test, and deploy custom modules for the Dramac platform.

## Installation

```bash
npm install @dramac/sdk
# or
pnpm add @dramac/sdk
```

## Quick Start

### 1. Create a New Module

```bash
npx dramac init my-module
cd my-module
npm install
```

### 2. Configure Your Module

Edit `dramac.config.ts`:

```typescript
import { defineModule } from '@dramac/sdk';

export default defineModule({
  id: 'my-module',
  name: 'My Module',
  version: '1.0.0',
  description: 'A custom Dramac module',
  category: 'custom',

  tables: [
    {
      name: 'items',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'site_id', type: 'uuid', references: { table: 'sites', column: 'id' } },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
      ],
      rls: true,
    },
  ],

  permissions: [
    {
      id: 'module.view_items',
      name: 'View Items',
      description: 'View items in the module',
      roles: ['admin', 'site_admin', 'site_user'],
    },
  ],

  entryPoints: {
    dashboard: './src/Dashboard',
    settings: './src/Settings',
  },
});
```

### 3. Start Development

```bash
npm run dev
```

This starts the local development server with hot reloading.

## Features

### Database SDK

The database SDK provides type-safe database operations:

```typescript
import { createModuleClient } from '@dramac/sdk/database';

const client = createModuleClient({
  moduleId: 'my-module',
  supabase,
  siteId,
});

// Query data
const { data, error } = await client.query('items', {
  select: '*',
  filter: { status: 'active' },
  orderBy: { column: 'created_at', direction: 'desc' },
  limit: 50,
});

// Insert data
const { data: newItem } = await client.insert('items', {
  name: 'New Item',
});

// Update data
const { data: updated } = await client.update('items', itemId, {
  name: 'Updated Name',
});

// Delete data
await client.delete('items', itemId);
```

### React Hooks

The SDK provides React hooks for common patterns:

```typescript
import { usePaginatedData, useModuleForm, useModuleSettings } from '@dramac/sdk';

// Paginated data fetching
const { data, loading, error, page, nextPage, prevPage } = usePaginatedData({
  table: 'items',
  pageSize: 20,
  orderBy: { column: 'created_at', direction: 'desc' },
});

// Form handling with validation
const { register, handleSubmit, errors, isSubmitting } = useModuleForm({
  schema: itemSchema,
  onSubmit: async (values) => {
    await client.insert('items', values);
  },
});

// Module settings
const { settings, updateSettings, loading, saving } = useModuleSettings({
  schema: settingsSchema,
});
```

### Authentication & Permissions

```typescript
import { useModuleAuth, PermissionGuard } from '@dramac/sdk/auth';

function Dashboard() {
  const { user, siteId, hasPermission } = useModuleAuth();

  // Check permission programmatically
  if (!hasPermission('module.view_items')) {
    return <AccessDenied />;
  }

  return (
    <div>
      {/* Guard specific elements */}
      <PermissionGuard permission="module.manage_items">
        <button>Create Item</button>
      </PermissionGuard>
    </div>
  );
}
```

### Testing Utilities

```typescript
import { createMockContext, createMockSupabase, createFixtures } from '@dramac/sdk/testing';

describe('MyModule', () => {
  it('should create an item', async () => {
    const mockSupabase = createMockSupabase();
    const ctx = createMockContext({
      supabase: mockSupabase,
      siteId: 'test-site',
    });

    const fixtures = createFixtures('items', {
      name: (i) => `Item ${i}`,
    });

    // Your test logic...
  });
});
```

## CLI Commands

### `dramac init <name>`

Create a new module from a template.

Options:
- `--template <type>` - Template to use: basic, crm, booking (default: basic)
- `--dir <path>` - Directory to create the module in

### `dramac dev`

Start the development server with hot reloading.

Options:
- `--port <number>` - Port to run the dev server on (default: 3001)
- `--host <string>` - Host to bind to (default: localhost)

### `dramac build`

Build the module for production.

### `dramac deploy`

Deploy the module to the Dramac platform.

Options:
- `--env <environment>` - Target environment: development, staging, production

### `dramac generate migration <name>`

Generate a new database migration.

### `dramac validate`

Validate the module configuration.

## Module Configuration Reference

### DramacModuleConfig

```typescript
interface DramacModuleConfig {
  // Required
  id: string;                    // Unique module identifier
  name: string;                  // Display name
  version: string;               // Semver version

  // Optional
  description?: string;          // Module description
  category?: ModuleCategory;     // crm | finance | booking | inventory | hr | custom
  icon?: string;                 // Icon URL or emoji

  // Database
  tables?: TableDefinition[];    // Database table definitions

  // Permissions
  permissions?: Permission[];    // RBAC permissions

  // Settings
  settings?: SettingsSchema;     // Module settings schema

  // Entry Points
  entryPoints?: {
    dashboard?: string;          // Main dashboard component
    settings?: string;           // Settings component
    embed?: string;              // Embeddable widget
  };

  // Lifecycle Hooks
  hooks?: {
    onInstall?: (ctx: ModuleContext) => Promise<void>;
    onUninstall?: (ctx: ModuleContext) => Promise<void>;
    onUpgrade?: (ctx: ModuleContext, fromVersion: string) => Promise<void>;
    onEnable?: (ctx: ModuleContext) => Promise<void>;
    onDisable?: (ctx: ModuleContext) => Promise<void>;
  };

  // Events
  events?: Record<string, EventDefinition>;

  // Background Jobs
  jobs?: JobDefinition[];
}
```

### TableDefinition

```typescript
interface TableDefinition {
  name: string;                  // Table name
  columns: ColumnDefinition[];   // Column definitions
  indexes?: IndexDefinition[];   // Index definitions
  rls?: boolean;                 // Enable Row Level Security
}

interface ColumnDefinition {
  name: string;
  type: ColumnType;              // text, integer, uuid, timestamptz, etc.
  primaryKey?: boolean;
  nullable?: boolean;
  defaultValue?: string;
  references?: {
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  };
}
```

### Permission

```typescript
interface Permission {
  id: string;                    // e.g., 'module.view_items'
  name: string;                  // Human-readable name
  description?: string;          // Description
  roles: string[];               // Roles that have this permission
}
```

## VS Code Extension

Install the "Dramac Modules" VS Code extension for the best development experience:

- IntelliSense for module configuration
- Code snippets for common patterns
- Real-time validation
- Integrated dev server management
- Module explorer sidebar

## Templates

The SDK includes starter templates:

- **basic** - Simple CRUD module
- **crm** - Customer relationship management
- **booking** - Appointment scheduling

Use `dramac init --template <type>` to create a module from a template.

## Best Practices

### 1. Always Use Type-Safe Queries

```typescript
// Good
const { data } = await client.query<Item>('items', { select: '*' });

// Better - with runtime validation
const items = itemSchema.array().parse(data);
```

### 2. Handle Errors Gracefully

```typescript
const { data, error } = await client.query('items');

if (error) {
  console.error('Query failed:', error);
  // Show user-friendly error message
  return;
}
```

### 3. Use Permission Guards

```typescript
<PermissionGuard permission="module.manage_items" fallback={<ReadOnlyView />}>
  <EditableView />
</PermissionGuard>
```

### 4. Write Tests

```typescript
import { describe, it, expect } from 'vitest';
import { createMockContext } from '@dramac/sdk/testing';

describe('Item creation', () => {
  it('should validate required fields', async () => {
    // Test your business logic
  });
});
```

## Support

- Documentation: https://docs.dramac.io/sdk
- GitHub Issues: https://github.com/dramac/sdk/issues
- Discord: https://discord.gg/dramac

## License

MIT © Dramac
