/**
 * Create Post Page
 * 
 * Phase EM-54: Social Media Management Module
 * Full-page post composer
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostComposer } from '@/modules/social-media/components'
import { getSocialAccounts } from '@/modules/social-media/actions/account-actions'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function ComposerContent({ siteId }: { siteId: string }) {
  const accountsResult = await getSocialAccounts(siteId)
  const accounts = accountsResult.accounts || []

  return (
    <div className="max-w-3xl mx-auto">
      <PostComposer
        accounts={accounts}
        onSubmit={async () => {}}
      />
    </div>
  )
}

function ComposerSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-[500px]" />
    </div>
  )
}

export default async function ComposePage({ params }: PageProps) {
  const { siteId } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Create Post</h1>
      <Suspense fallback={<ComposerSkeleton />}>
        <ComposerContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
