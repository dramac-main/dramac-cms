/**
 * Completion Provider
 * 
 * Provides IntelliSense and autocompletion for Dramac module development
 */

import * as vscode from 'vscode';

export class DramacCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const linePrefix = document.lineAt(position).text.substring(0, position.character);
    const completions: vscode.CompletionItem[] = [];

    // Config file completions
    if (document.fileName.endsWith('dramac.config.ts')) {
      return this.getConfigCompletions(document, position, linePrefix);
    }

    // General TypeScript/TSX completions for Dramac SDK
    if (document.fileName.endsWith('.ts') || document.fileName.endsWith('.tsx')) {
      return this.getSdkCompletions(document, position, linePrefix);
    }

    return completions;
  }

  private getConfigCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    linePrefix: string
  ): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // Module config property completions
    if (linePrefix.match(/^\s*$/)) {
      completions.push(
        this.createPropertyCompletion('id', "'module-id'", 'Unique module identifier'),
        this.createPropertyCompletion('name', "'Module Name'", 'Display name of the module'),
        this.createPropertyCompletion('version', "'1.0.0'", 'Semver version'),
        this.createPropertyCompletion('description', "''", 'Module description'),
        this.createPropertyCompletion('category', "'custom'", "Module category: 'crm' | 'finance' | 'booking' | 'inventory' | 'hr' | 'custom'"),
        this.createPropertyCompletion('tables', '[]', 'Database tables'),
        this.createPropertyCompletion('permissions', '[]', 'RBAC permissions'),
        this.createPropertyCompletion('settings', '{}', 'Module settings schema'),
        this.createPropertyCompletion('entryPoints', '{}', 'UI entry points'),
        this.createPropertyCompletion('hooks', '{}', 'Lifecycle hooks'),
        this.createPropertyCompletion('events', '{}', 'Event subscriptions'),
      );
    }

    // Table definition completions
    if (linePrefix.includes('tables:') || document.getText().includes('tables: [')) {
      const tableCompletion = new vscode.CompletionItem('table', vscode.CompletionItemKind.Snippet);
      tableCompletion.insertText = new vscode.SnippetString(
        '{\n' +
        "  name: '${1:table_name}',\n" +
        '  columns: [\n' +
        '    { name: \'id\', type: \'uuid\', primaryKey: true, defaultValue: \'gen_random_uuid()\' },\n' +
        "    { name: '${2:column_name}', type: '${3|text,integer,boolean,timestamp,uuid,jsonb|}' },\n" +
        "    { name: 'site_id', type: 'uuid', references: { table: 'sites', column: 'id' } },\n" +
        '  ],\n' +
        '  rls: true,\n' +
        '}'
      );
      tableCompletion.documentation = 'Create a new table definition';
      completions.push(tableCompletion);
    }

    // Column type completions
    if (linePrefix.includes('type:')) {
      const types = ['text', 'integer', 'bigint', 'boolean', 'timestamp', 'timestamptz', 'uuid', 'jsonb', 'numeric', 'date'];
      for (const type of types) {
        const item = new vscode.CompletionItem(`'${type}'`, vscode.CompletionItemKind.EnumMember);
        item.detail = `PostgreSQL ${type} type`;
        completions.push(item);
      }
    }

    // Permission completions
    if (linePrefix.includes('permissions:') || linePrefix.includes("id: 'module.")) {
      const permissionCompletion = new vscode.CompletionItem('permission', vscode.CompletionItemKind.Snippet);
      permissionCompletion.insertText = new vscode.SnippetString(
        '{\n' +
        "  id: 'module.${1:action}',\n" +
        "  name: '${2:Permission Name}',\n" +
        "  description: '${3:Permission description}',\n" +
        "  roles: ['${4|admin,site_admin,site_user|}']\n" +
        '}'
      );
      permissionCompletion.documentation = 'Create a new permission definition';
      completions.push(permissionCompletion);
    }

    // Category completions
    if (linePrefix.includes('category:')) {
      const categories = ['crm', 'finance', 'booking', 'inventory', 'hr', 'custom'];
      for (const cat of categories) {
        const item = new vscode.CompletionItem(`'${cat}'`, vscode.CompletionItemKind.EnumMember);
        completions.push(item);
      }
    }

    return completions;
  }

  private getSdkCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    linePrefix: string
  ): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // Import completions
    if (linePrefix.includes('from \'@dramac/sdk')) {
      const exports = [
        { name: 'defineModule', kind: vscode.CompletionItemKind.Function },
        { name: 'createModuleClient', kind: vscode.CompletionItemKind.Function },
        { name: 'useModuleAuth', kind: vscode.CompletionItemKind.Function },
        { name: 'usePaginatedData', kind: vscode.CompletionItemKind.Function },
        { name: 'useModuleForm', kind: vscode.CompletionItemKind.Function },
        { name: 'useModuleSettings', kind: vscode.CompletionItemKind.Function },
        { name: 'PermissionGuard', kind: vscode.CompletionItemKind.Class },
        { name: 'ModuleAuthProvider', kind: vscode.CompletionItemKind.Class },
        { name: 'DramacModuleConfig', kind: vscode.CompletionItemKind.Interface },
        { name: 'TableDefinition', kind: vscode.CompletionItemKind.Interface },
        { name: 'ModuleContext', kind: vscode.CompletionItemKind.Interface },
      ];
      
      for (const exp of exports) {
        const item = new vscode.CompletionItem(exp.name, exp.kind);
        completions.push(item);
      }
    }

    // Hook completions
    if (linePrefix.includes('use')) {
      completions.push(
        this.createHookCompletion('useModuleAuth', 'Get module authentication context'),
        this.createHookCompletion('usePaginatedData', 'Fetch paginated data with loading states'),
        this.createHookCompletion('useModuleForm', 'Create and manage forms with validation'),
        this.createHookCompletion('useModuleSettings', 'Access module settings'),
        this.createHookCompletion('useModuleApi', 'Call module API endpoints'),
        this.createHookCompletion('useRealtimeData', 'Subscribe to real-time data updates'),
      );
    }

    // Client method completions
    if (linePrefix.includes('client.') || linePrefix.includes('moduleClient.')) {
      completions.push(
        this.createMethodCompletion('query', 'Query data from a table'),
        this.createMethodCompletion('insert', 'Insert a record'),
        this.createMethodCompletion('update', 'Update a record'),
        this.createMethodCompletion('delete', 'Delete a record'),
        this.createMethodCompletion('subscribe', 'Subscribe to real-time changes'),
      );
    }

    return completions;
  }

  private createPropertyCompletion(name: string, value: string, description: string): vscode.CompletionItem {
    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Property);
    item.insertText = new vscode.SnippetString(`${name}: ${value},`);
    item.documentation = description;
    return item;
  }

  private createHookCompletion(name: string, description: string): vscode.CompletionItem {
    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
    item.insertText = new vscode.SnippetString(`${name}($0)`);
    item.documentation = description;
    item.detail = `@dramac/sdk hook`;
    return item;
  }

  private createMethodCompletion(name: string, description: string): vscode.CompletionItem {
    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Method);
    item.insertText = new vscode.SnippetString(`${name}($0)`);
    item.documentation = description;
    return item;
  }
}

export class DramacHoverProvider implements vscode.HoverProvider {
  private hoverInfo: Map<string, string> = new Map([
    ['defineModule', '```typescript\ndefineModule(config: DramacModuleConfig): DramacModule\n```\n\nDefine a new Dramac module with configuration.'],
    ['createModuleClient', '```typescript\ncreateModuleClient(config: ModuleClientConfig): ModuleClient\n```\n\nCreate a client for database operations within a module context.'],
    ['useModuleAuth', '```typescript\nuseModuleAuth(): ModuleAuthContext\n```\n\nHook to access module authentication context, including user, site, and permissions.'],
    ['usePaginatedData', '```typescript\nusePaginatedData<T>(options: PaginatedDataOptions): PaginatedDataResult<T>\n```\n\nHook for fetching paginated data with loading states and automatic refetch.'],
    ['useModuleForm', '```typescript\nuseModuleForm<T>(schema: ZodSchema<T>): ModuleFormResult<T>\n```\n\nHook for creating type-safe forms with Zod validation.'],
    ['PermissionGuard', '```typescript\n<PermissionGuard permission="module.action">{children}</PermissionGuard>\n```\n\nComponent that conditionally renders children based on user permissions.'],
    ['ModuleAuthProvider', '```typescript\n<ModuleAuthProvider context={context}>{children}</ModuleAuthProvider>\n```\n\nProvider component for module authentication context.'],
    ['DramacModuleConfig', 'Interface defining the configuration options for a Dramac module, including tables, permissions, entry points, and lifecycle hooks.'],
    ['TableDefinition', 'Interface defining a database table structure with columns, indexes, and RLS policies.'],
    ['ModuleContext', 'Interface representing the runtime context for a module, including site, user, and Supabase client.'],
  ]);

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);
    const info = this.hoverInfo.get(word);

    if (info) {
      const markdown = new vscode.MarkdownString(info);
      markdown.isTrusted = true;
      return new vscode.Hover(markdown, wordRange);
    }

    return null;
  }
}
