/**
 * CRM Bridge — Cross-Module Integration
 *
 * Called from public/unauthenticated contexts (e-commerce checkout,
 * booking widget, public quote forms) to create CRM contacts, deals,
 * and activities.  Uses the admin (service-role) client so it works
 * without user auth cookies.
 *
 * Every function is fire-and-forget safe — callers should `.catch()`
 * so primary flows (order creation, appointment booking) never fail
 * because of a CRM write issue.
 */
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";

const CRM_SHORT_ID = "crmmod01";
const TABLE_PREFIX = `mod_${CRM_SHORT_ID}`;

function getAdminModuleClient() {
  return createAdminClient() as any;
}

// ============================================================================
// Types
// ============================================================================

export interface BridgeContactInput {
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  source: string; // e.g. "ecommerce", "booking", "quote"
  source_details?: string; // e.g. order number, service name
  company_name?: string;
}

export interface BridgeDealInput {
  name: string;
  amount: number;
  currency: string;
  contact_id: string;
  company_id?: string | null;
  source: string;
  source_entity_id?: string; // order id, quote id, etc.
  source_entity_type?: string; // "order", "quote", "appointment"
  stage_name?: string; // target stage name (default: first open stage)
}

export interface BridgeActivityInput {
  contact_id?: string;
  deal_id?: string;
  company_id?: string;
  activity_type: string; // "note", "deal", "task", etc.
  subject: string;
  description?: string;
}

// ============================================================================
// Find or Create CRM Contact
// ============================================================================

/**
 * Finds an existing CRM contact by email for this site, or creates a new one.
 * Returns the contact id and whether it was newly created.
 */
export async function bridgeFindOrCreateContact(
  siteId: string,
  input: BridgeContactInput,
): Promise<{ contactId: string; created: boolean }> {
  const supabase = getAdminModuleClient();

  // Check if CRM tables exist (module may not be installed)
  const { error: probeError } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select("id")
    .eq("site_id", siteId)
    .limit(0);

  if (probeError) {
    // CRM module not installed for this site — skip silently
    throw new Error(`CRM module not available: ${probeError.message}`);
  }

  // Try to find existing contact by email
  const normalizedEmail = input.email.toLowerCase().trim();
  const { data: existing } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select("id")
    .eq("site_id", siteId)
    .ilike("email", normalizedEmail)
    .limit(1)
    .single();

  if (existing) {
    return { contactId: existing.id, created: false };
  }

  // Parse name into first/last
  const firstName = input.first_name || "";
  const lastName = input.last_name || "";
  if (!firstName && !lastName && input.source_details) {
    // source_details might contain a full name from some callers
  }

  // Create new contact
  const { data: contact, error } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .insert({
      site_id: siteId,
      first_name: firstName || null,
      last_name: lastName || null,
      email: normalizedEmail,
      phone: input.phone || null,
      status: "active",
      lead_status: "new",
      source: input.source,
      source_details: input.source_details || null,
      custom_fields: {},
      tags: [],
      lead_score: 0,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create CRM contact: ${error.message}`);
  }

  // Emit automation event
  await logAutomationEvent(
    siteId,
    "crm.contact.created",
    {
      id: contact.id,
      first_name: firstName,
      last_name: lastName,
      email: normalizedEmail,
      phone: input.phone,
      source: input.source,
      source_details: input.source_details,
      auto_created: true,
    },
    {
      sourceModule: "crm",
      sourceEntityType: "contact",
      sourceEntityId: contact.id,
    },
  ).catch(() => {});

  return { contactId: contact.id, created: true };
}

// ============================================================================
// Get Default Pipeline + First Stage
// ============================================================================

/**
 * Returns the default (or first available) pipeline and its first open stage.
 * Returns null if no pipeline exists.
 */
export async function bridgeGetDefaultPipelineStage(
  siteId: string,
  targetStageName?: string,
): Promise<{ pipelineId: string; stageId: string } | null> {
  const supabase = getAdminModuleClient();

  // Get default pipeline, falling back to first active pipeline
  const { data: pipelines } = await supabase
    .from(`${TABLE_PREFIX}_pipelines`)
    .select("id, is_default")
    .eq("site_id", siteId)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .limit(5);

  if (!pipelines?.length) return null;

  const pipeline = pipelines[0];

  // Get stages for this pipeline, ordered by position
  const { data: stages } = await supabase
    .from(`${TABLE_PREFIX}_pipeline_stages`)
    .select("id, name, position, stage_type")
    .eq("pipeline_id", pipeline.id)
    .order("position", { ascending: true });

  if (!stages?.length) return null;

  // Find target stage by name, or fall back to first open stage
  let targetStage = null;
  if (targetStageName) {
    targetStage = stages.find(
      (s: any) => s.name.toLowerCase() === targetStageName.toLowerCase(),
    );
  }
  if (!targetStage) {
    targetStage = stages.find((s: any) => s.stage_type === "open") || stages[0];
  }

  return { pipelineId: pipeline.id, stageId: targetStage.id };
}

// ============================================================================
// Create CRM Deal
// ============================================================================

/**
 * Creates a CRM deal linked to a contact, placed in the default pipeline.
 */
export async function bridgeCreateDeal(
  siteId: string,
  input: BridgeDealInput,
): Promise<{ dealId: string }> {
  const supabase = getAdminModuleClient();

  // Resolve pipeline + stage
  const pipelineStage = await bridgeGetDefaultPipelineStage(
    siteId,
    input.stage_name,
  );

  const { data: deal, error } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .insert({
      site_id: siteId,
      name: input.name,
      amount: input.amount,
      currency: input.currency,
      contact_id: input.contact_id,
      company_id: input.company_id || null,
      pipeline_id: pipelineStage?.pipelineId || null,
      stage_id: pipelineStage?.stageId || null,
      status: "open",
      probability: pipelineStage ? 10 : 50,
      custom_fields: {
        source_module: input.source,
        source_entity_type: input.source_entity_type || null,
        source_entity_id: input.source_entity_id || null,
      },
      tags: [input.source],
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create CRM deal: ${error.message}`);
  }

  // Emit automation event
  await logAutomationEvent(
    siteId,
    "crm.deal.created",
    {
      id: deal.id,
      name: input.name,
      amount: input.amount,
      currency: input.currency,
      contact_id: input.contact_id,
      pipeline_id: pipelineStage?.pipelineId,
      stage_id: pipelineStage?.stageId,
      source: input.source,
      auto_created: true,
    },
    {
      sourceModule: "crm",
      sourceEntityType: "deal",
      sourceEntityId: deal.id,
    },
  ).catch(() => {});

  return { dealId: deal.id };
}

// ============================================================================
// Log CRM Activity
// ============================================================================

/**
 * Creates a CRM activity for audit trail.
 */
export async function bridgeLogActivity(
  siteId: string,
  input: BridgeActivityInput,
): Promise<void> {
  const supabase = getAdminModuleClient();

  await supabase.from(`${TABLE_PREFIX}_activities`).insert({
    site_id: siteId,
    activity_type: input.activity_type,
    contact_id: input.contact_id || null,
    deal_id: input.deal_id || null,
    company_id: input.company_id || null,
    subject: input.subject,
    description: input.description || null,
  });
}

// ============================================================================
// Convenience: Full Order-to-CRM Bridge
// ============================================================================

/**
 * One-call bridge for e-commerce order → CRM contact + deal + activity.
 * Non-throwing — logs errors and returns partial results.
 */
export async function bridgeOrderToCRM(
  siteId: string,
  order: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    total: number;
    currency: string;
  },
): Promise<void> {
  try {
    // Parse customer name
    const nameParts = (order.customer_name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Find or create contact
    const { contactId } = await bridgeFindOrCreateContact(siteId, {
      first_name: firstName,
      last_name: lastName,
      email: order.customer_email,
      phone: order.customer_phone,
      source: "ecommerce",
      source_details: `Order ${order.order_number}`,
    });

    // Create deal
    const { dealId } = await bridgeCreateDeal(siteId, {
      name: `Order ${order.order_number}`,
      amount: order.total,
      currency: order.currency,
      contact_id: contactId,
      source: "ecommerce",
      source_entity_type: "order",
      source_entity_id: order.id,
    });

    // Log activity
    await bridgeLogActivity(siteId, {
      contact_id: contactId,
      deal_id: dealId,
      activity_type: "note",
      subject: `Order ${order.order_number} placed`,
      description: `Customer placed order #${order.order_number} for ${order.currency} ${order.total.toFixed(2)} via online store.`,
    });
  } catch (err) {
    console.error("[CRM Bridge] Order→CRM failed (non-blocking):", err);
  }
}

// ============================================================================
// Convenience: Full Quote-to-CRM Bridge
// ============================================================================

/**
 * One-call bridge for quote → CRM contact + deal + activity.
 */
export async function bridgeQuoteToCRM(
  siteId: string,
  quote: {
    id: string;
    quote_number: string;
    customer_name?: string;
    customer_email: string;
    customer_phone?: string;
    customer_company?: string;
    total: number;
    currency: string;
  },
): Promise<void> {
  try {
    const nameParts = (quote.customer_name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Find or create contact
    const { contactId } = await bridgeFindOrCreateContact(siteId, {
      first_name: firstName,
      last_name: lastName,
      email: quote.customer_email,
      phone: quote.customer_phone,
      source: "quote",
      source_details: `Quote ${quote.quote_number}`,
      company_name: quote.customer_company,
    });

    // Create company if company name provided
    let companyId: string | null = null;
    if (quote.customer_company) {
      const supabase = getAdminModuleClient();
      // Check if company already exists
      const { data: existingCompany } = await supabase
        .from(`${TABLE_PREFIX}_companies`)
        .select("id")
        .eq("site_id", siteId)
        .ilike("name", quote.customer_company.trim())
        .limit(1)
        .single();

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany } = await supabase
          .from(`${TABLE_PREFIX}_companies`)
          .insert({
            site_id: siteId,
            name: quote.customer_company.trim(),
            status: "active",
            account_type: "prospect",
            custom_fields: {},
            tags: ["quote"],
          })
          .select("id")
          .single();
        companyId = newCompany?.id || null;
      }

      // Link contact to company
      if (companyId) {
        await supabase
          .from(`${TABLE_PREFIX}_contacts`)
          .update({ company_id: companyId })
          .eq("id", contactId);
      }
    }

    // Create deal — place in "Proposal" stage
    const { dealId } = await bridgeCreateDeal(siteId, {
      name: `Quote ${quote.quote_number}`,
      amount: quote.total,
      currency: quote.currency,
      contact_id: contactId,
      company_id: companyId,
      source: "quote",
      source_entity_type: "quote",
      source_entity_id: quote.id,
      stage_name: "Proposal",
    });

    // Log activity
    await bridgeLogActivity(siteId, {
      contact_id: contactId,
      deal_id: dealId,
      company_id: companyId || undefined,
      activity_type: "note",
      subject: `Quote ${quote.quote_number} created`,
      description: `Quote #${quote.quote_number} created for ${quote.currency} ${quote.total.toFixed(2)}.`,
    });
  } catch (err) {
    console.error("[CRM Bridge] Quote→CRM failed (non-blocking):", err);
  }
}

// ============================================================================
// Convenience: Booking-to-CRM Bridge
// ============================================================================

/**
 * One-call bridge for booking appointment → CRM contact + activity.
 * Note: Bookings don't create deals by default (just contacts).
 */
export async function bridgeBookingToCRM(
  siteId: string,
  appointment: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    service_name: string;
    service_price?: number;
    currency?: string;
    start_time: string;
  },
): Promise<void> {
  try {
    const nameParts = (appointment.customer_name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Find or create contact
    const { contactId } = await bridgeFindOrCreateContact(siteId, {
      first_name: firstName,
      last_name: lastName,
      email: appointment.customer_email,
      phone: appointment.customer_phone,
      source: "booking",
      source_details: appointment.service_name,
    });

    // Log activity
    await bridgeLogActivity(siteId, {
      contact_id: contactId,
      activity_type: "meeting",
      subject: `Booking: ${appointment.service_name}`,
      description: `Customer booked "${appointment.service_name}" for ${new Date(appointment.start_time).toLocaleString()}.${appointment.service_price ? ` Amount: ${appointment.currency || ""} ${appointment.service_price}` : ""}`,
    });
  } catch (err) {
    console.error("[CRM Bridge] Booking→CRM failed (non-blocking):", err);
  }
}
