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
  | `system.${string}.${string}`
  | `automation.${string}.${string}`
  | string  // Allow custom events

// ============================================================================
// EVENT CATEGORIES
// ============================================================================

export const EVENT_CATEGORIES = [
  { id: 'crm', name: 'CRM', icon: '👤', description: 'Contact, company, deal, and activity events' },
  { id: 'booking', name: 'Booking', icon: '📅', description: 'Appointment and scheduling events' },
  { id: 'form', name: 'Forms', icon: '📝', description: 'Form submission and creation events' },
  { id: 'accounting', name: 'Accounting', icon: '💰', description: 'Invoice, payment, and expense events' },
  { id: 'ecommerce', name: 'E-Commerce', icon: '🛒', description: 'Order, cart, and product events' },
  { id: 'system', name: 'System', icon: '⚙️', description: 'Webhook, schedule, and module events' },
  { id: 'automation', name: 'Automation', icon: '⚡', description: 'Workflow execution events' },
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
  
  // System Events
  events.push(
    { id: EVENT_REGISTRY.system.webhook.received, category: 'system', entity: 'webhook', action: 'received', name: 'Webhook Received', description: 'Triggered when a webhook is received' },
    { id: EVENT_REGISTRY.system.schedule.triggered, category: 'system', entity: 'schedule', action: 'triggered', name: 'Schedule Triggered', description: 'Triggered on a scheduled time' },
    { id: EVENT_REGISTRY.system.module.installed, category: 'system', entity: 'module', action: 'installed', name: 'Module Installed', description: 'Triggered when a module is installed' },
    { id: EVENT_REGISTRY.system.user.created, category: 'system', entity: 'user', action: 'created', name: 'User Created', description: 'Triggered when a new user is created' },
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
