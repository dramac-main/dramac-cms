/**
 * Module Permissions System
 * 
 * Defines and manages permissions for module operations.
 */

// Core permission types
export const MODULE_PERMISSIONS = {
  // Data access
  READ_CLIENT_DATA: "read:client_data",
  WRITE_CLIENT_DATA: "write:client_data",
  READ_SITE_DATA: "read:site_data",
  WRITE_SITE_DATA: "write:site_data",
  
  // User interactions
  SEND_NOTIFICATIONS: "send:notifications",
  SEND_EMAILS: "send:emails",
  
  // Storage
  USE_STORAGE: "use:storage",
  USE_DATABASE: "use:database",
  
  // External
  FETCH_EXTERNAL: "fetch:external",
  EMBED_CONTENT: "embed:content",
  
  // UI
  OPEN_MODAL: "ui:modal",
  SHOW_TOAST: "ui:toast",
  
  // Analytics
  TRACK_EVENTS: "track:events",
  READ_ANALYTICS: "read:analytics",
  
  // Billing
  PROCESS_PAYMENTS: "billing:process",
  VIEW_BILLING: "billing:view",
} as const;

export type ModulePermission = typeof MODULE_PERMISSIONS[keyof typeof MODULE_PERMISSIONS];

// Permission groups for common use cases
export const PERMISSION_GROUPS = {
  basic: [
    MODULE_PERMISSIONS.READ_CLIENT_DATA,
    MODULE_PERMISSIONS.SHOW_TOAST,
  ],
  standard: [
    MODULE_PERMISSIONS.READ_CLIENT_DATA,
    MODULE_PERMISSIONS.WRITE_CLIENT_DATA,
    MODULE_PERMISSIONS.USE_STORAGE,
    MODULE_PERMISSIONS.SHOW_TOAST,
    MODULE_PERMISSIONS.TRACK_EVENTS,
  ],
  advanced: [
    MODULE_PERMISSIONS.READ_CLIENT_DATA,
    MODULE_PERMISSIONS.WRITE_CLIENT_DATA,
    MODULE_PERMISSIONS.READ_SITE_DATA,
    MODULE_PERMISSIONS.WRITE_SITE_DATA,
    MODULE_PERMISSIONS.USE_STORAGE,
    MODULE_PERMISSIONS.USE_DATABASE,
    MODULE_PERMISSIONS.SEND_NOTIFICATIONS,
    MODULE_PERMISSIONS.FETCH_EXTERNAL,
    MODULE_PERMISSIONS.EMBED_CONTENT,
    MODULE_PERMISSIONS.OPEN_MODAL,
    MODULE_PERMISSIONS.SHOW_TOAST,
    MODULE_PERMISSIONS.TRACK_EVENTS,
    MODULE_PERMISSIONS.READ_ANALYTICS,
  ],
  full: Object.values(MODULE_PERMISSIONS),
} as const;

/**
 * Permission checker class
 */
export class PermissionChecker {
  private granted: Set<ModulePermission>;

  constructor(permissions: ModulePermission[] = []) {
    this.granted = new Set(permissions);
  }

  /**
   * Check if a single permission is granted
   */
  has(permission: ModulePermission): boolean {
    return this.granted.has(permission);
  }

  /**
   * Check if all permissions are granted
   */
  hasAll(permissions: ModulePermission[]): boolean {
    return permissions.every(p => this.granted.has(p));
  }

  /**
   * Check if any of the permissions are granted
   */
  hasAny(permissions: ModulePermission[]): boolean {
    return permissions.some(p => this.granted.has(p));
  }

  /**
   * Get all granted permissions
   */
  getAll(): ModulePermission[] {
    return Array.from(this.granted);
  }

  /**
   * Grant additional permissions
   */
  grant(permissions: ModulePermission | ModulePermission[]): void {
    const perms = Array.isArray(permissions) ? permissions : [permissions];
    perms.forEach(p => this.granted.add(p));
  }

  /**
   * Revoke permissions
   */
  revoke(permissions: ModulePermission | ModulePermission[]): void {
    const perms = Array.isArray(permissions) ? permissions : [permissions];
    perms.forEach(p => this.granted.delete(p));
  }
}

/**
 * Get human-readable permission description
 */
export function getPermissionDescription(permission: ModulePermission): string {
  const descriptions: Record<ModulePermission, string> = {
    [MODULE_PERMISSIONS.READ_CLIENT_DATA]: "Read client information",
    [MODULE_PERMISSIONS.WRITE_CLIENT_DATA]: "Modify client information",
    [MODULE_PERMISSIONS.READ_SITE_DATA]: "Read website data",
    [MODULE_PERMISSIONS.WRITE_SITE_DATA]: "Modify website data",
    [MODULE_PERMISSIONS.SEND_NOTIFICATIONS]: "Send notifications",
    [MODULE_PERMISSIONS.SEND_EMAILS]: "Send emails",
    [MODULE_PERMISSIONS.USE_STORAGE]: "Use local storage",
    [MODULE_PERMISSIONS.USE_DATABASE]: "Access database",
    [MODULE_PERMISSIONS.FETCH_EXTERNAL]: "Connect to external services",
    [MODULE_PERMISSIONS.EMBED_CONTENT]: "Embed external content",
    [MODULE_PERMISSIONS.OPEN_MODAL]: "Open modal dialogs",
    [MODULE_PERMISSIONS.SHOW_TOAST]: "Show notifications",
    [MODULE_PERMISSIONS.TRACK_EVENTS]: "Track analytics events",
    [MODULE_PERMISSIONS.READ_ANALYTICS]: "View analytics data",
    [MODULE_PERMISSIONS.PROCESS_PAYMENTS]: "Process payments",
    [MODULE_PERMISSIONS.VIEW_BILLING]: "View billing information",
  };

  return descriptions[permission] || permission;
}

/**
 * Get permissions for a permission group
 */
export function getPermissionGroup(group: keyof typeof PERMISSION_GROUPS): ModulePermission[] {
  return [...PERMISSION_GROUPS[group]];
}

/**
 * Validate if requested permissions are allowed
 */
export function validatePermissions(
  requested: ModulePermission[],
  allowed: ModulePermission[]
): { valid: boolean; denied: ModulePermission[] } {
  const allowedSet = new Set(allowed);
  const denied = requested.filter(p => !allowedSet.has(p));
  
  return {
    valid: denied.length === 0,
    denied,
  };
}
