/**
 * Shared input validation helpers for public API routes.
 * Phase 21 — API Security Hardening
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns true if the value is a valid UUID v4 format */
export function isValidUUID(value: string): boolean {
  return UUID_RE.test(value);
}

/** Returns true if the value looks like a valid email address */
export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_RE.test(value);
}

/** Returns true if quantity is a positive integer between 1 and max (default 999) */
export function isValidQuantity(value: unknown, max = 999): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= max
  );
}

/** Clamp a pagination limit to a safe range */
export function clampLimit(raw: number, defaultVal = 12, max = 100): number {
  if (isNaN(raw) || raw < 1) return defaultVal;
  return Math.min(raw, max);
}

/** Clamp a page number to be at least 1 */
export function clampPage(raw: number): number {
  if (isNaN(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

/** Truncate a text field to max length */
export function truncateText(
  value: string | undefined,
  maxLength: number,
): string | undefined {
  if (!value) return value;
  return value.slice(0, maxLength);
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
]);

/** Validate a file upload: size limit, MIME type, and filename safety */
export function validateFileUpload(
  file: File,
  maxSizeBytes = 10 * 1024 * 1024, // 10 MB
): { valid: true } | { valid: false; error: string } {
  // Size check
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${Math.round(maxSizeBytes / 1024 / 1024)}MB.`,
    };
  }

  // MIME type check
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      valid: false,
      error: "Only image files are allowed (JPEG, PNG, GIF, WebP).",
    };
  }

  // Filename safety: no path traversal, no null bytes, no very long names
  const name = file.name;
  if (
    name.includes("\0") ||
    name.includes("..") ||
    name.includes("/") ||
    name.includes("\\")
  ) {
    return { valid: false, error: "Invalid filename." };
  }
  if (name.length > 255) {
    return { valid: false, error: "Filename too long." };
  }

  return { valid: true };
}

/** XML-escape a string to prevent XML injection */
export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
