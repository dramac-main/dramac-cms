import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isModuleEnabledForSite } from '@/lib/actions/sites'
import { getPosts } from '@/modules/social-media/actions/post-actions'
import { ApprovalsPageWrapper } from '@/modules/social-media/components/ApprovalsPageWrapper'

interface PageProps {
  params: Promise<{ siteId: string }>
}

export default async function ApprovalsPage({ params }: PageProps) {
  const { siteId } = await params
  
  // Auth check
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
  
  // Get pending approval posts
  const { posts, total } = await getPosts(siteId, { 
    status: 'pending_approval',
    limit: 50 
  })
  
  return (
    <div className="container py-6">
      <ApprovalsPageWrapper 
        siteId={siteId}
        userId={user.id}
        pendingPosts={posts}
        totalPending={total}
      />
    </div>
  )
}
