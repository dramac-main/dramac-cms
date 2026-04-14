"use server";

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

/**
 * Create an invoice from a booking appointment.
 * Pulls appointment + service details to pre-fill the invoice form.
 */
export async function createInvoiceFromBooking(
  bookingId: string,
  siteId: string,
): Promise<{ url?: string; error?: string }> {
  const supabase = (await createClient()) as AnySupabase;

  // Fetch the appointment with service details
  const { data: appointment, error: apptErr } = await supabase
    .from("mod_bookmod01_appointments")
    .select("*, mod_bookmod01_services(name, price, currency)")
    .eq("id", bookingId)
    .single();

  if (apptErr || !appointment) {
    return { error: apptErr?.message || "Booking not found" };
  }

  const appt = appointment as Record<string, unknown>;
  const service = appt.mod_bookmod01_services as
    | { name?: string; price?: number; currency?: string }
    | null;

  const params = new URLSearchParams({
    source: "booking",
    source_id: bookingId,
    source_type: "appointment",
    client_name: (appt.customer_name as string) || "",
    client_email: (appt.customer_email as string) || "",
    currency: service?.currency || "ZMW",
    prefill: "true",
  });

  // Add service as a single line item
  if (service) {
    const lineItems = [
      {
        description: service.name || "Service",
        quantity: 1,
        unit_price_cents: service.price || 0,
        amount_cents: service.price || 0,
      },
    ];
    params.set("line_items", JSON.stringify(lineItems));
  }

  return {
    url: `/modules/invoicing/invoices/new?${params.toString()}`,
  };
}

/**
 * Link a booking deposit payment to an existing invoice.
 * Records the deposit as a partial payment against the invoice.
 */
export async function linkBookingDepositPayment(
  bookingId: string,
  invoiceId: string,
  siteId: string,
): Promise<{ paymentId?: string; error?: string }> {
  const supabase = (await createClient()) as AnySupabase;

  // Fetch the appointment to get deposit info
  const { data: appointment, error: apptErr } = await supabase
    .from("mod_bookmod01_appointments")
    .select("customer_name, customer_email, deposit_amount, deposit_paid_at")
    .eq("id", bookingId)
    .single();

  if (apptErr || !appointment) {
    return { error: apptErr?.message || "Booking not found" };
  }

  const appt = appointment as {
    customer_name?: string;
    customer_email?: string;
    deposit_amount?: number;
    deposit_paid_at?: string;
  };

  if (!appt.deposit_amount || !appt.deposit_paid_at) {
    return { error: "No deposit payment found for this booking" };
  }

  // Fetch the invoice to validate it exists
  const { data: invoice, error: invErr } = await supabase
    .from(INV_TABLES.invoices)
    .select("id, status, total_amount_cents, amount_paid_cents")
    .eq("id", invoiceId)
    .eq("site_id", siteId)
    .single();

  if (invErr || !invoice) {
    return { error: invErr?.message || "Invoice not found" };
  }

  const inv = invoice as {
    id: string;
    status: string;
    total_amount_cents: number;
    amount_paid_cents: number;
  };

  // Record the deposit as a payment
  const { data: payment, error: payErr } = await supabase
    .from(INV_TABLES.payments)
    .insert({
      site_id: siteId,
      invoice_id: invoiceId,
      amount_cents: appt.deposit_amount,
      payment_method: "deposit",
      payment_date: appt.deposit_paid_at,
      reference: `Booking deposit - ${bookingId}`,
      status: "completed",
      source: "booking",
      source_id: bookingId,
    } as Record<string, unknown>)
    .select("id")
    .single();

  if (payErr) {
    return { error: payErr.message };
  }

  // Update the invoice's paid amount
  const newPaidAmount = (inv.amount_paid_cents || 0) + appt.deposit_amount;
  const newStatus =
    newPaidAmount >= (inv.total_amount_cents || 0) ? "paid" : "partial";

  await supabase
    .from(INV_TABLES.invoices)
    .update({
      amount_paid_cents: newPaidAmount,
      status: newStatus,
    } as Record<string, unknown>)
    .eq("id", invoiceId);

  const pay = payment as { id: string } | null;
  return { paymentId: pay?.id };
}
