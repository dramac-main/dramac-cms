/**
 * Simple Sentiment Analysis
 *
 * PHASE SM-04: Basic keyword-based sentiment detection
 * for incoming inbox items. Can be enhanced with AI later (SM-06).
 */

export type SentimentResult = {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number // -1.0 to 1.0
}

// Positive keywords for sentiment detection
const POSITIVE_KEYWORDS = [
  'love', 'great', 'amazing', 'awesome', 'excellent', 'thank', 'thanks',
  'perfect', 'wonderful', 'happy', 'beautiful', 'best', 'good', 'fantastic',
  'incredible', 'brilliant', 'outstanding', 'superb', 'delightful', 'impressive',
  'appreciate', 'grateful', 'congrats', 'congratulations', 'bravo', 'well done',
  'nice', 'cool', 'wow', 'fire', 'lit', 'goat', 'legendary', 'gem',
  'blessed', 'inspiring', 'recommend', 'helpful', 'useful', 'valuable',
]

// Negative keywords for sentiment detection
const NEGATIVE_KEYWORDS = [
  'hate', 'terrible', 'awful', 'worst', 'horrible', 'bad', 'disappointed',
  'angry', 'disgusting', 'scam', 'fraud', 'broken', 'useless', 'garbage',
  'waste', 'poor', 'pathetic', 'annoying', 'frustrating', 'ridiculous',
  'unacceptable', 'trash', 'sucks', 'stupid', 'lame', 'boring', 'ugly',
  'fail', 'failed', 'rude', 'incompetent', 'misleading', 'overpriced',
  'refund', 'complaint', 'lawsuit', 'never again', 'do not buy',
]

// Urgency keywords for priority detection
const URGENCY_KEYWORDS = [
  'urgent', 'help', 'asap', 'emergency', 'immediately', 'problem', 'issue',
  'broken', 'not working', 'down', 'outage', 'critical', 'bug', 'error',
  'crash', 'stuck', 'blocked', 'deadline', 'please fix', 'need help',
  'support', 'respond', 'waiting', 'how long', 'still waiting',
]

/**
 * Analyze sentiment of text content
 * Uses keyword matching for basic sentiment detection.
 * Returns a score from -1.0 (very negative) to 1.0 (very positive)
 */
export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return { sentiment: 'neutral', score: 0 }
  }

  const lowerText = text.toLowerCase()

  let positiveCount = 0
  let negativeCount = 0

  for (const keyword of POSITIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      positiveCount++
    }
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      negativeCount++
    }
  }

  // Score = (positive - negative) / (positive + negative + 1)
  const score = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1)

  let sentiment: 'positive' | 'neutral' | 'negative'
  if (score > 0.2) {
    sentiment = 'positive'
  } else if (score < -0.2) {
    sentiment = 'negative'
  } else {
    sentiment = 'neutral'
  }

  return { sentiment, score: Math.max(-1, Math.min(1, score)) }
}

/**
 * Check if text contains urgency keywords
 */
export function hasUrgencyKeywords(text: string): boolean {
  if (!text) return false
  const lowerText = text.toLowerCase()
  return URGENCY_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

/**
 * Determine inbox item priority based on content and author
 */
export function determinePriority(params: {
  content: string
  sentiment: SentimentResult
  authorFollowers: number | null
  itemType: string
}): 'low' | 'normal' | 'high' | 'urgent' {
  const { content, sentiment, authorFollowers, itemType } = params
  const isUrgent = hasUrgencyKeywords(content)

  // urgent: negative sentiment + urgency keywords
  if (sentiment.sentiment === 'negative' && isUrgent) {
    return 'urgent'
  }

  // high: DM from high-follower author (>10k), or very negative sentiment
  if (itemType === 'dm' && authorFollowers && authorFollowers > 10000) {
    return 'high'
  }
  if (sentiment.score < -0.5) {
    return 'high'
  }
  if (authorFollowers && authorFollowers > 50000) {
    return 'high'
  }

  // low: reactions, story views
  if (itemType === 'reaction') {
    return 'low'
  }

  // normal: regular comments and mentions
  return 'normal'
}
