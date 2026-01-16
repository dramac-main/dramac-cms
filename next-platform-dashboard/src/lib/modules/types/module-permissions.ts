/**
 * Module Permissions System
 * 
 * Defines the permission model for modules including:
 * - Permission checking utilities
 * - Permission request flows
 * - Permission scoping by installation level
 */

import { ModulePermission, ModuleInstallLevel, PERMISSION_INFO } from "./module-manifest";

// =============================================================
// PERMISSION SCOPES
// =============================================================

/**
 * Permissions available at each installation level
 * Higher levels include lower level permissions
 */
export const PERMISSIONS_BY_LEVEL: Record<ModuleInstallLevel, ModulePermission[]> = {
  platform: [
    // Platform modules have full access
    "read:site",
    "read:sites",
    "read:page",
    "read:pages",
    "read:client",
    "read:clients",
    "read:agency",
    "read:user",
    "read:analytics",
    "read:settings",
    "write:site",
    "write:page",
    "write:client",
    "write:agency",
    "write:settings",
    "send:email",
    "send:notification",
    "access:storage",
    "access:api",
    "access:billing",
    "access:webhooks",
    "execute:background",
    "access:realtime",
  ],
  agency: [
    // Agency modules can access agency-wide data
    "read:sites",
    "read:clients",
    "read:agency",
    "read:user",
    "read:analytics",
    "read:settings",
    "write:agency",
    "write:settings",
    "send:email",
    "send:notification",
    "access:storage",
    "access:api",
    "access:webhooks",
    "execute:background",
    "access:realtime",
  ],
  client: [
    // Client modules can access client data
    "read:client",
    "read:sites",
    "read:user",
    "read:analytics",
    "read:settings",
    "write:client",
    "write:settings",
    "send:email",
    "send:notification",
    "access:storage",
    "access:api",
    "access:realtime",
  ],
  site: [
    // Site modules have most limited access
    "read:site",
    "read:page",
    "read:pages",
    "read:user",
    "read:analytics",
    "read:settings",
    "write:site",
    "write:page",
    "write:settings",
    "send:notification",
    "access:storage",
    "access:api",
    "access:realtime",
  ],
};

// =============================================================
// PERMISSION CHECKING
// =============================================================

export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
  missingPermissions?: ModulePermission[];
}

/**
 * Check if a permission is allowed for a given installation level
 */
export function isPermissionAllowedForLevel(
  permission: ModulePermission,
  level: ModuleInstallLevel
): boolean {
  return PERMISSIONS_BY_LEVEL[level]?.includes(permission) ?? false;
}

/**
 * Check if all requested permissions are allowed for a level
 */
export function validatePermissionsForLevel(
  requestedPermissions: ModulePermission[],
  level: ModuleInstallLevel
): PermissionCheckResult {
  const allowedPermissions = PERMISSIONS_BY_LEVEL[level] || [];
  const missingPermissions = requestedPermissions.filter(
    (p) => !allowedPermissions.includes(p)
  );

  if (missingPermissions.length > 0) {
    return {
      granted: false,
      reason: `The following permissions are not available at ${level} level: ${missingPermissions.join(", ")}`,
      missingPermissions,
    };
  }

  return { granted: true };
}

/**
 * Check if a module has a specific permission granted
 */
export function checkModulePermission(
  grantedPermissions: ModulePermission[],
  requiredPermission: ModulePermission
): boolean {
  return grantedPermissions.includes(requiredPermission);
}

/**
 * Check if a module has all required permissions
 */
export function checkModulePermissions(
  grantedPermissions: ModulePermission[],
  requiredPermissions: ModulePermission[]
): PermissionCheckResult {
  const missingPermissions = requiredPermissions.filter(
    (p) => !grantedPermissions.includes(p)
  );

  if (missingPermissions.length > 0) {
    return {
      granted: false,
      reason: `Missing permissions: ${missingPermissions.join(", ")}`,
      missingPermissions,
    };
  }

  return { granted: true };
}

// =============================================================
// PERMISSION GROUPING FOR UI
// =============================================================

export interface PermissionGroup {
  name: string;
  description: string;
  permissions: {
    permission: ModulePermission;
    label: string;
    description: string;
    risk: "low" | "medium" | "high";
  }[];
}

export function getGroupedPermissions(): PermissionGroup[] {
  return [
    {
      name: "Read Access",
      description: "Permissions to view data",
      permissions: [
        "read:site",
        "read:sites",
        "read:page",
        "read:pages",
        "read:client",
        "read:clients",
        "read:agency",
        "read:user",
        "read:analytics",
        "read:settings",
      ].map((p) => ({
        permission: p as ModulePermission,
        ...PERMISSION_INFO[p as ModulePermission],
      })),
    },
    {
      name: "Write Access",
      description: "Permissions to modify data",
      permissions: [
        "write:site",
        "write:page",
        "write:client",
        "write:agency",
        "write:settings",
      ].map((p) => ({
        permission: p as ModulePermission,
        ...PERMISSION_INFO[p as ModulePermission],
      })),
    },
    {
      name: "Communication",
      description: "Permissions for messaging and notifications",
      permissions: ["send:email", "send:notification"].map((p) => ({
        permission: p as ModulePermission,
        ...PERMISSION_INFO[p as ModulePermission],
      })),
    },
    {
      name: "Resources",
      description: "Access to platform resources",
      permissions: [
        "access:storage",
        "access:api",
        "access:billing",
        "access:webhooks",
      ].map((p) => ({
        permission: p as ModulePermission,
        ...PERMISSION_INFO[p as ModulePermission],
      })),
    },
    {
      name: "Advanced",
      description: "Special capabilities",
      permissions: ["execute:background", "access:realtime"].map((p) => ({
        permission: p as ModulePermission,
        ...PERMISSION_INFO[p as ModulePermission],
      })),
    },
  ];
}

/**
 * Get risk summary for a set of permissions
 */
export function getPermissionRiskSummary(
  permissions: ModulePermission[]
): {
  total: number;
  high: number;
  medium: number;
  low: number;
  overallRisk: "low" | "medium" | "high";
} {
  const summary = {
    total: permissions.length,
    high: 0,
    medium: 0,
    low: 0,
    overallRisk: "low" as "low" | "medium" | "high",
  };

  for (const permission of permissions) {
    const info = PERMISSION_INFO[permission];
    if (info) {
      summary[info.risk]++;
    }
  }

  // Determine overall risk
  if (summary.high > 0) {
    summary.overallRisk = "high";
  } else if (summary.medium > 2) {
    summary.overallRisk = "high";
  } else if (summary.medium > 0) {
    summary.overallRisk = "medium";
  }

  return summary;
}

// =============================================================
// PERMISSION REQUEST CONTEXT
// =============================================================

export interface PermissionRequest {
  moduleId: string;
  moduleName: string;
  moduleSlug: string;
  requestedPermissions: ModulePermission[];
  reason?: string;
  installLevel: ModuleInstallLevel;
}

export interface PermissionGrant {
  moduleId: string;
  permissions: ModulePermission[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

/**
 * Format permission for display
 */
export function formatPermission(permission: ModulePermission): string {
  const info = PERMISSION_INFO[permission];
  return info?.label || permission;
}

/**
 * Get color class for risk level
 */
export function getRiskColorClass(risk: "low" | "medium" | "high"): string {
  switch (risk) {
    case "high":
      return "text-destructive";
    case "medium":
      return "text-warning";
    case "low":
      return "text-success";
    default:
      return "text-muted-foreground";
  }
}

/**
 * Get badge variant for risk level
 */
export function getRiskBadgeVariant(
  risk: "low" | "medium" | "high"
): "default" | "secondary" | "destructive" | "outline" {
  switch (risk) {
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "default";
  }
}
