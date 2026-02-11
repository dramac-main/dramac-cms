/**
 * Customer Quote Portal Page
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Public page for customers to view and accept/reject quotes
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getQuoteByToken, recordQuoteView } from '@/modules/ecommerce/actions/quote-workflow-actions'
import { QuotePortalView } from '@/modules/ecommerce/components/portal/quote-portal-view'

// ============================================================================
// TYPES
// ============================================================================

interface QuotePortalPageProps {
  params: Promise<{
    token: string
  }>
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: QuotePortalPageProps): Promise<Metadata> {
  const { token } = await params
  const quote = await getQuoteByToken(token)
  
  if (!quote) {
    return {
      title: 'Quote Not Found'
    }
  }
  
  return {
    title: `Quote ${quote.quote_number}${quote.title ? ` - ${quote.title}` : ''}`,
    description: `View and respond to quote ${quote.quote_number}`,
    robots: {
      index: false,
      follow: false
    }
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function QuotePortalPage({ params }: QuotePortalPageProps) {
  const { token } = await params
  
  // Get quote data
  const quote = await getQuoteByToken(token)
  
  if (!quote) {
    notFound()
  }
  
  // Record view (async, don't await)
  recordQuoteView(token)
  
  return (
    <div className="min-h-screen bg-gray-50" data-theme="light" style={{ colorScheme: 'light' }}>
      <QuotePortalView quote={quote} token={token} />
    </div>
  )
}
