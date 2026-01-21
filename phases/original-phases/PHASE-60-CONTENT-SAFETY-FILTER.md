# Phase 60: Content Safety Filter - AI Input/Output Filtering

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 HIGH
>
> **Estimated Time**: 3-4 hours

---

## 🎯 Objective

Implement content safety filtering for AI-generated content and user inputs to prevent harmful, inappropriate, or malicious content.

---

## 📋 Prerequisites

- [ ] Phase 59 RLS Security completed
- [ ] AI integration working (Claude API)
- [ ] Understanding of content moderation requirements

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ `src/lib/ai/safety.ts` - Basic AI safety module exists!
- ✅ AI generation in `src/lib/ai/generate.ts`
- ✅ AI converter in `src/lib/ai/converter.ts`

**What May Need Enhancement:**
- Comprehensive word lists
- Multiple category detection
- User-facing warning components
- Admin moderation queue

---

## ⚠️ IMPORTANT: CHECK EXISTING SAFETY MODULE FIRST

Before implementing, check `src/lib/ai/safety.ts` to see what's already there.

---

## 📁 Files to Create/Enhance

```
src/lib/safety/
├── content-filter.ts             # Main content filtering engine
├── word-lists.ts                 # Category-based patterns
├── sanitizer.ts                  # HTML/content sanitization
├── types.ts                      # Type definitions

src/components/safety/
├── content-warning.tsx           # Warning display component

src/app/api/safety/
├── check/route.ts                # Content check endpoint
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
  | "profanity";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface SafetyViolation {
  category: ContentCategory;
  severity: SeverityLevel;
  description: string;
  matchedContent?: string;
}

export interface ContentCheckResult {
  safe: boolean;
  violations: SafetyViolation[];
  sanitizedContent?: string;
  confidence: number;
}

export interface SafetyConfig {
  enabledCategories: ContentCategory[];
  severityThreshold: SeverityLevel;
  logViolations: boolean;
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
  ],
  severityThreshold: "medium",
  logViolations: true,
};
```

---

### Task 60.2: Content Filter Engine

**File: `src/lib/safety/content-filter.ts`**

```typescript
import type { ContentCheckResult, SafetyConfig, SafetyViolation, ContentCategory } from "./types";
import { DEFAULT_SAFETY_CONFIG } from "./types";

// Pattern-based detection (expandable)
const PATTERNS: Record<ContentCategory, RegExp[]> = {
  violence: [
    /\b(kill|murder|assassinate)\s+(someone|people|them)\b/gi,
    /\bterrorist\s+attack\b/gi,
  ],
  hate_speech: [
    /\b(hate|kill|destroy)\s+(all|every)\s+\w+s?\b/gi,
  ],
  sexual: [
    /\bexplicit\s+sexual\b/gi,
  ],
  self_harm: [
    /\bhow\s+to\s+(commit|attempt)\s+suicide\b/gi,
  ],
  illegal: [
    /\bhow\s+to\s+make\s+(drugs|weapons)\b/gi,
  ],
  spam: [
    /\b(buy|cheap|discount|free)\s+(now|today|pills|viagra)\b/gi,
    /\bcasino\s+online\b/gi,
  ],
  malware: [
    /<script[^>]*>.*?(eval|document\.write|innerHTML)/gi,
  ],
  phishing: [
    /\b(verify|confirm)\s+your\s+(password|account|bank)\b/gi,
  ],
  personal_info: [
    /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, // SSN pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, // Email
  ],
  profanity: [], // Add profanity patterns as needed
};

/**
 * Check content for safety violations
 */
export function checkContent(
  content: string,
  config: SafetyConfig = DEFAULT_SAFETY_CONFIG
): ContentCheckResult {
  const violations: SafetyViolation[] = [];
  
  for (const category of config.enabledCategories) {
    const patterns = PATTERNS[category] || [];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          category,
          severity: getSeverity(category),
          description: `Detected ${category.replace("_", " ")} content`,
          matchedContent: matches[0],
        });
      }
    }
  }

  return {
    safe: violations.length === 0,
    violations,
    confidence: violations.length === 0 ? 1.0 : 0.5,
  };
}

function getSeverity(category: ContentCategory): "low" | "medium" | "high" | "critical" {
  const severityMap: Record<ContentCategory, "low" | "medium" | "high" | "critical"> = {
    violence: "high",
    hate_speech: "critical",
    sexual: "high",
    self_harm: "critical",
    illegal: "critical",
    spam: "low",
    malware: "critical",
    phishing: "high",
    personal_info: "medium",
    profanity: "low",
  };
  return severityMap[category];
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, "");
  
  return sanitized;
}
```

---

### Task 60.3: Integrate with AI Generation

**Update `src/lib/ai/generate.ts` to use safety filter:**

```typescript
import { checkContent, sanitizeHtml } from "@/lib/safety/content-filter";

// In your AI generation function, add safety check:
export async function generateSafeContent(prompt: string) {
  // Check input prompt
  const inputCheck = checkContent(prompt);
  if (!inputCheck.safe) {
    return { 
      error: "Content request flagged for safety review",
      violations: inputCheck.violations 
    };
  }

  // Generate content...
  const generatedContent = await generateFromAI(prompt);

  // Check output
  const outputCheck = checkContent(generatedContent);
  if (!outputCheck.safe) {
    // Log for review but still return sanitized version
    console.warn("AI output flagged:", outputCheck.violations);
  }

  return {
    content: sanitizeHtml(generatedContent),
    safetyCheck: outputCheck,
  };
}
```

---

### Task 60.4: Content Warning Component

**File: `src/components/safety/content-warning.tsx`**

```typescript
"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SafetyViolation } from "@/lib/safety/types";

interface ContentWarningProps {
  violations: SafetyViolation[];
  onDismiss?: () => void;
}

export function ContentWarning({ violations, onDismiss }: ContentWarningProps) {
  if (violations.length === 0) return null;

  const highestSeverity = violations.reduce((highest, v) => {
    const order = ["low", "medium", "high", "critical"];
    return order.indexOf(v.severity) > order.indexOf(highest) ? v.severity : highest;
  }, "low" as string);

  return (
    <Alert variant={highestSeverity === "critical" ? "destructive" : "default"}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Content Warning</AlertTitle>
      <AlertDescription>
        <p>This content has been flagged for review:</p>
        <ul className="mt-2 list-inside list-disc text-sm">
          {violations.map((v, i) => (
            <li key={i}>
              {v.category.replace("_", " ")}: {v.description}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
```

---

## ✅ Completion Checklist

- [ ] Safety types defined
- [ ] Content filter engine working
- [ ] AI input validation added
- [ ] AI output sanitization added
- [ ] HTML sanitization working
- [ ] Content warning component created
- [ ] Tested with various inputs
- [ ] No false positives on normal content

---

## 📝 Notes for AI Agent

1. **CHECK EXISTING** - Look at `src/lib/ai/safety.ts` first
2. **DON'T OVER-FILTER** - Avoid false positives
3. **LOG VIOLATIONS** - For admin review
4. **SANITIZE OUTPUT** - Always sanitize AI-generated HTML
5. **PATTERN EXPANSION** - Add more patterns gradually
