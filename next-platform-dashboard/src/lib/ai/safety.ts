/**
 * Content Safety Filter
 * Prevents inappropriate content in AI-generated websites
 */

// Blocked keywords and phrases
const BLOCKED_KEYWORDS = [
  // Violence
  'violence', 'kill', 'murder', 'attack', 'weapon', 'gun', 'bomb',
  // Adult content
  'adult', 'xxx', 'porn', 'nude', 'explicit', 'nsfw',
  // Hate speech
  'hate', 'racist', 'discrimination', 'supremacy',
  // Illegal
  'illegal', 'drugs', 'hack', 'crack', 'pirate',
  // Scams
  'get rich quick', 'pyramid', 'mlm scheme',
];

// Blocked industries/niches
const BLOCKED_INDUSTRIES = [
  'gambling',
  'casino',
  'adult entertainment',
  'weapons',
  'tobacco',
  'cryptocurrency scam',
];

export interface SafetyCheckResult {
  isAllowed: boolean;
  blockedTerms: string[];
  reason?: string;
}

/**
 * Check if prompt contains blocked content
 */
export function checkPromptSafety(prompt: string): SafetyCheckResult {
  const lowercasePrompt = prompt.toLowerCase();
  const blockedTerms: string[] = [];

  // Check for blocked keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowercasePrompt.includes(keyword)) {
      blockedTerms.push(keyword);
    }
  }

  // Check for blocked industries
  for (const industry of BLOCKED_INDUSTRIES) {
    if (lowercasePrompt.includes(industry)) {
      blockedTerms.push(industry);
    }
  }

  if (blockedTerms.length > 0) {
    return {
      isAllowed: false,
      blockedTerms,
      reason: `Content contains blocked terms: ${blockedTerms.join(', ')}`,
    };
  }

  return { isAllowed: true, blockedTerms: [] };
}

/**
 * Sanitize generated content
 */
export function sanitizeGeneratedContent(content: string): string {
  let sanitized = content;

  // Remove any blocked keywords that slipped through
  for (const keyword of BLOCKED_KEYWORDS) {
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, '[removed]');
  }

  // Remove potential script injections
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  return sanitized;
}

/**
 * Check if business name is appropriate
 */
export function checkBusinessName(name: string): SafetyCheckResult {
  const lowercaseName = name.toLowerCase();
  const blockedTerms: string[] = [];

  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowercaseName.includes(keyword)) {
      blockedTerms.push(keyword);
    }
  }

  if (blockedTerms.length > 0) {
    return {
      isAllowed: false,
      blockedTerms,
      reason: 'Business name contains inappropriate content',
    };
  }

  return { isAllowed: true, blockedTerms: [] };
}

/**
 * Content moderation levels
 */
export type ModerationLevel = 'strict' | 'moderate' | 'permissive';

/**
 * Get blocked keywords for moderation level
 */
export function getBlockedKeywords(level: ModerationLevel): string[] {
  switch (level) {
    case 'strict':
      return BLOCKED_KEYWORDS;
    case 'moderate':
      return BLOCKED_KEYWORDS.filter(k => 
        !['hate', 'discrimination'].includes(k) // Allow some edge cases
      );
    case 'permissive':
      return BLOCKED_KEYWORDS.filter(k =>
        ['violence', 'kill', 'murder', 'xxx', 'porn'].includes(k) // Only block severe
      );
    default:
      return BLOCKED_KEYWORDS;
  }
}

/**
 * Export blocked terms for reference
 */
export function getAllBlockedTerms(): { keywords: string[]; industries: string[] } {
  return {
    keywords: [...BLOCKED_KEYWORDS],
    industries: [...BLOCKED_INDUSTRIES],
  };
}

/**
 * Check if content is safe for public display
 */
export function isContentSafe(content: string): boolean {
  const result = checkPromptSafety(content);
  return result.isAllowed;
}
