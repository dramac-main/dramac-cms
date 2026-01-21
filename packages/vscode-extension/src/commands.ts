/**
 * VS Code Extension Commands
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DevServerManager } from './devServer';
import { ModuleTreeDataProvider } from './providers/moduleTreeProvider';

export function registerCommands(
  context: vscode.ExtensionContext,
  devServerManager: DevServerManager,
  treeProvider: ModuleTreeDataProvider
) {
  // Create new module
  context.subscriptions.push(
    vscode.commands.registerCommand('dramac.createModule', async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Module name',
        placeHolder: 'my-module',
        validateInput: (value) => {
          if (!value) return 'Name is required';
          if (!/^[a-z][a-z0-9-]*$/.test(value)) {
            return 'Name must start with a letter and contain only lowercase letters, numbers, and hyphens';
          }
          return undefined;
        },
      });

      if (!name) return;

      const templates = [
        { label: 'Basic', description: 'Simple module with dashboard and settings', value: 'basic' },
        { label: 'CRM', description: 'Customer relationship management module', value: 'crm' },
        { label: 'Booking', description: 'Appointment/booking system module', value: 'booking' },
      ];

      const template = await vscode.window.showQuickPick(templates, {
        placeHolder: 'Select a template',
      });

      if (!template) return;

      const description = await vscode.window.showInputBox({
        prompt: 'Module description',
        placeHolder: 'A brief description of your module',
      });

      // Get workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const targetFolder = workspaceFolders[0].uri.fsPath;

      // Run init command
      const terminal = vscode.window.createTerminal('Dramac CLI');
      terminal.show();
      terminal.sendText(`npx @dramac/sdk init ${name} --template ${template.value}${description ? ` --description "${description}"` : ''}`);

      vscode.window.showInformationMessage(`Creating module "${name}"...`);
    })
  );

  // Start dev server
  context.subscriptions.push(
    vscode.commands.registerCommand('dramac.startDevServer', async () => {
      const config = vscode.workspace.getConfiguration('dramac');
      const port = config.get<number>('devServer.port') || 3001;
      const openBrowser = config.get<boolean>('devServer.openBrowser') || true;

      await devServerManager.start(port, openBrowser);
      treeProvider.refresh();
    })
  );

  // Stop dev server
  context.subscriptions.push(
    vscode.commands.registerCommand('dramac.stopDevServer', async () => {
      await devServerManager.stop();
      treeProvider.refresh();
    })
  );

  // Deploy module
  context.subscriptions.push(
    vscode.commands.registerCommand('dramac.deployModule', async () => {
      const environments = [
        { label: 'Development', value: 'development' },
        { label: 'Staging', value: 'staging' },
        { label: 'Production', value: 'production' },
      ];

      const env = await vscode.window.showQuickPick(environments, {
        placeHolder: 'Select deployment environment',
      });

      if (!env) return;

      const config = vscode.workspace.getConfiguration('dramac');
      const apiKey = config.get<string>('api.key');

      if (!apiKey) {
        const setKey = await vscode.window.showWarningMessage(
          'No API key configured. Set your Dramac API key in settings.',
          'Open Settings'
        );

        if (setKey) {
          vscode.commands.executeCommand('workbench.action.openSettings', 'dramac.api.key');
        }
        return;
      }

      const terminal = vscode.window.createTerminal('Dramac Deploy');
      terminal.show();
      terminal.sendText(`npx dramac deploy --environment ${env.value}`);
    })
  );

  // Validate module
  context.subscriptions.push(
    vscode.commands.registerCommand('dramac.validateModule', async () => {
      const terminal = vscode.window.createTerminal('Dramac Validate');
      terminal.show();
      terminal.sendText('npx dramac validate');
    })
  );

  // Generate database table
  context.subscriptions.push(
    vscode.commands.registerCommand('dramac.generateTable', async () => {
      const tableName = await vscode.window.showInputBox({
        prompt: 'Table name',
        placeHolder: 'items',
        validateInput: (value) => {
          if (!value) return 'Name is required';
          if (!/^[a-z][a-z0-9_]*$/.test(value)) {
            return 'Name must start with a letter and contain only lowercase letters, numbers, and underscores';
          }
          return undefined;
        },
      });

      if (!tableName) return;

      const snippet = generateTableSnippet(tableName);
      
      // Insert at cursor or show in new document
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.fileName.includes('dramac.config')) {
        editor.insertSnippet(new vscode.SnippetString(snippet));
      } else {
        const doc = await vscode.workspace.openTextDocument({
          content: snippet,
          language: 'typescript',
        });
        vscode.window.showTextDocument(doc);
      }
    })
  );

  // Generate component
  context.subscriptions.push(
    vscode.commands.registerCommand('dramac.generateComponent', async (uri?: vscode.Uri) => {
      const componentName = await vscode.window.showInputBox({
        prompt: 'Component name',
        placeHolder: 'MyComponent',
        validateInput: (value) => {
          if (!value) return 'Name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Name must be PascalCase';
          }
          return undefined;
        },
      });

      if (!componentName) return;

      const componentTypes = [
        { label: 'Functional Component', value: 'functional' },
        { label: 'Dashboard Widget', value: 'widget' },
        { label: 'Form Component', value: 'form' },
        { label: 'Table Component', value: 'table' },
      ];

      const type = await vscode.window.showQuickPick(componentTypes, {
        placeHolder: 'Select component type',
      });

      if (!type) return;

      const content = generateComponentContent(componentName, type.value);
      
      // Determine target path
      let targetPath: string;
      if (uri) {
        targetPath = path.join(uri.fsPath, `${componentName}.tsx`);
      } else {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          vscode.window.showErrorMessage('No workspace folder open');
          return;
        }
        targetPath = path.join(workspaceFolders[0].uri.fsPath, 'src', 'components', `${componentName}.tsx`);
      }

      const targetUri = vscode.Uri.file(targetPath);
      await vscode.workspace.fs.writeFile(targetUri, Buffer.from(content));
      const doc = await vscode.workspace.openTextDocument(targetUri);
      vscode.window.showTextDocument(doc);
    })
  );

  // Generate API route
  context.subscriptions.push(
    vscode.commands.registerCommand('dramac.generateApiRoute', async (uri?: vscode.Uri) => {
      const routeName = await vscode.window.showInputBox({
        prompt: 'Route name (e.g., items, users/[id])',
        placeHolder: 'items',
      });

      if (!routeName) return;

      const methods = await vscode.window.showQuickPick(
        [
          { label: 'GET', picked: true },
          { label: 'POST', picked: true },
          { label: 'PUT' },
          { label: 'PATCH' },
          { label: 'DELETE', picked: true },
        ],
        {
          placeHolder: 'Select HTTP methods',
          canPickMany: true,
        }
      );

      if (!methods || methods.length === 0) return;

      const content = generateApiRouteContent(routeName, methods.map((m) => m.label));

      // Determine target path
      let targetPath: string;
      if (uri) {
        targetPath = path.join(uri.fsPath, `${routeName}.ts`);
      } else {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          vscode.window.showErrorMessage('No workspace folder open');
          return;
        }
        targetPath = path.join(workspaceFolders[0].uri.fsPath, 'src', 'api', `${routeName}.ts`);
      }

      const targetUri = vscode.Uri.file(targetPath);
      
      // Ensure directory exists
      const dir = path.dirname(targetPath);
      try {
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(dir));
      } catch {
        // Directory might already exist
      }

      await vscode.workspace.fs.writeFile(targetUri, Buffer.from(content));
      const doc = await vscode.workspace.openTextDocument(targetUri);
      vscode.window.showTextDocument(doc);
    })
  );

  // Open documentation
  context.subscriptions.push(
    vscode.commands.registerCommand('dramac.openDocs', () => {
      vscode.env.openExternal(vscode.Uri.parse('https://dramac.io/docs/modules'));
    })
  );
}

function generateTableSnippet(tableName: string): string {
  return `{
  name: '${tableName}',
  columns: [
    { name: 'id', type: 'uuid', primaryKey: true },
    { name: 'site_id', type: 'uuid', nullable: false },
    { name: '\${1:name}', type: 'text', nullable: false },
    { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
    { name: 'updated_at', type: 'timestamptz' },
    { name: 'created_by', type: 'uuid' },
  ],
  rls: [
    {
      name: 'site_isolation',
      operation: 'ALL',
      using: "site_id = current_setting('app.site_id')::uuid",
    },
  ],
}`;
}

function generateComponentContent(name: string, type: string): string {
  switch (type) {
    case 'widget':
      return `'use client';

interface ${name}Props {
  title?: string;
}

export function ${name}({ title = '${name}' }: ${name}Props) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="text-2xl font-bold">0</div>
      <p className="text-sm text-muted-foreground">Description</p>
    </div>
  );
}

export default ${name};
`;

    case 'form':
      return `'use client';

import { useState } from 'react';

interface ${name}Props {
  onSubmit: (data: FormData) => Promise<void>;
  initialData?: Partial<FormData>;
}

interface FormData {
  name: string;
}

export function ${name}({ onSubmit, initialData }: ${name}Props) {
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          className="input w-full"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={submitting}
      >
        {submitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}

export default ${name};
`;

    case 'table':
      return `'use client';

interface Item {
  id: string;
  name: string;
}

interface ${name}Props {
  items: Item[];
  onEdit?: (item: Item) => void;
  onDelete?: (id: string) => void;
}

export function ${name}({ items, onEdit, onDelete }: ${name}Props) {
  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">{item.name}</td>
              <td className="px-4 py-3 text-right space-x-2">
                {onEdit && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    className="btn btn-ghost btn-sm text-destructive"
                    onClick={() => onDelete(item.id)}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ${name};
`;

    default:
      return `'use client';

interface ${name}Props {
  className?: string;
}

export function ${name}({ className }: ${name}Props) {
  return (
    <div className={className}>
      ${name} Component
    </div>
  );
}

export default ${name};
`;
  }
}

function generateApiRouteContent(routeName: string, methods: string[]): string {
  const handlers = methods.map((method) => {
    const methodLower = method.toLowerCase();
    return `export async function ${methodLower}(req: Request, ctx: RouteContext) {
  // TODO: Implement ${method} handler
  return { success: true };
}`;
  });

  return `import { createHandler } from '@dramac/sdk';

interface RouteContext {
  moduleId: string;
  siteId: string;
  userId?: string;
  db: any;
}

${handlers.join('\n\n')}
`;
}
