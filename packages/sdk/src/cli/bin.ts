#!/usr/bin/env node
/**
 * @dramac/sdk - CLI Entry Point
 * 
 * Main CLI binary for the Dramac SDK
 */

import { Command } from 'commander';
import { initModule } from './init';
import { startDevServer } from './dev';
import { deployModule, validateModule } from './deploy';

const program = new Command();

program
  .name('dramac')
  .description('Dramac Module SDK CLI')
  .version('1.0.0');

// Init command
program
  .command('init <name>')
  .description('Create a new Dramac module')
  .option('-t, --template <template>', 'Module template (basic, crm, booking)', 'basic')
  .option('-d, --directory <dir>', 'Directory to create module in', process.cwd())
  .option('--description <description>', 'Module description')
  .option('--author <author>', 'Module author')
  .action(async (name, options) => {
    try {
      await initModule({
        name,
        template: options.template,
        directory: options.directory,
        description: options.description,
        author: options.author,
      });
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Dev command
program
  .command('dev')
  .description('Start the local development server')
  .option('-p, --port <port>', 'Port to run the dev server on', '3001')
  .option('-d, --directory <dir>', 'Module directory', process.cwd())
  .option('-o, --open', 'Open browser automatically')
  .action(async (options) => {
    try {
      await startDevServer({
        port: parseInt(options.port),
        moduleDir: options.directory,
        open: options.open,
      });
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy the module to Dramac')
  .option('-e, --environment <env>', 'Target environment (development, staging, production)', 'development')
  .option('-d, --directory <dir>', 'Module directory', process.cwd())
  .option('--api-key <key>', 'Dramac API key (or set DRAMAC_API_KEY env var)')
  .option('--api-url <url>', 'Dramac API URL (or set DRAMAC_API_URL env var)')
  .option('--dry-run', 'Simulate deployment without making changes')
  .action(async (options) => {
    try {
      const result = await deployModule({
        moduleDir: options.directory,
        environment: options.environment,
        apiKey: options.apiKey,
        apiUrl: options.apiUrl,
        dryRun: options.dryRun,
      });

      if (!result.success) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate the module configuration')
  .option('-d, --directory <dir>', 'Module directory', process.cwd())
  .action(async (options) => {
    try {
      console.log('');
      console.log('🔍 Validating module...');
      console.log('');

      const result = await validateModule(options.directory);

      if (result.errors.length > 0) {
        console.log('❌ Errors:');
        for (const error of result.errors) {
          console.log(`   - ${error}`);
        }
        console.log('');
      }

      if (result.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        for (const warning of result.warnings) {
          console.log(`   - ${warning}`);
        }
        console.log('');
      }

      if (result.valid) {
        console.log('✅ Module is valid and ready for deployment!');
      } else {
        console.log('❌ Module validation failed. Please fix the errors above.');
        process.exit(1);
      }
      console.log('');
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Build command (wrapper around tsup)
program
  .command('build')
  .description('Build the module for production')
  .option('-d, --directory <dir>', 'Module directory', process.cwd())
  .action(async (options) => {
    console.log('');
    console.log('📦 Building module...');
    console.log('');
    console.log('   Run: npm run build');
    console.log('');
    console.log('   This will use tsup to bundle your module.');
    console.log('');
  });

program.parse();
