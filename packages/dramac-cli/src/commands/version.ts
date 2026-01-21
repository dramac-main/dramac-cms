import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import semver from 'semver';
import { loadConfig } from '../utils/config.js';

export const versionCommand = new Command('version')
  .description('Manage module version')
  .argument('[version]', 'New version or bump type (major, minor, patch, prerelease)')
  .option('--preid <preid>', 'Prerelease identifier (e.g., alpha, beta, rc)', 'beta')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (versionArg, options) => {
    const cwd = process.cwd();
    const configPath = path.join(cwd, 'dramac.config.ts');
    
    // Check for config file
    if (!fs.existsSync(configPath)) {
      console.error(chalk.red('❌ dramac.config.ts not found'));
      process.exit(1);
    }
    
    try {
      const config = await loadConfig(cwd);
      const currentVersion = config.version;
      
      console.log('');
      console.log(chalk.bold('📦 Module Version Manager'));
      console.log('');
      console.log(`  Current version: ${chalk.cyan(currentVersion)}`);
      console.log('');
      
      let newVersion: string;
      
      if (!versionArg) {
        // Interactive mode
        const { bumpType } = await inquirer.prompt([
          {
            type: 'list',
            name: 'bumpType',
            message: 'Select version bump:',
            choices: [
              { name: `patch  (${semver.inc(currentVersion, 'patch')})`, value: 'patch' },
              { name: `minor  (${semver.inc(currentVersion, 'minor')})`, value: 'minor' },
              { name: `major  (${semver.inc(currentVersion, 'major')})`, value: 'major' },
              { name: `prerelease  (${semver.inc(currentVersion, 'prerelease', options.preid)})`, value: 'prerelease' },
              { name: 'custom version', value: 'custom' }
            ]
          }
        ]);
        
        if (bumpType === 'custom') {
          const { customVersion } = await inquirer.prompt([
            {
              type: 'input',
              name: 'customVersion',
              message: 'Enter new version:',
              validate: (input) => {
                if (!semver.valid(input)) {
                  return 'Invalid semver version';
                }
                return true;
              }
            }
          ]);
          newVersion = customVersion;
        } else {
          const bumped = semver.inc(currentVersion, bumpType as semver.ReleaseType, options.preid);
          if (!bumped) {
            console.error(chalk.red('Failed to bump version'));
            process.exit(1);
          }
          newVersion = bumped;
        }
      } else {
        // Check if it's a bump type or a version
        const bumpTypes = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];
        
        if (bumpTypes.includes(versionArg)) {
          const bumped = semver.inc(currentVersion, versionArg as semver.ReleaseType, options.preid);
          if (!bumped) {
            console.error(chalk.red(`Failed to bump version with "${versionArg}"`));
            process.exit(1);
          }
          newVersion = bumped;
        } else if (semver.valid(versionArg)) {
          newVersion = versionArg;
        } else {
          console.error(chalk.red(`Invalid version or bump type: "${versionArg}"`));
          console.log('');
          console.log('Valid bump types: major, minor, patch, premajor, preminor, prepatch, prerelease');
          console.log('Or provide a valid semver version like: 1.2.3 or 2.0.0-beta.1');
          process.exit(1);
        }
      }
      
      // Validate new version is greater
      if (!semver.gt(newVersion, currentVersion)) {
        console.log(chalk.yellow(`Warning: ${newVersion} is not greater than ${currentVersion}`));
        
        if (!options.yes) {
          const { proceed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message: 'Proceed anyway?',
              default: false
            }
          ]);
          
          if (!proceed) {
            console.log(chalk.yellow('Aborted.'));
            return;
          }
        }
      }
      
      // Confirm
      if (!options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Update version from ${chalk.cyan(currentVersion)} to ${chalk.green(newVersion)}?`,
            default: true
          }
        ]);
        
        if (!confirm) {
          console.log(chalk.yellow('Aborted.'));
          return;
        }
      }
      
      const spinner = ora('Updating version...').start();
      
      // Update dramac.config.ts
      let configContent = fs.readFileSync(configPath, 'utf-8');
      configContent = configContent.replace(
        /version:\s*['"]([^'"]+)['"]/,
        `version: '${newVersion}'`
      );
      fs.writeFileSync(configPath, configContent);
      
      // Update package.json if exists
      const pkgPath = path.join(cwd, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = await fs.readJson(pkgPath);
        pkg.version = newVersion;
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
      }
      
      spinner.succeed(`Updated to ${chalk.green(newVersion)}`);
      
      console.log('');
      console.log(chalk.gray('  Updated files:'));
      console.log(chalk.gray('  • dramac.config.ts'));
      if (fs.existsSync(pkgPath)) {
        console.log(chalk.gray('  • package.json'));
      }
      console.log('');
      console.log(`Run ${chalk.cyan('dramac build')} and ${chalk.cyan('dramac deploy')} to publish.`);
      console.log('');
      
    } catch (error: any) {
      console.error(chalk.red('Failed to update version:'), error.message);
      process.exit(1);
    }
  });

// Show current version subcommand
versionCommand
  .command('show')
  .description('Show current module version')
  .action(async () => {
    const cwd = process.cwd();
    
    try {
      const config = await loadConfig(cwd);
      console.log(config.version);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });
