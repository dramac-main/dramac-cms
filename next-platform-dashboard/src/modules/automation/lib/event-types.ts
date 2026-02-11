/**
 * Platform Event Type Registry
 * 
 * Phase EM-57A: Automation Engine - Core Infrastructure
 * 
 * IMPORTANT: These event names are EXTENSIONS of the core module-events.ts system.
 * The automation engine subscribes to events via the existing emitEvent() infrastructure.
 * 
 * Naming Convention: {module}.{entity}.{action}
 * 
 * Examples:
 * - crm.contact.created
 * - booking.appointment.confirmed
 * - form.submission.received
 */

// ============================================================================
// EVENT REGISTRY
// ============================================================================

export const EVENT_REGISTRY = {
  // =========================================================
  // CRM MODULE (EM-50)
  // Tables: mod_crmmod01_contacts, mod_crmmod01_companies, etc.
  // =========================================================
  crm: {
    contact: {
      created: 'crm.contact.created',
      updated: 'crm.contact.updated',
      deleted: 'crm.contact.deleted',
      merged: 'crm.contact.merged',
      tag_added: 'crm.contact.tag_added',
      tag_removed: 'crm.contact.tag_removed',
      note_added: 'crm.contact.note_added',
    },
    company: {
      created: 'crm.company.created',
      updated: 'crm.company.updated',
      deleted: 'crm.company.deleted',
    },
    deal: {
      created: 'crm.deal.created',
      updated: 'crm.deal.updated',
      deleted: 'crm.deal.deleted',
      stage_changed: 'crm.deal.stage_changed',
      won: 'crm.deal.won',
      lost: 'crm.deal.lost',
      value_changed: 'crm.deal.value_changed',
      owner_changed: 'crm.deal.owner_changed',
    },
    task: {
      created: 'crm.task.created',
      completed: 'crm.task.completed',
      overdue: 'crm.task.overdue',
    },
    activity: {
      logged: 'crm.activity.logged',
      email_sent: 'crm.activity.email_sent',
      call_logged: 'crm.activity.call_logged',
      meeting_logged: 'crm.activity.meeting_logged',
    },
  },
  
  // =========================================================
  // BOOKING MODULE (EM-51)
  // Tables: mod_bookmod01_appointments, mod_bookmod01_services, etc.
  // =========================================================
  booking: {
    appointment: {
      created: 'booking.appointment.created',
      confirmed: 'booking.appointment.confirmed',
      cancelled: 'booking.appointment.cancelled',
      rescheduled: 'booking.appointment.rescheduled',
      completed: 'booking.appointment.completed',
      no_show: 'booking.appointment.no_show',
      reminder_sent: 'booking.appointment.reminder_sent',
    },
    availability: {
      updated: 'booking.availability.updated',
      blocked: 'booking.availability.blocked',
    },
    service: {
      created: 'booking.service.created',
      updated: 'booking.service.updated',
    },
  },
  
  // =========================================================
  // FORMS MODULE (Built-in)
  // =========================================================
  form: {
    submission: {
      received: 'form.submission.received',
      processed: 'form.submission.processed',
      spam_detected: 'form.submission.spam_detected',
    },
    form: {
      created: 'form.form.created',
      published: 'form.form.published',
      unpublished: 'form.form.unpublished',
    },
  },
  
  // =========================================================
  // ACCOUNTING MODULE (EM-55 - Future)
  // =========================================================
  accounting: {
    invoice: {
      created: 'accounting.invoice.created',
      sent: 'accounting.invoice.sent',
      viewed: 'accounting.invoice.viewed',
      paid: 'accounting.invoice.paid',
      partial_payment: 'accounting.invoice.partial_payment',
      overdue: 'accounting.invoice.overdue',
      cancelled: 'accounting.invoice.cancelled',
    },
    payment: {
      received: 'accounting.payment.received',
      failed: 'accounting.payment.failed',
      refunded: 'accounting.payment.refunded',
    },
    expense: {
      created: 'accounting.expense.created',
      approved: 'accounting.expense.approved',
      rejected: 'accounting.expense.rejected',
    },
    client: {
      created: 'accounting.client.created',
      updated: 'accounting.client.updated',
    },
  },
  
  // =========================================================
  // E-COMMERCE MODULE (EM-52)
  // Tables: mod_ecommod01_products, mod_ecommod01_orders, etc.
  // =========================================================
  ecommerce: {
    order: {
      created: 'ecommerce.order.created',
      paid: 'ecommerce.order.paid',
      shipped: 'ecommerce.order.shipped',
      delivered: 'ecommerce.order.delivered',
      cancelled: 'ecommerce.order.cancelled',
      refunded: 'ecommerce.order.refunded',
    },
    cart: {
      abandoned: 'ecommerce.cart.abandoned',
      recovered: 'ecommerce.cart.recovered',
    },
    product: {
      low_stock: 'ecommerce.product.low_stock',
      out_of_stock: 'ecommerce.product.out_of_stock',
      restocked: 'ecommerce.product.restocked',
    },
    customer: {
      created: 'ecommerce.customer.created',
      first_purchase: 'ecommerce.customer.first_purchase',
    },
  },
  
  // =========================================================
  // DOMAIN MODULE (DM-XX)
  // Tables: domains, domain_dns_records, domain_email_accounts,
  //         domain_orders, domain_transfers, cloudflare_zones,
  //         email_subscriptions, domain_contacts
  // =========================================================
  domain: {
    domain: {
      registered: 'domain.domain.registered',
      renewed: 'domain.domain.renewed',
      transferred_in: 'domain.domain.transferred_in',
      transferred_out: 'domain.domain.transferred_out',
      expiring_soon: 'domain.domain.expiring_soon',
      expired: 'domain.domain.expired',
      suspended: 'domain.domain.suspended',
      reactivated: 'domain.domain.reactivated',
      auto_renewed: 'domain.domain.auto_renewed',
      nameservers_changed: 'domain.domain.nameservers_changed',
    },
    dns: {
      record_created: 'domain.dns.record_created',
      record_updated: 'domain.dns.record_updated',
      record_deleted: 'domain.dns.record_deleted',
      zone_created: 'domain.dns.zone_created',
      ssl_provisioned: 'domain.dns.ssl_provisioned',
      propagation_complete: 'domain.dns.propagation_complete',
    },
    email: {
      subscription_created: 'domain.email.subscription_created',
      subscription_cancelled: 'domain.email.subscription_cancelled',
      account_created: 'domain.email.account_created',
      account_deleted: 'domain.email.account_deleted',
      quota_warning: 'domain.email.quota_warning',
    },
    order: {
      created: 'domain.order.created',
      completed: 'domain.order.completed',
      failed: 'domain.order.failed',
      refunded: 'domain.order.refunded',
    },
    transfer: {
      initiated: 'domain.transfer.initiated',
      auth_required: 'domain.transfer.auth_required',
      approved: 'domain.transfer.approved',
      completed: 'domain.transfer.completed',
      failed: 'domain.transfer.failed',
      cancelled: 'domain.transfer.cancelled',
    },
  },
  
  // =========================================================
  // BILLING MODULE (EM-59A - Paddle Billing)
  // Tables: paddle_subscriptions, paddle_transactions, usage_*, etc.
  // =========================================================
  billing: {
    subscription: {
      created: 'billing.subscription.created',
      activated: 'billing.subscription.activated',
      updated: 'billing.subscription.updated',
      cancelled: 'billing.subscription.cancelled',
      paused: 'billing.subscription.paused',
      resumed: 'billing.subscription.resumed',
      past_due: 'billing.subscription.past_due',
      trial_started: 'billing.subscription.trial_started',
      trial_ended: 'billing.subscription.trial_ended',
      plan_changed: 'billing.subscription.plan_changed',
    },
    payment: {
      completed: 'billing.payment.completed',
      failed: 'billing.payment.failed',
      refunded: 'billing.payment.refunded',
      disputed: 'billing.payment.disputed',
    },
    invoice: {
      created: 'billing.invoice.created',
      paid: 'billing.invoice.paid',
      overdue: 'billing.invoice.overdue',
    },
    usage: {
      threshold_reached: 'billing.usage.threshold_reached',
      limit_exceeded: 'billing.usage.limit_exceeded',
      overage_incurred: 'billing.usage.overage_incurred',
    },
    customer: {
      created: 'billing.customer.created',
      updated: 'billing.customer.updated',
    },
  },
  
  // =========================================================
  // SYSTEM EVENTS
  // =========================================================
  system: {
    webhook: {
      received: 'system.webhook.received',
      failed: 'system.webhook.failed',
    },
    schedule: {
      triggered: 'system.schedule.triggered',
    },
    module: {
      installed: 'system.module.installed',
      uninstalled: 'system.module.uninstalled',
      settings_changed: 'system.module.settings_changed',
    },
    user: {
      created: 'system.user.created',
      logged_in: 'system.user.logged_in',
      role_changed: 'system.user.role_changed',
    },
  },
  
  // =========================================================
  // AUTOMATION EVENTS
  // =========================================================
  automation: {
    workflow: {
      started: 'automation.workflow.started',
      completed: 'automation.workflow.completed',
      failed: 'automation.workflow.failed',
      paused: 'automation.workflow.paused',
      resumed: 'automation.workflow.resumed',
    },
    step: {
      started: 'automation.step.started',
      completed: 'automation.step.completed',
      failed: 'automation.step.failed',
      skipped: 'automation.step.skipped',
    },
  },
  
  // =========================================================
  // AI AGENTS EVENTS (EM-58A)
  // Tables: ai_agents, ai_agent_executions, ai_agent_approvals, etc.
  // =========================================================
  ai_agent: {
    agent: {
      created: 'ai_agent.agent.created',
      updated: 'ai_agent.agent.updated',
      deleted: 'ai_agent.agent.deleted',
      activated: 'ai_agent.agent.activated',
      deactivated: 'ai_agent.agent.deactivated',
    },
    execution: {
      started: 'ai_agent.execution.started',
      completed: 'ai_agent.execution.completed',
      failed: 'ai_agent.execution.failed',
      cancelled: 'ai_agent.execution.cancelled',
      waiting_approval: 'ai_agent.execution.waiting_approval',
    },
    approval: {
      requested: 'ai_agent.approval.requested',
      approved: 'ai_agent.approval.approved',
      denied: 'ai_agent.approval.denied',
      expired: 'ai_agent.approval.expired',
    },
    tool: {
      called: 'ai_agent.tool.called',
      succeeded: 'ai_agent.tool.succeeded',
      failed: 'ai_agent.tool.failed',
    },
    memory: {
      stored: 'ai_agent.memory.stored',
      consolidated: 'ai_agent.memory.consolidated',
    },
  },
} as const

// ============================================================================
// TYPE HELPERS
// ============================================================================

export type EventType = 
  | `crm.${string}.${string}`
  | `booking.${string}.${string}`
  | `form.${string}.${string}`
  | `accounting.${string}.${string}`
  | `ecommerce.${string}.${string}`
  | `domain.${string}.${string}`
  | `billing.${string}.${string}`
  | `system.${string}.${string}`
  | `automation.${string}.${string}`
  | `ai_agent.${string}.${string}`
  | string  // Allow custom events

// ============================================================================
// EVENT CATEGORIES
// ============================================================================

export const EVENT_CATEGORIES = [
  { id: 'crm', name: 'CRM', icon: 'User', description: 'Contact, company, deal, and activity events' },
  { id: 'booking', name: 'Booking', icon: 'Calendar', description: 'Appointment and scheduling events' },
  { id: 'form', name: 'Forms', icon: 'FileText', description: 'Form submission and creation events' },
  { id: 'accounting', name: 'Accounting', icon: 'CircleDollarSign', description: 'Invoice, payment, and expense events' },
  { id: 'ecommerce', name: 'E-Commerce', icon: 'ShoppingCart', description: 'Order, cart, and product events' },
  { id: 'domain', name: 'Domains', icon: 'Globe', description: 'Domain registration, DNS, email, and transfer events' },
  { id: 'billing', name: 'Billing', icon: 'CreditCard', description: 'Subscription, payment, and usage events' },
  { id: 'system', name: 'System', icon: 'Settings', description: 'Webhook, schedule, and module events' },
  { id: 'automation', name: 'Automation', icon: 'Zap', description: 'Workflow execution events' },
  { id: 'ai_agent', name: 'AI Agents', icon: 'Bot', description: 'AI agent execution and approval events' },
] as const

// ============================================================================
// FLAT EVENT LIST FOR UI
// ============================================================================

export interface EventDefinition {
  id: string
  category: string
  entity: string
  action: string
  name: string
  description: string
  payloadSchema?: Record<string, unknown>
}

export function getAllEventDefinitions(): EventDefinition[] {
  const events: EventDefinition[] = []
  
  // CRM Events
  events.push(
    { id: EVENT_REGISTRY.crm.contact.created, category: 'crm', entity: 'contact', action: 'created', name: 'Contact Created', description: 'Triggered when a new contact is created' },
    { id: EVENT_REGISTRY.crm.contact.updated, category: 'crm', entity: 'contact', action: 'updated', name: 'Contact Updated', description: 'Triggered when a contact is updated' },
    { id: EVENT_REGISTRY.crm.contact.deleted, category: 'crm', entity: 'contact', action: 'deleted', name: 'Contact Deleted', description: 'Triggered when a contact is deleted' },
    { id: EVENT_REGISTRY.crm.contact.tag_added, category: 'crm', entity: 'contact', action: 'tag_added', name: 'Tag Added to Contact', description: 'Triggered when a tag is added to a contact' },
    { id: EVENT_REGISTRY.crm.contact.tag_removed, category: 'crm', entity: 'contact', action: 'tag_removed', name: 'Tag Removed from Contact', description: 'Triggered when a tag is removed from a contact' },
    { id: EVENT_REGISTRY.crm.company.created, category: 'crm', entity: 'company', action: 'created', name: 'Company Created', description: 'Triggered when a new company is created' },
    { id: EVENT_REGISTRY.crm.company.updated, category: 'crm', entity: 'company', action: 'updated', name: 'Company Updated', description: 'Triggered when a company is updated' },
    { id: EVENT_REGISTRY.crm.deal.created, category: 'crm', entity: 'deal', action: 'created', name: 'Deal Created', description: 'Triggered when a new deal is created' },
    { id: EVENT_REGISTRY.crm.deal.stage_changed, category: 'crm', entity: 'deal', action: 'stage_changed', name: 'Deal Stage Changed', description: 'Triggered when a deal moves to a different stage' },
    { id: EVENT_REGISTRY.crm.deal.won, category: 'crm', entity: 'deal', action: 'won', name: 'Deal Won', description: 'Triggered when a deal is marked as won' },
    { id: EVENT_REGISTRY.crm.deal.lost, category: 'crm', entity: 'deal', action: 'lost', name: 'Deal Lost', description: 'Triggered when a deal is marked as lost' },
    { id: EVENT_REGISTRY.crm.task.created, category: 'crm', entity: 'task', action: 'created', name: 'Task Created', description: 'Triggered when a new task is created' },
    { id: EVENT_REGISTRY.crm.task.completed, category: 'crm', entity: 'task', action: 'completed', name: 'Task Completed', description: 'Triggered when a task is marked as complete' },
    { id: EVENT_REGISTRY.crm.activity.logged, category: 'crm', entity: 'activity', action: 'logged', name: 'Activity Logged', description: 'Triggered when an activity is logged' },
  )
  
  // Booking Events
  events.push(
    { id: EVENT_REGISTRY.booking.appointment.created, category: 'booking', entity: 'appointment', action: 'created', name: 'Appointment Created', description: 'Triggered when a new appointment is booked' },
    { id: EVENT_REGISTRY.booking.appointment.confirmed, category: 'booking', entity: 'appointment', action: 'confirmed', name: 'Appointment Confirmed', description: 'Triggered when an appointment is confirmed' },
    { id: EVENT_REGISTRY.booking.appointment.cancelled, category: 'booking', entity: 'appointment', action: 'cancelled', name: 'Appointment Cancelled', description: 'Triggered when an appointment is cancelled' },
    { id: EVENT_REGISTRY.booking.appointment.rescheduled, category: 'booking', entity: 'appointment', action: 'rescheduled', name: 'Appointment Rescheduled', description: 'Triggered when an appointment is rescheduled' },
    { id: EVENT_REGISTRY.booking.appointment.completed, category: 'booking', entity: 'appointment', action: 'completed', name: 'Appointment Completed', description: 'Triggered when an appointment is completed' },
    { id: EVENT_REGISTRY.booking.appointment.no_show, category: 'booking', entity: 'appointment', action: 'no_show', name: 'Appointment No-Show', description: 'Triggered when a client does not show up' },
    { id: EVENT_REGISTRY.booking.appointment.reminder_sent, category: 'booking', entity: 'appointment', action: 'reminder_sent', name: 'Reminder Sent', description: 'Triggered when an appointment reminder is sent' },
  )
  
  // Form Events
  events.push(
    { id: EVENT_REGISTRY.form.submission.received, category: 'form', entity: 'submission', action: 'received', name: 'Form Submitted', description: 'Triggered when a form is submitted' },
    { id: EVENT_REGISTRY.form.submission.processed, category: 'form', entity: 'submission', action: 'processed', name: 'Submission Processed', description: 'Triggered after a submission is processed' },
    { id: EVENT_REGISTRY.form.submission.spam_detected, category: 'form', entity: 'submission', action: 'spam_detected', name: 'Spam Detected', description: 'Triggered when spam is detected in a submission' },
  )
  
  // E-Commerce Events
  events.push(
    { id: EVENT_REGISTRY.ecommerce.order.created, category: 'ecommerce', entity: 'order', action: 'created', name: 'Order Created', description: 'Triggered when a new order is placed' },
    { id: EVENT_REGISTRY.ecommerce.order.paid, category: 'ecommerce', entity: 'order', action: 'paid', name: 'Order Paid', description: 'Triggered when an order is paid' },
    { id: EVENT_REGISTRY.ecommerce.order.shipped, category: 'ecommerce', entity: 'order', action: 'shipped', name: 'Order Shipped', description: 'Triggered when an order is shipped' },
    { id: EVENT_REGISTRY.ecommerce.order.delivered, category: 'ecommerce', entity: 'order', action: 'delivered', name: 'Order Delivered', description: 'Triggered when an order is delivered' },
    { id: EVENT_REGISTRY.ecommerce.order.cancelled, category: 'ecommerce', entity: 'order', action: 'cancelled', name: 'Order Cancelled', description: 'Triggered when an order is cancelled' },
    { id: EVENT_REGISTRY.ecommerce.order.refunded, category: 'ecommerce', entity: 'order', action: 'refunded', name: 'Order Refunded', description: 'Triggered when an order is refunded' },
    { id: EVENT_REGISTRY.ecommerce.cart.abandoned, category: 'ecommerce', entity: 'cart', action: 'abandoned', name: 'Cart Abandoned', description: 'Triggered when a cart is abandoned' },
    { id: EVENT_REGISTRY.ecommerce.product.low_stock, category: 'ecommerce', entity: 'product', action: 'low_stock', name: 'Low Stock Alert', description: 'Triggered when product stock is low' },
    { id: EVENT_REGISTRY.ecommerce.product.out_of_stock, category: 'ecommerce', entity: 'product', action: 'out_of_stock', name: 'Out of Stock', description: 'Triggered when a product is out of stock' },
  )
  
  // Billing Events (Paddle - EM-59A)
  events.push(
    { id: EVENT_REGISTRY.billing.subscription.created, category: 'billing', entity: 'subscription', action: 'created', name: 'Subscription Created', description: 'Triggered when a new subscription is created' },
    { id: EVENT_REGISTRY.billing.subscription.activated, category: 'billing', entity: 'subscription', action: 'activated', name: 'Subscription Activated', description: 'Triggered when a subscription becomes active' },
    { id: EVENT_REGISTRY.billing.subscription.updated, category: 'billing', entity: 'subscription', action: 'updated', name: 'Subscription Updated', description: 'Triggered when a subscription is updated' },
    { id: EVENT_REGISTRY.billing.subscription.cancelled, category: 'billing', entity: 'subscription', action: 'cancelled', name: 'Subscription Cancelled', description: 'Triggered when a subscription is cancelled' },
    { id: EVENT_REGISTRY.billing.subscription.paused, category: 'billing', entity: 'subscription', action: 'paused', name: 'Subscription Paused', description: 'Triggered when a subscription is paused' },
    { id: EVENT_REGISTRY.billing.subscription.resumed, category: 'billing', entity: 'subscription', action: 'resumed', name: 'Subscription Resumed', description: 'Triggered when a paused subscription is resumed' },
    { id: EVENT_REGISTRY.billing.subscription.past_due, category: 'billing', entity: 'subscription', action: 'past_due', name: 'Subscription Past Due', description: 'Triggered when a subscription payment is past due' },
    { id: EVENT_REGISTRY.billing.subscription.trial_started, category: 'billing', entity: 'subscription', action: 'trial_started', name: 'Trial Started', description: 'Triggered when a trial period starts' },
    { id: EVENT_REGISTRY.billing.subscription.trial_ended, category: 'billing', entity: 'subscription', action: 'trial_ended', name: 'Trial Ended', description: 'Triggered when a trial period ends' },
    { id: EVENT_REGISTRY.billing.subscription.plan_changed, category: 'billing', entity: 'subscription', action: 'plan_changed', name: 'Plan Changed', description: 'Triggered when a subscription plan is upgraded or downgraded' },
    { id: EVENT_REGISTRY.billing.payment.completed, category: 'billing', entity: 'payment', action: 'completed', name: 'Payment Completed', description: 'Triggered when a payment is successfully processed' },
    { id: EVENT_REGISTRY.billing.payment.failed, category: 'billing', entity: 'payment', action: 'failed', name: 'Payment Failed', description: 'Triggered when a payment fails' },
    { id: EVENT_REGISTRY.billing.payment.refunded, category: 'billing', entity: 'payment', action: 'refunded', name: 'Payment Refunded', description: 'Triggered when a payment is refunded' },
    { id: EVENT_REGISTRY.billing.payment.disputed, category: 'billing', entity: 'payment', action: 'disputed', name: 'Payment Disputed', description: 'Triggered when a payment is disputed (chargeback)' },
    { id: EVENT_REGISTRY.billing.invoice.created, category: 'billing', entity: 'invoice', action: 'created', name: 'Invoice Created', description: 'Triggered when an invoice is created' },
    { id: EVENT_REGISTRY.billing.invoice.paid, category: 'billing', entity: 'invoice', action: 'paid', name: 'Invoice Paid', description: 'Triggered when an invoice is paid' },
    { id: EVENT_REGISTRY.billing.invoice.overdue, category: 'billing', entity: 'invoice', action: 'overdue', name: 'Invoice Overdue', description: 'Triggered when an invoice becomes overdue' },
    { id: EVENT_REGISTRY.billing.usage.threshold_reached, category: 'billing', entity: 'usage', action: 'threshold_reached', name: 'Usage Threshold Reached', description: 'Triggered when usage reaches a warning threshold (e.g., 80%)' },
    { id: EVENT_REGISTRY.billing.usage.limit_exceeded, category: 'billing', entity: 'usage', action: 'limit_exceeded', name: 'Usage Limit Exceeded', description: 'Triggered when usage exceeds the plan limit' },
    { id: EVENT_REGISTRY.billing.usage.overage_incurred, category: 'billing', entity: 'usage', action: 'overage_incurred', name: 'Overage Incurred', description: 'Triggered when overage charges are incurred' },
    { id: EVENT_REGISTRY.billing.customer.created, category: 'billing', entity: 'customer', action: 'created', name: 'Billing Customer Created', description: 'Triggered when a Paddle customer is created' },
    { id: EVENT_REGISTRY.billing.customer.updated, category: 'billing', entity: 'customer', action: 'updated', name: 'Billing Customer Updated', description: 'Triggered when a Paddle customer is updated' },
  )
  
  // System Events
  events.push(
    { id: EVENT_REGISTRY.system.webhook.received, category: 'system', entity: 'webhook', action: 'received', name: 'Webhook Received', description: 'Triggered when a webhook is received' },
    { id: EVENT_REGISTRY.system.schedule.triggered, category: 'system', entity: 'schedule', action: 'triggered', name: 'Schedule Triggered', description: 'Triggered on a scheduled time' },
    { id: EVENT_REGISTRY.system.module.installed, category: 'system', entity: 'module', action: 'installed', name: 'Module Installed', description: 'Triggered when a module is installed' },
    { id: EVENT_REGISTRY.system.user.created, category: 'system', entity: 'user', action: 'created', name: 'User Created', description: 'Triggered when a new user is created' },
  )
  
  // AI Agent Events (EM-58A)
  events.push(
    { id: EVENT_REGISTRY.ai_agent.agent.created, category: 'ai_agent', entity: 'agent', action: 'created', name: 'AI Agent Created', description: 'Triggered when a new AI agent is created' },
    { id: EVENT_REGISTRY.ai_agent.agent.updated, category: 'ai_agent', entity: 'agent', action: 'updated', name: 'AI Agent Updated', description: 'Triggered when an AI agent is updated' },
    { id: EVENT_REGISTRY.ai_agent.agent.deleted, category: 'ai_agent', entity: 'agent', action: 'deleted', name: 'AI Agent Deleted', description: 'Triggered when an AI agent is deleted' },
    { id: EVENT_REGISTRY.ai_agent.agent.activated, category: 'ai_agent', entity: 'agent', action: 'activated', name: 'AI Agent Activated', description: 'Triggered when an AI agent is activated' },
    { id: EVENT_REGISTRY.ai_agent.agent.deactivated, category: 'ai_agent', entity: 'agent', action: 'deactivated', name: 'AI Agent Deactivated', description: 'Triggered when an AI agent is deactivated' },
    { id: EVENT_REGISTRY.ai_agent.execution.started, category: 'ai_agent', entity: 'execution', action: 'started', name: 'Agent Execution Started', description: 'Triggered when an AI agent starts execution' },
    { id: EVENT_REGISTRY.ai_agent.execution.completed, category: 'ai_agent', entity: 'execution', action: 'completed', name: 'Agent Execution Completed', description: 'Triggered when an AI agent completes execution' },
    { id: EVENT_REGISTRY.ai_agent.execution.failed, category: 'ai_agent', entity: 'execution', action: 'failed', name: 'Agent Execution Failed', description: 'Triggered when an AI agent execution fails' },
    { id: EVENT_REGISTRY.ai_agent.execution.cancelled, category: 'ai_agent', entity: 'execution', action: 'cancelled', name: 'Agent Execution Cancelled', description: 'Triggered when an AI agent execution is cancelled' },
    { id: EVENT_REGISTRY.ai_agent.execution.waiting_approval, category: 'ai_agent', entity: 'execution', action: 'waiting_approval', name: 'Agent Waiting for Approval', description: 'Triggered when an agent is waiting for human approval' },
    { id: EVENT_REGISTRY.ai_agent.approval.requested, category: 'ai_agent', entity: 'approval', action: 'requested', name: 'Approval Requested', description: 'Triggered when an agent requests human approval' },
    { id: EVENT_REGISTRY.ai_agent.approval.approved, category: 'ai_agent', entity: 'approval', action: 'approved', name: 'Action Approved', description: 'Triggered when a pending action is approved' },
    { id: EVENT_REGISTRY.ai_agent.approval.denied, category: 'ai_agent', entity: 'approval', action: 'denied', name: 'Action Denied', description: 'Triggered when a pending action is denied' },
    { id: EVENT_REGISTRY.ai_agent.approval.expired, category: 'ai_agent', entity: 'approval', action: 'expired', name: 'Approval Expired', description: 'Triggered when a pending approval expires' },
    { id: EVENT_REGISTRY.ai_agent.tool.called, category: 'ai_agent', entity: 'tool', action: 'called', name: 'Tool Called', description: 'Triggered when an agent calls a tool' },
    { id: EVENT_REGISTRY.ai_agent.tool.succeeded, category: 'ai_agent', entity: 'tool', action: 'succeeded', name: 'Tool Succeeded', description: 'Triggered when a tool execution succeeds' },
    { id: EVENT_REGISTRY.ai_agent.tool.failed, category: 'ai_agent', entity: 'tool', action: 'failed', name: 'Tool Failed', description: 'Triggered when a tool execution fails' },
    { id: EVENT_REGISTRY.ai_agent.memory.stored, category: 'ai_agent', entity: 'memory', action: 'stored', name: 'Memory Stored', description: 'Triggered when agent stores a memory' },
    { id: EVENT_REGISTRY.ai_agent.memory.consolidated, category: 'ai_agent', entity: 'memory', action: 'consolidated', name: 'Memory Consolidated', description: 'Triggered when agent memories are consolidated' },
  )
  
  // Domain Events (EM-57 - Domain & Email Reseller Integration)
  events.push(
    // Domain Events
    { id: EVENT_REGISTRY.domain.domain.registered, category: 'domain', entity: 'domain', action: 'registered', name: 'Domain Registered', description: 'Triggered when a new domain is successfully registered' },
    { id: EVENT_REGISTRY.domain.domain.renewed, category: 'domain', entity: 'domain', action: 'renewed', name: 'Domain Renewed', description: 'Triggered when a domain is renewed' },
    { id: EVENT_REGISTRY.domain.domain.transferred_in, category: 'domain', entity: 'domain', action: 'transferred_in', name: 'Domain Transferred In', description: 'Triggered when a domain is transferred into the platform' },
    { id: EVENT_REGISTRY.domain.domain.transferred_out, category: 'domain', entity: 'domain', action: 'transferred_out', name: 'Domain Transferred Out', description: 'Triggered when a domain is transferred out of the platform' },
    { id: EVENT_REGISTRY.domain.domain.expiring_soon, category: 'domain', entity: 'domain', action: 'expiring_soon', name: 'Domain Expiring Soon', description: 'Triggered when a domain is approaching expiration (30/14/7 days)' },
    { id: EVENT_REGISTRY.domain.domain.expired, category: 'domain', entity: 'domain', action: 'expired', name: 'Domain Expired', description: 'Triggered when a domain expires' },
    { id: EVENT_REGISTRY.domain.domain.suspended, category: 'domain', entity: 'domain', action: 'suspended', name: 'Domain Suspended', description: 'Triggered when a domain is suspended' },
    { id: EVENT_REGISTRY.domain.domain.reactivated, category: 'domain', entity: 'domain', action: 'reactivated', name: 'Domain Reactivated', description: 'Triggered when a suspended domain is reactivated' },
    { id: EVENT_REGISTRY.domain.domain.auto_renewed, category: 'domain', entity: 'domain', action: 'auto_renewed', name: 'Domain Auto-Renewed', description: 'Triggered when a domain is automatically renewed' },
    { id: EVENT_REGISTRY.domain.domain.nameservers_changed, category: 'domain', entity: 'domain', action: 'nameservers_changed', name: 'Nameservers Changed', description: 'Triggered when domain nameservers are updated' },
    // DNS Events
    { id: EVENT_REGISTRY.domain.dns.record_created, category: 'domain', entity: 'dns', action: 'record_created', name: 'DNS Record Created', description: 'Triggered when a new DNS record is created' },
    { id: EVENT_REGISTRY.domain.dns.record_updated, category: 'domain', entity: 'dns', action: 'record_updated', name: 'DNS Record Updated', description: 'Triggered when a DNS record is updated' },
    { id: EVENT_REGISTRY.domain.dns.record_deleted, category: 'domain', entity: 'dns', action: 'record_deleted', name: 'DNS Record Deleted', description: 'Triggered when a DNS record is deleted' },
    { id: EVENT_REGISTRY.domain.dns.zone_created, category: 'domain', entity: 'dns', action: 'zone_created', name: 'DNS Zone Created', description: 'Triggered when a DNS zone is created' },
    { id: EVENT_REGISTRY.domain.dns.ssl_provisioned, category: 'domain', entity: 'dns', action: 'ssl_provisioned', name: 'SSL Certificate Provisioned', description: 'Triggered when an SSL certificate is provisioned' },
    { id: EVENT_REGISTRY.domain.dns.propagation_complete, category: 'domain', entity: 'dns', action: 'propagation_complete', name: 'DNS Propagation Complete', description: 'Triggered when DNS changes have fully propagated' },
    // Email Events
    { id: EVENT_REGISTRY.domain.email.subscription_created, category: 'domain', entity: 'email', action: 'subscription_created', name: 'Email Subscription Created', description: 'Triggered when a new email subscription is created' },
    { id: EVENT_REGISTRY.domain.email.subscription_cancelled, category: 'domain', entity: 'email', action: 'subscription_cancelled', name: 'Email Subscription Cancelled', description: 'Triggered when an email subscription is cancelled' },
    { id: EVENT_REGISTRY.domain.email.account_created, category: 'domain', entity: 'email', action: 'account_created', name: 'Email Account Created', description: 'Triggered when a new email account is created' },
    { id: EVENT_REGISTRY.domain.email.account_deleted, category: 'domain', entity: 'email', action: 'account_deleted', name: 'Email Account Deleted', description: 'Triggered when an email account is deleted' },
    { id: EVENT_REGISTRY.domain.email.quota_warning, category: 'domain', entity: 'email', action: 'quota_warning', name: 'Email Quota Warning', description: 'Triggered when an email account approaches its storage quota' },
    // Order Events
    { id: EVENT_REGISTRY.domain.order.created, category: 'domain', entity: 'order', action: 'created', name: 'Domain Order Created', description: 'Triggered when a new domain order is placed' },
    { id: EVENT_REGISTRY.domain.order.completed, category: 'domain', entity: 'order', action: 'completed', name: 'Domain Order Completed', description: 'Triggered when a domain order is successfully completed' },
    { id: EVENT_REGISTRY.domain.order.failed, category: 'domain', entity: 'order', action: 'failed', name: 'Domain Order Failed', description: 'Triggered when a domain order fails' },
    { id: EVENT_REGISTRY.domain.order.refunded, category: 'domain', entity: 'order', action: 'refunded', name: 'Domain Order Refunded', description: 'Triggered when a domain order is refunded' },
    // Transfer Events
    { id: EVENT_REGISTRY.domain.transfer.initiated, category: 'domain', entity: 'transfer', action: 'initiated', name: 'Transfer Initiated', description: 'Triggered when a domain transfer is initiated' },
    { id: EVENT_REGISTRY.domain.transfer.auth_required, category: 'domain', entity: 'transfer', action: 'auth_required', name: 'Transfer Auth Required', description: 'Triggered when a domain transfer requires authorization' },
    { id: EVENT_REGISTRY.domain.transfer.approved, category: 'domain', entity: 'transfer', action: 'approved', name: 'Transfer Approved', description: 'Triggered when a domain transfer is approved' },
    { id: EVENT_REGISTRY.domain.transfer.completed, category: 'domain', entity: 'transfer', action: 'completed', name: 'Transfer Completed', description: 'Triggered when a domain transfer is successfully completed' },
    { id: EVENT_REGISTRY.domain.transfer.failed, category: 'domain', entity: 'transfer', action: 'failed', name: 'Transfer Failed', description: 'Triggered when a domain transfer fails' },
    { id: EVENT_REGISTRY.domain.transfer.cancelled, category: 'domain', entity: 'transfer', action: 'cancelled', name: 'Transfer Cancelled', description: 'Triggered when a domain transfer is cancelled' },
  )
  
  return events
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get events by category
 */
export function getEventsByCategory(category: string): EventDefinition[] {
  return getAllEventDefinitions().filter(e => e.category === category)
}

/**
 * Get event by ID
 */
export function getEventById(eventId: string): EventDefinition | undefined {
  return getAllEventDefinitions().find(e => e.id === eventId)
}

/**
 * Check if event type is valid
 */
export function isValidEventType(eventType: string): boolean {
  return getAllEventDefinitions().some(e => e.id === eventType)
}

/**
 * Parse event type into parts
 */
export function parseEventType(eventType: string): { category: string; entity: string; action: string } | null {
  const parts = eventType.split('.')
  if (parts.length !== 3) return null
  return {
    category: parts[0],
    entity: parts[1],
    action: parts[2],
  }
}
