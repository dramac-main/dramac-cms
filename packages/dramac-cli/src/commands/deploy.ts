import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import FormData from 'form-data';
import { execSync } from 'child_process';
import { loadConfig } from '../utils/config.js';
import { getAuthToken, isAuthenticated } from '../utils/auth.js';
import { apiClient } from '../utils/api.js';

export const deployCommand = new Command('deploy')
  .description('Deploy module to marketplace')
  .option('--beta', 'Deploy as beta version')
  .option('--private', 'Deploy as private (agency only)')
  .option('--skip-build', 'Skip build step')
  .option('--skip-validate', 'Skip validation step')
  .option('-y, --yes', 'Skip confirmation prompt')
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
      
      // Validate first
      if (!options.skipValidate) {
        const validateSpinner = ora('Validating module...').start();
        
        const validation = await validateForDeploy(cwd, config);
        
        if (validation.errors.length > 0) {
          validateSpinner.fail('Validation failed');
          console.log('');
          console.log(chalk.red.bold('Errors:'));
          validation.errors.forEach(e => console.log(chalk.red(`  ✗ ${e}`)));
          console.log('');
          console.log(`Fix these errors and try again, or use ${chalk.cyan('--skip-validate')} to skip.`);
          process.exit(1);
        }
        
        if (validation.warnings.length > 0) {
          validateSpinner.warn('Validation passed with warnings');
          console.log('');
          console.log(chalk.yellow.bold('Warnings:'));
          validation.warnings.forEach(w => console.log(chalk.yellow(`  ⚠ ${w}`)));
          console.log('');
        } else {
          validateSpinner.succeed('Validation passed');
        }
      }
      
      // Find bundle or build
      const bundlePath = path.join(cwd, `${config.id}-${config.version}.dramac`);
      
      if (!fs.existsSync(bundlePath)) {
        if (options.skipBuild) {
          console.error(chalk.red('Bundle not found. Run build first or remove --skip-build.'));
          process.exit(1);
        }
        
        console.log(chalk.gray('Bundle not found, building...'));
        console.log('');
        
        // Run build
        execSync('dramac build', { cwd, stdio: 'inherit' });
        console.log('');
      }
      
      // Confirm deployment
      if (!options.yes) {
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
      }
      
      const spinner = ora('Uploading bundle...').start();
      
      // Upload to API
      const form = new FormData();
      form.append('bundle', fs.createReadStream(bundlePath));
      form.append('config', JSON.stringify(config));
      form.append('beta', String(options.beta || false));
      form.append('private', String(options.private || false));
      
      const token = getAuthToken();
      
      const response = await apiClient.post('/modules/deploy', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok || response.data.error) {
        throw new Error(response.data.error || 'Deployment failed');
      }
      
      spinner.succeed('Deployed successfully!');
      
      console.log('');
      console.log(chalk.green('✅ Module deployed!'));
      console.log('');
      console.log('  Module ID:  ' + chalk.cyan(response.data.moduleId || config.id));
      console.log('  Version:    ' + chalk.cyan(response.data.version || config.version));
      console.log('  Status:     ' + chalk.yellow(options.beta ? 'BETA' : 'PUBLISHED'));
      
      if (response.data.marketplaceUrl) {
        console.log('');
        console.log('  Marketplace URL:');
        console.log(`  ${chalk.cyan(response.data.marketplaceUrl)}`);
      }
      
      console.log('');
      
    } catch (error: any) {
      console.error(chalk.red('Deployment failed:'), error.message);
      process.exit(1);
    }
  });

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

async function validateForDeploy(cwd: string, config: any): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields for deployment
  if (!config.id) errors.push('Missing required field: id');
  if (!config.name) errors.push('Missing required field: name');
  if (!config.version) errors.push('Missing required field: version');
  if (!config.description) warnings.push('Missing description (recommended for marketplace)');
  if (!config.category) warnings.push('Missing category (required for marketplace listing)');
  
  // ID format
  if (config.id && !/^[a-z][a-z0-9-]*[a-z0-9]$/.test(config.id)) {
    errors.push('Invalid module ID format (must be lowercase, start with letter, alphanumeric with hyphens)');
  }
  
  // Version format
  if (config.version && !/^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/.test(config.version)) {
    errors.push('Invalid version format (must be semver, e.g., 1.0.0 or 1.0.0-beta.1)');
  }
  
  // Check for README
  if (!fs.existsSync(path.join(cwd, 'README.md'))) {
    warnings.push('README.md not found (recommended for marketplace)');
  }
  
  // Check for dist folder
  if (!fs.existsSync(path.join(cwd, 'dist'))) {
    // Will be built
  }
  
  return { errors, warnings };
}
