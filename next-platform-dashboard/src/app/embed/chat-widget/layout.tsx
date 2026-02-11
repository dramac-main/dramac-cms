/**
 * Chat Widget Layout
 *
 * PHASE LC-04: Minimal layout for embeddable chat widget
 * No dashboard chrome — just the widget content with necessary CSS
 */

import type { Metadata } from 'next'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Chat Widget',
  robots: 'noindex, nofollow',
}

export default function ChatWidgetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body
        className="min-h-screen bg-transparent antialiased"
        style={{ margin: 0, padding: 0, overflow: 'hidden' }}
      >
        {children}
      </body>
    </html>
  )
}
