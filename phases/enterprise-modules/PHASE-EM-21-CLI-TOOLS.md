# Phase EM-21: CLI Tools (dramac-cli)

> **Priority**: 🟠 HIGH
> **Estimated Time**: 8-10 hours
> **Prerequisites**: EM-01, EM-05, EM-20
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create a **powerful CLI tool** for module developers that:
1. Scaffolds new modules from templates
2. Runs local development server
3. Validates module configurations
4. Deploys modules to marketplace
5. Manages module versions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     dramac-cli                              │
├─────────────────────────────────────────────────────────────┤
│  Commands:                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  create  │ │   dev    │ │  build   │ │  deploy  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ validate │ │  version │ │  login   │ │   help   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│  Core Features:                                             │
│  • Interactive prompts (inquirer)                           │
│  • Progress indicators (ora)                                │
│  • Colorful output (chalk)                                  │
│  • Config file parsing (cosmiconfig)                        │
│  • File system operations                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: CLI Package Structure (30 min)

```
dramac-cli/
├── package.json
├── tsconfig.json
├── bin/
│   └── dramac.js          # Entry point
├── src/
│   ├── index.ts           # Main CLI setup
│   ├── commands/          # Command implementations
│   │   ├── create.ts
│   │   ├── dev.ts
│   │   ├── build.ts
│   │   ├── deploy.ts
│   │   ├── validate.ts
│   │   ├── version.ts
│   │   └── login.ts
│   ├── utils/             # Shared utilities
│   │   ├── config.ts      # Config loading
│   │   ├── api.ts         # API client
│   │   ├── auth.ts        # Authentication
│   │   ├── logger.ts      # Logging
│   │   └── templates.ts   # Template handling
│   └── templates/         # Module templates
│       ├── basic/
│       ├── crm/
│       ├── booking/
│       └── ecommerce/
└── README.md
```

---

### Task 2: Package Configuration (30 min)

```json
// dramac-cli/package.json
{
  "name": "dramac-cli",
  "version": "1.0.0",
  "description": "CLI tool for building Dramac modules",
  "bin": {
    "dramac": "./bin/dramac.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "bin",
    "dist",
    "templates"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "prepare": "npm run build"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "inquirer": "^9.2.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "cosmiconfig": "^9.0.0",
    "fs-extra": "^11.2.0",
    "glob": "^10.3.0",
    "semver": "^7.6.0",
    "archiver": "^6.0.0",
    "form-data": "^4.0.0",
    "node-fetch": "^3.3.0",
    "dotenv": "^16.4.0",
    "handlebars": "^4.7.0",
    "chokidar": "^3.6.0",
    "express": "^4.18.0",
    "vite": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/inquirer": "^9.0.0",
    "@types/fs-extra": "^11.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "dramac",
    "modules",
    "cli",
    "developer-tools"
  ]
}
```

```javascript
// dramac-cli/bin/dramac.js
#!/usr/bin/env node

import('../dist/index.js').catch(console.error);
```

---

### Task 3: Main CLI Entry Point (1 hour)

```typescript
// dramac-cli/src/index.ts

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
import { devCommand } from './commands/dev';
import { buildCommand } from './commands/build';
import { deployCommand } from './commands/deploy';
import { validateCommand } from './commands/validate';
import { versionCommand } from './commands/version';
import { loginCommand } from './commands/login';

const program = new Command();

// ASCII art banner
const banner = `
${chalk.cyan('╔════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('🚀 Dramac CLI')}                         ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('Build powerful modules for Dramac')}      ${chalk.cyan('║')}
${chalk.cyan('╚════════════════════════════════════════╝')}
`;

program
  .name('dramac')
  .description('CLI for building and deploying Dramac modules')
  .version('1.0.0')
  .addHelpText('beforeAll', banner);

// Register commands
program.addCommand(createCommand);
program.addCommand(devCommand);
program.addCommand(buildCommand);
program.addCommand(deployCommand);
program.addCommand(validateCommand);
program.addCommand(versionCommand);
program.addCommand(loginCommand);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
```

---

### Task 4: Create Command (2 hours)

```typescript
// dramac-cli/src/commands/create.ts

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import { glob } from 'glob';

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
        validate: (input) => {
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
      // Copy template
      const templateDir = path.join(__dirname, '..', 'templates', template);
      await fs.copy(templateDir, outputDir);
      
      // Process template variables
      const context = {
        moduleName,
        moduleId: moduleName,
        displayName: answers.displayName,
        description: answers.description,
        category: answers.category,
        hasDashboard: answers.hasDashboard,
        hasSettings: answers.hasSettings,
        hasApi: answers.hasApi,
        year: new Date().getFullYear()
      };
      
      // Find and process all template files
      const files = await glob('**/*.hbs', { cwd: outputDir });
      
      for (const file of files) {
        const filePath = path.join(outputDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const compiled = Handlebars.compile(content);
        const result = compiled(context);
        
        // Write without .hbs extension
        const newPath = filePath.replace('.hbs', '');
        await fs.writeFile(newPath, result);
        await fs.remove(filePath);
      }
      
      // Rename package.json if it was a template
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
          const { execSync } = await import('child_process');
          execSync('git init', { cwd: outputDir, stdio: 'ignore' });
          execSync('git add .', { cwd: outputDir, stdio: 'ignore' });
          execSync('git commit -m "Initial commit"', { cwd: outputDir, stdio: 'ignore' });
          gitSpinner.succeed('Git initialized');
        } catch {
          gitSpinner.fail('Git initialization failed');
        }
      }
      
      // Install dependencies
      if (options.install !== false) {
        const installSpinner = ora('Installing dependencies...').start();
        try {
          const { execSync } = await import('child_process');
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

function toTitleCase(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
```

---

### Task 5: Dev Command (1 hour)

```typescript
// dramac-cli/src/commands/dev.ts

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import chokidar from 'chokidar';
import { loadConfig } from '../utils/config';

export const devCommand = new Command('dev')
  .description('Start local development server')
  .option('-p, --port <port>', 'Server port', '3001')
  .option('--host', 'Expose to network')
  .option('--open', 'Open browser')
  .action(async (options) => {
    const cwd = process.cwd();
    const configPath = path.join(cwd, 'dramac.config.ts');
    
    // Check for config file
    if (!fs.existsSync(configPath)) {
      console.error(chalk.red('❌ dramac.config.ts not found'));
      console.log('');
      console.log('Make sure you are in a Dramac module directory.');
      console.log('Run ' + chalk.cyan('dramac create') + ' to create a new module.');
      process.exit(1);
    }
    
    const spinner = ora('Loading configuration...').start();
    
    try {
      const config = await loadConfig(cwd);
      spinner.succeed(`Loaded ${chalk.cyan(config.name)}`);
      
      // Create Express app
      const app = express();
      const port = parseInt(options.port);
      
      // Create Vite server
      const vite = await createViteServer({
        root: cwd,
        server: { 
          middlewareMode: true,
          hmr: true
        },
        appType: 'custom'
      });
      
      app.use(vite.middlewares);
      
      // Mock Supabase client for local dev
      app.use('/api/supabase', (req, res) => {
        res.json({
          url: 'http://localhost:54321',
          anonKey: 'local-dev-key'
        });
      });
      
      // Mock module API endpoints
      app.use('/api/modules/:moduleId/*', async (req, res) => {
        const apiPath = req.path.replace(`/api/modules/${req.params.moduleId}`, '');
        
        console.log(chalk.gray(`→ ${req.method} ${apiPath}`));
        
        // Try to load local handler
        const handlerFile = path.join(cwd, 'src', 'api', `${apiPath}.ts`);
        
        if (fs.existsSync(handlerFile)) {
          try {
            const module = await vite.ssrLoadModule(handlerFile);
            const handler = module[req.method.toLowerCase()];
            
            if (handler) {
              const body = req.method !== 'GET' ? await parseBody(req) : null;
              const result = await handler({
                body,
                params: req.params,
                query: req.query,
                db: createMockDb(),
                user: { id: 'dev-user-id' },
                site: { id: 'dev-site-id' }
              });
              
              return res.json(result);
            }
          } catch (error: any) {
            console.error(chalk.red(`Handler error: ${error.message}`));
            return res.status(500).json({ error: error.message });
          }
        }
        
        res.status(404).json({ error: 'Not found' });
      });
      
      // Serve module preview
      app.get('*', async (req, res) => {
        try {
          let html = fs.readFileSync(
            path.join(cwd, 'index.html'),
            'utf-8'
          );
          
          html = await vite.transformIndexHtml(req.url, html);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        } catch (error: any) {
          vite.ssrFixStacktrace(error);
          console.error(error);
          res.status(500).end(error.message);
        }
      });
      
      // Watch config file
      chokidar.watch(configPath).on('change', async () => {
        console.log(chalk.yellow('⚡ Config changed, reloading...'));
        // Could trigger HMR here
      });
      
      // Start server
      const host = options.host ? '0.0.0.0' : 'localhost';
      
      app.listen(port, host, () => {
        console.log('');
        console.log(chalk.cyan('╔═══════════════════════════════════════════╗'));
        console.log(chalk.cyan('║') + chalk.bold.white('  🚀 Dramac Dev Server                     ') + chalk.cyan('║'));
        console.log(chalk.cyan('╠═══════════════════════════════════════════╣'));
        console.log(chalk.cyan('║') + `  Module:  ${chalk.green(config.name)}`.padEnd(42) + chalk.cyan('║'));
        console.log(chalk.cyan('║') + `  Version: ${chalk.gray(config.version)}`.padEnd(42) + chalk.cyan('║'));
        console.log(chalk.cyan('╠═══════════════════════════════════════════╣'));
        console.log(chalk.cyan('║') + `  Local:   ${chalk.cyan(`http://localhost:${port}`)}`.padEnd(42) + chalk.cyan('║'));
        if (options.host) {
          console.log(chalk.cyan('║') + `  Network: ${chalk.cyan(`http://${getLocalIp()}:${port}`)}`.padEnd(42) + chalk.cyan('║'));
        }
        console.log(chalk.cyan('╠═══════════════════════════════════════════╣'));
        console.log(chalk.cyan('║') + chalk.gray('  Press Ctrl+C to stop                     ') + chalk.cyan('║'));
        console.log(chalk.cyan('╚═══════════════════════════════════════════╝'));
        console.log('');
        
        if (options.open) {
          import('open').then(open => open.default(`http://localhost:${port}`));
        }
      });
      
    } catch (error) {
      spinner.fail('Failed to start dev server');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

function parseBody(req: express.Request): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(body);
      }
    });
  });
}

function createMockDb() {
  const data: Record<string, any[]> = {};
  
  return {
    from: (table: string) => ({
      select: () => ({ data: data[table] || [], error: null }),
      insert: (record: any) => {
        data[table] = [...(data[table] || []), { id: crypto.randomUUID(), ...record }];
        return { data: record, error: null };
      },
      update: (record: any) => ({ data: record, error: null }),
      delete: () => ({ error: null })
    })
  };
}

function getLocalIp(): string {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  
  return 'localhost';
}
```

---

### Task 6: Build & Deploy Commands (1.5 hours)

```typescript
// dramac-cli/src/commands/build.ts

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { build } from 'vite';
import archiver from 'archiver';
import { loadConfig } from '../utils/config';

export const buildCommand = new Command('build')
  .description('Build module for production')
  .option('--sourcemap', 'Generate source maps')
  .option('--analyze', 'Analyze bundle size')
  .action(async (options) => {
    const cwd = process.cwd();
    const spinner = ora('Building module...').start();
    
    try {
      const config = await loadConfig(cwd);
      
      // Clean dist folder
      await fs.remove(path.join(cwd, 'dist'));
      
      // Build with Vite
      await build({
        root: cwd,
        build: {
          outDir: 'dist',
          sourcemap: options.sourcemap,
          rollupOptions: {
            external: [
              'react',
              'react-dom',
              '@supabase/supabase-js',
              '@dramac/sdk'
            ]
          }
        }
      });
      
      // Copy config
      await fs.copy(
        path.join(cwd, 'dramac.config.ts'),
        path.join(cwd, 'dist', 'dramac.config.ts')
      );
      
      // Generate manifest
      const manifest = {
        id: config.id,
        name: config.name,
        version: config.version,
        description: config.description,
        category: config.category,
        type: config.type,
        buildTime: new Date().toISOString(),
        files: await listFiles(path.join(cwd, 'dist'))
      };
      
      await fs.writeJson(
        path.join(cwd, 'dist', 'manifest.json'),
        manifest,
        { spaces: 2 }
      );
      
      // Create bundle
      const bundlePath = path.join(cwd, `${config.id}-${config.version}.dramac`);
      await createBundle(path.join(cwd, 'dist'), bundlePath);
      
      const bundleSize = (await fs.stat(bundlePath)).size;
      
      spinner.succeed('Build complete!');
      console.log('');
      console.log('  Output:');
      console.log(`  ${chalk.gray('├──')} dist/          ${chalk.cyan('Build files')}`);
      console.log(`  ${chalk.gray('└──')} ${path.basename(bundlePath)}  ${chalk.cyan(formatSize(bundleSize))}`);
      console.log('');
      console.log(`Run ${chalk.cyan('dramac deploy')} to publish to marketplace.`);
      console.log('');
      
    } catch (error) {
      spinner.fail('Build failed');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

async function listFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)).map(f => path.join(entry.name, f)));
    } else {
      files.push(entry.name);
    }
  }
  
  return files;
}

async function createBundle(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', resolve);
    archive.on('error', reject);
    
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
```

```typescript
// dramac-cli/src/commands/deploy.ts

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import FormData from 'form-data';
import { loadConfig } from '../utils/config';
import { getAuthToken, isAuthenticated } from '../utils/auth';
import { apiClient } from '../utils/api';

export const deployCommand = new Command('deploy')
  .description('Deploy module to marketplace')
  .option('--beta', 'Deploy as beta version')
  .option('--private', 'Deploy as private (agency only)')
  .option('--skip-build', 'Skip build step')
  .action(async (options) => {
    const cwd = process.cwd();
    
    // Check authentication
    if (!isAuthenticated()) {
      console.log(chalk.yellow('⚠️ Not logged in'));
      console.log(`Run ${chalk.cyan('dramac login')} first.`);
      process.exit(1);
    }
    
    try {
      const config = await loadConfig(cwd);
      
      console.log('');
      console.log(chalk.bold(`📦 Deploy ${config.name} v${config.version}`));
      console.log('');
      
      // Find bundle or build
      const bundlePath = path.join(cwd, `${config.id}-${config.version}.dramac`);
      
      if (!fs.existsSync(bundlePath)) {
        if (options.skipBuild) {
          console.error(chalk.red('Bundle not found. Run build first.'));
          process.exit(1);
        }
        
        // Run build
        const { execSync } = await import('child_process');
        execSync('dramac build', { cwd, stdio: 'inherit' });
      }
      
      // Confirm deployment
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: options.beta
            ? `Deploy ${config.name} v${config.version} as BETA?`
            : `Deploy ${config.name} v${config.version} to marketplace?`,
          default: true
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('Deployment cancelled.'));
        return;
      }
      
      const spinner = ora('Uploading bundle...').start();
      
      // Upload to API
      const form = new FormData();
      form.append('bundle', fs.createReadStream(bundlePath));
      form.append('config', JSON.stringify(config));
      form.append('beta', String(options.beta || false));
      form.append('private', String(options.private || false));
      
      const response = await apiClient.post('/modules/deploy', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      spinner.succeed('Deployed successfully!');
      
      console.log('');
      console.log(chalk.green('✅ Module deployed!'));
      console.log('');
      console.log('  Module ID:  ' + chalk.cyan(response.data.moduleId));
      console.log('  Version:    ' + chalk.cyan(response.data.version));
      console.log('  Status:     ' + chalk.yellow(options.beta ? 'BETA' : 'PUBLISHED'));
      console.log('');
      console.log('  Marketplace URL:');
      console.log(`  ${chalk.cyan(response.data.marketplaceUrl)}`);
      console.log('');
      
    } catch (error: any) {
      console.error(chalk.red('Deployment failed:'), error.message);
      process.exit(1);
    }
  });
```

---

### Task 7: Validate Command (1 hour)

```typescript
// dramac-cli/src/commands/validate.ts

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { loadConfig } from '../utils/config';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateCommand = new Command('validate')
  .description('Validate module configuration')
  .option('--strict', 'Fail on warnings')
  .action(async (options) => {
    const cwd = process.cwd();
    const spinner = ora('Validating module...').start();
    
    try {
      const result = await validateModule(cwd);
      
      if (result.valid && result.warnings.length === 0) {
        spinner.succeed('Module is valid!');
        console.log('');
        console.log(chalk.green('✅ All checks passed'));
        console.log('');
        return;
      }
      
      if (result.errors.length > 0) {
        spinner.fail('Validation failed');
        console.log('');
        console.log(chalk.red.bold('Errors:'));
        result.errors.forEach(e => console.log(chalk.red(`  ✗ ${e}`)));
      } else {
        spinner.succeed('Module is valid');
      }
      
      if (result.warnings.length > 0) {
        console.log('');
        console.log(chalk.yellow.bold('Warnings:'));
        result.warnings.forEach(w => console.log(chalk.yellow(`  ⚠ ${w}`)));
      }
      
      console.log('');
      
      if (options.strict && result.warnings.length > 0) {
        process.exit(1);
      }
      
      if (result.errors.length > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      spinner.fail('Validation failed');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

async function validateModule(cwd: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Check config file exists
  const configPath = path.join(cwd, 'dramac.config.ts');
  if (!fs.existsSync(configPath)) {
    errors.push('dramac.config.ts not found');
    return { valid: false, errors, warnings };
  }
  
  // 2. Load and validate config
  let config: any;
  try {
    config = await loadConfig(cwd);
  } catch (error: any) {
    errors.push(`Config parse error: ${error.message}`);
    return { valid: false, errors, warnings };
  }
  
  // 3. Required fields
  if (!config.id) errors.push('Missing required field: id');
  if (!config.name) errors.push('Missing required field: name');
  if (!config.version) errors.push('Missing required field: version');
  if (!config.description) warnings.push('Missing description');
  
  // 4. ID format (must match module naming convention)
  if (config.id && !/^[a-z][a-z0-9-]*[a-z0-9]$/.test(config.id)) {
    errors.push('Invalid module ID format (must be lowercase, alphanumeric with hyphens)');
  }
  
  // 5. Version format
  if (config.version && !/^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/.test(config.version)) {
    errors.push('Invalid version format (must be semver)');
  }
  
  // 6. Entry points exist
  if (config.entry) {
    const entries = ['dashboard', 'settings', 'embed', 'api'];
    for (const entry of entries) {
      if (config.entry[entry]) {
        const entryPath = path.join(cwd, config.entry[entry]);
        if (!fs.existsSync(entryPath)) {
          errors.push(`Entry point not found: ${config.entry[entry]}`);
        }
      }
    }
  }
  
  // 7. Database tables (check naming convention)
  if (config.database?.tables) {
    for (const table of config.database.tables) {
      // Tables should not start with reserved prefixes
      if (table.name.startsWith('auth_') || table.name.startsWith('storage_')) {
        errors.push(`Table name "${table.name}" uses reserved prefix`);
      }
      
      // Recommend site_id for multi-tenancy
      const hasSiteId = table.columns?.some((c: any) => c.name === 'site_id');
      if (!hasSiteId) {
        warnings.push(`Table "${table.name}" missing site_id column (required for multi-tenancy)`);
      }
    }
  }
  
  // 8. Check for package.json
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    warnings.push('package.json not found');
  } else {
    const pkg = await fs.readJson(pkgPath);
    
    // Check dependencies
    const requiredDeps = ['@dramac/sdk'];
    for (const dep of requiredDeps) {
      if (!pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]) {
        warnings.push(`Missing recommended dependency: ${dep}`);
      }
    }
  }
  
  // 9. Check for README
  if (!fs.existsSync(path.join(cwd, 'README.md'))) {
    warnings.push('README.md not found (recommended for marketplace)');
  }
  
  // 10. Check for LICENSE
  if (!fs.existsSync(path.join(cwd, 'LICENSE'))) {
    warnings.push('LICENSE file not found');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

### Task 8: Login & Auth Commands (1 hour)

```typescript
// dramac-cli/src/commands/login.ts

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { saveAuthToken, getAuthToken, clearAuthToken } from '../utils/auth';
import { apiClient } from '../utils/api';

export const loginCommand = new Command('login')
  .description('Authenticate with Dramac')
  .option('--token <token>', 'Use API token directly')
  .action(async (options) => {
    console.log('');
    console.log(chalk.bold('🔐 Login to Dramac'));
    console.log('');
    
    // Check if already logged in
    const existingToken = getAuthToken();
    if (existingToken) {
      const { logout } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'logout',
          message: 'Already logged in. Log out and log in again?',
          default: false
        }
      ]);
      
      if (!logout) {
        console.log(chalk.gray('Keeping existing session.'));
        return;
      }
      
      clearAuthToken();
    }
    
    let token: string;
    
    if (options.token) {
      token = options.token;
    } else {
      // Interactive login
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'method',
          message: 'Login method:',
          choices: [
            { name: '🌐 Browser (recommended)', value: 'browser' },
            { name: '🔑 API Token', value: 'token' }
          ]
        }
      ]);
      
      if (answers.method === 'browser') {
        // Generate login URL
        const loginUrl = 'https://dramac.io/cli-auth';
        console.log('');
        console.log('Opening browser...');
        console.log(chalk.gray(`If browser doesn't open, visit: ${loginUrl}`));
        console.log('');
        
        try {
          const open = await import('open');
          await open.default(loginUrl);
        } catch {
          // Browser didn't open
        }
        
        const { code } = await inquirer.prompt([
          {
            type: 'input',
            name: 'code',
            message: 'Enter the code from the browser:'
          }
        ]);
        
        // Exchange code for token
        const spinner = ora('Authenticating...').start();
        
        try {
          const response = await apiClient.post('/auth/cli-exchange', { code });
          token = response.data.token;
          spinner.succeed('Authenticated!');
        } catch (error) {
          spinner.fail('Authentication failed');
          console.error(chalk.red('Invalid code. Please try again.'));
          return;
        }
      } else {
        const { apiToken } = await inquirer.prompt([
          {
            type: 'password',
            name: 'apiToken',
            message: 'Enter your API token:',
            mask: '*'
          }
        ]);
        
        token = apiToken;
      }
    }
    
    // Verify token
    const spinner = ora('Verifying...').start();
    
    try {
      const response = await apiClient.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      saveAuthToken(token);
      
      spinner.succeed('Login successful!');
      console.log('');
      console.log(`Welcome, ${chalk.cyan(response.data.name || response.data.email)}!`);
      console.log('');
      console.log('You can now deploy modules with ' + chalk.cyan('dramac deploy'));
      console.log('');
      
    } catch (error) {
      spinner.fail('Invalid token');
      process.exit(1);
    }
  });

// Logout subcommand
loginCommand
  .command('logout')
  .description('Log out from Dramac')
  .action(() => {
    clearAuthToken();
    console.log(chalk.green('✅ Logged out successfully'));
  });

// Status subcommand
loginCommand
  .command('status')
  .description('Check login status')
  .action(async () => {
    const token = getAuthToken();
    
    if (!token) {
      console.log(chalk.yellow('Not logged in'));
      console.log(`Run ${chalk.cyan('dramac login')} to authenticate.`);
      return;
    }
    
    const spinner = ora('Checking...').start();
    
    try {
      const response = await apiClient.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      spinner.succeed('Logged in');
      console.log('');
      console.log('  User:   ' + chalk.cyan(response.data.email));
      console.log('  Agency: ' + chalk.cyan(response.data.agencyName || 'Personal'));
      console.log('');
      
    } catch {
      spinner.fail('Session expired');
      clearAuthToken();
      console.log(`Run ${chalk.cyan('dramac login')} to authenticate.`);
    }
  });
```

---

### Task 9: Utility Functions (30 min)

```typescript
// dramac-cli/src/utils/config.ts

import path from 'path';
import { cosmiconfig } from 'cosmiconfig';
import { register } from 'esbuild-register/dist/node';

export interface DramacConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  category?: string;
  type?: 'app' | 'custom' | 'system';
  entry?: {
    dashboard?: string;
    settings?: string;
    embed?: string;
    api?: string;
  };
  database?: {
    tables: any[];
    migrations?: string;
  };
  permissions?: any[];
  roles?: any[];
  routes?: any[];
}

export async function loadConfig(cwd: string): Promise<DramacConfig> {
  // Register TypeScript support
  register();
  
  const configPath = path.join(cwd, 'dramac.config.ts');
  
  // Import the config file
  const module = await import(configPath);
  const config = module.default || module;
  
  // Validate required fields
  if (!config.id || !config.name || !config.version) {
    throw new Error('Config must have id, name, and version');
  }
  
  return config;
}
```

```typescript
// dramac-cli/src/utils/auth.ts

import path from 'path';
import os from 'os';
import fs from 'fs-extra';

const CONFIG_DIR = path.join(os.homedir(), '.dramac');
const TOKEN_FILE = path.join(CONFIG_DIR, 'token');

export function getAuthToken(): string | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export function saveAuthToken(token: string): void {
  fs.ensureDirSync(CONFIG_DIR);
  fs.writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
}

export function clearAuthToken(): void {
  try {
    fs.removeSync(TOKEN_FILE);
  } catch {
    // Ignore errors
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}
```

```typescript
// dramac-cli/src/utils/api.ts

import fetch from 'node-fetch';

const API_BASE = process.env.DRAMAC_API_URL || 'https://api.dramac.io';

export const apiClient = {
  async get(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    return {
      data: await response.json(),
      status: response.status
    };
  },
  
  async post(path: string, body: any, options: RequestInit = {}) {
    const isFormData = body instanceof FormData;
    
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      method: 'POST',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers
      },
      body: isFormData ? body : JSON.stringify(body)
    });
    
    return {
      data: await response.json(),
      status: response.status
    };
  }
};
```

---

## 📦 Basic Module Template

```
templates/basic/
├── dramac.config.ts.hbs
├── package.json.hbs
├── tsconfig.json
├── index.html.hbs
├── README.md.hbs
├── src/
│   ├── main.tsx.hbs
│   ├── Dashboard.tsx.hbs
│   ├── Settings.tsx.hbs
│   └── api/
│       └── index.ts.hbs
└── .gitignore
```

```typescript
// templates/basic/dramac.config.ts.hbs
import { defineModule } from '@dramac/sdk';

export default defineModule({
  id: '{{moduleId}}',
  name: '{{displayName}}',
  version: '1.0.0',
  description: '{{description}}',
  icon: 'Package',
  category: '{{category}}',
  type: 'app',

  entry: {
    {{#if hasDashboard}}
    dashboard: './src/Dashboard.tsx',
    {{/if}}
    {{#if hasSettings}}
    settings: './src/Settings.tsx',
    {{/if}}
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
```

---

## ✅ Verification Checklist

- [ ] `dramac create` scaffolds new module
- [ ] `dramac dev` starts local server with HMR
- [ ] `dramac build` creates production bundle
- [ ] `dramac validate` catches config errors
- [ ] `dramac deploy` uploads to marketplace
- [ ] `dramac login` handles authentication
- [ ] Templates work correctly
- [ ] Error messages are helpful

---

## 📍 Dependencies

- **Requires**: EM-01, EM-05, EM-20 (SDK)
- **Required by**: All module development workflows
