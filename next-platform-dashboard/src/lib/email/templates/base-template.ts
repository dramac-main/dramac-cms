/**
 * Base Email Template
 * 
 * Phase WL-02: Email System Overhaul
 * 
 * Shared email layout with dynamic agency branding.
 * All 18 email templates use this base for consistent branded rendering.
 */

import type { EmailBranding } from "../email-branding";

/**
 * Get contrast-safe text color for a given background hex color.
 * Returns white or dark text depending on luminance.
 */
function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a2e" : "#ffffff";
}

/**
 * Social media platform icon URLs (using simple-icons CDN).
 * Falls back to text links if icons don't load.
 */
function getSocialIcon(platform: string): string {
  const icons: Record<string, string> = {
    twitter: "https://cdn.simpleicons.org/x/ffffff",
    linkedin: "https://cdn.simpleicons.org/linkedin/ffffff",
    facebook: "https://cdn.simpleicons.org/facebook/ffffff",
    instagram: "https://cdn.simpleicons.org/instagram/ffffff",
    youtube: "https://cdn.simpleicons.org/youtube/ffffff",
    tiktok: "https://cdn.simpleicons.org/tiktok/ffffff",
  };
  return icons[platform.toLowerCase()] || "";
}

/**
 * Render social links row for email footer.
 */
function renderSocialLinks(links: Record<string, string>): string {
  const entries = Object.entries(links).filter(([, url]) => url);
  if (entries.length === 0) return "";

  return `
    <p style="margin:0 0 16px;text-align:center;">
      ${entries
        .map(
          ([platform, url]) =>
            `<a href="${url}" style="display:inline-block;margin:0 6px;color:#6b7280;text-decoration:none;font-size:13px;" target="_blank">${platform.charAt(0).toUpperCase() + platform.slice(1)}</a>`
        )
        .join(" · ")}
    </p>
  `;
}

/**
 * Wrap email content in the branded base template.
 * Produces a responsive HTML email that works in Gmail, Outlook, Apple Mail.
 */
export function baseEmailTemplate(
  branding: EmailBranding,
  content: string,
  preheader?: string
): string {
  const headerBg = branding.primary_color || "#0F172A";
  const headerText = getContrastColor(headerBg);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${branding.agency_name}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 20px 12px !important; }
      .email-content { padding: 24px 20px !important; }
      .email-header { padding: 20px !important; }
      .email-footer { padding: 20px !important; }
    }
  </style>
  ${
    preheader
      ? `<span style="display:none!important;visibility:hidden;mso-hide:all;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>`
      : ""
  }
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" class="email-container" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td class="email-header" style="padding:28px 40px;text-align:center;background-color:${headerBg};">
              ${
                branding.logo_url
                  ? `<img src="${branding.logo_url}" alt="${branding.agency_name}" height="36" style="height:36px;max-width:180px;display:inline-block;" />`
                  : `<span style="font-size:22px;font-weight:700;color:${headerText};letter-spacing:-0.3px;">${branding.agency_name}</span>`
              }
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              ${renderSocialLinks(branding.social_links)}
              
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-align:center;">
                ${branding.footer_text ?? `Sent by ${branding.agency_name}`}
              </p>
              
              ${
                branding.footer_address
                  ? `<p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-align:center;">${branding.footer_address}</p>`
                  : ""
              }
              
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-align:center;">
                ${
                  branding.support_email
                    ? `<a href="mailto:${branding.support_email}" style="color:#6b7280;text-decoration:none;">Contact Support</a>`
                    : ""
                }${
                  branding.support_email && branding.privacy_policy_url ? " · " : ""
                }${
                  branding.privacy_policy_url
                    ? `<a href="${branding.privacy_policy_url}" style="color:#6b7280;text-decoration:none;">Privacy Policy</a>`
                    : ""
                }
              </p>
              
              ${
                branding.unsubscribe_url
                  ? `<p style="margin:0;font-size:12px;text-align:center;"><a href="${branding.unsubscribe_url}" style="color:#9ca3af;text-decoration:none;">Unsubscribe from these emails</a></p>`
                  : ""
              }
              
              <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;text-align:center;">
                &copy; ${year} ${branding.agency_name}. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Branded button HTML for use in email content.
 */
export function emailButton(
  branding: EmailBranding,
  href: string,
  text: string
): string {
  const bg = branding.accent_color || "#0F172A";
  const fg = getContrastColor(bg);
  return `<p style="margin:24px 0;text-align:center;">
  <a href="${href}" style="display:inline-block;padding:12px 28px;background:${bg};color:${fg};text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">${text}</a>
</p>`;
}

/**
 * Info box for displaying structured data (bookings, orders, etc.)
 */
export function emailInfoBox(
  rows: Array<{ label: string; value: string }>,
  bgColor = "#f9fafb",
  borderColor = "#e5e7eb"
): string {
  const rowsHtml = rows
    .map(
      (r) =>
        `<tr><td style="padding:8px 0;color:#6b7280;width:130px;font-size:14px;">${r.label}</td><td style="padding:8px 0;font-size:14px;font-weight:500;">${r.value}</td></tr>`
    )
    .join("");
  return `<div style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:20px;margin:20px 0;">
  <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
</div>`;
}

/**
 * Common email text styles
 */
export const EMAIL_STYLES = {
  heading:
    "font-size:24px;font-weight:600;margin:0 0 16px;color:#111827;",
  text: "color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;",
  muted:
    "color:#6b7280;font-size:13px;margin:16px 0 0;line-height:1.5;",
} as const;
