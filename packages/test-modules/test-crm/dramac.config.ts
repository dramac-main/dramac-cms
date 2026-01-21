import { defineModule } from '@dramac/sdk';

export default defineModule({
  id: 'test-crm',
  name: 'Test Crm',
  version: '1.0.0',
  description: 'A Dramac module',
  icon: 'Package',
  category: 'crm',
  type: 'app',

  entry: {
    dashboard: './src/Dashboard.tsx',
    settings: './src/Settings.tsx',
  },

  database: {
    tables: [
      // Add your tables here
      // Example:
      // {
      //   name: 'test-crm_items',
      //   columns: [
      //     { name: 'id', type: 'uuid', default: 'gen_random_uuid()' },
      //     { name: 'site_id', type: 'uuid', references: 'sites(id)' },
      //     { name: 'name', type: 'text' },
      //     { name: 'created_at', type: 'timestamptz', default: 'now()' }
      //   ]
      // }
    ]
  },

  permissions: [
    { key: 'view', name: 'View', category: 'General' },
    { key: 'manage', name: 'Full Access', category: 'General' }
  ],

  roles: [
    { slug: 'admin', name: 'Admin', permissions: ['*'], hierarchyLevel: 100 },
    { slug: 'user', name: 'User', permissions: ['view'], hierarchyLevel: 10, isDefault: true }
  ]
});
