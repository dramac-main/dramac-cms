/**
 * AI Agent Analytics Page
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 */

import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { AgentAnalytics } from "@/components/ai-agents/analytics"
import { PLATFORM } from "@/lib/constants/platform"

export const metadata: Metadata = {
  title: `Agent Analytics | ${PLATFORM.name}`,
  description: "Monitor AI agent performance and execution history"
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  )
}

interface AnalyticsPageProps {
  params: Promise<{ siteId: string }>
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { siteId } = await params

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

      <Suspense fallback={<LoadingSkeleton />}>
        <AgentAnalytics siteId={siteId} />
      </Suspense>
    </div>
  )
}
