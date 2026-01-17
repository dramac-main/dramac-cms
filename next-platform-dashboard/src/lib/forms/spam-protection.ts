/**
 * Spam protection utilities for form submissions
 */

export interface SpamCheckResult {
  isSpam: boolean;
  score: number; // 0-100, higher = more likely spam
  reasons: string[];
}

export interface SpamCheckOptions {
  enableContentAnalysis?: boolean;
  enableLinkChecking?: boolean;
  enablePatternMatching?: boolean;
  customBlockedWords?: string[];
  maxLinks?: number;
  maxEmails?: number;
}

const DEFAULT_OPTIONS: SpamCheckOptions = {
  enableContentAnalysis: true,
  enableLinkChecking: true,
  enablePatternMatching: true,
  maxLinks: 3,
  maxEmails: 2,
};

// Spam word lists
const SPAM_KEYWORDS = [
  // Pharma
  "viagra", "cialis", "xanax", "tramadol", "hydrocodone", "oxycodone", 
  "phentermine", "ambien", "modafinil", "adderall", "valium",
  
  // Casino/Gambling
  "casino", "poker", "blackjack", "slot machine", "gambling", "bet365",
  "sportsbetting", "online betting", "win big",
  
  // Get rich quick
  "lottery", "winner", "jackpot", "million dollars", "inheritance",
  "nigerian prince", "urgent response", "bank transfer",
  
  // Marketing spam
  "click here", "act now", "limited time", "exclusive offer", "free money",
  "100% free", "no obligation", "risk free", "guaranteed",
  
  // SEO spam
  "buy backlinks", "seo service", "rank #1", "google ranking", "first page",
  
  // Crypto spam
  "bitcoin doubler", "crypto giveaway", "free btc", "ethereum airdrop",
  "crypto investment", "guaranteed returns",
  
  // Adult content
  "adult content", "xxx", "porn",
];

// Suspicious TLDs often used in spam
const SUSPICIOUS_TLDS = [
  ".ru", ".cn", ".tk", ".xyz", ".top", ".gq", ".ml", ".ga", ".cf", ".pw", ".ws",
  ".click", ".link", ".website", ".site", ".online", ".store",
];

// Patterns that indicate code injection attempts
const INJECTION_PATTERNS = [
  /<script\b/i,
  /javascript:/i,
  /on\w+\s*=/i, // onclick=, onmouseover=, etc.
  /data:/i,
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i,
  /eval\s*\(/i,
  /expression\s*\(/i,
];

// BBCode and forum spam patterns
const FORUM_SPAM_PATTERNS = [
  /\[url=/i,
  /\[link=/i,
  /\[img=/i,
  /\[b\]/i,
  /\[\/b\]/i,
  /\[url\]/i,
];

/**
 * Perform comprehensive spam check on form data
 */
export function checkForSpam(
  data: Record<string, unknown>,
  options: SpamCheckOptions = {}
): SpamCheckResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const reasons: string[] = [];
  let score = 0;

  // Combine all string values for analysis
  const content = Object.values(data)
    .filter((v): v is string => typeof v === "string")
    .join(" ")
    .toLowerCase();

  // 1. Pattern matching for injection attempts
  if (opts.enablePatternMatching) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(content)) {
        score += 50;
        reasons.push("Potential code injection detected");
        break;
      }
    }

    for (const pattern of FORUM_SPAM_PATTERNS) {
      if (pattern.test(content)) {
        score += 30;
        reasons.push("Forum spam patterns detected");
        break;
      }
    }
  }

  // 2. Spam keyword analysis
  if (opts.enableContentAnalysis) {
    const matchedKeywords: string[] = [];
    for (const keyword of SPAM_KEYWORDS) {
      if (content.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      score += Math.min(matchedKeywords.length * 15, 60);
      reasons.push(`Spam keywords found: ${matchedKeywords.slice(0, 3).join(", ")}`);
    }

    // Check custom blocked words
    if (opts.customBlockedWords && opts.customBlockedWords.length > 0) {
      const blocked = opts.customBlockedWords.filter((word) =>
        content.includes(word.toLowerCase())
      );
      if (blocked.length > 0) {
        score += blocked.length * 20;
        reasons.push(`Blocked words found: ${blocked.join(", ")}`);
      }
    }
  }

  // 3. Link analysis
  if (opts.enableLinkChecking) {
    const links = content.match(/https?:\/\/[^\s]+/gi) || [];
    const maxLinks = opts.maxLinks ?? 3;

    if (links.length > maxLinks) {
      score += 25;
      reasons.push(`Too many links (${links.length} found, max ${maxLinks})`);
    }

    // Check for suspicious TLDs
    for (const link of links) {
      for (const tld of SUSPICIOUS_TLDS) {
        if (link.toLowerCase().includes(tld)) {
          score += 20;
          reasons.push(`Suspicious domain TLD detected: ${tld}`);
          break;
        }
      }
    }
  }

  // 4. Email analysis
  const emails = content.match(/[\w.-]+@[\w.-]+\.\w+/gi) || [];
  const maxEmails = opts.maxEmails ?? 2;
  
  if (emails.length > maxEmails) {
    score += 15;
    reasons.push(`Too many email addresses (${emails.length} found, max ${maxEmails})`);
  }

  // 5. All caps check (potential yelling/spam)
  const words = content.split(/\s+/).filter((w) => w.length > 3);
  if (words.length > 5) {
    const capsWords = words.filter((w) => w === w.toUpperCase() && /[A-Z]/.test(w));
    const capsRatio = capsWords.length / words.length;
    if (capsRatio > 0.7) {
      score += 15;
      reasons.push("Excessive use of capital letters");
    }
  }

  // 6. Repetitive content check
  const wordFrequency = new Map<string, number>();
  for (const word of words) {
    if (word.length > 4) {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    }
  }
  
  const maxFrequency = Math.max(...Array.from(wordFrequency.values()), 0);
  if (maxFrequency > 5 && words.length > 10) {
    score += 10;
    reasons.push("Repetitive content detected");
  }

  // 7. Gibberish/random character detection
  const gibberishPattern = /[bcdfghjklmnpqrstvwxz]{5,}|[aeiou]{5,}/i;
  if (gibberishPattern.test(content)) {
    score += 10;
    reasons.push("Potential gibberish content");
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return {
    isSpam: score >= 50,
    score,
    reasons,
  };
}

/**
 * Check if a honeypot field was filled (indicates bot)
 */
export function checkHoneypot(data: Record<string, unknown>): boolean {
  // Common honeypot field names
  const honeypotFields = [
    "_honeypot",
    "honeypot",
    "_hp",
    "website_url",
    "fax_number",
    "your_website",
    "hp_field",
    "_gotcha",
  ];

  for (const field of honeypotFields) {
    if (data[field] !== undefined && data[field] !== "" && data[field] !== null) {
      return true;
    }
  }

  return false;
}

/**
 * Simple rate limit check using in-memory storage
 * For production, use Redis or database-backed rate limiting
 */
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

export function checkRateLimit(
  identifier: string, // Usually IP + form ID
  maxRequests: number = 10,
  windowMs: number = 3600000 // 1 hour
): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now - record.windowStart > windowMs) {
    // New window
    rateLimitStore.set(identifier, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(record.windowStart + windowMs),
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: new Date(record.windowStart + windowMs),
  };
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimits(maxAge: number = 3600000): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.windowStart > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

// Set up automatic cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => cleanupRateLimits(), 300000);
}
