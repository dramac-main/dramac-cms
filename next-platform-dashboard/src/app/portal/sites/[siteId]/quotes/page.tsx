/**
 * Portal Quotes — portal-first list page (Session 6A).
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createPortalDAL } from "@/lib/portal/data-access";
import { PageHeader } from "@/components/layout/page-header";
import { PortalPanelSkeleton } from "@/components/portal/patterns/portal-panel-skeleton";
import { PortalErrorState } from "@/components/portal/patterns/portal-error-state";
import { QuotesListClient } from "./quotes-list-client";
import type {
  PortalQuoteListFilter,
  PortalQuoteStatus,
} from "@/lib/portal/commerce-data-access";

export const metadata: Metadata = {
  title: "Quotes | Client Portal",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams?: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 25;
const QUOTE_STATUS_VALUES = new Set<string>([
  "all",
  "draft",
  "pending_approval",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "converted",
  "cancelled",
]);

export default async function PortalQuotesPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;
  const sp = (await searchParams) ?? {};

  await verifyPortalModuleAccess(user, siteId, "ecommerce", "canManageQuotes");

  const statusRaw =
    sp.status && QUOTE_STATUS_VALUES.has(sp.status) ? sp.status : "all";
  const status = statusRaw as PortalQuoteStatus | "all";
  const search = (sp.q ?? "").slice(0, 120);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const filter: PortalQuoteListFilter = {
    status,
    search: search || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="Review, respond to, and convert sales quotes"
      />
      <Suspense fallback={<PortalPanelSkeleton rows={6} />}>
        <QuotesLoader
          siteId={siteId}
          filter={filter}
          page={page}
          activeStatus={statusRaw}
          activeSearch={search}
        />
      </Suspense>
    </div>
  );
}

async function QuotesLoader({
  siteId,
  filter,
  page,
  activeStatus,
  activeSearch,
}: {
  siteId: string;
  filter: PortalQuoteListFilter;
  page: number;
  activeStatus: string;
  activeSearch: string;
}) {
  try {
    const user = await requirePortalAuth();
    const session = await getPortalSession();
    const dal = createPortalDAL({
      user,
      isImpersonation: session.isImpersonating,
      impersonatorEmail: session.impersonatorEmail,
    });
    const quotes = await dal.quotes.list(siteId, filter);
    const hasMore = quotes.length === (filter.limit ?? PAGE_SIZE);
    return (
      <QuotesListClient
        siteId={siteId}
        quotes={quotes}
        currentPage={page}
        pageSize={filter.limit ?? PAGE_SIZE}
        hasMore={hasMore}
        activeStatus={activeStatus}
        activeSearch={activeSearch}
      />
    );
  } catch (err) {
    return (
      <PortalErrorState
        title="Couldn’t load quotes"
        description={
          err instanceof Error ? err.message : "Please refresh to try again."
        }
      />
    );
  }
}
