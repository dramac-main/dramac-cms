/**
 * Curated list of templates a portal user is allowed to fire test sends for.
 * Kept in a plain (non-server) module so it can be imported by both the
 * "use server" actions file and any Client Component that needs to render
 * the selector — "use server" files may only export async functions.
 */

import type { EmailType } from "@/lib/email/email-types";

export const TEST_EMAIL_TEMPLATES: ReadonlyArray<{
  type: EmailType;
  label: string;
  category: string;
}> = [
  { type: "welcome", label: "Welcome", category: "Account" },
  { type: "password_reset", label: "Password reset", category: "Account" },
  {
    type: "order_confirmation_customer",
    label: "Order confirmation",
    category: "E-commerce",
  },
  {
    type: "order_shipped_customer",
    label: "Order shipped",
    category: "E-commerce",
  },
  {
    type: "payment_received_customer",
    label: "Payment received",
    category: "E-commerce",
  },
  {
    type: "booking_confirmation_customer",
    label: "Booking confirmation",
    category: "Bookings",
  },
  {
    type: "booking_confirmed_customer",
    label: "Booking confirmed",
    category: "Bookings",
  },
  {
    type: "invoice_sent_customer",
    label: "Invoice sent",
    category: "Invoicing",
  },
  {
    type: "invoice_payment_received_customer",
    label: "Invoice payment received",
    category: "Invoicing",
  },
  {
    type: "quote_sent_customer",
    label: "Quote sent",
    category: "Quotes",
  },
  {
    type: "quote_accepted_customer",
    label: "Quote accepted",
    category: "Quotes",
  },
  { type: "form_submission_owner", label: "Form submission", category: "Forms" },
];
