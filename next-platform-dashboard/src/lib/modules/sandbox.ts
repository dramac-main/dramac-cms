/**
 * Module Sandbox Security Utilities
 * 
 * Provides security utilities for running modules in sandboxed environments.
 */

// Content Security Policy for module iframes
export const MODULE_CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "https:"],
  "font-src": ["'self'", "data:"],
  "connect-src": ["'self'"],
  "frame-ancestors": ["'self'"],
};

// Allowed sandbox permissions for module iframes
export const MODULE_SANDBOX_PERMISSIONS = [
  "allow-scripts",
  "allow-forms", 
  "allow-same-origin",
  "allow-popups",
  "allow-popups-to-escape-sandbox",
  "allow-downloads",
] as const;

export type SandboxPermission = typeof MODULE_SANDBOX_PERMISSIONS[number];

/**
 * Build sandbox attribute string for iframe
 */
export function buildSandboxAttribute(
  permissions: readonly SandboxPermission[] = MODULE_SANDBOX_PERMISSIONS
): string {
  return permissions.join(" ");
}

/**
 * Build CSP header value
 */
export function buildCSPHeader(
  directives: Record<string, string[]> = MODULE_CSP_DIRECTIVES,
  additionalSources?: Record<string, string[]>
): string {
  const merged = { ...directives };
  
  if (additionalSources) {
    for (const [directive, sources] of Object.entries(additionalSources)) {
      merged[directive] = [...(merged[directive] || []), ...sources];
    }
  }
  
  return Object.entries(merged)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}

/**
 * Validate a URL is safe for iframe embedding
 */
export function isValidModuleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Only allow https in production
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      return false;
    }
    
    // Allow http and https in development
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize user input for module settings
 */
export function sanitizeInput(input: string): string {
  // Remove potential XSS vectors
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate origin for postMessage
 */
export function isAllowedOrigin(
  origin: string,
  allowedOrigins: string[]
): boolean {
  return allowedOrigins.some(allowed => {
    if (allowed === "*") return true;
    if (allowed === origin) return true;
    
    // Support wildcard subdomains
    if (allowed.startsWith("*.")) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain) || origin === `https://${domain}` || origin === `http://${domain}`;
    }
    
    return false;
  });
}

/**
 * Rate limiter for module API calls
 */
export class ModuleRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private windowMs: number;

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  isAllowed(moduleId: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(moduleId) || [];
    
    // Remove old timestamps
    const recentTimestamps = timestamps.filter(t => now - t < this.windowMs);
    
    if (recentTimestamps.length >= this.limit) {
      return false;
    }
    
    recentTimestamps.push(now);
    this.requests.set(moduleId, recentTimestamps);
    
    return true;
  }

  reset(moduleId: string): void {
    this.requests.delete(moduleId);
  }

  resetAll(): void {
    this.requests.clear();
  }
}
