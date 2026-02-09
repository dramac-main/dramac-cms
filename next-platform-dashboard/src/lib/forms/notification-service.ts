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
        submittedAt: new Date(payload.submittedAt).toLocaleString('en-ZM', { timeZone: 'Africa/Lusaka' }),
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

/**
 * Build plain text email content
 */
function buildTextEmail(
  payload: NotificationPayload, 
  formattedData: Array<{ key: string; value: string }>
): string {
  const lines = [
    `New Form Submission`,
    `==================`,
    ``,
    `Form: ${payload.formName}`,
    payload.siteName ? `Site: ${payload.siteName}` : null,
    `Submitted: ${new Date(payload.submittedAt).toLocaleString()}`,
    payload.pageUrl ? `Page: ${payload.pageUrl}` : null,
    ``,
    `Submission Details:`,
    `-------------------`,
    ``,
    ...formattedData.map(({ key, value }) => `${key}: ${value}`),
    ``,
    `-------------------`,
    `Submission ID: ${payload.submissionId}`,
    ``,
    `View all submissions in your dashboard.`,
  ].filter(Boolean);

  return lines.join("\n");
}

/**
 * Build HTML email content
 */
function buildHtmlEmail(
  payload: NotificationPayload,
  formattedData: Array<{ key: string; value: string }>
): string {
  const dataRows = formattedData
    .map(
      ({ key, value }) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 500; color: #374151;">${escapeHtml(key)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; color: #6b7280;">${escapeHtml(value)}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Form Submission</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background-color: #3b82f6; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              New Form Submission
            </h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 24px;">
            <p style="color: #374151; margin: 0 0 16px 0;">
              You have received a new submission from <strong>${escapeHtml(payload.formName)}</strong>.
            </p>
            
            <!-- Meta Info -->
            <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
              ${payload.siteName ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Site: ${escapeHtml(payload.siteName)}</p>` : ""}
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Submitted: ${new Date(payload.submittedAt).toLocaleString()}</p>
              ${payload.pageUrl ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">Page: ${escapeHtml(payload.pageUrl)}</p>` : ""}
            </div>
            
            <!-- Submission Data -->
            <h2 style="color: #374151; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
              Submission Details
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${dataRows}
            </table>
          </div>
          
          <!-- Footer -->
          <div style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #eee; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
              Submission ID: ${payload.submissionId}
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              View all submissions in your dashboard
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
