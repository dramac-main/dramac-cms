/**
 * @dramac/sdk - CLI Init Command
 * 
 * Initialize a new Dramac module project
 */

import { mkdir, writeFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface InitOptions {
  name: string;
  template?: 'basic' | 'crm' | 'booking';
  directory?: string;
  description?: string;
  author?: string;
}

/**
 * Initialize a new Dramac module
 */
export async function initModule(options: InitOptions): Promise<void> {
  const {
    name,
    template = 'basic',
    directory = process.cwd(),
    description = 'A Dramac module',
    author = '',
  } = options;

  const moduleDir = path.join(directory, name);

  // Check if directory exists
  if (existsSync(moduleDir)) {
    const files = await readdir(moduleDir);
    if (files.length > 0) {
      throw new Error(`Directory "${name}" already exists and is not empty`);
    }
  }

  console.log(`\n📦 Creating Dramac module: ${name}\n`);

  // Create directory structure
  const dirs = [
    '',
    'src',
    'src/api',
    'src/components',
    'src/lib',
    'src/hooks',
    'public',
    'tests',
  ];

  for (const dir of dirs) {
    await mkdir(path.join(moduleDir, dir), { recursive: true });
  }

  // Generate module ID
  const moduleId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Create package.json
  const packageJson = {
    name: `@dramac-modules/${moduleId}`,
    version: '1.0.0',
    description,
    type: 'module',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    scripts: {
      dev: 'dramac dev',
      build: 'tsup',
      test: 'vitest',
      lint: 'eslint src',
      deploy: 'dramac deploy',
    },
    keywords: ['dramac', 'module'],
    author,
    license: 'MIT',
    peerDependencies: {
      '@dramac/sdk': '^1.0.0',
      react: '^18.0.0',
      'react-dom': '^18.0.0',
    },
    devDependencies: {
      '@dramac/sdk': '^1.0.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      tsup: '^8.0.0',
      typescript: '^5.0.0',
      vitest: '^1.0.0',
    },
  };

  await writeFile(
    path.join(moduleDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      jsx: 'react-jsx',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      outDir: './dist',
      rootDir: './src',
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  await writeFile(
    path.join(moduleDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );

  // Create dramac.config.ts
  const configContent = `import { defineModule } from '@dramac/sdk';

export default defineModule({
  id: '${moduleId}',
  name: '${name}',
  version: '1.0.0',
  description: '${description}',
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
        name: 'items',
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true },
          { name: 'site_id', type: 'uuid', nullable: false },
          { name: 'name', type: 'text', nullable: false },
          { name: 'description', type: 'text' },
          { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
          { name: 'updated_at', type: 'timestamptz' },
          { name: 'created_by', type: 'uuid' },
        ],
        rls: [
          {
            name: 'site_isolation',
            operation: 'ALL',
            using: "site_id = current_setting('app.site_id')::uuid",
          },
        ],
      },
    ],
  },

  permissions: [
    { key: '${moduleId}.read', name: 'View items', category: 'Items' },
    { key: '${moduleId}.create', name: 'Create items', category: 'Items' },
    { key: '${moduleId}.update', name: 'Update items', category: 'Items' },
    { key: '${moduleId}.delete', name: 'Delete items', category: 'Items' },
  ],

  settings: {
    sections: [
      {
        id: 'general',
        title: 'General Settings',
        fields: [
          {
            id: 'displayName',
            type: 'text',
            label: 'Display Name',
            description: 'The name shown in the dashboard',
            default: '${name}',
          },
        ],
      },
    ],
  },
});
`;

  await writeFile(path.join(moduleDir, 'dramac.config.ts'), configContent);

  // Create Dashboard.tsx
  const dashboardContent = `'use client';

import { useModuleAuth } from '@dramac/sdk/auth';
import { usePaginatedData } from '@dramac/sdk/ui';

interface Item {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export function Dashboard() {
  const { user, hasPermission, moduleId, siteId } = useModuleAuth();

  const { data: items, loading, page, totalPages, setPage, refresh } = usePaginatedData<Item>(
    async (page, pageSize) => {
      const res = await fetch(\`/api/modules/\${moduleId}/items?page=\${page}&limit=\${pageSize}\`);
      return res.json();
    }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {hasPermission('${moduleId}.create') && (
          <button className="btn btn-primary">Add Item</button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Items</h2>
        </div>
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <div className="flex gap-2">
                {hasPermission('${moduleId}.update') && (
                  <button className="btn btn-ghost btn-sm">Edit</button>
                )}
                {hasPermission('${moduleId}.delete') && (
                  <button className="btn btn-ghost btn-sm text-destructive">Delete</button>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No items yet. Create your first item to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
`;

  await writeFile(path.join(moduleDir, 'src', 'Dashboard.tsx'), dashboardContent);

  // Create Settings.tsx
  const settingsContent = `'use client';

import { useModuleSettings } from '@dramac/sdk/ui';
import { useModuleAuth } from '@dramac/sdk/auth';

interface ModuleSettings {
  displayName: string;
}

export function Settings() {
  const { moduleId } = useModuleAuth();
  const { settings, loading, saving, updateSettings, saveSettings } = useModuleSettings<ModuleSettings>(
    moduleId,
    { displayName: '' }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button 
          className="btn btn-primary"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">General Settings</h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              className="input w-full"
              value={settings.displayName}
              onChange={(e) => updateSettings({ displayName: e.target.value })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              The name shown in the dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
`;

  await writeFile(path.join(moduleDir, 'src', 'Settings.tsx'), settingsContent);

  // Create index.ts
  const indexContent = `export { Dashboard } from './Dashboard';
export { Settings } from './Settings';
`;

  await writeFile(path.join(moduleDir, 'src', 'index.ts'), indexContent);

  // Create index.html for dev server
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name} - Dramac Module</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

  await writeFile(path.join(moduleDir, 'index.html'), htmlContent);

  // Create main.tsx for dev server
  const mainContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import { ModuleAuthProvider } from '@dramac/sdk/auth';
import { Dashboard } from './Dashboard';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ModuleAuthProvider moduleId="dev" siteId="dev-site">
      <div className="min-h-screen bg-background p-8">
        <Dashboard />
      </div>
    </ModuleAuthProvider>
  </React.StrictMode>
);
`;

  await writeFile(path.join(moduleDir, 'src', 'main.tsx'), mainContent);

  // Create README.md
  const readmeContent = `# ${name}

${description}

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
\`\`\`

## Deployment

\`\`\`bash
# Deploy to Dramac
npm run deploy
\`\`\`

## Configuration

Edit \`dramac.config.ts\` to configure:

- Module identity and metadata
- Database tables and RLS policies
- Permissions and roles
- Settings schema
- API routes

## Structure

\`\`\`
${name}/
├── dramac.config.ts    # Module configuration
├── src/
│   ├── Dashboard.tsx   # Main dashboard component
│   ├── Settings.tsx    # Settings component
│   ├── api/            # API route handlers
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom hooks
│   └── lib/            # Utilities
├── tests/              # Test files
└── public/             # Static assets
\`\`\`
`;

  await writeFile(path.join(moduleDir, 'README.md'), readmeContent);

  // Create .gitignore
  const gitignoreContent = `node_modules/
dist/
.env
.env.local
*.log
.DS_Store
`;

  await writeFile(path.join(moduleDir, '.gitignore'), gitignoreContent);

  console.log(`✅ Module created successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${name}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
  console.log('');
}
