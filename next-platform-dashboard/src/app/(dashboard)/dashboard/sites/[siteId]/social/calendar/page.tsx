/**
 * Content Calendar Page
 * 
 * Phase EM-54: Social Media Management Module
 * Visual content calendar for scheduling posts
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ContentCalendarWrapper } from '@/modules/social-media/components'
import { getSocialAccounts } from '@/modules/social-media/actions/account-actions'
import { getPosts } from '@/modules/social-media/actions/post-actions'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function CalendarContent({ siteId, userId }: { siteId: string; userId: string }) {
  const [accountsResult, postsResult] = await Promise.all([
    getSocialAccounts(siteId),
    getPosts(siteId, { limit: 500 }), // Get all posts for calendar
  ])

  const accounts = accountsResult.accounts || []
  const posts = postsResult.posts || []

  return (
    <ContentCalendarWrapper
      siteId={siteId}
      posts={posts}
      accounts={accounts}
      userId={userId}
    />
  )
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Skeleton className="h-[600px]" />
    </div>
  )
}

export default async function CalendarPage({ params }: PageProps) {
  const { siteId } = await params
  
  // Auth guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="container py-6">
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarContent siteId={siteId} userId={user.id} />
      </Suspense>
    </div>
  )
}
