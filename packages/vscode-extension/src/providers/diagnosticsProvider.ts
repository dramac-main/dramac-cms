/**
 * Diagnostics Provider
 * 
 * Provides real-time validation and error reporting for Dramac modules
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class DiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('dramac');
  }

  activate(context: vscode.ExtensionContext): void {
    // Watch for config file changes
    const watcher = vscode.workspace.createFileSystemWatcher('**/dramac.config.ts');
    
    watcher.onDidChange((uri) => this.validateConfig(uri));
    watcher.onDidCreate((uri) => this.validateConfig(uri));
    watcher.onDidDelete((uri) => this.diagnosticCollection.delete(uri));

    // Watch for document saves
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.fileName.endsWith('dramac.config.ts')) {
        this.validateConfig(doc.uri);
      }
    }, null, this.disposables);

    // Validate on open
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.fileName.endsWith('dramac.config.ts')) {
        this.validateConfig(doc.uri);
      }
    }, null, this.disposables);

    // Initial validation of all config files
    this.validateAllConfigs();

    context.subscriptions.push(watcher, ...this.disposables, this.diagnosticCollection);
  }

  private async validateAllConfigs(): Promise<void> {
    const files = await vscode.workspace.findFiles('**/dramac.config.ts', '**/node_modules/**');
    for (const file of files) {
      await this.validateConfig(file);
    }
  }

  /**
   * Validate all config files in the workspace (public API)
   */
  validateWorkspace(): void {
    this.validateAllConfigs();
  }

  async validateConfig(uri: vscode.Uri): Promise<void> {
    const diagnostics: vscode.Diagnostic[] = [];
    
    try {
      const content = fs.readFileSync(uri.fsPath, 'utf-8');
      
      // Check for required exports
      if (!content.includes('defineModule')) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 0),
            'Missing defineModule import from @dramac/sdk',
            vscode.DiagnosticSeverity.Error
          )
        );
      }

      // Check for module ID
      const moduleIdMatch = content.match(/id:\s*['"`]([^'"`]*)['"`]/);
      if (!moduleIdMatch) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 0),
            'Module must have an id property',
            vscode.DiagnosticSeverity.Error
          )
        );
      } else {
        const moduleId = moduleIdMatch[1];
        
        // Validate module ID format
        if (!/^[a-z][a-z0-9-]*$/.test(moduleId)) {
          const line = content.substring(0, moduleIdMatch.index).split('\n').length - 1;
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(line, 0, line, 100),
              'Module ID must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens',
              vscode.DiagnosticSeverity.Warning
            )
          );
        }
      }

      // Check for module name
      if (!content.match(/name:\s*['"`][^'"`]+['"`]/)) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 0),
            'Module must have a name property',
            vscode.DiagnosticSeverity.Error
          )
        );
      }

      // Check for version
      const versionMatch = content.match(/version:\s*['"`]([^'"`]*)['"`]/);
      if (versionMatch) {
        const version = versionMatch[1];
        if (!/^\d+\.\d+\.\d+$/.test(version)) {
          const line = content.substring(0, versionMatch.index).split('\n').length - 1;
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(line, 0, line, 100),
              'Version must follow semver format (e.g., 1.0.0)',
              vscode.DiagnosticSeverity.Warning
            )
          );
        }
      }

      // Check for database tables
      const tablesMatch = content.match(/tables:\s*\[/);
      if (tablesMatch) {
        // Check for table name duplicates
        const tableNames = content.matchAll(/name:\s*['"`]([^'"`]*)['"`]/g);
        const names = new Set<string>();
        
        for (const match of tableNames) {
          const name = match[1];
          if (names.has(name)) {
            const line = content.substring(0, match.index).split('\n').length - 1;
            diagnostics.push(
              new vscode.Diagnostic(
                new vscode.Range(line, 0, line, 100),
                `Duplicate table name: ${name}`,
                vscode.DiagnosticSeverity.Error
              )
            );
          }
          names.add(name);
        }
      }

      // Check for permissions format
      const permissionsMatch = content.match(/permissions:\s*\[/);
      if (permissionsMatch) {
        // Validate permission IDs
        const permIds = content.matchAll(/id:\s*['"`](module\.[^'"`]*)['"`]/g);
        
        for (const match of permIds) {
          const permId = match[1];
          if (!/^module\.[a-z_]+$/.test(permId)) {
            const line = content.substring(0, match.index).split('\n').length - 1;
            diagnostics.push(
              new vscode.Diagnostic(
                new vscode.Range(line, 0, line, 100),
                `Permission ID should follow format: module.action_name (e.g., module.view_items)`,
                vscode.DiagnosticSeverity.Warning
              )
            );
          }
        }
      }

      // Check entry points
      const dashboardMatch = content.match(/dashboard:\s*['"`]([^'"`]*)['"`]/);
      if (dashboardMatch) {
        const dashboardPath = dashboardMatch[1];
        const fullPath = path.join(path.dirname(uri.fsPath), dashboardPath);
        
        if (!fs.existsSync(fullPath) && !fs.existsSync(fullPath + '.tsx') && !fs.existsSync(fullPath + '.ts')) {
          const line = content.substring(0, dashboardMatch.index).split('\n').length - 1;
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(line, 0, line, 100),
              `Dashboard entry point not found: ${dashboardPath}`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      }

    } catch (error) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          `Error reading config file: ${error}`,
          vscode.DiagnosticSeverity.Error
        )
      );
    }

    this.diagnosticCollection.set(uri, diagnostics);
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
