/**
 * Marketing Module - SMS Actions
 *
 * Phase MKT-08: SMS & WhatsApp Channel (Foundation)
 *
 * Server actions for SMS campaigns, sending, and settings management.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import { MKT_TABLES } from "../lib/marketing-constants";
import {
  getSMSProvider,
  calculateSMSSegments,
  personalizeSMS,
} from "../services/sms-provider";
import {
  getWhatsAppProvider,
  getWhatsAppTemplates,
} from "../services/whatsapp-provider";
import type {
  Campaign,
  SMSCampaignContent,
  WhatsAppTemplate,
  MarketingSettings,
} from "../types";

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ─── SMS Campaign Actions ──────────────────────────────────────

export async function sendSMSMessage(
  siteId: string,
  to: string,
  message: string,
  options?: { campaignId?: string; subscriberId?: string },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = await getSMSProvider(siteId);
  if (!provider) {
    return {
      success: false,
      error:
        "SMS provider not configured. Please configure in Marketing Settings → SMS/WhatsApp.",
    };
  }

  const result = await provider.sendSMS(to, message, {
    campaignId: options?.campaignId,
    subscriberId: options?.subscriberId,
  });

  // Record in sending stats
  if (result.success) {
    const supabase = await getModuleClient();
    const today = new Date().toISOString().split("T")[0];

    const { data: existingStats } = await supabase
      .from(MKT_TABLES.sendingStats)
      .select("id, sms_sent")
      .eq("site_id", siteId)
      .eq("date", today)
      .single();

    if (existingStats) {
      await supabase
        .from(MKT_TABLES.sendingStats)
        .update({ sms_sent: (existingStats.sms_sent || 0) + 1 })
        .eq("id", existingStats.id);
    } else {
      await supabase.from(MKT_TABLES.sendingStats).insert({
        site_id: siteId,
        date: today,
        sms_sent: 1,
        sms_delivered: 0,
        sms_failed: 0,
        emails_sent: 0,
        emails_delivered: 0,
        emails_bounced: 0,
        emails_complained: 0,
      });
    }
  }

  return result;
}

export async function sendWhatsAppTemplateMessage(
  siteId: string,
  to: string,
  templateName: string,
  language: string,
  components?: any[],
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = await getWhatsAppProvider(siteId);
  if (!provider) {
    return {
      success: false,
      error:
        "WhatsApp provider not configured. Please configure in Marketing Settings → SMS/WhatsApp.",
    };
  }

  return provider.sendTemplateMessage(to, templateName, language, components);
}

export async function getWhatsAppTemplateList(
  siteId: string,
): Promise<WhatsAppTemplate[]> {
  return getWhatsAppTemplates(siteId);
}

// ─── SMS/WhatsApp Settings ─────────────────────────────────────

export async function getSMSWhatsAppSettings(siteId: string): Promise<{
  smsProvider: string;
  smsConfigured: boolean;
  whatsappConfigured: boolean;
  smsDailyLimit: number;
  twilioPhoneNumber?: string;
  whatsappPhoneNumberId?: string;
}> {
  const supabase = await getModuleClient();
  const { data: settings } = await supabase
    .from(MKT_TABLES.settings)
    .select("metadata")
    .eq("site_id", siteId)
    .single();

  const metadata = settings?.metadata || {};

  return {
    smsProvider: metadata.sms_provider || "twilio",
    smsConfigured: !!(
      metadata.twilio_account_sid &&
      metadata.twilio_auth_token &&
      metadata.twilio_phone_number
    ),
    whatsappConfigured: !!(
      metadata.whatsapp_phone_number_id && metadata.whatsapp_access_token
    ),
    smsDailyLimit: metadata.sms_daily_limit || 500,
    twilioPhoneNumber: metadata.twilio_phone_number
      ? `****${metadata.twilio_phone_number.slice(-4)}`
      : undefined,
    whatsappPhoneNumberId: metadata.whatsapp_phone_number_id
      ? `****${metadata.whatsapp_phone_number_id.slice(-4)}`
      : undefined,
  };
}

export async function updateSMSSettings(
  siteId: string,
  settings: {
    smsProvider?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioPhoneNumber?: string;
    smsDailyLimit?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient();

  const { data: existing } = await supabase
    .from(MKT_TABLES.settings)
    .select("metadata")
    .eq("site_id", siteId)
    .single();

  const metadata = existing?.metadata || {};
  const updated = {
    ...metadata,
    ...(settings.smsProvider !== undefined && {
      sms_provider: settings.smsProvider,
    }),
    ...(settings.twilioAccountSid !== undefined && {
      twilio_account_sid: settings.twilioAccountSid,
    }),
    ...(settings.twilioAuthToken !== undefined && {
      twilio_auth_token: settings.twilioAuthToken,
    }),
    ...(settings.twilioPhoneNumber !== undefined && {
      twilio_phone_number: settings.twilioPhoneNumber,
    }),
    ...(settings.smsDailyLimit !== undefined && {
      sms_daily_limit: settings.smsDailyLimit,
    }),
  };

  const { error } = await supabase
    .from(MKT_TABLES.settings)
    .update({ metadata: updated })
    .eq("site_id", siteId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateWhatsAppSettings(
  siteId: string,
  settings: {
    businessAccountId?: string;
    phoneNumberId?: string;
    accessToken?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient();

  const { data: existing } = await supabase
    .from(MKT_TABLES.settings)
    .select("metadata")
    .eq("site_id", siteId)
    .single();

  const metadata = existing?.metadata || {};
  const updated = {
    ...metadata,
    ...(settings.businessAccountId !== undefined && {
      whatsapp_business_account_id: settings.businessAccountId,
    }),
    ...(settings.phoneNumberId !== undefined && {
      whatsapp_phone_number_id: settings.phoneNumberId,
    }),
    ...(settings.accessToken !== undefined && {
      whatsapp_access_token: settings.accessToken,
    }),
  };

  const { error } = await supabase
    .from(MKT_TABLES.settings)
    .update({ metadata: updated })
    .eq("site_id", siteId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Bulk SMS Campaign Send ────────────────────────────────────

export async function sendSMSCampaignBatch(
  siteId: string,
  campaignId: string,
  message: string,
  recipients: Array<{
    subscriberId: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }>,
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const provider = await getSMSProvider(siteId);
  if (!provider) {
    return {
      sent: 0,
      failed: recipients.length,
      errors: ["SMS provider not configured"],
    };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    const personalizedMessage = personalizeSMS(message, {
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      email: recipient.email,
      phone: recipient.phone,
    });

    const result = await provider.sendSMS(
      recipient.phone,
      personalizedMessage,
      {
        campaignId,
        subscriberId: recipient.subscriberId,
      },
    );

    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.error) errors.push(`${recipient.phone}: ${result.error}`);
    }
  }

  return { sent, failed, errors };
}
