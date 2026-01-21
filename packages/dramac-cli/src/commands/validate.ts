import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { loadConfig } from '../utils/config.js';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateCommand = new Command('validate')
  .description('Validate module configuration')
  .option('--strict', 'Fail on warnings')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const cwd = process.cwd();
    const spinner = ora('Validating module...').start();
    
    try {
      const result = await validateModule(cwd);
      
      // JSON output
      if (options.json) {
        spinner.stop();
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.valid ? 0 : 1);
      }
      
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
  if (config.id) {
    if (config.id.length < 3) {
      errors.push('Module ID must be at least 3 characters');
    } else if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(config.id)) {
      errors.push('Invalid module ID format (must be lowercase, start with letter, alphanumeric with hyphens)');
    }
  }
  
  // 5. Version format
  if (config.version && !/^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/.test(config.version)) {
    errors.push('Invalid version format (must be semver)');
  }
  
  // 6. Type validation
  if (config.type && !['app', 'custom', 'system'].includes(config.type)) {
    errors.push(`Invalid module type: "${config.type}" (must be app, custom, or system)`);
  }
  
  // 7. Entry points exist
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
  } else {
    warnings.push('No entry points defined');
  }
  
  // 8. Database tables (check naming convention)
  if (config.database?.tables) {
    for (const table of config.database.tables) {
      if (!table.name) {
        errors.push('Database table missing name');
        continue;
      }
      
      // Tables should not start with reserved prefixes
      if (table.name.startsWith('auth_') || table.name.startsWith('storage_')) {
        errors.push(`Table name "${table.name}" uses reserved prefix`);
      }
      
      // Tables should not use system table names
      const reservedNames = ['users', 'sites', 'profiles', 'subscriptions', 'modules'];
      if (reservedNames.includes(table.name)) {
        errors.push(`Table name "${table.name}" is reserved`);
      }
      
      // Recommend site_id for multi-tenancy
      if (table.columns) {
        const hasSiteId = table.columns.some((c: any) => c.name === 'site_id');
        if (!hasSiteId) {
          warnings.push(`Table "${table.name}" missing site_id column (required for multi-tenancy)`);
        }
      }
    }
  }
  
  // 9. Permissions validation
  if (config.permissions) {
    const permissionKeys = new Set<string>();
    for (const perm of config.permissions) {
      if (!perm.key) {
        errors.push('Permission missing key');
        continue;
      }
      if (permissionKeys.has(perm.key)) {
        errors.push(`Duplicate permission key: ${perm.key}`);
      }
      permissionKeys.add(perm.key);
      
      if (!perm.name) {
        warnings.push(`Permission "${perm.key}" missing name`);
      }
    }
  }
  
  // 10. Roles validation
  if (config.roles) {
    const roleSlugs = new Set<string>();
    let hasDefault = false;
    
    for (const role of config.roles) {
      if (!role.slug) {
        errors.push('Role missing slug');
        continue;
      }
      if (roleSlugs.has(role.slug)) {
        errors.push(`Duplicate role slug: ${role.slug}`);
      }
      roleSlugs.add(role.slug);
      
      if (!role.name) {
        warnings.push(`Role "${role.slug}" missing name`);
      }
      
      if (typeof role.hierarchyLevel !== 'number') {
        errors.push(`Role "${role.slug}" missing hierarchyLevel`);
      }
      
      if (role.isDefault) hasDefault = true;
    }
    
    if (!hasDefault && config.roles.length > 0) {
      warnings.push('No default role defined (isDefault: true)');
    }
  }
  
  // 11. Check for package.json
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    warnings.push('package.json not found');
  } else {
    const pkg = await fs.readJson(pkgPath);
    
    // Check dependencies
    const requiredDeps = ['@dramac/sdk'];
    for (const dep of requiredDeps) {
      if (!pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep] && !pkg.peerDependencies?.[dep]) {
        warnings.push(`Missing recommended dependency: ${dep}`);
      }
    }
    
    // Check for peer dependencies that should be external
    const shouldBePeer = ['react', 'react-dom'];
    for (const dep of shouldBePeer) {
      if (pkg.dependencies?.[dep] && !pkg.peerDependencies?.[dep]) {
        warnings.push(`"${dep}" should be a peerDependency, not a dependency`);
      }
    }
  }
  
  // 12. Check for README
  if (!fs.existsSync(path.join(cwd, 'README.md'))) {
    warnings.push('README.md not found (recommended for marketplace)');
  }
  
  // 13. Check for LICENSE
  if (!fs.existsSync(path.join(cwd, 'LICENSE'))) {
    warnings.push('LICENSE file not found');
  }
  
  // 14. Check for TypeScript config
  if (!fs.existsSync(path.join(cwd, 'tsconfig.json'))) {
    warnings.push('tsconfig.json not found');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
