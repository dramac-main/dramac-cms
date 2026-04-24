import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createPortalDAL, PortalAccessDeniedError } from "@/lib/portal/data-access";
import { PortalPanelSkeleton } from "@/components/portal/patterns/portal-panel-skeleton";
import { PortalErrorState } from "@/components/portal/patterns/portal-error-state";
import { OrderDetailClient } from "./order-detail-client";

export const metadata: Metadata = {
  title: "Order | Client Portal",
};

interface PageProps {
  params: Promise<{ siteId: string; orderId: string }>;
}

export default async function PortalOrderDetailPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId, orderId } = await params;
  await verifyPortalModuleAccess(user, siteId, "ecommerce", "canManageOrders");

  return (
    <Suspense fallback={<PortalPanelSkeleton rows={10} />}>
      <OrderLoader siteId={siteId} orderId={orderId} />
    </Suspense>
  );
}

async function OrderLoader({
  siteId,
  orderId,
}: {
  siteId: string;
  orderId: string;
}) {
  try {
    const user = await requirePortalAuth();
    const session = await getPortalSession();
    const dal = createPortalDAL({
      user,
      isImpersonation: session.isImpersonating,
      impersonatorEmail: session.impersonatorEmail,
    });
    const order = await dal.orders.detail(siteId, orderId);
    return <OrderDetailClient siteId={siteId} order={order} />;
  } catch (err) {
    if (err instanceof PortalAccessDeniedError && err.code === "site_not_found") {
      notFound();
    }
    return (
      <PortalErrorState
        title="Couldn’t load order"
        description={
          err instanceof Error ? err.message : "Please refresh to try again."
        }
      />
    );
  }
}
