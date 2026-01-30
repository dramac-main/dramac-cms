/**
 * Automation Analytics Page
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Analytics dashboard for monitoring workflow performance.
 */

import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { AnalyticsDashboard } from "@/modules/automation/components/analytics-dashboard"

export const metadata: Metadata = {
  title: "Analytics | Automation | DRAMAC",
  description: "Automation workflow analytics and performance metrics"
}

interface AnalyticsPageProps {
  params: Promise<{ siteId: string }>
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { siteId } = await params

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}/automation`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Automation
          </Button>
        </Link>
      </div>

      {/* Analytics Dashboard */}
      <div className="flex-1 p-6 overflow-auto">
        <AnalyticsDashboard siteId={siteId} />
      </div>
    </div>
  )
}
