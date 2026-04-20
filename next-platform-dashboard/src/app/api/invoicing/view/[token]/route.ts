/**
 * Public Invoice View API Route — INV-02
 *
 * GET /api/invoicing/view/[token]
 * Public — no authentication required.
 * Returns invoice data for public viewing via view token.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import { INV_TABLES } from "@/modules/invoicing/lib/invoicing-constants";
import type {
  Invoice,
  InvoiceLineItem,
} from "@/modules/invoicing/types/invoice-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string" || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const supabase = createAdminClient() as any;

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

    // Record the view (update status if sent → viewed)
    if (invoice.status === "sent") {
      await supabase
        .from(INV_TABLES.invoices)
        .update({
          status: "viewed",
          viewed_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);

      // Log activity
      await supabase.from(INV_TABLES.invoiceActivity).insert({
        invoice_id: invoice.id,
        site_id: invoice.site_id,
        action: "viewed",
        description: "Invoice viewed via public link",
        ip_address:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          null,
      });
    }

    // Map using standard mapRecord / mapRecords helpers
    const inv = mapRecord<Invoice>(invoice);
    const items = mapRecords<InvoiceLineItem>(lineItems ?? []);

    const result = {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: invoice.status === "sent" ? "viewed" : inv.status,
      clientName: inv.clientName,
      clientEmail: inv.clientEmail,
      clientPhone: inv.clientPhone,
      clientAddress: inv.clientAddress,
      clientCompany: invoice.client_company ?? null,
      currency: inv.currency,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      subtotal: inv.subtotal,
      discountTotal: inv.discountAmount,
      taxTotal: inv.taxAmount,
      total: inv.total,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
      notes: inv.notes,
      terms: inv.terms,
      reference: inv.reference,
      lineItems: items.map((li) => ({
        id: li.id,
        invoiceId: li.invoiceId,
        name: li.name,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        discountType: li.discountType,
        discountValue: li.discountValue,
        discountAmount: li.discountAmount,
        taxRate: li.taxRate,
        taxAmount: li.taxAmount,
        subtotal: li.subtotal,
        total: li.total,
        sortOrder: li.sortOrder,
      })),
      settings: settings
        ? {
            companyName: settings.company_name,
            companyAddress: settings.company_address,
            companyPhone: settings.company_phone,
            companyEmail: settings.company_email,
            companyLogo: settings.brand_logo_url,
            brandColor: settings.brand_color,
            paymentInstructions: settings.payment_instructions,
            invoiceFooter: settings.metadata?.invoiceFooter ?? null,
            taxNumber: settings.company_tax_id,
          }
        : null,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[invoicing/view] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
