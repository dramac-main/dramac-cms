'use server'

/**
 * Social Media Module - AI Actions
 * 
 * PHASE SM-06: Server actions for AI content generation features.
 * Thin wrappers around the AI content service with error handling.
 */

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
 * Generate captions — wraps AI service with error handling
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
export async function aiGenerateContentIdeas(
  params: Parameters<typeof generateContentIdeas>[0] & { save?: boolean }
) {
  try {
    const result = await generateContentIdeas(params)

    if (params.save && result.ideas.length > 0) {
      const supabase = await createClient()
      // Save ideas to DB if the table exists
      for (const idea of result.ideas) {
        await (supabase as any)
          .from('social_ai_content_ideas')
          .upsert({
            id: idea.id,
            site_id: idea.siteId,
            tenant_id: idea.tenantId || params.siteId,
            title: idea.title,
            content: idea.content,
            platforms: idea.platforms,
            content_pillar: idea.contentPillar,
            status: 'new',
            suggested_date: idea.suggestedDate,
            created_at: idea.createdAt,
          }, { onConflict: 'id' })
          .catch(() => { /* Table may not exist yet */ })
      }
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
