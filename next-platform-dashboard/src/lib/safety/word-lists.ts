/**
 * Content Safety Word Lists and Patterns
 * Categorized patterns for detecting unsafe content
 */

import type { ContentCategory, SeverityLevel } from "./types";

export interface PatternDefinition {
  pattern: RegExp;
  severity: SeverityLevel;
  description: string;
}

/**
 * Category-based detection patterns
 * Each category has multiple patterns with associated severity
 */
export const CATEGORY_PATTERNS: Record<ContentCategory, PatternDefinition[]> = {
  violence: [
    {
      pattern: /\b(kill|murder|assassinate)\s+(someone|people|them|you|him|her)\b/gi,
      severity: "high",
      description: "Direct threat of violence against people",
    },
    {
      pattern: /\bterrorist\s+(attack|threat|plot|act)\b/gi,
      severity: "critical",
      description: "Terrorism-related content",
    },
    {
      pattern: /\bhow\s+to\s+(hurt|harm|attack|assault)\b/gi,
      severity: "high",
      description: "Instructions for causing harm",
    },
    {
      pattern: /\bmass\s+(shooting|murder|killing)\b/gi,
      severity: "critical",
      description: "Mass violence references",
    },
    {
      pattern: /\b(bomb|explosive)\s+(threat|making|instructions)\b/gi,
      severity: "critical",
      description: "Explosive-related threats or instructions",
    },
  ],
  
  hate_speech: [
    {
      pattern: /\b(hate|kill|destroy|eliminate)\s+(all|every)\s+\w+s?\b/gi,
      severity: "critical",
      description: "Group-targeted hate speech",
    },
    {
      pattern: /\b(ethnic|racial)\s+cleansing\b/gi,
      severity: "critical",
      description: "Genocide-related content",
    },
    {
      pattern: /\bwhite\s+supremacy\b/gi,
      severity: "critical",
      description: "Supremacist ideology",
    },
    {
      pattern: /\b(inferior|subhuman)\s+(race|people|group)\b/gi,
      severity: "critical",
      description: "Dehumanizing language",
    },
  ],
  
  sexual: [
    {
      pattern: /\bexplicit\s+sexual\s+(content|material|images?|videos?)\b/gi,
      severity: "high",
      description: "Explicit sexual material references",
    },
    {
      pattern: /\bpornograph(y|ic)\b/gi,
      severity: "high",
      description: "Pornographic content references",
    },
    {
      pattern: /\bchild\s+(porn|abuse|exploitation)\b/gi,
      severity: "critical",
      description: "Child exploitation content",
    },
    {
      pattern: /\bnsfw\s+(content|images?|material)\b/gi,
      severity: "medium",
      description: "NSFW content references",
    },
  ],
  
  self_harm: [
    {
      pattern: /\bhow\s+to\s+(commit|attempt)\s+suicide\b/gi,
      severity: "critical",
      description: "Suicide instructions",
    },
    {
      pattern: /\bsuicide\s+(method|technique|way)\b/gi,
      severity: "critical",
      description: "Suicide methods",
    },
    {
      pattern: /\bself[\s-]?harm\s+(method|technique|how\s+to)\b/gi,
      severity: "critical",
      description: "Self-harm instructions",
    },
    {
      pattern: /\bencourag(e|ing)\s+(suicide|self[\s-]?harm)\b/gi,
      severity: "critical",
      description: "Encouraging self-harm",
    },
  ],
  
  illegal: [
    {
      pattern: /\bhow\s+to\s+(make|manufacture|cook)\s+(drugs?|meth|cocaine)\b/gi,
      severity: "critical",
      description: "Drug manufacturing instructions",
    },
    {
      pattern: /\bhow\s+to\s+(make|build|construct)\s+(bomb|explosive|weapon)\b/gi,
      severity: "critical",
      description: "Weapon manufacturing instructions",
    },
    {
      pattern: /\bhow\s+to\s+(hack|breach|exploit)\s+(system|account|computer)\b/gi,
      severity: "high",
      description: "Hacking instructions",
    },
    {
      pattern: /\bstolen\s+(credit\s+card|identity|data)\s+(for\s+sale|buy)\b/gi,
      severity: "critical",
      description: "Selling stolen information",
    },
    {
      pattern: /\bmoney\s+launder(ing)?\b/gi,
      severity: "high",
      description: "Money laundering references",
    },
  ],
  
  spam: [
    {
      pattern: /\b(buy|cheap|discount|free)\s+(now|today|limited)\s*(pills?|viagra|cialis)?\b/gi,
      severity: "low",
      description: "Spam promotional language",
    },
    {
      pattern: /\bcasino\s+(online|bonus|free\s+spins)\b/gi,
      severity: "low",
      description: "Casino spam",
    },
    {
      pattern: /\bget\s+rich\s+(quick|fast|now)\b/gi,
      severity: "low",
      description: "Get rich quick schemes",
    },
    {
      pattern: /\b(work\s+from\s+home|make\s+money\s+fast).{0,20}\$\d+/gi,
      severity: "low",
      description: "Work from home scam patterns",
    },
    {
      pattern: /\bcongratulations\s*!?\s*you('ve)?\s+(won|been\s+selected)\b/gi,
      severity: "low",
      description: "Prize scam language",
    },
  ],
  
  malware: [
    {
      pattern: /<script[^>]*>[\s\S]*?(eval|document\.write|innerHTML\s*=)[\s\S]*?<\/script>/gi,
      severity: "critical",
      description: "Potentially malicious script execution",
    },
    {
      pattern: /eval\s*\(\s*["'`][\s\S]*?["'`]\s*\)/gi,
      severity: "critical",
      description: "Eval-based code injection",
    },
    {
      pattern: /document\.(cookie|location)\s*=/gi,
      severity: "high",
      description: "Cookie or location manipulation",
    },
    {
      pattern: /new\s+Function\s*\(["'`][\s\S]*?["'`]\)/gi,
      severity: "critical",
      description: "Dynamic function creation",
    },
    {
      pattern: /window\.(location|open)\s*\(\s*["'`][^"'`]*["'`]/gi,
      severity: "medium",
      description: "Potential redirect attempt",
    },
    {
      pattern: /data:\s*text\/html/gi,
      severity: "high",
      description: "Data URI HTML injection",
    },
  ],
  
  phishing: [
    {
      pattern: /\b(verify|confirm|update)\s+your\s+(password|account|bank|login|credentials)\b/gi,
      severity: "high",
      description: "Account verification phishing",
    },
    {
      pattern: /\byour\s+account\s+(has\s+been|will\s+be)\s+(suspended|locked|closed)\b/gi,
      severity: "high",
      description: "Account suspension scare tactic",
    },
    {
      pattern: /\bclick\s+(here|this\s+link)\s+to\s+(verify|confirm|secure)\b/gi,
      severity: "medium",
      description: "Suspicious link prompt",
    },
    {
      pattern: /\benter\s+your\s+(ssn|social\s+security|credit\s+card)\b/gi,
      severity: "critical",
      description: "Sensitive information request",
    },
    {
      pattern: /\burgent:\s*(account|security|verification)/gi,
      severity: "medium",
      description: "Urgency-based phishing",
    },
  ],
  
  personal_info: [
    {
      pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
      severity: "medium",
      description: "Social Security Number pattern",
    },
    {
      pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      severity: "medium",
      description: "Credit card number pattern",
    },
    {
      pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g,
      severity: "medium",
      description: "Valid credit card number pattern",
    },
  ],
  
  profanity: [
    // Note: Adding minimal patterns here - expand based on requirements
    // Avoiding explicit words in code
    {
      pattern: /\bf+[\*u]+c+k+/gi,
      severity: "low",
      description: "Profane language (obfuscated)",
    },
    {
      pattern: /\bs+h+[\*i]+t+/gi,
      severity: "low",
      description: "Profane language (obfuscated)",
    },
  ],
};

/**
 * Get all patterns for specified categories
 */
export function getPatternsForCategories(
  categories: ContentCategory[]
): Map<ContentCategory, PatternDefinition[]> {
  const result = new Map<ContentCategory, PatternDefinition[]>();
  
  for (const category of categories) {
    const patterns = CATEGORY_PATTERNS[category];
    if (patterns && patterns.length > 0) {
      result.set(category, patterns);
    }
  }
  
  return result;
}

/**
 * Get severity for a category (returns highest severity pattern)
 */
export function getCategorySeverity(category: ContentCategory): SeverityLevel {
  const patterns = CATEGORY_PATTERNS[category];
  if (!patterns || patterns.length === 0) return "low";
  
  const severityOrder: SeverityLevel[] = ["low", "medium", "high", "critical"];
  let highest: SeverityLevel = "low";
  
  for (const pattern of patterns) {
    if (severityOrder.indexOf(pattern.severity) > severityOrder.indexOf(highest)) {
      highest = pattern.severity;
    }
  }
  
  return highest;
}

/**
 * Blocked keywords (simple word matching)
 */
export const BLOCKED_KEYWORDS: string[] = [
  // These are for simple matching in addition to regex patterns
  "dark web marketplace",
  "buy fake id",
  "counterfeit money",
  "hitman for hire",
  "child exploitation",
];

/**
 * Allowed exceptions (contexts where flagged words might be okay)
 */
export const ALLOWED_CONTEXTS: string[] = [
  "violence prevention",
  "anti-hate",
  "suicide prevention",
  "content moderation",
  "safety filter",
  "security research",
];
