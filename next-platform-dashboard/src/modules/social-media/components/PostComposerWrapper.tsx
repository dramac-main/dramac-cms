'use client'

/**
 * Post Composer Wrapper
 * 
 * Client wrapper that handles form submission and navigation internally
 * This prevents passing functions from Server Component to Client Component
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { PostComposerEnhanced } from './PostComposerEnhanced'
import { createPost, updatePost, getPost, publishPostNow } from '../actions/post-actions'
import type { SocialAccount, PostMedia, SocialPlatform, Campaign, ContentPillar } from '../types'
import { toast } from 'sonner'

interface PostComposerWrapperProps {
  siteId: string
  tenantId: string
  userId: string
  accounts: SocialAccount[]
  campaigns?: Campaign[]
  contentPillars?: ContentPillar[]
}

export function PostComposerWrapper({
  siteId,
  tenantId,
  userId,
  accounts,
  campaigns = [],
  contentPillars = [],
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

  // Load post data for edit/duplicate
  const loadPost = useCallback(async (postId: string, isEdit: boolean) => {
    setIsLoading(true)
    try {
      const result = await getPost(postId)
      if (result.post) {
        setInitialData({
          content: result.post.content,
          media: result.post.media,
          targetAccounts: result.post.targetAccounts,
          scheduledAt: result.post.scheduledAt || undefined,
        })
        if (isEdit) {
          setEditingPostId(postId)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check for edit or duplicate params
  useEffect(() => {
    const editId = searchParams.get('edit')
    const duplicateId = searchParams.get('duplicate')
    const postId = editId || duplicateId

    if (postId) {
      loadPost(postId, !!editId)
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
  }, [searchParams, loadPost])

  const handleSubmit = useCallback(async (post: {
    content: string
    media: PostMedia[]
    targetAccounts: string[]
    scheduledAt?: string
    timezone?: string
    platformContent?: Partial<Record<SocialPlatform, { content: string }>>
    firstComment?: string
    campaignId?: string
    contentPillar?: string
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

        // If no scheduledAt, this is a "Post Now" — publish immediately
        if (!post.scheduledAt && result.post?.id) {
          toast.loading('Publishing to platforms...')
          const publishResult = await publishPostNow(result.post.id, siteId)
          if (publishResult.error) {
            toast.dismiss()
            toast.error(`Published with issues: ${publishResult.error}`)
          } else {
            toast.dismiss()
            toast.success('Post published to all platforms!')
          }
        } else {
          toast.success(post.scheduledAt ? 'Post scheduled!' : 'Post saved as draft!')
        }
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
    <PostComposerEnhanced
      accounts={accounts}
      campaigns={campaigns}
      contentPillars={contentPillars}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      initialData={initialData}
      className="mx-auto"
    />
  )
}
