/**
 * Social Inbox Page
 * 
 * Phase EM-54: Social Media Management Module
 * Unified inbox for comments, messages, and mentions
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isModuleEnabledForSite } from '@/lib/actions/sites'
import { SocialInbox } from '@/modules/social-media/components'
import { getSocialAccounts } from '@/modules/social-media/actions/account-actions'
import { getInboxItems, getSavedReplies } from '@/modules/social-media/actions/inbox-actions'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function InboxContent({ siteId }: { siteId: string }) {
  const [accountsResult, inboxResult, repliesResult] = await Promise.all([
    getSocialAccounts(siteId),
    getInboxItems(siteId),
    getSavedReplies(siteId),
  ])

  const accounts = accountsResult.accounts || []
  const items = inboxResult.items || []
  const savedReplies = repliesResult.replies || []

  return (
    <SocialInbox
      items={items}
      accounts={accounts}
      savedReplies={savedReplies}
      onReply={async () => {}}
      onMarkAsRead={async () => {}}
      onArchive={async () => {}}
      onAssign={async () => {}}
      onFlag={async () => {}}
      onMarkAsSpam={async () => {}}
      onRefresh={() => {}}
    />
  )
}

function InboxSkeleton() {
  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-lg overflow-hidden">
      <div className="w-1/3 border-r">
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-3 flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Skeleton className="h-24 w-48" />
      </div>
    </div>
  )
}

export default async function InboxPage({ params }: PageProps) {
  const { siteId } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Module access check
  const hasAccess = await isModuleEnabledForSite(siteId, 'social-media')
  if (!hasAccess) {
    redirect(`/dashboard/sites/${siteId}?tab=modules`)
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Social Inbox</h1>
      <Suspense fallback={<InboxSkeleton />}>
        <InboxContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
