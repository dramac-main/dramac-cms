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
  heading: "color: #1e293b; font-size: 24px; font-weight: 600; margin-bottom: 16px;",
  text: "color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;",
  button: "display: inline-block; padding: 12px 24px; background: #1e293b; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;",
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

  // ============================================
  // BOOKING EMAILS
  // ============================================

  booking_confirmation_customer: {
    subject: (data) => `Booking ${data.status === 'confirmed' ? 'Confirmed' : 'Received'} - ${data.serviceName}`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Your Booking is ${data.status === 'confirmed' ? 'Booking Confirmed' : 'Booking Received'}</h1>
      <p style="${STYLES.text}">Hi ${data.customerName || 'there'},</p>
      <p style="${STYLES.text}">
        ${data.status === 'confirmed' 
          ? 'Your booking has been confirmed. Here are the details:' 
          : 'We have received your booking request. You\'ll receive a confirmation once it\'s approved.'}
      </p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 120px;">Service:</td><td style="padding: 8px 0; font-weight: 600;">${data.serviceName}</td></tr>
          ${data.staffName ? `<tr><td style="padding: 8px 0; color: #6b7280;">With:</td><td style="padding: 8px 0;">${data.staffName}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #6b7280;">Date:</td><td style="padding: 8px 0;">${data.date}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Time:</td><td style="padding: 8px 0;">${data.time}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Duration:</td><td style="padding: 8px 0;">${data.duration}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Price:</td><td style="padding: 8px 0; font-weight: 600;">${data.price}</td></tr>
        </table>
      </div>
      <p style="${STYLES.text}">Booking ID: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${data.bookingId}</code></p>
      <p style="${STYLES.muted}">If you need to make changes, please contact ${data.businessName}.</p>
    `),
    text: (data) => `
Your Booking is ${data.status === 'confirmed' ? 'Confirmed!' : 'Received!'}

Hi ${data.customerName || 'there'},

${data.status === 'confirmed' ? 'Your booking has been confirmed.' : 'We have received your booking request.'}

Service: ${data.serviceName}
${data.staffName ? `With: ${data.staffName}` : ''}
Date: ${data.date}
Time: ${data.time}
Duration: ${data.duration}
Price: ${data.price}

Booking ID: ${data.bookingId}

If you need to make changes, please contact ${data.businessName}.
    `.trim(),
  },

  booking_confirmation_owner: {
    subject: (data) => `🔔 New Booking: ${data.serviceName} - ${data.customerName}`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">New Booking Received</h1>
      <p style="${STYLES.text}">You have a new booking from <strong>${data.customerName}</strong>.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 120px;">Customer:</td><td style="padding: 8px 0; font-weight: 600;">${data.customerName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Email:</td><td style="padding: 8px 0;">${data.customerEmail}</td></tr>
          ${data.customerPhone ? `<tr><td style="padding: 8px 0; color: #6b7280;">Phone:</td><td style="padding: 8px 0;">${data.customerPhone}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #6b7280;">Service:</td><td style="padding: 8px 0; font-weight: 600;">${data.serviceName}</td></tr>
          ${data.staffName ? `<tr><td style="padding: 8px 0; color: #6b7280;">Staff:</td><td style="padding: 8px 0;">${data.staffName}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #6b7280;">Date:</td><td style="padding: 8px 0;">${data.date}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Time:</td><td style="padding: 8px 0;">${data.time}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Duration:</td><td style="padding: 8px 0;">${data.duration}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Price:</td><td style="padding: 8px 0; font-weight: 600;">${data.price}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Status:</td><td style="padding: 8px 0;"><span style="background: ${data.status === 'confirmed' ? '#dcfce7; color: #166534' : '#fef9c3; color: #854d0e'}; padding: 2px 8px; border-radius: 12px; font-size: 13px;">${data.status}</span></td></tr>
        </table>
      </div>
      <p style="margin: 24px 0;">
        <a href="${data.dashboardUrl}" style="${STYLES.button}">View in Dashboard</a>
      </p>
    `),
    text: (data) => `
📅 New Booking Received!

Customer: ${data.customerName}
Email: ${data.customerEmail}
${data.customerPhone ? `Phone: ${data.customerPhone}` : ''}

Service: ${data.serviceName}
${data.staffName ? `Staff: ${data.staffName}` : ''}
Date: ${data.date}
Time: ${data.time}
Duration: ${data.duration}
Price: ${data.price}
Status: ${data.status}

View in dashboard: ${data.dashboardUrl}
    `.trim(),
  },

  booking_cancelled_customer: {
    subject: () => 'Booking Cancelled',
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Booking Cancelled</h1>
      <p style="${STYLES.text}">Hi ${data.customerName || 'there'},</p>
      <p style="${STYLES.text}">Your booking for <strong>${data.serviceName}</strong> on ${data.date} at ${data.time} has been cancelled.</p>
      <p style="${STYLES.text}">If you'd like to rebook, please visit our booking page.</p>
      <p style="${STYLES.muted}">Booking ID: ${data.bookingId}</p>
    `),
    text: (data) => `
Booking Cancelled

Hi ${data.customerName || 'there'},

Your booking for ${data.serviceName} on ${data.date} at ${data.time} has been cancelled.

If you'd like to rebook, please visit our booking page.

Booking ID: ${data.bookingId}
    `.trim(),
  },

  booking_cancelled_owner: {
    subject: (data) => `❌ Booking Cancelled: ${data.customerName} - ${data.serviceName}`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Booking Cancelled</h1>
      <p style="${STYLES.text}">A booking has been cancelled.</p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280;">Customer:</td><td style="padding: 8px 0;">${data.customerName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Service:</td><td style="padding: 8px 0;">${data.serviceName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Date/Time:</td><td style="padding: 8px 0;">${data.date} at ${data.time}</td></tr>
        </table>
      </div>
      <p style="margin: 24px 0;">
        <a href="${data.dashboardUrl}" style="${STYLES.button}">View in Dashboard</a>
      </p>
    `),
    text: (data) => `
Booking Cancelled

Customer: ${data.customerName}
Service: ${data.serviceName}
Date/Time: ${data.date} at ${data.time}

View in dashboard: ${data.dashboardUrl}
    `.trim(),
  },

  // ============================================
  // E-COMMERCE EMAILS
  // ============================================

  order_confirmation_customer: {
    subject: (data) => `Order Confirmed - #${data.orderNumber}`,
    html: (data) => {
      const items = (data.items as Array<{ name: string; quantity: number; price: string }>) || [];
      const itemRows = items.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: right;">${item.price}</td>
        </tr>
      `).join('');

      return wrapHtml(`
        <h1 style="${STYLES.heading}">Order Confirmed! 🎉</h1>
        <p style="${STYLES.text}">Hi ${data.customerName || 'there'},</p>
        <p style="${STYLES.text}">Thank you for your order! Here's your order summary:</p>
        <p style="${STYLES.text}"><strong>Order #${data.orderNumber}</strong></p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr><td style="padding: 4px 0; color: #6b7280;">Subtotal:</td><td style="padding: 4px 0; text-align: right;">${data.subtotal}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Shipping:</td><td style="padding: 4px 0; text-align: right;">${data.shipping}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Tax:</td><td style="padding: 4px 0; text-align: right;">${data.tax}</td></tr>
            <tr><td style="padding: 8px 0 0; font-weight: 700; border-top: 2px solid #e5e7eb;">Total:</td><td style="padding: 8px 0 0; text-align: right; font-weight: 700; font-size: 18px; border-top: 2px solid #e5e7eb;">${data.total}</td></tr>
          </table>
        </div>
        ${data.shippingAddress ? `<p style="${STYLES.text}"><strong>Shipping to:</strong> ${data.shippingAddress}</p>` : ''}
        <p style="${STYLES.muted}">If you have any questions about your order, please contact ${data.businessName}.</p>
      `);
    },
    text: (data) => {
      const items = (data.items as Array<{ name: string; quantity: number; price: string }>) || [];
      const itemLines = items.map(item => `  ${item.name} x${item.quantity} - ${item.price}`).join('\n');
      return `
Order Confirmed! 🎉

Hi ${data.customerName || 'there'},

Thank you for your order!

Order #${data.orderNumber}

Items:
${itemLines}

Subtotal: ${data.subtotal}
Shipping: ${data.shipping}
Tax: ${data.tax}
Total: ${data.total}

${data.shippingAddress ? `Shipping to: ${data.shippingAddress}` : ''}

If you have any questions, please contact ${data.businessName}.
      `.trim();
    },
  },

  order_confirmation_owner: {
    subject: (data) => `🛒 New Order #${data.orderNumber} - ${data.total}`,
    html: (data) => {
      const items = (data.items as Array<{ name: string; quantity: number; price: string }>) || [];
      const itemRows = items.map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right;">${item.price}</td>
        </tr>
      `).join('');

      return wrapHtml(`
        <h1 style="${STYLES.heading}">🛒 New Order Received!</h1>
        <p style="${STYLES.text}">You have a new order from <strong>${data.customerName}</strong>.</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Order #${data.orderNumber}</strong></p>
          <p style="margin: 0 0 4px; color: #6b7280;">Customer: ${data.customerName} (${data.customerEmail})</p>
          <p style="margin: 0 0 4px; color: #6b7280;">Payment: <span style="background: ${data.paymentStatus === 'paid' ? '#dcfce7; color: #166534' : '#fef9c3; color: #854d0e'}; padding: 2px 8px; border-radius: 12px; font-size: 13px;">${data.paymentStatus}</span></p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #166534;">${data.total}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="margin: 24px 0;">
          <a href="${data.dashboardUrl}" style="${STYLES.button}">View Order in Dashboard</a>
        </p>
      `);
    },
    text: (data) => {
      const items = (data.items as Array<{ name: string; quantity: number; price: string }>) || [];
      const itemLines = items.map(item => `  ${item.name} x${item.quantity} - ${item.price}`).join('\n');
      return `
🛒 New Order Received!

Order #${data.orderNumber}
Customer: ${data.customerName} (${data.customerEmail})
Payment: ${data.paymentStatus}
Total: ${data.total}

Items:
${itemLines}

View in dashboard: ${data.dashboardUrl}
      `.trim();
    },
  },

  order_shipped_customer: {
    subject: (data) => `Your Order #${data.orderNumber} Has Shipped! 📦`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Your Order Has Shipped! 📦</h1>
      <p style="${STYLES.text}">Hi ${data.customerName || 'there'},</p>
      <p style="${STYLES.text}">Great news! Your order <strong>#${data.orderNumber}</strong> is on its way.</p>
      ${data.trackingNumber ? `
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; color: #6b7280;">Tracking Number:</p>
          <p style="margin: 0; font-weight: 600; font-size: 18px;">${data.trackingNumber}</p>
          ${data.trackingUrl ? `<p style="margin: 8px 0 0;"><a href="${data.trackingUrl}" style="color: #0f766e;">Track Your Package →</a></p>` : ''}
        </div>
      ` : ''}
      <p style="${STYLES.muted}">If you have any questions, please contact ${data.businessName}.</p>
    `),
    text: (data) => `
Your Order Has Shipped! 📦

Hi ${data.customerName || 'there'},

Your order #${data.orderNumber} is on its way.

${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}` : ''}
${data.trackingUrl ? `Track your package: ${data.trackingUrl}` : ''}

If you have any questions, please contact ${data.businessName}.
    `.trim(),
  },

  // ============================================
  // FORM SUBMISSION EMAILS
  // ============================================

  form_submission_owner: {
    subject: (data) => `📝 New Form Submission: ${data.formName}`,
    html: (data) => {
      const fields = (data.fields as Array<{ label: string; value: string }>) || [];
      const fieldRows = fields.map(f => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: 500; color: #374151; width: 40%;">${f.label}</td>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${f.value}</td>
        </tr>
      `).join('');

      return wrapHtml(`
        <h1 style="${STYLES.heading}">📝 New Form Submission</h1>
        <p style="${STYLES.text}">You have a new submission from <strong>${data.formName}</strong>${data.siteName ? ` on ${data.siteName}` : ''}.</p>
        <p style="${STYLES.text}; color: #6b7280; font-size: 14px;">Submitted: ${data.submittedAt}</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          ${fieldRows}
        </table>
        ${data.dashboardUrl ? `
        <p style="margin: 24px 0;">
          <a href="${data.dashboardUrl}" style="${STYLES.button}">View in Dashboard</a>
        </p>
        ` : ''}
      `);
    },
    text: (data) => {
      const fields = (data.fields as Array<{ label: string; value: string }>) || [];
      const fieldLines = fields.map(f => `${f.label}: ${f.value}`).join('\n');
      return `
📝 New Form Submission

Form: ${data.formName}
${data.siteName ? `Site: ${data.siteName}` : ''}
Submitted: ${data.submittedAt}

${fieldLines}

${data.dashboardUrl ? `View in dashboard: ${data.dashboardUrl}` : ''}
      `.trim();
    },
  },

  // ============================================
  // QUOTE EMAILS
  // ============================================

  quote_sent_customer: {
    subject: (data) => `Quote ${data.quoteNumber} from ${data.businessName || 'us'}`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Your Quote is Ready</h1>
      <p style="${STYLES.text}">Hi ${data.customerName || 'there'},</p>
      <p style="${STYLES.text}">We've prepared a quote for you.</p>
      <p style="${STYLES.text}"><strong>Quote #:</strong> ${data.quoteNumber}<br><strong>Total:</strong> ${data.totalAmount}${data.expiryDate ? `<br><strong>Valid until:</strong> ${data.expiryDate}` : ''}</p>
      ${data.message ? `<p style="${STYLES.text}">${data.message}</p>` : ''}
      ${data.viewQuoteUrl ? `<p style="margin: 24px 0;"><a href="${data.viewQuoteUrl}" style="${STYLES.button}">View Quote</a></p>` : ''}
    `),
    text: (data) => `Your Quote is Ready\n\nHi ${data.customerName || 'there'},\n\nQuote #: ${data.quoteNumber}\nTotal: ${data.totalAmount}${data.expiryDate ? `\nValid until: ${data.expiryDate}` : ''}\n\n${data.message || ''}${data.viewQuoteUrl ? `\n\nView quote: ${data.viewQuoteUrl}` : ''}`,
  },

  quote_reminder_customer: {
    subject: (data) => `Reminder: Quote ${data.quoteNumber} is awaiting your response`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">Quote Reminder</h1>
      <p style="${STYLES.text}">Hi ${data.customerName || 'there'},</p>
      <p style="${STYLES.text}">This is a friendly reminder about quote <strong>${data.quoteNumber}</strong> (${data.totalAmount}).</p>
      ${data.expiryDate ? `<p style="${STYLES.text}">This quote is valid until <strong>${data.expiryDate}</strong>.</p>` : ''}
      ${data.message ? `<p style="${STYLES.text}">${data.message}</p>` : ''}
      ${data.viewQuoteUrl ? `<p style="margin: 24px 0;"><a href="${data.viewQuoteUrl}" style="${STYLES.button}">View Quote</a></p>` : ''}
    `),
    text: (data) => `Quote Reminder\n\nHi ${data.customerName || 'there'},\n\nReminder about quote ${data.quoteNumber} (${data.totalAmount}).${data.expiryDate ? ` Valid until ${data.expiryDate}.` : ''}\n\n${data.message || ''}${data.viewQuoteUrl ? `\n\nView quote: ${data.viewQuoteUrl}` : ''}`,
  },

  quote_accepted_owner: {
    subject: (data) => `✅ Quote ${data.quoteNumber} Accepted by ${data.customerName}`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">✅ Quote Accepted</h1>
      <p style="${STYLES.text}">Great news! <strong>${data.customerName}</strong> has accepted quote <strong>${data.quoteNumber}</strong>.</p>
      <p style="${STYLES.text}"><strong>Total:</strong> ${data.totalAmount}</p>
      ${data.dashboardUrl ? `<p style="margin: 24px 0;"><a href="${data.dashboardUrl}" style="${STYLES.button}">View in Dashboard</a></p>` : ''}
    `),
    text: (data) => `Quote Accepted\n\n${data.customerName} has accepted quote ${data.quoteNumber}.\nTotal: ${data.totalAmount}\n\n${data.dashboardUrl ? `View in dashboard: ${data.dashboardUrl}` : ''}`,
  },

  quote_rejected_owner: {
    subject: (data) => `❌ Quote ${data.quoteNumber} Rejected by ${data.customerName}`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">❌ Quote Rejected</h1>
      <p style="${STYLES.text}"><strong>${data.customerName}</strong> has rejected quote <strong>${data.quoteNumber}</strong>.</p>
      <p style="${STYLES.text}"><strong>Total:</strong> ${data.totalAmount}</p>
      ${data.rejectionReason ? `<p style="${STYLES.text}"><strong>Reason:</strong> ${data.rejectionReason}</p>` : ''}
      ${data.dashboardUrl ? `<p style="margin: 24px 0;"><a href="${data.dashboardUrl}" style="${STYLES.button}">View in Dashboard</a></p>` : ''}
    `),
    text: (data) => `Quote Rejected\n\n${data.customerName} has rejected quote ${data.quoteNumber}.\nTotal: ${data.totalAmount}${data.rejectionReason ? `\nReason: ${data.rejectionReason}` : ''}\n\n${data.dashboardUrl ? `View in dashboard: ${data.dashboardUrl}` : ''}`,
  },

  // ============================================
  // DOMAIN EMAILS
  // ============================================

  domain_expiring: {
    subject: (data) => `⚠️ Domain ${data.domainName} expires in ${data.daysUntilExpiry} day${Number(data.daysUntilExpiry) === 1 ? '' : 's'}`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">⚠️ Domain Expiry Notice</h1>
      <p style="${STYLES.text}">Hi${data.agencyName ? ` ${data.agencyName}` : ''},</p>
      <p style="${STYLES.text}">Your domain <strong>${data.domainName}</strong> will expire on <strong>${data.expiryDate}</strong> (in ${data.daysUntilExpiry} day${Number(data.daysUntilExpiry) === 1 ? '' : 's'}).</p>
      ${data.autoRenew === true || data.autoRenew === 'true' ? `
        <p style="${STYLES.text}; color: #16a34a;">Auto-renewal is <strong>enabled</strong> for this domain. It will be renewed automatically before expiry.</p>
      ` : `
        <p style="${STYLES.text}; color: #dc2626;">Auto-renewal is <strong>disabled</strong>. Please renew manually to keep this domain active.</p>
        ${data.renewUrl ? `<p style="margin: 24px 0;"><a href="${data.renewUrl}" style="${STYLES.button}">Renew Now</a></p>` : ''}
      `}
      <p style="${STYLES.text}; color: #6b7280; font-size: 13px;">If you no longer need this domain, you can safely ignore this email.</p>
    `),
    text: (data) => `Domain Expiry Notice\n\nYour domain ${data.domainName} will expire on ${data.expiryDate} (in ${data.daysUntilExpiry} days).\n\n${data.autoRenew === true || data.autoRenew === 'true' ? 'Auto-renewal is enabled.' : `Auto-renewal is disabled. Renew at: ${data.renewUrl || 'your dashboard'}`}`,
  },

  // ============================================
  // LIVE CHAT EMAILS
  // ============================================

  chat_transcript: {
    subject: (data) => `Chat Transcript — ${data.visitorName || 'Visitor'} (${data.channel || 'widget'})`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">💬 Chat Transcript</h1>
      <p style="${STYLES.text}">Here is the transcript for your chat conversation.</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0; font-size: 13px;"><strong>Visitor:</strong> ${data.visitorName || 'Unknown'} (${data.visitorEmail || 'N/A'})</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Agent:</strong> ${data.agentName || 'Unassigned'}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Channel:</strong> ${data.channel || 'widget'}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Messages:</strong> ${data.messageCount || 0}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Started:</strong> ${data.startedAt || 'N/A'}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Ended:</strong> ${data.endedAt || 'N/A'}</p>
      </div>
      <pre style="background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 8px; font-size: 12px; white-space: pre-wrap; overflow-x: auto;">${data.transcript || 'No transcript available.'}</pre>
      ${data.dashboardUrl ? `<p style="margin: 24px 0;"><a href="${data.dashboardUrl}" style="${STYLES.button}">View in Dashboard</a></p>` : ''}
    `),
    text: (data) => `Chat Transcript\n\nVisitor: ${data.visitorName || 'Unknown'} (${data.visitorEmail || 'N/A'})\nAgent: ${data.agentName || 'Unassigned'}\nChannel: ${data.channel || 'widget'}\n\n${data.transcript || 'No transcript available.'}`,
  },

  chat_missed_notification: {
    subject: (data) => `⚠️ Missed Chat from ${data.visitorName || 'a visitor'} — ${data.siteName || 'your site'}`,
    html: (data) => wrapHtml(`
      <h1 style="${STYLES.heading}">⚠️ Missed Chat</h1>
      <p style="${STYLES.text}">A visitor tried to chat but no agents were available.</p>
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 4px 0; font-size: 13px;"><strong>Visitor:</strong> ${data.visitorName || 'Unknown'} (${data.visitorEmail || 'N/A'})</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Channel:</strong> ${data.channel || 'widget'}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Time:</strong> ${data.missedAt || 'N/A'}</p>
        <p style="margin: 8px 0 0 0; font-size: 13px;"><strong>Message:</strong> "${data.visitorMessage || 'No message'}"</p>
      </div>
      ${data.dashboardUrl ? `<p style="margin: 24px 0;"><a href="${data.dashboardUrl}" style="${STYLES.button}">View Conversations</a></p>` : ''}
    `),
    text: (data) => `Missed Chat\n\nA visitor tried to chat on ${data.siteName || 'your site'} but no agents were available.\n\nVisitor: ${data.visitorName || 'Unknown'}\nMessage: ${data.visitorMessage || 'No message'}\nTime: ${data.missedAt || 'N/A'}\n\n${data.dashboardUrl ? `View: ${data.dashboardUrl}` : ''}`,
  },
};
