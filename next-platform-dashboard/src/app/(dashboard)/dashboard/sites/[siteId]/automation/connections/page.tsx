/**
 * Automation Connections Page
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Manage external service connections for automation workflows.
 */

import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ConnectionSetup } from "@/modules/automation/components/connection-setup"
import { PLATFORM } from "@/lib/constants/platform"

export const metadata: Metadata = {
  title: `Connections | Automation | ${PLATFORM.name}`,
  description: "Manage external service connections for automation"
}

interface ConnectionsPageProps {
  params: Promise<{ siteId: string }>
}

export default async function ConnectionsPage({ params }: ConnectionsPageProps) {
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

      {/* Connection Setup */}
      <div className="flex-1 p-6 overflow-auto">
        <ConnectionSetup siteId={siteId} />
      </div>
    </div>
  )
}
