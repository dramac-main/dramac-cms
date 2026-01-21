import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create.js';
import { devCommand } from './commands/dev.js';
import { buildCommand } from './commands/build.js';
import { deployCommand } from './commands/deploy.js';
import { validateCommand } from './commands/validate.js';
import { versionCommand } from './commands/version.js';
import { loginCommand } from './commands/login.js';

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
