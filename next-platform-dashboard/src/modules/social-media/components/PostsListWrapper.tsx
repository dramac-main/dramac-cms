'use client'

/**
 * Social Media Posts List Wrapper
 * 
 * Phase SM-07: Missing Pages & Full Navigation
 * Client wrapper bridging server actions to PostsList component
 */

import { PostsList } from './PostsList'
import { deletePost, duplicatePost, bulkDeletePosts } from '../actions/post-actions'
import type { SocialPost, SocialAccount } from '../types'

interface PostsListWrapperProps {
  siteId: string
  tenantId: string
  userId: string
  posts: SocialPost[]
  accounts: SocialAccount[]
}

export function PostsListWrapper({ siteId, tenantId, userId, posts, accounts }: PostsListWrapperProps) {
  return (
    <PostsList
      siteId={siteId}
      posts={posts}
      accounts={accounts}
      onDelete={async (postId) => {
        return deletePost(postId, siteId)
      }}
      onDuplicate={async (postId) => {
        return duplicatePost(postId, siteId, tenantId, userId)
      }}
      onBulkDelete={async (postIds) => {
        return bulkDeletePosts(siteId, postIds)
      }}
    />
  )
}
