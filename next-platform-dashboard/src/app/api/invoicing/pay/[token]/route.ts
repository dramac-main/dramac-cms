/**
 * Public Payment API Route — INV-09
 *
 * GET  /api/invoicing/pay/[token] → Returns invoice data for payment form
 * POST /api/invoicing/pay/[token] → Creates a pending payment record
 *
 * Public — no authentication required. Token-based access.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { INV_TABLES } from "@/modules/invoicing/lib/invoicing-constants";

type SupabaseAdmin = any;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string" || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const supabase: SupabaseAdmin = createAdminClient();

    // Fetch invoice by payment token
    const { data: invoice, error } = await supabase
      .from(INV_TABLES.invoices)
      .select("*")
      .eq("payment_token", token)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Only allow payment on eligible statuses
    const payableStatuses = ["sent", "viewed", "partial", "overdue"];
    if (!payableStatuses.includes(invoice.status)) {
      return NextResponse.json(
        { error: "This invoice is not currently payable" },
        { status: 400 },
      );
    }

    // Fetch settings for branding & payment instructions
    const { data: settings } = await supabase
      .from(INV_TABLES.settings)
      .select("*")
      .eq("site_id", invoice.site_id)
      .single();

    return NextResponse.json({
      invoiceNumber: invoice.invoice_number,
      amountDue: invoice.amount_due,
      total: invoice.total,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      clientName: invoice.client_name,
      dueDate: invoice.due_date,
      paymentInstructions: settings?.payment_instructions || null,
      companyName: settings?.company_name || null,
      companyLogo: settings?.brand_logo_url || null,
      brandColor: settings?.brand_color || null,
    });
  } catch (err) {
    console.error("[invoicing/pay] GET Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string" || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const body = await request.json();
    const { paymentMethod, transactionReference, notes } = body;

    // Validate required fields
    if (
      !transactionReference ||
      typeof transactionReference !== "string" ||
      transactionReference.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Transaction reference is required" },
        { status: 400 },
      );
    }

    // Validate payment method
    const validMethods = [
      "bank_transfer",
      "mobile_money",
      "cash",
      "cheque",
      "other",
    ];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    const supabase: SupabaseAdmin = createAdminClient();

    // Fetch invoice by payment token
    const { data: invoice, error } = await supabase
      .from(INV_TABLES.invoices)
      .select("*")
      .eq("payment_token", token)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Only allow payment on eligible statuses
    const payableStatuses = ["sent", "viewed", "partial", "overdue"];
    if (!payableStatuses.includes(invoice.status)) {
      return NextResponse.json(
        { error: "This invoice is not currently payable" },
        { status: 400 },
      );
    }

    if (invoice.amount_due <= 0) {
      return NextResponse.json(
        { error: "This invoice has no amount due" },
        { status: 400 },
      );
    }

    // Generate payment number
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from(INV_TABLES.payments)
      .select("id", { count: "exact", head: true })
      .eq("site_id", invoice.site_id);
    const seq = String((count || 0) + 1).padStart(4, "0");
    const paymentNumber = `PAY-${year}-${seq}`;

    // Create PENDING payment record (not completed — requires manual verification)
    const { data: payment, error: payError } = await supabase
      .from(INV_TABLES.payments)
      .insert({
        invoice_id: invoice.id,
        site_id: invoice.site_id,
        payment_number: paymentNumber,
        amount: invoice.amount_due,
        currency: invoice.currency,
        exchange_rate: invoice.exchange_rate || 1,
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: paymentMethod,
        transaction_reference: transactionReference.trim(),
        notes: notes ? String(notes).slice(0, 500) : null,
        status: "pending",
        ip_address:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          null,
      })
      .select("id, payment_number")
      .single();

    if (payError) {
      console.error("[invoicing/pay] Payment insert error:", payError);
      return NextResponse.json(
        { error: "Failed to record payment" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from(INV_TABLES.invoiceActivity).insert({
      invoice_id: invoice.id,
      site_id: invoice.site_id,
      action: "payment_submitted",
      description: `Client submitted payment ${paymentNumber} via ${paymentMethod} (ref: ${transactionReference.trim()})`,
      ip_address:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        null,
    });

    return NextResponse.json({
      success: true,
      paymentNumber: payment.payment_number,
      paymentId: payment.id,
      status: "pending",
    });
  } catch (err) {
    console.error("[invoicing/pay] POST Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
