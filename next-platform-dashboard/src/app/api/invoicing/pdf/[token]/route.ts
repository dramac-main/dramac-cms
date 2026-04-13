/**
 * Public Invoice PDF API Route — INV-02
 *
 * GET /api/invoicing/pdf/[token]
 * Public — no authentication required.
 * Returns invoice data for PDF rendering via view token.
 * Client-side PDF generation via browser print dialog.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { INV_TABLES } from "@/modules/invoicing/lib/invoicing-constants";

type SupabaseAdmin = any;

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  entry.count++;
  return true;
}

// Cleanup stale entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 120_000);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string" || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase: SupabaseAdmin = createAdminClient();

    // Fetch invoice by view token
    const { data: invoice, error } = await supabase
      .from(INV_TABLES.invoices)
      .select("*")
      .eq("view_token", token)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Don't expose draft invoices publicly
    if (invoice.status === "draft") {
      return NextResponse.json(
        { error: "Invoice not available" },
        { status: 404 },
      );
    }

    // Fetch line items
    const { data: lineItems } = await supabase
      .from(INV_TABLES.invoiceLineItems)
      .select("*")
      .eq("invoice_id", invoice.id)
      .order("sort_order", { ascending: true });

    // Fetch settings for branding
    const { data: settings } = await supabase
      .from(INV_TABLES.settings)
      .select("*")
      .eq("site_id", invoice.site_id)
      .single();

    // Map to camelCase for PDF rendering
    const mapLineItem = (li: Record<string, unknown>) => ({
      id: li.id,
      name: li.name,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unit_price,
      taxRate: li.tax_rate,
      taxAmount: li.tax_amount,
      subtotal: li.subtotal,
      total: li.total,
      sortOrder: li.sort_order,
    });

    const result = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      status: invoice.status,
      clientName: invoice.client_name,
      clientEmail: invoice.client_email,
      clientPhone: invoice.client_phone,
      clientAddress: invoice.client_address,
      clientCompany: invoice.client_company,
      clientTaxId: invoice.client_tax_id,
      currency: invoice.currency,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      subtotal: invoice.subtotal,
      discountTotal: invoice.discount_total,
      taxTotal: invoice.tax_total,
      total: invoice.total,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      notes: invoice.notes,
      terms: invoice.terms,
      reference: invoice.reference,
      purchaseOrderNumber: invoice.purchase_order_number,
      lineItems: (lineItems ?? []).map(mapLineItem),
      settings: settings
        ? {
            companyName: settings.company_name,
            companyAddress: settings.company_address,
            companyPhone: settings.company_phone,
            companyEmail: settings.company_email,
            companyLogo: settings.brand_logo_url,
            companyWebsite: settings.company_website,
            brandColor: settings.brand_color,
            paymentInstructions: settings.payment_instructions,
            invoiceFooter: settings.metadata?.invoiceFooter ?? null,
            taxNumber: settings.company_tax_id,
          }
        : null,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[invoicing/pdf] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
