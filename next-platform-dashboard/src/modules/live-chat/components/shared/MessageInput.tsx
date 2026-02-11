'use client'

/**
 * MessageInput — Composable message input with canned responses, file upload,
 * internal note toggle, and send functionality
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Send,
  Paperclip,
  StickyNote,
  Zap,
  Loader2,
} from 'lucide-react'
import type { CannedResponse } from '@/modules/live-chat/types'

interface MessageInputProps {
  onSend: (content: string, isNote: boolean) => Promise<void>
  onFileUpload?: (file: File) => Promise<void>
  cannedResponses?: CannedResponse[]
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function MessageInput({
  onSend,
  onFileUpload,
  cannedResponses = [],
  disabled = false,
  placeholder = 'Type a message...',
  className,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isNote, setIsNote] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showCanned, setShowCanned] = useState(false)
  const [cannedSearch, setCannedSearch] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    }
  }, [content])

  // Detect "/" trigger for canned responses
  useEffect(() => {
    if (content.startsWith('/') && content.length >= 1) {
      setShowCanned(true)
      setCannedSearch(content.slice(1).toLowerCase())
    } else {
      setShowCanned(false)
      setCannedSearch('')
    }
  }, [content])

  const filteredCanned = cannedResponses.filter(
    (cr) =>
      cr.shortcut?.toLowerCase().includes(cannedSearch) ||
      cr.title.toLowerCase().includes(cannedSearch) ||
      cr.content.toLowerCase().includes(cannedSearch)
  )

  const handleSend = useCallback(async () => {
    const trimmed = content.trim()
    if (!trimmed || isSending) return
    setIsSending(true)
    try {
      await onSend(trimmed, isNote)
      setContent('')
      setIsNote(false)
      textareaRef.current?.focus()
    } finally {
      setIsSending(false)
    }
  }, [content, isNote, isSending, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && onFileUpload) {
        await onFileUpload(file)
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [onFileUpload]
  )

  const selectCannedResponse = useCallback((cr: CannedResponse) => {
    setContent(cr.content)
    setShowCanned(false)
    textareaRef.current?.focus()
  }, [])

  return (
    <div
      className={cn(
        'border-t bg-background p-3',
        isNote && 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
        className
      )}
    >
      {/* Canned response suggestions */}
      {showCanned && filteredCanned.length > 0 && (
        <div className="mb-2 rounded-lg border bg-popover shadow-md max-h-48 overflow-y-auto">
          {filteredCanned.map((cr) => (
            <button
              key={cr.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-b-0"
              onClick={() => selectCannedResponse(cr)}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{cr.title}</span>
                {cr.shortcut && (
                  <span className="text-xs text-muted-foreground font-mono">
                    /{cr.shortcut}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate pl-5">
                {cr.content}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Note mode indicator */}
      {isNote && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-amber-700 dark:text-amber-400">
          <StickyNote className="h-3.5 w-3.5" />
          <span>Writing an internal note (not visible to visitor)</span>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File upload */}
        {onFileUpload && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleFileClick}
              disabled={disabled}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />
          </>
        )}

        {/* Canned response trigger */}
        {cannedResponses.length > 0 && (
          <Popover open={showCanned} onOpenChange={setShowCanned}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={disabled}
              >
                <Zap className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              className="w-80 p-0"
            >
              <ScrollArea className="max-h-60">
                <div className="p-2 space-y-0.5">
                  {cannedResponses.map((cr) => (
                    <button
                      key={cr.id}
                      type="button"
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-muted transition-colors"
                      onClick={() => selectCannedResponse(cr)}
                    >
                      <span className="text-sm font-medium">{cr.title}</span>
                      <p className="text-xs text-muted-foreground truncate">
                        {cr.content}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}

        {/* Internal note toggle */}
        <Button
          type="button"
          variant={isNote ? 'secondary' : 'ghost'}
          size="icon"
          className={cn(
            'h-9 w-9 shrink-0',
            isNote && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          )}
          onClick={() => setIsNote(!isNote)}
          disabled={disabled}
          title={isNote ? 'Switch to reply' : 'Write internal note'}
        >
          <StickyNote className="h-4 w-4" />
        </Button>

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isNote ? 'Write an internal note...' : placeholder
          }
          disabled={disabled}
          className={cn(
            'min-h-[40px] max-h-[160px] resize-none flex-1',
            isNote && 'border-amber-300 dark:border-amber-700'
          )}
          rows={1}
        />

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleSend}
          disabled={disabled || !content.trim() || isSending}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
