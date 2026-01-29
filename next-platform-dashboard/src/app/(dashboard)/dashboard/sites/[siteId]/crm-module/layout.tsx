/**
 * CRM Module Layout
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Provides access control and navigation for CRM pages
 */

import { ReactNode } from 'react'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isModuleEnabledForSite } from '@/lib/actions/sites'

interface CRMLayoutProps {
  children: ReactNode
  params: Promise<{ siteId: string }>
}

export default async function CRMLayout({ children, params }: CRMLayoutProps) {
  const { siteId } = await params
  
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Verify site exists
  const { data: site } = await supabase
    .from('sites')
    .select('id, name')
    .eq('id', siteId)
    .single()
  
  if (!site) {
    notFound()
  }

  // Module access check
  const hasAccess = await isModuleEnabledForSite(siteId, 'crm')
  if (!hasAccess) {
    redirect(`/dashboard/sites/${siteId}?tab=modules&message=crm_not_installed`)
  }

  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  )
}
