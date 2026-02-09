/**
 * AI Agent Usage & Billing Page
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 */

import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CreditCard } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { UsageDashboard } from "@/components/ai-agents/billing"
import { TIER_LIMITS } from "@/lib/ai-agents/billing/usage-tracker"
import { PLATFORM } from "@/lib/constants/platform"

export const metadata: Metadata = {
  title: `Usage & Billing | ${PLATFORM.name}`,
  description: "Monitor AI agent usage and manage billing"
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}

interface UsagePageProps {
  params: Promise<{ siteId: string }>
}

export default async function UsagePage({ params }: UsagePageProps) {
  const { siteId } = await params
  
  const periodStart = new Date()
  periodStart.setDate(1)
  const periodEnd = new Date(periodStart)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Link 
          href={`/dashboard/sites/${siteId}/ai-agents`}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Agents
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Usage & Billing
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor your AI agent usage and manage billing
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <UsageDashboard
          siteId={siteId}
          currentTier="free"
          usage={{
            siteId,
            periodStart,
            periodEnd,
            tokensUsed: 0,
            tokensLimit: TIER_LIMITS.free.monthlyTokenLimit,
            executionsUsed: 0,
            executionsLimit: TIER_LIMITS.free.monthlyExecutionLimit,
            costEstimate: 0,
            overageTokens: 0,
            overageCost: 0,
          }}
          limits={TIER_LIMITS.free}
          onUpgrade={async () => {
            'use server'
            // Navigate to billing/upgrade page
            console.log('Upgrade requested')
          }}
        />
      </Suspense>
    </div>
  )
}
