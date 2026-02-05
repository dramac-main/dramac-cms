/**
 * Quote Portal Loading State
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 */

import { Loader2 } from 'lucide-react'

export default function QuotePortalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading quote...</p>
      </div>
    </div>
  )
}
