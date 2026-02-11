'use client'

/**
 * Conversation Summary Component
 *
 * PHASE LC-06: AI-powered conversation summary with sentiment & topics.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Loader2,
  RefreshCw,
  SmilePlus,
  Meh,
  Frown,
} from 'lucide-react'
import { getConversationSummary } from '../../actions/ai-actions'

interface ConversationSummaryProps {
  conversationId: string
}

export function ConversationSummary({
  conversationId,
}: ConversationSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [sentiment, setSentiment] = useState<
    'positive' | 'neutral' | 'negative' | null
  >(null)
  const [topics, setTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadSummary() {
    setLoading(true)
    setError(null)

    const result = await getConversationSummary(conversationId)

    if (result.success) {
      setSummary(result.summary)
      setSentiment(result.sentiment)
      setTopics(result.topics)
    } else {
      setError(result.error || 'Failed to generate summary')
    }
    setLoading(false)
  }

  const SentimentIcon =
    sentiment === 'positive'
      ? SmilePlus
      : sentiment === 'negative'
        ? Frown
        : Meh

  const sentimentColor =
    sentiment === 'positive'
      ? 'text-green-600'
      : sentiment === 'negative'
        ? 'text-red-500'
        : 'text-yellow-500'

  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            AI Summary
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadSummary}
            disabled={loading}
            className="h-6 text-xs px-2"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : summary ? (
              <RefreshCw className="h-3 w-3" />
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      </CardHeader>

      {(summary || error) && (
        <CardContent className="px-3 pb-3 pt-0 space-y-2">
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {summary && (
            <>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {summary}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                {sentiment && (
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1"
                  >
                    <SentimentIcon
                      className={`h-3 w-3 ${sentimentColor}`}
                    />
                    {sentiment}
                  </Badge>
                )}
                {topics.map((topic) => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="text-[10px]"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
