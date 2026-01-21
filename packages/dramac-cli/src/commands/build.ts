import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { build } from 'vite';
import archiver from 'archiver';
import { loadConfig } from '../utils/config.js';

export const buildCommand = new Command('build')
  .description('Build module for production')
  .option('--sourcemap', 'Generate source maps')
  .option('--analyze', 'Analyze bundle size')
  .option('--no-bundle', 'Skip creating .dramac bundle')
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
            ],
            output: {
              globals: {
                'react': 'React',
                'react-dom': 'ReactDOM',
                '@supabase/supabase-js': 'supabase',
                '@dramac/sdk': 'DramacSDK'
              }
            }
          }
        },
        logLevel: 'warn'
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
        icon: config.icon,
        entry: config.entry,
        permissions: config.permissions,
        roles: config.roles,
        database: config.database ? {
          tables: config.database.tables?.map(t => t.name)
        } : undefined,
        buildTime: new Date().toISOString(),
        files: await listFiles(path.join(cwd, 'dist'))
      };
      
      await fs.writeJson(
        path.join(cwd, 'dist', 'manifest.json'),
        manifest,
        { spaces: 2 }
      );
      
      spinner.succeed('Build complete!');
      
      // Create bundle
      if (options.bundle !== false) {
        const bundleSpinner = ora('Creating bundle...').start();
        
        const bundlePath = path.join(cwd, `${config.id}-${config.version}.dramac`);
        await createBundle(path.join(cwd, 'dist'), bundlePath);
        
        const bundleSize = (await fs.stat(bundlePath)).size;
        bundleSpinner.succeed(`Bundle created: ${formatSize(bundleSize)}`);
        
        console.log('');
        console.log('  Output:');
        console.log(`  ${chalk.gray('├──')} dist/          ${chalk.cyan('Build files')}`);
        console.log(`  ${chalk.gray('└──')} ${path.basename(bundlePath)}  ${chalk.cyan(formatSize(bundleSize))}`);
      } else {
        console.log('');
        console.log('  Output:');
        console.log(`  ${chalk.gray('└──')} dist/          ${chalk.cyan('Build files')}`);
      }
      
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
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await listFiles(fullPath);
      files.push(...subFiles.map(f => path.join(entry.name, f)));
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
    
    output.on('close', () => resolve());
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
