'use client'

/**
 * Social Inbox Wrapper
 * 
 * Client wrapper that handles inbox actions internally
 * This prevents passing functions from Server Component to Client Component
 */

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { SocialInbox } from './SocialInbox'
import {
  markAsRead,
  replyToItem,
  archiveItem,
  assignItem,
  flagItem,
  markAsSpam,
  syncInbox,
} from '../actions/inbox-actions'
import type { SocialAccount, InboxItem, SavedReply } from '../types'
import { toast } from 'sonner'

interface SocialInboxWrapperProps {
  siteId: string
  items: InboxItem[]
  accounts: SocialAccount[]
  savedReplies: SavedReply[]
  userId?: string
}

export function SocialInboxWrapper({
  siteId,
  items,
  accounts,
  savedReplies,
  userId = '',
}: SocialInboxWrapperProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleReply = useCallback(async (itemId: string, message: string) => {
    setIsLoading(true)
    try {
      const result = await replyToItem(itemId, siteId, userId, message)
      if (result.error) {
        // Check if it was a partial success (saved to DB but platform failed)
        if (result.success) {
          toast.warning(result.error)
        } else {
          toast.error(result.error)
        }
      } else {
        toast.success('Reply sent to platform!')
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }, [siteId, userId, router])

  const handleMarkAsRead = useCallback(async (itemIds: string[]) => {
    setIsLoading(true)
    try {
      for (const itemId of itemIds) {
        const result = await markAsRead(itemId, siteId)
        if (result.error) {
          toast.error(result.error)
          break
        }
      }
      toast.success(`Marked ${itemIds.length} item(s) as read`)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }, [siteId, router])

  const handleArchive = useCallback(async (itemIds: string[]) => {
    setIsLoading(true)
    try {
      for (const itemId of itemIds) {
        const result = await archiveItem(itemId, siteId)
        if (result.error) {
          toast.error(result.error)
          break
        }
      }
      toast.success(`Archived ${itemIds.length} item(s)`)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }, [siteId, router])

  const handleAssign = useCallback(async (itemId: string, assigneeId: string) => {
    setIsLoading(true)
    try {
      const result = await assignItem(itemId, siteId, assigneeId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Item assigned')
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }, [siteId, router])

  const handleFlag = useCallback(async (itemId: string, flagged: boolean) => {
    setIsLoading(true)
    try {
      const result = await flagItem(itemId, siteId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(flagged ? 'Item flagged' : 'Flag removed')
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }, [siteId, router])

  const handleMarkAsSpam = useCallback(async (itemId: string) => {
    setIsLoading(true)
    try {
      const result = await markAsSpam(itemId, siteId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Marked as spam')
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }, [siteId, router])

  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await syncInbox(siteId)
      if (result.newItems > 0) {
        toast.success(`Synced ${result.newItems} new item(s)`)
      } else {
        toast.info('Inbox is up to date')
      }
      if (result.error) {
        console.warn('[Inbox Sync]', result.error)
      }
      router.refresh()
    } catch {
      toast.error('Failed to sync inbox')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, router])

  return (
    <SocialInbox
      items={items}
      accounts={accounts}
      savedReplies={savedReplies}
      onReply={handleReply}
      onMarkAsRead={handleMarkAsRead}
      onArchive={handleArchive}
      onAssign={handleAssign}
      onFlag={handleFlag}
      onMarkAsSpam={handleMarkAsSpam}
      onRefresh={handleRefresh}
      isLoading={isLoading}
    />
  )
}
