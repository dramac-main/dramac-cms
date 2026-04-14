/**
 * Portal Invoice Detail Page — INV-09
 *
 * Fetches invoice data server-side and renders the detail component.
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";
import { PortalInvoiceDetail } from "@/modules/invoicing/components/portal-invoice-detail";
import { createAdminClient } from "@/lib/supabase/admin";
import { INV_TABLES } from "@/modules/invoicing/lib/invoicing-constants";

interface PageProps {
  params: Promise<{ siteId: string; invoiceId: string }>;
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

async function InvoiceDetailContent({
  siteId,
  invoiceId,
  clientId,
}: {
  siteId: string;
  invoiceId: string;
  clientId: string;
}) {
  const supabase = createAdminClient();

  // Fetch invoice — scoped to this client's contact
  const { data: invoice, error } = await (supabase as any)
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", invoiceId)
    .eq("site_id", siteId)
    .eq("contact_id", clientId)
    .single();

  if (error || !invoice) {
    notFound();
  }

  // Fetch line items
  const { data: lineItems } = await (supabase as any)
    .from(INV_TABLES.invoiceLineItems)
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  // Fetch payments
  const { data: payments } = await (supabase as any)
    .from(INV_TABLES.payments)
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("payment_date", { ascending: false });

  return (
    <PortalInvoiceDetail
      siteId={siteId}
      invoiceId={invoiceId}
      invoice={invoice}
      lineItems={lineItems || []}
      payments={payments || []}
    />
  );
}

export default async function PortalInvoiceDetailPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId, invoiceId } = await params;

  const { permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "invoicing",
    "canManageInvoices",
  );

  return (
    <PortalProvider
      value={{
        isPortalView: true,
        portalUser: {
          clientId: user.clientId,
          fullName: user.fullName,
          email: user.email,
          agencyId: user.agencyId,
        },
        permissions: {
          canManageLiveChat: permissions.canManageLiveChat,
          canManageOrders: permissions.canManageOrders,
          canManageProducts: permissions.canManageProducts,
          canManageBookings: permissions.canManageBookings,
          canManageCrm: permissions.canManageCrm,
          canManageAutomation: permissions.canManageAutomation,
          canManageQuotes: permissions.canManageQuotes,
          canManageAgents: permissions.canManageAgents,
          canManageCustomers: permissions.canManageCustomers,
          canManageMarketing: permissions.canManageMarketing,
          canManageInvoices: permissions.canManageInvoices,
        },
        siteId,
      }}
    >
      <Suspense fallback={<DetailSkeleton />}>
        <InvoiceDetailContent
          siteId={siteId}
          invoiceId={invoiceId}
          clientId={user.clientId}
        />
      </Suspense>
    </PortalProvider>
  );
}
