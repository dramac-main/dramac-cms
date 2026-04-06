/**
 * Workflow Templates Library
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Pre-built workflow templates covering common automation use cases
 * across different industries and module combinations.
 */

import type { TriggerType, StepType } from '../types/automation-types'

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  industry?: string
  icon: string
  complexity: 'simple' | 'intermediate' | 'advanced'
  estimatedSetupTime: string
  tags: string[]
  
  // The actual workflow definition
  trigger: {
    type: TriggerType
    config: Record<string, unknown>
  }
  steps: Array<{
    step_type: StepType
    action_type?: string
    action_config?: Record<string, unknown>
    condition_config?: Record<string, unknown>
    delay_config?: Record<string, unknown>
    name: string
    description?: string
  }>
  
  // Required connections
  requiredConnections?: string[]
  
  // Variables that need to be configured
  configVariables?: Array<{
    key: string
    label: string
    type: 'string' | 'number' | 'select'
    options?: string[]
    defaultValue?: unknown
    required: boolean
  }>
}

// ============================================================================
// WORKFLOW TEMPLATES
// ============================================================================

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // =========================================================
  // LEAD MANAGEMENT
  // =========================================================
  {
    id: 'lead-welcome-sequence',
    name: 'New Lead Welcome Sequence',
    description: 'Automatically welcome new leads with a personalized email and create follow-up tasks',
    category: 'Lead Management',
    icon: 'Hand',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['lead', 'email', 'crm', 'onboarding'],
    trigger: {
      type: 'event',
      config: {
        event_type: 'crm.contact.created',
        filter: { lead_source: { $ne: null } },
      },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'welcome_lead',
          variables: {
            first_name: '{{trigger.first_name}}',
            company: '{{trigger.company}}',
          },
        },
        name: 'Send Welcome Email',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '1d' },
        name: 'Wait 1 Day',
      },
      {
        step_type: 'action',
        action_type: 'crm.create_task',
        action_config: {
          title: 'Follow up with {{trigger.first_name}}',
          description: 'Initial follow-up call for new lead',
          due_date: '{{now_plus_1d}}',
          contact_id: '{{trigger.id}}',
        },
        name: 'Create Follow-up Task',
      },
    ],
    configVariables: [
      {
        key: 'welcome_template',
        label: 'Welcome Email Template',
        type: 'select',
        options: ['welcome_lead', 'welcome_premium', 'welcome_referral'],
        required: true,
      },
    ],
  },

  {
    id: 'lead-scoring-automation',
    name: 'Automatic Lead Scoring',
    description: 'Score leads based on their activities and engagement',
    category: 'Lead Management',
    icon: 'ChartBar',
    complexity: 'intermediate',
    estimatedSetupTime: '15 minutes',
    tags: ['lead', 'scoring', 'crm'],
    trigger: {
      type: 'event',
      config: { event_type: 'crm.activity.logged' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'data.lookup',
        action_config: {
          module: 'crm',
          table: 'contacts',
          field: 'id',
          value: '{{trigger.contact_id}}',
        },
        name: 'Get Contact Details',
      },
      {
        step_type: 'action',
        action_type: 'transform.map',
        action_config: {
          source: '{{steps.Get Contact Details.record}}',
          mapping: {
            current_score: '{{source.lead_score}}',
            activity_points: '{{trigger.type === "email_open" ? 5 : trigger.type === "meeting" ? 20 : 10}}',
          },
        },
        name: 'Calculate Score',
      },
      {
        step_type: 'action',
        action_type: 'crm.update_contact',
        action_config: {
          contact_id: '{{trigger.contact_id}}',
          fields: {
            lead_score: '{{steps.Calculate Score.result.current_score + steps.Calculate Score.result.activity_points}}',
          },
        },
        name: 'Update Lead Score',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{steps.Update Lead Score.contact.lead_score}}', operator: 'greater_than', value: 100 },
          ],
        },
        name: 'Check Hot Lead Threshold',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_slack',
        action_config: {
          channel: '#sales',
          message: '🔥 Hot Lead Alert! {{trigger.contact_name}} just hit a lead score of {{steps.Update Lead Score.contact.lead_score}}',
        },
        name: 'Alert Sales Team',
      },
    ],
    requiredConnections: ['slack'],
  },

  {
    id: 'lead-nurture-drip',
    name: 'Lead Nurture Drip Campaign',
    description: 'Multi-step email campaign to nurture cold leads over time',
    category: 'Lead Management',
    icon: 'Sprout',
    complexity: 'intermediate',
    estimatedSetupTime: '20 minutes',
    tags: ['lead', 'email', 'drip', 'nurture'],
    trigger: {
      type: 'event',
      config: { event_type: 'crm.contact.tag_added', filter: { tag: 'nurture' } },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'nurture_intro',
        },
        name: 'Send Introduction Email',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '3d' },
        name: 'Wait 3 Days',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'nurture_value',
        },
        name: 'Send Value Proposition Email',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '4d' },
        name: 'Wait 4 Days',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'nurture_casestudy',
        },
        name: 'Send Case Study Email',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '5d' },
        name: 'Wait 5 Days',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'nurture_cta',
        },
        name: 'Send CTA Email',
      },
      {
        step_type: 'action',
        action_type: 'crm.create_task',
        action_config: {
          title: 'Review nurture campaign completion for {{trigger.first_name}}',
          contact_id: '{{trigger.id}}',
        },
        name: 'Create Review Task',
      },
    ],
  },

  // =========================================================
  // APPOINTMENT / BOOKING
  // =========================================================
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder Sequence',
    description: 'Send SMS and email reminders before appointments',
    category: 'Booking',
    industry: 'Healthcare',
    icon: 'Calendar',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['booking', 'reminder', 'sms', 'email'],
    trigger: {
      type: 'event',
      config: { event_type: 'booking.appointment.confirmed' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'appointment_confirmation',
          variables: {
            name: '{{trigger.customer_name}}',
            date: '{{trigger.appointment_date}}',
            time: '{{trigger.appointment_time}}',
            service: '{{trigger.service_name}}',
          },
        },
        name: 'Send Confirmation Email',
      },
      {
        step_type: 'delay',
        delay_config: {
          type: 'until',
          value: '{{trigger.appointment_date - 1d}}',
        },
        name: 'Wait Until Day Before',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_sms',
        action_config: {
          to: '{{trigger.customer_phone}}',
          body: 'Reminder: Your appointment is tomorrow at {{trigger.appointment_time}}. Reply CONFIRM to confirm or CANCEL to cancel.',
        },
        name: 'Send SMS Reminder',
      },
      {
        step_type: 'delay',
        delay_config: {
          type: 'until',
          value: '{{trigger.appointment_date - 2h}}',
        },
        name: 'Wait Until 2 Hours Before',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_sms',
        action_config: {
          to: '{{trigger.customer_phone}}',
          body: 'Your appointment starts in 2 hours! We look forward to seeing you.',
        },
        name: 'Send Final Reminder',
      },
    ],
    requiredConnections: ['twilio'],
    configVariables: [
      {
        key: 'first_reminder_days',
        label: 'First Reminder (days before)',
        type: 'number',
        defaultValue: 1,
        required: true,
      },
      {
        key: 'final_reminder_hours',
        label: 'Final Reminder (hours before)',
        type: 'number',
        defaultValue: 2,
        required: true,
      },
    ],
  },

  {
    id: 'no-show-followup',
    name: 'No-Show Follow-up',
    description: 'Automatically reach out to customers who miss appointments',
    category: 'Booking',
    icon: 'UserX',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['booking', 'no-show', 'follow-up'],
    trigger: {
      type: 'event',
      config: { event_type: 'booking.appointment.no_show' },
    },
    steps: [
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '1h' },
        name: 'Wait 1 Hour',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'missed_appointment',
          variables: {
            name: '{{trigger.customer_name}}',
            reschedule_link: '{{trigger.reschedule_url}}',
          },
        },
        name: 'Send Reschedule Email',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_id: '{{trigger.customer_id}}',
          type: 'note',
          description: 'Customer no-showed for appointment on {{trigger.appointment_date}}. Reschedule email sent.',
        },
        name: 'Log to CRM',
      },
    ],
  },

  {
    id: 'post-appointment-feedback',
    name: 'Post-Appointment Feedback Request',
    description: 'Request feedback after completed appointments',
    category: 'Booking',
    icon: 'Star',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['booking', 'feedback', 'review'],
    trigger: {
      type: 'event',
      config: { event_type: 'booking.appointment.completed' },
    },
    steps: [
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '2h' },
        name: 'Wait 2 Hours',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'feedback_request',
          variables: {
            name: '{{trigger.customer_name}}',
            service: '{{trigger.service_name}}',
            feedback_url: '{{trigger.feedback_url}}',
          },
        },
        name: 'Send Feedback Request',
      },
    ],
  },

  // =========================================================
  // E-COMMERCE
  // =========================================================
  {
    id: 'abandoned-cart-recovery',
    name: 'Abandoned Cart Recovery',
    description: 'Win back customers who abandoned their shopping cart',
    category: 'E-Commerce',
    icon: 'ShoppingCart',
    complexity: 'intermediate',
    estimatedSetupTime: '15 minutes',
    tags: ['ecommerce', 'cart', 'recovery', 'email'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.cart.abandoned' },
    },
    steps: [
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '1h' },
        name: 'Wait 1 Hour',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'abandoned_cart_1',
          variables: {
            name: '{{trigger.customer_name}}',
            cart_items: '{{trigger.cart_items}}',
            cart_total: '{{trigger.cart_total}}',
            checkout_url: '{{trigger.checkout_url}}',
          },
        },
        name: 'Send First Reminder',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '1d' },
        name: 'Wait 1 Day',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{trigger.recovered}}', operator: 'equals', value: false },
          ],
        },
        name: 'Check If Still Abandoned',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'abandoned_cart_2_discount',
          variables: {
            name: '{{trigger.customer_name}}',
            discount_code: 'COMEBACK10',
            checkout_url: '{{trigger.checkout_url}}',
          },
        },
        name: 'Send Discount Offer',
      },
    ],
  },

  {
    id: 'order-fulfillment-updates',
    name: 'Order Status Updates',
    description: 'Keep customers informed about their order status',
    category: 'E-Commerce',
    icon: 'Package',
    complexity: 'simple',
    estimatedSetupTime: '10 minutes',
    tags: ['ecommerce', 'order', 'shipping', 'notifications'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.order.shipped' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'order_shipped',
          variables: {
            order_number: '{{trigger.order_number}}',
            tracking_number: '{{trigger.tracking_number}}',
            tracking_url: '{{trigger.tracking_url}}',
            estimated_delivery: '{{trigger.estimated_delivery}}',
          },
        },
        name: 'Send Shipping Email',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_sms',
        action_config: {
          to: '{{trigger.customer_phone}}',
          body: 'Your order #{{trigger.order_number}} has shipped! Track it here: {{trigger.tracking_url}}',
        },
        name: 'Send SMS Notification',
      },
    ],
    requiredConnections: ['twilio'],
  },

  {
    id: 'first-purchase-thank-you',
    name: 'First Purchase Thank You',
    description: 'Welcome and thank first-time customers',
    category: 'E-Commerce',
    icon: 'Gift',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['ecommerce', 'customer', 'welcome', 'loyalty'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.customer.first_purchase' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'first_purchase_thanks',
          variables: {
            name: '{{trigger.customer_name}}',
            order_number: '{{trigger.order_number}}',
            discount_code: 'WELCOME15',
          },
        },
        name: 'Send Thank You Email',
      },
      {
        step_type: 'action',
        action_type: 'crm.add_tag',
        action_config: {
          contact_id: '{{trigger.customer_id}}',
          tag: 'first-time-buyer',
        },
        name: 'Tag as First-Time Buyer',
      },
    ],
  },

  {
    id: 'low-stock-alert',
    name: 'Low Stock Alert',
    description: 'Notify team when products are running low',
    category: 'E-Commerce',
    icon: 'AlertTriangle',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['ecommerce', 'inventory', 'alert'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.product.low_stock' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'notification.send_slack',
        action_config: {
          channel: '#inventory',
          message: '⚠️ Low Stock Alert!\n\nProduct: {{trigger.product_name}}\nSKU: {{trigger.sku}}\nCurrent Stock: {{trigger.current_stock}}\nReorder Level: {{trigger.reorder_level}}',
        },
        name: 'Alert via Slack',
      },
      {
        step_type: 'action',
        action_type: 'email.send',
        action_config: {
          to: '{{config.inventory_email}}',
          subject: 'Low Stock Alert: {{trigger.product_name}}',
          body: 'Product {{trigger.product_name}} (SKU: {{trigger.sku}}) is running low with only {{trigger.current_stock}} units remaining.',
        },
        name: 'Send Email Alert',
      },
    ],
    requiredConnections: ['slack'],
    configVariables: [
      {
        key: 'inventory_email',
        label: 'Inventory Manager Email',
        type: 'string',
        required: true,
      },
    ],
  },

  // =========================================================
  // CUSTOMER SUCCESS
  // =========================================================
  {
    id: 'customer-onboarding',
    name: 'Customer Onboarding Sequence',
    description: 'Guide new customers through product adoption',
    category: 'Customer Success',
    industry: 'B2B SaaS',
    icon: 'Rocket',
    complexity: 'advanced',
    estimatedSetupTime: '30 minutes',
    tags: ['onboarding', 'saas', 'engagement', 'drip'],
    trigger: {
      type: 'event',
      config: { event_type: 'accounting.client.created' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'onboarding_welcome',
          variables: {
            name: '{{trigger.name}}',
            login_url: '{{trigger.login_url}}',
          },
        },
        name: 'Day 0: Welcome Email',
      },
      {
        step_type: 'action',
        action_type: 'crm.create_task',
        action_config: {
          title: 'Welcome call with {{trigger.name}}',
          due_date: '{{now_plus_1d}}',
        },
        name: 'Create Welcome Call Task',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '3d' },
        name: 'Wait 3 Days',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'onboarding_tips_1',
        },
        name: 'Day 3: Tips Email',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '4d' },
        name: 'Wait 4 Days',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'onboarding_check_in',
        },
        name: 'Day 7: Check-in Email',
      },
      {
        step_type: 'action',
        action_type: 'notification.in_app',
        action_config: {
          user_id: '{{trigger.user_id}}',
          title: 'Complete your profile',
          message: 'Get the most out of our platform by completing your profile settings.',
          link: '/settings/profile',
        },
        name: 'In-App Profile Nudge',
      },
    ],
  },

  // =========================================================
  // PAYMENTS & INVOICING
  // =========================================================
  {
    id: 'payment-overdue-reminders',
    name: 'Payment Overdue Reminders',
    description: 'Automated payment reminder sequence for overdue invoices',
    category: 'Payments',
    icon: 'CircleDollarSign',
    complexity: 'intermediate',
    estimatedSetupTime: '15 minutes',
    tags: ['invoice', 'payment', 'reminder', 'accounting'],
    trigger: {
      type: 'event',
      config: { event_type: 'accounting.invoice.overdue' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.client_email}}',
          template_id: 'payment_reminder_1',
          variables: {
            client_name: '{{trigger.client_name}}',
            invoice_number: '{{trigger.invoice_number}}',
            amount_due: '{{trigger.amount_due}}',
            due_date: '{{trigger.due_date}}',
            payment_link: '{{trigger.payment_link}}',
          },
        },
        name: 'Send First Reminder',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '7d' },
        name: 'Wait 7 Days',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{trigger.status}}', operator: 'not_equals', value: 'paid' },
          ],
        },
        name: 'Check Still Unpaid',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.client_email}}',
          template_id: 'payment_reminder_2_urgent',
          variables: {
            days_overdue: '{{trigger.days_overdue}}',
          },
        },
        name: 'Send Urgent Reminder',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_slack',
        action_config: {
          channel: '#finance',
          message: '⚠️ Invoice #{{trigger.invoice_number}} for {{trigger.client_name}} is 14+ days overdue (${{trigger.amount_due}})',
        },
        name: 'Alert Finance Team',
      },
    ],
    requiredConnections: ['slack'],
  },

  {
    id: 'payment-received-thank-you',
    name: 'Payment Received Confirmation',
    description: 'Send thank you email when payment is received',
    category: 'Payments',
    icon: 'CircleCheck',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['invoice', 'payment', 'confirmation'],
    trigger: {
      type: 'event',
      config: { event_type: 'accounting.payment.received' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.client_email}}',
          template_id: 'payment_received',
          variables: {
            client_name: '{{trigger.client_name}}',
            amount: '{{trigger.amount}}',
            invoice_number: '{{trigger.invoice_number}}',
            receipt_url: '{{trigger.receipt_url}}',
          },
        },
        name: 'Send Payment Confirmation',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_id: '{{trigger.client_id}}',
          type: 'note',
          description: 'Payment received: ${{trigger.amount}} for Invoice #{{trigger.invoice_number}}',
        },
        name: 'Log Payment to CRM',
      },
    ],
  },

  // =========================================================
  // TEAM NOTIFICATIONS
  // =========================================================
  {
    id: 'deal-closed-celebration',
    name: 'Deal Closed Celebration',
    description: 'Celebrate won deals with the team',
    category: 'Team',
    icon: 'PartyPopper',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['crm', 'deals', 'celebration', 'slack'],
    trigger: {
      type: 'event',
      config: { event_type: 'crm.deal.won' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'notification.send_slack',
        action_config: {
          channel: '#wins',
          message: '🎉 *DEAL WON!*\n\n*{{trigger.deal_title}}*\nValue: ${{trigger.deal_value}}\nOwner: {{trigger.owner_name}}\nCompany: {{trigger.company_name}}\n\nGreat work, team! 🚀',
        },
        name: 'Post to Slack',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_id: '{{trigger.contact_id}}',
          type: 'note',
          description: '🎉 Deal won! Value: ${{trigger.deal_value}}',
        },
        name: 'Log Win to Contact',
      },
    ],
    requiredConnections: ['slack'],
  },

  {
    id: 'deal-lost-review',
    name: 'Deal Lost Analysis',
    description: 'Create review task and log when deals are lost',
    category: 'Team',
    icon: 'TrendingDown',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['crm', 'deals', 'analysis'],
    trigger: {
      type: 'event',
      config: { event_type: 'crm.deal.lost' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'crm.create_task',
        action_config: {
          title: 'Review lost deal: {{trigger.deal_title}}',
          description: 'Lost reason: {{trigger.lost_reason}}\nValue: ${{trigger.deal_value}}',
          assigned_to: '{{trigger.owner_id}}',
          due_date: '{{now_plus_2d}}',
        },
        name: 'Create Review Task',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_slack',
        action_config: {
          channel: '#sales',
          message: '📉 Deal Lost: {{trigger.deal_title}} (${{trigger.deal_value}})\nReason: {{trigger.lost_reason}}',
        },
        name: 'Notify Team',
      },
    ],
    requiredConnections: ['slack'],
  },

  // =========================================================
  // FORMS
  // =========================================================
  {
    id: 'form-submission-handler',
    name: 'Contact Form Handler',
    description: 'Process contact form submissions and create leads',
    category: 'Forms',
    icon: 'FileText',
    complexity: 'simple',
    estimatedSetupTime: '10 minutes',
    tags: ['form', 'lead', 'crm'],
    trigger: {
      type: 'event',
      config: { event_type: 'form.submission.received' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'crm.create_contact',
        action_config: {
          email: '{{trigger.email}}',
          first_name: '{{trigger.first_name}}',
          last_name: '{{trigger.last_name}}',
          phone: '{{trigger.phone}}',
          tags: ['website-form'],
        },
        name: 'Create CRM Contact',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'form_acknowledgment',
          variables: {
            name: '{{trigger.first_name}}',
          },
        },
        name: 'Send Acknowledgment',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_slack',
        action_config: {
          channel: '#leads',
          message: '📝 New form submission!\nName: {{trigger.first_name}} {{trigger.last_name}}\nEmail: {{trigger.email}}\nMessage: {{trigger.message}}',
        },
        name: 'Alert Team',
      },
    ],
    requiredConnections: ['slack'],
  },

  // =========================================================
  // WEBHOOKS
  // =========================================================
  {
    id: 'webhook-to-crm',
    name: 'External Webhook to CRM',
    description: 'Create CRM contacts from external webhook data',
    category: 'Integrations',
    icon: 'Link',
    complexity: 'intermediate',
    estimatedSetupTime: '15 minutes',
    tags: ['webhook', 'crm', 'integration'],
    trigger: {
      type: 'webhook',
      config: { endpoint_path: 'lead-capture' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'crm.find_contact',
        action_config: {
          field: 'email',
          value: '{{trigger.email}}',
        },
        name: 'Check Existing Contact',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{steps.Check Existing Contact.found}}', operator: 'equals', value: false },
          ],
        },
        name: 'Is New Contact?',
      },
      {
        step_type: 'action',
        action_type: 'crm.create_contact',
        action_config: {
          email: '{{trigger.email}}',
          first_name: '{{trigger.first_name}}',
          last_name: '{{trigger.last_name}}',
          custom_fields: {
            source: '{{trigger.source}}',
          },
        },
        name: 'Create New Contact',
      },
    ],
  },

  // =========================================================
  // CROSS-MODULE: ORDER → CRM
  // =========================================================
  {
    id: 'order-to-crm-contact',
    name: 'New Order → CRM Contact & Deal',
    description: 'When a new order is placed, find or create the customer as a CRM contact and open a deal for the order value',
    category: 'E-Commerce',
    icon: 'ShoppingCart',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['order', 'crm', 'contact', 'deal', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.order.created' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'crm.find_contact',
        action_config: {
          field: 'email',
          value: '{{trigger.customer_email}}',
        },
        name: 'Find Existing Contact',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{steps.Find Existing Contact.found}}', operator: 'equals', value: false },
          ],
        },
        name: 'Is New Customer?',
      },
      {
        step_type: 'action',
        action_type: 'crm.create_contact',
        action_config: {
          email: '{{trigger.customer_email}}',
          first_name: '{{trigger.customer_first_name}}',
          last_name: '{{trigger.customer_last_name}}',
          phone: '{{trigger.customer_phone}}',
          tags: ['customer', 'ecommerce'],
        },
        name: 'Create CRM Contact',
      },
      {
        step_type: 'action',
        action_type: 'crm.create_deal',
        action_config: {
          title: 'Order #{{trigger.order_number}}',
          value: '{{trigger.total_amount}}',
          stage: 'won',
          contact_email: '{{trigger.customer_email}}',
          custom_fields: {
            order_id: '{{trigger.order_id}}',
            source: 'ecommerce',
          },
        },
        name: 'Create Deal from Order',
      },
      {
        step_type: 'action',
        action_type: 'notification.in_app',
        action_config: {
          title: 'New Order Received',
          message: 'Order #{{trigger.order_number}} from {{trigger.customer_first_name}} {{trigger.customer_last_name}} — ${{trigger.total_amount}}',
          type: 'info',
        },
        name: 'Notify Team',
      },
    ],
  },

  // =========================================================
  // CROSS-MODULE: ORDER SHIPPED → CUSTOMER NOTIFICATION
  // =========================================================
  {
    id: 'order-shipped-notify',
    name: 'Order Shipped → Multi-Channel Notification',
    description: 'When an order is shipped, send the customer an email with tracking info and log the activity in CRM',
    category: 'E-Commerce',
    icon: 'Truck',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['order', 'shipping', 'email', 'crm', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.order.shipped' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send',
        action_config: {
          to: '{{trigger.customer_email}}',
          subject: 'Your order #{{trigger.order_number}} has shipped!',
          body: 'Hi {{trigger.customer_first_name}},\n\nGreat news! Your order #{{trigger.order_number}} has been shipped.\n\nTracking number: {{trigger.tracking_number}}\nCarrier: {{trigger.carrier}}\n\nYou can track your package using the link above.\n\nThank you for your order!',
        },
        name: 'Send Shipping Email',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_email: '{{trigger.customer_email}}',
          activity_type: 'note',
          subject: 'Order #{{trigger.order_number}} shipped',
          description: 'Tracking: {{trigger.tracking_number}} via {{trigger.carrier}}',
        },
        name: 'Log CRM Activity',
      },
    ],
  },

  // =========================================================
  // CROSS-MODULE: QUOTE LIFECYCLE
  // =========================================================
  {
    id: 'quote-accepted-to-order',
    name: 'Quote Accepted → Convert to Order',
    description: 'When a customer accepts a quote, automatically convert it to an order and notify the team',
    category: 'E-Commerce',
    icon: 'FileCheck',
    complexity: 'intermediate',
    estimatedSetupTime: '5 minutes',
    tags: ['quote', 'order', 'conversion', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.quote.accepted' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'ecommerce.convert_quote_to_order',
        action_config: {
          quote_id: '{{trigger.quote_id}}',
        },
        name: 'Convert Quote to Order',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_email: '{{trigger.customer_email}}',
          activity_type: 'note',
          subject: 'Quote accepted and converted to order',
          description: 'Quote #{{trigger.quote_number}} was accepted and converted to an order.',
        },
        name: 'Log CRM Activity',
      },
      {
        step_type: 'action',
        action_type: 'email.send',
        action_config: {
          to: '{{trigger.customer_email}}',
          subject: 'Quote #{{trigger.quote_number}} — Order Confirmed',
          body: 'Hi {{trigger.customer_first_name}},\n\nThank you for accepting your quote! Your order has been created and our team will begin processing it shortly.\n\nQuote reference: #{{trigger.quote_number}}\n\nWe\'ll keep you updated on the progress.',
        },
        name: 'Send Confirmation Email',
      },
      {
        step_type: 'action',
        action_type: 'notification.in_app',
        action_config: {
          title: 'Quote Accepted!',
          message: 'Quote #{{trigger.quote_number}} from {{trigger.customer_first_name}} {{trigger.customer_last_name}} was accepted and converted to an order.',
          type: 'success',
        },
        name: 'Notify Team',
      },
    ],
  },
  {
    id: 'quote-reminder-sequence',
    name: 'Quote Follow-Up Reminder Sequence',
    description: 'Automatically send reminders for quotes that have been viewed but not yet accepted',
    category: 'E-Commerce',
    icon: 'Clock',
    complexity: 'advanced',
    estimatedSetupTime: '15 minutes',
    tags: ['quote', 'reminder', 'follow-up', 'drip', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.quote.viewed' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'flow.delay',
        action_config: {
          duration: '2d',
        },
        name: 'Wait 2 Days',
      },
      {
        step_type: 'action',
        action_type: 'ecommerce.send_quote_reminder',
        action_config: {
          quote_id: '{{trigger.quote_id}}',
        },
        name: 'Send First Reminder',
      },
      {
        step_type: 'action',
        action_type: 'flow.delay',
        action_config: {
          duration: '5d',
        },
        name: 'Wait 5 More Days',
      },
      {
        step_type: 'action',
        action_type: 'ecommerce.send_quote_reminder',
        action_config: {
          quote_id: '{{trigger.quote_id}}',
        },
        name: 'Send Final Reminder',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_email: '{{trigger.customer_email}}',
          activity_type: 'note',
          subject: 'Quote reminder sequence completed',
          description: 'Automated reminders sent for Quote #{{trigger.quote_number}}. No response yet.',
        },
        name: 'Log Follow-Up Activity',
      },
    ],
  },
  {
    id: 'quote-rejected-review',
    name: 'Quote Rejected → Team Review',
    description: 'When a quote is rejected, notify the team for review and log the outcome in CRM',
    category: 'E-Commerce',
    icon: 'XCircle',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['quote', 'rejected', 'review', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.quote.rejected' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_email: '{{trigger.customer_email}}',
          activity_type: 'note',
          subject: 'Quote #{{trigger.quote_number}} rejected',
          description: 'Customer rejected the quote. Reason: {{trigger.rejection_reason}}',
        },
        name: 'Log Rejection in CRM',
      },
      {
        step_type: 'action',
        action_type: 'notification.in_app',
        action_config: {
          title: 'Quote Rejected',
          message: 'Quote #{{trigger.quote_number}} was rejected by {{trigger.customer_first_name}} {{trigger.customer_last_name}}. Reason: {{trigger.rejection_reason}}',
          type: 'warning',
        },
        name: 'Alert Sales Team',
      },
    ],
  },

  // =========================================================
  // CROSS-MODULE: BOOKING → CRM
  // =========================================================
  {
    id: 'booking-to-crm-contact',
    name: 'New Booking → CRM Contact & Activity',
    description: 'When a new appointment is booked, find or create the customer in CRM and log the booking as an activity',
    category: 'Booking',
    icon: 'CalendarPlus',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['booking', 'appointment', 'crm', 'contact', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'booking.appointment.created' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'crm.find_contact',
        action_config: {
          field: 'email',
          value: '{{trigger.customer_email}}',
        },
        name: 'Find Existing Contact',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{steps.Find Existing Contact.found}}', operator: 'equals', value: false },
          ],
        },
        name: 'Is New Customer?',
      },
      {
        step_type: 'action',
        action_type: 'crm.create_contact',
        action_config: {
          email: '{{trigger.customer_email}}',
          first_name: '{{trigger.customer_name}}',
          tags: ['booking-customer'],
        },
        name: 'Create CRM Contact',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_email: '{{trigger.customer_email}}',
          activity_type: 'meeting',
          subject: 'Appointment booked — {{trigger.service_name}}',
          description: 'Appointment scheduled for {{trigger.start_time}} with {{trigger.staff_name}}. Service: {{trigger.service_name}}.',
        },
        name: 'Log Booking in CRM',
      },
    ],
  },
  {
    id: 'booking-cancelled-followup',
    name: 'Booking Cancelled → Follow-Up',
    description: 'When a booking is cancelled, send a follow-up email offering to reschedule and log it in CRM',
    category: 'Booking',
    icon: 'CalendarX',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['booking', 'cancellation', 'follow-up', 'email', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'booking.appointment.cancelled' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send',
        action_config: {
          to: '{{trigger.customer_email}}',
          subject: 'We\'re sorry to see you cancel — can we reschedule?',
          body: 'Hi {{trigger.customer_name}},\n\nWe noticed your appointment for {{trigger.service_name}} on {{trigger.start_time}} was cancelled.\n\nWe understand plans change! If you\'d like to reschedule, simply visit our booking page and choose a new time that works for you.\n\nWe look forward to seeing you soon!',
        },
        name: 'Send Reschedule Email',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_email: '{{trigger.customer_email}}',
          activity_type: 'note',
          subject: 'Appointment cancelled',
          description: '{{trigger.service_name}} appointment on {{trigger.start_time}} was cancelled. Reason: {{trigger.cancellation_reason}}',
        },
        name: 'Log Cancellation in CRM',
      },
    ],
  },
  {
    id: 'booking-confirmation-chat',
    name: 'Booking Confirmed → Chat Message',
    description: 'When a booking is confirmed, send a confirmation message to the customer via live chat',
    category: 'Booking',
    icon: 'MessageSquare',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['booking', 'chat', 'confirmation', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'booking.appointment.confirmed' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'chat.send_message',
        action_config: {
          conversation_id: '{{trigger.conversation_id}}',
          content: 'Your appointment for {{trigger.service_name}} on {{trigger.start_time}} has been confirmed! 🎉\n\nProvider: {{trigger.staff_name}}\nDuration: {{trigger.duration}} minutes\n\nWe look forward to seeing you!',
          sender_type: 'system',
        },
        name: 'Send Chat Confirmation',
      },
      {
        step_type: 'action',
        action_type: 'booking.create_reminder',
        action_config: {
          appointment_id: '{{trigger.appointment_id}}',
          reminder_type: 'email',
          remind_before_minutes: 1440,
        },
        name: 'Schedule 24h Reminder',
      },
    ],
  },

  // =========================================================
  // CROSS-MODULE: LIVE CHAT → CRM
  // =========================================================
  {
    id: 'chat-to-crm-contact',
    name: 'New Chat → CRM Contact',
    description: 'When a new chat conversation starts, find or create the visitor as a CRM contact and assign to an agent',
    category: 'Customer Success',
    icon: 'MessageCircle',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['chat', 'crm', 'contact', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'chat.conversation.created' },
    },
    steps: [
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{trigger.visitor_email}}', operator: 'exists', value: true },
          ],
        },
        name: 'Has Email?',
      },
      {
        step_type: 'action',
        action_type: 'crm.find_contact',
        action_config: {
          field: 'email',
          value: '{{trigger.visitor_email}}',
        },
        name: 'Find Existing Contact',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{steps.Find Existing Contact.found}}', operator: 'equals', value: false },
          ],
        },
        name: 'Is New Visitor?',
      },
      {
        step_type: 'action',
        action_type: 'crm.create_contact',
        action_config: {
          email: '{{trigger.visitor_email}}',
          first_name: '{{trigger.visitor_name}}',
          tags: ['chat-visitor', 'website'],
        },
        name: 'Create CRM Contact',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_email: '{{trigger.visitor_email}}',
          activity_type: 'note',
          subject: 'Live chat conversation started',
          description: 'Customer initiated a chat conversation. Page: {{trigger.page_url}}',
        },
        name: 'Log Chat Activity',
      },
    ],
  },
  {
    id: 'chat-resolved-satisfaction',
    name: 'Chat Resolved → Satisfaction Follow-Up',
    description: 'When a chat is resolved, send a follow-up email asking for feedback and log the resolution in CRM',
    category: 'Customer Success',
    icon: 'ThumbsUp',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['chat', 'satisfaction', 'feedback', 'email', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'chat.conversation.resolved' },
    },
    steps: [
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{trigger.customer_email}}', operator: 'exists', value: true },
          ],
        },
        name: 'Has Customer Email?',
      },
      {
        step_type: 'action',
        action_type: 'flow.delay',
        action_config: {
          duration: '1h',
        },
        name: 'Wait 1 Hour',
      },
      {
        step_type: 'action',
        action_type: 'email.send',
        action_config: {
          to: '{{trigger.customer_email}}',
          subject: 'How was your experience?',
          body: 'Hi {{trigger.customer_name}},\n\nThank you for chatting with us today! We hope we were able to help.\n\nWe\'d love to hear how your experience was. Your feedback helps us improve.\n\nWas your issue resolved? Simply reply to this email and let us know.\n\nThank you!',
        },
        name: 'Send Satisfaction Email',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_email: '{{trigger.customer_email}}',
          activity_type: 'note',
          subject: 'Chat conversation resolved',
          description: 'Chat resolved by {{trigger.agent_name}}. Duration: {{trigger.duration_minutes}} minutes. Satisfaction follow-up sent.',
        },
        name: 'Log Resolution in CRM',
      },
    ],
  },

  // =========================================================
  // CROSS-MODULE: LOW STOCK → MULTI-CHANNEL ALERT
  // =========================================================
  {
    id: 'low-stock-multi-alert',
    name: 'Low Stock → Slack + Email Alert',
    description: 'When inventory drops below threshold, alert the team via Slack, email, and in-app notification',
    category: 'E-Commerce',
    icon: 'AlertTriangle',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['inventory', 'stock', 'alert', 'slack', 'email', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.inventory.low_stock' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'notification.send_slack',
        action_config: {
          channel: '#inventory-alerts',
          message: '⚠️ Low Stock Alert!\n\nProduct: {{trigger.product_name}}\nSKU: {{trigger.sku}}\nCurrent Stock: {{trigger.current_quantity}}\nThreshold: {{trigger.threshold}}\n\nPlease reorder soon.',
        },
        name: 'Alert Slack Channel',
      },
      {
        step_type: 'action',
        action_type: 'email.send',
        action_config: {
          to: '{{trigger.alert_email}}',
          subject: '⚠️ Low Stock: {{trigger.product_name}} ({{trigger.current_quantity}} remaining)',
          body: 'The following product is running low on stock:\n\nProduct: {{trigger.product_name}}\nSKU: {{trigger.sku}}\nCurrent Quantity: {{trigger.current_quantity}}\nReorder Threshold: {{trigger.threshold}}\n\nPlease review and reorder as needed.',
        },
        name: 'Send Email Alert',
      },
      {
        step_type: 'action',
        action_type: 'notification.in_app',
        action_config: {
          title: 'Low Stock Warning',
          message: '{{trigger.product_name}} ({{trigger.sku}}) has only {{trigger.current_quantity}} units remaining.',
          type: 'warning',
        },
        name: 'In-App Notification',
      },
    ],
    requiredConnections: ['slack'],
  },

  // =========================================================
  // CROSS-MODULE: REFUND → CRM + NOTIFICATIONS
  // =========================================================
  {
    id: 'refund-processed-workflow',
    name: 'Refund Processed → CRM & Notifications',
    description: 'When a refund is processed, update CRM, email the customer, and alert the finance team',
    category: 'E-Commerce',
    icon: 'RotateCcw',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['refund', 'crm', 'email', 'notification', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.refund.created' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send',
        action_config: {
          to: '{{trigger.customer_email}}',
          subject: 'Refund Processed for Order #{{trigger.order_number}}',
          body: 'Hi {{trigger.customer_first_name}},\n\nYour refund of ${{trigger.refund_amount}} for order #{{trigger.order_number}} has been processed.\n\nReason: {{trigger.refund_reason}}\n\nPlease allow 5-10 business days for the refund to appear in your account.\n\nIf you have any questions, don\'t hesitate to reach out.',
        },
        name: 'Email Customer',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_email: '{{trigger.customer_email}}',
          activity_type: 'note',
          subject: 'Refund processed — ${{trigger.refund_amount}}',
          description: 'Refund of ${{trigger.refund_amount}} processed for order #{{trigger.order_number}}. Reason: {{trigger.refund_reason}}.',
        },
        name: 'Log Refund in CRM',
      },
      {
        step_type: 'action',
        action_type: 'notification.in_app',
        action_config: {
          title: 'Refund Processed',
          message: 'Refund of ${{trigger.refund_amount}} for order #{{trigger.order_number}} has been processed.',
          type: 'info',
        },
        name: 'Notify Finance Team',
      },
    ],
  },

  // =========================================================
  // CROSS-MODULE: DEAL CLOSED → ORDER CREATION
  // =========================================================
  {
    id: 'deal-won-to-quote',
    name: 'Deal Won → Send Quote',
    description: 'When a CRM deal is moved to Won stage, automatically send the associated quote to the customer',
    category: 'Lead Management',
    icon: 'Trophy',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['deal', 'quote', 'crm', 'ecommerce', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'crm.deal.stage_changed' },
    },
    steps: [
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{trigger.new_stage}}', operator: 'equals', value: 'won' },
          ],
        },
        name: 'Deal Won?',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{trigger.quote_id}}', operator: 'exists', value: true },
          ],
        },
        name: 'Has Quote?',
      },
      {
        step_type: 'action',
        action_type: 'ecommerce.send_quote',
        action_config: {
          quote_id: '{{trigger.quote_id}}',
        },
        name: 'Send Quote to Customer',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_email: '{{trigger.contact_email}}',
          activity_type: 'note',
          subject: 'Deal won — quote sent',
          description: 'Deal "{{trigger.deal_title}}" was marked as won. Quote has been automatically sent to the customer.',
        },
        name: 'Log Activity',
      },
    ],
  },

  // =========================================================
  // CROSS-MODULE: CHAT ESCALATION
  // =========================================================
  {
    id: 'chat-vip-escalation',
    name: 'VIP Customer Chat → Priority Escalation',
    description: 'When a chat starts from a customer tagged as VIP in CRM, auto-assign to senior agent and notify the team',
    category: 'Customer Success',
    icon: 'Star',
    complexity: 'advanced',
    estimatedSetupTime: '15 minutes',
    tags: ['chat', 'vip', 'escalation', 'crm', 'cross-module'],
    trigger: {
      type: 'event',
      config: { event_type: 'chat.conversation.created' },
    },
    steps: [
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{trigger.visitor_email}}', operator: 'exists', value: true },
          ],
        },
        name: 'Has Email?',
      },
      {
        step_type: 'action',
        action_type: 'crm.find_contact',
        action_config: {
          field: 'email',
          value: '{{trigger.visitor_email}}',
        },
        name: 'Find CRM Contact',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{steps.Find CRM Contact.tags}}', operator: 'contains', value: 'vip' },
          ],
        },
        name: 'Is VIP?',
      },
      {
        step_type: 'action',
        action_type: 'chat.assign_conversation',
        action_config: {
          conversation_id: '{{trigger.conversation_id}}',
          agent_id: '{{variables.senior_agent_id}}',
        },
        name: 'Assign to Senior Agent',
      },
      {
        step_type: 'action',
        action_type: 'chat.send_message',
        action_config: {
          conversation_id: '{{trigger.conversation_id}}',
          content: 'Welcome back! As a valued customer, you\'ve been connected to our priority support team. How can we help you today?',
          sender_type: 'system',
        },
        name: 'Send VIP Greeting',
      },
      {
        step_type: 'action',
        action_type: 'notification.in_app',
        action_config: {
          title: 'VIP Customer Chat',
          message: '⭐ VIP customer {{trigger.visitor_name}} ({{trigger.visitor_email}}) has started a chat. Auto-assigned to priority support.',
          type: 'warning',
        },
        name: 'Alert Team',
      },
    ],
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category?: string): WorkflowTemplate[] {
  if (!category || category === 'all') return WORKFLOW_TEMPLATES
  return WORKFLOW_TEMPLATES.filter(t => t.category === category)
}

/**
 * Get templates by industry
 */
export function getTemplatesByIndustry(industry: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => t.industry === industry)
}

/**
 * Get unique categories
 */
export function getTemplateCategories(): string[] {
  return [...new Set(WORKFLOW_TEMPLATES.map(t => t.category))]
}

/**
 * Search templates
 */
export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowerQuery = query.toLowerCase()
  return WORKFLOW_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.includes(lowerQuery))
  )
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(t => t.id === id)
}

/**
 * Get templates by complexity
 */
export function getTemplatesByComplexity(complexity: WorkflowTemplate['complexity']): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => t.complexity === complexity)
}

/**
 * Get templates requiring specific connection
 */
export function getTemplatesRequiringConnection(connectionType: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => 
    t.requiredConnections?.includes(connectionType)
  )
}
