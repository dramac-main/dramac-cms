import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrandedEmail } from "@/lib/email/send-branded-email";
import { createNotification } from "@/lib/services/notifications";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(supabase, event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoiceFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialEnding(supabase, event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const agencyId = subscription.metadata.agency_id;
  if (!agencyId) return;

  const subscriptionItem = subscription.items.data[0];
  const quantity = subscriptionItem?.quantity || 0;
  const currentPeriodStart = subscriptionItem?.current_period_start;
  const currentPeriodEnd = subscriptionItem?.current_period_end;

  await supabase.from("subscriptions").upsert(
    {
      agency_id: agencyId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      quantity,
      current_period_start: currentPeriodStart
        ? new Date(currentPeriodStart * 1000).toISOString()
        : null,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_subscription_id",
    }
  );
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleInvoicePaid(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const customer = await stripe.customers.retrieve(invoice.customer as string);
  if (customer.deleted) return;

  const agencyId = customer.metadata.agency_id;
  if (!agencyId) return;

  await (supabase as any).from("billing_invoices").upsert(
    {
      agency_id: agencyId,
      stripe_invoice_id: invoice.id,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: "paid",
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null,
      period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null,
    },
    {
      onConflict: "stripe_invoice_id",
    }
  );
}

async function handleInvoiceFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const customer = await stripe.customers.retrieve(invoice.customer as string);
  if (customer.deleted) return;

  const agencyId = customer.metadata.agency_id;
  if (!agencyId) return;

  await (supabase as any).from("billing_invoices").upsert(
    {
      agency_id: agencyId,
      stripe_invoice_id: invoice.id,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: "failed",
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    },
    {
      onConflict: "stripe_invoice_id",
    }
  );

  // Send payment failed notification to business owner
  const { data: agency } = await (supabase as any)
    .from('agencies')
    .select('owner_id')
    .eq('id', agencyId)
    .single()

  if (agency?.owner_id) {
    // In-app notification
    await createNotification({
      userId: agency.owner_id,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your payment of ${(invoice.amount_due / 100).toFixed(2)} ${(invoice.currency || 'USD').toUpperCase()} has failed. Please update your payment method.`,
      link: invoice.hosted_invoice_url || undefined,
      metadata: { invoiceId: invoice.id, agencyId },
    })

    // Email notification
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('email, full_name')
      .eq('id', agency.owner_id)
      .single()

    if (profile?.email) {
      await sendBrandedEmail(agencyId, {
        to: { email: profile.email, name: profile.full_name || undefined },
        emailType: 'payment_failed',
        recipientUserId: agency.owner_id,
        data: {
          updatePaymentUrl: invoice.hosted_invoice_url || '',
        },
      })
    }
  }
}

async function handleTrialEnding(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const agencyId = subscription.metadata.agency_id;
  if (!agencyId) return;

  // Send trial ending notification to business owner
  const { data: agency } = await (supabase as any)
    .from('agencies')
    .select('owner_id')
    .eq('id', agencyId)
    .single()

  if (agency?.owner_id) {
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : new Date()
    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    // In-app notification
    await createNotification({
      userId: agency.owner_id,
      type: 'system',
      title: 'Trial Ending Soon',
      message: `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade to keep your account active.`,
      link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'}/billing`,
      metadata: { agencyId, daysLeft },
    })

    // Email notification
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('email, full_name')
      .eq('id', agency.owner_id)
      .single()

    if (profile?.email) {
      await sendBrandedEmail(agencyId, {
        to: { email: profile.email, name: profile.full_name || undefined },
        emailType: 'trial_ending',
        recipientUserId: agency.owner_id,
        data: {
          daysLeft,
          upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.dramac.app'}/billing`,
        },
      })
    }
  }
}
