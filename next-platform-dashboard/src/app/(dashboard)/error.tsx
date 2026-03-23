'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw, Home, ArrowLeft } from 'lucide-react'

export default function DashboardGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Layout Error]', error)
    // Log to server for monitoring
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        source: 'dashboard-layout-error-boundary',
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {/* best effort */})
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h2>
          <p className="text-muted-foreground text-sm">
            An error occurred while loading the dashboard. This has been logged automatically.
          </p>
          {error.digest && (
            <p className="text-muted-foreground text-xs font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <a href="/dashboard">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </a>
          </Button>
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
