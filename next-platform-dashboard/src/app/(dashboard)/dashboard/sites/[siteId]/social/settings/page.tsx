/**
 * Social Media Settings Page
 * 
 * Route page for team permissions and workflow settings
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SocialSettingsPage } from '@/modules/social-media/components/SocialSettingsPage'
import { 
  getTeamPermissions, 
  getApprovalWorkflows 
} from '@/modules/social-media/actions/team-actions'

interface PageProps {
  params: Promise<{ siteId: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { siteId } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Get site agency_id (tenant)
  const { data: site } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single()
  
  if (!site?.agency_id) {
    redirect('/dashboard')
  }
  
  // Fetch team permissions and workflows
  const [permissionsResult, workflowsResult] = await Promise.all([
    getTeamPermissions(siteId),
    getApprovalWorkflows(siteId),
  ])
  
  return (
    <SocialSettingsPage
      siteId={siteId}
      tenantId={site.agency_id}
      userId={user.id}
      teamPermissions={permissionsResult.permissions || []}
      approvalWorkflows={workflowsResult.workflows || []}
    />
  )
}
