/**
 * SMS Provider Service
 *
 * Phase MKT-08: SMS & WhatsApp Channel (Foundation)
 *
 * Abstract SMS provider layer with Twilio implementation.
 * Provider can be swapped via settings (Twilio, Vonage, MessageBird).
 */

import { createClient } from "@/lib/supabase/server";
import { MKT_TABLES } from "../lib/marketing-constants";
import type {
  SMSProvider,
  SMSSendResult,
  DeliveryStatus,
  SMSOptions,
  SMSProviderConfig,
} from "../types";

// ============================================================================
// TWILIO SMS PROVIDER
// ============================================================================

class TwilioSMSProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(config: SMSProviderConfig) {
    this.accountSid = config.accountSid || "";
    this.authToken = config.authToken || "";
    this.fromNumber = config.phoneNumber || "";
  }

  async sendSMS(
    to: string,
    message: string,
    options?: SMSOptions,
  ): Promise<SMSSendResult> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      return { success: false, error: "SMS provider not configured" };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: to,
        From: this.fromNumber,
        Body: message,
      });

      if (options?.campaignId) {
        body.append(
          "StatusCallback",
          `${process.env.NEXT_PUBLIC_APP_URL}/api/marketing/webhooks/sms-status`,
        );
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${this.accountSid}:${this.authToken}`).toString(
              "base64",
            ),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Twilio error: ${response.status}`,
        };
      }

      return {
        success: true,
        messageId: data.sid,
        segments: data.num_segments ? parseInt(data.num_segments) : 1,
      };
    } catch (err: any) {
      console.error("[SMS] Send error:", err);
      return { success: false, error: err.message };
    }
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages/${encodeURIComponent(messageId)}.json`;
      const response = await fetch(url, {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${this.accountSid}:${this.authToken}`).toString(
              "base64",
            ),
        },
      });

      const data = await response.json();

      const statusMap: Record<string, DeliveryStatus["status"]> = {
        queued: "queued",
        sending: "sent",
        sent: "sent",
        delivered: "delivered",
        failed: "failed",
        undelivered: "undelivered",
      };

      return {
        messageId,
        status: statusMap[data.status] || "queued",
        errorCode: data.error_code?.toString(),
        errorMessage: data.error_message,
        updatedAt: data.date_updated || new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        messageId,
        status: "failed",
        errorMessage: err.message,
        updatedAt: new Date().toISOString(),
      };
    }
  }
}

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

export async function getSMSProvider(
  siteId: string,
): Promise<SMSProvider | null> {
  const supabase = await createClient();
  const { data: settings } = await (supabase as any)
    .from(MKT_TABLES.settings)
    .select("metadata")
    .eq("site_id", siteId)
    .single();

  if (!settings?.metadata?.sms_provider) {
    return null;
  }

  const config: SMSProviderConfig = {
    provider: settings.metadata.sms_provider || "twilio",
    accountSid: settings.metadata.twilio_account_sid,
    authToken: settings.metadata.twilio_auth_token,
    phoneNumber: settings.metadata.twilio_phone_number,
    dailyLimit: settings.metadata.sms_daily_limit || 500,
  };

  switch (config.provider) {
    case "twilio":
      return new TwilioSMSProvider(config);
    default:
      return null;
  }
}

// ============================================================================
// SMS UTILITIES (re-exported from sms-utils.ts for backward compatibility)
// ============================================================================

export { calculateSMSSegments, personalizeSMS } from "./sms-utils";
