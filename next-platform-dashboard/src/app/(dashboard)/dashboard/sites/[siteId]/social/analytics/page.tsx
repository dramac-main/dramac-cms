/**
 * Social Analytics Dashboard Page
 * 
 * PHASE-DS-03B: Social Analytics Dashboard
 * Comprehensive social media analytics with real-time insights
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isModuleEnabledForSite } from '@/lib/actions/sites'
import { SocialAnalyticsDashboardEnhanced } from '@/modules/social-media/components/SocialAnalyticsDashboardEnhanced'

interface PageProps {
  params: Promise<{ siteId: string }>
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { siteId } = await params
  
  // Auth check handled by layout
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
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Analytics currently display demo data for testing purposes.
        </p>
      </div>
      <SocialAnalyticsDashboardEnhanced siteId={siteId} />
    </div>
  )
}

