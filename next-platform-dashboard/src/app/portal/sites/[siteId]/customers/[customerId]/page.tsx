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
import { CustomerDetailClient } from "./customer-detail-client";

export const metadata: Metadata = {
  title: "Customer | Client Portal",
};

interface PageProps {
  params: Promise<{ siteId: string; customerId: string }>;
}

export default async function PortalCustomerDetailPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId, customerId } = await params;
  await verifyPortalModuleAccess(
    user,
    siteId,
    "ecommerce",
    "canManageCustomers",
  );

  return (
    <Suspense fallback={<PortalPanelSkeleton rows={8} />}>
      <CustomerLoader siteId={siteId} customerId={customerId} />
    </Suspense>
  );
}

async function CustomerLoader({
  siteId,
  customerId,
}: {
  siteId: string;
  customerId: string;
}) {
  try {
    const user = await requirePortalAuth();
    const session = await getPortalSession();
    const dal = createPortalDAL({
      user,
      isImpersonation: session.isImpersonating,
      impersonatorEmail: session.impersonatorEmail,
    });
    const customer = await dal.customers.detail(siteId, customerId);
    return <CustomerDetailClient siteId={siteId} customer={customer} />;
  } catch (err) {
    if (
      err instanceof PortalAccessDeniedError &&
      err.code === "site_not_found"
    ) {
      notFound();
    }
    return (
      <PortalErrorState
        title="Couldn’t load customer"
        description={
          err instanceof Error ? err.message : "Please refresh to try again."
        }
      />
    );
  }
}
