'use server'

/**
 * AI Content Service
 * 
 * PHASE SM-06: AI-powered content generation for social media
 * Uses Anthropic Claude via the AI SDK (same provider as rest of platform)
 */

import { generateText, generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'
import type { SocialPlatform, AICaption, AIContentIdea } from '../types'
import { PLATFORM_CONFIGS } from '../types'

const model = anthropic('claude-sonnet-4-20250514')

// ============================================================================
// CAPTION GENERATION
// ============================================================================

export async function generateCaptions(params: {
  topic: string
  platform: SocialPlatform
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational' | 'promotional'
  emojiLevel: 'none' | 'low' | 'medium' | 'high'
  includeHashtags: boolean
  includeCallToAction: boolean
  brandVoice?: string
  count?: number
}): Promise<{ captions: AICaption[]; error?: string }> {
  const config = PLATFORM_CONFIGS[params.platform]
  const count = params.count || 3

  const emojiGuide = {
    none: 'Do NOT use any emojis.',
    low: 'Use 1-2 emojis sparingly.',
    medium: 'Use 3-5 emojis naturally throughout.',
    high: 'Use emojis liberally throughout the caption.',
  }

  const prompt = `Generate ${count} different social media captions for ${config.name}.

Topic: ${params.topic}
Tone: ${params.tone}
Character limit: ${config.characterLimit} characters
Emoji instructions: ${emojiGuide[params.emojiLevel]}
${params.includeHashtags ? 'Include 5-15 relevant hashtags.' : 'Do NOT include hashtags.'}
${params.includeCallToAction ? 'Include a clear call to action.' : ''}
${params.brandVoice ? `Brand voice: ${params.brandVoice}` : ''}

Platform best practices for ${config.name}:
${params.platform === 'instagram' ? '- Hashtags work best in a first comment or at the end of the caption\n- Use line breaks for readability' : ''}
${params.platform === 'twitter' ? '- Keep it concise (280 chars max)\n- Use 1-3 hashtags max\n- Leave room for retweets' : ''}
${params.platform === 'linkedin' ? '- Professional tone\n- Use 3-5 hashtags at the end\n- Hook in first line' : ''}
${params.platform === 'tiktok' ? '- Trendy and engaging\n- Use trending hashtags\n- Keep it conversational' : ''}

Each caption must be unique and varied in approach.`

  try {
    const result = await generateObject({
      model,
      prompt,
      schema: z.object({
        captions: z.array(z.object({
          content: z.string(),
          hashtags: z.array(z.string()),
          emojiLevel: z.enum(['none', 'low', 'medium', 'high']),
          tone: z.string(),
        })),
      }),
    })

    return { captions: result.object.captions }
  } catch (error) {
    console.error('Caption generation failed:', error)
    return {
      captions: [],
      error: error instanceof Error ? error.message : 'Caption generation failed',
    }
  }
}

// ============================================================================
// HASHTAG GENERATION
// ============================================================================

export async function generateHashtags(params: {
  content: string
  platform: SocialPlatform
  count?: number
  includeNiche?: boolean
  includeTrending?: boolean
}): Promise<{
  hashtags: Array<{ tag: string; category: 'popular' | 'niche' | 'trending' | 'branded' }>
  error?: string
}> {
  const count = params.count || 15
  const config = PLATFORM_CONFIGS[params.platform]

  const prompt = `Analyze this social media content and generate ${count} relevant hashtags for ${config.name}:

Content: "${params.content}"

Generate hashtags in these categories:
- popular: High-volume, widely used hashtags related to the content
- niche: Specific, lower-volume hashtags with high relevance
${params.includeTrending ? '- trending: Currently trending hashtags that relate to the content' : ''}

Platform-specific guidelines for ${config.name}:
${params.platform === 'instagram' ? 'Generate 20-30 hashtags mixing popular and niche.' : ''}
${params.platform === 'twitter' ? 'Generate 2-3 focused hashtags only.' : ''}
${params.platform === 'linkedin' ? 'Generate 3-5 professional hashtags.' : ''}
${params.platform === 'tiktok' ? 'Generate 5-10 hashtags including trend-related ones.' : ''}

Do NOT include the # symbol in the tag — just the word(s).`

  try {
    const result = await generateObject({
      model,
      prompt,
      schema: z.object({
        hashtags: z.array(z.object({
          tag: z.string(),
          category: z.enum(['popular', 'niche', 'trending', 'branded']),
        })),
      }),
    })

    return { hashtags: result.object.hashtags }
  } catch (error) {
    console.error('Hashtag generation failed:', error)
    return {
      hashtags: [],
      error: error instanceof Error ? error.message : 'Hashtag generation failed',
    }
  }
}

// ============================================================================
// CONTENT IDEAS
// ============================================================================

export async function generateContentIdeas(params: {
  siteId: string
  industry?: string
  contentPillars?: string[]
  platforms: SocialPlatform[]
  count?: number
  timeframe?: 'week' | 'month'
}): Promise<{ ideas: AIContentIdea[]; error?: string }> {
  const count = params.count || 10
  const timeframe = params.timeframe || 'week'
  const platformNames = params.platforms.map(p => PLATFORM_CONFIGS[p].name).join(', ')

  const prompt = `Generate ${count} social media content ideas for the next ${timeframe}.

${params.industry ? `Industry: ${params.industry}` : ''}
${params.contentPillars?.length ? `Content pillars: ${params.contentPillars.join(', ')}` : ''}
Target platforms: ${platformNames}
Locale: en-ZM (Zambia)

For each idea provide:
- A compelling title
- A draft content text (ready to post or adapt)
- Which platforms it's best suited for
- Which content pillar it falls under (if content pillars were provided)
- A suggested posting date within the next ${timeframe}

Consider:
- Upcoming international holidays and awareness days
- Zambian holidays and cultural events
- Trending topics in the ${params.industry || 'general'} space
- Mix of content types (educational, entertaining, promotional, engaging)
- Platform-specific content formats (Reels for IG, Threads for Threads, etc.)

Today's date is ${new Date().toISOString().split('T')[0]}.`

  try {
    const result = await generateObject({
      model,
      prompt,
      schema: z.object({
        ideas: z.array(z.object({
          title: z.string(),
          content: z.string(),
          platforms: z.array(z.string()),
          contentPillar: z.string().nullable(),
          suggestedDate: z.string().nullable(),
        })),
      }),
    })

    const ideas: AIContentIdea[] = result.object.ideas.map((idea, idx) => ({
      id: `idea-${Date.now()}-${idx}`,
      siteId: params.siteId,
      tenantId: '',
      title: idea.title,
      content: idea.content,
      platforms: idea.platforms as SocialPlatform[],
      prompt: null,
      contentPillar: idea.contentPillar || null,
      campaignId: null,
      status: 'new' as const,
      suggestedDate: idea.suggestedDate || null,
      createdAt: new Date().toISOString(),
    }))

    return { ideas }
  } catch (error) {
    console.error('Content idea generation failed:', error)
    return {
      ideas: [],
      error: error instanceof Error ? error.message : 'Idea generation failed',
    }
  }
}

// ============================================================================
// CONTENT IMPROVEMENT
// ============================================================================

export async function improveContent(params: {
  content: string
  platform: SocialPlatform
  instruction: string
}): Promise<{ improved: string; error?: string }> {
  const config = PLATFORM_CONFIGS[params.platform]

  const prompt = `Improve this social media post for ${config.name}.

Original content:
"${params.content}"

Instruction: ${params.instruction}
Character limit: ${config.characterLimit}

Return ONLY the improved content, nothing else. Keep it within the character limit.`

  try {
    const result = await generateText({
      model,
      prompt,
    })

    return { improved: result.text.trim() }
  } catch (error) {
    console.error('Content improvement failed:', error)
    return {
      improved: '',
      error: error instanceof Error ? error.message : 'Content improvement failed',
    }
  }
}

// ============================================================================
// TRANSLATE CONTENT
// ============================================================================

export async function translateContent(params: {
  content: string
  targetLanguage: string
  preserveTone: boolean
}): Promise<{ translated: string; error?: string }> {
  const prompt = `Translate this social media post to ${params.targetLanguage}.
${params.preserveTone ? 'Preserve the original tone and style.' : 'Use a natural tone for the target language.'}

Original content:
"${params.content}"

Return ONLY the translated content, nothing else.`

  try {
    const result = await generateText({
      model,
      prompt,
    })

    return { translated: result.text.trim() }
  } catch (error) {
    console.error('Translation failed:', error)
    return {
      translated: '',
      error: error instanceof Error ? error.message : 'Translation failed',
    }
  }
}

// ============================================================================
// ALT TEXT GENERATION
// ============================================================================

export async function generateAltText(params: {
  imageUrl: string
  context?: string
}): Promise<{ altText: string; error?: string }> {
  const prompt = `Generate descriptive alt text for this image following WCAG guidelines.
${params.context ? `Context: This image is used in a social media post about: ${params.context}` : ''}

Guidelines:
- Describe the image content objectively
- Include text visible in the image
- Keep under 125 characters
- Don't start with "Image of" or "Photo of"
- Be specific and descriptive`

  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: new URL(params.imageUrl) },
          ],
        },
      ],
    })

    return { altText: result.text.trim() }
  } catch (error) {
    console.error('Alt text generation failed:', error)
    return {
      altText: '',
      error: error instanceof Error ? error.message : 'Alt text generation failed',
    }
  }
}

// ============================================================================
// THREAD GENERATION
// ============================================================================

export async function generateThread(params: {
  content: string
  maxTweets?: number
}): Promise<{ thread: string[]; error?: string }> {
  const maxTweets = params.maxTweets || 10

  const prompt = `Break this content into a Twitter/X thread of maximum ${maxTweets} tweets.

Content:
"${params.content}"

Rules:
- Each tweet must be 280 characters or less
- Each tweet should make sense on its own
- Add thread numbering (1/N format) at the start
- First tweet should hook the reader
- Last tweet should have a call to action
- Use line breaks within tweets for readability

Return each tweet as a separate item.`

  try {
    const result = await generateObject({
      model,
      prompt,
      schema: z.object({
        thread: z.array(z.string()),
      }),
    })

    return { thread: result.object.thread }
  } catch (error) {
    console.error('Thread generation failed:', error)
    return {
      thread: [],
      error: error instanceof Error ? error.message : 'Thread generation failed',
    }
  }
}

// ============================================================================
// POSTING TIME SUGGESTION
// ============================================================================

export async function suggestPostingTime(params: {
  siteId: string
  platform: SocialPlatform
  contentType: 'image' | 'video' | 'text' | 'carousel'
  accountId?: string
}): Promise<{ suggestedTime: string; reason: string; error?: string }> {
  const config = PLATFORM_CONFIGS[params.platform]

  // Check if we have optimal_times data
  if (params.accountId) {
    const supabase = await createClient()
    const { data: optimalTimes } = await (supabase as any)
      .from('social_optimal_times')
      .select('*')
      .eq('account_id', params.accountId)
      .order('combined_score', { ascending: false })
      .limit(3)

    if (optimalTimes && optimalTimes.length > 0) {
      const best = optimalTimes[0]
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const now = new Date()
      // Find next occurrence of the best day
      const targetDay = best.day_of_week
      const daysUntilTarget = (targetDay - now.getDay() + 7) % 7 || 7
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + daysUntilTarget)
      targetDate.setHours(best.hour, 0, 0, 0)

      return {
        suggestedTime: targetDate.toISOString(),
        reason: `Based on your audience data: ${dayNames[targetDay]} at ${best.hour}:00 has the highest engagement score (${Math.round(best.combined_score * 100)}% confidence based on ${best.sample_size} posts)`,
      }
    }
  }

  // Fall back to AI suggestion
  const prompt = `Suggest the best time to post a ${params.contentType} on ${config.name}.

Timezone: Africa/Lusaka (UTC+2)
Today: ${new Date().toISOString().split('T')[0]}

Consider:
- ${config.name} engagement patterns
- ${params.contentType} content type performance
- Zambian audience online times
- Avoid early morning (before 7am) and late night (after 10pm)

Return a specific date and time within the next 7 days.`

  try {
    const result = await generateObject({
      model,
      prompt,
      schema: z.object({
        suggestedTime: z.string().describe('ISO 8601 datetime string'),
        reason: z.string().describe('Human-readable explanation of why this time is optimal'),
      }),
    })

    return {
      suggestedTime: result.object.suggestedTime,
      reason: result.object.reason,
    }
  } catch (error) {
    console.error('Time suggestion failed:', error)
    return {
      suggestedTime: '',
      reason: '',
      error: error instanceof Error ? error.message : 'Time suggestion failed',
    }
  }
}
