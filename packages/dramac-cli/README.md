# Dramac CLI

> 🚀 Build powerful modules for Dramac

The official CLI tool for creating, developing, and deploying Dramac modules.

## Installation

```bash
# Install globally
npm install -g dramac-cli

# Or use npx
npx dramac-cli create my-module
```

## Quick Start

```bash
# Create a new module
dramac create my-awesome-module

# Start development server
cd my-awesome-module
dramac dev

# Validate configuration
dramac validate

# Build for production
dramac build

# Deploy to marketplace
dramac login
dramac deploy
```

## Commands

### `dramac create [name]`

Create a new Dramac module with interactive prompts.

```bash
dramac create my-module
dramac create my-module --template crm
dramac create my-module --no-git --no-install
```

**Options:**
- `-t, --template <template>` - Template to use (basic, crm, booking, ecommerce, chat)
- `-d, --directory <dir>` - Output directory
- `--no-git` - Skip git initialization
- `--no-install` - Skip npm install

### `dramac dev`

Start a local development server with hot module reloading.

```bash
dramac dev
dramac dev --port 4000
dramac dev --host --open
```

**Options:**
- `-p, --port <port>` - Server port (default: 3001)
- `--host` - Expose to network
- `--open` - Open browser automatically

### `dramac build`

Build the module for production deployment.

```bash
dramac build
dramac build --sourcemap
dramac build --no-bundle
```

**Options:**
- `--sourcemap` - Generate source maps
- `--analyze` - Analyze bundle size
- `--no-bundle` - Skip creating .dramac bundle

### `dramac validate`

Validate module configuration and structure.

```bash
dramac validate
dramac validate --strict
dramac validate --json
```

**Options:**
- `--strict` - Fail on warnings
- `--json` - Output as JSON

### `dramac version [version]`

Manage module version.

```bash
dramac version patch        # 1.0.0 → 1.0.1
dramac version minor        # 1.0.0 → 1.1.0
dramac version major        # 1.0.0 → 2.0.0
dramac version prerelease   # 1.0.0 → 1.0.1-beta.0
dramac version 2.0.0        # Set specific version
dramac version show         # Show current version
```

**Options:**
- `--preid <preid>` - Prerelease identifier (default: beta)
- `-y, --yes` - Skip confirmation

### `dramac deploy`

Deploy module to the Dramac marketplace.

```bash
dramac deploy
dramac deploy --beta
dramac deploy --private
dramac deploy -y
```

**Options:**
- `--beta` - Deploy as beta version
- `--private` - Deploy as private (agency only)
- `--skip-build` - Skip build step
- `--skip-validate` - Skip validation step
- `-y, --yes` - Skip confirmation prompt

### `dramac login`

Authenticate with Dramac to deploy modules.

```bash
dramac login
dramac login --token <token>
dramac login logout
dramac login status
dramac login whoami
```

**Options:**
- `--token <token>` - Use API token directly

**Subcommands:**
- `logout` - Log out from Dramac
- `status` - Check login status
- `whoami` - Show current user

## Module Configuration

Every Dramac module requires a `dramac.config.ts` file:

```typescript
import { defineModule } from '@dramac/sdk';

export default defineModule({
  id: 'my-module',
  name: 'My Module',
  version: '1.0.0',
  description: 'A powerful Dramac module',
  icon: 'Package',
  category: 'utility',
  type: 'app',

  entry: {
    dashboard: './src/Dashboard.tsx',
    settings: './src/Settings.tsx',
  },

  database: {
    tables: [
      {
        name: 'my_module_items',
        columns: [
          { name: 'id', type: 'uuid', default: 'gen_random_uuid()' },
          { name: 'site_id', type: 'uuid', references: 'sites(id)' },
          { name: 'name', type: 'text' },
          { name: 'created_at', type: 'timestamptz', default: 'now()' }
        ]
      }
    ]
  },

  permissions: [
    { key: 'view', name: 'View', category: 'General' },
    { key: 'manage', name: 'Full Access', category: 'General' }
  ],

  roles: [
    { slug: 'admin', name: 'Admin', permissions: ['*'], hierarchyLevel: 100 },
    { slug: 'user', name: 'User', permissions: ['view'], hierarchyLevel: 10, isDefault: true }
  ]
});
```

## API Routes

Create API routes in `src/api/`:

```typescript
// src/api/items.ts
interface RequestContext {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  db: any;  // Supabase client
  user: { id: string };
  site: { id: string };
}

export async function get(ctx: RequestContext) {
  const { data } = await ctx.db
    .from('my_module_items')
    .select()
    .eq('site_id', ctx.site.id);
  
  return { items: data };
}

export async function post(ctx: RequestContext) {
  const { data } = await ctx.db
    .from('my_module_items')
    .insert({
      ...ctx.body,
      site_id: ctx.site.id
    })
    .select()
    .single();
  
  return { item: data };
}
```

Routes are available at `/api/modules/[module-id]/[route]`.

## Environment Variables

- `DRAMAC_API_URL` - API base URL (for development)

## Project Structure

```
my-module/
├── dramac.config.ts    # Module configuration
├── package.json
├── tsconfig.json
├── index.html          # Dev server entry
├── src/
│   ├── main.tsx        # Entry point
│   ├── Dashboard.tsx   # Dashboard component
│   ├── Settings.tsx    # Settings component
│   ├── components/     # Reusable components
│   └── api/            # API routes
├── dist/               # Build output
└── *.dramac            # Deployment bundle
```

## Templates

Available templates:

| Template | Description |
|----------|-------------|
| `basic` | Empty module with essential setup |
| `crm` | Contacts, companies, deals |
| `booking` | Appointments, calendars |
| `ecommerce` | Products, orders, cart |
| `chat` | Real-time messaging |

## License

MIT
