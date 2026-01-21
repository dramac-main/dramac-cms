/**
 * Module Tree Data Provider
 * 
 * Provides the tree view for the Dramac module explorer
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ModuleTreeDataProvider implements vscode.TreeDataProvider<ModuleTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ModuleTreeItem | undefined | null | void> =
    new vscode.EventEmitter<ModuleTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ModuleTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ModuleTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ModuleTreeItem): Promise<ModuleTreeItem[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return [];
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    if (!element) {
      // Root level - show module info
      return this.getModuleInfo(workspaceRoot);
    }

    // Child items based on parent type
    switch (element.contextValue) {
      case 'entry':
        return this.getEntryPoints(workspaceRoot);
      case 'database':
        return this.getTables(workspaceRoot);
      case 'permissions':
        return this.getPermissions(workspaceRoot);
      case 'routes':
        return this.getRoutes(workspaceRoot);
      default:
        return [];
    }
  }

  private async getModuleInfo(workspaceRoot: string): Promise<ModuleTreeItem[]> {
    const configPath = path.join(workspaceRoot, 'dramac.config.ts');
    
    if (!fs.existsSync(configPath)) {
      return [
        new ModuleTreeItem(
          'No module found',
          vscode.TreeItemCollapsibleState.None,
          'info',
          'No dramac.config.ts found'
        ),
      ];
    }

    // Read package.json for version info
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    let version = '1.0.0';
    let moduleName = 'Module';
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        version = packageJson.version || version;
        moduleName = packageJson.name?.replace('@dramac-modules/', '') || moduleName;
      } catch {
        // Ignore parse errors
      }
    }

    return [
      new ModuleTreeItem(
        moduleName,
        vscode.TreeItemCollapsibleState.None,
        'module',
        `Version ${version}`,
        { command: 'vscode.open', title: 'Open Config', arguments: [vscode.Uri.file(configPath)] }
      ),
      new ModuleTreeItem(
        'Entry Points',
        vscode.TreeItemCollapsibleState.Collapsed,
        'entry',
        'Dashboard, Settings, etc.'
      ),
      new ModuleTreeItem(
        'Database',
        vscode.TreeItemCollapsibleState.Collapsed,
        'database',
        'Tables and migrations'
      ),
      new ModuleTreeItem(
        'Permissions',
        vscode.TreeItemCollapsibleState.Collapsed,
        'permissions',
        'RBAC permissions'
      ),
      new ModuleTreeItem(
        'API Routes',
        vscode.TreeItemCollapsibleState.Collapsed,
        'routes',
        'API endpoints'
      ),
    ];
  }

  private async getEntryPoints(workspaceRoot: string): Promise<ModuleTreeItem[]> {
    const entries: ModuleTreeItem[] = [];
    const srcPath = path.join(workspaceRoot, 'src');

    const entryFiles = ['Dashboard.tsx', 'Settings.tsx', 'Embed.tsx'];
    
    for (const file of entryFiles) {
      const filePath = path.join(srcPath, file);
      if (fs.existsSync(filePath)) {
        entries.push(
          new ModuleTreeItem(
            file.replace('.tsx', ''),
            vscode.TreeItemCollapsibleState.None,
            'file',
            file,
            { command: 'vscode.open', title: 'Open', arguments: [vscode.Uri.file(filePath)] }
          )
        );
      }
    }

    if (entries.length === 0) {
      entries.push(
        new ModuleTreeItem(
          'No entry points found',
          vscode.TreeItemCollapsibleState.None,
          'info'
        )
      );
    }

    return entries;
  }

  private async getTables(workspaceRoot: string): Promise<ModuleTreeItem[]> {
    // In a real implementation, this would parse the config file
    // For now, return placeholder
    return [
      new ModuleTreeItem(
        'items',
        vscode.TreeItemCollapsibleState.None,
        'table',
        'Database table'
      ),
    ];
  }

  private async getPermissions(workspaceRoot: string): Promise<ModuleTreeItem[]> {
    // In a real implementation, this would parse the config file
    return [
      new ModuleTreeItem(
        'Define in dramac.config.ts',
        vscode.TreeItemCollapsibleState.None,
        'info'
      ),
    ];
  }

  private async getRoutes(workspaceRoot: string): Promise<ModuleTreeItem[]> {
    const apiPath = path.join(workspaceRoot, 'src', 'api');
    
    if (!fs.existsSync(apiPath)) {
      return [
        new ModuleTreeItem(
          'No API routes',
          vscode.TreeItemCollapsibleState.None,
          'info',
          'Create src/api directory'
        ),
      ];
    }

    const routes: ModuleTreeItem[] = [];
    const files = fs.readdirSync(apiPath);
    
    for (const file of files) {
      if (file.endsWith('.ts')) {
        const routePath = path.join(apiPath, file);
        routes.push(
          new ModuleTreeItem(
            `/${file.replace('.ts', '')}`,
            vscode.TreeItemCollapsibleState.None,
            'route',
            'API route',
            { command: 'vscode.open', title: 'Open', arguments: [vscode.Uri.file(routePath)] }
          )
        );
      }
    }

    return routes;
  }
}

export class ModuleTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue?: string,
    public readonly description?: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = description || label;
    this.contextValue = contextValue;

    // Set icons based on context
    switch (contextValue) {
      case 'module':
        this.iconPath = new vscode.ThemeIcon('package');
        break;
      case 'entry':
        this.iconPath = new vscode.ThemeIcon('symbol-interface');
        break;
      case 'database':
        this.iconPath = new vscode.ThemeIcon('database');
        break;
      case 'permissions':
        this.iconPath = new vscode.ThemeIcon('shield');
        break;
      case 'routes':
        this.iconPath = new vscode.ThemeIcon('symbol-method');
        break;
      case 'table':
        this.iconPath = new vscode.ThemeIcon('table');
        break;
      case 'route':
        this.iconPath = new vscode.ThemeIcon('link');
        break;
      case 'file':
        this.iconPath = new vscode.ThemeIcon('file-code');
        break;
      case 'info':
        this.iconPath = new vscode.ThemeIcon('info');
        break;
    }
  }
}
