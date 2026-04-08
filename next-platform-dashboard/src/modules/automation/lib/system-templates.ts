/**
 * System Workflow Templates
 *
 * Phase 2 — Automation Overhaul: System Templates
 *
 * These templates replicate the EXACT behavior of the current hardcoded
 * notification functions (emails, chat messages, in-app notifications).
 * Each template is installable, editable, and toggleable from the automation UI.
 *
 * Email types reference: src/lib/email/email-types.ts
 * Chat events reference: src/modules/live-chat/lib/chat-template-resolver.ts
 */

import type { WorkflowTemplate } from "./templates";

// ============================================================================
// BOOKING SYSTEM TEMPLATES (8)
// ============================================================================

const BOOKING_SYSTEM_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "system-booking-created",
    name: "Booking Created Notifications",
    description:
      "Sends confirmation email to customer and owner, in-app notification to owner, and chat message when a booking is created.",
    category: "System — Booking",
    icon: "CalendarPlus",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "booking", "notification"],
    isSystem: true,
    systemEventType: "booking.appointment.created",
    defaultActive: true,
    pack: "booking-communications",
    trigger: {
      type: "event",
      config: { event_type: "booking.appointment.created" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Booking Confirmation — {{trigger.serviceName}}",
          body: "Hi {{trigger.customerName}},\n\nYour booking for {{trigger.serviceName}} on {{trigger.startTime}} with {{trigger.staffName}} has been confirmed.\n\nThank you for booking with us!",
        },
        name: "Email Customer — Booking Confirmation",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "New Booking — {{trigger.serviceName}} with {{trigger.customerName}}",
          body: "A new booking has been created.\n\nCustomer: {{trigger.customerName}} ({{trigger.customerEmail}})\nService: {{trigger.serviceName}}\nDate: {{trigger.startTime}}\nStaff: {{trigger.staffName}}",
        },
        name: "Email Owner — New Booking",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "New Booking",
          message:
            "{{trigger.customerName}} booked {{trigger.serviceName}} for {{trigger.startTime}}",
          type: "info",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "booking_created",
          placeholders: {
            service_name: "{{trigger.serviceName}}",
            date: "{{trigger.startTime}}",
            customer_name: "{{trigger.customerName}}",
          },
        },
        name: "Chat Message — Booking Created",
      },
    ],
  },
  {
    id: "system-booking-confirmed",
    name: "Booking Confirmed Notifications",
    description:
      "Sends confirmation emails to customer and owner plus a chat message when a booking is confirmed.",
    category: "System — Booking",
    icon: "CalendarCheck",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "booking", "notification"],
    isSystem: true,
    systemEventType: "booking.appointment.confirmed",
    defaultActive: true,
    pack: "booking-communications",
    trigger: {
      type: "event",
      config: { event_type: "booking.appointment.confirmed" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Booking Confirmed — {{trigger.serviceName}}",
          body: "Hi {{trigger.customerName}},\n\nYour booking for {{trigger.serviceName}} on {{trigger.startTime}} with {{trigger.staffName}} has been confirmed.\n\nWe look forward to seeing you!",
        },
        name: "Email Customer — Booking Confirmed",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Booking Confirmed — {{trigger.serviceName}} with {{trigger.customerName}}",
          body: "A booking has been confirmed.\n\nCustomer: {{trigger.customerName}}\nService: {{trigger.serviceName}}\nDate: {{trigger.startTime}}",
        },
        name: "Email Owner — Booking Confirmed",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "booking_confirmed",
          placeholders: {
            service_name: "{{trigger.serviceName}}",
            date: "{{trigger.startTime}}",
          },
        },
        name: "Chat Message — Booking Confirmed",
      },
    ],
  },
  {
    id: "system-booking-cancelled",
    name: "Booking Cancelled Notifications",
    description:
      "Sends cancellation emails to customer and owner, in-app notification to owner, and chat message when a booking is cancelled.",
    category: "System — Booking",
    icon: "CalendarX",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "booking", "notification"],
    isSystem: true,
    systemEventType: "booking.appointment.cancelled",
    defaultActive: true,
    pack: "booking-communications",
    trigger: {
      type: "event",
      config: { event_type: "booking.appointment.cancelled" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Booking Cancelled — {{trigger.serviceName}}",
          body: "Hi {{trigger.customerName}},\n\nYour booking for {{trigger.serviceName}} on {{trigger.startTime}} has been cancelled.\n\nReason: {{trigger.cancellationReason}}\n\nPlease contact us if you have any questions.",
        },
        name: "Email Customer — Booking Cancelled",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Booking Cancelled — {{trigger.serviceName}} with {{trigger.customerName}}",
          body: "A booking has been cancelled.\n\nCustomer: {{trigger.customerName}}\nService: {{trigger.serviceName}}\nDate: {{trigger.startTime}}\nReason: {{trigger.cancellationReason}}",
        },
        name: "Email Owner — Booking Cancelled",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Booking Cancelled",
          message:
            "{{trigger.customerName}} cancelled their {{trigger.serviceName}} booking",
          type: "warning",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "booking_cancelled",
          placeholders: {
            service_name: "{{trigger.serviceName}}",
            date: "{{trigger.startTime}}",
            reason: "{{trigger.cancellationReason}}",
          },
        },
        name: "Chat Message — Booking Cancelled",
      },
    ],
  },
  {
    id: "system-booking-completed",
    name: "Booking Completed Notifications",
    description:
      "Sends completion emails to customer and owner plus a chat message when an appointment is completed.",
    category: "System — Booking",
    icon: "CalendarCheck2",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "booking", "notification"],
    isSystem: true,
    systemEventType: "booking.appointment.completed",
    defaultActive: true,
    pack: "booking-communications",
    trigger: {
      type: "event",
      config: { event_type: "booking.appointment.completed" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Appointment Complete — {{trigger.serviceName}}",
          body: "Hi {{trigger.customerName}},\n\nYour appointment for {{trigger.serviceName}} has been completed.\n\nThank you for choosing us! We hope to see you again soon.",
        },
        name: "Email Customer — Appointment Complete",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Appointment Complete — {{trigger.serviceName}} with {{trigger.customerName}}",
          body: "An appointment has been completed.\n\nCustomer: {{trigger.customerName}}\nService: {{trigger.serviceName}}",
        },
        name: "Email Owner — Appointment Complete",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "booking_completed",
          placeholders: {
            service_name: "{{trigger.serviceName}}",
            customer_name: "{{trigger.customerName}}",
          },
        },
        name: "Chat Message — Booking Completed",
      },
    ],
  },
  {
    id: "system-booking-no-show",
    name: "Booking No-Show Notification",
    description:
      "Sends a no-show notification email to the customer when they miss their appointment.",
    category: "System — Booking",
    icon: "UserX",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "booking", "notification"],
    isSystem: true,
    systemEventType: "booking.appointment.no_show",
    defaultActive: true,
    pack: "booking-communications",
    trigger: {
      type: "event",
      config: { event_type: "booking.appointment.no_show" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Missed Appointment — {{trigger.serviceName}}",
          body: "Hi {{trigger.customerName}},\n\nWe noticed you missed your appointment for {{trigger.serviceName}} scheduled for {{trigger.startTime}}.\n\nPlease contact us to reschedule.",
        },
        name: "Email Customer — No Show",
      },
    ],
  },
  {
    id: "system-booking-payment-received",
    name: "Booking Payment Received Notifications",
    description:
      "Sends payment confirmation emails to customer and owner plus a chat message when booking payment is received.",
    category: "System — Booking",
    icon: "CreditCard",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "booking", "payment", "notification"],
    isSystem: true,
    systemEventType: "booking.appointment.payment_received",
    defaultActive: true,
    pack: "booking-communications",
    trigger: {
      type: "event",
      config: { event_type: "booking.appointment.payment_received" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Payment Confirmed — {{trigger.serviceName}}",
          body: "Hi {{trigger.customerName}},\n\nWe've received your payment of {{trigger.currency}} {{trigger.servicePrice}} for {{trigger.serviceName}}.\n\nThank you!",
        },
        name: "Email Customer — Payment Confirmed",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Payment Received — {{trigger.serviceName}} from {{trigger.customerName}}",
          body: "A payment has been received.\n\nCustomer: {{trigger.customerName}}\nService: {{trigger.serviceName}}\nAmount: {{trigger.currency}} {{trigger.servicePrice}}",
        },
        name: "Email Owner — Payment Received",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "booking_payment_confirmed",
          placeholders: {
            service_name: "{{trigger.serviceName}}",
            amount: "{{trigger.servicePrice}}",
            currency: "{{trigger.currency}}",
          },
        },
        name: "Chat Message — Payment Confirmed",
      },
    ],
  },
  {
    id: "system-booking-reminder",
    name: "Booking Reminder",
    description:
      "Sends an appointment reminder email and chat message 24 hours before the scheduled time.",
    category: "System — Booking",
    icon: "Bell",
    complexity: "intermediate",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "booking", "reminder"],
    isSystem: true,
    systemEventType: "booking.appointment.reminder_sent",
    defaultActive: true,
    pack: "booking-communications",
    trigger: {
      type: "event",
      config: { event_type: "booking.appointment.reminder_sent" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Appointment Reminder — {{trigger.serviceName}}",
          body: "Hi {{trigger.customerName}},\n\nThis is a reminder for your upcoming appointment.\n\nService: {{trigger.serviceName}}\nDate: {{trigger.startTime}}\nStaff: {{trigger.staffName}}\n\nWe look forward to seeing you!",
        },
        name: "Email Customer — Appointment Reminder",
      },
    ],
  },
  {
    id: "system-booking-cancelled-followup",
    name: "Booking Cancelled Follow-Up",
    description:
      "Waits 1 hour after cancellation, then sends a reschedule invitation email to the customer.",
    category: "System — Booking",
    icon: "CalendarClock",
    complexity: "intermediate",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "booking", "followup"],
    isSystem: true,
    systemEventType: "booking.appointment.cancelled",
    defaultActive: true,
    pack: "booking-communications",
    trigger: {
      type: "event",
      config: { event_type: "booking.appointment.cancelled" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "flow.delay",
        action_config: { duration: "1h" },
        name: "Wait 1 Hour",
        description: "Allow time before sending reschedule invitation",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Would You Like to Reschedule? — {{trigger.serviceName}}",
          body: "Hi {{trigger.customerName}},\n\nWe're sorry you had to cancel your {{trigger.serviceName}} booking.\n\nWould you like to reschedule? We'd love to have you back!",
        },
        name: "Email Customer — Reschedule Invitation",
      },
    ],
  },
];

// ============================================================================
// ORDER SYSTEM TEMPLATES (8)
// ============================================================================

const ORDER_SYSTEM_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "system-order-created",
    name: "Order Created Notifications",
    description:
      "Sends order confirmation emails to customer and owner plus an in-app notification when a new order is placed.",
    category: "System — E-Commerce",
    icon: "ShoppingCart",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "order", "notification"],
    isSystem: true,
    systemEventType: "ecommerce.order.created",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.order.created" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Order Confirmation — #{{trigger.orderNumber}}",
          body: "Hi {{trigger.customerName}},\n\nThank you for your order #{{trigger.orderNumber}}.\n\nTotal: {{trigger.currency}} {{trigger.total}}\n\nWe'll keep you updated on your order status.",
        },
        name: "Email Customer — Order Confirmation",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "New Order — #{{trigger.orderNumber}} from {{trigger.customerName}}",
          body: "A new order has been placed.\n\nOrder: #{{trigger.orderNumber}}\nCustomer: {{trigger.customerName}} ({{trigger.customerEmail}})\nTotal: {{trigger.currency}} {{trigger.total}}",
        },
        name: "Email Owner — New Order",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "New Order Received",
          message:
            "Order #{{trigger.orderNumber}} from {{trigger.customerName}} — {{trigger.currency}} {{trigger.total}}",
          type: "info",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
    ],
  },
  {
    id: "system-order-shipped",
    name: "Order Shipped Notifications",
    description:
      "Sends shipping notification email, in-app notification, and chat message when an order is shipped.",
    category: "System — E-Commerce",
    icon: "Truck",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "order", "shipping"],
    isSystem: true,
    systemEventType: "ecommerce.order.shipped",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.order.shipped" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Order Shipped — #{{trigger.orderNumber}}",
          body: "Hi {{trigger.customerName}},\n\nYour order #{{trigger.orderNumber}} has been shipped!\n\nCarrier: {{trigger.carrier}}\nTracking: {{trigger.trackingNumber}}\n\nYou'll receive another update when it's delivered.",
        },
        name: "Email Customer — Order Shipped",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Order Shipped",
          message: "Order #{{trigger.orderNumber}} has been shipped",
          type: "info",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "order_shipped",
          placeholders: {
            order_number: "{{trigger.orderNumber}}",
            tracking_number: "{{trigger.trackingNumber}}",
          },
        },
        name: "Chat Message — Order Shipped",
      },
    ],
  },
  {
    id: "system-order-delivered",
    name: "Order Delivered Notifications",
    description:
      "Sends delivery confirmation email, in-app notification, and chat message when an order is delivered.",
    category: "System — E-Commerce",
    icon: "PackageCheck",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "order", "delivery"],
    isSystem: true,
    systemEventType: "ecommerce.order.delivered",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.order.delivered" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Order Delivered — #{{trigger.orderNumber}}",
          body: "Hi {{trigger.customerName}},\n\nYour order #{{trigger.orderNumber}} has been delivered.\n\nThank you for shopping with us!",
        },
        name: "Email Customer — Order Delivered",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Order Delivered",
          message:
            "Order #{{trigger.orderNumber}} was delivered to {{trigger.customerName}}",
          type: "success",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "order_delivered",
          placeholders: {
            order_number: "{{trigger.orderNumber}}",
          },
        },
        name: "Chat Message — Order Delivered",
      },
    ],
  },
  {
    id: "system-order-cancelled",
    name: "Order Cancelled Notifications",
    description:
      "Sends cancellation emails to customer and owner, in-app notification, and chat message when an order is cancelled.",
    category: "System — E-Commerce",
    icon: "XCircle",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "order", "cancellation"],
    isSystem: true,
    systemEventType: "ecommerce.order.cancelled",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.order.cancelled" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Order Cancelled — #{{trigger.orderNumber}}",
          body: "Hi {{trigger.customerName}},\n\nYour order #{{trigger.orderNumber}} has been cancelled.\n\nReason: {{trigger.reason}}\n\nIf this was a mistake, please contact us.",
        },
        name: "Email Customer — Order Cancelled",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Order Cancelled — #{{trigger.orderNumber}} from {{trigger.customerName}}",
          body: "An order has been cancelled.\n\nOrder: #{{trigger.orderNumber}}\nCustomer: {{trigger.customerName}}\nReason: {{trigger.reason}}",
        },
        name: "Email Owner — Order Cancelled",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Order Cancelled",
          message:
            "Order #{{trigger.orderNumber}} from {{trigger.customerName}} was cancelled",
          type: "warning",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "order_cancelled",
          placeholders: {
            order_number: "{{trigger.orderNumber}}",
            reason: "{{trigger.reason}}",
          },
        },
        name: "Chat Message — Order Cancelled",
      },
    ],
  },
  {
    id: "system-payment-received",
    name: "Payment Received Notifications",
    description:
      "Sends payment confirmation email, in-app notification, and chat message when an order payment is approved.",
    category: "System — E-Commerce",
    icon: "BadgeDollarSign",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "payment", "notification"],
    isSystem: true,
    systemEventType: "ecommerce.payment.received",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.payment.received" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Payment Received — Order #{{trigger.orderNumber}}",
          body: "Hi {{trigger.customerName}},\n\nWe've received your payment of {{trigger.currency}} {{trigger.amount}} for order #{{trigger.orderNumber}}.\n\nThank you!",
        },
        name: "Email Customer — Payment Received",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Payment Received",
          message:
            "Payment for Order #{{trigger.orderNumber}} approved — {{trigger.currency}} {{trigger.amount}}",
          type: "success",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "payment_confirmed",
          placeholders: {
            order_number: "{{trigger.orderNumber}}",
            amount: "{{trigger.amount}}",
          },
        },
        name: "Chat Message — Payment Confirmed",
      },
    ],
  },
  {
    id: "system-payment-proof-uploaded",
    name: "Payment Proof Uploaded Notifications",
    description:
      "Sends notification to owner and chat message when a customer uploads payment proof.",
    category: "System — E-Commerce",
    icon: "FileUp",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "payment", "notification"],
    isSystem: true,
    systemEventType: "ecommerce.payment.proof_uploaded",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.payment.proof_uploaded" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Payment Proof Uploaded — Order #{{trigger.orderNumber}}",
          body: "A customer has uploaded payment proof.\n\nOrder: #{{trigger.orderNumber}}\nCustomer: {{trigger.customerEmail}}\nFile: {{trigger.fileName}}\nTotal: {{trigger.currency}} {{trigger.total}}\n\nPlease review and approve the payment.",
        },
        name: "Email Owner — Payment Proof Uploaded",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Payment Proof Uploaded",
          message:
            "Customer uploaded payment proof for Order #{{trigger.orderNumber}}",
          type: "info",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "payment_proof_uploaded",
          placeholders: {
            order_number: "{{trigger.orderNumber}}",
          },
        },
        name: "Chat Message — Proof Uploaded",
      },
    ],
  },
  {
    id: "system-refund-issued",
    name: "Refund Issued Notifications",
    description:
      "Sends refund confirmation email, in-app notification, and chat message when an order is refunded.",
    category: "System — E-Commerce",
    icon: "RotateCcw",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "refund", "notification"],
    isSystem: true,
    systemEventType: "ecommerce.order.refunded",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.order.refunded" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Refund Issued — Order #{{trigger.orderNumber}}",
          body: "Hi {{trigger.customerName}},\n\nA refund of {{trigger.currency}} {{trigger.refundAmount}} has been issued for your order #{{trigger.orderNumber}}.\n\nPlease allow a few business days for the refund to appear.",
        },
        name: "Email Customer — Refund Issued",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Refund Processed",
          message:
            "Refund of {{trigger.currency}} {{trigger.refundAmount}} issued for Order #{{trigger.orderNumber}}",
          type: "info",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "order_refunded",
          placeholders: {
            order_number: "{{trigger.orderNumber}}",
            refund_amount: "{{trigger.refundAmount}}",
          },
        },
        name: "Chat Message — Refund Issued",
      },
    ],
  },
  {
    id: "system-low-stock-alert",
    name: "Low Stock Alert",
    description:
      "Sends a low stock alert email and in-app notification to the site owner when product inventory is low.",
    category: "System — E-Commerce",
    icon: "AlertTriangle",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "inventory", "alert"],
    isSystem: true,
    systemEventType: "ecommerce.product.low_stock",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.product.low_stock" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Low Stock Alert — {{trigger.productName}}",
          body: "A product is running low on stock.\n\nProduct: {{trigger.productName}}\nCurrent Stock: {{trigger.currentStock}}\nThreshold: {{trigger.threshold}}\n\nPlease restock soon.",
        },
        name: "Email Owner — Low Stock Alert",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Low Stock Alert",
          message:
            "{{trigger.productName}} is running low — {{trigger.currentStock}} remaining",
          type: "warning",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
    ],
  },
];

// ============================================================================
// QUOTE SYSTEM TEMPLATES (7)
// ============================================================================

const QUOTE_SYSTEM_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "system-quote-created",
    name: "Quote Created Notifications",
    description:
      "Sends quote request notification to owner and acknowledgement to customer, plus in-app notification and chat message.",
    category: "System — E-Commerce",
    icon: "FileText",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "quote", "notification"],
    isSystem: true,
    systemEventType: "ecommerce.quote.created",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.quote.created" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "New Quote Request — #{{trigger.quoteNumber}} from {{trigger.customerName}}",
          body: "A new quote has been requested.\n\nQuote: #{{trigger.quoteNumber}}\nCustomer: {{trigger.customerName}} ({{trigger.customerEmail}})\nTotal: {{trigger.currency}} {{trigger.total}}",
        },
        name: "Email Owner — Quote Request",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Quote Request Received — #{{trigger.quoteNumber}}",
          body: "Hi {{trigger.customerName}},\n\nWe've received your quote request #{{trigger.quoteNumber}}.\n\nWe'll review it and get back to you shortly.",
        },
        name: "Email Customer — Quote Request Acknowledgement",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "New Quote Request",
          message:
            "Quote #{{trigger.quoteNumber}} from {{trigger.customerName}} — {{trigger.currency}} {{trigger.total}}",
          type: "info",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "quote_requested",
          placeholders: {
            quote_number: "{{trigger.quoteNumber}}",
            customer_name: "{{trigger.customerName}}",
          },
        },
        name: "Chat Message — Quote Requested",
      },
    ],
  },
  {
    id: "system-quote-sent",
    name: "Quote Sent Notifications",
    description:
      "Sends the quote to the customer via email and posts a chat message when a quote is sent.",
    category: "System — E-Commerce",
    icon: "Send",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "quote", "notification"],
    isSystem: true,
    systemEventType: "ecommerce.quote.sent",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.quote.sent" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Your Quote — #{{trigger.quoteNumber}}",
          body: "Hi {{trigger.customerName}},\n\nPlease find your quote #{{trigger.quoteNumber}}.\n\nTotal: {{trigger.currency}} {{trigger.total}}\nValid Until: {{trigger.validUntil}}\n\nPlease review and let us know if you'd like to proceed.",
        },
        name: "Email Customer — Quote Sent",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "quote_sent",
          placeholders: {
            quote_number: "{{trigger.quoteNumber}}",
            total: "{{trigger.total}}",
          },
        },
        name: "Chat Message — Quote Sent",
      },
    ],
  },
  {
    id: "system-quote-reminder",
    name: "Quote Reminder Email",
    description:
      "Sends a reminder email to the customer when a quote reminder is triggered.",
    category: "System — E-Commerce",
    icon: "BellRing",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "quote", "reminder"],
    isSystem: true,
    systemEventType: "ecommerce.quote.reminder_sent",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.quote.reminder_sent" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Quote Reminder — #{{trigger.quoteNumber}}",
          body: "Hi {{trigger.customerName}},\n\nThis is a friendly reminder about your quote #{{trigger.quoteNumber}}.\n\nTotal: {{trigger.currency}} {{trigger.total}}\nValid Until: {{trigger.validUntil}}\n\nPlease let us know if you have any questions.",
        },
        name: "Email Customer — Quote Reminder",
      },
    ],
  },
  {
    id: "system-quote-accepted",
    name: "Quote Accepted Notifications",
    description:
      "Sends acceptance notification emails to owner and customer, in-app notification, and chat message.",
    category: "System — E-Commerce",
    icon: "CheckCircle",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "quote", "notification"],
    isSystem: true,
    systemEventType: "ecommerce.quote.accepted",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.quote.accepted" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Quote Accepted — #{{trigger.quoteNumber}}",
          body: "A quote has been accepted.\n\nQuote: #{{trigger.quoteNumber}}\nCustomer: {{trigger.customerName}}\nAccepted By: {{trigger.acceptedByName}}\nTotal: {{trigger.currency}} {{trigger.total}}",
        },
        name: "Email Owner — Quote Accepted",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Quote Accepted — #{{trigger.quoteNumber}}",
          body: "Hi {{trigger.customerName}},\n\nYour quote #{{trigger.quoteNumber}} has been accepted.\n\nTotal: {{trigger.currency}} {{trigger.total}}\n\nWe'll be in touch about next steps.",
        },
        name: "Email Customer — Quote Accepted Confirmation",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Quote Accepted",
          message:
            "Quote #{{trigger.quoteNumber}} accepted by {{trigger.acceptedByName}}",
          type: "success",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "quote_accepted",
          placeholders: {
            quote_number: "{{trigger.quoteNumber}}",
            accepted_by: "{{trigger.acceptedByName}}",
          },
        },
        name: "Chat Message — Quote Accepted",
      },
    ],
  },
  {
    id: "system-quote-rejected",
    name: "Quote Rejected Notifications",
    description:
      "Sends rejection notification to owner, in-app notification, and chat message when a quote is rejected.",
    category: "System — E-Commerce",
    icon: "XCircle",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "quote", "notification"],
    isSystem: true,
    systemEventType: "ecommerce.quote.rejected",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.quote.rejected" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Quote Rejected — #{{trigger.quoteNumber}}",
          body: "A quote has been rejected.\n\nQuote: #{{trigger.quoteNumber}}\nCustomer: {{trigger.customerName}}\nReason: {{trigger.rejectionReason}}",
        },
        name: "Email Owner — Quote Rejected",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Quote Rejected",
          message:
            "Quote #{{trigger.quoteNumber}} was rejected by {{trigger.customerName}}",
          type: "warning",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "quote_rejected",
          placeholders: {
            quote_number: "{{trigger.quoteNumber}}",
            reason: "{{trigger.rejectionReason}}",
          },
        },
        name: "Chat Message — Quote Rejected",
      },
    ],
  },
  {
    id: "system-quote-amendment",
    name: "Quote Amendment Requested Notifications",
    description:
      "Sends amendment request notification to owner, in-app notification, and chat message.",
    category: "System — E-Commerce",
    icon: "Pencil",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "quote", "notification"],
    isSystem: true,
    systemEventType: "ecommerce.quote.amendment_requested",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.quote.amendment_requested" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Quote Amendment Requested — #{{trigger.quoteNumber}}",
          body: "A customer has requested changes to a quote.\n\nQuote: #{{trigger.quoteNumber}}\nCustomer: {{trigger.customerName}}\nNotes: {{trigger.amendmentNotes}}",
        },
        name: "Email Owner — Amendment Requested",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Quote Amendment Requested",
          message:
            "{{trigger.customerName}} requested changes to Quote #{{trigger.quoteNumber}}",
          type: "info",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "quote_amendment_requested",
          placeholders: {
            quote_number: "{{trigger.quoteNumber}}",
            notes: "{{trigger.amendmentNotes}}",
          },
        },
        name: "Chat Message — Amendment Requested",
      },
    ],
  },
  {
    id: "system-quote-converted",
    name: "Quote Converted to Order Notifications",
    description:
      "Sends order confirmation emails, in-app notification, and chat message when a quote is converted to an order.",
    category: "System — E-Commerce",
    icon: "ArrowRightCircle",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "ecommerce", "quote", "order", "notification"],
    isSystem: true,
    systemEventType: "ecommerce.quote.converted_to_order",
    defaultActive: true,
    pack: "ecommerce-communications",
    trigger: {
      type: "event",
      config: { event_type: "ecommerce.quote.converted_to_order" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.customerEmail}}",
          to_name: "{{trigger.customerName}}",
          subject: "Order Created from Quote — #{{trigger.quoteNumber}}",
          body: "Hi {{trigger.customerName}},\n\nYour quote #{{trigger.quoteNumber}} has been converted to order #{{trigger.orderNumber}}.\n\nTotal: {{trigger.currency}} {{trigger.total}}\n\nThank you for your business!",
        },
        name: "Email Customer — Order from Quote",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Quote Converted to Order — #{{trigger.quoteNumber}} → #{{trigger.orderNumber}}",
          body: "A quote has been converted to an order.\n\nQuote: #{{trigger.quoteNumber}}\nOrder: #{{trigger.orderNumber}}\nCustomer: {{trigger.customerName}}\nTotal: {{trigger.currency}} {{trigger.total}}",
        },
        name: "Email Owner — Quote Converted to Order",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Quote Converted to Order",
          message:
            "Quote #{{trigger.quoteNumber}} converted to Order #{{trigger.orderNumber}}",
          type: "success",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "chat.send_system_message",
        action_config: {
          conversation_id: "{{trigger.conversationId}}",
          event_type: "quote_converted",
          placeholders: {
            quote_number: "{{trigger.quoteNumber}}",
            order_number: "{{trigger.orderNumber}}",
          },
        },
        name: "Chat Message — Quote Converted",
      },
    ],
  },
];

// ============================================================================
// FORM SYSTEM TEMPLATE (1)
// ============================================================================

const FORM_SYSTEM_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "system-form-submission",
    name: "Form Submission Notification",
    description:
      "Sends a notification email and in-app alert to the site owner when a form is submitted.",
    category: "System — Forms",
    icon: "ClipboardList",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "forms", "notification"],
    isSystem: true,
    systemEventType: "form.submission.received",
    defaultActive: true,
    pack: "essential-communications",
    trigger: {
      type: "event",
      config: { event_type: "form.submission.received" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "New Form Submission — {{trigger.formName}}",
          body: "A new form has been submitted.\n\nForm: {{trigger.formName}}\nPage: {{trigger.pageUrl}}\n\nPlease check the dashboard for submission details.",
        },
        name: "Email Owner — Form Submission",
      },
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "New Form Submission",
          message: 'New submission on "{{trigger.formName}}"',
          type: "info",
          target_role: "owner",
        },
        name: "Notify Owner — In-App",
      },
    ],
  },
];

// ============================================================================
// CHAT SYSTEM TEMPLATES (3)
// ============================================================================

const CHAT_SYSTEM_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "system-chat-new-message",
    name: "New Chat Message Notification",
    description:
      "Sends an in-app notification to the assigned agent (or site owner) when a new customer message is received.",
    category: "System — Live Chat",
    icon: "MessageCircle",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "live-chat", "notification"],
    isSystem: true,
    systemEventType: "live_chat.message.received",
    defaultActive: true,
    pack: "essential-communications",
    trigger: {
      type: "event",
      config: { event_type: "live_chat.message.received" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "New Chat Message",
          message:
            "{{trigger.visitorName}} sent a message: {{trigger.messagePreview}}",
          type: "info",
          target_role: "agent",
          link: "/live-chat/{{trigger.conversationId}}",
        },
        name: "Notify Agent — In-App",
      },
    ],
  },
  {
    id: "system-chat-missed",
    name: "Missed Chat Notification",
    description:
      "Sends an in-app notification and email to the site owner when a chat conversation is missed (no agent response).",
    category: "System — Live Chat",
    icon: "MessageSquareOff",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "live-chat", "notification", "alert"],
    isSystem: true,
    systemEventType: "live_chat.conversation.missed",
    defaultActive: true,
    pack: "essential-communications",
    trigger: {
      type: "event",
      config: { event_type: "live_chat.conversation.missed" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Missed Chat",
          message: "A customer chat was missed — no agent responded in time",
          type: "warning",
          target_role: "owner",
          link: "/live-chat/{{trigger.conversationId}}",
        },
        name: "Notify Owner — In-App",
      },
      {
        step_type: "action",
        action_type: "email.send",
        action_config: {
          to: "{{trigger.ownerEmail}}",
          subject: "Missed Chat — {{trigger.visitorName}}",
          body: "A customer chat was missed — no agent responded in time.\n\nVisitor: {{trigger.visitorName}}\n\nPlease follow up when possible.",
        },
        name: "Email Owner — Missed Chat Alert",
      },
    ],
  },
  {
    id: "system-chat-assigned",
    name: "Chat Assigned Notification",
    description:
      "Sends an in-app notification to the assigned agent when a chat conversation is assigned to them.",
    category: "System — Live Chat",
    icon: "UserCheck",
    complexity: "simple",
    estimatedSetupTime: "0 minutes",
    tags: ["system", "live-chat", "notification"],
    isSystem: true,
    systemEventType: "live_chat.conversation.assigned",
    defaultActive: true,
    pack: "essential-communications",
    trigger: {
      type: "event",
      config: { event_type: "live_chat.conversation.assigned" },
    },
    steps: [
      {
        step_type: "action",
        action_type: "notification.in_app_targeted",
        action_config: {
          title: "Chat Assigned to You",
          message:
            "A conversation with {{trigger.visitorName}} has been assigned to you",
          type: "info",
          target_role: "agent",
          link: "/live-chat/{{trigger.conversationId}}",
        },
        name: "Notify Agent — In-App",
      },
    ],
  },
];

// ============================================================================
// COMBINED EXPORT
// ============================================================================

/**
 * All system workflow templates.
 * These replace hardcoded notification functions with editable, toggleable workflows.
 */
export const SYSTEM_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  ...BOOKING_SYSTEM_TEMPLATES,
  ...ORDER_SYSTEM_TEMPLATES,
  ...QUOTE_SYSTEM_TEMPLATES,
  ...FORM_SYSTEM_TEMPLATES,
  ...CHAT_SYSTEM_TEMPLATES,
];

/**
 * Get all system templates for a specific pack
 */
export function getSystemTemplatesByPack(packId: string): WorkflowTemplate[] {
  return SYSTEM_WORKFLOW_TEMPLATES.filter((t) => t.pack === packId);
}

/**
 * Get a system template by its system event type
 */
export function getSystemTemplateByEventType(
  eventType: string,
): WorkflowTemplate | undefined {
  return SYSTEM_WORKFLOW_TEMPLATES.find((t) => t.systemEventType === eventType);
}

/**
 * Get all system template IDs
 */
export function getSystemTemplateIds(): string[] {
  return SYSTEM_WORKFLOW_TEMPLATES.map((t) => t.id);
}
