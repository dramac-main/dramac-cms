/**
 * Module Manifest Schema
 * 
 * Each module has a manifest that defines its capabilities, entry points,
 * hooks, and permissions. This is the contract between the platform and the module.
 */

// JSON Schema type for settings validation
export interface JSONSchema {
  type: "object" | "string" | "number" | "boolean" | "array";
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchemaProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  format?: "email" | "uri" | "date" | "date-time" | "color";
}

export interface ModuleManifest {
  // Identity
  id: string;
  slug: string;
  name: string;
  version: string;
  description?: string;
  
  // Installation
  installLevel: ModuleInstallLevel;
  
  // Entry Points - Where the module renders its content
  entryPoints: ModuleEntryPoints;
  
  // Hooks - Where module can inject content
  hooks: ModuleHook[];
  
  // Permissions - What module needs access to
  permissions: ModulePermission[];
  
  // API Routes (if module needs backend)
  apiRoutes?: ModuleApiRoute[];
  
  // Settings Schema (JSON Schema for configuration UI)
  settingsSchema: JSONSchema;
  defaultSettings: Record<string, unknown>;
  
  // Dependencies on other modules
  dependencies?: string[]; // Other module slugs that must be installed
  peerDependencies?: ModulePeerDependency[];
  
  // Platform compatibility
  minPlatformVersion?: string;
  maxPlatformVersion?: string;
}

export interface ModuleEntryPoints {
  // For site-level modules (inject into rendered site)
  siteHead?: string; // Inject into <head>
  siteBody?: string; // Inject into <body>
  siteFooter?: string; // Before </body>
  
  // For dashboard modules
  dashboardWidget?: string; // Dashboard widget component
  dashboardPage?: string; // Full page route
  dashboardTab?: string; // Tab in existing page
  
  // For client portal modules
  portalWidget?: string;
  portalPage?: string;
  portalTab?: string;
  
  // For agency tools
  agencyWidget?: string;
  agencyPage?: string;
  agencySidebar?: string;
  
  // Settings panel (always available if module has settings)
  settingsPanel?: string;
}

export interface ModuleApiRoute {
  path: string; // e.g., "/submit" becomes "/api/modules/{moduleId}/submit"
  methods: ("GET" | "POST" | "PUT" | "PATCH" | "DELETE")[];
  handler: string; // Path to handler in package
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  requiresAuth?: boolean;
}

export interface ModulePeerDependency {
  module: string; // Module slug
  version: string; // Semver range
  optional?: boolean;
}

export type ModuleInstallLevel = "platform" | "agency" | "client" | "site";

// All possible hooks where modules can inject content
export type ModuleHook =
  // Site hooks (rendered website)
  | "site:head"
  | "site:body:start"
  | "site:body:end"
  | "site:footer"
  | "site:page:before"
  | "site:page:after"
  | "site:section:before"
  | "site:section:after"
  | "site:component:before"
  | "site:component:after"
  | "site:init"
  | "site:settings-tab"
  // Dashboard hooks
  | "dashboard:sidebar"
  | "dashboard:sidebar:bottom"
  | "dashboard:header"
  | "dashboard:header:actions"
  | "dashboard:home:widget"
  | "dashboard:home:stats"
  | "dashboard:widget"
  | "dashboard:client:tab"
  | "dashboard:client:header"
  | "dashboard:site:tab"
  | "dashboard:site:header"
  | "dashboard:settings:tab"
  // Client portal hooks
  | "portal:sidebar"
  | "portal:home:widget"
  | "portal:home:hero"
  | "portal:header"
  | "portal:footer"
  // Agency tools hooks
  | "agency:sidebar"
  | "agency:home:widget"
  | "agency:home:stats"
  | "agency:header"
  // Editor hooks
  | "editor:toolbar"
  | "editor:toolbar-extend"
  | "editor:sidebar"
  | "editor:panel"
  | "editor:floating-menu"
  | "editor:preview"
  | "editor:component:settings"
  // Page hooks
  | "page:header"
  | "page:footer"
  | "page:content-before"
  | "page:content-after"
  | "page:sidebar"
  // Client hooks
  | "client:overview-widget"
  | "client:settings-tab"
  // Analytics hooks
  | "analytics:dashboard-widget"
  | "analytics:report"
  // Form hooks
  | "form:field-types"
  | "form:validation"
  | "form:submission-process"
  // Media hooks
  | "media:toolbar"
  | "media:upload-process"
  // Billing hooks
  | "billing:checkout"
  | "billing:invoice";

// Permissions that modules can request
export type ModulePermission =
  // Read permissions
  | "read:site"
  | "read:sites"
  | "read:page"
  | "read:pages"
  | "read:client"
  | "read:clients"
  | "read:agency"
  | "read:user"
  | "read:analytics"
  | "read:settings"
  // Write permissions
  | "write:site"
  | "write:page"
  | "write:client"
  | "write:agency"
  | "write:settings"
  // Action permissions
  | "send:email"
  | "send:notification"
  | "access:storage"
  | "access:api"
  | "access:billing"
  | "access:webhooks"
  // Special permissions
  | "execute:background"
  | "access:realtime";

// Helper to check if a permission is granted
export function hasModulePermission(
  granted: ModulePermission[],
  required: ModulePermission | ModulePermission[]
): boolean {
  if (Array.isArray(required)) {
    return required.every((p) => granted.includes(p));
  }
  return granted.includes(required);
}

// Helper to get all permissions in a category
export function getPermissionsByCategory(
  category: "read" | "write" | "action" | "special"
): ModulePermission[] {
  const permissions: Record<string, ModulePermission[]> = {
    read: [
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
    ],
    write: [
      "write:site",
      "write:page",
      "write:client",
      "write:agency",
      "write:settings",
    ],
    action: [
      "send:email",
      "send:notification",
      "access:storage",
      "access:api",
      "access:billing",
      "access:webhooks",
    ],
    special: ["execute:background", "access:realtime"],
  };
  return permissions[category] || [];
}

// Permission display info for UI
export const PERMISSION_INFO: Record<
  ModulePermission,
  { label: string; description: string; risk: "low" | "medium" | "high" }
> = {
  "read:site": {
    label: "Read Site Data",
    description: "Access site settings and configuration",
    risk: "low",
  },
  "read:sites": {
    label: "Read All Sites",
    description: "Access all sites in the agency",
    risk: "medium",
  },
  "read:page": {
    label: "Read Page Data",
    description: "Access page content and settings",
    risk: "low",
  },
  "read:pages": {
    label: "Read All Pages",
    description: "Access all pages in a site",
    risk: "low",
  },
  "read:client": {
    label: "Read Client Data",
    description: "Access client information",
    risk: "medium",
  },
  "read:clients": {
    label: "Read All Clients",
    description: "Access all client data in the agency",
    risk: "medium",
  },
  "read:agency": {
    label: "Read Agency Data",
    description: "Access agency settings and information",
    risk: "medium",
  },
  "read:user": {
    label: "Read User Profile",
    description: "Access current user information",
    risk: "low",
  },
  "read:analytics": {
    label: "Read Analytics",
    description: "Access site and page analytics",
    risk: "low",
  },
  "read:settings": {
    label: "Read Settings",
    description: "Access module and site settings",
    risk: "low",
  },
  "write:site": {
    label: "Modify Site",
    description: "Change site settings and configuration",
    risk: "high",
  },
  "write:page": {
    label: "Modify Pages",
    description: "Edit page content and settings",
    risk: "high",
  },
  "write:client": {
    label: "Modify Client",
    description: "Update client information",
    risk: "high",
  },
  "write:agency": {
    label: "Modify Agency",
    description: "Change agency settings",
    risk: "high",
  },
  "write:settings": {
    label: "Modify Settings",
    description: "Update module settings",
    risk: "medium",
  },
  "send:email": {
    label: "Send Emails",
    description: "Send emails on behalf of the agency",
    risk: "medium",
  },
  "send:notification": {
    label: "Send Notifications",
    description: "Send push/in-app notifications",
    risk: "low",
  },
  "access:storage": {
    label: "File Storage",
    description: "Upload and manage files",
    risk: "medium",
  },
  "access:api": {
    label: "External API",
    description: "Make external API requests",
    risk: "medium",
  },
  "access:billing": {
    label: "Billing Access",
    description: "View and manage billing information",
    risk: "high",
  },
  "access:webhooks": {
    label: "Webhooks",
    description: "Register and receive webhooks",
    risk: "medium",
  },
  "execute:background": {
    label: "Background Tasks",
    description: "Run tasks in the background",
    risk: "medium",
  },
  "access:realtime": {
    label: "Realtime Updates",
    description: "Subscribe to real-time data changes",
    risk: "low",
  },
};
