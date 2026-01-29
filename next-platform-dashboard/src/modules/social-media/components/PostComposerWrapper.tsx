'use client'

/**
 * Post Composer Wrapper
 * 
 * Client wrapper that handles form submission and navigation internally
 * This prevents passing functions from Server Component to Client Component
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { PostComposer } from './PostComposer'
import { createPost, updatePost, getPost } from '../actions/post-actions'
import type { SocialAccount, PostMedia, SocialPlatform } from '../types'
import { toast } from 'sonner'

interface PostComposerWrapperProps {
  siteId: string
  tenantId: string
  userId: string
  accounts: SocialAccount[]
}

export function PostComposerWrapper({
  siteId,
  tenantId,
  userId,
  accounts,
}: PostComposerWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initialData, setInitialData] = useState<{
    content: string
    media?: PostMedia[]
    targetAccounts?: string[]
    scheduledAt?: string
  } | undefined>()
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check for edit or duplicate params
  useEffect(() => {
    const editId = searchParams.get('edit')
    const duplicateId = searchParams.get('duplicate')
    const postId = editId || duplicateId

    if (postId) {
      // Set loading state first, then use async IIFE
      setIsLoading(true)
      
      ;(async () => {
        const result = await getPost(postId)
        if (result.post) {
          setInitialData({
            content: result.post.content,
            media: result.post.media,
            targetAccounts: result.post.targetAccounts,
            scheduledAt: result.post.scheduledAt || undefined,
          })
          if (editId) {
            setEditingPostId(editId)
          }
        }
        setIsLoading(false)
      })()
    }

    // Check for date param (from calendar)
    const dateParam = searchParams.get('date')
    if (dateParam) {
      setInitialData(prev => ({
        ...prev,
        content: prev?.content || '',
        scheduledAt: dateParam,
      }))
    }
  }, [searchParams])

  const handleSubmit = useCallback(async (post: {
    content: string
    media: PostMedia[]
    targetAccounts: string[]
    scheduledAt?: string
    timezone?: string
    platformContent?: Partial<Record<SocialPlatform, { content: string }>>
    firstComment?: string
  }) => {
    try {
      if (editingPostId) {
        // Update existing post
        const result = await updatePost(editingPostId, siteId, {
          content: post.content,
          media: post.media,
          targetAccounts: post.targetAccounts,
          scheduledAt: post.scheduledAt,
          timezone: post.timezone,
          platformContent: post.platformContent as Record<SocialPlatform, { content: string; media?: PostMedia[] }>,
          firstComment: post.firstComment,
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('Post updated!')
      } else {
        // Create new post - status is determined by createPost based on scheduledAt
        const result = await createPost(siteId, tenantId, userId, {
          content: post.content,
          media: post.media,
          targetAccounts: post.targetAccounts,
          scheduledAt: post.scheduledAt,
          timezone: post.timezone,
          platformContent: post.platformContent as Record<SocialPlatform, { content: string; media?: PostMedia[] }>,
          firstComment: post.firstComment,
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success(post.scheduledAt ? 'Post scheduled!' : 'Post saved as draft!')
      }

      // Navigate back to calendar or dashboard
      router.push(`/dashboard/sites/${siteId}/social/calendar`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to save post')
      console.error(error)
    }
  }, [editingPostId, siteId, tenantId, userId, router])

  const handleCancel = useCallback(() => {
    router.back()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <PostComposer
      accounts={accounts}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      initialData={initialData}
      className="mx-auto"
    />
  )
}
