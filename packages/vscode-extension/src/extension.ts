/**
 * Dramac Modules VS Code Extension
 * 
 * Provides IntelliSense, snippets, and tooling for Dramac module development
 */

import * as vscode from 'vscode';
import { ModuleTreeDataProvider } from './providers/moduleTreeProvider';
import { registerCommands } from './commands';
import { DevServerManager } from './devServer';
import { DiagnosticsProvider } from './providers/diagnosticsProvider';
import { DramacCompletionProvider } from './providers/completionProvider';

let devServerManager: DevServerManager;
let diagnosticsProvider: DiagnosticsProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('Dramac Modules extension activated');

  // Initialize dev server manager
  devServerManager = new DevServerManager();

  // Initialize diagnostics
  diagnosticsProvider = new DiagnosticsProvider();

  // Register tree view
  const moduleTreeProvider = new ModuleTreeDataProvider();
  vscode.window.registerTreeDataProvider('dramacModuleExplorer', moduleTreeProvider);

  // Register commands
  registerCommands(context, devServerManager, moduleTreeProvider);

  // Register completion provider for dramac.config.ts
  const completionProvider = new DramacCompletionProvider();
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { scheme: 'file', pattern: '**/dramac.config.{ts,js}' },
      completionProvider,
      '.',
      '"',
      "'"
    )
  );

  // Register hover provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { scheme: 'file', pattern: '**/dramac.config.{ts,js}' },
      {
        provideHover(document, position) {
          const range = document.getWordRangeAtPosition(position);
          const word = document.getText(range);

          const hoverInfo = getHoverInfo(word);
          if (hoverInfo) {
            return new vscode.Hover(hoverInfo);
          }
          return undefined;
        },
      }
    )
  );

  // Watch for config file changes
  const configWatcher = vscode.workspace.createFileSystemWatcher('**/dramac.config.{ts,js}');
  configWatcher.onDidChange(() => {
    moduleTreeProvider.refresh();
    diagnosticsProvider.validateWorkspace();
  });
  configWatcher.onDidCreate(() => {
    moduleTreeProvider.refresh();
  });
  configWatcher.onDidDelete(() => {
    moduleTreeProvider.refresh();
  });

  context.subscriptions.push(configWatcher);

  // Initial diagnostics run
  diagnosticsProvider.validateWorkspace();

  // Show welcome message for new users
  const hasShownWelcome = context.globalState.get('dramac.hasShownWelcome');
  if (!hasShownWelcome) {
    vscode.window
      .showInformationMessage(
        'Welcome to Dramac Modules! Get started by creating a new module.',
        'Create Module',
        'Open Docs'
      )
      .then((selection) => {
        if (selection === 'Create Module') {
          vscode.commands.executeCommand('dramac.createModule');
        } else if (selection === 'Open Docs') {
          vscode.commands.executeCommand('dramac.openDocs');
        }
      });
    context.globalState.update('dramac.hasShownWelcome', true);
  }
}

export function deactivate() {
  console.log('Dramac Modules extension deactivated');
  
  // Stop dev server if running
  if (devServerManager) {
    devServerManager.stop();
  }
}

/**
 * Get hover information for config properties
 */
function getHoverInfo(word: string): vscode.MarkdownString | undefined {
  const info: Record<string, string> = {
    id: '**Module ID**\n\nUnique identifier for the module. Use lowercase letters, numbers, and hyphens.',
    name: '**Module Name**\n\nHuman-readable name displayed in the dashboard.',
    version: '**Version**\n\nSemantic version (e.g., "1.0.0").',
    description: '**Description**\n\nShort description of what the module does.',
    icon: '**Icon**\n\nLucide icon name (e.g., "Package", "Users", "Calendar").',
    category: '**Category**\n\nModule category: crm, booking, ecommerce, analytics, marketing, communication, payments, social, content, automation, integration, utility.',
    type: '**Module Type**\n\n- `app`: Full application module\n- `custom`: Custom/client-specific module\n- `system`: System-level module',
    entry: '**Entry Points**\n\nPaths to the module\'s main components:\n- `dashboard`: Main dashboard component\n- `settings`: Settings page component\n- `embed`: Embeddable component\n- `api`: API routes directory',
    database: '**Database Configuration**\n\nDefine tables, columns, indexes, and RLS policies.',
    permissions: '**Permissions**\n\nDefine granular permissions for the module.',
    roles: '**Roles**\n\nDefine roles with associated permissions.',
    routes: '**API Routes**\n\nDefine API endpoints for the module.',
    webhooks: '**Webhooks**\n\nDefine webhook handlers for events.',
    settings: '**Settings Schema**\n\nDefine the module settings UI.',
  };

  if (info[word]) {
    const md = new vscode.MarkdownString(info[word]);
    md.isTrusted = true;
    return md;
  }

  return undefined;
}
