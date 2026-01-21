import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  success: 1,
};

let currentLogLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

export const logger = {
  debug(...args: any[]): void {
    if (shouldLog('debug')) {
      console.log(chalk.gray('[debug]'), ...args);
    }
  },
  
  info(...args: any[]): void {
    if (shouldLog('info')) {
      console.log(chalk.blue('ℹ'), ...args);
    }
  },
  
  warn(...args: any[]): void {
    if (shouldLog('warn')) {
      console.log(chalk.yellow('⚠'), ...args);
    }
  },
  
  error(...args: any[]): void {
    if (shouldLog('error')) {
      console.error(chalk.red('✗'), ...args);
    }
  },
  
  success(...args: any[]): void {
    if (shouldLog('success')) {
      console.log(chalk.green('✓'), ...args);
    }
  },
  
  // Raw output without prefix
  log(...args: any[]): void {
    console.log(...args);
  },
  
  // Newline
  newline(): void {
    console.log('');
  },
  
  // Formatted title
  title(text: string): void {
    console.log('');
    console.log(chalk.bold(text));
    console.log('');
  },
  
  // Key-value pair
  pair(key: string, value: string, indent = 0): void {
    const spaces = ' '.repeat(indent);
    console.log(`${spaces}${chalk.gray(key + ':')} ${value}`);
  },
  
  // Bulleted list item
  bullet(text: string, indent = 2): void {
    const spaces = ' '.repeat(indent);
    console.log(`${spaces}${chalk.gray('•')} ${text}`);
  },
  
  // Numbered list item
  numbered(num: number, text: string, indent = 2): void {
    const spaces = ' '.repeat(indent);
    console.log(`${spaces}${chalk.cyan(num + '.')} ${text}`);
  },
  
  // Box with title
  box(title: string, content: string[]): void {
    const maxLen = Math.max(title.length, ...content.map(c => c.length));
    const width = maxLen + 4;
    
    console.log('');
    console.log(chalk.cyan('╔' + '═'.repeat(width) + '╗'));
    console.log(chalk.cyan('║') + ' ' + chalk.bold(title.padEnd(width - 1)) + chalk.cyan('║'));
    console.log(chalk.cyan('╠' + '═'.repeat(width) + '╣'));
    
    for (const line of content) {
      console.log(chalk.cyan('║') + ' ' + line.padEnd(width - 1) + chalk.cyan('║'));
    }
    
    console.log(chalk.cyan('╚' + '═'.repeat(width) + '╝'));
    console.log('');
  },
  
  // Table
  table(headers: string[], rows: string[][]): void {
    const colWidths = headers.map((h, i) => {
      const maxRow = Math.max(...rows.map(r => (r[i] || '').length));
      return Math.max(h.length, maxRow);
    });
    
    // Header
    const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join('  ');
    console.log(chalk.bold(headerRow));
    console.log(chalk.gray('─'.repeat(headerRow.length)));
    
    // Rows
    for (const row of rows) {
      const rowStr = row.map((c, i) => (c || '').padEnd(colWidths[i])).join('  ');
      console.log(rowStr);
    }
  },
};

export default logger;
