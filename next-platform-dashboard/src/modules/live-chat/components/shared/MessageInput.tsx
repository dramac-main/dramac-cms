'use client'

/**
 * MessageInput — Composable message input with canned responses, file upload,
 * internal note toggle, and send functionality.
 *
 * Canned responses: type "/" or click ⚡ to open a searchable popup.
 * Continue typing after "/" to filter by shortcut, title, or content.
 * Arrow keys to navigate, Enter to select, Escape to close.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  Send,
  Paperclip,
  StickyNote,
  Zap,
  Loader2,
  AtSign,
  Search,
} from 'lucide-react'
import type { CannedResponse } from '@/modules/live-chat/types'
import { incrementCannedResponseUsage } from '@/modules/live-chat/actions/canned-response-actions'

interface AgentOption {
  id: string
  name: string
  avatar?: string
}

interface MessageInputProps {
  onSend: (content: string, isNote: boolean, mentionedAgentIds?: string[]) => Promise<void>
  onFileUpload?: (file: File) => Promise<void>
  cannedResponses?: CannedResponse[]
  agents?: AgentOption[]
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function MessageInput({
  onSend,
  onFileUpload,
  cannedResponses = [],
  agents = [],
  disabled = false,
  placeholder = 'Type a message...',
  className,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isNote, setIsNote] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Canned responses state
  const [cannedOpen, setCannedOpen] = useState(false)
  const [cannedSearch, setCannedSearch] = useState('')
  const [cannedIndex, setCannedIndex] = useState(0)
  const [cannedTrigger, setCannedTrigger] = useState<'slash' | 'button' | null>(null)

  // Mentions state
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionedAgents, setMentionedAgents] = useState<Set<string>>(new Set())

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cannedPanelRef = useRef<HTMLDivElement>(null)
  const cannedItemRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

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
      setCannedOpen(true)
      setCannedTrigger('slash')
      setCannedSearch(content.slice(1).toLowerCase())
    } else if (cannedTrigger === 'slash') {
      // Close only if opened by slash and user erased the "/"
      setCannedOpen(false)
      setCannedTrigger(null)
      setCannedSearch('')
    }
  }, [content, cannedTrigger])

  // Detect "@" trigger for agent mentions (only in note mode)
  useEffect(() => {
    if (!isNote || agents.length === 0) {
      setShowMentions(false)
      return
    }
    const textarea = textareaRef.current
    if (!textarea) return
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/(^|\s)@(\w*)$/)
    if (mentionMatch) {
      setShowMentions(true)
      setMentionSearch(mentionMatch[2].toLowerCase())
    } else {
      setShowMentions(false)
      setMentionSearch('')
    }
  }, [content, isNote, agents.length])

  // Close canned panel on outside click
  useEffect(() => {
    if (!cannedOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (
        cannedPanelRef.current &&
        !cannedPanelRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setCannedOpen(false)
        setCannedTrigger(null)
        setCannedSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [cannedOpen])

  const filteredAgents = useMemo(() => {
    if (!mentionSearch) return agents
    return agents.filter((a) => a.name.toLowerCase().includes(mentionSearch))
  }, [agents, mentionSearch])

  const filteredCanned = useMemo(() => {
    if (!cannedSearch) return cannedResponses
    return cannedResponses.filter(
      (cr) =>
        cr.shortcut?.toLowerCase().includes(cannedSearch) ||
        cr.title.toLowerCase().includes(cannedSearch) ||
        cr.content.toLowerCase().includes(cannedSearch)
    )
  }, [cannedResponses, cannedSearch])

  // Group filtered canned responses by category
  const groupedCanned = useMemo(() => {
    const groups: Record<string, CannedResponse[]> = {}
    for (const cr of filteredCanned) {
      const cat = cr.category || 'General'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(cr)
    }
    return groups
  }, [filteredCanned])

  // Reset active index when filter results change
  useEffect(() => {
    setCannedIndex(0)
  }, [filteredCanned.length])

  // Scroll active item into view
  useEffect(() => {
    if (!cannedOpen) return
    const el = cannedItemRefs.current.get(cannedIndex)
    el?.scrollIntoView({ block: 'nearest' })
  }, [cannedIndex, cannedOpen])

  const handleSend = useCallback(async () => {
    const trimmed = content.trim()
    if (!trimmed || isSending) return
    setIsSending(true)
    try {
      const mentionIds = isNote ? Array.from(mentionedAgents) : undefined
      await onSend(trimmed, isNote, mentionIds)
      setContent('')
      setIsNote(false)
      setMentionedAgents(new Set())
      textareaRef.current?.focus()
    } finally {
      setIsSending(false)
    }
  }, [content, isNote, isSending, onSend, mentionedAgents])

  const selectCannedResponse = useCallback((cr: CannedResponse) => {
    setContent(cr.content)
    setCannedOpen(false)
    setCannedTrigger(null)
    setCannedSearch('')
    setCannedIndex(0)
    textareaRef.current?.focus()
    incrementCannedResponseUsage(cr.id).catch(() => {})
  }, [])

  const openCannedPanel = useCallback(() => {
    if (cannedOpen) {
      setCannedOpen(false)
      setCannedTrigger(null)
      setCannedSearch('')
    } else {
      setCannedOpen(true)
      setCannedTrigger('button')
      setCannedSearch('')
      setCannedIndex(0)
    }
  }, [cannedOpen])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // When canned panel is open, capture navigation keys
      if (cannedOpen && filteredCanned.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setCannedIndex((i) => (i + 1) % filteredCanned.length)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setCannedIndex((i) => (i - 1 + filteredCanned.length) % filteredCanned.length)
          return
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          selectCannedResponse(filteredCanned[cannedIndex])
          return
        }
        if (e.key === 'Tab') {
          e.preventDefault()
          selectCannedResponse(filteredCanned[cannedIndex])
          return
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          setCannedOpen(false)
          setCannedTrigger(null)
          if (cannedTrigger === 'slash') setContent('')
          setCannedSearch('')
          return
        }
      }

      // Enter to send (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
        return
      }
      // Ctrl+Enter or Cmd+Enter also sends
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSend()
        return
      }
      // Escape fallback
      if (e.key === 'Escape') {
        if (showMentions) {
          setShowMentions(false)
        } else if (isNote) {
          setIsNote(false)
        } else if (content) {
          setContent('')
        }
        return
      }
      // Ctrl+/ to toggle internal note mode
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setIsNote(!isNote)
        return
      }
    },
    [handleSend, cannedOpen, filteredCanned, cannedIndex, cannedTrigger, selectCannedResponse, showMentions, isNote, content]
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
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [onFileUpload]
  )

  const selectMention = useCallback((agent: AgentOption) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.slice(0, cursorPos)
    const textAfterCursor = content.slice(cursorPos)
    const newBefore = textBeforeCursor.replace(/(^|\s)@\w*$/, `$1@${agent.name} `)
    setContent(newBefore + textAfterCursor)
    setMentionedAgents((prev) => new Set(prev).add(agent.id))
    setShowMentions(false)
    setTimeout(() => textarea.focus(), 10)
  }, [content])

  // Build flat index for keyboard navigation
  let flatIdx = 0

  return (
    <div
      className={cn(
        'relative border-t bg-background',
        isNote && 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
        className
      )}
    >
      {/* ================================================================
          CANNED RESPONSES PANEL — single unified popup
          Positioned absolutely above the input area
          ================================================================ */}
      {cannedOpen && (
        <div
          ref={cannedPanelRef}
          className="absolute bottom-full left-0 right-0 z-50 mx-3 mb-1"
        >
          <div className="rounded-lg border bg-popover text-popover-foreground shadow-lg overflow-hidden">
            {/* Search header */}
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={cannedTrigger === 'slash' ? content.slice(1) : cannedSearch}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase()
                  setCannedSearch(val)
                  if (cannedTrigger === 'slash') {
                    setContent('/' + e.target.value)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setCannedIndex((i) => (i + 1) % Math.max(filteredCanned.length, 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setCannedIndex((i) => (i - 1 + filteredCanned.length) % Math.max(filteredCanned.length, 1))
                  } else if (e.key === 'Enter' && filteredCanned.length > 0) {
                    e.preventDefault()
                    selectCannedResponse(filteredCanned[cannedIndex])
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    setCannedOpen(false)
                    setCannedTrigger(null)
                    setCannedSearch('')
                    if (cannedTrigger === 'slash') setContent('')
                    textareaRef.current?.focus()
                  } else if (e.key === 'Tab' && filteredCanned.length > 0) {
                    e.preventDefault()
                    selectCannedResponse(filteredCanned[cannedIndex])
                  }
                }}
                placeholder="Search responses..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus={cannedTrigger === 'button'}
              />
              <span className="text-xs text-muted-foreground shrink-0">
                {filteredCanned.length} result{filteredCanned.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Response list */}
            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {filteredCanned.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <Zap className="h-5 w-5 text-muted-foreground/40 mx-auto mb-1.5" />
                  <p className="text-sm text-muted-foreground">No matching responses</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    Try a different search term
                  </p>
                </div>
              ) : (
                Object.entries(groupedCanned).map(([category, responses]) => (
                  <div key={category}>
                    <div className="sticky top-0 bg-muted/60 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </div>
                    {responses.map((cr) => {
                      const itemIndex = flatIdx++
                      const isActive = itemIndex === cannedIndex
                      return (
                        <button
                          key={cr.id}
                          ref={(el) => {
                            if (el) cannedItemRefs.current.set(itemIndex, el)
                            else cannedItemRefs.current.delete(itemIndex)
                          }}
                          type="button"
                          className={cn(
                            'w-full text-left px-3 py-2 transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/50'
                          )}
                          onClick={() => selectCannedResponse(cr)}
                          onMouseEnter={() => setCannedIndex(itemIndex)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{cr.title}</span>
                            {cr.shortcut && (
                              <span className="ml-auto text-[11px] text-muted-foreground font-mono bg-muted rounded px-1.5 py-0.5 shrink-0">
                                /{cr.shortcut}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {cr.content}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t px-3 py-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>
                <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Enter</kbd> select
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Esc</kbd> close
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Note mode indicator */}
      {isNote && (
        <div className="flex items-center gap-1.5 px-3 pt-2 text-xs text-amber-700 dark:text-amber-400">
          <StickyNote className="h-3.5 w-3.5" />
          <span>Writing an internal note (not visible to visitor) — Type <kbd className="px-1 py-0.5 rounded bg-amber-200/50 dark:bg-amber-800/50 font-mono text-[10px]">@</kbd> to mention an agent · <kbd className="px-1 py-0.5 rounded bg-amber-200/50 dark:bg-amber-800/50 font-mono text-[10px]">Ctrl+/</kbd> to switch back · <kbd className="px-1 py-0.5 rounded bg-amber-200/50 dark:bg-amber-800/50 font-mono text-[10px]">Esc</kbd> to cancel</span>
        </div>
      )}

      {/* @mention dropdown */}
      {showMentions && filteredAgents.length > 0 && (
        <div className="absolute bottom-full left-3 right-3 z-50 mb-1 rounded-lg border bg-popover shadow-lg max-h-48 overflow-y-auto">
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b">
            <AtSign className="h-3 w-3 inline mr-1" />
            Mention an agent
          </div>
          {filteredAgents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-b-0 flex items-center gap-2"
              onClick={() => selectMention(agent)}
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {agent.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm">{agent.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
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

        {/* Canned responses button */}
        {cannedResponses.length > 0 && (
          <Button
            type="button"
            variant={cannedOpen ? 'secondary' : 'ghost'}
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={openCannedPanel}
            disabled={disabled}
            title="Canned responses (or type /)"
          >
            <Zap className="h-4 w-4" />
          </Button>
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
            isNote
              ? 'Write an internal note...'
              : cannedResponses.length > 0
                ? 'Type a message... (/ for canned responses)'
                : placeholder
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
