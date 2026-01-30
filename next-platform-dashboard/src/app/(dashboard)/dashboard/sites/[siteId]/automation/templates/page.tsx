/**
 * Workflow Templates Page
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Browse and use pre-built workflow templates.
 */

import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TemplateGallery } from "@/modules/automation/components/template-gallery"

export const metadata: Metadata = {
  title: "Templates | Automation | DRAMAC",
  description: "Browse pre-built automation workflow templates"
}

interface TemplatesPageProps {
  params: Promise<{ siteId: string }>
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const { siteId } = await params

  // Handler passed as redirect since we can't use client functions
  // The actual navigation will be handled by the TemplateGallery component

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="border-b px-6 py-3 flex items-center justify-between">
        <Link href={`/dashboard/sites/${siteId}/automation`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Automation
          </Button>
        </Link>
      </div>

      {/* Template Gallery */}
      <div className="flex-1 p-6 overflow-auto">
        <TemplateGallery 
          siteId={siteId}
          // onWorkflowCreated will redirect via client-side navigation
        />
      </div>
    </div>
  )
}
