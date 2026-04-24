/**
 * Portal Products — portal-first list page (Session 6A).
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createPortalDAL } from "@/lib/portal/data-access";
import { PageHeader } from "@/components/layout/page-header";
import { PortalPanelSkeleton } from "@/components/portal/patterns/portal-panel-skeleton";
import { PortalErrorState } from "@/components/portal/patterns/portal-error-state";
import { ProductsListClient } from "./products-list-client";
import type { PortalProductListFilter } from "@/lib/portal/commerce-data-access";

export const metadata: Metadata = {
  title: "Products | Client Portal",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams?: Promise<{
    status?: string;
    q?: string;
    lowStock?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 25;
const PRODUCT_STATUS_VALUES = new Set<string>([
  "all",
  "active",
  "draft",
  "archived",
]);

export default async function PortalProductsPage({
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
    "canManageProducts",
  );

  const status = (
    sp.status && PRODUCT_STATUS_VALUES.has(sp.status) ? sp.status : "all"
  ) as "all" | "active" | "draft" | "archived";
  const search = (sp.q ?? "").slice(0, 120);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const lowStockOnly = sp.lowStock === "true";

  const filter: PortalProductListFilter = {
    status,
    search: search || undefined,
    lowStockOnly,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Browse catalog, monitor stock, and adjust inventory"
      />
      <Suspense fallback={<PortalPanelSkeleton rows={6} />}>
        <ProductsLoader
          siteId={siteId}
          filter={filter}
          page={page}
          activeStatus={status}
          activeSearch={search}
          lowStockOnly={lowStockOnly}
        />
      </Suspense>
    </div>
  );
}

async function ProductsLoader({
  siteId,
  filter,
  page,
  activeStatus,
  activeSearch,
  lowStockOnly,
}: {
  siteId: string;
  filter: PortalProductListFilter;
  page: number;
  activeStatus: string;
  activeSearch: string;
  lowStockOnly: boolean;
}) {
  try {
    const user = await requirePortalAuth();
    const session = await getPortalSession();
    const dal = createPortalDAL({
      user,
      isImpersonation: session.isImpersonating,
      impersonatorEmail: session.impersonatorEmail,
    });
    const products = await dal.products.list(siteId, filter);
    const hasMore = products.length === (filter.limit ?? PAGE_SIZE);
    return (
      <ProductsListClient
        siteId={siteId}
        products={products}
        currentPage={page}
        pageSize={filter.limit ?? PAGE_SIZE}
        hasMore={hasMore}
        activeStatus={activeStatus}
        activeSearch={activeSearch}
        lowStockOnly={lowStockOnly}
      />
    );
  } catch (err) {
    return (
      <PortalErrorState
        title="Couldn’t load products"
        description={
          err instanceof Error ? err.message : "Please refresh to try again."
        }
      />
    );
  }
}
