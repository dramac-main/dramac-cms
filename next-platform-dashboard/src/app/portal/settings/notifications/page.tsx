/**
 * Portal Notification Preferences
 *
 * Session 2 Communication Overhaul — Focus Area 4.6.
 *
 * Lets a portal user opt in / out of each notification event on each of the
 * three channels (in-app, email, push). Reads and writes through the portal
 * DAL, which enforces tenancy.
 *
 * Defaults are all-true; a row in `portal_notification_preferences` is only
 * written when the user flips a toggle.
 */

import type { Metadata } from "next";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { createPortalDAL } from "@/lib/portal/data-access";
import { PageHeader } from "@/components/layout/page-header";
import {
  NotificationPreferencesForm,
  type PreferenceGroup,
} from "@/components/portal/notifications/notification-preferences-form";

export const metadata: Metadata = {
  title: "Notification Preferences | Portal",
  description: "Choose which notifications you receive and how",
};

const GROUPS: PreferenceGroup[] = [
  {
    label: "Live Chat",
    events: [
      { type: "chat_message", title: "New chat message" },
      { type: "chat_assigned", title: "Chat assigned to me" },
      { type: "chat_missed", title: "Missed chat" },
      { type: "chat_rating", title: "New rating" },
    ],
  },
  {
    label: "E-commerce",
    events: [
      { type: "new_order", title: "New order" },
      { type: "order_shipped", title: "Order shipped" },
      { type: "order_delivered", title: "Order delivered" },
      { type: "order_cancelled", title: "Order cancelled" },
      { type: "refund_issued", title: "Refund issued" },
      { type: "low_stock", title: "Low stock alert" },
      { type: "payment_received", title: "Payment received" },
    ],
  },
  {
    label: "Bookings",
    events: [
      { type: "new_booking", title: "New booking" },
      { type: "booking_confirmed", title: "Booking confirmed" },
      { type: "booking_cancelled", title: "Booking cancelled" },
    ],
  },
  {
    label: "Quotes",
    events: [
      { type: "new_quote_request", title: "New quote request" },
      { type: "quote_accepted", title: "Quote accepted" },
      { type: "quote_rejected", title: "Quote rejected" },
      { type: "quote_amendment_requested", title: "Quote amendment" },
    ],
  },
  {
    label: "Forms & Leads",
    events: [{ type: "form_submission", title: "Form submission" }],
  },
  {
    label: "Billing",
    events: [
      { type: "payment_success", title: "Payment success" },
      { type: "payment_failed", title: "Payment failed" },
      { type: "subscription_renewed", title: "Subscription renewed" },
      { type: "subscription_cancelled", title: "Subscription cancelled" },
    ],
  },
  {
    label: "Domains & Email",
    events: [
      { type: "domain_provisioned", title: "Domain provisioned" },
      { type: "email_provisioned", title: "Email provisioned" },
      { type: "email_auto_renewed", title: "Email auto-renewed" },
      { type: "email_auto_renew_failed", title: "Email auto-renew failed" },
    ],
  },
  {
    label: "Account",
    events: [
      { type: "team_invite", title: "Team invitation" },
      { type: "security_alert", title: "Security alert" },
      { type: "system", title: "System notice" },
    ],
  },
];

export default async function NotificationPreferencesPage() {
  const user = await requirePortalAuth();
  const dal = createPortalDAL({
    user,
    isImpersonation: false,
    impersonatorEmail: null,
  });

  // Load current preferences for every event in the curated list.
  const eventTypes = GROUPS.flatMap((g) => g.events.map((e) => e.type));
  const currentEntries = await Promise.all(
    eventTypes.map(async (eventType) => {
      const channels = await dal.notifications.preferences.get(eventType, null);
      return [eventType, channels] as const;
    }),
  );
  const current = Object.fromEntries(currentEntries);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Preferences"
        description="Choose which notifications you receive and through which channels. Disabling in-app hides the notification from your inbox entirely."
      />
      <NotificationPreferencesForm groups={GROUPS} initial={current} />
    </div>
  );
}
