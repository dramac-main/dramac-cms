/**
 * Public Payment Receipt API Route — INV-09
 *
 * GET /api/invoicing/receipt/[token]
 * Returns payment receipt data by payment token (payment_number used as lookup).
 *
 * Public — no authentication required.
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

    if (!token || typeof token !== "string" || token.length < 5) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const supabase: SupabaseAdmin = createAdminClient();

    // Fetch payment by ID or payment number
    const { data: payment, error } = await supabase
      .from(INV_TABLES.payments)
      .select("*")
      .or(`id.eq.${token},payment_number.eq.${token}`)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Only show completed or pending payments
    if (payment.status === "voided") {
      return NextResponse.json(
        { error: "This payment has been voided" },
        { status: 400 },
      );
    }

    // Fetch the related invoice
    const { data: invoice } = await supabase
      .from(INV_TABLES.invoices)
      .select(
        "invoice_number, client_name, client_email, client_company, currency, total, amount_paid, amount_due, site_id",
      )
      .eq("id", payment.invoice_id)
      .single();

    // Fetch settings for branding
    const siteId = invoice?.site_id || payment.site_id;
    const { data: settings } = await supabase
      .from(INV_TABLES.settings)
      .select(
        "company_name, company_address, company_phone, company_email, brand_logo_url, brand_color",
      )
      .eq("site_id", siteId)
      .single();

    return NextResponse.json({
      receipt: {
        paymentNumber: payment.payment_number,
        amount: payment.amount,
        currency: payment.currency,
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        transactionReference: payment.transaction_reference,
        status: payment.status,
        notes: payment.notes,
        createdAt: payment.created_at,
      },
      invoice: invoice
        ? {
            invoiceNumber: invoice.invoice_number,
            clientName: invoice.client_name,
            clientEmail: invoice.client_email,
            clientCompany: invoice.client_company,
            total: invoice.total,
            amountPaid: invoice.amount_paid,
            amountDue: invoice.amount_due,
          }
        : null,
      settings: settings
        ? {
            companyName: settings.company_name,
            companyAddress: settings.company_address,
            companyPhone: settings.company_phone,
            companyEmail: settings.company_email,
            companyLogo: settings.brand_logo_url,
            brandColor: settings.brand_color,
          }
        : null,
    });
  } catch (err) {
    console.error("[invoicing/receipt] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
