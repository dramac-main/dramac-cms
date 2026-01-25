/**
 * E-Commerce Dashboard Page
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Main dashboard page for the E-Commerce module
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { EcommerceDashboard } from '@/modules/ecommerce/components/ecommerce-dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getSite } from '@/lib/actions/sites'

export const metadata: Metadata = {
  title: 'E-Commerce | DRAMAC',
  description: 'Product catalog and order management'
}

// Loading fallback
function EcommerceLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
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

interface EcommercePageProps {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{ view?: string }>
}

export default async function EcommercePage({ params, searchParams }: EcommercePageProps) {
  const { siteId } = await params
  const { view } = await searchParams
  
  // Fetch site with agency_id
  const site = await getSite(siteId)
  
  if (!site) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Site not found</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Back Navigation */}
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/${siteId}?tab=modules`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Site
          </Button>
        </Link>
      </div>
      
      {/* E-Commerce Dashboard */}
      <Suspense fallback={<EcommerceLoadingSkeleton />}>
        <EcommerceDashboard siteId={siteId} agencyId={site.agency_id} initialView={view} />
      </Suspense>
    </div>
  )
}
