export type UserRole = "super_admin" | "agency_owner" | "agency_admin" | "agency_member" | "client";

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RolePermissions {
  super_admin: Permission[];
  agency_owner: Permission[];
  agency_admin: Permission[];
  agency_member: Permission[];
  client: Permission[];
}

export const PERMISSIONS = {
  // Platform level
  MANAGE_PLATFORM: "manage_platform",
  VIEW_ALL_AGENCIES: "view_all_agencies",
  IMPERSONATE_USERS: "impersonate_users",
  MANAGE_SUBSCRIPTIONS: "manage_subscriptions",
  VIEW_PLATFORM_ANALYTICS: "view_platform_analytics",
  
  // Agency level
  MANAGE_AGENCY: "manage_agency",
  INVITE_TEAM_MEMBERS: "invite_team_members",
  MANAGE_TEAM_ROLES: "manage_team_roles",
  DELETE_AGENCY: "delete_agency",
  VIEW_BILLING: "view_billing",
  MANAGE_BILLING: "manage_billing",
  
  // Client level
  MANAGE_CLIENTS: "manage_clients",
  VIEW_CLIENTS: "view_clients",
  DELETE_CLIENTS: "delete_clients",
  
  // Site level
  CREATE_SITES: "create_sites",
  EDIT_SITES: "edit_sites",
  DELETE_SITES: "delete_sites",
  PUBLISH_SITES: "publish_sites",
  
  // Content level
  EDIT_CONTENT: "edit_content",
  VIEW_ANALYTICS: "view_analytics",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: Object.values(PERMISSIONS),
  agency_owner: [
    PERMISSIONS.MANAGE_AGENCY,
    PERMISSIONS.INVITE_TEAM_MEMBERS,
    PERMISSIONS.MANAGE_TEAM_ROLES,
    PERMISSIONS.DELETE_AGENCY,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.MANAGE_BILLING,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    PERMISSIONS.CREATE_SITES,
    PERMISSIONS.EDIT_SITES,
    PERMISSIONS.DELETE_SITES,
    PERMISSIONS.PUBLISH_SITES,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  agency_admin: [
    PERMISSIONS.INVITE_TEAM_MEMBERS,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_SITES,
    PERMISSIONS.EDIT_SITES,
    PERMISSIONS.DELETE_SITES,
    PERMISSIONS.PUBLISH_SITES,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  agency_member: [
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.EDIT_SITES,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  client: [
    PERMISSIONS.VIEW_ANALYTICS,
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  agency_owner: "Agency Owner",
  agency_admin: "Agency Admin",
  agency_member: "Agency Member",
  client: "Client",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: "Full platform access including all agencies and system settings",
  agency_owner: "Full access to agency including billing, team, and all clients",
  agency_admin: "Manage clients and sites, invite team members",
  agency_member: "View and edit assigned clients and sites",
  client: "View-only access to own site analytics",
};
