/**
 * CRM Dashboard Page
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Main dashboard page for the CRM module
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import { CRMDashboard } from '@/modules/crm/components/crm-dashboard'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'CRM | DRAMAC',
  description: 'Customer Relationship Management - Manage contacts, companies, and deals'
}

// Loading fallback
function CRMLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      {/* Tabs */}
      <Skeleton className="h-10 w-96" />
      {/* Content */}
      <Skeleton className="h-[500px]" />
    </div>
  )
}

interface CRMPageProps {
  params: Promise<{ siteId: string }>
}

export default async function CRMPage({ params }: CRMPageProps) {
  const { siteId } = await params
  
  return (
    <Suspense fallback={<CRMLoadingSkeleton />}>
      <CRMDashboard siteId={siteId} />
    </Suspense>
  )
}
