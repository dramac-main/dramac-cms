/**
 * Module Runtime Utilities
 * 
 * Provides utilities for running modules in the client portal.
 */

// Module context data passed to modules
export interface ModuleRuntimeContext {
  clientId: string;
  agencyId?: string;
  siteId?: string;
  userId?: string;
  settings: Record<string, unknown>;
  permissions: string[];
}

// Message types for module communication
export type ModuleMessageType =
  | "MODULE_READY"
  | "MODULE_ERROR"
  | "MODULE_CLOSE"
  | "MODULE_RESIZE"
  | "MODULE_NAVIGATE"
  | "API_REQUEST"
  | "API_RESPONSE"
  | "SETTINGS_UPDATE"
  | "ANALYTICS_EVENT";

export interface ModuleMessage {
  type: ModuleMessageType;
  payload: unknown;
  moduleId: string;
  requestId?: string;
}

/**
 * Send a message to a module iframe
 */
export function sendToModule(
  iframe: HTMLIFrameElement,
  type: ModuleMessageType,
  payload: unknown,
  moduleId: string,
  targetOrigin: string = "*"
): void {
  const message: ModuleMessage = {
    type,
    payload,
    moduleId,
  };

  iframe.contentWindow?.postMessage(message, targetOrigin);
}

/**
 * Create a message handler for module communication
 */
export function createModuleMessageHandler(
  moduleId: string,
  allowedOrigin: string | null,
  handlers: Partial<Record<ModuleMessageType, (payload: unknown) => void>>
): (event: MessageEvent) => void {
  return (event: MessageEvent) => {
    // Origin validation
    if (allowedOrigin && event.origin !== allowedOrigin) {
      return;
    }

    const data = event.data as ModuleMessage;
    if (!data || typeof data !== "object" || data.moduleId !== moduleId) {
      return;
    }

    const handler = handlers[data.type];
    if (handler) {
      handler(data.payload);
    }
  };
}

/**
 * Build a module URL with context parameters
 */
export function buildModuleUrl(
  baseUrl: string,
  context: ModuleRuntimeContext
): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("clientId", context.clientId);
    
    if (context.agencyId) {
      url.searchParams.set("agencyId", context.agencyId);
    }
    if (context.siteId) {
      url.searchParams.set("siteId", context.siteId);
    }
    if (context.userId) {
      url.searchParams.set("userId", context.userId);
    }
    
    // Add simple settings as params
    Object.entries(context.settings).forEach(([key, value]) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        url.searchParams.set(`s_${key}`, String(value));
      }
    });
    
    return url.toString();
  } catch {
    // If URL parsing fails, return as-is
    return baseUrl;
  }
}

/**
 * Generate a unique request ID for API calls
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate module permissions
 */
export function hasPermission(
  requiredPermissions: string[],
  grantedPermissions: string[]
): boolean {
  return requiredPermissions.every(perm => grantedPermissions.includes(perm));
}

/**
 * Sanitize module settings before sending to iframe
 */
export function sanitizeSettings(
  settings: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(settings)) {
    // Only pass serializable values
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null ||
      Array.isArray(value) ||
      (typeof value === "object" && value !== null)
    ) {
      try {
        // Ensure it's JSON-serializable
        JSON.stringify(value);
        sanitized[key] = value;
      } catch {
        // Skip non-serializable values
      }
    }
  }
  
  return sanitized;
}
