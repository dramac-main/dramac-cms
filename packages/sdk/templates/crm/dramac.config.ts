import { defineModule } from '@dramac/sdk';

export default defineModule({
  id: '{{MODULE_ID}}',
  name: '{{MODULE_NAME}}',
  version: '1.0.0',
  description: 'Customer Relationship Management module',
  category: 'crm',

  // Database tables
  tables: [
    {
      name: 'contacts',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
        { name: 'first_name', type: 'text', nullable: false },
        { name: 'last_name', type: 'text', nullable: false },
        { name: 'email', type: 'text', nullable: true },
        { name: 'phone', type: 'text', nullable: true },
        { name: 'company', type: 'text', nullable: true },
        { name: 'job_title', type: 'text', nullable: true },
        { name: 'status', type: 'text', defaultValue: "'lead'" },
        { name: 'source', type: 'text', nullable: true },
        { name: 'notes', type: 'text', nullable: true },
        { name: 'tags', type: 'jsonb', defaultValue: "'[]'" },
        { name: 'custom_fields', type: 'jsonb', defaultValue: "'{}'" },
        { name: 'site_id', type: 'uuid', references: { table: 'sites', column: 'id' } },
        { name: 'assigned_to', type: 'uuid', references: { table: 'users', column: 'id' }, nullable: true },
        { name: 'created_by', type: 'uuid', references: { table: 'users', column: 'id' } },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamptz', defaultValue: 'now()' },
      ],
      indexes: [
        { columns: ['site_id'] },
        { columns: ['email'] },
        { columns: ['status'] },
        { columns: ['assigned_to'] },
      ],
      rls: true,
    },
    {
      name: 'deals',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
        { name: 'title', type: 'text', nullable: false },
        { name: 'value', type: 'numeric', defaultValue: '0' },
        { name: 'currency', type: 'text', defaultValue: "'USD'" },
        { name: 'stage', type: 'text', defaultValue: "'qualification'" },
        { name: 'probability', type: 'integer', defaultValue: '0' },
        { name: 'expected_close_date', type: 'date', nullable: true },
        { name: 'actual_close_date', type: 'date', nullable: true },
        { name: 'won', type: 'boolean', nullable: true },
        { name: 'notes', type: 'text', nullable: true },
        { name: 'contact_id', type: 'uuid', references: { table: 'contacts', column: 'id' }, nullable: true },
        { name: 'site_id', type: 'uuid', references: { table: 'sites', column: 'id' } },
        { name: 'assigned_to', type: 'uuid', references: { table: 'users', column: 'id' }, nullable: true },
        { name: 'created_by', type: 'uuid', references: { table: 'users', column: 'id' } },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamptz', defaultValue: 'now()' },
      ],
      indexes: [
        { columns: ['site_id'] },
        { columns: ['stage'] },
        { columns: ['contact_id'] },
        { columns: ['assigned_to'] },
      ],
      rls: true,
    },
    {
      name: 'activities',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
        { name: 'type', type: 'text', nullable: false }, // call, email, meeting, note, task
        { name: 'subject', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'scheduled_at', type: 'timestamptz', nullable: true },
        { name: 'completed_at', type: 'timestamptz', nullable: true },
        { name: 'duration_minutes', type: 'integer', nullable: true },
        { name: 'contact_id', type: 'uuid', references: { table: 'contacts', column: 'id' }, nullable: true },
        { name: 'deal_id', type: 'uuid', references: { table: 'deals', column: 'id' }, nullable: true },
        { name: 'site_id', type: 'uuid', references: { table: 'sites', column: 'id' } },
        { name: 'assigned_to', type: 'uuid', references: { table: 'users', column: 'id' }, nullable: true },
        { name: 'created_by', type: 'uuid', references: { table: 'users', column: 'id' } },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamptz', defaultValue: 'now()' },
      ],
      indexes: [
        { columns: ['site_id'] },
        { columns: ['contact_id'] },
        { columns: ['deal_id'] },
        { columns: ['type'] },
        { columns: ['scheduled_at'] },
      ],
      rls: true,
    },
  ],

  // Permissions
  permissions: [
    {
      id: 'module.view_contacts',
      name: 'View Contacts',
      description: 'View contacts in the CRM',
      roles: ['admin', 'site_admin', 'site_user'],
    },
    {
      id: 'module.manage_contacts',
      name: 'Manage Contacts',
      description: 'Create, edit, and delete contacts',
      roles: ['admin', 'site_admin'],
    },
    {
      id: 'module.view_deals',
      name: 'View Deals',
      description: 'View deals in the CRM',
      roles: ['admin', 'site_admin', 'site_user'],
    },
    {
      id: 'module.manage_deals',
      name: 'Manage Deals',
      description: 'Create, edit, and delete deals',
      roles: ['admin', 'site_admin'],
    },
    {
      id: 'module.view_activities',
      name: 'View Activities',
      description: 'View activities and history',
      roles: ['admin', 'site_admin', 'site_user'],
    },
    {
      id: 'module.manage_activities',
      name: 'Manage Activities',
      description: 'Create, edit, and delete activities',
      roles: ['admin', 'site_admin', 'site_user'],
    },
    {
      id: 'module.export_data',
      name: 'Export Data',
      description: 'Export CRM data to CSV/Excel',
      roles: ['admin', 'site_admin'],
    },
  ],

  // Module settings schema
  settings: {
    type: 'object',
    properties: {
      dealStages: {
        type: 'array',
        default: ['qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
        description: 'Pipeline stages for deals',
      },
      contactStatuses: {
        type: 'array',
        default: ['lead', 'qualified', 'customer', 'churned'],
        description: 'Available contact statuses',
      },
      defaultCurrency: {
        type: 'string',
        default: 'USD',
        description: 'Default currency for deals',
      },
      enableEmailIntegration: {
        type: 'boolean',
        default: false,
        description: 'Enable email tracking integration',
      },
    },
  },

  // Entry points
  entryPoints: {
    dashboard: './src/Dashboard',
    settings: './src/Settings',
  },

  // Event subscriptions
  events: {
    onDealWon: {
      description: 'Triggered when a deal is marked as won',
    },
    onDealLost: {
      description: 'Triggered when a deal is marked as lost',
    },
    onContactCreated: {
      description: 'Triggered when a new contact is created',
    },
  },

  // Lifecycle hooks
  hooks: {
    onInstall: async (ctx) => {
      console.log('CRM module installed for site:', ctx.siteId);
    },
    onUninstall: async (ctx) => {
      console.log('CRM module uninstalled from site:', ctx.siteId);
    },
  },
});
