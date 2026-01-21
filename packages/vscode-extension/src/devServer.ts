/**
 * Dev Server Manager
 */

import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';

export class DevServerManager {
  private process: child_process.ChildProcess | null = null;
  private terminal: vscode.Terminal | null = null;
  private isRunning: boolean = false;
  private port: number = 3001;
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'dramac.stopDevServer';
    this.updateStatusBar();
  }

  async start(port: number = 3001, openBrowser: boolean = true): Promise<void> {
    if (this.isRunning) {
      vscode.window.showWarningMessage('Dev server is already running');
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    // Check for dramac.config.ts
    const configPath = path.join(workspaceRoot, 'dramac.config.ts');
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(configPath));
    } catch {
      vscode.window.showErrorMessage(
        'No dramac.config.ts found. Make sure you are in a Dramac module directory.'
      );
      return;
    }

    this.port = port;
    this.terminal = vscode.window.createTerminal({
      name: 'Dramac Dev Server',
      cwd: workspaceRoot,
    });

    this.terminal.show();
    this.terminal.sendText(`npx dramac dev --port ${port}${openBrowser ? ' --open' : ''}`);

    this.isRunning = true;
    this.updateStatusBar();

    vscode.window.showInformationMessage(
      `Dev server starting on http://localhost:${port}`,
      'Open Browser'
    ).then((selection) => {
      if (selection === 'Open Browser') {
        vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${port}`));
      }
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      vscode.window.showWarningMessage('Dev server is not running');
      return;
    }

    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }

    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    this.isRunning = false;
    this.updateStatusBar();

    vscode.window.showInformationMessage('Dev server stopped');
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getPort(): number {
    return this.port;
  }

  private updateStatusBar(): void {
    if (this.isRunning) {
      this.statusBarItem.text = `$(debug-stop) Dramac: localhost:${this.port}`;
      this.statusBarItem.tooltip = 'Click to stop dev server';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground'
      );
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }

  dispose(): void {
    this.stop();
    this.statusBarItem.dispose();
  }
}
