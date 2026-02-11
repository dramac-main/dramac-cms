'use client'

/**
 * AI Suggestions Component
 *
 * PHASE LC-06: Shows AI-suggested replies to agents during conversations.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { getAiSuggestions } from '../../actions/ai-actions'

interface AiSuggestionsProps {
  conversationId: string
  siteId: string
  lastVisitorMessage: string
  onSelectSuggestion: (text: string) => void
}

export function AiSuggestions({
  conversationId,
  siteId,
  lastVisitorMessage,
  onSelectSuggestion,
}: AiSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<
    Array<{ text: string; confidence: number }>
  >([])
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadSuggestions() {
    if (!lastVisitorMessage) return
    setLoading(true)
    setError(null)

    const result = await getAiSuggestions(
      conversationId,
      lastVisitorMessage,
      siteId
    )

    if (result.success) {
      setSuggestions(result.suggestions)
    } else {
      setError(result.error || 'Failed to get suggestions')
    }
    setLoading(false)
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Sparkles className="h-3 w-3" />
        AI Suggestions
        <ChevronUp className="h-3 w-3" />
      </button>
    )
  }

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Suggestions
          </CardTitle>
          <div className="flex items-center gap-1">
            {suggestions.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={loadSuggestions}
                disabled={loading || !lastVisitorMessage}
                className="h-6 text-xs px-2"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                {loading ? 'Thinking...' : 'Suggest'}
              </Button>
            )}
            <button
              onClick={() => setCollapsed(true)}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
            {suggestions.length > 0 && (
              <button
                onClick={() => setSuggestions([])}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      {(suggestions.length > 0 || error) && (
        <CardContent className="px-3 pb-2 pt-0 space-y-1.5">
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelectSuggestion(s.text)}
              className="w-full text-left p-2 rounded-md border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs leading-relaxed group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex-1">{s.text}</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] shrink-0 opacity-50 group-hover:opacity-100"
                >
                  {Math.round(s.confidence * 100)}%
                </Badge>
              </div>
            </button>
          ))}
        </CardContent>
      )}
    </Card>
  )
}
