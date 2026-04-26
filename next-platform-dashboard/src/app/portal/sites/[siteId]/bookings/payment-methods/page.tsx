import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentMethodsForm } from "@/components/portal/payments/payment-methods-form";
import { parsePaymentMethods } from "@/modules/live-chat/lib/payment-method-parser";

export const metadata: Metadata = {
  title: "Booking Payment Methods | Portal",
  description: "Manage manual payment options for bookings",
};

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export default async function BookingPaymentMethodsPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  await verifyPortalModuleAccess(user, siteId, "booking", "canManageBookings");

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, name")
    .eq("id", siteId)
    .maybeSingle();
  if (!site) notFound();

  const { data: settings } = await admin
    .from("mod_bookmod01_settings")
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
        title="Booking payment methods"
        description={`How customers pay for bookings on ${site.name}. Each method appears as a button in Chiko chat.`}
      />
      <PaymentMethodsForm
        siteId={siteId}
        surface="bookings"
        initial={initial}
      />
    </div>
  );
}
