/**
 * Portal Orders — portal-first list page (Session 6A).
 *
 * Reads through `dal.orders.list` (permission + scope + audit + events).
 * URL params drive filter / paging so state is sharable and refreshable.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createPortalDAL } from "@/lib/portal/data-access";
import { PageHeader } from "@/components/layout/page-header";
import { PortalPanelSkeleton } from "@/components/portal/patterns/portal-panel-skeleton";
import { PortalErrorState } from "@/components/portal/patterns/portal-error-state";
import { OrdersListClient } from "./orders-list-client";
import type {
  PortalOrderListFilter,
  PortalOrderStatus,
  PortalOrderPaymentStatus,
} from "@/lib/portal/commerce-data-access";

export const metadata: Metadata = {
  title: "Orders | Client Portal",
  description: "Review and manage customer orders",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams?: Promise<{
    status?: string;
    paymentStatus?: string;
    q?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 25;

const ORDER_STATUS_VALUES = new Set<string>([
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);
const PAYMENT_STATUS_VALUES = new Set<string>([
  "all",
  "pending",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
]);

export default async function PortalOrdersPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;
  const sp = (await searchParams) ?? {};

  await verifyPortalModuleAccess(user, siteId, "ecommerce", "canManageOrders");

  const status = (
    sp.status && ORDER_STATUS_VALUES.has(sp.status) ? sp.status : "all"
  ) as PortalOrderStatus | "all";
  const paymentStatus = (
    sp.paymentStatus && PAYMENT_STATUS_VALUES.has(sp.paymentStatus)
      ? sp.paymentStatus
      : "all"
  ) as PortalOrderPaymentStatus | "all";
  const search = (sp.q ?? "").slice(0, 120);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const filter: PortalOrderListFilter = {
    status,
    paymentStatus,
    search: search || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Review, fulfill, and refund customer orders for this site"
      />
      <Suspense fallback={<PortalPanelSkeleton rows={6} />}>
        <OrdersLoader
          siteId={siteId}
          filter={filter}
          page={page}
          activeStatus={status}
          activePaymentStatus={paymentStatus}
          activeSearch={search}
        />
      </Suspense>
    </div>
  );
}

async function OrdersLoader({
  siteId,
  filter,
  page,
  activeStatus,
  activePaymentStatus,
  activeSearch,
}: {
  siteId: string;
  filter: PortalOrderListFilter;
  page: number;
  activeStatus: string;
  activePaymentStatus: string;
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
    const orders = await dal.orders.list(siteId, filter);
    const hasMore = orders.length === (filter.limit ?? PAGE_SIZE);
    return (
      <OrdersListClient
        siteId={siteId}
        orders={orders}
        currentPage={page}
        pageSize={filter.limit ?? PAGE_SIZE}
        hasMore={hasMore}
        activeStatus={activeStatus}
        activePaymentStatus={activePaymentStatus}
        activeSearch={activeSearch}
      />
    );
  } catch (err) {
    return (
      <PortalErrorState
        title="Couldn’t load orders"
        description={
          err instanceof Error ? err.message : "Please refresh to try again."
        }
      />
    );
  }
}
