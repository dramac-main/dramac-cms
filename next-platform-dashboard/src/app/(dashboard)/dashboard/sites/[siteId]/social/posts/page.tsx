/**
 * Social Media Posts Page
 * 
 * Phase SM-07: Missing Pages & Full Navigation
 * Server component for the posts management page
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PostsListWrapper } from '@/modules/social-media/components/PostsListWrapper'
import { getPosts } from '@/modules/social-media/actions/post-actions'
import { getSocialAccounts } from '@/modules/social-media/actions/account-actions'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  params: Promise<{ siteId: string }>
}

function PostsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="rounded-md border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

async function PostsContent({ siteId }: { siteId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const [postsResult, accountsResult] = await Promise.all([
    getPosts(siteId, { limit: 100 }),
    getSocialAccounts(siteId),
  ])

  // Get tenant_id from accounts or site
  const tenantId = accountsResult.accounts?.[0]?.tenantId || ''

  return (
    <PostsListWrapper
      siteId={siteId}
      tenantId={tenantId}
      userId={user?.id || ''}
      posts={postsResult.posts || []}
      accounts={accountsResult.accounts || []}
    />
  )
}

export default async function PostsPage({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <Suspense fallback={<PostsSkeleton />}>
        <PostsContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
