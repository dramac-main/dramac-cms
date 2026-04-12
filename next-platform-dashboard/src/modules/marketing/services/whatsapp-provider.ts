/**
 * WhatsApp Provider Service
 *
 * Phase MKT-08: SMS & WhatsApp Channel (Foundation)
 *
 * Meta Cloud API (WhatsApp Business) implementation.
 * Marketing messages require pre-approved templates.
 */

import { createClient } from "@/lib/supabase/server";
import { MKT_TABLES } from "../lib/marketing-constants";
import type {
  WhatsAppProvider,
  WhatsAppSendResult,
  WhatsAppTemplateComponent,
  WhatsAppProviderConfig,
  WhatsAppTemplate,
} from "../types";

// ============================================================================
// META CLOUD API WHATSAPP PROVIDER
// ============================================================================

class MetaWhatsAppProvider implements WhatsAppProvider {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion = "v18.0";

  constructor(config: WhatsAppProviderConfig) {
    this.phoneNumberId = config.phoneNumberId || "";
    this.accessToken = config.accessToken || "";
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string,
    components?: WhatsAppTemplateComponent[],
  ): Promise<WhatsAppSendResult> {
    if (!this.phoneNumberId || !this.accessToken) {
      return { success: false, error: "WhatsApp provider not configured" };
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload: Record<string, unknown> = {
        messaging_product: "whatsapp",
        to: to.replace(/[^0-9]/g, ""), // Strip non-numeric
        type: "template",
        template: {
          name: templateName,
          language: { code: language },
          ...(components && components.length > 0 ? { components } : {}),
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error?.message || `WhatsApp API error: ${response.status}`,
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (err: any) {
      console.error("[WhatsApp] Send template error:", err);
      return { success: false, error: err.message };
    }
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppSendResult> {
    if (!this.phoneNumberId || !this.accessToken) {
      return { success: false, error: "WhatsApp provider not configured" };
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: "whatsapp",
        to: to.replace(/[^0-9]/g, ""),
        type: "text",
        text: { body: text },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error?.message || `WhatsApp API error: ${response.status}`,
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (err: any) {
      console.error("[WhatsApp] Send text error:", err);
      return { success: false, error: err.message };
    }
  }
}

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

export async function getWhatsAppProvider(
  siteId: string,
): Promise<WhatsAppProvider | null> {
  const supabase = await createClient();
  const { data: settings } = await (supabase as any)
    .from(MKT_TABLES.settings)
    .select("metadata")
    .eq("site_id", siteId)
    .single();

  if (!settings?.metadata?.whatsapp_phone_number_id) {
    return null;
  }

  const config: WhatsAppProviderConfig = {
    businessAccountId: settings.metadata.whatsapp_business_account_id,
    phoneNumberId: settings.metadata.whatsapp_phone_number_id,
    accessToken: settings.metadata.whatsapp_access_token,
    approvedTemplates: settings.metadata.whatsapp_templates || [],
  };

  return new MetaWhatsAppProvider(config);
}

/**
 * Get configured WhatsApp templates from settings
 */
export async function getWhatsAppTemplates(
  siteId: string,
): Promise<WhatsAppTemplate[]> {
  const supabase = await createClient();
  const { data: settings } = await (supabase as any)
    .from(MKT_TABLES.settings)
    .select("metadata")
    .eq("site_id", siteId)
    .single();

  return settings?.metadata?.whatsapp_templates || [];
}
