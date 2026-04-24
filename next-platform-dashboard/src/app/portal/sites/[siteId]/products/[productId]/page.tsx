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
import { ProductDetailClient } from "./product-detail-client";

export const metadata: Metadata = {
  title: "Product | Client Portal",
};

interface PageProps {
  params: Promise<{ siteId: string; productId: string }>;
}

export default async function PortalProductDetailPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId, productId } = await params;
  await verifyPortalModuleAccess(
    user,
    siteId,
    "ecommerce",
    "canManageProducts",
  );

  return (
    <Suspense fallback={<PortalPanelSkeleton rows={8} />}>
      <ProductLoader siteId={siteId} productId={productId} />
    </Suspense>
  );
}

async function ProductLoader({
  siteId,
  productId,
}: {
  siteId: string;
  productId: string;
}) {
  try {
    const user = await requirePortalAuth();
    const session = await getPortalSession();
    const dal = createPortalDAL({
      user,
      isImpersonation: session.isImpersonating,
      impersonatorEmail: session.impersonatorEmail,
    });
    const product = await dal.products.detail(siteId, productId);
    return <ProductDetailClient siteId={siteId} product={product} />;
  } catch (err) {
    if (
      err instanceof PortalAccessDeniedError &&
      err.code === "site_not_found"
    ) {
      notFound();
    }
    return (
      <PortalErrorState
        title="Couldn’t load product"
        description={
          err instanceof Error ? err.message : "Please refresh to try again."
        }
      />
    );
  }
}
