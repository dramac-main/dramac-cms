import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createPortalDAL } from "@/lib/portal/data-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentProofsQueue } from "./proofs-queue";

export const metadata: Metadata = {
  title: "Payment Proofs | Client Portal",
  description: "Review customer payment proofs",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams?: Promise<{ status?: string }>;
}

export default async function PortalPaymentProofsPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;
  const sp = (await searchParams) ?? {};

  await verifyPortalModuleAccess(user, siteId, "ecommerce", "canManageOrders");

  const status = (
    ["pending", "approved", "rejected", "all"].includes(sp.status ?? "")
      ? sp.status
      : "pending"
  ) as "pending" | "approved" | "rejected" | "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Proofs"
        description="Review customer-submitted payment receipts for manual orders"
      />
      <Suspense fallback={<QueueSkeleton />}>
        <QueueLoader siteId={siteId} status={status} />
      </Suspense>
    </div>
  );
}

async function QueueLoader({
  siteId,
  status,
}: {
  siteId: string;
  status: "pending" | "approved" | "rejected" | "all";
}) {
  const user = await requirePortalAuth();
  const session = await getPortalSession();
  const dal = createPortalDAL({
    user,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
  });
  const proofs = await dal.payments.listProofs(siteId, {
    status,
    limit: 100,
  });
  return <PaymentProofsQueue siteId={siteId} proofs={proofs} activeStatus={status} />;
}

function QueueSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-5 w-48" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </CardContent>
    </Card>
  );
}
