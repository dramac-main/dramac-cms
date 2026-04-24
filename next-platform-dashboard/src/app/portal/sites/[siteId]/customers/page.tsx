/**
 * Portal Customers — portal-first list page (Session 6A, read-only).
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createPortalDAL } from "@/lib/portal/data-access";
import { PageHeader } from "@/components/layout/page-header";
import { PortalPanelSkeleton } from "@/components/portal/patterns/portal-panel-skeleton";
import { PortalErrorState } from "@/components/portal/patterns/portal-error-state";
import { CustomersListClient } from "./customers-list-client";
import type { PortalCustomerListFilter } from "@/lib/portal/commerce-data-access";

export const metadata: Metadata = {
  title: "Customers | Client Portal",
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
const CUSTOMER_STATUS_VALUES = new Set<string>([
  "all",
  "active",
  "inactive",
  "guest",
]);

export default async function PortalCustomersPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;
  const sp = (await searchParams) ?? {};

  await verifyPortalModuleAccess(
    user,
    siteId,
    "ecommerce",
    "canManageCustomers",
  );

  const status = (
    sp.status && CUSTOMER_STATUS_VALUES.has(sp.status) ? sp.status : "all"
  ) as "all" | "active" | "inactive" | "guest";
  const search = (sp.q ?? "").slice(0, 120);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const filter: PortalCustomerListFilter = {
    status,
    search: search || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Browse customers who have purchased or signed up on this site"
      />
      <Suspense fallback={<PortalPanelSkeleton rows={6} />}>
        <CustomersLoader
          siteId={siteId}
          filter={filter}
          page={page}
          activeStatus={status}
          activeSearch={search}
        />
      </Suspense>
    </div>
  );
}

async function CustomersLoader({
  siteId,
  filter,
  page,
  activeStatus,
  activeSearch,
}: {
  siteId: string;
  filter: PortalCustomerListFilter;
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
    const customers = await dal.customers.list(siteId, filter);
    const hasMore = customers.length === (filter.limit ?? PAGE_SIZE);
    return (
      <CustomersListClient
        siteId={siteId}
        customers={customers}
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
        title="Couldn’t load customers"
        description={
          err instanceof Error ? err.message : "Please refresh to try again."
        }
      />
    );
  }
}
