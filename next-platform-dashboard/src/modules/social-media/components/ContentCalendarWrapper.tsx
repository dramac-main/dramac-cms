'use client'

/**
 * Content Calendar Wrapper
 * 
 * Client wrapper that handles navigation and action callbacks internally
 * This prevents passing functions from Server Component to Client Component
 */

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { ContentCalendar } from './ContentCalendar'
import { deletePost, approvePost, rejectPost, publishPostNow } from '../actions/post-actions'
import type { SocialAccount, SocialPost } from '../types'
import { toast } from 'sonner'

interface ContentCalendarWrapperProps {
  siteId: string
  posts: SocialPost[]
  accounts: SocialAccount[]
  userId?: string
}

export function ContentCalendarWrapper({
  siteId,
  posts,
  accounts,
  userId = '',
}: ContentCalendarWrapperProps) {
  const router = useRouter()
  const [_isLoading, setIsLoading] = useState(false)

  const handleCreatePost = useCallback((date?: Date) => {
    const params = date ? `?date=${date.toISOString()}` : ''
    router.push(`/dashboard/sites/${siteId}/social/compose${params}`)
  }, [router, siteId])

  const handleEditPost = useCallback((post: SocialPost) => {
    router.push(`/dashboard/sites/${siteId}/social/compose?edit=${post.id}`)
  }, [router, siteId])

  const handleDeletePost = useCallback(async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    setIsLoading(true)
    try {
      const result = await deletePost(postId, siteId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Post deleted')
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }, [router, siteId])

  const handleDuplicatePost = useCallback((post: SocialPost) => {
    router.push(`/dashboard/sites/${siteId}/social/compose?duplicate=${post.id}`)
  }, [router, siteId])

  const handleApprovePost = useCallback(async (postId: string) => {
    setIsLoading(true)
    try {
      const result = await approvePost(postId, siteId, userId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Post approved')
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }, [router, siteId, userId])

  const handleRejectPost = useCallback(async (postId: string) => {
    const reason = prompt('Rejection reason (optional):') || 'Rejected'
    setIsLoading(true)
    try {
      const result = await rejectPost(postId, siteId, userId, reason)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Post rejected')
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }, [router, siteId, userId])

  const handlePublishNow = useCallback(async (postId: string) => {
    if (!confirm('Publish this post now?')) return
    
    setIsLoading(true)
    try {
      const result = await publishPostNow(postId, siteId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Post published!')
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }, [router, siteId])

  return (
    <ContentCalendar
      posts={posts}
      accounts={accounts}
      onCreatePost={handleCreatePost}
      onEditPost={handleEditPost}
      onDeletePost={handleDeletePost}
      onDuplicatePost={handleDuplicatePost}
      onApprovePost={handleApprovePost}
      onRejectPost={handleRejectPost}
      onPublishNow={handlePublishNow}
    />
  )
}
