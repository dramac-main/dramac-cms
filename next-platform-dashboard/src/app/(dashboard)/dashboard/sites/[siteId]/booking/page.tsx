/**
 * Booking Dashboard Page
 * 
 * Phase EM-51: Booking Module
 * 
 * Main dashboard page for the Booking module
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { BookingDashboard } from '@/modules/booking/components/booking-dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Booking | DRAMAC',
  description: 'Appointment scheduling and calendar management'
}

// Loading fallback
function BookingLoadingSkeleton() {
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

interface BookingPageProps {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{ view?: string }>
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { siteId } = await params
  const { view } = await searchParams
  
  return (
    <div className="flex flex-col h-full">
      {/* Back Navigation */}
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}?tab=modules`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Site
          </Button>
        </Link>
      </div>
      
      {/* Booking Dashboard */}
      <Suspense fallback={<BookingLoadingSkeleton />}>
        <BookingDashboard siteId={siteId} initialView={view} />
      </Suspense>
    </div>
  )
}
