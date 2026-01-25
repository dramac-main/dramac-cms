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
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'enum' | 'any'
  required?: boolean
  default?: unknown
  description?: string
  values?: string[]  // For enum type
  placeholder?: string
}

export interface ActionOutputField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any'
  description?: string
}

export interface ActionDefinition {
  id: string
  name: string
  description: string
  category: string
  icon: string
  requires_connection?: string
  inputs: Record<string, ActionInputField>
  outputs: Record<string, ActionOutputField>
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
      id: 'crm.create_contact',
      name: 'Create Contact',
      description: 'Create a new contact in CRM',
      category: 'crm',
      icon: '👤',
      inputs: {
        email: { type: 'string' as const, required: true, description: 'Contact email address' },
        first_name: { type: 'string' as const, required: false, description: 'First name' },
        last_name: { type: 'string' as const, required: false, description: 'Last name' },
        phone: { type: 'string' as const, required: false, description: 'Phone number' },
        company: { type: 'string' as const, required: false, description: 'Company name' },
        tags: { type: 'array' as const, required: false, description: 'Tags to assign' },
        custom_fields: { type: 'object' as const, required: false, description: 'Custom field values' },
      },
      outputs: {
        contact_id: { type: 'string' as const, description: 'Created contact ID' },
        contact: { type: 'object' as const, description: 'Full contact object' },
      },
    },
    update_contact: {
      id: 'crm.update_contact',
      name: 'Update Contact',
      description: 'Update an existing contact',
      category: 'crm',
      icon: '✏️',
      inputs: {
        contact_id: { type: 'string' as const, required: true, description: 'Contact ID to update' },
        fields: { type: 'object' as const, required: true, description: 'Fields to update' },
      },
      outputs: {
        contact: { type: 'object' as const, description: 'Updated contact object' },
      },
    },
    add_tag: {
      id: 'crm.add_tag',
      name: 'Add Tag to Contact',
      description: 'Add a tag to a contact',
      category: 'crm',
      icon: '🏷️',
      inputs: {
        contact_id: { type: 'string' as const, required: true, description: 'Contact ID' },
        tag: { type: 'string' as const, required: true, description: 'Tag to add' },
      },
      outputs: {
        success: { type: 'boolean' as const, description: 'Whether the operation succeeded' },
      },
    },
    remove_tag: {
      id: 'crm.remove_tag',
      name: 'Remove Tag from Contact',
      description: 'Remove a tag from a contact',
      category: 'crm',
      icon: '🏷️',
      inputs: {
        contact_id: { type: 'string' as const, required: true, description: 'Contact ID' },
        tag: { type: 'string' as const, required: true, description: 'Tag to remove' },
      },
      outputs: {
        success: { type: 'boolean' as const, description: 'Whether the operation succeeded' },
      },
    },
    create_deal: {
      id: 'crm.create_deal',
      name: 'Create Deal',
      description: 'Create a new deal/opportunity',
      category: 'crm',
      icon: '💰',
      inputs: {
        title: { type: 'string' as const, required: true, description: 'Deal title' },
        value: { type: 'number' as const, required: false, description: 'Deal value' },
        contact_id: { type: 'string' as const, required: false, description: 'Associated contact' },
        company_id: { type: 'string' as const, required: false, description: 'Associated company' },
        stage: { type: 'string' as const, required: false, description: 'Pipeline stage' },
        pipeline_id: { type: 'string' as const, required: false, description: 'Pipeline ID' },
      },
      outputs: {
        deal_id: { type: 'string' as const, description: 'Created deal ID' },
        deal: { type: 'object' as const, description: 'Full deal object' },
      },
    },
    move_deal_stage: {
      id: 'crm.move_deal_stage',
      name: 'Move Deal Stage',
      description: 'Move a deal to a different pipeline stage',
      category: 'crm',
      icon: '➡️',
      inputs: {
        deal_id: { type: 'string' as const, required: true, description: 'Deal ID' },
        stage: { type: 'string' as const, required: true, description: 'Target stage' },
      },
      outputs: {
        deal: { type: 'object' as const, description: 'Updated deal object' },
      },
    },
    create_task: {
      id: 'crm.create_task',
      name: 'Create Task',
      description: 'Create a follow-up task',
      category: 'crm',
      icon: '✅',
      inputs: {
        title: { type: 'string' as const, required: true, description: 'Task title' },
        description: { type: 'string' as const, required: false, description: 'Task description' },
        due_date: { type: 'date' as const, required: false, description: 'Due date' },
        assigned_to: { type: 'string' as const, required: false, description: 'Assignee user ID' },
        contact_id: { type: 'string' as const, required: false, description: 'Related contact' },
        deal_id: { type: 'string' as const, required: false, description: 'Related deal' },
      },
      outputs: {
        task_id: { type: 'string' as const, description: 'Created task ID' },
      },
    },
    log_activity: {
      id: 'crm.log_activity',
      name: 'Log Activity',
      description: 'Log an activity (call, meeting, note)',
      category: 'crm',
      icon: '📝',
      inputs: {
        contact_id: { type: 'string' as const, required: true, description: 'Contact ID' },
        type: { type: 'enum' as const, values: ['call', 'meeting', 'note', 'email'], required: true, description: 'Activity type' },
        description: { type: 'string' as const, required: true, description: 'Activity description' },
      },
      outputs: {
        activity_id: { type: 'string' as const, description: 'Created activity ID' },
      },
    },
    find_contact: {
      id: 'crm.find_contact',
      name: 'Find Contact',
      description: 'Find a contact by email or other field',
      category: 'crm',
      icon: '🔍',
      inputs: {
        field: { type: 'enum' as const, values: ['email', 'phone', 'id'], required: true, description: 'Field to search' },
        value: { type: 'string' as const, required: true, description: 'Value to search for' },
      },
      outputs: {
        contact: { type: 'object' as const, description: 'Found contact or null' },
        found: { type: 'boolean' as const, description: 'Whether contact was found' },
      },
    },
  },
  
  // =========================================================
  // EMAIL ACTIONS
  // =========================================================
  email: {
    send: {
      id: 'email.send',
      name: 'Send Email',
      description: 'Send an email using platform email service (Resend)',
      category: 'email',
      icon: '📧',
      inputs: {
        to: { type: 'string' as const, required: true, description: 'Recipient email' },
        subject: { type: 'string' as const, required: true, description: 'Email subject' },
        body: { type: 'string' as const, required: true, description: 'Email body (HTML supported)' },
        from_name: { type: 'string' as const, required: false, description: 'Sender name' },
        reply_to: { type: 'string' as const, required: false, description: 'Reply-to email' },
        cc: { type: 'array' as const, required: false, description: 'CC recipients' },
        bcc: { type: 'array' as const, required: false, description: 'BCC recipients' },
      },
      outputs: {
        message_id: { type: 'string' as const, description: 'Sent message ID' },
        success: { type: 'boolean' as const, description: 'Whether email was sent' },
      },
    },
    send_template: {
      id: 'email.send_template',
      name: 'Send Template Email',
      description: 'Send email using a predefined template',
      category: 'email',
      icon: '📨',
      inputs: {
        to: { type: 'string' as const, required: true, description: 'Recipient email' },
        template_id: { type: 'string' as const, required: true, description: 'Template ID' },
        variables: { type: 'object' as const, required: false, description: 'Template variables' },
      },
      outputs: {
        message_id: { type: 'string' as const, description: 'Sent message ID' },
        success: { type: 'boolean' as const, description: 'Whether email was sent' },
      },
    },
  },
  
  // =========================================================
  // NOTIFICATION ACTIONS
  // =========================================================
  notification: {
    send_sms: {
      id: 'notification.send_sms',
      name: 'Send SMS',
      description: 'Send SMS via Twilio',
      category: 'notification',
      icon: '📱',
      requires_connection: 'twilio',
      inputs: {
        to: { type: 'string' as const, required: true, description: 'Phone number' },
        body: { type: 'string' as const, required: true, description: 'Message body' },
      },
      outputs: {
        message_sid: { type: 'string' as const, description: 'Twilio message SID' },
        success: { type: 'boolean' as const, description: 'Whether SMS was sent' },
      },
    },
    send_slack: {
      id: 'notification.send_slack',
      name: 'Send Slack Message',
      description: 'Send message to Slack channel',
      category: 'notification',
      icon: '💬',
      requires_connection: 'slack',
      inputs: {
        channel: { type: 'string' as const, required: true, description: 'Channel ID or name' },
        message: { type: 'string' as const, required: true, description: 'Message text' },
        blocks: { type: 'array' as const, required: false, description: 'Slack Block Kit blocks' },
      },
      outputs: {
        ts: { type: 'string' as const, description: 'Message timestamp' },
        success: { type: 'boolean' as const, description: 'Whether message was sent' },
      },
    },
    send_discord: {
      id: 'notification.send_discord',
      name: 'Send Discord Message',
      description: 'Send message to Discord webhook',
      category: 'notification',
      icon: '🎮',
      requires_connection: 'discord',
      inputs: {
        content: { type: 'string' as const, required: true, description: 'Message content' },
        embeds: { type: 'array' as const, required: false, description: 'Discord embeds' },
      },
      outputs: {
        success: { type: 'boolean' as const, description: 'Whether message was sent' },
      },
    },
    in_app: {
      id: 'notification.in_app',
      name: 'Create In-App Notification',
      description: 'Create notification in platform',
      category: 'notification',
      icon: '🔔',
      inputs: {
        user_id: { type: 'string' as const, required: true, description: 'User ID to notify' },
        title: { type: 'string' as const, required: true, description: 'Notification title' },
        message: { type: 'string' as const, required: true, description: 'Notification message' },
        type: { type: 'enum' as const, values: ['info', 'success', 'warning', 'error'], required: false, description: 'Notification type' },
        link: { type: 'string' as const, required: false, description: 'Link URL' },
      },
      outputs: {
        notification_id: { type: 'string' as const, description: 'Created notification ID' },
      },
    },
  },
  
  // =========================================================
  // WEBHOOK ACTIONS
  // =========================================================
  webhook: {
    send: {
      id: 'webhook.send',
      name: 'Send Webhook',
      description: 'Send HTTP request to external URL',
      category: 'webhook',
      icon: '🌐',
      inputs: {
        url: { type: 'string' as const, required: true, description: 'Target URL' },
        method: { type: 'enum' as const, values: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], required: true, description: 'HTTP method' },
        headers: { type: 'object' as const, required: false, description: 'Request headers' },
        body: { type: 'object' as const, required: false, description: 'Request body' },
        timeout_ms: { type: 'number' as const, required: false, default: 30000, description: 'Timeout in milliseconds' },
      },
      outputs: {
        status_code: { type: 'number' as const, description: 'Response status code' },
        response_body: { type: 'object' as const, description: 'Response body' },
        success: { type: 'boolean' as const, description: 'Whether request succeeded (2xx status)' },
      },
    },
  },
  
  // =========================================================
  // DATA ACTIONS
  // =========================================================
  data: {
    lookup: {
      id: 'data.lookup',
      name: 'Lookup Record',
      description: 'Find a record by field value',
      category: 'data',
      icon: '🔍',
      inputs: {
        module: { type: 'string' as const, required: true, description: 'Module ID (e.g., crm, booking)' },
        table: { type: 'string' as const, required: true, description: 'Table name' },
        field: { type: 'string' as const, required: true, description: 'Field to search' },
        value: { type: 'any' as const, required: true, description: 'Value to find' },
      },
      outputs: {
        record: { type: 'object' as const, description: 'Found record or null' },
        found: { type: 'boolean' as const, description: 'Whether record was found' },
      },
    },
    create: {
      id: 'data.create',
      name: 'Create Record',
      description: 'Create a new database record',
      category: 'data',
      icon: '➕',
      inputs: {
        module: { type: 'string' as const, required: true, description: 'Module ID' },
        table: { type: 'string' as const, required: true, description: 'Table name' },
        data: { type: 'object' as const, required: true, description: 'Record data' },
      },
      outputs: {
        record: { type: 'object' as const, description: 'Created record' },
        id: { type: 'string' as const, description: 'Record ID' },
      },
    },
    update: {
      id: 'data.update',
      name: 'Update Record',
      description: 'Update an existing record',
      category: 'data',
      icon: '✏️',
      inputs: {
        module: { type: 'string' as const, required: true, description: 'Module ID' },
        table: { type: 'string' as const, required: true, description: 'Table name' },
        id: { type: 'string' as const, required: true, description: 'Record ID' },
        data: { type: 'object' as const, required: true, description: 'Fields to update' },
      },
      outputs: {
        record: { type: 'object' as const, description: 'Updated record' },
        success: { type: 'boolean' as const, description: 'Whether update succeeded' },
      },
    },
    delete: {
      id: 'data.delete',
      name: 'Delete Record',
      description: 'Delete a database record',
      category: 'data',
      icon: '🗑️',
      inputs: {
        module: { type: 'string' as const, required: true, description: 'Module ID' },
        table: { type: 'string' as const, required: true, description: 'Table name' },
        id: { type: 'string' as const, required: true, description: 'Record ID' },
      },
      outputs: {
        success: { type: 'boolean' as const, description: 'Whether delete succeeded' },
      },
    },
  },
  
  // =========================================================
  // FLOW CONTROL
  // =========================================================
  flow: {
    delay: {
      id: 'flow.delay',
      name: 'Delay',
      description: 'Wait for specified duration',
      category: 'flow',
      icon: '⏱️',
      inputs: {
        duration: { type: 'string' as const, required: true, description: 'Duration (e.g., 5m, 1h, 1d)' },
      },
      outputs: {
        resumed_at: { type: 'string' as const, description: 'When the workflow resumed' },
      },
    },
    condition: {
      id: 'flow.condition',
      name: 'Condition',
      description: 'Branch based on condition',
      category: 'flow',
      icon: '🔀',
      inputs: {
        conditions: { type: 'array' as const, required: true, description: 'Conditions to evaluate' },
      },
      outputs: {
        result: { type: 'boolean' as const, description: 'Condition result' },
        matched_branch: { type: 'string' as const, description: 'Which branch matched' },
      },
    },
    loop: {
      id: 'flow.loop',
      name: 'Loop',
      description: 'Iterate over array',
      category: 'flow',
      icon: '🔁',
      inputs: {
        items: { type: 'array' as const, required: true, description: 'Items to loop over' },
        max_iterations: { type: 'number' as const, required: false, default: 100, description: 'Max iterations' },
      },
      outputs: {
        current_item: { type: 'any' as const, description: 'Current iteration item' },
        index: { type: 'number' as const, description: 'Current index' },
        is_last: { type: 'boolean' as const, description: 'Whether this is the last item' },
      },
    },
    stop: {
      id: 'flow.stop',
      name: 'Stop Workflow',
      description: 'Stop workflow execution',
      category: 'flow',
      icon: '🛑',
      inputs: {
        reason: { type: 'string' as const, required: false, description: 'Reason for stopping' },
      },
      outputs: {},
    },
  },
  
  // =========================================================
  // TRANSFORM ACTIONS
  // =========================================================
  transform: {
    map: {
      id: 'transform.map',
      name: 'Map Data',
      description: 'Transform data structure',
      category: 'transform',
      icon: '🔄',
      inputs: {
        source: { type: 'object' as const, required: true, description: 'Source data' },
        mapping: { type: 'object' as const, required: true, description: 'Field mapping' },
      },
      outputs: {
        result: { type: 'object' as const, description: 'Transformed data' },
      },
    },
    filter: {
      id: 'transform.filter',
      name: 'Filter Array',
      description: 'Filter items from array',
      category: 'transform',
      icon: '🔍',
      inputs: {
        array: { type: 'array' as const, required: true, description: 'Array to filter' },
        conditions: { type: 'array' as const, required: true, description: 'Filter conditions' },
      },
      outputs: {
        result: { type: 'array' as const, description: 'Filtered array' },
        count: { type: 'number' as const, description: 'Number of matching items' },
      },
    },
    aggregate: {
      id: 'transform.aggregate',
      name: 'Aggregate',
      description: 'Calculate sum, average, count, etc.',
      category: 'transform',
      icon: '📊',
      inputs: {
        array: { type: 'array' as const, required: true, description: 'Array to aggregate' },
        operation: { type: 'enum' as const, values: ['sum', 'average', 'count', 'min', 'max'], required: true, description: 'Aggregation operation' },
        field: { type: 'string' as const, required: false, description: 'Field to aggregate (for objects)' },
      },
      outputs: {
        result: { type: 'number' as const, description: 'Aggregation result' },
      },
    },
    format_date: {
      id: 'transform.format_date',
      name: 'Format Date',
      description: 'Format a date string',
      category: 'transform',
      icon: '📅',
      inputs: {
        date: { type: 'string' as const, required: true, description: 'Date to format' },
        format: { type: 'string' as const, required: true, description: 'Output format (e.g., YYYY-MM-DD)' },
        timezone: { type: 'string' as const, required: false, description: 'Timezone' },
      },
      outputs: {
        formatted: { type: 'string' as const, description: 'Formatted date string' },
      },
    },
    template: {
      id: 'transform.template',
      name: 'Render Template',
      description: 'Render text template with variables',
      category: 'transform',
      icon: '📝',
      inputs: {
        template: { type: 'string' as const, required: true, description: 'Template string with {{variables}}' },
        variables: { type: 'object' as const, required: false, description: 'Variable values' },
      },
      outputs: {
        result: { type: 'string' as const, description: 'Rendered template' },
      },
    },
    math: {
      id: 'transform.math',
      name: 'Math Operation',
      description: 'Perform mathematical calculation',
      category: 'transform',
      icon: '🔢',
      inputs: {
        operation: { type: 'enum' as const, values: ['add', 'subtract', 'multiply', 'divide', 'round', 'floor', 'ceil', 'abs'], required: true, description: 'Math operation' },
        a: { type: 'number' as const, required: true, description: 'First operand' },
        b: { type: 'number' as const, required: false, description: 'Second operand (for binary ops)' },
      },
      outputs: {
        result: { type: 'number' as const, description: 'Calculation result' },
      },
    },
  },
} as const

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

export const ACTION_CATEGORIES = [
  { id: 'crm', name: 'CRM', icon: '👤', description: 'Contact, company, deal, and task actions' },
  { id: 'email', name: 'Email', icon: '📧', description: 'Send emails and templates' },
  { id: 'notification', name: 'Notifications', icon: '🔔', description: 'SMS, Slack, Discord, and in-app notifications' },
  { id: 'webhook', name: 'Webhooks', icon: '🌐', description: 'Send HTTP requests to external services' },
  { id: 'data', name: 'Data', icon: '📊', description: 'Database operations (CRUD)' },
  { id: 'flow', name: 'Flow Control', icon: '🔀', description: 'Delays, conditions, loops, and stops' },
  { id: 'transform', name: 'Transform', icon: '🔄', description: 'Data mapping, filtering, and formatting' },
] as const

// ============================================================================
// FLAT ACTION LIST FOR UI
// ============================================================================

export function getAllActionDefinitions(): ActionDefinition[] {
  const actions: ActionDefinition[] = []
  
  for (const [_category, categoryActions] of Object.entries(ACTION_REGISTRY)) {
    for (const action of Object.values(categoryActions)) {
      actions.push(action as ActionDefinition)
    }
  }
  
  return actions
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get actions by category
 */
export function getActionsByCategory(category: string): ActionDefinition[] {
  return getAllActionDefinitions().filter(a => a.category === category)
}

/**
 * Get action by ID
 */
export function getActionById(actionId: string): ActionDefinition | undefined {
  return getAllActionDefinitions().find(a => a.id === actionId)
}

/**
 * Check if action type is valid
 */
export function isValidActionType(actionType: string): boolean {
  return getAllActionDefinitions().some(a => a.id === actionType)
}

/**
 * Parse action type into parts
 */
export function parseActionType(actionType: string): { category: string; action: string } | null {
  const parts = actionType.split('.')
  if (parts.length !== 2) return null
  return {
    category: parts[0],
    action: parts[1],
  }
}

/**
 * Get required connections for an action
 */
export function getRequiredConnection(actionType: string): string | undefined {
  const action = getActionById(actionType)
  return action?.requires_connection
}

/**
 * Validate action inputs against schema
 */
export function validateActionInputs(actionType: string, inputs: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const action = getActionById(actionType)
  if (!action) {
    return { valid: false, errors: [`Unknown action type: ${actionType}`] }
  }
  
  const errors: string[] = []
  
  for (const [key, field] of Object.entries(action.inputs)) {
    if (field.required && (inputs[key] === undefined || inputs[key] === null || inputs[key] === '')) {
      errors.push(`Missing required field: ${key}`)
    }
    
    if (inputs[key] !== undefined && field.type === 'enum' && field.values) {
      if (!field.values.includes(inputs[key] as string)) {
        errors.push(`Invalid value for ${key}: must be one of ${field.values.join(', ')}`)
      }
    }
  }
  
  return { valid: errors.length === 0, errors }
}
