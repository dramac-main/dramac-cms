import { createAdminClient } from "@/lib/supabase/admin";
import { INV_TABLES, DEFAULT_EXPENSE_CATEGORIES } from "./invoicing-constants";
import { getAutoPopulateData } from "../actions/settings-actions";

/**
 * Seed default invoicing settings when the invoicing module is first installed for a site.
 * Creates: settings row, default 16% VAT tax rate, default expense categories.
 * Follows the same pattern as seedMarketingSettings for marketing.
 */
export async function seedDefaultInvoicingSettings(siteId: string): Promise<void> {
  const supabase = createAdminClient();

  // Check if settings already exist for this site
  const { count } = await (supabase as any)
    .from(INV_TABLES.settings)
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId);

  if ((count || 0) > 0) return; // Already seeded

  // 1. Create default tax rate (16% VAT)
  const { data: taxRate } = await (supabase as any)
    .from(INV_TABLES.taxRates)
    .insert({
      site_id: siteId,
      name: "VAT",
      rate: 16.0,
      type: "exclusive",
      is_compound: false,
      is_default: true,
      description: "Value Added Tax (16%)",
      is_active: true,
      sort_order: 0,
    })
    .select("id")
    .single();

  // 2. Create settings row with defaults
  await (supabase as any).from(INV_TABLES.settings).insert({
    site_id: siteId,
    invoice_prefix: "INV",
    invoice_next_number: 1,
    invoice_number_format: "{prefix}-{year}-{number}",
    invoice_padding: 4,
    credit_note_prefix: "CN",
    credit_note_next_number: 1,
    bill_prefix: "BILL",
    bill_next_number: 1,
    po_prefix: "PO",
    po_next_number: 1,
    default_currency: "ZMW",
    default_payment_terms_days: 30,
    default_payment_terms_label: "Net 30",
    default_tax_rate_id: taxRate?.id || null,
    late_fee_enabled: false,
    late_fee_type: "percentage",
    late_fee_amount: 200,
    late_fee_grace_days: 7,
    overdue_reminder_enabled: true,
    overdue_reminder_schedule: [7, 14, 30],
    brand_color: "#000000",
    online_payment_enabled: false,
    timezone: "Africa/Lusaka",
    metadata: {},
  });

  // 3. Create default expense categories
  const categories = DEFAULT_EXPENSE_CATEGORIES.map((cat, index) => ({
    site_id: siteId,
    name: cat.name,
    color: cat.color,
    icon: cat.icon,
    is_active: true,
    sort_order: index,
  }));

  await (supabase as any).from(INV_TABLES.expenseCategories).insert(categories);

  // 4. Auto-populate company info from site branding
  try {
    const brandingData = await getAutoPopulateData(siteId);
    if (brandingData) {
      const updates: Record<string, string> = {};
      if (brandingData.companyName) updates.company_name = brandingData.companyName;
      if (brandingData.companyEmail) updates.company_email = brandingData.companyEmail;
      if (brandingData.companyPhone) updates.company_phone = brandingData.companyPhone;
      if (brandingData.companyWebsite) updates.company_website = brandingData.companyWebsite;
      if (brandingData.companyAddress) updates.company_address = brandingData.companyAddress;
      if (brandingData.companyTaxId) updates.company_tax_id = brandingData.companyTaxId;
      if (brandingData.brandColor && brandingData.brandColor !== "#000000") {
        updates.brand_color = brandingData.brandColor;
      }
      if (Object.keys(updates).length > 0) {
        await (supabase as any)
          .from(INV_TABLES.settings)
          .update(updates)
          .eq("site_id", siteId);
      }
    }
  } catch (err) {
    console.warn("[Invoicing] Auto-populate from branding failed (non-fatal):", err);
  }

  console.log(`[Invoicing] Default settings, VAT rate, and expense categories seeded for site ${siteId}`);
}
