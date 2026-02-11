'use client'

/**
 * Error boundary for published site routes
 * Catches runtime errors in site rendering and shows a user-friendly message
 */

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white"
      style={{ colorScheme: 'light' }}
    >
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-8">
          We&apos;re sorry, but something went wrong while loading this page.
          Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
