import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isModuleEnabledForSite } from '@/lib/actions/sites'
import { getCampaigns } from '@/modules/social-media/actions/campaign-actions'
import { CampaignsPageWrapper } from '@/modules/social-media/components/CampaignsPageWrapper'

interface PageProps {
  params: Promise<{ siteId: string }>
}

export default async function CampaignsPage({ params }: PageProps) {
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
  
  // Get site agency_id for creating campaigns
  const { data: site } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single()
  
  // Get campaigns
  const { campaigns, total } = await getCampaigns(siteId)
  
  return (
    <div className="container py-6">
      <CampaignsPageWrapper 
        siteId={siteId}
        tenantId={site?.agency_id || ''}
        userId={user.id}
        initialCampaigns={campaigns}
        totalCampaigns={total}
      />
    </div>
  )
}
