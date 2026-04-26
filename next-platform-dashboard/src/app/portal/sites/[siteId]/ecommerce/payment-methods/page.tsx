import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentMethodsForm } from "@/components/portal/payments/payment-methods-form";
import { parsePaymentMethods } from "@/modules/live-chat/lib/payment-method-parser";

export const metadata: Metadata = {
  title: "Store Payment Methods | Portal",
  description: "Manage manual payment options for your online store",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export default async function EcommercePaymentMethodsPage({
  params,
}: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  await verifyPortalModuleAccess(
    user,
    siteId,
    "ecommerce",
    "canManageProducts",
  );

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, name")
    .eq("id", siteId)
    .maybeSingle();
  if (!site) notFound();

  const { data: settings } = await admin
    .from("mod_ecommod01_settings")
    .select("manual_payment_instructions")
    .eq("site_id", siteId)
    .maybeSingle();

  const instructions = settings?.manual_payment_instructions ?? "";
  const parsed = parsePaymentMethods(instructions);
  const initial = parsed
    ? parsed.map((m) => ({ label: m.label, details: m.details }))
    : instructions
      ? [{ label: "Payment Instructions", details: instructions }]
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store payment methods"
        description={`How customers pay for orders on ${site.name}. Each method appears as a button in Chiko chat.`}
      />
      <PaymentMethodsForm
        siteId={siteId}
        surface="ecommerce"
        initial={initial}
      />
    </div>
  );
}
