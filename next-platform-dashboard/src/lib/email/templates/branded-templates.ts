/**
 * Branded Email Templates
 * 
 * Phase WL-02: All 18 email templates rebuilt with dynamic agency branding.
 * Each template is a function accepting (data, branding) => { subject, html, text }
 */

import type { EmailBranding } from "../email-branding";
import type { EmailType } from "../email-types";
import {
  baseEmailTemplate,
  emailButton,
  emailInfoBox,
  EMAIL_STYLES,
} from "./base-template";

interface BrandedTemplate {
  subject: (data: Record<string, unknown>) => string;
  html: (data: Record<string, unknown>, branding: EmailBranding) => string;
  text: (data: Record<string, unknown>, branding: EmailBranding) => string;
}

// ============================================================================
// AUTH TEMPLATES
// ============================================================================

const welcome: BrandedTemplate = {
  subject: (data) => `Welcome to ${data._agencyName || "our platform"}!`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Welcome to ${b.agency_name}!</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.name || "there"},</p>
      <p style="${EMAIL_STYLES.text}">Thanks for signing up! We're excited to help you build amazing websites for your clients.</p>
      <p style="${EMAIL_STYLES.text}">Here's what you can do next:</p>
      <ul style="${EMAIL_STYLES.text}">
        <li>Create your first client</li>
        <li>Build a stunning website</li>
        <li>Explore AI-powered tools</li>
      </ul>
      ${emailButton(b, String(data.dashboardUrl), "Go to Dashboard")}
      <p style="${EMAIL_STYLES.text}">If you have any questions, just reply to this email &mdash; we're here to help!</p>
      <p style="${EMAIL_STYLES.text}">&mdash; The ${b.agency_name} Team</p>`,
      `Welcome to ${b.agency_name}! Get started building amazing websites.`
    ),
  text: (data, b) =>
    `Welcome to ${b.agency_name}!\n\nHi ${data.name || "there"},\n\nThanks for signing up! Go to your dashboard: ${data.dashboardUrl}\n\n- The ${b.agency_name} Team`,
};

const password_reset: BrandedTemplate = {
  subject: () => "Reset Your Password",
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Reset Your Password</h1>
      <p style="${EMAIL_STYLES.text}">You requested a password reset for your ${b.agency_name} account.</p>
      <p style="${EMAIL_STYLES.text}">Click the button below to set a new password:</p>
      ${emailButton(b, String(data.resetUrl), "Reset Password")}
      <p style="${EMAIL_STYLES.muted}">This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email.</p>`,
      "Reset your password"
    ),
  text: (data, b) =>
    `Reset Your Password\n\nYou requested a password reset for your ${b.agency_name} account.\n\nReset link: ${data.resetUrl}\n\nThis link expires in 1 hour.`,
};

const email_changed: BrandedTemplate = {
  subject: () => "Your Email Address Has Been Changed",
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Email Address Changed</h1>
      <p style="${EMAIL_STYLES.text}">Your ${b.agency_name} account email has been changed to:</p>
      <p style="${EMAIL_STYLES.text}"><strong>${data.newEmail}</strong></p>
      <p style="${EMAIL_STYLES.muted}">If you didn't make this change, please contact ${b.support_email ? `<a href="mailto:${b.support_email}" style="color:#6b7280;">${b.support_email}</a>` : "our support team"} immediately.</p>`,
      "Your email address has been updated"
    ),
  text: (data, b) =>
    `Email Address Changed\n\nYour ${b.agency_name} account email has been changed to: ${data.newEmail}\n\nIf you didn't make this change, contact ${b.support_email || "support"} immediately.`,
};

// ============================================================================
// TEAM TEMPLATES
// ============================================================================

const team_invitation: BrandedTemplate = {
  subject: (data) =>
    `You're invited to join ${data.agencyName}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Team Invitation</h1>
      <p style="${EMAIL_STYLES.text}"><strong>${data.inviterName}</strong> has invited you to join <strong>${data.agencyName}</strong>.</p>
      <p style="${EMAIL_STYLES.text}">Click the button below to accept the invitation and join the team:</p>
      ${emailButton(b, String(data.inviteUrl), "Accept Invitation")}
      <p style="${EMAIL_STYLES.muted}">This invitation expires in 7 days.</p>`,
      `${data.inviterName} invited you to join ${data.agencyName}`
    ),
  text: (data, b) =>
    `Team Invitation\n\n${data.inviterName} invited you to join ${data.agencyName}.\n\nAccept: ${data.inviteUrl}\n\nExpires in 7 days.`,
};

const team_member_joined: BrandedTemplate = {
  subject: (data) => `${data.memberName} joined your team`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">New Team Member</h1>
      <p style="${EMAIL_STYLES.text}"><strong>${data.memberName}</strong> has joined <strong>${data.agencyName || b.agency_name}</strong>.</p>
      <p style="${EMAIL_STYLES.text}">They now have access to your team's projects and can start collaborating right away.</p>`,
      `${data.memberName} joined ${data.agencyName || b.agency_name}`
    ),
  text: (data, b) =>
    `New Team Member\n\n${data.memberName} has joined ${data.agencyName || b.agency_name}.`,
};

// ============================================================================
// SITE TEMPLATES
// ============================================================================

const site_published: BrandedTemplate = {
  subject: (data) => `🎉 ${data.siteName} is now live!`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">🎉 Your Site is Live!</h1>
      <p style="${EMAIL_STYLES.text}">Great news! <strong>${data.siteName}</strong> has been successfully published.</p>
      <p style="${EMAIL_STYLES.text}">Your site is now available at:</p>
      ${emailButton(b, String(data.siteUrl), "View Site")}
      <p style="${EMAIL_STYLES.muted}">It may take a few minutes for changes to propagate globally.</p>`,
      `${data.siteName} has been published!`
    ),
  text: (data) =>
    `Your Site is Live!\n\n${data.siteName} has been published.\n\nView: ${data.siteUrl}`,
};

const domain_connected: BrandedTemplate = {
  subject: (data) => `Domain connected: ${data.domain}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Domain Connected!</h1>
      <p style="${EMAIL_STYLES.text}">The domain <strong>${data.domain}</strong> has been successfully connected to <strong>${data.siteName}</strong>.</p>
      <p style="${EMAIL_STYLES.text}">Your site is now accessible at your custom domain. SSL certificates are automatically provisioned.</p>
      <p style="${EMAIL_STYLES.muted}">Note: SSL provisioning may take up to 24 hours.</p>`,
      `${data.domain} is now connected to ${data.siteName}`
    ),
  text: (data) =>
    `Domain Connected!\n\n${data.domain} is connected to ${data.siteName}.\n\nSSL provisioning may take up to 24 hours.`,
};

// ============================================================================
// BILLING TEMPLATES
// ============================================================================

const subscription_created: BrandedTemplate = {
  subject: () => "🎉 Subscription Confirmed",
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">🎉 Subscription Confirmed!</h1>
      <p style="${EMAIL_STYLES.text}">Thank you for subscribing to ${b.agency_name}! Your <strong>${data.planName}</strong> plan is now active.</p>
      <p style="${EMAIL_STYLES.text}">You now have access to all the features included in your plan.</p>
      <p style="${EMAIL_STYLES.muted}">You can manage your subscription anytime from your account settings.</p>`,
      "Your subscription is confirmed!"
    ),
  text: (data, b) =>
    `Subscription Confirmed!\n\nThank you for subscribing to ${b.agency_name}! Your ${data.planName} plan is now active.`,
};

const payment_failed: BrandedTemplate = {
  subject: () => "⚠️ Payment Failed - Action Required",
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Payment Failed</h1>
      <p style="${EMAIL_STYLES.text}">We were unable to process your latest payment. To avoid any interruption to your service, please update your payment method.</p>
      ${data.updatePaymentUrl ? emailButton(b, String(data.updatePaymentUrl), "Update Payment Method") : ""}
      <p style="${EMAIL_STYLES.muted}">If you believe this is an error or need assistance, ${b.support_email ? `contact <a href="mailto:${b.support_email}" style="color:#6b7280;">${b.support_email}</a>` : "contact our support team"}.</p>`,
      "Your payment could not be processed"
    ),
  text: (data, b) =>
    `Payment Failed\n\nWe couldn't process your payment.${data.updatePaymentUrl ? `\n\nUpdate: ${data.updatePaymentUrl}` : ""}\n\nContact: ${b.support_email || "support"}`,
};

const trial_ending: BrandedTemplate = {
  subject: (data) =>
    `Your trial ends in ${data.daysLeft} day${Number(data.daysLeft) === 1 ? "" : "s"}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Your Trial is Ending Soon</h1>
      <p style="${EMAIL_STYLES.text}">Your ${b.agency_name} trial ends in <strong>${data.daysLeft} day${Number(data.daysLeft) === 1 ? "" : "s"}</strong>.</p>
      <p style="${EMAIL_STYLES.text}">To keep access to all your websites and features, subscribe to a plan today.</p>
      ${data.upgradeUrl ? emailButton(b, String(data.upgradeUrl), "Choose a Plan") : ""}
      <p style="${EMAIL_STYLES.muted}">Have questions? Reply to this email and we'll help you find the right plan.</p>`,
      `Your trial ends in ${data.daysLeft} days`
    ),
  text: (data, b) =>
    `Your ${b.agency_name} trial ends in ${data.daysLeft} day(s).${data.upgradeUrl ? `\n\nUpgrade: ${data.upgradeUrl}` : ""}`,
};

// ============================================================================
// BOOKING TEMPLATES
// ============================================================================

const booking_confirmation_customer: BrandedTemplate = {
  subject: (data) =>
    `Booking ${data.status === "confirmed" ? "Confirmed" : "Received"} - ${data.serviceName}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Your Booking is ${data.status === "confirmed" ? "Booking Confirmed" : "Booking Received"}</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">${
        data.status === "confirmed"
          ? "Your booking has been confirmed. Here are the details:"
          : "We have received your booking request. You'll receive a confirmation once it's approved."
      }</p>
      ${emailInfoBox([
        { label: "Service", value: String(data.serviceName) },
        ...(data.staffName ? [{ label: "With", value: String(data.staffName) }] : []),
        { label: "Date", value: String(data.date) },
        { label: "Time", value: String(data.time) },
        { label: "Duration", value: String(data.duration) },
        { label: "Price", value: String(data.price) },
      ])}
      <p style="${EMAIL_STYLES.muted}">Booking ID: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${data.bookingId}</code></p>
      <p style="${EMAIL_STYLES.muted}">If you need to make changes, please contact ${data.businessName || b.agency_name}.</p>`,
      `Your booking for ${data.serviceName} on ${data.date}`
    ),
  text: (data, b) =>
    `Your Booking is ${data.status === "confirmed" ? "Confirmed!" : "Received!"}\n\nService: ${data.serviceName}\nDate: ${data.date}\nTime: ${data.time}\nDuration: ${data.duration}\nPrice: ${data.price}\n\nBooking ID: ${data.bookingId}\n\nContact ${data.businessName || b.agency_name} for changes.`,
};

const booking_confirmation_owner: BrandedTemplate = {
  subject: (data) =>
    `🔔 New Booking: ${data.serviceName} - ${data.customerName}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">New Booking Received</h1>
      <p style="${EMAIL_STYLES.text}">You have a new booking from <strong>${data.customerName}</strong>.</p>
      ${emailInfoBox(
        [
          { label: "Customer", value: String(data.customerName) },
          { label: "Email", value: String(data.customerEmail) },
          ...(data.customerPhone ? [{ label: "Phone", value: String(data.customerPhone) }] : []),
          { label: "Service", value: String(data.serviceName) },
          ...(data.staffName ? [{ label: "Staff", value: String(data.staffName) }] : []),
          { label: "Date", value: String(data.date) },
          { label: "Time", value: String(data.time) },
          { label: "Duration", value: String(data.duration) },
          { label: "Price", value: String(data.price) },
          { label: "Status", value: String(data.status) },
        ],
        "#f0fdf4",
        "#bbf7d0"
      )}
      ${emailButton(b, String(data.dashboardUrl), "View in Dashboard")}`,
      `New booking from ${data.customerName} for ${data.serviceName}`
    ),
  text: (data) =>
    `New Booking!\n\nCustomer: ${data.customerName} (${data.customerEmail})\nService: ${data.serviceName}\nDate: ${data.date} at ${data.time}\nPrice: ${data.price}\nStatus: ${data.status}\n\nDashboard: ${data.dashboardUrl}`,
};

const booking_cancelled_customer: BrandedTemplate = {
  subject: () => "Booking Cancelled",
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Booking Cancelled</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">Your booking for <strong>${data.serviceName}</strong> on ${data.date} at ${data.time} has been cancelled.</p>
      <p style="${EMAIL_STYLES.text}">If you'd like to rebook, please visit our booking page.</p>
      <p style="${EMAIL_STYLES.muted}">Booking ID: ${data.bookingId}</p>`,
      `Your booking for ${data.serviceName} has been cancelled`
    ),
  text: (data) =>
    `Booking Cancelled\n\nYour booking for ${data.serviceName} on ${data.date} at ${data.time} has been cancelled.\n\nBooking ID: ${data.bookingId}`,
};

const booking_cancelled_owner: BrandedTemplate = {
  subject: (data) =>
    `❌ Booking Cancelled: ${data.customerName} - ${data.serviceName}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Booking Cancelled</h1>
      <p style="${EMAIL_STYLES.text}">A booking has been cancelled.</p>
      ${emailInfoBox(
        [
          { label: "Customer", value: String(data.customerName) },
          { label: "Service", value: String(data.serviceName) },
          { label: "Date/Time", value: `${data.date} at ${data.time}` },
          ...(data.reason ? [{ label: "Reason", value: String(data.reason) }] : []),
        ],
        "#fef2f2",
        "#fecaca"
      )}
      ${emailButton(b, String(data.dashboardUrl), "View in Dashboard")}`,
      `Booking cancelled: ${data.customerName} - ${data.serviceName}`
    ),
  text: (data) =>
    `Booking Cancelled\n\nCustomer: ${data.customerName}\nService: ${data.serviceName}\nDate/Time: ${data.date} at ${data.time}\n\nDashboard: ${data.dashboardUrl}`,
};

// ============================================================================
// E-COMMERCE TEMPLATES
// ============================================================================

const order_confirmation_customer: BrandedTemplate = {
  subject: (data) => `Order Confirmed - #${data.orderNumber}`,
  html: (data, b) => {
    const items =
      (data.items as Array<{ name: string; quantity: number; price: string }>) ||
      [];
    const itemRows = items
      .map(
        (item) =>
          `<tr><td style="padding:10px;border-bottom:1px solid #f3f4f6;">${item.name}</td><td style="padding:10px;border-bottom:1px solid #f3f4f6;text-align:center;">${item.quantity}</td><td style="padding:10px;border-bottom:1px solid #f3f4f6;text-align:right;">${item.price}</td></tr>`
      )
      .join("");

    return baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Order Confirmed! 🎉</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">Thank you for your order! Here's your order summary:</p>
      <p style="${EMAIL_STYLES.text}"><strong>Order #${data.orderNumber}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:10px;text-align:left;border-bottom:2px solid #e5e7eb;">Item</th>
          <th style="padding:10px;text-align:center;border-bottom:2px solid #e5e7eb;">Qty</th>
          <th style="padding:10px;text-align:right;border-bottom:2px solid #e5e7eb;">Price</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;">
        <table style="width:100%;">
          <tr><td style="padding:4px 0;color:#6b7280;">Subtotal:</td><td style="padding:4px 0;text-align:right;">${data.subtotal}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Shipping:</td><td style="padding:4px 0;text-align:right;">${data.shipping}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Tax:</td><td style="padding:4px 0;text-align:right;">${data.tax}</td></tr>
          <tr><td style="padding:8px 0 0;font-weight:700;border-top:2px solid #e5e7eb;">Total:</td><td style="padding:8px 0 0;text-align:right;font-weight:700;font-size:18px;border-top:2px solid #e5e7eb;">${data.total}</td></tr>
        </table>
      </div>
      ${data.shippingAddress ? `<p style="${EMAIL_STYLES.text}"><strong>Shipping to:</strong> ${data.shippingAddress}</p>` : ""}
      <p style="${EMAIL_STYLES.muted}">If you have any questions about your order, please contact ${data.businessName || b.agency_name}.</p>`,
      `Order #${data.orderNumber} confirmed`
    );
  },
  text: (data, b) => {
    const items =
      (data.items as Array<{ name: string; quantity: number; price: string }>) ||
      [];
    const itemLines = items
      .map((item) => `  ${item.name} x${item.quantity} - ${item.price}`)
      .join("\n");
    return `Order Confirmed!\n\nOrder #${data.orderNumber}\n\nItems:\n${itemLines}\n\nSubtotal: ${data.subtotal}\nShipping: ${data.shipping}\nTax: ${data.tax}\nTotal: ${data.total}\n\nContact ${data.businessName || b.agency_name} for questions.`;
  },
};

const order_confirmation_owner: BrandedTemplate = {
  subject: (data) => `🛒 New Order #${data.orderNumber} - ${data.total}`,
  html: (data, b) => {
    const items =
      (data.items as Array<{ name: string; quantity: number; price: string }>) ||
      [];
    const itemRows = items
      .map(
        (item) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #f3f4f6;">${item.name}</td><td style="padding:8px;border-bottom:1px solid #f3f4f6;text-align:center;">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #f3f4f6;text-align:right;">${item.price}</td></tr>`
      )
      .join("");

    return baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">🛒 New Order Received!</h1>
      <p style="${EMAIL_STYLES.text}">You have a new order from <strong>${data.customerName}</strong>.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Order #${data.orderNumber}</strong></p>
        <p style="margin:0 0 4px;color:#6b7280;">Customer: ${data.customerName} (${data.customerEmail})</p>
        <p style="margin:0 0 4px;color:#6b7280;">Payment: <span style="background:${data.paymentStatus === "paid" ? "#dcfce7;color:#166534" : "#fef9c3;color:#854d0e"};padding:2px 8px;border-radius:12px;font-size:13px;">${data.paymentStatus}</span></p>
        <p style="margin:0;font-size:24px;font-weight:700;color:#166534;">${data.total}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:8px;text-align:left;">Item</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Price</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      ${emailButton(b, String(data.dashboardUrl), "View Order in Dashboard")}`,
      `New order #${data.orderNumber} from ${data.customerName}`
    );
  },
  text: (data) => {
    const items =
      (data.items as Array<{ name: string; quantity: number; price: string }>) ||
      [];
    const itemLines = items
      .map((item) => `  ${item.name} x${item.quantity} - ${item.price}`)
      .join("\n");
    return `New Order #${data.orderNumber}\n\nCustomer: ${data.customerName} (${data.customerEmail})\nPayment: ${data.paymentStatus}\nTotal: ${data.total}\n\nItems:\n${itemLines}\n\nDashboard: ${data.dashboardUrl}`;
  },
};

const order_shipped_customer: BrandedTemplate = {
  subject: (data) =>
    `Your Order #${data.orderNumber} Has Shipped! 📦`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Your Order Has Shipped! 📦</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">Great news! Your order <strong>#${data.orderNumber}</strong> is on its way.</p>
      ${
        data.trackingNumber
          ? `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;color:#6b7280;">Tracking Number:</p>
        <p style="margin:0;font-weight:600;font-size:18px;">${data.trackingNumber}</p>
        ${data.trackingUrl ? `<p style="margin:8px 0 0;"><a href="${data.trackingUrl}" style="color:#2563eb;">Track Your Package →</a></p>` : ""}
      </div>`
          : ""
      }
      <p style="${EMAIL_STYLES.muted}">If you have any questions, please contact ${data.businessName || b.agency_name}.</p>`,
      `Order #${data.orderNumber} has shipped`
    ),
  text: (data, b) =>
    `Your Order Has Shipped!\n\nOrder #${data.orderNumber} is on its way.\n${data.trackingNumber ? `\nTracking: ${data.trackingNumber}` : ""}${data.trackingUrl ? `\nTrack: ${data.trackingUrl}` : ""}\n\nContact ${data.businessName || b.agency_name} for questions.`,
};

const order_delivered_customer: BrandedTemplate = {
  subject: (data) =>
    `Your Order #${data.orderNumber} Has Been Delivered! ✅`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Order Delivered! ✅</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">Your order <strong>#${data.orderNumber}</strong> has been delivered.</p>
      <p style="${EMAIL_STYLES.text}">We hope you love your purchase! If you have any questions or concerns about your order, please don't hesitate to reach out.</p>
      <p style="${EMAIL_STYLES.muted}">Thank you for shopping with ${data.businessName || b.agency_name}!</p>`,
      `Order #${data.orderNumber} delivered`
    ),
  text: (data, b) =>
    `Order Delivered!\n\nYour order #${data.orderNumber} has been delivered.\n\nThank you for shopping with ${data.businessName || b.agency_name}!`,
};

const order_cancelled_customer: BrandedTemplate = {
  subject: (data) =>
    `Order #${data.orderNumber} Has Been Cancelled`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Order Cancelled</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">Your order <strong>#${data.orderNumber}</strong> has been cancelled.</p>
      ${data.reason ? `<p style="${EMAIL_STYLES.text}"><strong>Reason:</strong> ${data.reason}</p>` : ""}
      <p style="${EMAIL_STYLES.text}">If you were charged, a refund will be processed automatically. Please allow 5-10 business days for the refund to appear.</p>
      <p style="${EMAIL_STYLES.muted}">If you have any questions, please contact ${data.businessName || b.agency_name}.</p>`,
      `Order #${data.orderNumber} cancelled`
    ),
  text: (data, b) =>
    `Order Cancelled\n\nYour order #${data.orderNumber} has been cancelled.${data.reason ? `\nReason: ${data.reason}` : ""}\n\nIf you were charged, a refund will be processed automatically.\n\nContact ${data.businessName || b.agency_name} for questions.`,
};

const order_cancelled_owner: BrandedTemplate = {
  subject: (data) =>
    `❌ Order #${data.orderNumber} Cancelled`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Order Cancelled</h1>
      <p style="${EMAIL_STYLES.text}">An order has been cancelled.</p>
      ${emailInfoBox(
        [
          { label: "Order", value: `#${String(data.orderNumber)}` },
          { label: "Customer", value: String(data.customerName) },
          { label: "Email", value: String(data.customerEmail) },
          { label: "Total", value: String(data.total) },
          ...(data.reason ? [{ label: "Reason", value: String(data.reason) }] : []),
        ],
        "#fef2f2",
        "#fecaca"
      )}
      ${emailButton(b, String(data.dashboardUrl), "View in Dashboard")}`,
      `Order #${data.orderNumber} cancelled`
    ),
  text: (data) =>
    `Order Cancelled\n\nOrder #${data.orderNumber}\nCustomer: ${data.customerName} (${data.customerEmail})\nTotal: ${data.total}\n${data.reason ? `Reason: ${data.reason}\n` : ""}\nDashboard: ${data.dashboardUrl}`,
};

const payment_received_customer: BrandedTemplate = {
  subject: (data) =>
    `Payment Confirmed for Order #${data.orderNumber} 💳`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Payment Confirmed! 💳</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">We've received your payment for order <strong>#${data.orderNumber}</strong>.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 4px;color:#6b7280;">Amount Paid</p>
        <p style="margin:0;font-size:28px;font-weight:700;color:#166534;">${data.total}</p>
        ${data.paymentMethod ? `<p style="margin:8px 0 0;color:#6b7280;font-size:14px;">via ${data.paymentMethod}</p>` : ""}
      </div>
      <p style="${EMAIL_STYLES.text}">Your order is now being processed and you'll receive updates as it progresses.</p>
      <p style="${EMAIL_STYLES.muted}">Thank you for shopping with ${data.businessName || b.agency_name}!</p>`,
      `Payment confirmed for order #${data.orderNumber}`
    ),
  text: (data, b) =>
    `Payment Confirmed!\n\nWe've received your payment for order #${data.orderNumber}.\nAmount: ${data.total}\n${data.paymentMethod ? `Method: ${data.paymentMethod}\n` : ""}\nThank you for shopping with ${data.businessName || b.agency_name}!`,
};

const refund_issued_customer: BrandedTemplate = {
  subject: (data) =>
    `Refund Issued for Order #${data.orderNumber}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Refund Issued</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">A refund has been issued for your order <strong>#${data.orderNumber}</strong>.</p>
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 4px;color:#6b7280;">Refund Amount</p>
        <p style="margin:0;font-size:28px;font-weight:700;color:#1e40af;">${data.refundAmount}</p>
      </div>
      ${data.reason ? `<p style="${EMAIL_STYLES.text}"><strong>Reason:</strong> ${data.reason}</p>` : ""}
      <p style="${EMAIL_STYLES.text}">Please allow 5-10 business days for the refund to appear in your account.</p>
      <p style="${EMAIL_STYLES.muted}">If you have any questions, please contact ${data.businessName || b.agency_name}.</p>`,
      `Refund issued for order #${data.orderNumber}`
    ),
  text: (data, b) =>
    `Refund Issued\n\nA refund of ${data.refundAmount} has been issued for order #${data.orderNumber}.${data.reason ? `\nReason: ${data.reason}` : ""}\n\nPlease allow 5-10 business days.\n\nContact ${data.businessName || b.agency_name} for questions.`,
};

const low_stock_admin: BrandedTemplate = {
  subject: (data) =>
    `⚠️ Low Stock Alert: ${data.productName}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">⚠️ Low Stock Alert</h1>
      <p style="${EMAIL_STYLES.text}">A product is running low on stock.</p>
      ${emailInfoBox(
        [
          { label: "Product", value: String(data.productName) },
          ...(data.sku ? [{ label: "SKU", value: String(data.sku) }] : []),
          { label: "Current Stock", value: String(data.currentStock) },
          { label: "Threshold", value: String(data.threshold) },
        ],
        "#fffbeb",
        "#fde68a"
      )}
      ${emailButton(b, String(data.dashboardUrl), "Manage Inventory")}
      <p style="${EMAIL_STYLES.muted}">Restock this product to avoid missed sales.</p>`,
      `Low stock: ${data.productName} (${data.currentStock} remaining)`
    ),
  text: (data) =>
    `Low Stock Alert\n\nProduct: ${data.productName}${data.sku ? `\nSKU: ${data.sku}` : ""}\nCurrent Stock: ${data.currentStock}\nThreshold: ${data.threshold}\n\nDashboard: ${data.dashboardUrl}`,
};

const back_in_stock_customer: BrandedTemplate = {
  subject: (data) =>
    `${data.productName} is Back in Stock! 🎉`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Back in Stock! 🎉</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">Great news! <strong>${data.productName}</strong> is back in stock and available for purchase.</p>
      <p style="${EMAIL_STYLES.text}">Don't wait too long — popular items sell out fast!</p>
      ${emailButton(b, String(data.productUrl), "Shop Now")}
      <p style="${EMAIL_STYLES.muted}">You're receiving this because you signed up to be notified when this product was restocked.</p>`,
      `${data.productName} is back in stock`
    ),
  text: (data, b) =>
    `Back in Stock!\n\n${data.productName} is back in stock.\n\nShop now: ${data.productUrl}\n\nThank you, ${data.businessName || b.agency_name}`,
};

const abandoned_cart_customer: BrandedTemplate = {
  subject: (data) =>
    `You left something behind! 🛒`,
  html: (data, b) => {
    const items =
      (data.items as Array<{ name: string; quantity: number; price: string }>) ||
      [];
    const itemRows = items
      .map(
        (item) =>
          `<tr><td style="padding:10px;border-bottom:1px solid #f3f4f6;">${item.name}</td><td style="padding:10px;border-bottom:1px solid #f3f4f6;text-align:center;">${item.quantity}</td><td style="padding:10px;border-bottom:1px solid #f3f4f6;text-align:right;">${item.price}</td></tr>`
      )
      .join("");

    return baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">You Left Something Behind! 🛒</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">You have items waiting in your cart. Complete your purchase before they're gone!</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:10px;text-align:left;border-bottom:2px solid #e5e7eb;">Item</th>
          <th style="padding:10px;text-align:center;border-bottom:2px solid #e5e7eb;">Qty</th>
          <th style="padding:10px;text-align:right;border-bottom:2px solid #e5e7eb;">Price</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;text-align:right;">
        <span style="font-weight:700;font-size:18px;">Total: ${data.total}</span>
      </div>
      ${emailButton(b, String(data.checkoutUrl), "Complete Your Order")}
      <p style="${EMAIL_STYLES.muted}">If you have any questions, please contact ${data.businessName || b.agency_name}.</p>`,
      `You left items in your cart`
    );
  },
  text: (data, b) => {
    const items =
      (data.items as Array<{ name: string; quantity: number; price: string }>) ||
      [];
    const itemLines = items
      .map((item) => `  ${item.name} x${item.quantity} - ${item.price}`)
      .join("\n");
    return `You Left Something Behind!\n\nItems in your cart:\n${itemLines}\n\nTotal: ${data.total}\n\nComplete your order: ${data.checkoutUrl}\n\nContact ${data.businessName || b.agency_name} for questions.`;
  },
};

// ============================================================================
// FORM TEMPLATES
// ============================================================================

const form_submission_owner: BrandedTemplate = {
  subject: (data) => `📝 New Form Submission: ${data.formName}`,
  html: (data, b) => {
    const fields =
      (data.fields as Array<{ label: string; value: string }>) || [];
    const fieldRows = fields
      .map(
        (f) =>
          `<tr><td style="padding:10px;border-bottom:1px solid #f3f4f6;font-weight:500;color:#374151;width:40%;">${f.label}</td><td style="padding:10px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${f.value}</td></tr>`
      )
      .join("");

    return baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">📝 New Form Submission</h1>
      <p style="${EMAIL_STYLES.text}">You have a new submission from <strong>${data.formName}</strong>${data.siteName ? ` on ${data.siteName}` : ""}.</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 16px;">Submitted: ${data.submittedAt}</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">${fieldRows}</table>
      ${data.dashboardUrl ? emailButton(b, String(data.dashboardUrl), "View in Dashboard") : ""}`,
      `New form submission from ${data.formName}`
    );
  },
  text: (data) => {
    const fields =
      (data.fields as Array<{ label: string; value: string }>) || [];
    const fieldLines = fields.map((f) => `${f.label}: ${f.value}`).join("\n");
    return `New Form Submission\n\nForm: ${data.formName}\n${data.siteName ? `Site: ${data.siteName}\n` : ""}Submitted: ${data.submittedAt}\n\n${fieldLines}\n\n${data.dashboardUrl ? `Dashboard: ${data.dashboardUrl}` : ""}`;
  },
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

// ============================================================================
// QUOTE TEMPLATES
// ============================================================================

const quote_sent_customer: BrandedTemplate = {
  subject: (data) => data.subject ? String(data.subject) : `Quote ${data.quoteNumber} from ${data._agencyName || "us"}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">You&rsquo;ve Received a Quote</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">${b.agency_name} has sent you a quote.</p>
      ${data.message ? `<p style="${EMAIL_STYLES.text}">${String(data.message).replace(/\n/g, "<br>")}</p>` : ""}
      ${emailInfoBox([
        { label: "Quote", value: String(data.quoteNumber) },
        { label: "Total", value: String(data.totalAmount) },
        ...(data.expiryDate ? [{ label: "Expires", value: String(data.expiryDate) }] : []),
      ])}
      ${emailButton(b, String(data.viewQuoteUrl), "View Quote")}
      <p style="${EMAIL_STYLES.muted}">Click the button above to view, accept, or decline this quote.</p>`,
      `Quote ${data.quoteNumber} from ${b.agency_name}`
    ),
  text: (data, b) =>
    `You've received a quote from ${b.agency_name}.\n\nQuote: ${data.quoteNumber}\nTotal: ${data.totalAmount}\n${data.expiryDate ? `Expires: ${data.expiryDate}\n` : ""}\n${data.message ? `Message:\n${data.message}\n\n` : ""}View your quote: ${data.viewQuoteUrl}`,
};

const quote_reminder_customer: BrandedTemplate = {
  subject: (data) => `Reminder: Quote ${data.quoteNumber} awaiting your response`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Quote Reminder</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.customerName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">This is a friendly reminder that you have a pending quote from ${b.agency_name}.</p>
      ${data.message ? `<p style="${EMAIL_STYLES.text}">${String(data.message).replace(/\n/g, "<br>")}</p>` : ""}
      ${emailInfoBox([
        { label: "Quote", value: String(data.quoteNumber) },
        { label: "Total", value: String(data.totalAmount) },
        ...(data.expiryDate ? [{ label: "Expires", value: String(data.expiryDate) }] : []),
      ])}
      ${emailButton(b, String(data.viewQuoteUrl), "View Quote")}
      <p style="${EMAIL_STYLES.muted}">Click the button above to view, accept, or decline this quote.</p>`,
      `Reminder: Quote ${data.quoteNumber}`
    ),
  text: (data, b) =>
    `Quote Reminder from ${b.agency_name}\n\nQuote: ${data.quoteNumber}\nTotal: ${data.totalAmount}\n${data.expiryDate ? `Expires: ${data.expiryDate}\n` : ""}\n${data.message ? `${data.message}\n\n` : ""}View your quote: ${data.viewQuoteUrl}`,
};

const quote_accepted_owner: BrandedTemplate = {
  subject: (data) => `✅ Quote ${data.quoteNumber} accepted by ${data.customerName}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Quote Accepted!</h1>
      <p style="${EMAIL_STYLES.text}">Great news! A customer has accepted your quote.</p>
      ${emailInfoBox([
        { label: "Quote", value: String(data.quoteNumber) },
        { label: "Customer", value: String(data.customerName) },
        { label: "Email", value: String(data.customerEmail) },
        { label: "Total", value: String(data.totalAmount) },
        { label: "Accepted by", value: String(data.acceptedByName) },
      ])}
      ${emailButton(b, String(data.dashboardUrl), "View in Dashboard")}`,
      `Quote ${data.quoteNumber} accepted`
    ),
  text: (data) =>
    `Quote Accepted!\n\nQuote: ${data.quoteNumber}\nCustomer: ${data.customerName} (${data.customerEmail})\nTotal: ${data.totalAmount}\nAccepted by: ${data.acceptedByName}\n\nView in dashboard: ${data.dashboardUrl}`,
};

const quote_rejected_owner: BrandedTemplate = {
  subject: (data) => `❌ Quote ${data.quoteNumber} declined by ${data.customerName}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">Quote Declined</h1>
      <p style="${EMAIL_STYLES.text}">A customer has declined your quote.</p>
      ${emailInfoBox([
        { label: "Quote", value: String(data.quoteNumber) },
        { label: "Customer", value: String(data.customerName) },
        { label: "Email", value: String(data.customerEmail) },
        { label: "Total", value: String(data.totalAmount) },
        ...(data.rejectionReason ? [{ label: "Reason", value: String(data.rejectionReason) }] : []),
      ])}
      ${emailButton(b, String(data.dashboardUrl), "View in Dashboard")}
      <p style="${EMAIL_STYLES.text}">Consider reaching out to the customer to discuss alternatives.</p>`,
      `Quote ${data.quoteNumber} declined`
    ),
  text: (data) =>
    `Quote Declined\n\nQuote: ${data.quoteNumber}\nCustomer: ${data.customerName} (${data.customerEmail})\nTotal: ${data.totalAmount}\n${data.rejectionReason ? `Reason: ${data.rejectionReason}\n` : ""}\nView in dashboard: ${data.dashboardUrl}`,
};

// ============================================================================
// DOMAIN TEMPLATES
// ============================================================================

const domain_expiring: BrandedTemplate = {
  subject: (data) =>
    `⚠️ Domain ${data.domainName} expires in ${data.daysUntilExpiry} day${Number(data.daysUntilExpiry) === 1 ? "" : "s"}`,
  html: (data, b) =>
    baseEmailTemplate(
      b,
      `<h1 style="${EMAIL_STYLES.heading}">⚠️ Domain Expiry Notice</h1>
      <p style="${EMAIL_STYLES.text}">Hi ${data.agencyName || "there"},</p>
      <p style="${EMAIL_STYLES.text}">Your domain <strong>${data.domainName}</strong> will expire on <strong>${data.expiryDate}</strong> (in ${data.daysUntilExpiry} day${Number(data.daysUntilExpiry) === 1 ? "" : "s"}).</p>
      ${data.autoRenew === true || data.autoRenew === "true" ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="${EMAIL_STYLES.text}; color: #16a34a; margin:0;">✅ Auto-renewal is <strong>enabled</strong> for this domain. It will be renewed automatically before expiry.</p>
        </div>
      ` : `
        <p style="${EMAIL_STYLES.text}; color: #dc2626;">Auto-renewal is <strong>disabled</strong>. Please renew manually to keep this domain active.</p>
        ${data.renewUrl ? emailButton(b, String(data.renewUrl), "Renew Now") : ""}
      `}
      <p style="${EMAIL_STYLES.text}; color: #6b7280; font-size: 13px;">If you no longer need this domain, you can safely ignore this email.</p>`,
      `Domain Expiry Notice – ${data.domainName}`
    ),
  text: (data) =>
    `Domain Expiry Notice\n\nYour domain ${data.domainName} will expire on ${data.expiryDate} (in ${data.daysUntilExpiry} days).\n\n${data.autoRenew === true || data.autoRenew === "true" ? "Auto-renewal is enabled." : `Auto-renewal is disabled. Renew at: ${data.renewUrl || "your dashboard"}`}`,
};

export const BRANDED_TEMPLATES: Record<EmailType, BrandedTemplate> = {
  welcome,
  password_reset,
  email_changed,
  team_invitation,
  team_member_joined,
  site_published,
  domain_connected,
  subscription_created,
  payment_failed,
  trial_ending,
  booking_confirmation_customer,
  booking_confirmation_owner,
  booking_cancelled_customer,
  booking_cancelled_owner,
  order_confirmation_customer,
  order_confirmation_owner,
  order_shipped_customer,
  order_delivered_customer,
  order_cancelled_customer,
  order_cancelled_owner,
  payment_received_customer,
  refund_issued_customer,
  low_stock_admin,
  back_in_stock_customer,
  abandoned_cart_customer,
  quote_sent_customer,
  quote_reminder_customer,
  quote_accepted_owner,
  quote_rejected_owner,
  form_submission_owner,
  domain_expiring,
  // Live Chat (reuse simple text-based templates)
  chat_transcript: {
    subject: (data) => `Chat Transcript — ${data.visitorName || 'Visitor'}`,
    html: (data) => `<p>Chat transcript for ${data.visitorName || 'a visitor'}.</p><pre>${data.transcript || ''}</pre>`,
    text: (data) => `Chat Transcript\n\n${data.transcript || 'No transcript available.'}`,
  },
  chat_missed_notification: {
    subject: (data) => `Missed Chat from ${data.visitorName || 'a visitor'}`,
    html: (data) => `<p>A visitor tried to chat but no agents were available.</p><p>Message: ${data.visitorMessage || 'N/A'}</p>`,
    text: (data) => `Missed Chat\n\nVisitor: ${data.visitorName || 'Unknown'}\nMessage: ${data.visitorMessage || 'N/A'}`,
  },
};

/**
 * Render a branded email template.
 * Returns subject, html, and text for the given email type.
 */
export function renderBrandedTemplate(
  type: EmailType,
  data: Record<string, unknown>,
  branding: EmailBranding
): { subject: string; html: string; text: string } {
  const template = BRANDED_TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown email type: ${type}`);
  }

  // Inject agency name into data for subject use
  const enrichedData = { ...data, _agencyName: branding.agency_name };

  return {
    subject: template.subject(enrichedData),
    html: template.html(enrichedData, branding),
    text: template.text(enrichedData, branding),
  };
}
