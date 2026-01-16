/**
 * Module Hooks System
 * 
 * Defines the hook points where modules can inject content.
 * Hooks are organized by context (site, dashboard, portal, agency, editor).
 */

import { ModuleHook } from "./module-manifest";

// Re-export for convenience
export type ModuleHookName = ModuleHook;

// =============================================================
// HOOK METADATA
// =============================================================

export interface HookInfo {
  hook: ModuleHook;
  name: string;
  description: string;
  context: "site" | "dashboard" | "portal" | "agency" | "editor";
  allowsMultiple: boolean;
  contentType: "html" | "component" | "script" | "style";
  priority: number; // Lower = renders first
}

export const HOOK_INFO: Record<ModuleHook, HookInfo> = {
  // Site hooks (rendered website)
  "site:head": {
    hook: "site:head",
    name: "Site Head",
    description: "Inject content into the <head> tag (scripts, meta tags, styles)",
    context: "site",
    allowsMultiple: true,
    contentType: "html",
    priority: 0,
  },
  "site:body:start": {
    hook: "site:body:start",
    name: "Body Start",
    description: "Inject content at the start of <body>",
    context: "site",
    allowsMultiple: true,
    contentType: "html",
    priority: 10,
  },
  "site:body:end": {
    hook: "site:body:end",
    name: "Body End",
    description: "Inject content at the end of <body> (before closing tag)",
    context: "site",
    allowsMultiple: true,
    contentType: "html",
    priority: 90,
  },
  "site:footer": {
    hook: "site:footer",
    name: "Site Footer",
    description: "Inject content into the footer section",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 80,
  },
  "site:page:before": {
    hook: "site:page:before",
    name: "Before Page Content",
    description: "Render before the page content",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 20,
  },
  "site:page:after": {
    hook: "site:page:after",
    name: "After Page Content",
    description: "Render after the page content",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 70,
  },
  "site:section:before": {
    hook: "site:section:before",
    name: "Before Section",
    description: "Render before each section",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 30,
  },
  "site:section:after": {
    hook: "site:section:after",
    name: "After Section",
    description: "Render after each section",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 60,
  },
  "site:component:before": {
    hook: "site:component:before",
    name: "Before Component",
    description: "Render before each component",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 40,
  },
  "site:component:after": {
    hook: "site:component:after",
    name: "After Component",
    description: "Render after each component",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },

  // Dashboard hooks
  "dashboard:sidebar": {
    hook: "dashboard:sidebar",
    name: "Dashboard Sidebar",
    description: "Add navigation items to the dashboard sidebar",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "dashboard:sidebar:bottom": {
    hook: "dashboard:sidebar:bottom",
    name: "Sidebar Bottom",
    description: "Add items to the bottom of the sidebar",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 90,
  },
  "dashboard:header": {
    hook: "dashboard:header",
    name: "Dashboard Header",
    description: "Add content to the dashboard header",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "dashboard:header:actions": {
    hook: "dashboard:header:actions",
    name: "Header Actions",
    description: "Add action buttons to the header",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "dashboard:home:widget": {
    hook: "dashboard:home:widget",
    name: "Dashboard Widget",
    description: "Add a widget to the dashboard home page",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "dashboard:home:stats": {
    hook: "dashboard:home:stats",
    name: "Dashboard Stats",
    description: "Add stat cards to the dashboard",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 30,
  },
  "dashboard:client:tab": {
    hook: "dashboard:client:tab",
    name: "Client Tab",
    description: "Add a tab to the client detail page",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "dashboard:client:header": {
    hook: "dashboard:client:header",
    name: "Client Header",
    description: "Add content to the client page header",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "dashboard:site:tab": {
    hook: "dashboard:site:tab",
    name: "Site Tab",
    description: "Add a tab to the site detail page",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "dashboard:site:header": {
    hook: "dashboard:site:header",
    name: "Site Header",
    description: "Add content to the site page header",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "dashboard:settings:tab": {
    hook: "dashboard:settings:tab",
    name: "Settings Tab",
    description: "Add a tab to the settings page",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },

  // Client portal hooks
  "portal:sidebar": {
    hook: "portal:sidebar",
    name: "Portal Sidebar",
    description: "Add navigation to the client portal sidebar",
    context: "portal",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "portal:home:widget": {
    hook: "portal:home:widget",
    name: "Portal Widget",
    description: "Add a widget to the client portal home",
    context: "portal",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "portal:home:hero": {
    hook: "portal:home:hero",
    name: "Portal Hero",
    description: "Add a hero section to the portal home",
    context: "portal",
    allowsMultiple: false,
    contentType: "component",
    priority: 10,
  },
  "portal:header": {
    hook: "portal:header",
    name: "Portal Header",
    description: "Add content to the portal header",
    context: "portal",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "portal:footer": {
    hook: "portal:footer",
    name: "Portal Footer",
    description: "Add content to the portal footer",
    context: "portal",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },

  // Agency tools hooks
  "agency:sidebar": {
    hook: "agency:sidebar",
    name: "Agency Sidebar",
    description: "Add navigation to the agency tools sidebar",
    context: "agency",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "agency:home:widget": {
    hook: "agency:home:widget",
    name: "Agency Widget",
    description: "Add a widget to the agency dashboard",
    context: "agency",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "agency:home:stats": {
    hook: "agency:home:stats",
    name: "Agency Stats",
    description: "Add stat cards to the agency dashboard",
    context: "agency",
    allowsMultiple: true,
    contentType: "component",
    priority: 30,
  },
  "agency:header": {
    hook: "agency:header",
    name: "Agency Header",
    description: "Add content to the agency header",
    context: "agency",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },

  // Editor hooks
  "editor:toolbar": {
    hook: "editor:toolbar",
    name: "Editor Toolbar",
    description: "Add tools to the editor toolbar",
    context: "editor",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "editor:toolbar-extend": {
    hook: "editor:toolbar-extend",
    name: "Toolbar Extension",
    description: "Extend existing toolbar functionality",
    context: "editor",
    allowsMultiple: true,
    contentType: "component",
    priority: 55,
  },
  "editor:sidebar": {
    hook: "editor:sidebar",
    name: "Editor Sidebar",
    description: "Add panels to the editor sidebar",
    context: "editor",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "editor:panel": {
    hook: "editor:panel",
    name: "Editor Panel",
    description: "Add a full panel to the editor",
    context: "editor",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "editor:floating-menu": {
    hook: "editor:floating-menu",
    name: "Floating Menu",
    description: "Add items to the floating selection menu",
    context: "editor",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "editor:preview": {
    hook: "editor:preview",
    name: "Editor Preview",
    description: "Modify the editor preview",
    context: "editor",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "editor:component:settings": {
    hook: "editor:component:settings",
    name: "Component Settings",
    description: "Add settings for editor components",
    context: "editor",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },

  // Site additional hooks
  "site:init": {
    hook: "site:init",
    name: "Site Initialization",
    description: "Run on site initialization",
    context: "site",
    allowsMultiple: true,
    contentType: "script",
    priority: 0,
  },
  "site:settings-tab": {
    hook: "site:settings-tab",
    name: "Site Settings Tab",
    description: "Add a tab to site settings",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },

  // Dashboard widget (general)
  "dashboard:widget": {
    hook: "dashboard:widget",
    name: "Dashboard Widget",
    description: "Add a generic widget to the dashboard",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },

  // Page hooks
  "page:header": {
    hook: "page:header",
    name: "Page Header",
    description: "Add content to page headers",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 10,
  },
  "page:footer": {
    hook: "page:footer",
    name: "Page Footer",
    description: "Add content to page footers",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 90,
  },
  "page:content-before": {
    hook: "page:content-before",
    name: "Before Page Content",
    description: "Add content before page body",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 20,
  },
  "page:content-after": {
    hook: "page:content-after",
    name: "After Page Content",
    description: "Add content after page body",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 80,
  },
  "page:sidebar": {
    hook: "page:sidebar",
    name: "Page Sidebar",
    description: "Add sidebar content to pages",
    context: "site",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },

  // Client hooks
  "client:overview-widget": {
    hook: "client:overview-widget",
    name: "Client Overview Widget",
    description: "Add widget to client overview",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "client:settings-tab": {
    hook: "client:settings-tab",
    name: "Client Settings Tab",
    description: "Add tab to client settings",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },

  // Analytics hooks
  "analytics:dashboard-widget": {
    hook: "analytics:dashboard-widget",
    name: "Analytics Dashboard Widget",
    description: "Add widget to analytics dashboard",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "analytics:report": {
    hook: "analytics:report",
    name: "Analytics Report",
    description: "Add custom analytics report",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },

  // Form hooks
  "form:field-types": {
    hook: "form:field-types",
    name: "Form Field Types",
    description: "Add custom form field types",
    context: "editor",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "form:validation": {
    hook: "form:validation",
    name: "Form Validation",
    description: "Add custom form validation",
    context: "site",
    allowsMultiple: true,
    contentType: "script",
    priority: 50,
  },
  "form:submission-process": {
    hook: "form:submission-process",
    name: "Form Submission",
    description: "Handle form submission processing",
    context: "site",
    allowsMultiple: true,
    contentType: "script",
    priority: 50,
  },

  // Media hooks
  "media:toolbar": {
    hook: "media:toolbar",
    name: "Media Toolbar",
    description: "Add tools to media library toolbar",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "media:upload-process": {
    hook: "media:upload-process",
    name: "Media Upload",
    description: "Modify media upload processing",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "script",
    priority: 50,
  },

  // Billing hooks
  "billing:checkout": {
    hook: "billing:checkout",
    name: "Billing Checkout",
    description: "Extend checkout process",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
  "billing:invoice": {
    hook: "billing:invoice",
    name: "Billing Invoice",
    description: "Customize invoice display",
    context: "dashboard",
    allowsMultiple: true,
    contentType: "component",
    priority: 50,
  },
};

// =============================================================
// HOOK UTILITIES
// =============================================================

/**
 * Get all hooks for a specific context
 */
export function getHooksForContext(
  context: "site" | "dashboard" | "portal" | "agency" | "editor"
): ModuleHook[] {
  return Object.values(HOOK_INFO)
    .filter((info) => info.context === context)
    .sort((a, b) => a.priority - b.priority)
    .map((info) => info.hook);
}

/**
 * Get hook info by hook name
 */
export function getHookInfo(hook: ModuleHook): HookInfo | undefined {
  return HOOK_INFO[hook];
}

/**
 * Check if a hook allows multiple modules
 */
export function hookAllowsMultiple(hook: ModuleHook): boolean {
  return HOOK_INFO[hook]?.allowsMultiple ?? true;
}

/**
 * Sort modules by hook priority
 */
export function sortModulesByHookPriority<T extends { hooks: ModuleHook[] }>(
  modules: T[],
  hook: ModuleHook
): T[] {
  const hookInfo = HOOK_INFO[hook];
  if (!hookInfo) return modules;

  return [...modules].sort((a, b) => {
    const aHasHook = a.hooks.includes(hook);
    const bHasHook = b.hooks.includes(hook);
    if (aHasHook && !bHasHook) return -1;
    if (!aHasHook && bHasHook) return 1;
    return 0;
  });
}

/**
 * Get display name for a hook
 */
export function getHookDisplayName(hook: ModuleHook): string {
  return HOOK_INFO[hook]?.name || hook;
}

/**
 * Get hooks grouped by context
 */
export function getHooksGroupedByContext(): Record<string, HookInfo[]> {
  const groups: Record<string, HookInfo[]> = {};
  
  for (const info of Object.values(HOOK_INFO)) {
    if (!groups[info.context]) {
      groups[info.context] = [];
    }
    groups[info.context].push(info);
  }
  
  // Sort each group by priority
  for (const context of Object.keys(groups)) {
    groups[context].sort((a, b) => a.priority - b.priority);
  }
  
  return groups;
}

// =============================================================
// HOOK REGISTRATION
// =============================================================

export interface HookRegistration {
  moduleId: string;
  moduleSlug: string;
  hook: ModuleHook;
  priority: number;
  enabled: boolean;
}

/**
 * Create a hook registration
 */
export function createHookRegistration(
  moduleId: string,
  moduleSlug: string,
  hook: ModuleHook,
  enabled: boolean = true
): HookRegistration {
  const info = HOOK_INFO[hook];
  return {
    moduleId,
    moduleSlug,
    hook,
    priority: info?.priority ?? 50,
    enabled,
  };
}

/**
 * Sort hook registrations by priority
 */
export function sortHookRegistrations(
  registrations: HookRegistration[]
): HookRegistration[] {
  return [...registrations].sort((a, b) => a.priority - b.priority);
}
