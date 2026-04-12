/**
 * Marketing Module - Template Renderer Service
 *
 * Phase MKT-02: Email Campaign Engine
 *
 * Handles merge variable replacement (personalization tokens)
 * in email HTML content. Supports {{token}} syntax.
 */

// ============================================================================
// TEMPLATE RENDERING
// ============================================================================

/**
 * Replace {{token}} placeholders in HTML with actual values.
 *
 * Supported tokens:
 *  - {{firstName}}, {{lastName}}, {{email}}
 *  - {{unsubscribeUrl}}, {{trackingPixel}}
 *  - Any custom key passed in the variables map
 *
 * Unknown tokens are replaced with empty string.
 */
export function renderTemplate(
  html: string,
  variables: Record<string, string | undefined>,
): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key];
    if (value !== undefined) return escapeHtml(value);
    // camelCase → snake_case fallback
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    if (variables[snakeKey] !== undefined)
      return escapeHtml(variables[snakeKey]!);
    return "";
  });
}

/**
 * Extract all {{token}} variable names from a template string.
 */
export function extractMergeVariables(html: string): string[] {
  const matches = html.matchAll(/\{\{(\w+)\}\}/g);
  const vars = new Set<string>();
  for (const m of matches) {
    vars.add(m[1]);
  }
  return Array.from(vars);
}

/**
 * Generate a plain-text version from HTML by stripping tags.
 * Basic implementation — suitable for the text/plain part of emails.
 */
export function htmlToPlainText(html: string): string {
  return (
    html
      // Convert common block elements to newlines
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
      .replace(/<(hr)\s*\/?>/gi, "\n---\n")
      // Extract link text with URL
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
      // Strip remaining tags
      .replace(/<[^>]+>/g, "")
      // Decode common HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      // Collapse whitespace
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
