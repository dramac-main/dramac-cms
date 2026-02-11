# PHASE SM-06: AI Content Engine

**Phase**: SM-06  
**Name**: AI Content Engine — Captions, Hashtags, Ideas, Scheduling Intelligence  
**Independence**: Fully independent — uses existing AI infrastructure (Anthropic Claude)  
**Connection Points**: Used by the post composer for content generation; uses AI SDK already in the project  
**Estimated Files**: ~8 new/modified files

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md
memory-bank/techContext.md (AI provider section)
phases/social-media/PHASE-SM-00-MASTER-PLAN.md
src/modules/social-media/types/index.ts (AIContentIdea, AICaption types)
src/modules/social-media/components/PostComposerEnhanced.tsx
src/modules/social-media/components/PostComposer.tsx
src/config/ai-provider.ts (if exists — AI model configuration)
```

---

## Context

The manifest lists AI capabilities (ai-content-ideas, ai-captions, ai-hashtags, ai-optimal-times) but none are implemented. The platform already uses Anthropic Claude via `@ai-sdk/anthropic` for the AI Website Designer and AI Agents. This phase builds the social media AI content engine using the same infrastructure.

### Current State
- Zero AI features in social media module
- `AIContentIdea` and `AICaption` types defined in types/index.ts
- Platform uses `@ai-sdk/anthropic` (Claude) as primary AI provider
- AI SDK `6.0.33` installed
- `ANTHROPIC_API_KEY` env var used by other features
- No AI-related server actions or components in social media module

### Target State
- AI caption generation with tone, emoji level, and platform-specific optimization
- AI hashtag suggestions based on content and trending topics
- AI content idea generation based on content pillars and audience
- AI image alt text generation
- AI-powered best time to post suggestions
- AI rewrite/improve existing post content
- All AI features accessible from the post composer

---

## Task 1: Create AI Content Service

### Create `src/modules/social-media/lib/ai-content-service.ts`

```typescript
'use server'

/**
 * AI Content Service
 * 
 * PHASE SM-06: AI-powered content generation for social media
 * Uses Anthropic Claude via the AI SDK (same provider as rest of platform)
 */

import { generateText, generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { SocialPlatform, AICaption, AIContentIdea } from '../types'
import { PLATFORM_CONFIGS } from '../types'

const model = anthropic('claude-sonnet-4-20250514')

// ============================================================================
// CAPTION GENERATION
// ============================================================================

/**
 * Generate AI captions for a social media post
 */
export async function generateCaptions(params: {
  topic: string
  platform: SocialPlatform
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational' | 'promotional'
  emojiLevel: 'none' | 'low' | 'medium' | 'high'
  includeHashtags: boolean
  includeCallToAction: boolean
  brandVoice?: string // Optional brand voice description
  count?: number // Number of variations (default 3)
}): Promise<{ captions: AICaption[]; error?: string }> {
  // Implementation:
  // 1. Build prompt with platform-specific constraints:
  //    - Character limit from PLATFORM_CONFIGS[platform].characterLimit
  //    - Platform best practices (e.g., Instagram: hashtags in first comment vs. in caption)
  //    - Tone and emoji guidelines
  // 2. Use generateObject with Zod schema for structured output
  // 3. Schema:
  //    z.object({
  //      captions: z.array(z.object({
  //        content: z.string(),
  //        hashtags: z.array(z.string()),
  //        emojiLevel: z.enum(['none', 'low', 'medium', 'high']),
  //        tone: z.string(),
  //      }))
  //    })
  // 4. Return captions array
}

// ============================================================================
// HASHTAG GENERATION
// ============================================================================

/**
 * Generate relevant hashtags for content
 */
export async function generateHashtags(params: {
  content: string
  platform: SocialPlatform
  count?: number // Number of hashtags (default 15)
  includeNiche?: boolean // Include niche/long-tail hashtags
  includeTrending?: boolean // Include currently trending (AI's best guess)
}): Promise<{ hashtags: Array<{ tag: string; category: 'popular' | 'niche' | 'trending' | 'branded' }>; error?: string }> {
  // Implementation:
  // 1. Analyze content for key themes and topics
  // 2. Generate hashtags in categories:
  //    - Popular (high volume, high competition): #marketing, #business
  //    - Niche (low volume, high relevance): #zambianentrepreneurs, #lusakabusiness
  //    - Trending (currently popular): based on AI's knowledge
  //    - Branded (company-specific): if brand voice provided
  // 3. Platform-specific rules:
  //    - Instagram: 20-30 hashtags optimal
  //    - Twitter: 2-3 max
  //    - LinkedIn: 3-5 professional ones
  //    - TikTok: 5-10 with trends
}

// ============================================================================
// CONTENT IDEAS
// ============================================================================

/**
 * Generate content ideas based on audience, industry, and content pillars
 */
export async function generateContentIdeas(params: {
  siteId: string
  industry?: string
  contentPillars?: string[]
  platforms: SocialPlatform[]
  count?: number // Number of ideas (default 10)
  timeframe?: 'week' | 'month' // Ideas for next week or month
}): Promise<{ ideas: AIContentIdea[]; error?: string }> {
  // Implementation:
  // 1. Build context from:
  //    - Industry/niche
  //    - Content pillars (brand pillars)
  //    - Upcoming holidays/events (AI's knowledge)
  //    - Platform-specific content formats
  // 2. Generate structured ideas with:
  //    - Title
  //    - Content draft
  //    - Suggested platforms
  //    - Content pillar category
  //    - Suggested posting date
  // 3. Save to social_ai_content_ideas table (if table exists) or return directly
  // 4. Return ideas array
}

// ============================================================================
// CONTENT IMPROVEMENT
// ============================================================================

/**
 * Improve or rewrite existing content
 */
export async function improveContent(params: {
  content: string
  platform: SocialPlatform
  instruction: string // e.g., "make it shorter", "add urgency", "make it professional"
}): Promise<{ improved: string; error?: string }> {
  // Implementation:
  // 1. Send content + instruction to Claude
  // 2. Include platform character limit constraint
  // 3. Return improved content
}

/**
 * Translate content to another language while maintaining tone
 */
export async function translateContent(params: {
  content: string
  targetLanguage: string
  preserveTone: boolean
}): Promise<{ translated: string; error?: string }> {
  // Simple translation via Claude
}

// ============================================================================
// ALT TEXT GENERATION
// ============================================================================

/**
 * Generate alt text for an image
 * Uses Claude's vision capabilities to analyze the image
 */
export async function generateAltText(params: {
  imageUrl: string
  context?: string // What the post is about
}): Promise<{ altText: string; error?: string }> {
  // Implementation:
  // 1. Use Claude's vision model to analyze the image
  // 2. Generate descriptive alt text following WCAG guidelines:
  //    - Describe the image content objectively
  //    - Include text visible in the image
  //    - Keep under 125 characters
  //    - Don't start with "Image of" or "Photo of"
  // 3. Return alt text
}

// ============================================================================
// THREAD GENERATION
// ============================================================================

/**
 * Break long-form content into a Twitter thread
 */
export async function generateThread(params: {
  content: string
  maxTweets?: number // Max number of tweets in thread (default 10)
}): Promise<{ thread: string[]; error?: string }> {
  // Implementation:
  // 1. Analyze content length and key points
  // 2. Break into tweet-sized segments (280 chars each)
  // 3. Ensure each tweet makes sense standalone
  // 4. Add thread numbering (1/N format)
  // 5. First tweet should hook the reader
  // 6. Last tweet should have CTA
}

// ============================================================================
// POSTING TIME SUGGESTION
// ============================================================================

/**
 * Suggest optimal posting time based on audience and content type
 * Uses historical data + AI reasoning
 */
export async function suggestPostingTime(params: {
  siteId: string
  platform: SocialPlatform
  contentType: 'image' | 'video' | 'text' | 'carousel'
  accountId?: string
}): Promise<{ suggestedTime: string; reason: string; error?: string }> {
  // Implementation:
  // 1. If optimal_times data exists for the account → use that
  // 2. Otherwise, use AI to suggest based on:
  //    - Platform best practices
  //    - Content type (video performs better in evening, etc.)
  //    - General engagement patterns
  //    - Zambia timezone considerations (Africa/Lusaka, UTC+2)
  // 3. Return ISO datetime + human-readable reason
}
```

---

## Task 2: Create AI Content Actions

### Create `src/modules/social-media/actions/ai-actions.ts`

```typescript
'use server'

/**
 * Social Media Module - AI Actions
 * 
 * PHASE SM-06: Server actions for AI content generation features
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  generateCaptions,
  generateHashtags,
  generateContentIdeas,
  improveContent,
  generateAltText,
  generateThread,
  suggestPostingTime,
  translateContent,
} from '../lib/ai-content-service'

/**
 * Generate captions — wraps AI service with error handling and logging
 */
export async function aiGenerateCaptions(params: Parameters<typeof generateCaptions>[0]) {
  try {
    return await generateCaptions(params)
  } catch (error) {
    return { captions: [], error: error instanceof Error ? error.message : 'Caption generation failed' }
  }
}

/**
 * Generate hashtags — wraps AI service
 */
export async function aiGenerateHashtags(params: Parameters<typeof generateHashtags>[0]) {
  try {
    return await generateHashtags(params)
  } catch (error) {
    return { hashtags: [], error: error instanceof Error ? error.message : 'Hashtag generation failed' }
  }
}

/**
 * Generate content ideas and optionally save to DB
 */
export async function aiGenerateContentIdeas(params: Parameters<typeof generateContentIdeas>[0] & { save?: boolean }) {
  try {
    const result = await generateContentIdeas(params)
    
    if (params.save && result.ideas.length > 0) {
      const supabase = await createClient()
      // Insert ideas into a content ideas table if it exists
      // or return for display only
    }
    
    return result
  } catch (error) {
    return { ideas: [], error: error instanceof Error ? error.message : 'Idea generation failed' }
  }
}

/**
 * Improve content — wraps AI service
 */
export async function aiImproveContent(params: Parameters<typeof improveContent>[0]) {
  try {
    return await improveContent(params)
  } catch (error) {
    return { improved: '', error: error instanceof Error ? error.message : 'Content improvement failed' }
  }
}

/**
 * Generate alt text for image — wraps AI service
 */
export async function aiGenerateAltText(params: Parameters<typeof generateAltText>[0]) {
  try {
    return await generateAltText(params)
  } catch (error) {
    return { altText: '', error: error instanceof Error ? error.message : 'Alt text generation failed' }
  }
}

/**
 * Generate Twitter thread — wraps AI service
 */
export async function aiGenerateThread(params: Parameters<typeof generateThread>[0]) {
  try {
    return await generateThread(params)
  } catch (error) {
    return { thread: [], error: error instanceof Error ? error.message : 'Thread generation failed' }
  }
}

/**
 * Suggest posting time — wraps AI service
 */
export async function aiSuggestPostingTime(params: Parameters<typeof suggestPostingTime>[0]) {
  try {
    return await suggestPostingTime(params)
  } catch (error) {
    return { suggestedTime: '', reason: '', error: error instanceof Error ? error.message : 'Time suggestion failed' }
  }
}

/**
 * Translate content — wraps AI service
 */
export async function aiTranslateContent(params: Parameters<typeof translateContent>[0]) {
  try {
    return await translateContent(params)
  } catch (error) {
    return { translated: '', error: error instanceof Error ? error.message : 'Translation failed' }
  }
}
```

---

## Task 3: Create AI Assistant Panel Component

### Create `src/modules/social-media/components/ui/ai-assistant-panel.tsx`

A slide-over or panel component that provides AI features inside the post composer:

**UI Layout:**
```
┌─────────────────────────────────┐
│ ✨ AI Assistant              [X] │
├─────────────────────────────────┤
│ ┌─ Quick Actions ─────────────┐ │
│ │ [Generate Caption]          │ │
│ │ [Suggest Hashtags]          │ │
│ │ [Create Thread]             │ │
│ │ [Improve Content]           │ │
│ │ [Generate Alt Text]         │ │
│ │ [Suggest Post Time]         │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Caption Generator ────────┐ │
│ │ Topic: [____________]      │ │
│ │ Tone:  [Professional ▾]    │ │
│ │ Emoji: [Low ▾]             │ │
│ │ Platform: [Instagram ▾]    │ │
│ │ [✨ Generate]              │ │
│ │                            │ │
│ │ Results:                   │ │
│ │ ┌──────────────────────┐   │ │
│ │ │ Caption 1... [Use]   │   │ │
│ │ ├──────────────────────┤   │ │
│ │ │ Caption 2... [Use]   │   │ │
│ │ ├──────────────────────┤   │ │
│ │ │ Caption 3... [Use]   │   │ │
│ │ └──────────────────────┘   │ │
│ └────────────────────────────┘ │
└─────────────────────────────────┘
```

**Features:**
1. **Caption Generator**: Topic input, tone selector, emoji level, platform selector → generates 3 variations
2. **Hashtag Suggestions**: Based on current content, shows categorized hashtags with "Add All" / individual add
3. **Thread Creator**: Takes long-form content → breaks into tweet-sized segments with preview
4. **Content Improver**: Select instruction (shorter, professional, urgent, etc.) → rewrites current content
5. **Alt Text Generator**: For each uploaded image, one-click alt text generation
6. **Time Suggester**: Shows AI-recommended posting time with reasoning

**Interaction:**
- "Use" button inserts the generated content into the composer
- "Add" buttons for hashtags append to current content
- Loading states with skeleton shimmer during generation
- Error states with retry option

---

## Task 4: Integrate AI Panel into Post Composer

### Modify `src/modules/social-media/components/PostComposerEnhanced.tsx`

1. **Add AI button** in the composer toolbar: sparkle icon (WandSparkles from lucide-react)
2. **Toggle AI panel** on the right side of the composer when clicked
3. **Wire callbacks**:
   - `onUseCaption(caption)` → replaces composer content
   - `onAddHashtags(tags)` → appends to content
   - `onUseThread(thread)` → sets content to thread (if Twitter selected)
   - `onImproveContent()` → sends current content to AI, replaces on success
4. **AI indicator**: Show a small "AI" badge on the post if `ai_generated` is true
5. **Auto-suggest**: When platform is selected but content is empty, show a subtle "✨ Need ideas?" prompt

### Modify `src/modules/social-media/components/PostComposer.tsx`

Same AI integration for the original composer (if it's still used).

---

## Task 5: Create Content Ideas Page Enhancement

### Modify the Compose page or Dashboard to include a "Content Ideas" section:

**Option A**: Add a "Content Ideas" tab to the compose page
**Option B**: Add a "Content Ideas" card to the dashboard

**Implementation:**
1. "Generate Ideas" button that opens a dialog
2. Input: industry, content pillars (multi-select), platforms (multi-select), timeframe
3. Output: List of content ideas with:
   - Title
   - Content preview
   - Suggested platforms (icons)
   - Suggested date
   - "Create Post" button → opens composer pre-filled with the idea content
4. Save ideas for later (stored in state or DB)

---

## Task 6: Update Module Barrel Export

### Modify `src/modules/social-media/index.ts`

Add exports for the new AI actions:
```typescript
export * from './actions/ai-actions'
```

### Modify `src/modules/social-media/actions/index.ts`

Add:
```typescript
export * from './ai-actions'
```

---

## Verification Checklist

```
□ npx tsc --noEmit passes with zero errors
□ AI assistant panel opens from composer toolbar
□ Caption generation produces 3 relevant captions for the given topic
□ Generated captions respect platform character limits
□ Hashtag generation returns categorized hashtags (popular, niche, trending)
□ "Use" button correctly inserts caption into composer
□ "Add" button for hashtags appends to content correctly
□ Content improvement rewrites content based on instruction
□ Thread generator breaks long content into tweet-sized segments
□ Alt text generation produces descriptive text for uploaded images
□ Posting time suggestion returns a time with reasoning
□ Translation produces translated content
□ Loading states display correctly during generation
□ Error states show meaningful messages with retry option
□ AI-generated posts are marked with ai_generated: true
□ Content ideas generation works with industry/pillar inputs
□ No mock AI responses — all generation uses real Claude API
□ ANTHROPIC_API_KEY is used (same key as rest of platform)
□ AI features are accessible and work in the enhanced composer
□ Commit: git commit -m "feat(social-media): PHASE-SM-06: AI Content Engine"
```
