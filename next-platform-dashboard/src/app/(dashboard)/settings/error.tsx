'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Settings Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Settings Error</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        {error.message || 'An error occurred while loading settings. Please try again.'}
      </p>
      <Button onClick={reset} variant="outline">Try Again</Button>
    </div>
  )
}
