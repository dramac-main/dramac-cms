import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { saveAuthToken, getAuthToken, clearAuthToken, saveAuthConfig, getAuthConfig, clearAuthConfig } from '../utils/auth.js';
import { apiClient, getApiBaseUrl } from '../utils/api.js';

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
      const authConfig = getAuthConfig();
      console.log(chalk.gray(`Currently logged in as: ${authConfig.email || 'unknown'}`));
      console.log('');
      
      const { logout } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'logout',
          message: 'Log out and log in again?',
          default: false
        }
      ]);
      
      if (!logout) {
        console.log(chalk.gray('Keeping existing session.'));
        return;
      }
      
      clearAuthConfig();
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
        // Generate login URL with unique session ID
        const sessionId = generateSessionId();
        const loginUrl = `${getApiBaseUrl().replace('/api', '')}/cli-auth?session=${sessionId}`;
        
        console.log('');
        console.log('Opening browser...');
        console.log(chalk.gray(`If browser doesn't open, visit:`));
        console.log(chalk.cyan(loginUrl));
        console.log('');
        
        try {
          const open = await import('open');
          await open.default(loginUrl);
        } catch {
          // Browser didn't open, user can copy the URL
        }
        
        const { code } = await inquirer.prompt([
          {
            type: 'input',
            name: 'code',
            message: 'Enter the code from the browser:',
            validate: (input) => input.length > 0 || 'Code is required'
          }
        ]);
        
        // Exchange code for token
        const spinner = ora('Authenticating...').start();
        
        try {
          const response = await apiClient.post('/auth/cli-exchange', { 
            code,
            sessionId 
          });
          
          if (!response.ok || response.data.error) {
            throw new Error(response.data.error || 'Authentication failed');
          }
          
          token = response.data.token;
          
          // Save user info
          saveAuthConfig({
            userId: response.data.userId,
            email: response.data.email,
            agencyId: response.data.agencyId,
            agencyName: response.data.agencyName
          });
          
          spinner.succeed('Authenticated!');
        } catch (error: any) {
          spinner.fail('Authentication failed');
          console.error(chalk.red(error.message || 'Invalid code. Please try again.'));
          return;
        }
      } else {
        const { apiToken } = await inquirer.prompt([
          {
            type: 'password',
            name: 'apiToken',
            message: 'Enter your API token:',
            mask: '*',
            validate: (input) => input.length > 0 || 'Token is required'
          }
        ]);
        
        token = apiToken;
      }
    }
    
    // Verify token
    const spinner = ora('Verifying token...').start();
    
    try {
      const response = await apiClient.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok || response.data.error) {
        throw new Error(response.data.error || 'Invalid token');
      }
      
      saveAuthToken(token);
      saveAuthConfig({
        userId: response.data.userId,
        email: response.data.email,
        agencyId: response.data.agencyId,
        agencyName: response.data.agencyName
      });
      
      spinner.succeed('Login successful!');
      console.log('');
      console.log(`Welcome, ${chalk.cyan(response.data.name || response.data.email)}!`);
      
      if (response.data.agencyName) {
        console.log(`Agency: ${chalk.cyan(response.data.agencyName)}`);
      }
      
      console.log('');
      console.log('You can now deploy modules with ' + chalk.cyan('dramac deploy'));
      console.log('');
      
    } catch (error: any) {
      spinner.fail('Invalid token');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Logout subcommand
loginCommand
  .command('logout')
  .description('Log out from Dramac')
  .action(() => {
    const token = getAuthToken();
    
    if (!token) {
      console.log(chalk.yellow('Not logged in.'));
      return;
    }
    
    clearAuthConfig();
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
    
    const authConfig = getAuthConfig();
    
    // Try to verify token is still valid
    const spinner = ora('Checking session...').start();
    
    try {
      const response = await apiClient.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Session expired');
      }
      
      spinner.succeed('Logged in');
      console.log('');
      console.log('  User:   ' + chalk.cyan(response.data.email || authConfig.email || 'Unknown'));
      console.log('  Agency: ' + chalk.cyan(response.data.agencyName || authConfig.agencyName || 'Personal'));
      console.log('');
      
    } catch {
      spinner.fail('Session expired or invalid');
      console.log('');
      console.log(`Run ${chalk.cyan('dramac login')} to authenticate again.`);
      
      // Clear invalid token
      clearAuthConfig();
    }
  });

// Whoami alias
loginCommand
  .command('whoami')
  .description('Show current user (alias for status)')
  .action(async () => {
    const token = getAuthToken();
    const authConfig = getAuthConfig();
    
    if (!token) {
      console.log('Not logged in');
      process.exit(1);
    }
    
    console.log(authConfig.email || 'Unknown');
  });

function generateSessionId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
