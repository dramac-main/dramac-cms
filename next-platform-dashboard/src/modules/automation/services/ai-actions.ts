/**
 * AI Actions Service
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * AI-powered actions for automation workflows including text generation,
 * summarization, classification, entity extraction, and sentiment analysis.
 */

"use server"

import { createClient } from "@/lib/supabase/server"

// ============================================================================
// TYPES
// ============================================================================

export interface AIActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    model: string
    cost?: number
  }
}

export interface GenerateTextInput {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  model?: "gpt-4" | "gpt-3.5-turbo" | "gpt-4-turbo"
}

export interface SummarizeTextInput {
  text: string
  maxLength?: number
  style?: "bullet_points" | "paragraph" | "executive"
  language?: string
}

export interface ClassifyTextInput {
  text: string
  categories: string[]
  multiLabel?: boolean
  threshold?: number
}

export interface ExtractDataInput {
  text: string
  schema: Record<string, {
    type: "string" | "number" | "boolean" | "array" | "date"
    description?: string
    required?: boolean
  }>
}

export interface SentimentInput {
  text: string
  granularity?: "document" | "sentence"
}

export interface ContentModerationInput {
  text: string
  categories?: ("hate" | "violence" | "sexual" | "self-harm" | "spam")[]
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_MODEL = "gpt-3.5-turbo"
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// Cost per 1K tokens (approximate)
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4": { input: 0.03, output: 0.06 },
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 }
}

// ============================================================================
// HELPERS
// ============================================================================

async function getOpenAIKey(siteId: string): Promise<string | null> {
  const supabase = await createClient()
  
  // First check site-level connection - use 'any' type cast since automation_connections isn't in generated types yet
  const { data: connection } = await (supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { eq: (col: string, val: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: { credentials: { api_key?: string } } | null }> } } } } } })
    .from("automation_connections")
    .select("credentials")
    .eq("site_id", siteId)
    .eq("service", "openai")
    .eq("status", "connected")
    .single()
  
  if (connection?.credentials?.api_key) {
    return connection.credentials.api_key as string
  }
  
  // Fall back to environment variable
  return process.env.OPENAI_API_KEY || null
}

function calculateCost(
  model: string, 
  promptTokens: number, 
  completionTokens: number
): number {
  const costs = TOKEN_COSTS[model] || TOKEN_COSTS[DEFAULT_MODEL]
  return (
    (promptTokens / 1000) * costs.input +
    (completionTokens / 1000) * costs.output
  )
}

async function callOpenAI(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string
    maxTokens?: number
    temperature?: number
    responseFormat?: { type: "json_object" } | { type: "text" }
  } = {}
): Promise<{
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}> {
  const model = options.model || DEFAULT_MODEL
  
  let lastError: Error | null = null
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature ?? 0.7,
          response_format: options.responseFormat
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "OpenAI API error")
      }

      const data = await response.json()
      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        }
      }
    } catch (error) {
      lastError = error as Error
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error("Failed to call OpenAI API")
}

// ============================================================================
// AI ACTIONS
// ============================================================================

/**
 * Generate text based on a prompt
 */
export async function generateText(
  siteId: string,
  input: GenerateTextInput
): Promise<AIActionResult<{ text: string }>> {
  try {
    const apiKey = await getOpenAIKey(siteId)
    if (!apiKey) {
      return { 
        success: false, 
        error: "OpenAI API key not configured. Please connect OpenAI in Connections." 
      }
    }

    const messages: Array<{ role: "system" | "user"; content: string }> = []
    
    if (input.systemPrompt) {
      messages.push({ role: "system", content: input.systemPrompt })
    }
    
    messages.push({ role: "user", content: input.prompt })

    const model = input.model || DEFAULT_MODEL
    const result = await callOpenAI(apiKey, messages, {
      model,
      maxTokens: input.maxTokens || 1000,
      temperature: input.temperature ?? 0.7
    })

    return {
      success: true,
      data: { text: result.content },
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        model,
        cost: calculateCost(model, result.usage.promptTokens, result.usage.completionTokens)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate text"
    }
  }
}

/**
 * Summarize text content
 */
export async function summarizeText(
  siteId: string,
  input: SummarizeTextInput
): Promise<AIActionResult<{ summary: string }>> {
  try {
    const apiKey = await getOpenAIKey(siteId)
    if (!apiKey) {
      return { success: false, error: "OpenAI API key not configured" }
    }

    const styleInstructions = {
      bullet_points: "Format the summary as bullet points.",
      paragraph: "Format the summary as a concise paragraph.",
      executive: "Format as an executive summary with key takeaways."
    }

    const prompt = `Summarize the following text${input.maxLength ? ` in approximately ${input.maxLength} words` : ''}. ${styleInstructions[input.style || 'paragraph']}${input.language ? ` Respond in ${input.language}.` : ''}

Text to summarize:
"""
${input.text}
"""`

    const result = await callOpenAI(apiKey, [
      { role: "system", content: "You are a helpful assistant that creates clear, concise summaries." },
      { role: "user", content: prompt }
    ], {
      maxTokens: Math.min(input.maxLength ? input.maxLength * 2 : 500, 2000),
      temperature: 0.3
    })

    return {
      success: true,
      data: { summary: result.content },
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        model: DEFAULT_MODEL,
        cost: calculateCost(DEFAULT_MODEL, result.usage.promptTokens, result.usage.completionTokens)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to summarize text"
    }
  }
}

/**
 * Classify text into categories
 */
export async function classifyText(
  siteId: string,
  input: ClassifyTextInput
): Promise<AIActionResult<{ 
  classifications: Array<{ category: string; confidence: number }>
  primaryCategory: string
}>> {
  try {
    const apiKey = await getOpenAIKey(siteId)
    if (!apiKey) {
      return { success: false, error: "OpenAI API key not configured" }
    }

    const prompt = `Classify the following text into ${input.multiLabel ? 'one or more of' : 'exactly one of'} these categories: ${input.categories.join(', ')}.

Return a JSON object with:
- "classifications": array of objects with "category" and "confidence" (0-1)
- "primaryCategory": the most likely category

Text to classify:
"""
${input.text}
"""`

    const result = await callOpenAI(apiKey, [
      { 
        role: "system", 
        content: "You are a text classification system. Always respond with valid JSON." 
      },
      { role: "user", content: prompt }
    ], {
      maxTokens: 200,
      temperature: 0,
      responseFormat: { type: "json_object" }
    })

    let parsed: { classifications: Array<{ category: string; confidence: number }>; primaryCategory: string }
    try {
      parsed = JSON.parse(result.content)
    } catch {
      return { success: false, error: "Failed to parse classification result" }
    }

    // Apply threshold filter if specified
    if (input.threshold) {
      parsed.classifications = parsed.classifications.filter(c => c.confidence >= input.threshold!)
    }

    return {
      success: true,
      data: parsed,
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        model: DEFAULT_MODEL,
        cost: calculateCost(DEFAULT_MODEL, result.usage.promptTokens, result.usage.completionTokens)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to classify text"
    }
  }
}

/**
 * Extract structured data from text
 */
export async function extractData(
  siteId: string,
  input: ExtractDataInput
): Promise<AIActionResult<{ extracted: Record<string, unknown> }>> {
  try {
    const apiKey = await getOpenAIKey(siteId)
    if (!apiKey) {
      return { success: false, error: "OpenAI API key not configured" }
    }

    const schemaDescription = Object.entries(input.schema)
      .map(([key, config]) => 
        `- "${key}": ${config.type}${config.description ? ` (${config.description})` : ''}${config.required ? ' [REQUIRED]' : ''}`
      )
      .join('\n')

    const prompt = `Extract the following information from the text. Return a JSON object with these fields:
${schemaDescription}

If a field cannot be found, use null for optional fields or make a best guess for required fields.

Text:
"""
${input.text}
"""`

    const result = await callOpenAI(apiKey, [
      { 
        role: "system", 
        content: "You are a data extraction system. Always respond with valid JSON matching the requested schema." 
      },
      { role: "user", content: prompt }
    ], {
      maxTokens: 500,
      temperature: 0,
      responseFormat: { type: "json_object" }
    })

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(result.content)
    } catch {
      return { success: false, error: "Failed to parse extraction result" }
    }

    return {
      success: true,
      data: { extracted: parsed },
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        model: DEFAULT_MODEL,
        cost: calculateCost(DEFAULT_MODEL, result.usage.promptTokens, result.usage.completionTokens)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract data"
    }
  }
}

/**
 * Analyze sentiment of text
 */
export async function analyzeSentiment(
  siteId: string,
  input: SentimentInput
): Promise<AIActionResult<{
  sentiment: "positive" | "negative" | "neutral" | "mixed"
  score: number
  confidence: number
  emotions?: Array<{ emotion: string; intensity: number }>
  sentences?: Array<{ text: string; sentiment: string; score: number }>
}>> {
  try {
    const apiKey = await getOpenAIKey(siteId)
    if (!apiKey) {
      return { success: false, error: "OpenAI API key not configured" }
    }

    const granularityInstruction = input.granularity === "sentence"
      ? `Also analyze each sentence separately and include in "sentences" array.`
      : ""

    const prompt = `Analyze the sentiment of the following text.

Return a JSON object with:
- "sentiment": overall sentiment ("positive", "negative", "neutral", or "mixed")
- "score": sentiment score from -1 (very negative) to 1 (very positive)
- "confidence": confidence level from 0 to 1
- "emotions": array of detected emotions with intensity (0-1)
${granularityInstruction}

Text:
"""
${input.text}
"""`

    const result = await callOpenAI(apiKey, [
      { 
        role: "system", 
        content: "You are a sentiment analysis system. Always respond with valid JSON." 
      },
      { role: "user", content: prompt }
    ], {
      maxTokens: input.granularity === "sentence" ? 1000 : 300,
      temperature: 0,
      responseFormat: { type: "json_object" }
    })

    let parsed: {
      sentiment: "positive" | "negative" | "neutral" | "mixed"
      score: number
      confidence: number
      emotions?: Array<{ emotion: string; intensity: number }>
      sentences?: Array<{ text: string; sentiment: string; score: number }>
    }
    try {
      parsed = JSON.parse(result.content)
    } catch {
      return { success: false, error: "Failed to parse sentiment result" }
    }

    return {
      success: true,
      data: parsed,
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        model: DEFAULT_MODEL,
        cost: calculateCost(DEFAULT_MODEL, result.usage.promptTokens, result.usage.completionTokens)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze sentiment"
    }
  }
}

/**
 * Moderate content for policy violations
 */
export async function moderateContent(
  siteId: string,
  input: ContentModerationInput
): Promise<AIActionResult<{
  flagged: boolean
  categories: Record<string, { flagged: boolean; score: number }>
  recommendation: "allow" | "review" | "block"
}>> {
  try {
    const apiKey = await getOpenAIKey(siteId)
    if (!apiKey) {
      return { success: false, error: "OpenAI API key not configured" }
    }

    // Use OpenAI's moderation endpoint
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ input: input.text })
    })

    if (!response.ok) {
      throw new Error("Moderation API error")
    }

    const data = await response.json()
    const result = data.results[0]

    const categories: Record<string, { flagged: boolean; score: number }> = {}
    const checkCategories = input.categories || ["hate", "violence", "sexual", "self-harm"]
    
    for (const cat of checkCategories) {
      const key = cat === "self-harm" ? "self-harm" : cat
      categories[cat] = {
        flagged: result.categories[key] || false,
        score: result.category_scores[key] || 0
      }
    }

    // Determine recommendation based on scores
    const maxScore = Math.max(...Object.values(categories).map(c => c.score))
    let recommendation: "allow" | "review" | "block" = "allow"
    if (result.flagged) {
      recommendation = "block"
    } else if (maxScore > 0.5) {
      recommendation = "review"
    }

    return {
      success: true,
      data: {
        flagged: result.flagged,
        categories,
        recommendation
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to moderate content"
    }
  }
}

/**
 * Translate text to another language
 */
export async function translateText(
  siteId: string,
  input: { text: string; targetLanguage: string; sourceLanguage?: string }
): Promise<AIActionResult<{ translatedText: string; detectedLanguage?: string }>> {
  try {
    const apiKey = await getOpenAIKey(siteId)
    if (!apiKey) {
      return { success: false, error: "OpenAI API key not configured" }
    }

    const prompt = input.sourceLanguage
      ? `Translate the following text from ${input.sourceLanguage} to ${input.targetLanguage}:`
      : `Translate the following text to ${input.targetLanguage}. Also detect and return the source language.`

    const result = await callOpenAI(apiKey, [
      { 
        role: "system", 
        content: `You are a professional translator. ${!input.sourceLanguage ? 'Return JSON with "translatedText" and "detectedLanguage".' : 'Return only the translated text.'}` 
      },
      { role: "user", content: `${prompt}\n\n"""${input.text}"""` }
    ], {
      maxTokens: Math.ceil(input.text.length * 2),
      temperature: 0.3,
      responseFormat: !input.sourceLanguage ? { type: "json_object" } : undefined
    })

    if (input.sourceLanguage) {
      return {
        success: true,
        data: { translatedText: result.content },
        usage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          model: DEFAULT_MODEL,
          cost: calculateCost(DEFAULT_MODEL, result.usage.promptTokens, result.usage.completionTokens)
        }
      }
    }

    const parsed = JSON.parse(result.content)
    return {
      success: true,
      data: {
        translatedText: parsed.translatedText,
        detectedLanguage: parsed.detectedLanguage
      },
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        model: DEFAULT_MODEL,
        cost: calculateCost(DEFAULT_MODEL, result.usage.promptTokens, result.usage.completionTokens)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to translate text"
    }
  }
}

/**
 * Generate an AI suggestion for workflow improvement
 */
export async function suggestWorkflowImprovements(
  siteId: string,
  workflow: {
    name: string
    trigger: { type: string; config: Record<string, unknown> }
    steps: Array<{ name: string; step_type: string; action_type?: string }>
  }
): Promise<AIActionResult<{
  suggestions: Array<{
    type: "optimization" | "reliability" | "feature"
    title: string
    description: string
    implementation?: string
  }>
}>> {
  try {
    const apiKey = await getOpenAIKey(siteId)
    if (!apiKey) {
      return { success: false, error: "OpenAI API key not configured" }
    }

    const workflowDescription = `
Workflow: ${workflow.name}
Trigger: ${workflow.trigger.type}
Steps: ${workflow.steps.map((s, i) => `${i + 1}. ${s.name} (${s.step_type}${s.action_type ? `: ${s.action_type}` : ''})`).join('\n')}
`

    const prompt = `Analyze this automation workflow and suggest improvements:

${workflowDescription}

Provide suggestions in these categories:
1. Optimization - Make it faster or more efficient
2. Reliability - Add error handling or fallbacks  
3. Feature - Add useful capabilities

Return JSON with "suggestions" array containing objects with: type, title, description, implementation (optional code/config)`

    const result = await callOpenAI(apiKey, [
      { 
        role: "system", 
        content: "You are an automation expert helping optimize workflows. Always respond with valid JSON." 
      },
      { role: "user", content: prompt }
    ], {
      model: "gpt-4-turbo",
      maxTokens: 1000,
      temperature: 0.7,
      responseFormat: { type: "json_object" }
    })

    const parsed = JSON.parse(result.content)
    return {
      success: true,
      data: parsed,
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        model: "gpt-4-turbo",
        cost: calculateCost("gpt-4-turbo", result.usage.promptTokens, result.usage.completionTokens)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate suggestions"
    }
  }
}
