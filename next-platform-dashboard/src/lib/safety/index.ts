/**
 * Content Safety Filter
 * Main entry point for all safety-related functionality
 */

// Types
export type {
  ContentCategory,
  SeverityLevel,
  SafetyViolation,
  ContentCheckResult,
  SafetyConfig,
  SafetyLogEntry,
  SafetyStats,
} from "./types";

export {
  DEFAULT_SAFETY_CONFIG,
  SEVERITY_ORDER,
  CATEGORY_DESCRIPTIONS,
} from "./types";

// Content Filter
export {
  checkContent,
  quickSafetyCheck,
  checkUrlSafety,
  sanitizePrompt,
  getHighestSeverity,
  formatViolationsForLog,
  makeSafe,
} from "./content-filter";

// Sanitizer
export {
  sanitizeHtml,
  sanitizeText,
  stripHtml,
  sanitizeUrl,
  sanitizeJson,
  sanitizeForDatabase,
  sanitizeFileName,
  containsXss,
  normalizeWhitespace,
  DEFAULT_SANITIZE_OPTIONS,
} from "./sanitizer";

// Word Lists (for advanced use cases)
export {
  CATEGORY_PATTERNS,
  BLOCKED_KEYWORDS,
  ALLOWED_CONTEXTS,
  getPatternsForCategories,
  getCategorySeverity,
} from "./word-lists";
