/**
 * Module Permission Definitions
 * 
 * Pre-defined permission sets and role templates for common module types.
 * Use these as starting points when creating new modules.
 */

import { RoleDefinition } from './role-management';

// ============================================================================
// Permission Definition Types
// ============================================================================

export interface PermissionDefinition {
  key: string;
  name: string;
  description?: string;
  category: string;
}

export interface ModulePermissionSet {
  moduleName: string;
  permissions: PermissionDefinition[];
  defaultRoles: RoleDefinition[];
}

// ============================================================================
// Common Permission Patterns
// ============================================================================

/**
 * Generate CRUD permissions for a resource
 */
export function generateCrudPermissions(
  resource: string,
  resourceLabel: string,
  category: string
): PermissionDefinition[] {
  return [
    { key: `${resource}.view`, name: `View ${resourceLabel}`, category },
    { key: `${resource}.create`, name: `Create ${resourceLabel}`, category },
    { key: `${resource}.edit`, name: `Edit ${resourceLabel}`, category },
    { key: `${resource}.delete`, name: `Delete ${resourceLabel}`, category },
  ];
}

/**
 * Generate extended permissions for a resource
 */
export function generateExtendedPermissions(
  resource: string,
  resourceLabel: string,
  category: string
): PermissionDefinition[] {
  return [
    ...generateCrudPermissions(resource, resourceLabel, category),
    { key: `${resource}.export`, name: `Export ${resourceLabel}`, category },
    { key: `${resource}.import`, name: `Import ${resourceLabel}`, category },
    { key: `${resource}.bulk-edit`, name: `Bulk Edit ${resourceLabel}`, category },
    { key: `${resource}.archive`, name: `Archive ${resourceLabel}`, category },
  ];
}

/**
 * Generate admin permissions
 */
export function generateAdminPermissions(): PermissionDefinition[] {
  return [
    { key: 'settings.view', name: 'View Settings', category: 'Admin' },
    { key: 'settings.manage', name: 'Manage Settings', category: 'Admin' },
    { key: 'users.view', name: 'View Users', category: 'Admin' },
    { key: 'users.manage', name: 'Manage Users', category: 'Admin' },
    { key: 'users.invite', name: 'Invite Users', category: 'Admin' },
    { key: 'roles.view', name: 'View Roles', category: 'Admin' },
    { key: 'roles.manage', name: 'Manage Roles', category: 'Admin' },
    { key: 'audit.view', name: 'View Audit Logs', category: 'Admin' },
  ];
}

// ============================================================================
// Standard Role Templates
// ============================================================================

/**
 * Standard three-tier role hierarchy
 */
export function generateStandardRoles(
  viewerPermissions: string[],
  editorPermissions: string[],
  adminPermissions: string[] = ['*']
): RoleDefinition[] {
  return [
    {
      name: 'Admin',
      slug: 'admin',
      description: 'Full access to all features',
      permissions: adminPermissions,
      hierarchyLevel: 100,
    },
    {
      name: 'Editor',
      slug: 'editor',
      description: 'Can view and edit content',
      permissions: editorPermissions,
      hierarchyLevel: 50,
    },
    {
      name: 'Viewer',
      slug: 'viewer',
      description: 'Read-only access',
      permissions: viewerPermissions,
      hierarchyLevel: 10,
      isDefault: true,
    },
  ];
}

// ============================================================================
// CRM Module Permissions
// ============================================================================

export const CRM_PERMISSIONS: PermissionDefinition[] = [
  // Contacts
  ...generateExtendedPermissions('contacts', 'Contacts', 'Contacts'),
  
  // Companies
  ...generateExtendedPermissions('companies', 'Companies', 'Companies'),
  
  // Deals
  ...generateCrudPermissions('deals', 'Deals', 'Deals'),
  { key: 'deals.export', name: 'Export Deals', category: 'Deals' },
  { key: 'deals.move-stage', name: 'Move Deal Stage', category: 'Deals' },
  
  // Tasks
  ...generateCrudPermissions('tasks', 'Tasks', 'Tasks'),
  { key: 'tasks.assign', name: 'Assign Tasks', category: 'Tasks' },
  
  // Notes
  { key: 'notes.view', name: 'View Notes', category: 'Notes' },
  { key: 'notes.create', name: 'Create Notes', category: 'Notes' },
  { key: 'notes.edit-own', name: 'Edit Own Notes', category: 'Notes' },
  { key: 'notes.edit-all', name: 'Edit All Notes', category: 'Notes' },
  { key: 'notes.delete', name: 'Delete Notes', category: 'Notes' },
  
  // Reports
  { key: 'reports.view', name: 'View Reports', category: 'Reports' },
  { key: 'reports.create', name: 'Create Reports', category: 'Reports' },
  { key: 'reports.export', name: 'Export Reports', category: 'Reports' },
  
  // Admin
  ...generateAdminPermissions(),
];

export const CRM_DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Full access to all CRM features',
    permissions: ['*'],
    hierarchyLevel: 100,
  },
  {
    name: 'Sales Manager',
    slug: 'sales-manager',
    description: 'Manage sales team and all records',
    permissions: [
      'contacts.*',
      'companies.*',
      'deals.*',
      'tasks.*',
      'notes.*',
      'reports.*',
      'users.view',
    ],
    hierarchyLevel: 75,
  },
  {
    name: 'Sales Rep',
    slug: 'sales-rep',
    description: 'Standard sales representative access',
    permissions: [
      'contacts.view',
      'contacts.create',
      'contacts.edit',
      'companies.view',
      'companies.create',
      'deals.view',
      'deals.create',
      'deals.edit',
      'deals.move-stage',
      'tasks.view',
      'tasks.create',
      'tasks.edit',
      'notes.view',
      'notes.create',
      'notes.edit-own',
      'reports.view',
    ],
    hierarchyLevel: 50,
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access to CRM data',
    permissions: [
      'contacts.view',
      'companies.view',
      'deals.view',
      'tasks.view',
      'notes.view',
      'reports.view',
    ],
    hierarchyLevel: 10,
    isDefault: true,
  },
];

export const CRM_MODULE_PERMISSIONS: ModulePermissionSet = {
  moduleName: 'CRM',
  permissions: CRM_PERMISSIONS,
  defaultRoles: CRM_DEFAULT_ROLES,
};

// ============================================================================
// Booking Module Permissions
// ============================================================================

export const BOOKING_PERMISSIONS: PermissionDefinition[] = [
  // Services
  ...generateCrudPermissions('services', 'Services', 'Services'),
  { key: 'services.pricing', name: 'Manage Service Pricing', category: 'Services' },
  
  // Bookings
  { key: 'bookings.view', name: 'View Bookings', category: 'Bookings' },
  { key: 'bookings.view-all', name: 'View All Bookings', category: 'Bookings' },
  { key: 'bookings.create', name: 'Create Bookings', category: 'Bookings' },
  { key: 'bookings.edit', name: 'Edit Bookings', category: 'Bookings' },
  { key: 'bookings.cancel', name: 'Cancel Bookings', category: 'Bookings' },
  { key: 'bookings.reschedule', name: 'Reschedule Bookings', category: 'Bookings' },
  
  // Availability
  { key: 'availability.view', name: 'View Availability', category: 'Availability' },
  { key: 'availability.manage-own', name: 'Manage Own Availability', category: 'Availability' },
  { key: 'availability.manage-all', name: 'Manage All Availability', category: 'Availability' },
  
  // Staff
  { key: 'staff.view', name: 'View Staff', category: 'Staff' },
  { key: 'staff.manage', name: 'Manage Staff', category: 'Staff' },
  { key: 'staff.schedule', name: 'Manage Staff Schedule', category: 'Staff' },
  
  // Customers
  { key: 'customers.view', name: 'View Customers', category: 'Customers' },
  { key: 'customers.edit', name: 'Edit Customers', category: 'Customers' },
  { key: 'customers.notes', name: 'View Customer Notes', category: 'Customers' },
  
  // Reports
  { key: 'reports.view', name: 'View Reports', category: 'Reports' },
  { key: 'reports.export', name: 'Export Reports', category: 'Reports' },
  
  // Admin
  ...generateAdminPermissions(),
];

export const BOOKING_DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Full access to booking system',
    permissions: ['*'],
    hierarchyLevel: 100,
  },
  {
    name: 'Manager',
    slug: 'manager',
    description: 'Manage bookings, staff, and services',
    permissions: [
      'services.*',
      'bookings.*',
      'availability.*',
      'staff.*',
      'customers.*',
      'reports.*',
    ],
    hierarchyLevel: 75,
  },
  {
    name: 'Staff',
    slug: 'staff',
    description: 'View and manage own bookings',
    permissions: [
      'services.view',
      'bookings.view',
      'bookings.create',
      'bookings.edit',
      'bookings.reschedule',
      'availability.view',
      'availability.manage-own',
      'customers.view',
      'customers.notes',
    ],
    hierarchyLevel: 50,
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access',
    permissions: [
      'services.view',
      'bookings.view',
      'availability.view',
      'customers.view',
    ],
    hierarchyLevel: 10,
    isDefault: true,
  },
];

export const BOOKING_MODULE_PERMISSIONS: ModulePermissionSet = {
  moduleName: 'Booking',
  permissions: BOOKING_PERMISSIONS,
  defaultRoles: BOOKING_DEFAULT_ROLES,
};

// ============================================================================
// E-Commerce Module Permissions
// ============================================================================

export const ECOMMERCE_PERMISSIONS: PermissionDefinition[] = [
  // Products
  ...generateExtendedPermissions('products', 'Products', 'Products'),
  { key: 'products.inventory', name: 'Manage Inventory', category: 'Products' },
  { key: 'products.pricing', name: 'Manage Pricing', category: 'Products' },
  
  // Categories
  ...generateCrudPermissions('categories', 'Categories', 'Categories'),
  
  // Orders
  { key: 'orders.view', name: 'View Orders', category: 'Orders' },
  { key: 'orders.process', name: 'Process Orders', category: 'Orders' },
  { key: 'orders.cancel', name: 'Cancel Orders', category: 'Orders' },
  { key: 'orders.refund', name: 'Process Refunds', category: 'Orders' },
  { key: 'orders.export', name: 'Export Orders', category: 'Orders' },
  
  // Customers
  ...generateCrudPermissions('customers', 'Customers', 'Customers'),
  { key: 'customers.orders', name: 'View Customer Orders', category: 'Customers' },
  
  // Discounts
  ...generateCrudPermissions('discounts', 'Discounts', 'Discounts'),
  
  // Shipping
  { key: 'shipping.view', name: 'View Shipping', category: 'Shipping' },
  { key: 'shipping.manage', name: 'Manage Shipping', category: 'Shipping' },
  
  // Reports
  { key: 'reports.sales', name: 'View Sales Reports', category: 'Reports' },
  { key: 'reports.inventory', name: 'View Inventory Reports', category: 'Reports' },
  { key: 'reports.customers', name: 'View Customer Reports', category: 'Reports' },
  
  // Admin
  ...generateAdminPermissions(),
];

export const ECOMMERCE_DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Full store access',
    permissions: ['*'],
    hierarchyLevel: 100,
  },
  {
    name: 'Store Manager',
    slug: 'store-manager',
    description: 'Manage products, orders, and customers',
    permissions: [
      'products.*',
      'categories.*',
      'orders.*',
      'customers.*',
      'discounts.*',
      'shipping.*',
      'reports.*',
    ],
    hierarchyLevel: 75,
  },
  {
    name: 'Order Manager',
    slug: 'order-manager',
    description: 'Process and manage orders',
    permissions: [
      'products.view',
      'orders.view',
      'orders.process',
      'orders.cancel',
      'orders.refund',
      'customers.view',
      'customers.orders',
      'shipping.view',
    ],
    hierarchyLevel: 50,
  },
  {
    name: 'Inventory Manager',
    slug: 'inventory-manager',
    description: 'Manage product inventory',
    permissions: [
      'products.view',
      'products.edit',
      'products.inventory',
      'categories.view',
      'reports.inventory',
    ],
    hierarchyLevel: 50,
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access',
    permissions: [
      'products.view',
      'categories.view',
      'orders.view',
      'customers.view',
    ],
    hierarchyLevel: 10,
    isDefault: true,
  },
];

export const ECOMMERCE_MODULE_PERMISSIONS: ModulePermissionSet = {
  moduleName: 'E-Commerce',
  permissions: ECOMMERCE_PERMISSIONS,
  defaultRoles: ECOMMERCE_DEFAULT_ROLES,
};

// ============================================================================
// Permission Set Registry
// ============================================================================

export const MODULE_PERMISSION_REGISTRY: Record<string, ModulePermissionSet> = {
  crm: CRM_MODULE_PERMISSIONS,
  booking: BOOKING_MODULE_PERMISSIONS,
  ecommerce: ECOMMERCE_MODULE_PERMISSIONS,
};

/**
 * Get permission set for a module type
 */
export function getModulePermissionSet(
  moduleType: string
): ModulePermissionSet | undefined {
  return MODULE_PERMISSION_REGISTRY[moduleType.toLowerCase()];
}
