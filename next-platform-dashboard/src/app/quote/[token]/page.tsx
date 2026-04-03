/**
 * Customer Quote Portal Page
 *
 * Phase ECOM-12: Quote Workflow & Customer Portal
 *
 * Public page for customers to view and accept/reject quotes.
 * Protected by email verification gate — customer must prove ownership
 * before viewing full quote details or taking actions.
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getQuoteByToken,
  recordQuoteView,
} from "@/modules/ecommerce/actions/quote-workflow-actions";
import { verifyQuoteAccessCookie } from "@/modules/ecommerce/actions/quote-portal-auth";
import { QuotePortalView } from "@/modules/ecommerce/components/portal/quote-portal-view";
import { QuoteEmailGate } from "@/modules/ecommerce/components/portal/quote-email-gate";

// ============================================================================
// TYPES
// ============================================================================

interface QuotePortalPageProps {
  params: Promise<{
    token: string;
  }>;
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: QuotePortalPageProps): Promise<Metadata> {
  const { token } = await params;
  const quote = await getQuoteByToken(token);

  if (!quote) {
    return {
      title: "Quote Not Found",
    };
  }

  return {
    title: `Quote ${quote.quote_number}${quote.title ? ` - ${quote.title}` : ""}`,
    description: `View and respond to quote ${quote.quote_number}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function QuotePortalPage({
  params,
}: QuotePortalPageProps) {
  const { token } = await params;

  // Get quote data
  const quote = await getQuoteByToken(token);

  if (!quote) {
    notFound();
  }

  // Check email verification cookie
  const isVerified = await verifyQuoteAccessCookie(
    token,
    quote.customer_email || "",
  );

  if (!isVerified) {
    // Show email verification gate — customer must prove identity
    return (
      <div data-theme="light" style={{ colorScheme: "light" }}>
        <QuoteEmailGate token={token} quoteNumber={quote.quote_number} />
      </div>
    );
  }

  // Verified — record view and show full portal
  recordQuoteView(token);

  return (
    <div
      className="min-h-screen bg-gray-50"
      data-theme="light"
      style={{ colorScheme: "light" }}
    >
      <QuotePortalView
        quote={quote}
        token={token}
        verifiedEmail={quote.customer_email}
      />
    </div>
  );
}
