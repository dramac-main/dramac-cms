import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import {
  createPortalDAL,
  PortalAccessDeniedError,
} from "@/lib/portal/data-access";
import { PortalPanelSkeleton } from "@/components/portal/patterns/portal-panel-skeleton";
import { PortalErrorState } from "@/components/portal/patterns/portal-error-state";
import { QuoteDetailClient } from "./quote-detail-client";

export const metadata: Metadata = {
  title: "Quote | Client Portal",
};

interface PageProps {
  params: Promise<{ siteId: string; quoteId: string }>;
}

export default async function PortalQuoteDetailPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId, quoteId } = await params;
  await verifyPortalModuleAccess(user, siteId, "ecommerce", "canManageQuotes");

  return (
    <Suspense fallback={<PortalPanelSkeleton rows={8} />}>
      <QuoteLoader siteId={siteId} quoteId={quoteId} />
    </Suspense>
  );
}

async function QuoteLoader({
  siteId,
  quoteId,
}: {
  siteId: string;
  quoteId: string;
}) {
  try {
    const user = await requirePortalAuth();
    const session = await getPortalSession();
    const dal = createPortalDAL({
      user,
      isImpersonation: session.isImpersonating,
      impersonatorEmail: session.impersonatorEmail,
    });
    const quote = await dal.quotes.detail(siteId, quoteId);
    return <QuoteDetailClient siteId={siteId} quote={quote} />;
  } catch (err) {
    if (
      err instanceof PortalAccessDeniedError &&
      err.code === "site_not_found"
    ) {
      notFound();
    }
    return (
      <PortalErrorState
        title="Couldn’t load quote"
        description={
          err instanceof Error ? err.message : "Please refresh to try again."
        }
      />
    );
  }
}
