/**
 * Email notification service for form submissions
 * Uses Resend for email delivery via the centralized email system.
 */

import { sendBrandedEmail } from '@/lib/email/send-branded-email'

export interface NotificationPayload {
  to: string[];
  subject: string;
  formName: string;
  siteId: string;
  siteName?: string;
  submissionId: string;
  submittedAt: string;
  pageUrl?: string;
  data: Record<string, unknown>;
  agencyId?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email notification for a new form submission
 */
export async function sendSubmissionNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  if (!payload.to || payload.to.length === 0) {
    return { success: false, error: "No recipients specified" };
  }

  try {
    // Format the submission data for the email
    const formattedData = formatSubmissionData(payload.data);
    
    // Build email content
    const subject = payload.subject || `New submission from ${payload.formName}`;

    // Send via centralized email system using Resend
    const fields = formattedData.map(({ key, value }) => ({
      label: key,
      value: value,
    }));

    const result = await sendBrandedEmail(payload.agencyId || null, {
      to: payload.to.map(email => ({ email })),
      emailType: 'form_submission_owner',
      data: {
        formName: payload.formName,
        siteName: payload.siteName || '',
        submittedAt: new Date(payload.submittedAt).toLocaleString('en-US', { timeZone: 'Africa/Lusaka' }),
        fields,
        dashboardUrl: payload.pageUrl || '',
      },
    });

    if (!result.success) {
      console.error("[NotificationService] Email send failed:", result.error);
      return { success: false, error: result.error };
    }

    console.log(`[NotificationService] Sent form submission email for "${payload.formName}" to ${payload.to.join(", ")}`);
    
    return { 
      success: true, 
      messageId: result.messageId 
    };
  } catch (error) {
    console.error("[NotificationService] Failed to send notification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Format submission data for display
 */
function formatSubmissionData(data: Record<string, unknown>): Array<{ key: string; value: string }> {
  return Object.entries(data)
    .filter(([key]) => !key.startsWith("_"))
    .map(([key, value]) => {
      const displayKey = key
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .trim();

      let displayValue: string;
      if (value === null || value === undefined) {
        displayValue = "(not provided)";
      } else if (typeof value === "boolean") {
        displayValue = value ? "Yes" : "No";
      } else if (typeof value === "object") {
        displayValue = JSON.stringify(value, null, 2);
      } else {
        displayValue = String(value);
      }

      return { key: displayKey, value: displayValue };
    });
}

