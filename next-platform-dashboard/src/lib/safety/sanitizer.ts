/**
 * Content Sanitizer
 * HTML and content sanitization utilities
 */

export interface SanitizeOptions {
  removeScripts: boolean;
  removeEventHandlers: boolean;
  removeJavascriptUrls: boolean;
  removeDataUrls: boolean;
  removeIframes: boolean;
  removeObjects: boolean;
  allowedTags?: string[];
  maxLength?: number;
}

export const DEFAULT_SANITIZE_OPTIONS: SanitizeOptions = {
  removeScripts: true,
  removeEventHandlers: true,
  removeJavascriptUrls: true,
  removeDataUrls: true,
  removeIframes: true,
  removeObjects: true,
};

/**
 * Sanitize HTML content to remove potentially dangerous elements
 */
export function sanitizeHtml(
  html: string,
  options: Partial<SanitizeOptions> = {}
): string {
  const opts = { ...DEFAULT_SANITIZE_OPTIONS, ...options };
  let sanitized = html;

  // Remove script tags and their content
  if (opts.removeScripts) {
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
    // Also remove script tags without closing tag
    sanitized = sanitized.replace(/<script[^>]*>/gi, "");
  }

  // Remove event handlers (onclick, onmouseover, etc.)
  if (opts.removeEventHandlers) {
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");
  }

  // Remove javascript: URLs
  if (opts.removeJavascriptUrls) {
    sanitized = sanitized.replace(/javascript\s*:/gi, "javascript-blocked:");
    sanitized = sanitized.replace(/vbscript\s*:/gi, "vbscript-blocked:");
  }

  // Remove data: URLs (can be used for XSS)
  if (opts.removeDataUrls) {
    sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, "data-blocked:");
    // Keep safe data URLs like images
    sanitized = sanitized.replace(
      /data\s*:\s*(?!image\/(?:png|jpeg|jpg|gif|webp|svg\+xml))[^;,\s]+/gi,
      "data-blocked:"
    );
  }

  // Remove iframes
  if (opts.removeIframes) {
    sanitized = sanitized.replace(
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      ""
    );
    sanitized = sanitized.replace(/<iframe[^>]*\/?>/gi, "");
  }

  // Remove object/embed tags (can load malicious content)
  if (opts.removeObjects) {
    sanitized = sanitized.replace(
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      ""
    );
    sanitized = sanitized.replace(/<object[^>]*\/?>/gi, "");
    sanitized = sanitized.replace(
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      ""
    );
    sanitized = sanitized.replace(/<embed[^>]*\/?>/gi, "");
  }

  // Remove style tags that might contain expressions
  sanitized = sanitized.replace(
    /<style[^>]*>[\s\S]*?expression\s*\([\s\S]*?<\/style>/gi,
    ""
  );

  // Remove CSS expressions from inline styles
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, "");
  sanitized = sanitized.replace(/url\s*\(\s*["']?\s*javascript:/gi, 'url("');

  // Limit length if specified
  if (opts.maxLength && sanitized.length > opts.maxLength) {
    sanitized = sanitized.slice(0, opts.maxLength);
  }

  return sanitized;
}

/**
 * Sanitize plain text (escape HTML entities)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Remove all HTML tags, keeping only text content
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sanitize URL to prevent javascript: and data: attacks
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("data:text/html")
  ) {
    return "#blocked-url";
  }
  
  // Allow safe protocols
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    !trimmed.includes(":")
  ) {
    return url;
  }
  
  return "#blocked-url";
}

/**
 * Sanitize JSON content for safe parsing
 */
export function sanitizeJson(json: string): string {
  // Remove potential script injections in JSON strings
  let sanitized = json;
  
  // Remove any script-like content within JSON strings
  sanitized = sanitized.replace(
    /"[^"]*<script[^"]*"/gi,
    '""'
  );
  
  return sanitized;
}

/**
 * Sanitize user input for database queries (basic escaping)
 * Note: Always use parameterized queries for SQL - this is additional protection
 */
export function sanitizeForDatabase(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, "\\\\")
    .replace(/\x00/g, "");
}

/**
 * Sanitize file name to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\.\./g, "")
    .replace(/[/\\]/g, "")
    .replace(/[<>:"|?*]/g, "")
    .replace(/^\./, "")
    .trim();
}

/**
 * Check if content contains potential XSS vectors
 */
export function containsXss(content: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /expression\s*\(/i,
    /data:\s*text\/html/i,
    /vbscript:/i,
  ];
  
  return xssPatterns.some((pattern) => pattern.test(content));
}

/**
 * Clean up whitespace while preserving structure
 */
export function normalizeWhitespace(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/ +\n/g, "\n")
    .replace(/\n +/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
