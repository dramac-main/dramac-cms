/**
 * Content Safety Filter Type Definitions
 * Comprehensive types for content moderation and safety checks
 */

export type ContentCategory =
  | "violence"
  | "hate_speech"
  | "sexual"
  | "self_harm"
  | "illegal"
  | "spam"
  | "malware"
  | "phishing"
  | "personal_info"
  | "profanity";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface SafetyViolation {
  category: ContentCategory;
  severity: SeverityLevel;
  description: string;
  matchedContent?: string;
  position?: {
    start: number;
    end: number;
  };
}

export interface ContentCheckResult {
  safe: boolean;
  violations: SafetyViolation[];
  sanitizedContent?: string;
  confidence: number;
  processingTime?: number;
  checkedCategories: ContentCategory[];
}

export interface SafetyConfig {
  enabledCategories: ContentCategory[];
  severityThreshold: SeverityLevel;
  logViolations: boolean;
  autoSanitize: boolean;
  includeContext: boolean;
}

export const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  enabledCategories: [
    "violence",
    "hate_speech",
    "sexual",
    "self_harm",
    "illegal",
    "spam",
    "malware",
    "phishing",
    "personal_info",
  ],
  severityThreshold: "low",
  logViolations: true,
  autoSanitize: true,
  includeContext: false,
};

export const CATEGORY_DESCRIPTIONS: Record<ContentCategory, string> = {
  violence: "Content promoting or depicting violence",
  hate_speech: "Discriminatory or hateful content",
  sexual: "Explicit sexual content",
  self_harm: "Content related to self-harm or suicide",
  illegal: "Content promoting illegal activities",
  spam: "Spam or promotional content",
  malware: "Potentially malicious code or scripts",
  phishing: "Attempts to collect sensitive information",
  personal_info: "Exposed personal/sensitive information",
  profanity: "Profane or offensive language",
};

export interface SafetyLogEntry {
  timestamp: Date;
  userId?: string;
  contentType: "input" | "output";
  violations: SafetyViolation[];
  action: "blocked" | "sanitized" | "flagged" | "allowed";
  originalContentHash?: string;
}

export interface SafetyStats {
  totalChecks: number;
  violations: number;
  blockedContent: number;
  sanitizedContent: number;
  byCategory: Partial<Record<ContentCategory, number>>;
}
