# Phase 60: Content Safety Filter - AI Input/Output Filtering

> **AI Model**: Claude Opus 4.5 (2x) ⭐ CRITICAL PHASE
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 4-5 hours

---

## 🎯 Objective

Implement a comprehensive content safety filter system that validates and sanitizes all AI-generated content and user inputs to prevent harmful, inappropriate, or malicious content from being created or displayed.

---

## 📋 Prerequisites

- [ ] Phase 59 RLS Security completed
- [ ] AI integration working (Claude API)
- [ ] Understanding of content moderation requirements

---

## 🚨 Why This Is Critical

1. **Legal Liability** - Prevent hosting illegal or harmful content
2. **Platform Reputation** - Maintain trust with agencies and their clients
3. **Abuse Prevention** - Stop malicious use of AI generation
4. **SEO Protection** - Prevent spam content that could hurt rankings

---

## 📁 Files to Create

```
src/lib/safety/
├── content-filter.ts             # Main content filtering engine
├── word-lists.ts                 # Blocked word lists by category
├── patterns.ts                   # Regex patterns for detection
├── ai-safety.ts                  # AI-specific safety checks
├── sanitizer.ts                  # HTML/content sanitization
├── report.ts                     # Content violation reporting
└── types.ts                      # Type definitions

src/lib/safety/validators/
├── text-validator.ts             # Text content validation
├── url-validator.ts              # URL/link validation
├── image-validator.ts            # Image content validation
├── html-validator.ts             # HTML sanitization

src/components/safety/
├── content-warning.tsx           # Warning display component
├── report-content-dialog.tsx     # Report content modal
├── moderation-queue.tsx          # Admin moderation queue

src/app/api/safety/
├── check/route.ts                # Content check endpoint
├── report/route.ts               # Report content endpoint
└── moderate/route.ts             # Admin moderation endpoint
```

---

## ✅ Tasks

### Task 60.1: Safety Type Definitions

**File: `src/lib/safety/types.ts`**

```typescript
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
  | "copyright"
  | "profanity";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface SafetyViolation {
  category: ContentCategory;
  severity: SeverityLevel;
  description: string;
  matchedContent?: string;
  position?: { start: number; end: number };
}

export interface ContentCheckResult {
  safe: boolean;
  violations: SafetyViolation[];
  sanitizedContent?: string;
  confidence: number;
  processingTime: number;
}

export interface SafetyConfig {
  enabledCategories: ContentCategory[];
  severityThreshold: SeverityLevel;
  allowOverride: boolean;
  logViolations: boolean;
  notifyAdmin: boolean;
}

export interface ContentReport {
  id: string;
  contentType: "text" | "image" | "url" | "page";
  contentId: string;
  content: string;
  reportedBy: string;
  reason: ContentCategory;
  description: string;
  status: "pending" | "reviewed" | "dismissed" | "action_taken";
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

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
  severityThreshold: "medium",
  allowOverride: false,
  logViolations: true,
  notifyAdmin: true,
};

export const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
```

---

### Task 60.2: Blocked Word Lists

**File: `src/lib/safety/word-lists.ts`**

```typescript
import type { ContentCategory } from "./types";

// Encrypted/hashed word lists for security
// In production, these would be loaded from a secure database

interface WordList {
  exact: string[];
  patterns: RegExp[];
  contextual: { word: string; context: string[] }[];
}

// NOTE: These are placeholder patterns - real implementation would have
// comprehensive lists loaded from secure storage

export const wordLists: Record<ContentCategory, WordList> = {
  violence: {
    exact: [],
    patterns: [
      /\b(kill|murder|assassinate)\s+(someone|people|them)\b/gi,
      /\b(bomb|explosive)\s+(make|build|create)\b/gi,
      /\bterrorist?\s+attack\b/gi,
    ],
    contextual: [],
  },
  hate_speech: {
    exact: [],
    patterns: [
      /\b(hate|kill|destroy)\s+(all|every)\s+\w+s?\b/gi,
      /\b\w+s?\s+(should|must)\s+(die|be killed)\b/gi,
    ],
    contextual: [],
  },
  sexual: {
    exact: [],
    patterns: [
      /\bexplicit\s+sexual\b/gi,
      /\badult\s+content\b/gi,
    ],
    contextual: [],
  },
  self_harm: {
    exact: [],
    patterns: [
      /\bhow\s+to\s+(commit|attempt)\s+suicide\b/gi,
      /\bself[- ]harm\s+methods?\b/gi,
    ],
    contextual: [],
  },
  illegal: {
    exact: [],
    patterns: [
      /\bhow\s+to\s+(hack|break into)\b/gi,
      /\b(sell|buy)\s+(drugs|weapons)\s+online\b/gi,
      /\bfake\s+(id|passport|license)\b/gi,
    ],
    contextual: [],
  },
  spam: {
    exact: [],
    patterns: [
      /\b(click here|act now|limited time)\s+\!+/gi,
      /\bfree\s+\w+\s+no\s+(catch|strings)/gi,
      /\b(100%|guaranteed)\s+(free|money|income)\b/gi,
      /\bmake\s+\$\d+\s+(per|a)\s+(day|hour)\b/gi,
    ],
    contextual: [],
  },
  malware: {
    exact: [],
    patterns: [
      /\bdownload\s+\w+\.(exe|bat|cmd|scr|pif)\b/gi,
      /\beval\s*\(\s*atob\s*\(/gi,
      /\bdocument\.write\s*\(\s*unescape\b/gi,
    ],
    contextual: [],
  },
  phishing: {
    exact: [],
    patterns: [
      /\b(verify|confirm)\s+your\s+(account|password|identity)\b/gi,
      /\b(suspended|locked)\s+account\b/gi,
      /\bclick\s+(here|link)\s+to\s+(verify|unlock)\b/gi,
      /\b(bank|paypal|amazon)\s+security\s+alert\b/gi,
    ],
    contextual: [],
  },
  personal_info: {
    exact: [],
    patterns: [
      /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, // SSN pattern
      /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, // Credit card
      /\b[A-Z]{2}\d{6,8}\b/g, // Passport numbers
    ],
    contextual: [],
  },
  copyright: {
    exact: [],
    patterns: [
      /\bdownload\s+(free|full)\s+(movie|music|software)\b/gi,
      /\b(crack|keygen|serial)\s+(for|download)\b/gi,
      /\btorrent\s+download\b/gi,
    ],
    contextual: [],
  },
  profanity: {
    exact: [],
    patterns: [],
    contextual: [],
  },
};

// Load word lists from environment or database
export async function loadWordLists(): Promise<void> {
  // In production, load from secure storage
  // This would decrypt and populate the word lists
}

// Check if a word list contains a match
export function checkWordList(
  text: string,
  category: ContentCategory
): { matched: boolean; matches: string[] } {
  const list = wordLists[category];
  const matches: string[] = [];
  const lowerText = text.toLowerCase();

  // Check exact matches
  for (const word of list.exact) {
    if (lowerText.includes(word.toLowerCase())) {
      matches.push(word);
    }
  }

  // Check patterns
  for (const pattern of list.patterns) {
    const patternMatches = text.match(pattern);
    if (patternMatches) {
      matches.push(...patternMatches);
    }
  }

  // Check contextual matches
  for (const { word, context } of list.contextual) {
    if (lowerText.includes(word.toLowerCase())) {
      for (const ctx of context) {
        if (lowerText.includes(ctx.toLowerCase())) {
          matches.push(`${word} (context: ${ctx})`);
        }
      }
    }
  }

  return {
    matched: matches.length > 0,
    matches: [...new Set(matches)],
  };
}
```

---

### Task 60.3: Content Filter Engine

**File: `src/lib/safety/content-filter.ts`**

```typescript
import type {
  ContentCategory,
  ContentCheckResult,
  SafetyConfig,
  SafetyViolation,
  SeverityLevel,
  DEFAULT_SAFETY_CONFIG,
  SEVERITY_WEIGHTS,
} from "./types";
import { checkWordList } from "./word-lists";
import { validateText } from "./validators/text-validator";
import { validateUrl } from "./validators/url-validator";
import { sanitizeHtml } from "./sanitizer";

export class ContentFilter {
  private config: SafetyConfig;

  constructor(config: Partial<SafetyConfig> = {}) {
    this.config = { ...DEFAULT_SAFETY_CONFIG, ...config };
  }

  // Main content check method
  async checkContent(
    content: string,
    options: {
      type?: "text" | "html" | "url";
      context?: string;
      skipCategories?: ContentCategory[];
    } = {}
  ): Promise<ContentCheckResult> {
    const startTime = Date.now();
    const violations: SafetyViolation[] = [];
    const { type = "text", context, skipCategories = [] } = options;

    // Filter enabled categories
    const categoriesToCheck = this.config.enabledCategories.filter(
      (cat) => !skipCategories.includes(cat)
    );

    // Run checks based on content type
    switch (type) {
      case "html":
        violations.push(...(await this.checkHtmlContent(content, categoriesToCheck)));
        break;
      case "url":
        violations.push(...(await this.checkUrlContent(content, categoriesToCheck)));
        break;
      default:
        violations.push(...(await this.checkTextContent(content, categoriesToCheck)));
    }

    // Calculate safety score
    const maxSeverity = this.getMaxSeverity(violations);
    const safe = this.isSafe(violations);

    // Sanitize if needed
    let sanitizedContent: string | undefined;
    if (!safe && type === "html") {
      sanitizedContent = sanitizeHtml(content);
    }

    const result: ContentCheckResult = {
      safe,
      violations,
      sanitizedContent,
      confidence: this.calculateConfidence(violations),
      processingTime: Date.now() - startTime,
    };

    // Log violations if configured
    if (this.config.logViolations && violations.length > 0) {
      await this.logViolations(content, result);
    }

    return result;
  }

  // Check text content
  private async checkTextContent(
    text: string,
    categories: ContentCategory[]
  ): Promise<SafetyViolation[]> {
    const violations: SafetyViolation[] = [];

    for (const category of categories) {
      const result = checkWordList(text, category);
      if (result.matched) {
        violations.push({
          category,
          severity: this.getSeverityForCategory(category),
          description: `Content contains ${category.replace("_", " ")} related content`,
          matchedContent: result.matches.slice(0, 3).join(", "),
        });
      }
    }

    // Additional text validation
    const textValidation = await validateText(text);
    violations.push(...textValidation);

    return violations;
  }

  // Check HTML content
  private async checkHtmlContent(
    html: string,
    categories: ContentCategory[]
  ): Promise<SafetyViolation[]> {
    const violations: SafetyViolation[] = [];

    // Extract text from HTML
    const textContent = this.extractTextFromHtml(html);
    violations.push(...(await this.checkTextContent(textContent, categories)));

    // Check for malicious HTML patterns
    const htmlViolations = this.checkMaliciousHtml(html);
    violations.push(...htmlViolations);

    // Check embedded URLs
    const urls = this.extractUrls(html);
    for (const url of urls) {
      const urlViolations = await this.checkUrlContent(url, categories);
      violations.push(...urlViolations);
    }

    return violations;
  }

  // Check URL content
  private async checkUrlContent(
    url: string,
    categories: ContentCategory[]
  ): Promise<SafetyViolation[]> {
    return validateUrl(url, categories);
  }

  // Check for malicious HTML
  private checkMaliciousHtml(html: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    // Script injection
    if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(html)) {
      violations.push({
        category: "malware",
        severity: "critical",
        description: "Content contains script tags",
      });
    }

    // Event handlers
    if (/\bon\w+\s*=/gi.test(html)) {
      violations.push({
        category: "malware",
        severity: "high",
        description: "Content contains inline event handlers",
      });
    }

    // Dangerous protocols
    if (/(?:javascript|data|vbscript):/gi.test(html)) {
      violations.push({
        category: "malware",
        severity: "critical",
        description: "Content contains dangerous protocol URLs",
      });
    }

    // iframe injection
    if (/<iframe[\s\S]*?src\s*=\s*["'](?!https?:\/\/(?:www\.)?(?:youtube|vimeo|google))/gi.test(html)) {
      violations.push({
        category: "malware",
        severity: "high",
        description: "Content contains potentially malicious iframes",
      });
    }

    return violations;
  }

  // Extract text from HTML
  private extractTextFromHtml(html: string): string {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Extract URLs from HTML
  private extractUrls(html: string): string[] {
    const urlPattern = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
    const urls: string[] = [];
    let match;

    while ((match = urlPattern.exec(html)) !== null) {
      urls.push(match[1]);
    }

    return urls;
  }

  // Get severity for category
  private getSeverityForCategory(category: ContentCategory): SeverityLevel {
    const severityMap: Record<ContentCategory, SeverityLevel> = {
      violence: "high",
      hate_speech: "high",
      sexual: "high",
      self_harm: "critical",
      illegal: "critical",
      spam: "medium",
      malware: "critical",
      phishing: "critical",
      personal_info: "high",
      copyright: "medium",
      profanity: "low",
    };

    return severityMap[category] || "medium";
  }

  // Get maximum severity from violations
  private getMaxSeverity(violations: SafetyViolation[]): SeverityLevel {
    if (violations.length === 0) return "low";

    let maxWeight = 0;
    let maxSeverity: SeverityLevel = "low";

    for (const v of violations) {
      const weight = SEVERITY_WEIGHTS[v.severity];
      if (weight > maxWeight) {
        maxWeight = weight;
        maxSeverity = v.severity;
      }
    }

    return maxSeverity;
  }

  // Check if content is safe based on config
  private isSafe(violations: SafetyViolation[]): boolean {
    if (violations.length === 0) return true;

    const threshold = SEVERITY_WEIGHTS[this.config.severityThreshold];
    return !violations.some((v) => SEVERITY_WEIGHTS[v.severity] >= threshold);
  }

  // Calculate confidence score
  private calculateConfidence(violations: SafetyViolation[]): number {
    if (violations.length === 0) return 1.0;

    // Base confidence decreases with more violations
    let confidence = 1.0 - violations.length * 0.1;

    // Adjust for severity
    for (const v of violations) {
      confidence -= SEVERITY_WEIGHTS[v.severity] * 0.05;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  // Log violations
  private async logViolations(
    content: string,
    result: ContentCheckResult
  ): Promise<void> {
    console.warn("[Content Safety] Violations detected:", {
      violationCount: result.violations.length,
      categories: result.violations.map((v) => v.category),
      safe: result.safe,
      contentPreview: content.slice(0, 100),
    });

    // TODO: Store in database for admin review
  }
}

// Singleton instance
let filterInstance: ContentFilter | null = null;

export function getContentFilter(config?: Partial<SafetyConfig>): ContentFilter {
  if (!filterInstance || config) {
    filterInstance = new ContentFilter(config);
  }
  return filterInstance;
}

// Quick check function
export async function checkContentSafety(
  content: string,
  type: "text" | "html" | "url" = "text"
): Promise<ContentCheckResult> {
  const filter = getContentFilter();
  return filter.checkContent(content, { type });
}
```

---

### Task 60.4: Text Validator

**File: `src/lib/safety/validators/text-validator.ts`**

```typescript
import type { SafetyViolation } from "../types";

// Validate text content for various issues
export async function validateText(text: string): Promise<SafetyViolation[]> {
  const violations: SafetyViolation[] = [];

  // Check for excessive capitalization (SHOUTING)
  const capsRatio = countUppercase(text) / text.length;
  if (capsRatio > 0.7 && text.length > 20) {
    violations.push({
      category: "spam",
      severity: "low",
      description: "Text contains excessive capitalization",
    });
  }

  // Check for repeated characters
  if (/(.)\1{5,}/g.test(text)) {
    violations.push({
      category: "spam",
      severity: "low",
      description: "Text contains repeated characters",
    });
  }

  // Check for phone numbers (potential personal info)
  if (/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text)) {
    violations.push({
      category: "personal_info",
      severity: "medium",
      description: "Text may contain phone numbers",
    });
  }

  // Check for email addresses
  const emailCount = (text.match(/[\w.-]+@[\w.-]+\.\w+/g) || []).length;
  if (emailCount > 3) {
    violations.push({
      category: "spam",
      severity: "medium",
      description: "Text contains multiple email addresses",
    });
  }

  // Check for excessive links
  const urlCount = (text.match(/https?:\/\/[^\s]+/g) || []).length;
  if (urlCount > 5) {
    violations.push({
      category: "spam",
      severity: "medium",
      description: "Text contains excessive URLs",
    });
  }

  // Check for cryptocurrency addresses
  if (/\b(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,39}\b/.test(text)) {
    violations.push({
      category: "spam",
      severity: "medium",
      description: "Text contains cryptocurrency addresses",
    });
  }

  return violations;
}

// Count uppercase characters
function countUppercase(text: string): number {
  return (text.match(/[A-Z]/g) || []).length;
}

// Check text length limits
export function validateTextLength(
  text: string,
  maxLength: number
): { valid: boolean; message?: string } {
  if (text.length > maxLength) {
    return {
      valid: false,
      message: `Text exceeds maximum length of ${maxLength} characters`,
    };
  }
  return { valid: true };
}

// Check for minimum content quality
export function validateContentQuality(text: string): {
  valid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Too short
  if (text.length < 10) {
    score -= 30;
    issues.push("Content is too short");
  }

  // No sentences
  if (!/[.!?]/.test(text) && text.length > 50) {
    score -= 10;
    issues.push("Content lacks proper punctuation");
  }

  // All caps
  if (text === text.toUpperCase() && text.length > 20) {
    score -= 20;
    issues.push("Content is all uppercase");
  }

  // Gibberish detection (simple heuristic)
  const wordPattern = /\b[a-zA-Z]{3,}\b/g;
  const words = text.match(wordPattern) || [];
  if (text.length > 50 && words.length < 3) {
    score -= 30;
    issues.push("Content may be gibberish");
  }

  return {
    valid: score >= 50,
    score: Math.max(0, score),
    issues,
  };
}
```

---

### Task 60.5: URL Validator

**File: `src/lib/safety/validators/url-validator.ts`**

```typescript
import type { ContentCategory, SafetyViolation } from "../types";

// Known malicious domain patterns
const SUSPICIOUS_PATTERNS = [
  /bit\.ly|tinyurl|t\.co|goo\.gl/i, // URL shorteners (flag, don't block)
  /\d+\.\d+\.\d+\.\d+/, // IP addresses
  /-{2,}/, // Multiple hyphens
  /\.(tk|ml|ga|cf|gq)$/i, // Free TLDs often used for spam
];

// Known safe domains
const SAFE_DOMAINS = new Set([
  "google.com",
  "youtube.com",
  "facebook.com",
  "twitter.com",
  "linkedin.com",
  "github.com",
  "amazon.com",
  "apple.com",
  "microsoft.com",
  "wikipedia.org",
]);

export async function validateUrl(
  url: string,
  categories: ContentCategory[]
): Promise<SafetyViolation[]> {
  const violations: SafetyViolation[] = [];

  try {
    const parsed = new URL(url);

    // Check for dangerous protocols
    if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      violations.push({
        category: "malware",
        severity: "critical",
        description: `Dangerous URL protocol: ${parsed.protocol}`,
        matchedContent: url,
      });
      return violations;
    }

    // Check for javascript: in URL
    if (url.toLowerCase().includes("javascript:")) {
      violations.push({
        category: "malware",
        severity: "critical",
        description: "URL contains JavaScript protocol",
        matchedContent: url,
      });
      return violations;
    }

    // Check for data: URLs
    if (parsed.protocol === "data:") {
      violations.push({
        category: "malware",
        severity: "high",
        description: "Data URLs can be used for malicious purposes",
        matchedContent: url,
      });
    }

    // Check suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(parsed.hostname)) {
        violations.push({
          category: "phishing",
          severity: "medium",
          description: "URL matches suspicious pattern",
          matchedContent: url,
        });
        break;
      }
    }

    // Check for homograph attacks (internationalized domains that look like real ones)
    if (/xn--/.test(parsed.hostname)) {
      violations.push({
        category: "phishing",
        severity: "high",
        description: "URL uses internationalized domain (potential homograph attack)",
        matchedContent: url,
      });
    }

    // Check for extremely long URLs (often spam or tracking)
    if (url.length > 2000) {
      violations.push({
        category: "spam",
        severity: "low",
        description: "URL is unusually long",
        matchedContent: url.slice(0, 100) + "...",
      });
    }

    // Check for common phishing patterns in path
    const phishingPaths = [
      "/login",
      "/signin",
      "/verify",
      "/update",
      "/secure",
      "/account",
      "/banking",
    ];
    const pathLower = parsed.pathname.toLowerCase();
    if (
      phishingPaths.some((p) => pathLower.includes(p)) &&
      !SAFE_DOMAINS.has(parsed.hostname.replace(/^www\./, ""))
    ) {
      violations.push({
        category: "phishing",
        severity: "medium",
        description: "URL path suggests potential phishing",
        matchedContent: url,
      });
    }
  } catch {
    // Invalid URL
    violations.push({
      category: "malware",
      severity: "high",
      description: "Invalid or malformed URL",
      matchedContent: url,
    });
  }

  return violations;
}

// Check if URL is from a known safe domain
export function isSafeDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");
    return SAFE_DOMAINS.has(hostname);
  } catch {
    return false;
  }
}

// Expand shortened URL (would need external service in production)
export async function expandUrl(shortUrl: string): Promise<string | null> {
  // In production, use a URL expansion service
  // For now, return null to indicate couldn't expand
  return null;
}
```

---

### Task 60.6: HTML Sanitizer

**File: `src/lib/safety/sanitizer.ts`**

```typescript
// Allowed HTML tags and attributes for safe content
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "div",
  "span",
  "blockquote",
  "pre",
  "code",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
  "figure",
  "figcaption",
  "video",
  "source",
  "iframe",
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  "*": new Set(["class", "id", "style"]),
  a: new Set(["href", "target", "rel", "title"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  video: new Set(["src", "controls", "width", "height", "poster"]),
  source: new Set(["src", "type"]),
  iframe: new Set(["src", "width", "height", "frameborder", "allowfullscreen"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"]),
};

// Safe iframe sources (embedded content)
const SAFE_IFRAME_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "vimeo.com",
  "player.vimeo.com",
  "google.com",
  "www.google.com",
  "maps.google.com",
];

// Sanitize HTML content
export function sanitizeHtml(html: string): string {
  // Remove script tags completely
  let sanitized = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

  // Remove style tags
  sanitized = sanitized.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/javascript\s*:/gi, "blocked:");
  sanitized = sanitized.replace(/data\s*:/gi, "blocked:");
  sanitized = sanitized.replace(/vbscript\s*:/gi, "blocked:");

  // Process each tag
  sanitized = sanitized.replace(
    /<(\/?)([\w-]+)([^>]*)>/gi,
    (match, closing, tagName, attributes) => {
      const tag = tagName.toLowerCase();

      // Remove disallowed tags
      if (!ALLOWED_TAGS.has(tag)) {
        return "";
      }

      // For closing tags, just return them
      if (closing) {
        return `</${tag}>`;
      }

      // Sanitize attributes
      const cleanAttrs = sanitizeAttributes(tag, attributes);
      return `<${tag}${cleanAttrs ? " " + cleanAttrs : ""}>`;
    }
  );

  return sanitized;
}

// Sanitize tag attributes
function sanitizeAttributes(tag: string, attributeString: string): string {
  const allowedForTag = ALLOWED_ATTRIBUTES[tag] || new Set();
  const allowedGlobal = ALLOWED_ATTRIBUTES["*"] || new Set();
  const combined = new Set([...allowedForTag, ...allowedGlobal]);

  const cleanAttrs: string[] = [];

  // Parse attributes
  const attrPattern = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/gi;
  let match;

  while ((match = attrPattern.exec(attributeString)) !== null) {
    const attrName = match[1].toLowerCase();
    const attrValue = match[2] || match[3] || match[4] || "";

    if (!combined.has(attrName)) {
      continue;
    }

    // Special handling for href
    if (attrName === "href") {
      const sanitizedHref = sanitizeUrl(attrValue);
      if (sanitizedHref) {
        cleanAttrs.push(`href="${sanitizedHref}"`);
        // Add rel="noopener noreferrer" for external links
        if (attrValue.startsWith("http")) {
          cleanAttrs.push('rel="noopener noreferrer"');
        }
      }
      continue;
    }

    // Special handling for src
    if (attrName === "src") {
      if (tag === "iframe") {
        const sanitizedSrc = sanitizeIframeSrc(attrValue);
        if (sanitizedSrc) {
          cleanAttrs.push(`src="${sanitizedSrc}"`);
        }
      } else {
        const sanitizedSrc = sanitizeUrl(attrValue);
        if (sanitizedSrc) {
          cleanAttrs.push(`src="${sanitizedSrc}"`);
        }
      }
      continue;
    }

    // Special handling for style
    if (attrName === "style") {
      const sanitizedStyle = sanitizeStyle(attrValue);
      if (sanitizedStyle) {
        cleanAttrs.push(`style="${sanitizedStyle}"`);
      }
      continue;
    }

    // Default: escape and include
    cleanAttrs.push(`${attrName}="${escapeHtml(attrValue)}"`);
  }

  return cleanAttrs.join(" ");
}

// Sanitize URL
function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim();

  // Block dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }

  // Allow relative URLs and safe protocols
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return escapeHtml(trimmed);
  }

  return null;
}

// Sanitize iframe src
function sanitizeIframeSrc(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (SAFE_IFRAME_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      return escapeHtml(url);
    }
  } catch {
    return null;
  }

  return null;
}

// Sanitize inline styles
function sanitizeStyle(style: string): string {
  // Remove any url() or expression()
  let sanitized = style.replace(/url\s*\([^)]*\)/gi, "");
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, "");

  // Only allow safe CSS properties
  const safeProperties = [
    "color",
    "background-color",
    "background",
    "font-size",
    "font-weight",
    "font-family",
    "text-align",
    "text-decoration",
    "margin",
    "padding",
    "border",
    "width",
    "height",
    "display",
    "flex",
    "grid",
  ];

  const cleanProps: string[] = [];
  const propPattern = /([\w-]+)\s*:\s*([^;]+)/g;
  let match;

  while ((match = propPattern.exec(sanitized)) !== null) {
    const prop = match[1].toLowerCase();
    const value = match[2].trim();

    if (safeProperties.some((safe) => prop.startsWith(safe))) {
      cleanProps.push(`${prop}: ${value}`);
    }
  }

  return cleanProps.join("; ");
}

// Escape HTML entities
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

---

### Task 60.7: AI Safety Integration

**File: `src/lib/safety/ai-safety.ts`**

```typescript
import { ContentFilter, getContentFilter } from "./content-filter";
import type { ContentCheckResult, SafetyConfig } from "./types";

// Safety wrapper for AI generation
export async function safeAIGeneration<T>(
  generator: () => Promise<T>,
  options: {
    validateInput?: string;
    validateOutput?: (output: T) => string;
    config?: Partial<SafetyConfig>;
  } = {}
): Promise<{
  result: T | null;
  safety: {
    inputCheck?: ContentCheckResult;
    outputCheck?: ContentCheckResult;
  };
  blocked: boolean;
  reason?: string;
}> {
  const filter = getContentFilter(options.config);
  const safety: {
    inputCheck?: ContentCheckResult;
    outputCheck?: ContentCheckResult;
  } = {};

  // Validate input if provided
  if (options.validateInput) {
    safety.inputCheck = await filter.checkContent(options.validateInput);

    if (!safety.inputCheck.safe) {
      return {
        result: null,
        safety,
        blocked: true,
        reason: `Input blocked: ${safety.inputCheck.violations
          .map((v) => v.description)
          .join(", ")}`,
      };
    }
  }

  // Generate content
  let result: T;
  try {
    result = await generator();
  } catch (error) {
    return {
      result: null,
      safety,
      blocked: true,
      reason: `Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }

  // Validate output if extractor provided
  if (options.validateOutput) {
    const outputText = options.validateOutput(result);
    safety.outputCheck = await filter.checkContent(outputText, { type: "html" });

    if (!safety.outputCheck.safe) {
      return {
        result: null,
        safety,
        blocked: true,
        reason: `Output blocked: ${safety.outputCheck.violations
          .map((v) => v.description)
          .join(", ")}`,
      };
    }
  }

  return {
    result,
    safety,
    blocked: false,
  };
}

// Pre-generation prompt filtering
export function filterAIPrompt(prompt: string): {
  filtered: string;
  modifications: string[];
} {
  let filtered = prompt;
  const modifications: string[] = [];

  // Remove potential injection attempts
  const injectionPatterns = [
    { pattern: /ignore\s+(previous|all)\s+instructions?/gi, name: "instruction override" },
    { pattern: /pretend\s+you\s+are/gi, name: "role hijacking" },
    { pattern: /act\s+as\s+if\s+you/gi, name: "behavior modification" },
    { pattern: /forget\s+your\s+rules/gi, name: "rule bypass" },
  ];

  for (const { pattern, name } of injectionPatterns) {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, "[FILTERED]");
      modifications.push(`Removed ${name} attempt`);
    }
  }

  // Limit prompt length
  const maxLength = 4000;
  if (filtered.length > maxLength) {
    filtered = filtered.slice(0, maxLength);
    modifications.push(`Truncated to ${maxLength} characters`);
  }

  return { filtered, modifications };
}

// Post-generation content cleaning
export function cleanAIOutput(output: string): string {
  let cleaned = output;

  // Remove any system prompts that leaked
  cleaned = cleaned.replace(/\[System\][\s\S]*?\[\/System\]/gi, "");
  cleaned = cleaned.replace(/\[INST\][\s\S]*?\[\/INST\]/gi, "");

  // Remove markdown artifacts
  cleaned = cleaned.replace(/```json\s*/gi, "");
  cleaned = cleaned.replace(/```\s*$/gi, "");

  return cleaned.trim();
}

// Safety prompt to append to AI requests
export const SAFETY_SYSTEM_PROMPT = `
You are a website content generator. Follow these safety rules strictly:

1. Never generate content that promotes violence, hate speech, or discrimination
2. Never generate sexual or adult content
3. Never generate content that could harm individuals or groups
4. Never include real phone numbers, addresses, or personal information
5. Never generate content that promotes illegal activities
6. Always use placeholder text for contact information (e.g., "your@email.com")
7. Never include malicious code, scripts, or suspicious links
8. Keep all content professional and business-appropriate
9. If asked to generate inappropriate content, politely decline and offer alternatives

When generating website content:
- Use professional, inclusive language
- Create engaging but honest marketing copy
- Include appropriate calls-to-action
- Ensure all claims are reasonable and not misleading
`;
```

---

### Task 60.8: Content Check API Endpoint

**File: `src/app/api/safety/check/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkContentSafety } from "@/lib/safety/content-filter";
import { z } from "zod";

const checkSchema = z.object({
  content: z.string().min(1).max(100000),
  type: z.enum(["text", "html", "url"]).default("text"),
});

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = checkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { content, type } = validation.data;
    const result = await checkContentSafety(content, type);

    return NextResponse.json({
      safe: result.safe,
      violations: result.violations,
      confidence: result.confidence,
      processingTime: result.processingTime,
    });
  } catch (error) {
    console.error("Content check error:", error);
    return NextResponse.json(
      { error: "Failed to check content" },
      { status: 500 }
    );
  }
}
```

---

### Task 60.9: Content Warning Component

**File: `src/components/safety/content-warning.tsx`**

```tsx
"use client";

import type { SafetyViolation } from "@/lib/safety/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";

interface ContentWarningProps {
  violations: SafetyViolation[];
  showDetails?: boolean;
  onDismiss?: () => void;
}

export function ContentWarning({ 
  violations, 
  showDetails = true,
  onDismiss 
}: ContentWarningProps) {
  if (violations.length === 0) return null;

  const maxSeverity = getMaxSeverity(violations);
  const Icon = maxSeverity === "critical" ? ShieldAlert : 
               maxSeverity === "high" ? AlertTriangle : Info;

  const variant = maxSeverity === "critical" || maxSeverity === "high" 
    ? "destructive" 
    : "default";

  return (
    <Alert variant={variant}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Content Safety Warning
        <Badge variant="outline" className="ml-2">
          {violations.length} issue{violations.length !== 1 ? "s" : ""}
        </Badge>
      </AlertTitle>
      {showDetails && (
        <AlertDescription className="mt-2">
          <ul className="list-disc list-inside space-y-1">
            {violations.map((v, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium capitalize">
                  {v.category.replace("_", " ")}
                </span>
                : {v.description}
                {v.matchedContent && (
                  <span className="text-muted-foreground ml-1">
                    (matched: "{v.matchedContent.slice(0, 30)}...")
                  </span>
                )}
              </li>
            ))}
          </ul>
        </AlertDescription>
      )}
    </Alert>
  );
}

function getMaxSeverity(violations: SafetyViolation[]): string {
  const severities = ["low", "medium", "high", "critical"];
  let maxIndex = 0;
  
  for (const v of violations) {
    const index = severities.indexOf(v.severity);
    if (index > maxIndex) maxIndex = index;
  }
  
  return severities[maxIndex];
}
```

---

### Task 60.10: Integrate Safety into AI Generation

**File: `src/lib/ai/generate-safe.ts`**

```typescript
import { generateWebsiteContent } from "./generate";
import { safeAIGeneration, filterAIPrompt, cleanAIOutput, SAFETY_SYSTEM_PROMPT } from "../safety/ai-safety";
import type { GenerateWebsiteOptions, GeneratedWebsite } from "./types";

export async function generateWebsiteContentSafe(
  options: GenerateWebsiteOptions
): Promise<{
  result: GeneratedWebsite | null;
  blocked: boolean;
  reason?: string;
  modifications?: string[];
}> {
  // Filter the input prompt
  const { filtered: safePrompt, modifications } = filterAIPrompt(
    options.businessDescription
  );

  // Wrap generation with safety checks
  const { result, blocked, reason, safety } = await safeAIGeneration(
    async () => {
      const generated = await generateWebsiteContent({
        ...options,
        businessDescription: safePrompt,
        systemPrompt: SAFETY_SYSTEM_PROMPT + (options.systemPrompt || ""),
      });

      return generated;
    },
    {
      validateInput: safePrompt,
      validateOutput: (output) => {
        // Extract text content from generated website for validation
        return JSON.stringify(output);
      },
    }
  );

  if (blocked) {
    return {
      result: null,
      blocked: true,
      reason,
      modifications,
    };
  }

  // Clean the output
  if (result) {
    // Clean any text fields in the result
    cleanGeneratedContent(result);
  }

  return {
    result,
    blocked: false,
    modifications: modifications.length > 0 ? modifications : undefined,
  };
}

function cleanGeneratedContent(content: any): void {
  if (typeof content === "string") {
    return;
  }
  
  if (typeof content === "object" && content !== null) {
    for (const key of Object.keys(content)) {
      if (typeof content[key] === "string") {
        content[key] = cleanAIOutput(content[key]);
      } else if (typeof content[key] === "object") {
        cleanGeneratedContent(content[key]);
      }
    }
  }
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Word list detection works
- [ ] URL validation catches malicious URLs
- [ ] HTML sanitizer removes dangerous content
- [ ] AI prompt filtering works

### Integration Tests
- [ ] API endpoint returns correct results
- [ ] Safe content passes validation
- [ ] Unsafe content is blocked
- [ ] AI generation uses safety wrapper

### Security Tests
- [ ] XSS attempts are blocked
- [ ] Script injection is prevented
- [ ] Malicious URLs are detected
- [ ] Phishing patterns are caught

---

## ✅ Completion Checklist

- [ ] All safety modules created
- [ ] Content filter engine working
- [ ] HTML sanitizer complete
- [ ] URL validator complete
- [ ] AI safety integration complete
- [ ] API endpoint working
- [ ] UI components created
- [ ] Tests passing
- [ ] Documentation complete

---

**Next Phase**: Phase 61 - Rate Limiting System
