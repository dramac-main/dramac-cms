import { defineModule } from '@dramac/sdk';

export default defineModule({
  id: '{{MODULE_ID}}',
  name: '{{MODULE_NAME}}',
  version: '1.0.0',
  description: '{{MODULE_DESCRIPTION}}',
  category: 'custom',

  // Database tables
  tables: [
    {
      name: 'items',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'status', type: 'text', defaultValue: "'active'" },
        { name: 'site_id', type: 'uuid', references: { table: 'sites', column: 'id' } },
        { name: 'created_by', type: 'uuid', references: { table: 'users', column: 'id' } },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamptz', defaultValue: 'now()' },
      ],
      indexes: [
        { columns: ['site_id'] },
        { columns: ['status'] },
      ],
      rls: true,
    },
  ],

  // Permissions
  permissions: [
    {
      id: 'module.view_items',
      name: 'View Items',
      description: 'View items in the module',
      roles: ['admin', 'site_admin', 'site_user'],
    },
    {
      id: 'module.manage_items',
      name: 'Manage Items',
      description: 'Create, edit, and delete items',
      roles: ['admin', 'site_admin'],
    },
  ],

  // Module settings schema
  settings: {
    type: 'object',
    properties: {
      defaultPageSize: {
        type: 'number',
        default: 20,
        description: 'Default number of items per page',
      },
      enableNotifications: {
        type: 'boolean',
        default: true,
        description: 'Send notifications for item updates',
      },
    },
  },

  // Entry points
  entryPoints: {
    dashboard: './src/Dashboard',
    settings: './src/Settings',
  },

  // Lifecycle hooks
  hooks: {
    onInstall: async (ctx) => {
      console.log('Module installed for site:', ctx.siteId);
    },
    onUninstall: async (ctx) => {
      console.log('Module uninstalled from site:', ctx.siteId);
    },
    onUpgrade: async (ctx, fromVersion) => {
      console.log(`Module upgraded from ${fromVersion} for site:`, ctx.siteId);
    },
  },
});
