/**
 * AI Agent Marketplace Page
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 */

import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { AgentMarketplace } from "@/components/ai-agents/marketplace"

export const metadata: Metadata = {
  title: "Agent Marketplace | DRAMAC",
  description: "Browse and install pre-built AI agents for your business"
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  )
}

interface MarketplacePageProps {
  params: Promise<{ siteId: string }>
}

export default async function MarketplacePage({ params }: MarketplacePageProps) {
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
        <AgentMarketplace
          siteId={siteId}
          onInstall={async (templateId: string) => {
            'use server'
            // This will be handled by the component's client-side logic
            console.log('Installing template:', templateId)
          }}
          onViewDetails={(templateId: string) => {
            // Client-side navigation handled by component
            console.log('View details:', templateId)
          }}
        />
      </Suspense>
    </div>
  )
}
