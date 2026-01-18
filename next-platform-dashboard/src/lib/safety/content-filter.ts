/**
 * Content Filter Engine
 * Main content safety checking and filtering logic
 */

import type {
  ContentCheckResult,
  SafetyConfig,
  SafetyViolation,
  ContentCategory,
  SeverityLevel,
} from "./types";
import { DEFAULT_SAFETY_CONFIG, SEVERITY_ORDER } from "./types";
import {
  CATEGORY_PATTERNS,
  BLOCKED_KEYWORDS,
  ALLOWED_CONTEXTS,
  getPatternsForCategories,
} from "./word-lists";
import { sanitizeHtml, sanitizeUrl, containsXss } from "./sanitizer";

/**
 * Check content for safety violations
 */
export function checkContent(
  content: string,
  config: SafetyConfig = DEFAULT_SAFETY_CONFIG
): ContentCheckResult {
  const startTime = performance.now();
  const violations: SafetyViolation[] = [];
  const normalizedContent = content.toLowerCase();

  // Check for allowed contexts first (reduce false positives)
  const isAllowedContext = ALLOWED_CONTEXTS.some((ctx) =>
    normalizedContent.includes(ctx.toLowerCase())
  );

  // Get patterns for enabled categories
  const patterns = getPatternsForCategories(config.enabledCategories);

  // Check each category's patterns
  for (const [category, categoryPatterns] of patterns) {
    for (const patternDef of categoryPatterns) {
      // Reset regex lastIndex for global patterns
      patternDef.pattern.lastIndex = 0;

      const matches = content.match(patternDef.pattern);
      if (matches) {
        // Skip if in allowed context and not critical
        if (isAllowedContext && patternDef.severity !== "critical") {
          continue;
        }

        for (const match of matches) {
          violations.push({
            category,
            severity: patternDef.severity,
            description: patternDef.description,
            matchedContent: config.includeContext ? match : undefined,
          });
        }
      }
    }
  }

  // Check blocked keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    if (normalizedContent.includes(keyword.toLowerCase())) {
      // Skip if in allowed context
      if (isAllowedContext) continue;

      violations.push({
        category: "illegal",
        severity: "critical",
        description: `Blocked keyword detected`,
        matchedContent: config.includeContext ? keyword : undefined,
      });
    }
  }

  // Check for XSS attempts if malware category is enabled
  if (config.enabledCategories.includes("malware") && containsXss(content)) {
    const existingMalware = violations.some((v) => v.category === "malware");
    if (!existingMalware) {
      violations.push({
        category: "malware",
        severity: "critical",
        description: "Potential XSS attack detected",
      });
    }
  }

  // Filter by severity threshold
  const filteredViolations = filterBySeverity(violations, config.severityThreshold);

  // Deduplicate violations
  const uniqueViolations = deduplicateViolations(filteredViolations);

  // Calculate confidence based on violation count and severity
  const confidence = calculateConfidence(uniqueViolations);

  // Auto-sanitize if enabled and content is HTML-like
  let sanitizedContent: string | undefined;
  if (config.autoSanitize && content.includes("<")) {
    sanitizedContent = sanitizeHtml(content);
  }

  const processingTime = performance.now() - startTime;

  return {
    safe: uniqueViolations.length === 0,
    violations: uniqueViolations,
    sanitizedContent,
    confidence,
    processingTime,
    checkedCategories: config.enabledCategories,
  };
}

/**
 * Filter violations by severity threshold
 */
function filterBySeverity(
  violations: SafetyViolation[],
  threshold: SeverityLevel
): SafetyViolation[] {
  const thresholdOrder = SEVERITY_ORDER[threshold];
  return violations.filter((v) => SEVERITY_ORDER[v.severity] >= thresholdOrder);
}

/**
 * Deduplicate violations (same category + similar description)
 */
function deduplicateViolations(violations: SafetyViolation[]): SafetyViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.category}:${v.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Calculate confidence score (1.0 = safe, lower = more risky)
 */
function calculateConfidence(violations: SafetyViolation[]): number {
  if (violations.length === 0) return 1.0;

  // Calculate risk score based on violations
  let riskScore = 0;
  for (const violation of violations) {
    riskScore += SEVERITY_ORDER[violation.severity] * 0.15;
  }

  // Cap at 0.9 risk (0.1 confidence minimum)
  const confidence = Math.max(0.1, 1.0 - Math.min(riskScore, 0.9));
  return Number(confidence.toFixed(2));
}

/**
 * Quick check for safe content (lighter weight check)
 */
export function quickSafetyCheck(content: string): boolean {
  const normalizedContent = content.toLowerCase();

  // Check blocked keywords first (fastest)
  for (const keyword of BLOCKED_KEYWORDS) {
    if (normalizedContent.includes(keyword.toLowerCase())) {
      return false;
    }
  }

  // Check critical patterns only
  for (const [, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const patternDef of patterns) {
      if (patternDef.severity === "critical") {
        patternDef.pattern.lastIndex = 0;
        if (patternDef.pattern.test(content)) {
          return false;
        }
      }
    }
  }

  // Check for XSS
  if (containsXss(content)) {
    return false;
  }

  return true;
}

/**
 * Check if URL is safe
 */
export function checkUrlSafety(url: string): {
  safe: boolean;
  sanitizedUrl: string;
  reason?: string;
} {
  const sanitizedUrl = sanitizeUrl(url);

  if (sanitizedUrl === "#blocked-url") {
    return {
      safe: false,
      sanitizedUrl,
      reason: "URL contains blocked protocol",
    };
  }

  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /eval\(/i,
    /document\./i,
    /<script/i,
    /javascript:/i,
    /%3Cscript/i,
    /\x00/,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      return {
        safe: false,
        sanitizedUrl: "#blocked-url",
        reason: "URL contains suspicious pattern",
      };
    }
  }

  return { safe: true, sanitizedUrl: url };
}

/**
 * Sanitize AI prompt input
 */
export function sanitizePrompt(prompt: string): {
  sanitized: string;
  modified: boolean;
  removedPatterns: string[];
} {
  let sanitized = prompt;
  const removedPatterns: string[] = [];

  // Remove potential injection attempts
  const injectionPatterns = [
    { pattern: /ignore\s+(all\s+)?previous\s+instructions/gi, name: "instruction override" },
    { pattern: /system\s*:\s*/gi, name: "system prompt injection" },
    { pattern: /\[INST\]/gi, name: "instruction tag" },
    { pattern: /<\|.*?\|>/g, name: "special tokens" },
  ];

  for (const { pattern, name } of injectionPatterns) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, "");
      removedPatterns.push(name);
    }
  }

  // Remove excessive repetition (potential DoS)
  const repetitionPattern = /(.)\1{50,}/g;
  if (repetitionPattern.test(sanitized)) {
    sanitized = sanitized.replace(repetitionPattern, (match) => match.slice(0, 10));
    removedPatterns.push("excessive repetition");
  }

  return {
    sanitized: sanitized.trim(),
    modified: removedPatterns.length > 0,
    removedPatterns,
  };
}

/**
 * Get highest severity from violations
 */
export function getHighestSeverity(violations: SafetyViolation[]): SeverityLevel {
  if (violations.length === 0) return "low";

  return violations.reduce((highest, v) => {
    return SEVERITY_ORDER[v.severity] > SEVERITY_ORDER[highest] ? v.severity : highest;
  }, "low" as SeverityLevel);
}

/**
 * Format violations for logging
 */
export function formatViolationsForLog(
  violations: SafetyViolation[]
): string {
  if (violations.length === 0) return "No violations";

  return violations
    .map(
      (v) =>
        `[${v.severity.toUpperCase()}] ${v.category}: ${v.description}`
    )
    .join("\n");
}

/**
 * Create a safe version of content by removing/replacing unsafe parts
 */
export function makeSafe(content: string): string {
  let safe = content;

  // Sanitize HTML
  safe = sanitizeHtml(safe);

  // Replace matched unsafe patterns with placeholder
  for (const [, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const patternDef of patterns) {
      patternDef.pattern.lastIndex = 0;
      safe = safe.replace(patternDef.pattern, "[content removed]");
    }
  }

  // Replace blocked keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    const regex = new RegExp(keyword, "gi");
    safe = safe.replace(regex, "[content removed]");
  }

  return safe;
}

// Re-export sanitizer functions for convenience
export { sanitizeHtml, sanitizeUrl, sanitizeText, stripHtml } from "./sanitizer";
