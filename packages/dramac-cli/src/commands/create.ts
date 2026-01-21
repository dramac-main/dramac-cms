import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { processTemplate, toTitleCase, getAvailableTemplates, templateExists } from '../utils/templates.js';

export const createCommand = new Command('create')
  .description('Create a new Dramac module')
  .argument('[name]', 'Module name')
  .option('-t, --template <template>', 'Template to use', 'basic')
  .option('-d, --directory <dir>', 'Output directory')
  .option('--no-git', 'Skip git initialization')
  .option('--no-install', 'Skip npm install')
  .action(async (name, options) => {
    console.log('');
    console.log(chalk.bold('🔧 Create New Dramac Module'));
    console.log('');
    
    // Interactive prompts if not provided
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Module name:',
        default: name,
        when: !name,
        validate: (input: string) => {
          if (!input) return 'Name is required';
          if (!/^[a-z0-9-]+$/.test(input)) {
            return 'Name must be lowercase alphanumeric with hyphens';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'displayName',
        message: 'Display name:',
        default: (ans: any) => toTitleCase(ans.name || name)
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: 'A Dramac module'
      },
      {
        type: 'list',
        name: 'template',
        message: 'Template:',
        choices: [
          { name: '📦 Basic - Empty module with essential setup', value: 'basic' },
          { name: '👥 CRM - Contacts, companies, deals', value: 'crm' },
          { name: '📅 Booking - Appointments, calendars', value: 'booking' },
          { name: '🛒 E-commerce - Products, orders, cart', value: 'ecommerce' },
          { name: '💬 Chat - Real-time messaging', value: 'chat' }
        ],
        when: !options.template || options.template === 'basic'
      },
      {
        type: 'list',
        name: 'category',
        message: 'Category:',
        choices: [
          { name: 'CRM & Sales', value: 'crm' },
          { name: 'Booking & Scheduling', value: 'booking' },
          { name: 'E-commerce', value: 'ecommerce' },
          { name: 'Analytics', value: 'analytics' },
          { name: 'Marketing', value: 'marketing' },
          { name: 'Communication', value: 'communication' },
          { name: 'Utility', value: 'utility' },
          { name: 'Other', value: 'other' }
        ]
      },
      {
        type: 'confirm',
        name: 'hasDashboard',
        message: 'Include dashboard component?',
        default: true
      },
      {
        type: 'confirm',
        name: 'hasSettings',
        message: 'Include settings panel?',
        default: true
      },
      {
        type: 'confirm',
        name: 'hasApi',
        message: 'Include API routes?',
        default: true
      }
    ]);
    
    const moduleName = answers.name || name;
    const template = answers.template || options.template || 'basic';
    const outputDir = options.directory || path.join(process.cwd(), moduleName);
    
    // Check if directory exists
    if (fs.existsSync(outputDir)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Directory ${moduleName} already exists. Overwrite?`,
          default: false
        }
      ]);
      
      if (!overwrite) {
        console.log(chalk.yellow('Aborted.'));
        return;
      }
      
      await fs.remove(outputDir);
    }
    
    const spinner = ora('Creating module...').start();
    
    try {
      // Check if template exists, fallback to creating basic structure
      if (!templateExists(template)) {
        // Create basic structure manually
        await createBasicStructure(outputDir, {
          moduleName,
          moduleId: moduleName,
          displayName: answers.displayName,
          description: answers.description,
          category: answers.category,
          hasDashboard: answers.hasDashboard,
          hasSettings: answers.hasSettings,
          hasApi: answers.hasApi,
          year: new Date().getFullYear()
        });
      } else {
        // Process template
        await processTemplate(template, outputDir, {
          moduleName,
          moduleId: moduleName,
          displayName: answers.displayName,
          description: answers.description,
          category: answers.category,
          hasDashboard: answers.hasDashboard,
          hasSettings: answers.hasSettings,
          hasApi: answers.hasApi,
          year: new Date().getFullYear()
        });
      }
      
      // Update package.json name
      const pkgPath = path.join(outputDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = await fs.readJson(pkgPath);
        pkg.name = `@dramac-modules/${moduleName}`;
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
      }
      
      spinner.succeed('Module created!');
      
      // Initialize git
      if (options.git !== false) {
        const gitSpinner = ora('Initializing git...').start();
        try {
          execSync('git init', { cwd: outputDir, stdio: 'ignore' });
          execSync('git add .', { cwd: outputDir, stdio: 'ignore' });
          execSync('git commit -m "Initial commit"', { cwd: outputDir, stdio: 'ignore' });
          gitSpinner.succeed('Git initialized');
        } catch {
          gitSpinner.fail('Git initialization failed (git may not be installed)');
        }
      }
      
      // Install dependencies
      if (options.install !== false) {
        const installSpinner = ora('Installing dependencies...').start();
        try {
          execSync('npm install', { cwd: outputDir, stdio: 'ignore' });
          installSpinner.succeed('Dependencies installed');
        } catch {
          installSpinner.fail('Dependency installation failed');
        }
      }
      
      // Success message
      console.log('');
      console.log(chalk.green('✅ Module created successfully!'));
      console.log('');
      console.log('Next steps:');
      console.log('');
      console.log(chalk.cyan(`  cd ${moduleName}`));
      console.log(chalk.cyan('  dramac dev'));
      console.log('');
      console.log('Useful commands:');
      console.log('');
      console.log('  ' + chalk.gray('dramac dev') + '       Start development server');
      console.log('  ' + chalk.gray('dramac build') + '     Build for production');
      console.log('  ' + chalk.gray('dramac validate') + '  Validate configuration');
      console.log('  ' + chalk.gray('dramac deploy') + '    Deploy to marketplace');
      console.log('');
      
    } catch (error) {
      spinner.fail('Failed to create module');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

async function createBasicStructure(outputDir: string, context: any): Promise<void> {
  // Create directory structure
  await fs.ensureDir(path.join(outputDir, 'src'));
  await fs.ensureDir(path.join(outputDir, 'src', 'components'));
  
  if (context.hasApi) {
    await fs.ensureDir(path.join(outputDir, 'src', 'api'));
  }
  
  // Create package.json
  const packageJson = {
    name: `@dramac-modules/${context.moduleName}`,
    version: '1.0.0',
    description: context.description,
    type: 'module',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    scripts: {
      dev: 'dramac dev',
      build: 'dramac build',
      validate: 'dramac validate',
      deploy: 'dramac deploy'
    },
    dependencies: {
      '@dramac/sdk': '^1.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'typescript': '^5.4.0'
    }
  };
  
  await fs.writeJson(path.join(outputDir, 'package.json'), packageJson, { spaces: 2 });
  
  // Create dramac.config.ts
  const dashboardEntry = context.hasDashboard ? `    dashboard: './src/Dashboard.tsx',` : '';
  const settingsEntry = context.hasSettings ? `    settings: './src/Settings.tsx',` : '';
  
  const configContent = `import { defineModule } from '@dramac/sdk';

export default defineModule({
  id: '${context.moduleId}',
  name: '${context.displayName}',
  version: '1.0.0',
  description: '${context.description}',
  icon: 'Package',
  category: '${context.category}',
  type: 'app',

  entry: {
${dashboardEntry}
${settingsEntry}
  },

  database: {
    tables: [
      // Add your tables here
    ]
  },

  permissions: [
    { key: 'manage', name: 'Full Access', category: 'General' }
  ],

  roles: [
    { slug: 'admin', name: 'Admin', permissions: ['*'], hierarchyLevel: 100 },
    { slug: 'user', name: 'User', permissions: ['view'], hierarchyLevel: 10, isDefault: true }
  ]
});
`;
  
  await fs.writeFile(path.join(outputDir, 'dramac.config.ts'), configContent);
  
  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['DOM', 'DOM.Iterable', 'ES2022'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      outDir: './dist',
      declaration: true
    },
    include: ['src'],
    exclude: ['node_modules', 'dist']
  };
  
  await fs.writeJson(path.join(outputDir, 'tsconfig.json'), tsConfig, { spaces: 2 });
  
  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${context.displayName} - Dramac Module</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;
  
  await fs.writeFile(path.join(outputDir, 'index.html'), indexHtml);
  
  // Create main.tsx
  const mainTsx = `import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './Dashboard';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Dashboard />
    </React.StrictMode>
  );
}
`;
  
  await fs.writeFile(path.join(outputDir, 'src', 'main.tsx'), mainTsx);
  
  // Create Dashboard.tsx
  if (context.hasDashboard) {
    const dashboardTsx = `import React from 'react';

interface DashboardProps {
  siteId?: string;
  moduleConfig?: any;
}

export default function Dashboard({ siteId, moduleConfig }: DashboardProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">${context.displayName}</h1>
      <p className="text-gray-600">
        Welcome to your new Dramac module! Edit this component to get started.
      </p>
      
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-semibold mb-2">Quick Start</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>Edit <code className="bg-gray-200 px-1 rounded">src/Dashboard.tsx</code> to build your UI</li>
          <li>Add database tables in <code className="bg-gray-200 px-1 rounded">dramac.config.ts</code></li>
          <li>Create API routes in <code className="bg-gray-200 px-1 rounded">src/api/</code></li>
          <li>Run <code className="bg-gray-200 px-1 rounded">dramac validate</code> to check configuration</li>
        </ul>
      </div>
    </div>
  );
}
`;
    
    await fs.writeFile(path.join(outputDir, 'src', 'Dashboard.tsx'), dashboardTsx);
  }
  
  // Create Settings.tsx
  if (context.hasSettings) {
    const settingsTsx = `import React from 'react';

interface SettingsProps {
  siteId?: string;
  moduleConfig?: any;
  onSave?: (config: any) => void;
}

export default function Settings({ siteId, moduleConfig, onSave }: SettingsProps) {
  const handleSave = () => {
    if (onSave) {
      onSave({ /* your settings */ });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">${context.displayName} Settings</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Example Setting
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter value..."
          />
        </div>
        
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
`;
    
    await fs.writeFile(path.join(outputDir, 'src', 'Settings.tsx'), settingsTsx);
  }
  
  // Create API index if needed
  if (context.hasApi) {
    const apiIndex = `// API routes for ${context.displayName}

interface RequestContext {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  db: any;
  user: { id: string };
  site: { id: string };
}

// GET /api/modules/${context.moduleId}/
export async function get(ctx: RequestContext) {
  return {
    message: 'Hello from ${context.displayName}!',
    siteId: ctx.site.id
  };
}

// POST /api/modules/${context.moduleId}/
export async function post(ctx: RequestContext) {
  const { body } = ctx;
  return {
    success: true,
    data: body
  };
}
`;
    
    await fs.writeFile(path.join(outputDir, 'src', 'api', 'index.ts'), apiIndex);
  }
  
  // Create README.md
  const readme = `# ${context.displayName}

${context.description}

## Development

\`\`\`bash
# Start development server
dramac dev

# Build for production
dramac build

# Validate configuration
dramac validate

# Deploy to marketplace
dramac deploy
\`\`\`

## Structure

- \`dramac.config.ts\` - Module configuration
- \`src/Dashboard.tsx\` - Main dashboard component
- \`src/Settings.tsx\` - Settings panel
- \`src/api/\` - API routes

## License

MIT
`;
  
  await fs.writeFile(path.join(outputDir, 'README.md'), readme);
  
  // Create .gitignore
  const gitignore = `node_modules/
dist/
.env
.env.local
*.dramac
.DS_Store
`;
  
  await fs.writeFile(path.join(outputDir, '.gitignore'), gitignore);
}
