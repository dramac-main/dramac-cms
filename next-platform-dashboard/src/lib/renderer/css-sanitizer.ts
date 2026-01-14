// Sanitize custom CSS to prevent XSS and dangerous properties
export function sanitizeCSS(css: string): string {
  if (!css) return "";

  // Remove any script tags or javascript
  let sanitized = css
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/behavior\s*:/gi, "")
    .replace(/-moz-binding/gi, "");

  // Remove @import to prevent loading external resources
  sanitized = sanitized.replace(/@import\s+[^;]+;/gi, "");

  // Remove url() with external resources (keep data: and relative paths)
  sanitized = sanitized.replace(
    /url\s*\(\s*['"]?(?!data:|\/|\.)/gi,
    "url(blocked-"
  );

  return sanitized;
}

// Validate CSS syntax
export function validateCSS(css: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for balanced braces
  let braceCount = 0;
  for (const char of css) {
    if (char === "{") braceCount++;
    if (char === "}") braceCount--;
    if (braceCount < 0) {
      errors.push("Unbalanced braces: extra closing brace");
      break;
    }
  }
  if (braceCount > 0) {
    errors.push(`Unbalanced braces: ${braceCount} unclosed brace(s)`);
  }

  // Check for dangerous patterns
  if (/expression\s*\(/i.test(css)) {
    errors.push("CSS expressions are not allowed");
  }
  if (/@import/i.test(css)) {
    errors.push("@import is not allowed");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
