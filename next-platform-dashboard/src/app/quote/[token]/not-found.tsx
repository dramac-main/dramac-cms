/**
 * Quote Portal Not Found
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileX, Home } from 'lucide-react'

export default function QuoteNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <FileX className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Quote Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This quote link may have expired or is invalid. Please contact the sender for a new link.
        </p>
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Go to Homepage
          </Link>
        </Button>
      </div>
    </div>
  )
}
