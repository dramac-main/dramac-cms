/**
 * Email Templates
 * 
 * HTML and plain text templates for all transactional emails.
 * Uses inline styles for maximum email client compatibility.
 */

import type { EmailType } from "./email-types";

interface EmailTemplate {
  subject: (data: Record<string, unknown>) => string;
  html: (data: Record<string, unknown>) => string;
  text: (data: Record<string, unknown>) => string;
}

// Common styles
const STYLES = {
  container: "max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;",
  heading: "color: #7c3aed; font-size: 24px; font-weight: 600; margin-bottom: 16px;",
  text: "color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;",
  button: "display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;",
  muted: "color: #6b7280; font-size: 14px; margin-top: 24px;",
  footer: "margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;",
};

// Email wrapper template
function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Dramac</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="${STYLES.container} background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${content}
          <div style="${STYLES.footer}">
            <p>© ${new Date().getFullYear()} Dramac. All rights reserved.</p>
            <p>You're receiving this email because you have an account with Dramac.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const EMAIL_TEMPLATES: Record<EmailType, EmailTemplate> = {
  // ============================================
  // AUTH EMAILS
  // ============================================
  
  welcome: {
    subject: () => "Welcome to Dramac!",
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Welcome to Dramac!</h1>
      <p style="${STYLES.text}">Hi ${data.name || "there"},</p>
      <p style="${STYLES.text}">Thanks for signing up! We're excited to help you build amazing websites for your clients.</p>
      <p style="${STYLES.text}">Here's what you can do next:</p>
      <ul style="${STYLES.text}">
        <li>Create your first client</li>
        <li>Build a stunning website</li>
        <li>Explore our AI-powered tools</li>
      </ul>
      <p style="margin: 24px 0;">
        <a href="${data.dashboardUrl}" style="${STYLES.button}">
          Go to Dashboard
        </a>
      </p>
      <p style="${STYLES.text}">If you have any questions, just reply to this email - we're here to help!</p>
      <p style="${STYLES.text}">- The Dramac Team</p>
    `),
    text: (data) => `
Welcome to Dramac!

Hi ${data.name || "there"},

Thanks for signing up! We're excited to help you build amazing websites for your clients.

Here's what you can do next:
- Create your first client
- Build a stunning website
- Explore our AI-powered tools

Go to your dashboard: ${data.dashboardUrl}

If you have any questions, just reply to this email - we're here to help!

- The Dramac Team
    `.trim(),
  },

  password_reset: {
    subject: () => "Reset Your Password",
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Reset Your Password</h1>
      <p style="${STYLES.text}">You requested a password reset for your Dramac account.</p>
      <p style="${STYLES.text}">Click the button below to set a new password:</p>
      <p style="margin: 24px 0;">
        <a href="${data.resetUrl}" style="${STYLES.button}">
          Reset Password
        </a>
      </p>
      <p style="${STYLES.muted}">
        This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email - your password will remain unchanged.
      </p>
    `),
    text: (data) => `
Reset Your Password

You requested a password reset for your Dramac account.

Click the link below to set a new password:
${data.resetUrl}

This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email - your password will remain unchanged.
    `.trim(),
  },

  email_changed: {
    subject: () => "Your Email Address Has Been Changed",
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Email Address Changed</h1>
      <p style="${STYLES.text}">Your Dramac account email has been changed to:</p>
      <p style="${STYLES.text}"><strong>${data.newEmail}</strong></p>
      <p style="${STYLES.muted}">
        If you didn't make this change, please contact our support team immediately.
      </p>
    `),
    text: (data) => `
Email Address Changed

Your Dramac account email has been changed to:
${data.newEmail}

If you didn't make this change, please contact our support team immediately.
    `.trim(),
  },

  // ============================================
  // TEAM EMAILS
  // ============================================

  team_invitation: {
    subject: (data) => `You're invited to join ${data.agencyName} on Dramac`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Team Invitation</h1>
      <p style="${STYLES.text}">
        <strong>${data.inviterName}</strong> has invited you to join <strong>${data.agencyName}</strong> on Dramac.
      </p>
      <p style="${STYLES.text}">
        Click the button below to accept the invitation and join the team:
      </p>
      <p style="margin: 24px 0;">
        <a href="${data.inviteUrl}" style="${STYLES.button}">
          Accept Invitation
        </a>
      </p>
      <p style="${STYLES.muted}">
        This invitation expires in 7 days. If you don't have a Dramac account yet, you'll be able to create one.
      </p>
    `),
    text: (data) => `
Team Invitation

${data.inviterName} has invited you to join ${data.agencyName} on Dramac.

Accept your invitation: ${data.inviteUrl}

This invitation expires in 7 days. If you don't have a Dramac account yet, you'll be able to create one.
    `.trim(),
  },

  team_member_joined: {
    subject: (data) => `${data.memberName} joined your team`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">New Team Member</h1>
      <p style="${STYLES.text}">
        <strong>${data.memberName}</strong> has joined <strong>${data.agencyName}</strong>.
      </p>
      <p style="${STYLES.text}">
        They now have access to your team's projects and can start collaborating right away.
      </p>
    `),
    text: (data) => `
New Team Member

${data.memberName} has joined ${data.agencyName}.

They now have access to your team's projects and can start collaborating right away.
    `.trim(),
  },

  // ============================================
  // SITE EMAILS
  // ============================================

  site_published: {
    subject: (data) => `🎉 ${data.siteName} is now live!`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">🎉 Your Site is Live!</h1>
      <p style="${STYLES.text}">
        Great news! <strong>${data.siteName}</strong> has been successfully published.
      </p>
      <p style="${STYLES.text}">Your site is now available at:</p>
      <p style="margin: 24px 0;">
        <a href="${data.siteUrl}" style="${STYLES.button}">
          View Site
        </a>
      </p>
      <p style="${STYLES.muted}">
        It may take a few minutes for changes to propagate globally.
      </p>
    `),
    text: (data) => `
🎉 Your Site is Live!

Great news! ${data.siteName} has been successfully published.

Your site is now available at:
${data.siteUrl}

It may take a few minutes for changes to propagate globally.
    `.trim(),
  },

  domain_connected: {
    subject: (data) => `Domain connected: ${data.domain}`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Domain Connected!</h1>
      <p style="${STYLES.text}">
        The domain <strong>${data.domain}</strong> has been successfully connected to <strong>${data.siteName}</strong>.
      </p>
      <p style="${STYLES.text}">
        Your site is now accessible at both your custom domain and the Dramac subdomain.
      </p>
      <p style="${STYLES.muted}">
        Note: SSL certificates are automatically provisioned. This may take up to 24 hours.
      </p>
    `),
    text: (data) => `
Domain Connected!

The domain ${data.domain} has been successfully connected to ${data.siteName}.

Your site is now accessible at both your custom domain and the Dramac subdomain.

Note: SSL certificates are automatically provisioned. This may take up to 24 hours.
    `.trim(),
  },

  // ============================================
  // BILLING EMAILS
  // ============================================

  subscription_created: {
    subject: () => "🎉 Subscription Confirmed",
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">🎉 Subscription Confirmed!</h1>
      <p style="${STYLES.text}">
        Thank you for subscribing to Dramac! Your <strong>${data.planName}</strong> plan is now active.
      </p>
      <p style="${STYLES.text}">
        You now have access to all the features included in your plan. Here's what you can do:
      </p>
      <ul style="${STYLES.text}">
        <li>Create unlimited websites</li>
        <li>Access advanced AI tools</li>
        <li>Use premium templates</li>
        <li>Priority support</li>
      </ul>
      <p style="${STYLES.muted}">
        You can manage your subscription anytime from your account settings.
      </p>
    `),
    text: (data) => `
🎉 Subscription Confirmed!

Thank you for subscribing to Dramac! Your ${data.planName} plan is now active.

You now have access to all the features included in your plan.

You can manage your subscription anytime from your account settings.
    `.trim(),
  },

  payment_failed: {
    subject: () => "⚠️ Payment Failed - Action Required",
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Payment Failed</h1>
      <p style="${STYLES.text}">
        We were unable to process your latest payment. To avoid any interruption to your service, please update your payment method.
      </p>
      ${data.updatePaymentUrl ? `
      <p style="margin: 24px 0;">
        <a href="${data.updatePaymentUrl}" style="${STYLES.button}">
          Update Payment Method
        </a>
      </p>
      ` : ''}
      <p style="${STYLES.muted}">
        If you believe this is an error or need assistance, please contact our support team.
      </p>
    `),
    text: (data) => `
⚠️ Payment Failed - Action Required

We were unable to process your latest payment. To avoid any interruption to your service, please update your payment method.

${data.updatePaymentUrl ? `Update your payment method: ${data.updatePaymentUrl}` : ''}

If you believe this is an error or need assistance, please contact our support team.
    `.trim(),
  },

  trial_ending: {
    subject: (data) => `Your trial ends in ${data.daysLeft} day${Number(data.daysLeft) === 1 ? '' : 's'}`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Your Trial is Ending Soon</h1>
      <p style="${STYLES.text}">
        Your Dramac trial ends in <strong>${data.daysLeft} day${Number(data.daysLeft) === 1 ? '' : 's'}</strong>.
      </p>
      <p style="${STYLES.text}">
        To keep access to all your websites and features, subscribe to a plan today.
      </p>
      ${data.upgradeUrl ? `
      <p style="margin: 24px 0;">
        <a href="${data.upgradeUrl}" style="${STYLES.button}">
          Choose a Plan
        </a>
      </p>
      ` : ''}
      <p style="${STYLES.muted}">
        Have questions? Reply to this email and we'll help you find the right plan.
      </p>
    `),
    text: (data) => `
Your Trial is Ending Soon

Your Dramac trial ends in ${data.daysLeft} day${Number(data.daysLeft) === 1 ? '' : 's'}.

To keep access to all your websites and features, subscribe to a plan today.

${data.upgradeUrl ? `Choose a plan: ${data.upgradeUrl}` : ''}

Have questions? Reply to this email and we'll help you find the right plan.
    `.trim(),
  },
};
