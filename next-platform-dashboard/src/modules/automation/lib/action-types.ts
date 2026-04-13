/**
 * Action Type Registry
 *
 * Phase EM-57A: Automation Engine - Core Infrastructure
 *
 * Naming Convention: {category}.{action}
 *
 * Each action definition includes:
 * - Unique ID for execution
 * - Display information (name, description, icon)
 * - Input/Output schemas
 * - Optional connection requirements
 */

// ============================================================================
// ACTION INPUT/OUTPUT TYPES
// ============================================================================

export interface ActionInputField {
  type:
    | "string"
    | "number"
    | "boolean"
    | "array"
    | "object"
    | "date"
    | "enum"
    | "any";
  required?: boolean;
  default?: unknown;
  description?: string;
  values?: string[]; // For enum type
  placeholder?: string;
}

export interface ActionOutputField {
  type: "string" | "number" | "boolean" | "array" | "object" | "any";
  description?: string;
}

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  requires_connection?: string;
  inputs: Record<string, ActionInputField>;
  outputs: Record<string, ActionOutputField>;
}

// ============================================================================
// ACTION REGISTRY
// ============================================================================

export const ACTION_REGISTRY = {
  // =========================================================
  // CRM ACTIONS
  // =========================================================
  crm: {
    create_contact: {
      id: "crm.create_contact",
      name: "Create Contact",
      description: "Create a new contact in CRM",
      category: "crm",
      icon: "User",
      inputs: {
        email: {
          type: "string" as const,
          required: true,
          description: "Contact email address",
        },
        first_name: {
          type: "string" as const,
          required: false,
          description: "First name",
        },
        last_name: {
          type: "string" as const,
          required: false,
          description: "Last name",
        },
        phone: {
          type: "string" as const,
          required: false,
          description: "Phone number",
        },
        company: {
          type: "string" as const,
          required: false,
          description: "Company name",
        },
        tags: {
          type: "array" as const,
          required: false,
          description: "Tags to assign",
        },
        custom_fields: {
          type: "object" as const,
          required: false,
          description: "Custom field values",
        },
      },
      outputs: {
        contact_id: {
          type: "string" as const,
          description: "Created contact ID",
        },
        contact: {
          type: "object" as const,
          description: "Full contact object",
        },
      },
    },
    update_contact: {
      id: "crm.update_contact",
      name: "Update Contact",
      description: "Update an existing contact",
      category: "crm",
      icon: "Pencil",
      inputs: {
        contact_id: {
          type: "string" as const,
          required: true,
          description: "Contact ID to update",
        },
        fields: {
          type: "object" as const,
          required: true,
          description: "Fields to update",
        },
      },
      outputs: {
        contact: {
          type: "object" as const,
          description: "Updated contact object",
        },
      },
    },
    add_tag: {
      id: "crm.add_tag",
      name: "Add Tag to Contact",
      description: "Add a tag to a contact",
      category: "crm",
      icon: "Tag",
      inputs: {
        contact_id: {
          type: "string" as const,
          required: true,
          description: "Contact ID",
        },
        tag: {
          type: "string" as const,
          required: true,
          description: "Tag to add",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether the operation succeeded",
        },
      },
    },
    remove_tag: {
      id: "crm.remove_tag",
      name: "Remove Tag from Contact",
      description: "Remove a tag from a contact",
      category: "crm",
      icon: "Tag",
      inputs: {
        contact_id: {
          type: "string" as const,
          required: true,
          description: "Contact ID",
        },
        tag: {
          type: "string" as const,
          required: true,
          description: "Tag to remove",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether the operation succeeded",
        },
      },
    },
    create_deal: {
      id: "crm.create_deal",
      name: "Create Deal",
      description: "Create a new deal/opportunity",
      category: "crm",
      icon: "CircleDollarSign",
      inputs: {
        title: {
          type: "string" as const,
          required: true,
          description: "Deal title",
        },
        value: {
          type: "number" as const,
          required: false,
          description: "Deal value",
        },
        contact_id: {
          type: "string" as const,
          required: false,
          description: "Associated contact",
        },
        company_id: {
          type: "string" as const,
          required: false,
          description: "Associated company",
        },
        stage: {
          type: "string" as const,
          required: false,
          description: "Pipeline stage",
        },
        pipeline_id: {
          type: "string" as const,
          required: false,
          description: "Pipeline ID",
        },
      },
      outputs: {
        deal_id: { type: "string" as const, description: "Created deal ID" },
        deal: { type: "object" as const, description: "Full deal object" },
      },
    },
    move_deal_stage: {
      id: "crm.move_deal_stage",
      name: "Move Deal Stage",
      description: "Move a deal to a different pipeline stage",
      category: "crm",
      icon: "ArrowRight",
      inputs: {
        deal_id: {
          type: "string" as const,
          required: true,
          description: "Deal ID",
        },
        stage: {
          type: "string" as const,
          required: true,
          description: "Target stage",
        },
      },
      outputs: {
        deal: { type: "object" as const, description: "Updated deal object" },
      },
    },
    create_task: {
      id: "crm.create_task",
      name: "Create Task",
      description: "Create a follow-up task",
      category: "crm",
      icon: "CircleCheck",
      inputs: {
        title: {
          type: "string" as const,
          required: true,
          description: "Task title",
        },
        description: {
          type: "string" as const,
          required: false,
          description: "Task description",
        },
        due_date: {
          type: "date" as const,
          required: false,
          description: "Due date",
        },
        assigned_to: {
          type: "string" as const,
          required: false,
          description: "Assignee user ID",
        },
        contact_id: {
          type: "string" as const,
          required: false,
          description: "Related contact",
        },
        deal_id: {
          type: "string" as const,
          required: false,
          description: "Related deal",
        },
      },
      outputs: {
        task_id: { type: "string" as const, description: "Created task ID" },
      },
    },
    log_activity: {
      id: "crm.log_activity",
      name: "Log Activity",
      description: "Log an activity (call, meeting, note)",
      category: "crm",
      icon: "FileText",
      inputs: {
        contact_id: {
          type: "string" as const,
          required: true,
          description: "Contact ID",
        },
        type: {
          type: "enum" as const,
          values: ["call", "meeting", "note", "email"],
          required: true,
          description: "Activity type",
        },
        description: {
          type: "string" as const,
          required: true,
          description: "Activity description",
        },
      },
      outputs: {
        activity_id: {
          type: "string" as const,
          description: "Created activity ID",
        },
      },
    },
    find_contact: {
      id: "crm.find_contact",
      name: "Find Contact",
      description: "Find a contact by email or other field",
      category: "crm",
      icon: "Search",
      inputs: {
        field: {
          type: "enum" as const,
          values: ["email", "phone", "id"],
          required: true,
          description: "Field to search",
        },
        value: {
          type: "string" as const,
          required: true,
          description: "Value to search for",
        },
      },
      outputs: {
        contact: {
          type: "object" as const,
          description: "Found contact or null",
        },
        found: {
          type: "boolean" as const,
          description: "Whether contact was found",
        },
      },
    },
  },

  // =========================================================
  // EMAIL ACTIONS
  // =========================================================
  email: {
    send: {
      id: "email.send",
      name: "Send Email",
      description: "Send an email using platform email service (Resend)",
      category: "email",
      icon: "Mail",
      inputs: {
        to: {
          type: "string" as const,
          required: true,
          description: "Recipient email",
        },
        subject: {
          type: "string" as const,
          required: true,
          description: "Email subject",
        },
        body: {
          type: "string" as const,
          required: true,
          description: "Email body (HTML supported)",
        },
        from_name: {
          type: "string" as const,
          required: false,
          description: "Sender name",
        },
        reply_to: {
          type: "string" as const,
          required: false,
          description: "Reply-to email",
        },
        cc: {
          type: "array" as const,
          required: false,
          description: "CC recipients",
        },
        bcc: {
          type: "array" as const,
          required: false,
          description: "BCC recipients",
        },
      },
      outputs: {
        message_id: { type: "string" as const, description: "Sent message ID" },
        success: {
          type: "boolean" as const,
          description: "Whether email was sent",
        },
      },
    },
    send_template: {
      id: "email.send_template",
      name: "Send Template Email",
      description: "Send email using a predefined template",
      category: "email",
      icon: "MailOpen",
      inputs: {
        to: {
          type: "string" as const,
          required: true,
          description: "Recipient email",
        },
        template_id: {
          type: "string" as const,
          required: true,
          description: "Template ID",
        },
        variables: {
          type: "object" as const,
          required: false,
          description: "Template variables",
        },
      },
      outputs: {
        message_id: { type: "string" as const, description: "Sent message ID" },
        success: {
          type: "boolean" as const,
          description: "Whether email was sent",
        },
      },
    },
    send_branded_template: {
      id: "email.send_branded_template",
      name: "Send Branded Email",
      description:
        "Send a rich branded email using a platform template (booking confirmations, order updates, etc.)",
      category: "email",
      icon: "Palette",
      inputs: {
        to: {
          type: "string" as const,
          required: true,
          description: "Recipient email address",
          placeholder: "{{trigger.customerEmail}}",
        },
        email_type: {
          type: "enum" as const,
          required: true,
          description: "Branded template type",
          values: [
            "booking_confirmation_customer",
            "booking_confirmation_owner",
            "booking_cancelled_customer",
            "booking_cancelled_owner",
            "booking_confirmed_customer",
            "booking_confirmed_owner",
            "booking_completed_customer",
            "booking_completed_owner",
            "booking_no_show_customer",
            "booking_payment_received_customer",
            "booking_payment_received_owner",
            "order_confirmation_customer",
            "order_confirmation_owner",
            "order_shipped_customer",
            "order_delivered_customer",
            "order_cancelled_customer",
            "order_cancelled_owner",
            "payment_received_customer",
            "refund_issued_customer",
            "payment_proof_uploaded_owner",
            "payment_proof_rejected_customer",
            "low_stock_admin",
            "back_in_stock_customer",
            "abandoned_cart_customer",
            "review_request_customer",
            "quote_sent_customer",
            "quote_request_customer",
            "quote_reminder_customer",
            "quote_request_owner",
            "quote_accepted_owner",
            "quote_accepted_customer",
            "quote_rejected_owner",
            "quote_amendment_requested_owner",
            "form_submission_owner",
            "domain_expiring",
            "chat_transcript",
            "chat_missed_notification",
          ],
        },
        data: {
          type: "object" as const,
          required: false,
          description:
            "Template data (e.g. serviceName, customerName, price). Uses trigger data by default if omitted.",
        },
        subject_override: {
          type: "string" as const,
          required: false,
          description:
            "Custom email subject (overrides the template default). Supports variables like {{trigger.customerName}}.",
          placeholder: "Your booking for {{trigger.serviceName}} is confirmed!",
        },
        body_override: {
          type: "string" as const,
          required: false,
          description:
            "Custom email body text to prepend to the branded template. HTML supported. Supports variables.",
          placeholder:
            "Hi {{trigger.customerName}}, thank you for booking with us!",
        },
      },
      outputs: {
        message_id: {
          type: "string" as const,
          description: "Sent message ID",
        },
        success: {
          type: "boolean" as const,
          description: "Whether email was sent",
        },
      },
    },
  },

  // =========================================================
  // NOTIFICATION ACTIONS
  // =========================================================
  notification: {
    send_sms: {
      id: "notification.send_sms",
      name: "Send SMS",
      description: "Send SMS via Twilio",
      category: "notification",
      icon: "Smartphone",
      requires_connection: "twilio",
      inputs: {
        to: {
          type: "string" as const,
          required: true,
          description: "Phone number",
        },
        body: {
          type: "string" as const,
          required: true,
          description: "Message body",
        },
      },
      outputs: {
        message_sid: {
          type: "string" as const,
          description: "Twilio message SID",
        },
        success: {
          type: "boolean" as const,
          description: "Whether SMS was sent",
        },
      },
    },
    send_slack: {
      id: "notification.send_slack",
      name: "Send Slack Message",
      description: "Send message to Slack channel",
      category: "notification",
      icon: "MessageSquare",
      requires_connection: "slack",
      inputs: {
        channel: {
          type: "string" as const,
          required: true,
          description: "Channel ID or name",
        },
        message: {
          type: "string" as const,
          required: true,
          description: "Message text",
        },
        blocks: {
          type: "array" as const,
          required: false,
          description: "Slack Block Kit blocks",
        },
      },
      outputs: {
        ts: { type: "string" as const, description: "Message timestamp" },
        success: {
          type: "boolean" as const,
          description: "Whether message was sent",
        },
      },
    },
    send_discord: {
      id: "notification.send_discord",
      name: "Send Discord Message",
      description: "Send message to Discord webhook",
      category: "notification",
      icon: "Gamepad2",
      requires_connection: "discord",
      inputs: {
        content: {
          type: "string" as const,
          required: true,
          description: "Message content",
        },
        embeds: {
          type: "array" as const,
          required: false,
          description: "Discord embeds",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether message was sent",
        },
      },
    },
    in_app: {
      id: "notification.in_app",
      name: "Create In-App Notification",
      description: "Create notification in platform",
      category: "notification",
      icon: "Bell",
      inputs: {
        user_id: {
          type: "string" as const,
          required: true,
          description: "User ID to notify",
        },
        title: {
          type: "string" as const,
          required: true,
          description: "Notification title",
        },
        message: {
          type: "string" as const,
          required: true,
          description: "Notification message",
        },
        type: {
          type: "enum" as const,
          values: ["info", "success", "warning", "error"],
          required: false,
          description: "Notification type",
        },
        link: {
          type: "string" as const,
          required: false,
          description: "Link URL",
        },
      },
      outputs: {
        notification_id: {
          type: "string" as const,
          description: "Created notification ID",
        },
      },
    },
    in_app_targeted: {
      id: "notification.in_app_targeted",
      name: "Targeted In-App Notification",
      description:
        "Send in-app notification to specific users by role (owner, agent, all)",
      category: "notification",
      icon: "BellRing",
      inputs: {
        title: {
          type: "string" as const,
          required: true,
          description: "Notification title",
        },
        message: {
          type: "string" as const,
          required: true,
          description: "Notification message",
        },
        type: {
          type: "enum" as const,
          values: ["info", "success", "warning", "error"],
          required: false,
          description: "Notification type",
        },
        target_role: {
          type: "enum" as const,
          values: ["owner", "agent", "all"],
          required: false,
          description: "Target role to notify (defaults to owner)",
        },
        target_user_id: {
          type: "string" as const,
          required: false,
          description: "Specific user ID to notify (overrides target_role)",
        },
        link: {
          type: "string" as const,
          required: false,
          description: "Link URL for the notification",
        },
      },
      outputs: {
        notification_ids: {
          type: "array" as const,
          description: "Created notification IDs",
        },
        notified_count: {
          type: "number" as const,
          description: "Number of users notified",
        },
      },
    },
  },

  // =========================================================
  // WEBHOOK ACTIONS
  // =========================================================
  webhook: {
    send: {
      id: "webhook.send",
      name: "Send Webhook",
      description: "Send HTTP request to external URL",
      category: "webhook",
      icon: "Globe",
      inputs: {
        url: {
          type: "string" as const,
          required: true,
          description: "Target URL",
        },
        method: {
          type: "enum" as const,
          values: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          required: true,
          description: "HTTP method",
        },
        headers: {
          type: "object" as const,
          required: false,
          description: "Request headers",
        },
        body: {
          type: "object" as const,
          required: false,
          description: "Request body",
        },
        timeout_ms: {
          type: "number" as const,
          required: false,
          default: 30000,
          description: "Timeout in milliseconds",
        },
      },
      outputs: {
        status_code: {
          type: "number" as const,
          description: "Response status code",
        },
        response_body: {
          type: "object" as const,
          description: "Response body",
        },
        success: {
          type: "boolean" as const,
          description: "Whether request succeeded (2xx status)",
        },
      },
    },
  },

  // =========================================================
  // DATA ACTIONS
  // =========================================================
  data: {
    lookup: {
      id: "data.lookup",
      name: "Lookup Record",
      description: "Find a record by field value",
      category: "data",
      icon: "Search",
      inputs: {
        module: {
          type: "string" as const,
          required: true,
          description: "Module ID (e.g., crm, booking)",
        },
        table: {
          type: "string" as const,
          required: true,
          description: "Table name",
        },
        field: {
          type: "string" as const,
          required: true,
          description: "Field to search",
        },
        value: {
          type: "any" as const,
          required: true,
          description: "Value to find",
        },
      },
      outputs: {
        record: {
          type: "object" as const,
          description: "Found record or null",
        },
        found: {
          type: "boolean" as const,
          description: "Whether record was found",
        },
      },
    },
    create: {
      id: "data.create",
      name: "Create Record",
      description: "Create a new database record",
      category: "data",
      icon: "Plus",
      inputs: {
        module: {
          type: "string" as const,
          required: true,
          description: "Module ID",
        },
        table: {
          type: "string" as const,
          required: true,
          description: "Table name",
        },
        data: {
          type: "object" as const,
          required: true,
          description: "Record data",
        },
      },
      outputs: {
        record: { type: "object" as const, description: "Created record" },
        id: { type: "string" as const, description: "Record ID" },
      },
    },
    update: {
      id: "data.update",
      name: "Update Record",
      description: "Update an existing record",
      category: "data",
      icon: "Pencil",
      inputs: {
        module: {
          type: "string" as const,
          required: true,
          description: "Module ID",
        },
        table: {
          type: "string" as const,
          required: true,
          description: "Table name",
        },
        id: {
          type: "string" as const,
          required: true,
          description: "Record ID",
        },
        data: {
          type: "object" as const,
          required: true,
          description: "Fields to update",
        },
      },
      outputs: {
        record: { type: "object" as const, description: "Updated record" },
        success: {
          type: "boolean" as const,
          description: "Whether update succeeded",
        },
      },
    },
    delete: {
      id: "data.delete",
      name: "Delete Record",
      description: "Delete a database record",
      category: "data",
      icon: "Trash2",
      inputs: {
        module: {
          type: "string" as const,
          required: true,
          description: "Module ID",
        },
        table: {
          type: "string" as const,
          required: true,
          description: "Table name",
        },
        id: {
          type: "string" as const,
          required: true,
          description: "Record ID",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether delete succeeded",
        },
      },
    },
  },

  // =========================================================
  // FLOW CONTROL
  // =========================================================
  flow: {
    delay: {
      id: "flow.delay",
      name: "Delay",
      description: "Wait for specified duration",
      category: "flow",
      icon: "Timer",
      inputs: {
        duration: {
          type: "string" as const,
          required: true,
          description: "Duration (e.g., 5m, 1h, 1d)",
        },
      },
      outputs: {
        resumed_at: {
          type: "string" as const,
          description: "When the workflow resumed",
        },
      },
    },
    condition: {
      id: "flow.condition",
      name: "Condition",
      description: "Branch based on condition",
      category: "flow",
      icon: "GitBranch",
      inputs: {
        conditions: {
          type: "array" as const,
          required: true,
          description: "Conditions to evaluate",
        },
      },
      outputs: {
        result: { type: "boolean" as const, description: "Condition result" },
        matched_branch: {
          type: "string" as const,
          description: "Which branch matched",
        },
      },
    },
    loop: {
      id: "flow.loop",
      name: "Loop",
      description: "Iterate over array",
      category: "flow",
      icon: "Repeat",
      inputs: {
        items: {
          type: "array" as const,
          required: true,
          description: "Items to loop over",
        },
        max_iterations: {
          type: "number" as const,
          required: false,
          default: 100,
          description: "Max iterations",
        },
      },
      outputs: {
        current_item: {
          type: "any" as const,
          description: "Current iteration item",
        },
        index: { type: "number" as const, description: "Current index" },
        is_last: {
          type: "boolean" as const,
          description: "Whether this is the last item",
        },
      },
    },
    stop: {
      id: "flow.stop",
      name: "Stop Workflow",
      description: "Stop workflow execution",
      category: "flow",
      icon: "StopCircle",
      inputs: {
        reason: {
          type: "string" as const,
          required: false,
          description: "Reason for stopping",
        },
      },
      outputs: {},
    },
  },

  // =========================================================
  // TRANSFORM ACTIONS
  // =========================================================
  transform: {
    map: {
      id: "transform.map",
      name: "Map Data",
      description: "Transform data structure",
      category: "transform",
      icon: "RefreshCw",
      inputs: {
        source: {
          type: "object" as const,
          required: true,
          description: "Source data",
        },
        mapping: {
          type: "object" as const,
          required: true,
          description: "Field mapping",
        },
      },
      outputs: {
        result: { type: "object" as const, description: "Transformed data" },
      },
    },
    filter: {
      id: "transform.filter",
      name: "Filter Array",
      description: "Filter items from array",
      category: "transform",
      icon: "Search",
      inputs: {
        array: {
          type: "array" as const,
          required: true,
          description: "Array to filter",
        },
        conditions: {
          type: "array" as const,
          required: true,
          description: "Filter conditions",
        },
      },
      outputs: {
        result: { type: "array" as const, description: "Filtered array" },
        count: {
          type: "number" as const,
          description: "Number of matching items",
        },
      },
    },
    aggregate: {
      id: "transform.aggregate",
      name: "Aggregate",
      description: "Calculate sum, average, count, etc.",
      category: "transform",
      icon: "ChartBar",
      inputs: {
        array: {
          type: "array" as const,
          required: true,
          description: "Array to aggregate",
        },
        operation: {
          type: "enum" as const,
          values: ["sum", "average", "count", "min", "max"],
          required: true,
          description: "Aggregation operation",
        },
        field: {
          type: "string" as const,
          required: false,
          description: "Field to aggregate (for objects)",
        },
      },
      outputs: {
        result: { type: "number" as const, description: "Aggregation result" },
      },
    },
    format_date: {
      id: "transform.format_date",
      name: "Format Date",
      description: "Format a date string",
      category: "transform",
      icon: "Calendar",
      inputs: {
        date: {
          type: "string" as const,
          required: true,
          description: "Date to format",
        },
        format: {
          type: "string" as const,
          required: true,
          description: "Output format (e.g., YYYY-MM-DD)",
        },
        timezone: {
          type: "string" as const,
          required: false,
          description: "Timezone",
        },
      },
      outputs: {
        formatted: {
          type: "string" as const,
          description: "Formatted date string",
        },
      },
    },
    template: {
      id: "transform.template",
      name: "Render Template",
      description: "Render text template with variables",
      category: "transform",
      icon: "FileText",
      inputs: {
        template: {
          type: "string" as const,
          required: true,
          description: "Template string with {{variables}}",
        },
        variables: {
          type: "object" as const,
          required: false,
          description: "Variable values",
        },
      },
      outputs: {
        result: { type: "string" as const, description: "Rendered template" },
      },
    },
    math: {
      id: "transform.math",
      name: "Math Operation",
      description: "Perform mathematical calculation",
      category: "transform",
      icon: "Calculator",
      inputs: {
        operation: {
          type: "enum" as const,
          values: [
            "add",
            "subtract",
            "multiply",
            "divide",
            "round",
            "floor",
            "ceil",
            "abs",
          ],
          required: true,
          description: "Math operation",
        },
        a: {
          type: "number" as const,
          required: true,
          description: "First operand",
        },
        b: {
          type: "number" as const,
          required: false,
          description: "Second operand (for binary ops)",
        },
      },
      outputs: {
        result: { type: "number" as const, description: "Calculation result" },
      },
    },
  },

  // =========================================================
  // DOMAIN ACTIONS (EM-57 - Domain & Email Reseller Integration)
  // =========================================================
  domain: {
    check_availability: {
      id: "domain.check_availability",
      name: "Check Domain Availability",
      description: "Check if a domain name is available for registration",
      category: "domain",
      icon: "Search",
      inputs: {
        domain_name: {
          type: "string" as const,
          required: true,
          description: "Domain name to check (e.g., example.com)",
        },
        tlds: {
          type: "array" as const,
          required: false,
          description: 'TLDs to check (e.g., [".com", ".net", ".org"])',
        },
      },
      outputs: {
        available: {
          type: "boolean" as const,
          description: "Whether the domain is available",
        },
        price: {
          type: "number" as const,
          description: "Registration price if available",
        },
        premium: {
          type: "boolean" as const,
          description: "Whether this is a premium domain",
        },
        suggestions: {
          type: "array" as const,
          description: "Alternative domain suggestions",
        },
      },
    },
    register: {
      id: "domain.register",
      name: "Register Domain",
      description: "Register a new domain name",
      category: "domain",
      icon: "Globe",
      inputs: {
        domain_name: {
          type: "string" as const,
          required: true,
          description: "Domain name to register",
        },
        years: {
          type: "number" as const,
          required: false,
          default: 1,
          description: "Registration period in years",
        },
        contact_id: {
          type: "string" as const,
          required: true,
          description: "Contact ID for domain registration",
        },
        nameservers: {
          type: "array" as const,
          required: false,
          description: "Custom nameservers",
        },
        privacy_protection: {
          type: "boolean" as const,
          required: false,
          default: true,
          description: "Enable WHOIS privacy protection",
        },
        auto_renew: {
          type: "boolean" as const,
          required: false,
          default: true,
          description: "Enable auto-renewal",
        },
      },
      outputs: {
        domain_id: {
          type: "string" as const,
          description: "Registered domain ID",
        },
        order_id: { type: "string" as const, description: "Order ID" },
        expiry_date: {
          type: "string" as const,
          description: "Domain expiration date",
        },
        success: {
          type: "boolean" as const,
          description: "Whether registration succeeded",
        },
      },
    },
    renew: {
      id: "domain.renew",
      name: "Renew Domain",
      description: "Renew an existing domain registration",
      category: "domain",
      icon: "RefreshCw",
      inputs: {
        domain_id: {
          type: "string" as const,
          required: true,
          description: "Domain ID to renew",
        },
        years: {
          type: "number" as const,
          required: false,
          default: 1,
          description: "Renewal period in years",
        },
      },
      outputs: {
        new_expiry_date: {
          type: "string" as const,
          description: "New expiration date",
        },
        order_id: { type: "string" as const, description: "Renewal order ID" },
        success: {
          type: "boolean" as const,
          description: "Whether renewal succeeded",
        },
      },
    },
    set_auto_renew: {
      id: "domain.set_auto_renew",
      name: "Set Auto-Renew",
      description: "Enable or disable auto-renewal for a domain",
      category: "domain",
      icon: "Repeat",
      inputs: {
        domain_id: {
          type: "string" as const,
          required: true,
          description: "Domain ID",
        },
        enabled: {
          type: "boolean" as const,
          required: true,
          description: "Enable or disable auto-renewal",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether the update succeeded",
        },
      },
    },
    add_dns_record: {
      id: "domain.add_dns_record",
      name: "Add DNS Record",
      description: "Add a DNS record to a domain",
      category: "domain",
      icon: "Plus",
      inputs: {
        domain_id: {
          type: "string" as const,
          required: true,
          description: "Domain ID",
        },
        record_type: {
          type: "enum" as const,
          values: ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"],
          required: true,
          description: "DNS record type",
        },
        name: {
          type: "string" as const,
          required: true,
          description: "Record name (e.g., www, @, mail)",
        },
        value: {
          type: "string" as const,
          required: true,
          description: "Record value",
        },
        ttl: {
          type: "number" as const,
          required: false,
          default: 3600,
          description: "Time to live in seconds",
        },
        priority: {
          type: "number" as const,
          required: false,
          description: "Priority (for MX and SRV records)",
        },
      },
      outputs: {
        record_id: {
          type: "string" as const,
          description: "Created DNS record ID",
        },
        success: {
          type: "boolean" as const,
          description: "Whether the record was created",
        },
      },
    },
    update_dns_record: {
      id: "domain.update_dns_record",
      name: "Update DNS Record",
      description: "Update an existing DNS record",
      category: "domain",
      icon: "Pencil",
      inputs: {
        record_id: {
          type: "string" as const,
          required: true,
          description: "DNS record ID",
        },
        value: {
          type: "string" as const,
          required: false,
          description: "New record value",
        },
        ttl: {
          type: "number" as const,
          required: false,
          description: "New TTL in seconds",
        },
        priority: {
          type: "number" as const,
          required: false,
          description: "New priority (for MX/SRV)",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether the update succeeded",
        },
      },
    },
    delete_dns_record: {
      id: "domain.delete_dns_record",
      name: "Delete DNS Record",
      description: "Delete a DNS record from a domain",
      category: "domain",
      icon: "Trash2",
      inputs: {
        record_id: {
          type: "string" as const,
          required: true,
          description: "DNS record ID to delete",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether the record was deleted",
        },
      },
    },
    create_email_account: {
      id: "domain.create_email_account",
      name: "Create Email Account",
      description: "Create a new email account for a domain",
      category: "domain",
      icon: "Mail",
      inputs: {
        domain_id: {
          type: "string" as const,
          required: true,
          description: "Domain ID",
        },
        username: {
          type: "string" as const,
          required: true,
          description: "Email username (before @)",
        },
        password: {
          type: "string" as const,
          required: true,
          description: "Email account password",
        },
        quota_mb: {
          type: "number" as const,
          required: false,
          default: 1024,
          description: "Mailbox quota in MB",
        },
        forwarding_address: {
          type: "string" as const,
          required: false,
          description: "Forward emails to this address",
        },
      },
      outputs: {
        email_id: {
          type: "string" as const,
          description: "Created email account ID",
        },
        email_address: {
          type: "string" as const,
          description: "Full email address",
        },
        success: {
          type: "boolean" as const,
          description: "Whether the account was created",
        },
      },
    },
    update_email_account: {
      id: "domain.update_email_account",
      name: "Update Email Account",
      description: "Update an existing email account",
      category: "domain",
      icon: "Pencil",
      inputs: {
        email_id: {
          type: "string" as const,
          required: true,
          description: "Email account ID",
        },
        password: {
          type: "string" as const,
          required: false,
          description: "New password",
        },
        quota_mb: {
          type: "number" as const,
          required: false,
          description: "New quota in MB",
        },
        forwarding_address: {
          type: "string" as const,
          required: false,
          description: "New forwarding address",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether the update succeeded",
        },
      },
    },
    delete_email_account: {
      id: "domain.delete_email_account",
      name: "Delete Email Account",
      description: "Delete an email account",
      category: "domain",
      icon: "Trash2",
      inputs: {
        email_id: {
          type: "string" as const,
          required: true,
          description: "Email account ID to delete",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether the account was deleted",
        },
      },
    },
    initiate_transfer: {
      id: "domain.initiate_transfer",
      name: "Initiate Domain Transfer",
      description: "Start a domain transfer from another registrar",
      category: "domain",
      icon: "Download",
      inputs: {
        domain_name: {
          type: "string" as const,
          required: true,
          description: "Domain name to transfer",
        },
        auth_code: {
          type: "string" as const,
          required: true,
          description: "EPP/Authorization code from current registrar",
        },
        contact_id: {
          type: "string" as const,
          required: true,
          description: "Contact ID for the domain",
        },
      },
      outputs: {
        transfer_id: {
          type: "string" as const,
          description: "Transfer request ID",
        },
        status: { type: "string" as const, description: "Transfer status" },
        success: {
          type: "boolean" as const,
          description: "Whether transfer was initiated",
        },
      },
    },
    get_auth_code: {
      id: "domain.get_auth_code",
      name: "Get Authorization Code",
      description: "Get EPP authorization code for domain transfer out",
      category: "domain",
      icon: "Key",
      inputs: {
        domain_id: {
          type: "string" as const,
          required: true,
          description: "Domain ID",
        },
      },
      outputs: {
        auth_code: {
          type: "string" as const,
          description: "EPP authorization code",
        },
        success: {
          type: "boolean" as const,
          description: "Whether the code was retrieved",
        },
      },
    },
    lookup: {
      id: "domain.lookup",
      name: "Domain Lookup",
      description: "Lookup domain details and WHOIS information",
      category: "domain",
      icon: "Search",
      inputs: {
        domain_name: {
          type: "string" as const,
          required: true,
          description: "Domain name to lookup",
        },
        include_whois: {
          type: "boolean" as const,
          required: false,
          default: false,
          description: "Include WHOIS data",
        },
      },
      outputs: {
        domain: { type: "object" as const, description: "Domain details" },
        whois: {
          type: "object" as const,
          description: "WHOIS information (if requested)",
        },
        found: {
          type: "boolean" as const,
          description: "Whether domain was found in system",
        },
      },
    },
    set_nameservers: {
      id: "domain.set_nameservers",
      name: "Set Nameservers",
      description: "Update nameservers for a domain",
      category: "domain",
      icon: "Monitor",
      inputs: {
        domain_id: {
          type: "string" as const,
          required: true,
          description: "Domain ID",
        },
        nameservers: {
          type: "array" as const,
          required: true,
          description: "Array of nameserver hostnames",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether nameservers were updated",
        },
      },
    },
    lock_domain: {
      id: "domain.lock_domain",
      name: "Lock Domain",
      description: "Enable transfer lock on domain",
      category: "domain",
      icon: "Lock",
      inputs: {
        domain_id: {
          type: "string" as const,
          required: true,
          description: "Domain ID",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether domain was locked",
        },
      },
    },
    unlock_domain: {
      id: "domain.unlock_domain",
      name: "Unlock Domain",
      description: "Disable transfer lock on domain",
      category: "domain",
      icon: "Unlock",
      inputs: {
        domain_id: {
          type: "string" as const,
          required: true,
          description: "Domain ID",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether domain was unlocked",
        },
      },
    },
  },

  // =========================================================
  // E-COMMERCE ACTIONS
  // =========================================================
  ecommerce: {
    update_order_status: {
      id: "ecommerce.update_order_status",
      name: "Update Order Status",
      description:
        "Update the status of an order (e.g., confirmed, shipped, delivered)",
      category: "ecommerce",
      icon: "Package",
      inputs: {
        order_id: {
          type: "string" as const,
          required: true,
          description: "Order ID",
        },
        status: {
          type: "enum" as const,
          values: [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "refunded",
          ],
          required: true,
          description: "New order status",
        },
        note: {
          type: "string" as const,
          required: false,
          description: "Status change note",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether status was updated",
        },
        order_id: { type: "string" as const, description: "Order ID" },
        status: { type: "string" as const, description: "New status" },
      },
    },
    add_order_note: {
      id: "ecommerce.add_order_note",
      name: "Add Order Note",
      description: "Add an internal or customer-facing note to an order",
      category: "ecommerce",
      icon: "FileText",
      inputs: {
        order_id: {
          type: "string" as const,
          required: true,
          description: "Order ID",
        },
        content: {
          type: "string" as const,
          required: true,
          description: "Note content",
        },
        is_internal: {
          type: "boolean" as const,
          required: false,
          default: true,
          description: "Whether note is internal only",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether note was added",
        },
        note_id: { type: "string" as const, description: "Created note ID" },
      },
    },
    add_shipment: {
      id: "ecommerce.add_shipment",
      name: "Add Shipment Tracking",
      description: "Add shipping/tracking information to an order",
      category: "ecommerce",
      icon: "Truck",
      inputs: {
        order_id: {
          type: "string" as const,
          required: true,
          description: "Order ID",
        },
        carrier: {
          type: "string" as const,
          required: true,
          description: "Shipping carrier name",
        },
        tracking_number: {
          type: "string" as const,
          required: true,
          description: "Tracking number",
        },
        tracking_url: {
          type: "string" as const,
          required: false,
          description: "Tracking URL",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether shipment was added",
        },
        shipment_id: {
          type: "string" as const,
          description: "Created shipment ID",
        },
      },
    },
    create_refund: {
      id: "ecommerce.create_refund",
      name: "Create Refund",
      description: "Create a refund for an order",
      category: "ecommerce",
      icon: "RotateCcw",
      inputs: {
        order_id: {
          type: "string" as const,
          required: true,
          description: "Order ID",
        },
        amount: {
          type: "number" as const,
          required: true,
          description: "Refund amount",
        },
        reason: {
          type: "string" as const,
          required: true,
          description: "Reason for refund",
        },
        refund_method: {
          type: "enum" as const,
          values: ["original_payment", "store_credit", "other"],
          required: false,
          description: "Refund method",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether refund was created",
        },
        refund_id: {
          type: "string" as const,
          description: "Created refund ID",
        },
      },
    },
    adjust_stock: {
      id: "ecommerce.adjust_stock",
      name: "Adjust Stock Level",
      description: "Adjust inventory stock for a product",
      category: "ecommerce",
      icon: "Boxes",
      inputs: {
        product_id: {
          type: "string" as const,
          required: true,
          description: "Product ID",
        },
        variant_id: {
          type: "string" as const,
          required: false,
          description: "Variant ID (if applicable)",
        },
        quantity: {
          type: "number" as const,
          required: true,
          description: "Quantity to adjust (positive or negative)",
        },
        movement_type: {
          type: "enum" as const,
          values: ["adjustment", "restock", "damage", "return", "count"],
          required: false,
          description: "Type of stock movement",
        },
        reason: {
          type: "string" as const,
          required: false,
          description: "Reason for adjustment",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether stock was adjusted",
        },
        movement: {
          type: "object" as const,
          description: "Stock movement record",
        },
      },
    },
    update_quote_status: {
      id: "ecommerce.update_quote_status",
      name: "Update Quote Status",
      description: "Update the status of a quotation",
      category: "ecommerce",
      icon: "FileSpreadsheet",
      inputs: {
        quote_id: {
          type: "string" as const,
          required: true,
          description: "Quote ID",
        },
        status: {
          type: "enum" as const,
          values: [
            "draft",
            "pending_approval",
            "sent",
            "viewed",
            "accepted",
            "rejected",
            "expired",
            "converted",
          ],
          required: true,
          description: "New quote status",
        },
        notes: {
          type: "string" as const,
          required: false,
          description: "Status change notes",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether status was updated",
        },
        quote_id: { type: "string" as const, description: "Quote ID" },
      },
    },
    send_quote: {
      id: "ecommerce.send_quote",
      name: "Send Quote to Customer",
      description: "Send a quotation to the customer via email",
      category: "ecommerce",
      icon: "Send",
      inputs: {
        quote_id: {
          type: "string" as const,
          required: true,
          description: "Quote ID",
        },
        subject: {
          type: "string" as const,
          required: false,
          description: "Custom email subject",
        },
        message: {
          type: "string" as const,
          required: false,
          description: "Custom email message",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether quote was sent",
        },
        quote_id: { type: "string" as const, description: "Quote ID" },
      },
    },
    send_quote_reminder: {
      id: "ecommerce.send_quote_reminder",
      name: "Send Quote Reminder",
      description: "Send a reminder email for a pending quote",
      category: "ecommerce",
      icon: "BellRing",
      inputs: {
        quote_id: {
          type: "string" as const,
          required: true,
          description: "Quote ID",
        },
        message: {
          type: "string" as const,
          required: false,
          description: "Custom reminder message",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether reminder was sent",
        },
      },
    },
    convert_quote_to_order: {
      id: "ecommerce.convert_quote_to_order",
      name: "Convert Quote to Order",
      description: "Convert an accepted quote into an order",
      category: "ecommerce",
      icon: "ArrowRightLeft",
      inputs: {
        quote_id: {
          type: "string" as const,
          required: true,
          description: "Quote ID to convert",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether conversion succeeded",
        },
        order_id: { type: "string" as const, description: "Created order ID" },
      },
    },
  },

  // =========================================================
  // BOOKING ACTIONS
  // =========================================================
  booking: {
    create_appointment: {
      id: "booking.create_appointment",
      name: "Create Appointment",
      description: "Create a new booking appointment",
      category: "booking",
      icon: "CalendarPlus",
      inputs: {
        service_id: {
          type: "string" as const,
          required: true,
          description: "Service ID",
        },
        staff_id: {
          type: "string" as const,
          required: false,
          description: "Staff member ID",
        },
        customer_name: {
          type: "string" as const,
          required: true,
          description: "Customer name",
        },
        customer_email: {
          type: "string" as const,
          required: true,
          description: "Customer email",
        },
        customer_phone: {
          type: "string" as const,
          required: false,
          description: "Customer phone",
        },
        start_time: {
          type: "string" as const,
          required: true,
          description: "Start time (ISO 8601)",
        },
        end_time: {
          type: "string" as const,
          required: true,
          description: "End time (ISO 8601)",
        },
        notes: {
          type: "string" as const,
          required: false,
          description: "Booking notes",
        },
      },
      outputs: {
        appointment_id: {
          type: "string" as const,
          description: "Created appointment ID",
        },
        appointment: {
          type: "object" as const,
          description: "Full appointment object",
        },
      },
    },
    update_appointment: {
      id: "booking.update_appointment",
      name: "Update Appointment",
      description: "Update an existing appointment",
      category: "booking",
      icon: "CalendarCog",
      inputs: {
        appointment_id: {
          type: "string" as const,
          required: true,
          description: "Appointment ID",
        },
        updates: {
          type: "object" as const,
          required: true,
          description: "Fields to update",
        },
      },
      outputs: {
        appointment_id: {
          type: "string" as const,
          description: "Updated appointment ID",
        },
        appointment: {
          type: "object" as const,
          description: "Updated appointment object",
        },
      },
    },
    update_status: {
      id: "booking.update_status",
      name: "Update Appointment Status",
      description: "Change appointment status (confirm, complete, no-show)",
      category: "booking",
      icon: "CalendarCheck",
      inputs: {
        appointment_id: {
          type: "string" as const,
          required: true,
          description: "Appointment ID",
        },
        status: {
          type: "enum" as const,
          values: ["pending", "confirmed", "completed", "cancelled", "no_show"],
          required: true,
          description: "New status",
        },
      },
      outputs: {
        appointment_id: {
          type: "string" as const,
          description: "Appointment ID",
        },
        status: { type: "string" as const, description: "New status" },
      },
    },
    cancel_appointment: {
      id: "booking.cancel_appointment",
      name: "Cancel Appointment",
      description: "Cancel a booking appointment",
      category: "booking",
      icon: "CalendarX",
      inputs: {
        appointment_id: {
          type: "string" as const,
          required: true,
          description: "Appointment ID",
        },
        cancelled_by: {
          type: "enum" as const,
          values: ["customer", "staff", "system"],
          required: false,
          description: "Who cancelled",
        },
        reason: {
          type: "string" as const,
          required: false,
          description: "Cancellation reason",
        },
      },
      outputs: {
        appointment_id: {
          type: "string" as const,
          description: "Cancelled appointment ID",
        },
        cancelled: {
          type: "boolean" as const,
          description: "Whether cancellation succeeded",
        },
      },
    },
    create_reminder: {
      id: "booking.create_reminder",
      name: "Create Appointment Reminder",
      description: "Create a reminder for an upcoming appointment",
      category: "booking",
      icon: "AlarmClock",
      inputs: {
        appointment_id: {
          type: "string" as const,
          required: true,
          description: "Appointment ID",
        },
        type: {
          type: "enum" as const,
          values: ["email", "sms"],
          required: false,
          description: "Reminder type",
        },
        send_at: {
          type: "string" as const,
          required: true,
          description: "When to send (ISO 8601)",
        },
        message: {
          type: "string" as const,
          required: false,
          description: "Custom reminder message",
        },
      },
      outputs: {
        reminder_id: {
          type: "string" as const,
          description: "Created reminder ID",
        },
      },
    },
  },

  // =========================================================
  // LIVE CHAT ACTIONS
  // =========================================================
  chat: {
    send_message: {
      id: "chat.send_message",
      name: "Send Chat Message",
      description: "Send a message in a live chat conversation",
      category: "chat",
      icon: "MessageSquare",
      inputs: {
        conversation_id: {
          type: "string" as const,
          required: true,
          description: "Conversation ID",
        },
        content: {
          type: "string" as const,
          required: true,
          description: "Message content",
        },
        sender_type: {
          type: "enum" as const,
          values: ["agent", "system"],
          required: false,
          description: "Sender type",
        },
        sender_name: {
          type: "string" as const,
          required: false,
          description: "Sender name",
        },
        is_internal: {
          type: "boolean" as const,
          required: false,
          default: false,
          description: "Internal note only",
        },
      },
      outputs: {
        message_id: { type: "string" as const, description: "Sent message ID" },
        success: {
          type: "boolean" as const,
          description: "Whether message was sent",
        },
      },
    },
    assign_conversation: {
      id: "chat.assign_conversation",
      name: "Assign Conversation",
      description: "Assign a chat conversation to an agent",
      category: "chat",
      icon: "UserPlus",
      inputs: {
        conversation_id: {
          type: "string" as const,
          required: true,
          description: "Conversation ID",
        },
        agent_id: {
          type: "string" as const,
          required: true,
          description: "Agent user ID",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether assignment succeeded",
        },
      },
    },
    resolve_conversation: {
      id: "chat.resolve_conversation",
      name: "Resolve Conversation",
      description: "Mark a chat conversation as resolved",
      category: "chat",
      icon: "CheckCircle",
      inputs: {
        conversation_id: {
          type: "string" as const,
          required: true,
          description: "Conversation ID",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether conversation was resolved",
        },
      },
    },
    close_conversation: {
      id: "chat.close_conversation",
      name: "Close Conversation",
      description: "Close a chat conversation permanently",
      category: "chat",
      icon: "XCircle",
      inputs: {
        conversation_id: {
          type: "string" as const,
          required: true,
          description: "Conversation ID",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether conversation was closed",
        },
      },
    },
    update_tags: {
      id: "chat.update_tags",
      name: "Update Conversation Tags",
      description: "Update tags on a chat conversation",
      category: "chat",
      icon: "Tags",
      inputs: {
        conversation_id: {
          type: "string" as const,
          required: true,
          description: "Conversation ID",
        },
        tags: {
          type: "array" as const,
          required: true,
          description: "Tags to set on conversation",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether tags were updated",
        },
        tags: { type: "array" as const, description: "Updated tags" },
      },
    },
    send_system_message: {
      id: "chat.send_system_message",
      name: "Send System Message",
      description:
        "Send a system message in a chat using a configurable template",
      category: "chat",
      icon: "Bot",
      inputs: {
        conversation_id: {
          type: "string" as const,
          required: true,
          description: "Conversation ID",
        },
        event_type: {
          type: "string" as const,
          required: true,
          description: "Chat message event type (e.g. welcome, agent_joined)",
        },
        custom_message: {
          type: "string" as const,
          required: false,
          description: "Custom message (overrides template)",
        },
        placeholders: {
          type: "object" as const,
          required: false,
          description: "Placeholder values for the message template",
        },
      },
      outputs: {
        message_id: {
          type: "string" as const,
          description: "Sent message ID",
        },
        success: {
          type: "boolean" as const,
          description: "Whether message was sent",
        },
        skipped: {
          type: "boolean" as const,
          description: "Whether message was skipped (template disabled)",
        },
      },
    },
  },

  // ── Marketing Module Actions ───────────────────────────────────────
  marketing: {
    send_campaign: {
      id: "marketing.send_campaign",
      name: "Send Campaign",
      description: "Trigger sending a marketing campaign to its audience",
      category: "marketing",
      icon: "Mail",
      inputs: {
        campaign_id: {
          type: "string" as const,
          required: true,
          description: "Campaign ID to send",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether the campaign was queued for sending",
        },
        total_recipients: {
          type: "number" as const,
          description: "Number of recipients queued",
        },
      },
    },
    add_subscriber: {
      id: "marketing.add_subscriber",
      name: "Add Subscriber",
      description: "Add a new subscriber or update existing",
      category: "marketing",
      icon: "UserPlus",
      inputs: {
        email: {
          type: "string" as const,
          required: true,
          description: "Subscriber email address",
        },
        first_name: {
          type: "string" as const,
          required: false,
          description: "First name",
        },
        last_name: {
          type: "string" as const,
          required: false,
          description: "Last name",
        },
        tags: {
          type: "string" as const,
          required: false,
          description: "Comma-separated tags to apply",
        },
      },
      outputs: {
        subscriber_id: {
          type: "string" as const,
          description: "Created/updated subscriber ID",
        },
        is_new: {
          type: "boolean" as const,
          description: "Whether this is a new subscriber",
        },
      },
    },
    tag_subscriber: {
      id: "marketing.tag_subscriber",
      name: "Tag Subscriber",
      description: "Add tags to a subscriber",
      category: "marketing",
      icon: "Tag",
      inputs: {
        subscriber_id: {
          type: "string" as const,
          required: true,
          description: "Subscriber ID",
        },
        tags: {
          type: "string" as const,
          required: true,
          description: "Comma-separated tags to add",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether tags were applied",
        },
      },
    },
    enroll_in_sequence: {
      id: "marketing.enroll_in_sequence",
      name: "Enroll in Sequence",
      description: "Enroll a subscriber in an email sequence",
      category: "marketing",
      icon: "ListOrdered",
      inputs: {
        subscriber_id: {
          type: "string" as const,
          required: true,
          description: "Subscriber ID to enroll",
        },
        sequence_id: {
          type: "string" as const,
          required: true,
          description: "Sequence ID to enroll in",
        },
      },
      outputs: {
        enrollment_id: {
          type: "string" as const,
          description: "Created enrollment ID",
        },
        success: {
          type: "boolean" as const,
          description: "Whether enrollment was successful",
        },
      },
    },
    remove_from_sequence: {
      id: "marketing.remove_from_sequence",
      name: "Remove from Sequence",
      description: "Remove a subscriber from an active sequence",
      category: "marketing",
      icon: "ListX",
      inputs: {
        subscriber_id: {
          type: "string" as const,
          required: true,
          description: "Subscriber ID to remove",
        },
        sequence_id: {
          type: "string" as const,
          required: true,
          description: "Sequence ID to remove from",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether removal was successful",
        },
      },
    },
    add_to_list: {
      id: "marketing.add_to_list",
      name: "Add to List",
      description: "Add a subscriber to a mailing list",
      category: "marketing",
      icon: "ListPlus",
      inputs: {
        subscriber_id: {
          type: "string" as const,
          required: true,
          description: "Subscriber ID",
        },
        list_id: {
          type: "string" as const,
          required: true,
          description: "Mailing list ID",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether subscriber was added to the list",
        },
      },
    },
    remove_from_list: {
      id: "marketing.remove_from_list",
      name: "Remove from List",
      description: "Remove a subscriber from a mailing list",
      category: "marketing",
      icon: "ListMinus",
      inputs: {
        subscriber_id: {
          type: "string" as const,
          required: true,
          description: "Subscriber ID",
        },
        list_id: {
          type: "string" as const,
          required: true,
          description: "Mailing list ID",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether subscriber was removed from the list",
        },
      },
    },
    update_engagement_score: {
      id: "marketing.update_engagement_score",
      name: "Update Engagement Score",
      description: "Recalculate and update a subscriber's engagement score",
      category: "marketing",
      icon: "TrendingUp",
      inputs: {
        subscriber_id: {
          type: "string" as const,
          required: true,
          description: "Subscriber ID",
        },
        score_delta: {
          type: "number" as const,
          required: false,
          description: "Score adjustment (positive or negative)",
        },
      },
      outputs: {
        new_score: {
          type: "number" as const,
          description: "Updated engagement score",
        },
      },
    },
    sms_send: {
      id: "marketing.sms_send",
      name: "Send SMS",
      description: "Send an SMS message to a contact",
      category: "marketing",
      icon: "Smartphone",
      inputs: {
        phone: {
          type: "string" as const,
          required: true,
          description: "Phone number in E.164 format",
        },
        message: {
          type: "string" as const,
          required: true,
          description: "SMS message body (max 1600 chars)",
        },
      },
      outputs: {
        message_id: {
          type: "string" as const,
          description: "Provider message ID",
        },
        success: {
          type: "boolean" as const,
          description: "Whether the SMS was queued",
        },
      },
    },
    whatsapp_send_template: {
      id: "marketing.whatsapp_send_template",
      name: "Send WhatsApp Template",
      description: "Send a WhatsApp template message to a contact",
      category: "marketing",
      icon: "MessageCircle",
      inputs: {
        phone: {
          type: "string" as const,
          required: true,
          description: "Phone number in E.164 format",
        },
        template_name: {
          type: "string" as const,
          required: true,
          description: "Approved WhatsApp template name",
        },
        language_code: {
          type: "string" as const,
          required: false,
          description: "Template language code (default: en_US)",
          default: "en_US",
        },
        parameters: {
          type: "array" as const,
          required: false,
          description: "Template body parameter values",
        },
      },
      outputs: {
        message_id: {
          type: "string" as const,
          description: "WhatsApp message ID",
        },
        success: {
          type: "boolean" as const,
          description: "Whether the message was sent",
        },
      },
    },

    // LP Builder actions (Phase LPB-01)
    create_landing_page: {
      id: "marketing.create_landing_page",
      name: "Create Landing Page",
      description: "Create a new landing page from a template",
      category: "marketing",
      icon: "Rocket",
      inputs: {
        site_id: {
          type: "string" as const,
          required: true,
          description: "Site ID to create the LP under",
        },
        title: {
          type: "string" as const,
          required: true,
          description: "Landing page title",
        },
        slug: {
          type: "string" as const,
          required: true,
          description: "URL slug for the landing page",
        },
        template_id: {
          type: "string" as const,
          required: false,
          description: "Template ID to base the LP on",
        },
      },
      outputs: {
        landing_page_id: {
          type: "string" as const,
          description: "Created landing page ID",
        },
      },
    },
    publish_landing_page: {
      id: "marketing.publish_landing_page",
      name: "Publish Landing Page",
      description: "Publish a landing page (set status to published)",
      category: "marketing",
      icon: "Globe",
      inputs: {
        landing_page_id: {
          type: "string" as const,
          required: true,
          description: "Landing page ID to publish",
        },
      },
      outputs: {
        success: {
          type: "boolean" as const,
          description: "Whether the LP was published",
        },
        url: {
          type: "string" as const,
          description: "Published LP URL",
        },
      },
    },
  },
} as const;

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

export const ACTION_CATEGORIES = [
  {
    id: "crm",
    name: "CRM",
    icon: "User",
    description: "Contact, company, deal, and task actions",
  },
  {
    id: "ecommerce",
    name: "E-Commerce",
    icon: "ShoppingCart",
    description: "Orders, quotes, inventory, and refund actions",
  },
  {
    id: "booking",
    name: "Booking",
    icon: "Calendar",
    description: "Appointments, reminders, and scheduling actions",
  },
  {
    id: "chat",
    name: "Live Chat",
    icon: "MessageSquare",
    description: "Messages, conversations, and agent assignment",
  },
  {
    id: "email",
    name: "Email",
    icon: "Mail",
    description: "Send emails and templates",
  },
  {
    id: "notification",
    name: "Notifications",
    icon: "Bell",
    description: "SMS, Slack, Discord, and in-app notifications",
  },
  {
    id: "webhook",
    name: "Webhooks",
    icon: "Globe",
    description: "Send HTTP requests to external services",
  },
  {
    id: "data",
    name: "Data",
    icon: "ChartBar",
    description: "Database operations (CRUD)",
  },
  {
    id: "flow",
    name: "Flow Control",
    icon: "GitBranch",
    description: "Delays, conditions, loops, and stops",
  },
  {
    id: "transform",
    name: "Transform",
    icon: "RefreshCw",
    description: "Data mapping, filtering, and formatting",
  },
  {
    id: "domain",
    name: "Domains",
    icon: "Globe",
    description: "Domain registration, DNS, email, and transfer actions",
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "Mail",
    description: "Campaigns, subscribers, sequences, SMS, WhatsApp, and lists",
  },
] as const;

// ============================================================================
// FLAT ACTION LIST FOR UI
// ============================================================================

export function getAllActionDefinitions(): ActionDefinition[] {
  const actions: ActionDefinition[] = [];

  for (const [_category, categoryActions] of Object.entries(ACTION_REGISTRY)) {
    for (const action of Object.values(categoryActions)) {
      actions.push(action as ActionDefinition);
    }
  }

  return actions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get actions by category
 */
export function getActionsByCategory(category: string): ActionDefinition[] {
  return getAllActionDefinitions().filter((a) => a.category === category);
}

/**
 * Get action by ID
 */
export function getActionById(actionId: string): ActionDefinition | undefined {
  return getAllActionDefinitions().find((a) => a.id === actionId);
}

/**
 * Check if action type is valid
 */
export function isValidActionType(actionType: string): boolean {
  return getAllActionDefinitions().some((a) => a.id === actionType);
}

/**
 * Parse action type into parts
 */
export function parseActionType(
  actionType: string,
): { category: string; action: string } | null {
  const parts = actionType.split(".");
  if (parts.length !== 2) return null;
  return {
    category: parts[0],
    action: parts[1],
  };
}

/**
 * Get required connections for an action
 */
export function getRequiredConnection(actionType: string): string | undefined {
  const action = getActionById(actionType);
  return action?.requires_connection;
}

/**
 * Validate action inputs against schema
 */
export function validateActionInputs(
  actionType: string,
  inputs: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const action = getActionById(actionType);
  if (!action) {
    return { valid: false, errors: [`Unknown action type: ${actionType}`] };
  }

  const errors: string[] = [];

  for (const [key, field] of Object.entries(action.inputs)) {
    if (
      field.required &&
      (inputs[key] === undefined || inputs[key] === null || inputs[key] === "")
    ) {
      errors.push(`Missing required field: ${key}`);
    }

    if (inputs[key] !== undefined && field.type === "enum" && field.values) {
      if (!field.values.includes(inputs[key] as string)) {
        errors.push(
          `Invalid value for ${key}: must be one of ${field.values.join(", ")}`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
