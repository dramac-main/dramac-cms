/**
 * Create Post Page
 * 
 * Phase EM-54: Social Media Management Module
 * Full-page post composer
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostComposerWrapper } from '@/modules/social-media/components'
import { getSocialAccounts } from '@/modules/social-media/actions/account-actions'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function ComposerContent({ siteId, userId }: { siteId: string; userId: string }) {
  const supabase = await createClient()
  
  // Get tenant ID from site
  const { data: site } = await supabase
    .from('sites')
    .select('agency_id, client:clients(agency_id)')
    .eq('id', siteId)
    .single()
  
  const tenantId = site?.agency_id || (site?.client as { agency_id: string } | null)?.agency_id || ''
  
  const accountsResult = await getSocialAccounts(siteId)
  const accounts = accountsResult.accounts || []

  return (
    <PostComposerWrapper
      siteId={siteId}
      tenantId={tenantId}
      userId={userId}
      accounts={accounts}
    />
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
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/dashboard/sites/${siteId}/social`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Post</h1>
      </div>
      <Suspense fallback={<ComposerSkeleton />}>
        <ComposerContent siteId={siteId} userId={user.id} />
      </Suspense>
    </div>
  )
}
