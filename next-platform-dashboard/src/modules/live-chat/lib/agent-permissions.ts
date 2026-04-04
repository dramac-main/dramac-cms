/**
 * Agent Permissions System
 *
 * Comprehensive granular permissions for live chat agents.
 * Permissions are stored as JSONB on the agent record.
 * When a permission is not explicitly set, it falls back to role-based defaults.
 */

import type { AgentRole } from "../types";

// =============================================================================
// PERMISSION DEFINITIONS
// =============================================================================

/** All available permission keys */
export type PermissionKey =
  // Chat
  | "chat_respond"
  | "chat_transfer"
  | "chat_close"
  | "chat_view_all"
  | "chat_assign"
  | "chat_delete_messages"
  // Quotes
  | "quotes_view"
  | "quotes_create"
  | "quotes_edit"
  | "quotes_approve"
  | "quotes_delete"
  // Orders
  | "orders_view"
  | "orders_process"
  | "orders_refund"
  | "orders_edit"
  // Customers
  | "customers_view"
  | "customers_edit"
  | "customers_delete"
  // Products
  | "products_view"
  | "products_edit"
  | "products_create"
  | "products_delete"
  // Bookings
  | "bookings_view"
  | "bookings_manage"
  // Analytics & Reports
  | "analytics_view"
  | "analytics_export"
  // Agent Management
  | "agents_view"
  | "agents_manage"
  | "agents_permissions"
  // Settings
  | "settings_departments"
  | "settings_chat_widget"
  | "settings_general";

/** Permission metadata for UI display */
export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCategory =
  | "chat"
  | "quotes"
  | "orders"
  | "customers"
  | "products"
  | "bookings"
  | "analytics"
  | "agents"
  | "settings";

export interface PermissionCategoryMeta {
  key: PermissionCategory;
  label: string;
  icon: string; // lucide icon name
}

/** Map of permission key -> boolean */
export type AgentPermissions = Partial<Record<PermissionKey, boolean>>;

// =============================================================================
// CATEGORY METADATA
// =============================================================================

export const PERMISSION_CATEGORIES: PermissionCategoryMeta[] = [
  { key: "chat", label: "Live Chat", icon: "MessageSquare" },
  { key: "quotes", label: "Quotes", icon: "FileText" },
  { key: "orders", label: "Orders", icon: "Package" },
  { key: "customers", label: "Customers", icon: "Users" },
  { key: "products", label: "Products", icon: "ShoppingBag" },
  { key: "bookings", label: "Bookings", icon: "Calendar" },
  { key: "analytics", label: "Analytics & Reports", icon: "BarChart3" },
  { key: "agents", label: "Agent Management", icon: "UserCog" },
  { key: "settings", label: "Settings", icon: "Settings" },
];

// =============================================================================
// ALL PERMISSIONS
// =============================================================================

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // ── Chat ──
  {
    key: "chat_respond",
    label: "Respond to Messages",
    description: "Send messages in assigned conversations",
    category: "chat",
  },
  {
    key: "chat_transfer",
    label: "Transfer Chats",
    description: "Transfer conversations to other agents or departments",
    category: "chat",
  },
  {
    key: "chat_close",
    label: "Close Conversations",
    description: "Resolve or close chat conversations",
    category: "chat",
  },
  {
    key: "chat_view_all",
    label: "View All Conversations",
    description: "View conversations assigned to other agents",
    category: "chat",
  },
  {
    key: "chat_assign",
    label: "Assign Chats",
    description: "Assign or reassign conversations to agents",
    category: "chat",
  },
  {
    key: "chat_delete_messages",
    label: "Delete Messages",
    description: "Remove messages from conversations",
    category: "chat",
  },

  // ── Quotes ──
  {
    key: "quotes_view",
    label: "View Quotes",
    description: "View all quote requests and details",
    category: "quotes",
  },
  {
    key: "quotes_create",
    label: "Create Quotes",
    description: "Create new quotes for customers",
    category: "quotes",
  },
  {
    key: "quotes_edit",
    label: "Edit Quotes",
    description: "Modify quote pricing, items, and details",
    category: "quotes",
  },
  {
    key: "quotes_approve",
    label: "Approve & Send Quotes",
    description: "Approve quotes and send them to customers",
    category: "quotes",
  },
  {
    key: "quotes_delete",
    label: "Delete Quotes",
    description: "Permanently delete quote records",
    category: "quotes",
  },

  // ── Orders ──
  {
    key: "orders_view",
    label: "View Orders",
    description: "View order details and history",
    category: "orders",
  },
  {
    key: "orders_process",
    label: "Process Orders",
    description: "Mark orders as fulfilled, shipped, or completed",
    category: "orders",
  },
  {
    key: "orders_refund",
    label: "Issue Refunds",
    description: "Process refunds for orders",
    category: "orders",
  },
  {
    key: "orders_edit",
    label: "Edit Orders",
    description: "Modify order details, notes, and shipping info",
    category: "orders",
  },

  // ── Customers ──
  {
    key: "customers_view",
    label: "View Customers",
    description: "Access customer profiles and contact info",
    category: "customers",
  },
  {
    key: "customers_edit",
    label: "Edit Customers",
    description: "Update customer details and notes",
    category: "customers",
  },
  {
    key: "customers_delete",
    label: "Delete Customers",
    description: "Remove customer records",
    category: "customers",
  },

  // ── Products ──
  {
    key: "products_view",
    label: "View Products",
    description: "Browse product catalog",
    category: "products",
  },
  {
    key: "products_edit",
    label: "Edit Products",
    description: "Update product details, pricing, and images",
    category: "products",
  },
  {
    key: "products_create",
    label: "Create Products",
    description: "Add new products to the catalog",
    category: "products",
  },
  {
    key: "products_delete",
    label: "Delete Products",
    description: "Remove products from the catalog",
    category: "products",
  },

  // ── Bookings ──
  {
    key: "bookings_view",
    label: "View Bookings",
    description: "See all appointments and bookings",
    category: "bookings",
  },
  {
    key: "bookings_manage",
    label: "Manage Bookings",
    description: "Confirm, cancel, or reschedule bookings",
    category: "bookings",
  },

  // ── Analytics ──
  {
    key: "analytics_view",
    label: "View Analytics",
    description: "Access reports, dashboards, and performance metrics",
    category: "analytics",
  },
  {
    key: "analytics_export",
    label: "Export Data",
    description: "Export reports and data as CSV or PDF",
    category: "analytics",
  },

  // ── Agent Management ──
  {
    key: "agents_view",
    label: "View Agents",
    description: "See other agents and their status",
    category: "agents",
  },
  {
    key: "agents_manage",
    label: "Manage Agents",
    description: "Add, edit, or remove chat agents",
    category: "agents",
  },
  {
    key: "agents_permissions",
    label: "Manage Permissions",
    description: "Change agent roles and permission settings",
    category: "agents",
  },

  // ── Settings ──
  {
    key: "settings_departments",
    label: "Manage Departments",
    description: "Create, edit, and delete departments",
    category: "settings",
  },
  {
    key: "settings_chat_widget",
    label: "Chat Widget Settings",
    description: "Configure the chat widget appearance and behavior",
    category: "settings",
  },
  {
    key: "settings_general",
    label: "General Settings",
    description: "Modify site-level settings and configuration",
    category: "settings",
  },
];

// =============================================================================
// ROLE-BASED DEFAULTS
// =============================================================================

const ADMIN_DEFAULTS: Record<PermissionKey, boolean> = {
  chat_respond: true,
  chat_transfer: true,
  chat_close: true,
  chat_view_all: true,
  chat_assign: true,
  chat_delete_messages: true,
  quotes_view: true,
  quotes_create: true,
  quotes_edit: true,
  quotes_approve: true,
  quotes_delete: true,
  orders_view: true,
  orders_process: true,
  orders_refund: true,
  orders_edit: true,
  customers_view: true,
  customers_edit: true,
  customers_delete: true,
  products_view: true,
  products_edit: true,
  products_create: true,
  products_delete: true,
  bookings_view: true,
  bookings_manage: true,
  analytics_view: true,
  analytics_export: true,
  agents_view: true,
  agents_manage: true,
  agents_permissions: true,
  settings_departments: true,
  settings_chat_widget: true,
  settings_general: true,
};

const SUPERVISOR_DEFAULTS: Record<PermissionKey, boolean> = {
  chat_respond: true,
  chat_transfer: true,
  chat_close: true,
  chat_view_all: true,
  chat_assign: true,
  chat_delete_messages: false,
  quotes_view: true,
  quotes_create: true,
  quotes_edit: true,
  quotes_approve: true,
  quotes_delete: false,
  orders_view: true,
  orders_process: true,
  orders_refund: false,
  orders_edit: true,
  customers_view: true,
  customers_edit: true,
  customers_delete: false,
  products_view: true,
  products_edit: true,
  products_create: true,
  products_delete: false,
  bookings_view: true,
  bookings_manage: true,
  analytics_view: true,
  analytics_export: true,
  agents_view: true,
  agents_manage: true,
  agents_permissions: false,
  settings_departments: true,
  settings_chat_widget: false,
  settings_general: false,
};

const AGENT_DEFAULTS: Record<PermissionKey, boolean> = {
  chat_respond: true,
  chat_transfer: true,
  chat_close: true,
  chat_view_all: false,
  chat_assign: false,
  chat_delete_messages: false,
  quotes_view: true,
  quotes_create: false,
  quotes_edit: false,
  quotes_approve: false,
  quotes_delete: false,
  orders_view: true,
  orders_process: false,
  orders_refund: false,
  orders_edit: false,
  customers_view: true,
  customers_edit: false,
  customers_delete: false,
  products_view: true,
  products_edit: false,
  products_create: false,
  products_delete: false,
  bookings_view: true,
  bookings_manage: false,
  analytics_view: false,
  analytics_export: false,
  agents_view: true,
  agents_manage: false,
  agents_permissions: false,
  settings_departments: false,
  settings_chat_widget: false,
  settings_general: false,
};

const ROLE_DEFAULTS: Record<AgentRole, Record<PermissionKey, boolean>> = {
  admin: ADMIN_DEFAULTS,
  supervisor: SUPERVISOR_DEFAULTS,
  agent: AGENT_DEFAULTS,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the effective permissions for an agent, merging explicit overrides
 * with role-based defaults.
 *
 * Priority: explicit permissions > role defaults
 */
export function getEffectivePermissions(
  role: AgentRole,
  explicitPermissions: AgentPermissions = {},
): Record<PermissionKey, boolean> {
  const defaults = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.agent;
  return { ...defaults, ...explicitPermissions };
}

/**
 * Check if an agent has a specific permission.
 */
export function hasPermission(
  role: AgentRole,
  explicitPermissions: AgentPermissions | undefined,
  permission: PermissionKey,
): boolean {
  const effective = getEffectivePermissions(role, explicitPermissions || {});
  return effective[permission] ?? false;
}

/**
 * Get the default permissions template for a role.
 */
export function getDefaultPermissions(
  role: AgentRole,
): Record<PermissionKey, boolean> {
  return { ...ROLE_DEFAULTS[role] };
}

/**
 * Get permissions grouped by category for UI display.
 */
export function getPermissionsByCategory(): {
  category: PermissionCategoryMeta;
  permissions: PermissionDefinition[];
}[] {
  return PERMISSION_CATEGORIES.map((cat) => ({
    category: cat,
    permissions: ALL_PERMISSIONS.filter((p) => p.category === cat.key),
  }));
}

/**
 * Count how many permissions are enabled vs total.
 */
export function countPermissions(
  role: AgentRole,
  explicitPermissions: AgentPermissions = {},
): { enabled: number; total: number } {
  const effective = getEffectivePermissions(role, explicitPermissions);
  const total = ALL_PERMISSIONS.length;
  const enabled = Object.values(effective).filter(Boolean).length;
  return { enabled, total };
}
