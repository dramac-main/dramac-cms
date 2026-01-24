/**
 * CRM Dashboard Page
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Main dashboard page for the CRM module
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { CRMDashboard } from '@/modules/crm/components/crm-dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

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
    <div className="flex flex-col h-full">
      {/* Back Navigation */}
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}?tab=crm`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Site
          </Button>
        </Link>
      </div>
      
      {/* CRM Dashboard */}
      <Suspense fallback={<CRMLoadingSkeleton />}>
        <CRMDashboard siteId={siteId} />
      </Suspense>
    </div>
  )
}
