/**
 * Action Executor Service
 * 
 * Phase EM-57A: Automation Engine - Core Infrastructure
 * 
 * Executes individual actions within workflows including:
 * - CRM actions (create contact, deal, task)
 * - Email actions (send, send template)
 * - Notification actions (Slack, Discord, in-app)
 * - Webhook actions (HTTP requests)
 * - Data actions (CRUD operations)
 * - Transform actions (map, filter, aggregate)
 * 
 * NOTE: This is implemented as standalone async functions following the
 * Server Actions pattern used throughout the platform.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send-email'
import type { ExecutionContext, ActionResult } from '../types/automation-types'

// ============================================================================
// SUPABASE CLIENT TYPE HELPER
// ============================================================================

/**
 * Cast Supabase client for automation/module tables
 * These tables are created by migrations and may not be in generated types yet.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AutomationDB = any

// ============================================================================
// CRM MODULE CONSTANTS (per EM-05 naming conventions)
// ============================================================================

const CRM_SHORT_ID = 'crmmod01'
const CRM_TABLE_PREFIX = `mod_${CRM_SHORT_ID}`

// ============================================================================
// MAIN EXECUTION FUNCTION
// ============================================================================

/**
 * Execute an action by type
 */
export async function executeAction(
  actionType: string,
  config: Record<string, unknown>,
  context: ExecutionContext
): Promise<ActionResult> {
  const [category, action] = actionType.split('.')
  
  switch (category) {
    case 'crm':
      return executeCrmAction(action, config, context)
    case 'email':
      return executeEmailAction(action, config, context)
    case 'notification':
      return executeNotificationAction(action, config, context)
    case 'webhook':
      return executeWebhookAction(action, config)
    case 'data':
      return executeDataAction(action, config, context)
    case 'transform':
      return executeTransformAction(action, config)
    case 'flow':
      return executeFlowAction(action, config)
    default:
      return { status: 'failed', error: `Unknown action category: ${category}` }
  }
}

// ============================================================================
// CRM ACTIONS
// ============================================================================

async function executeCrmAction(
  action: string,
  config: Record<string, unknown>,
  context: ExecutionContext
): Promise<ActionResult> {
  const supabase = await createClient() as AutomationDB
  const siteId = context.execution?.siteId
  
  if (!siteId) {
    return { status: 'failed', error: 'Site ID not available in context' }
  }
  
  switch (action) {
    case 'create_contact': {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .insert({
          site_id: siteId,
          email: config.email,
          first_name: config.first_name || null,
          last_name: config.last_name || null,
          phone: config.phone || null,
          company: config.company || null,
          tags: config.tags || [],
          custom_fields: config.custom_fields || {},
          status: 'active',
          lead_status: 'new',
        })
        .select('id, *')
        .single()
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { contact_id: data.id, contact: data } }
    }
    
    case 'update_contact': {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .update(config.fields as Record<string, unknown>)
        .eq('id', config.contact_id)
        .eq('site_id', siteId)
        .select('*')
        .single()
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { contact: data } }
    }
    
    case 'add_tag': {
      // First get current tags
      const { data: contact, error: fetchError } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .select('tags')
        .eq('id', config.contact_id)
        .eq('site_id', siteId)
        .single()
      
      if (fetchError) {
        return { status: 'failed', error: fetchError.message }
      }
      
      // Add tag (avoid duplicates)
      const currentTags = (contact.tags || []) as string[]
      const newTag = config.tag as string
      const updatedTags = currentTags.includes(newTag) 
        ? currentTags 
        : [...currentTags, newTag]
      
      const { error: updateError } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .update({ tags: updatedTags })
        .eq('id', config.contact_id)
        .eq('site_id', siteId)
      
      if (updateError) {
        return { status: 'failed', error: updateError.message }
      }
      return { status: 'completed', output: { success: true, tags: updatedTags } }
    }
    
    case 'remove_tag': {
      const { data: contact, error: fetchError } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .select('tags')
        .eq('id', config.contact_id)
        .eq('site_id', siteId)
        .single()
      
      if (fetchError) {
        return { status: 'failed', error: fetchError.message }
      }
      
      const currentTags = (contact.tags || []) as string[]
      const tagToRemove = config.tag as string
      const updatedTags = currentTags.filter(t => t !== tagToRemove)
      
      const { error: updateError } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .update({ tags: updatedTags })
        .eq('id', config.contact_id)
        .eq('site_id', siteId)
      
      if (updateError) {
        return { status: 'failed', error: updateError.message }
      }
      return { status: 'completed', output: { success: true, tags: updatedTags } }
    }
    
    case 'find_contact': {
      const field = config.field as string
      const value = config.value as string
      
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .select('*')
        .eq('site_id', siteId)
        .eq(field, value)
        .maybeSingle()
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { contact: data, found: !!data } }
    }
    
    case 'create_deal': {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_deals`)
        .insert({
          site_id: siteId,
          title: config.title,
          value: config.value || 0,
          contact_id: config.contact_id || null,
          company_id: config.company_id || null,
          stage_id: config.stage || null,
          pipeline_id: config.pipeline_id || null,
          status: 'open',
        })
        .select('id, *')
        .single()
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { deal_id: data.id, deal: data } }
    }
    
    case 'move_deal_stage': {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_deals`)
        .update({ stage_id: config.stage })
        .eq('id', config.deal_id)
        .eq('site_id', siteId)
        .select('*')
        .single()
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { deal: data } }
    }
    
    case 'create_task': {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_tasks`)
        .insert({
          site_id: siteId,
          title: config.title,
          description: config.description || null,
          due_date: config.due_date || null,
          assigned_to: config.assigned_to || null,
          contact_id: config.contact_id || null,
          deal_id: config.deal_id || null,
          status: 'pending',
        })
        .select('id')
        .single()
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { task_id: data.id } }
    }
    
    case 'log_activity': {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_activities`)
        .insert({
          site_id: siteId,
          contact_id: config.contact_id,
          type: config.type,
          description: config.description,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { activity_id: data.id } }
    }
    
    default:
      return { status: 'failed', error: `Unknown CRM action: ${action}` }
  }
}

// ============================================================================
// EMAIL ACTIONS
// ============================================================================

async function executeEmailAction(
  action: string,
  config: Record<string, unknown>,
  _context: ExecutionContext
): Promise<ActionResult> {
  switch (action) {
    case 'send': {
      try {
        // Automation can send custom emails - cast type for flexibility
        const result = await sendEmail({
          to: { email: config.to as string, name: config.to_name as string || undefined },
          type: 'welcome' as const, // Use a valid type - the data determines actual content
          data: {
            subject: config.subject as string,
            body: config.body as string,
            from_name: config.from_name as string || undefined,
          },
        })
        
        if (!result.success) {
          return { status: 'failed', error: result.error || 'Failed to send email' }
        }
        return { status: 'completed', output: { success: true, message_id: result.messageId } }
      } catch (error) {
        return { 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Failed to send email' 
        }
      }
    }
    
    case 'send_template': {
      try {
        // For template emails, the type determines which template to use
        // Common automation templates might be 'welcome' or similar predefined ones
        const templateType = config.template_id as string
        const validTypes = ['welcome', 'password_reset', 'email_changed', 'team_invitation', 
                           'team_member_joined', 'site_published', 'domain_connected',
                           'subscription_created', 'payment_failed', 'trial_ending']
        
        // Default to 'welcome' if template not recognized
        const emailType = validTypes.includes(templateType) ? templateType : 'welcome'
        
        const result = await sendEmail({
          to: { email: config.to as string },
          type: emailType as Parameters<typeof sendEmail>[0]['type'],
          data: config.variables as Record<string, unknown> || {},
        })
        
        if (!result.success) {
          return { status: 'failed', error: result.error || 'Failed to send template email' }
        }
        return { status: 'completed', output: { success: true, message_id: result.messageId } }
      } catch (error) {
        return { 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Failed to send template email' 
        }
      }
    }
    
    default:
      return { status: 'failed', error: `Unknown email action: ${action}` }
  }
}

// ============================================================================
// NOTIFICATION ACTIONS
// ============================================================================

async function executeNotificationAction(
  action: string,
  config: Record<string, unknown>,
  context: ExecutionContext
): Promise<ActionResult> {
  const supabase = await createClient() as AutomationDB
  const siteId = context.execution?.siteId
  
  switch (action) {
    case 'in_app': {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: config.user_id,
          title: config.title,
          message: config.message,
          type: config.type || 'info',
          link: config.link || null,
          read: false,
        })
        .select('id')
        .single()
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { notification_id: data.id } }
    }
    
    case 'send_slack': {
      // Get Slack connection
      const { data: connection } = await supabase
        .from('automation_connections')
        .select('credentials')
        .eq('site_id', siteId)
        .eq('service_type', 'slack')
        .eq('status', 'active')
        .single()
      
      if (!connection) {
        return { status: 'failed', error: 'Slack connection not found' }
      }
      
      try {
        const webhookUrl = connection.credentials.webhook_url as string
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: config.channel,
            text: config.message,
            blocks: config.blocks,
          }),
        })
        
        if (!response.ok) {
          return { status: 'failed', error: `Slack API error: ${response.status}` }
        }
        return { status: 'completed', output: { success: true } }
      } catch (error) {
        return { 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Failed to send Slack message' 
        }
      }
    }
    
    case 'send_discord': {
      // Get Discord connection
      const { data: connection } = await supabase
        .from('automation_connections')
        .select('credentials')
        .eq('site_id', siteId)
        .eq('service_type', 'discord')
        .eq('status', 'active')
        .single()
      
      if (!connection) {
        return { status: 'failed', error: 'Discord connection not found' }
      }
      
      try {
        const webhookUrl = connection.credentials.webhook_url as string
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: config.content,
            embeds: config.embeds,
          }),
        })
        
        if (!response.ok) {
          return { status: 'failed', error: `Discord API error: ${response.status}` }
        }
        return { status: 'completed', output: { success: true } }
      } catch (error) {
        return { 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Failed to send Discord message' 
        }
      }
    }
    
    case 'send_sms': {
      // Get Twilio connection
      const { data: connection } = await supabase
        .from('automation_connections')
        .select('credentials')
        .eq('site_id', siteId)
        .eq('service_type', 'twilio')
        .eq('status', 'active')
        .single()
      
      if (!connection) {
        return { status: 'failed', error: 'Twilio connection not found' }
      }
      
      try {
        const accountSid = connection.credentials.account_sid as string
        const authToken = connection.credentials.auth_token as string
        const fromNumber = connection.credentials.from_number as string
        
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: config.to as string,
              From: fromNumber,
              Body: config.body as string,
            }),
          }
        )
        
        if (!response.ok) {
          const errorData = await response.json()
          return { status: 'failed', error: `Twilio error: ${errorData.message}` }
        }
        
        const data = await response.json()
        return { status: 'completed', output: { message_sid: data.sid, success: true } }
      } catch (error) {
        return { 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Failed to send SMS' 
        }
      }
    }
    
    default:
      return { status: 'failed', error: `Unknown notification action: ${action}` }
  }
}

// ============================================================================
// WEBHOOK ACTIONS
// ============================================================================

async function executeWebhookAction(
  action: string,
  config: Record<string, unknown>
): Promise<ActionResult> {
  switch (action) {
    case 'send': {
      const url = config.url as string
      const method = (config.method as string) || 'POST'
      const headers = (config.headers as Record<string, string>) || {}
      const body = config.body
      const timeout = (config.timeout_ms as number) || 30000
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        let responseBody: unknown
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          try {
            responseBody = await response.json()
          } catch {
            responseBody = await response.text()
          }
        } else {
          responseBody = await response.text()
        }
        
        return {
          status: response.ok ? 'completed' : 'failed',
          output: {
            status_code: response.status,
            response_body: responseBody,
            success: response.ok,
          },
          error: response.ok ? undefined : `HTTP ${response.status}`,
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return { status: 'failed', error: `Request timed out after ${timeout}ms` }
        }
        return { 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Webhook request failed' 
        }
      }
    }
    
    default:
      return { status: 'failed', error: `Unknown webhook action: ${action}` }
  }
}

// ============================================================================
// DATA ACTIONS
// ============================================================================

async function executeDataAction(
  action: string,
  config: Record<string, unknown>,
  context: ExecutionContext
): Promise<ActionResult> {
  const supabase = await createClient() as AutomationDB
  const siteId = context.execution?.siteId
  
  const moduleName = config.module as string
  const table = config.table as string
  
  // Construct table name based on module
  let fullTableName = table
  if (moduleName) {
    // Standard module table naming
    const modulePrefix = `mod_${moduleName.replace('-', '')}`
    fullTableName = `${modulePrefix}_${table}`
  }
  
  switch (action) {
    case 'lookup': {
      const { data, error } = await supabase
        .from(fullTableName)
        .select('*')
        .eq('site_id', siteId)
        .eq(config.field as string, config.value)
        .maybeSingle()
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { record: data, found: !!data } }
    }
    
    case 'create': {
      const { data, error } = await supabase
        .from(fullTableName)
        .insert({ site_id: siteId, ...(config.data as Record<string, unknown>) })
        .select('*')
        .single()
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { record: data, id: data.id } }
    }
    
    case 'update': {
      const { data, error } = await supabase
        .from(fullTableName)
        .update(config.data as Record<string, unknown>)
        .eq('id', config.id)
        .eq('site_id', siteId)
        .select('*')
        .single()
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { record: data, success: true } }
    }
    
    case 'delete': {
      const { error } = await supabase
        .from(fullTableName)
        .delete()
        .eq('id', config.id)
        .eq('site_id', siteId)
      
      if (error) {
        return { status: 'failed', error: error.message }
      }
      return { status: 'completed', output: { success: true } }
    }
    
    default:
      return { status: 'failed', error: `Unknown data action: ${action}` }
  }
}

// ============================================================================
// TRANSFORM ACTIONS
// ============================================================================

async function executeTransformAction(
  action: string,
  config: Record<string, unknown>
): Promise<ActionResult> {
  switch (action) {
    case 'map': {
      const source = config.source as Record<string, unknown>
      const mapping = config.mapping as Record<string, string>
      const result: Record<string, unknown> = {}
      
      for (const [targetKey, sourcePath] of Object.entries(mapping)) {
        result[targetKey] = getValueByPath(source, sourcePath)
      }
      
      return { status: 'completed', output: { result } }
    }
    
    case 'filter': {
      const array = config.array as unknown[]
      const conditions = config.conditions as Array<{ field: string; operator: string; value: unknown }>
      
      const filtered = array.filter(item => {
        return conditions.every(cond => {
          const value = getValueByPath(item as Record<string, unknown>, cond.field)
          return evaluateCondition(value, cond.operator, cond.value)
        })
      })
      
      return { status: 'completed', output: { result: filtered, count: filtered.length } }
    }
    
    case 'aggregate': {
      const array = config.array as unknown[]
      const operation = config.operation as string
      const field = config.field as string | undefined
      
      const values = field
        ? array.map(item => Number(getValueByPath(item as Record<string, unknown>, field)))
        : array.map(Number)
      
      // Filter out NaN values
      const validValues = values.filter(v => !isNaN(v))
      
      let result: number
      switch (operation) {
        case 'sum':
          result = validValues.reduce((a, b) => a + b, 0)
          break
        case 'average':
          result = validValues.length > 0 
            ? validValues.reduce((a, b) => a + b, 0) / validValues.length 
            : 0
          break
        case 'count':
          result = validValues.length
          break
        case 'min':
          result = validValues.length > 0 ? Math.min(...validValues) : 0
          break
        case 'max':
          result = validValues.length > 0 ? Math.max(...validValues) : 0
          break
        default:
          result = 0
      }
      
      return { status: 'completed', output: { result } }
    }
    
    case 'format_date': {
      const dateStr = config.date as string
      const format = config.format as string
      const timezone = config.timezone as string | undefined
      
      try {
        const date = new Date(dateStr)
        // Simple format implementation (for production, use date-fns)
        const formatted = format
          .replace('YYYY', date.getFullYear().toString())
          .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
          .replace('DD', date.getDate().toString().padStart(2, '0'))
          .replace('HH', date.getHours().toString().padStart(2, '0'))
          .replace('mm', date.getMinutes().toString().padStart(2, '0'))
          .replace('ss', date.getSeconds().toString().padStart(2, '0'))
        
        // Timezone handling would require a proper library
        if (timezone) {
          // Placeholder - actual implementation needs Intl.DateTimeFormat or similar
        }
        
        return { status: 'completed', output: { formatted } }
      } catch {
        return { status: 'failed', error: 'Invalid date format' }
      }
    }
    
    case 'template': {
      const template = config.template as string
      const variables = config.variables as Record<string, unknown> || {}
      
      // Simple template rendering with {{variable}} syntax
      const result = template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const value = getValueByPath(variables, key.trim())
        if (value === undefined) return match
        if (typeof value === 'object') return JSON.stringify(value)
        return String(value)
      })
      
      return { status: 'completed', output: { result } }
    }
    
    case 'math': {
      const operation = config.operation as string
      const a = Number(config.a)
      const b = config.b !== undefined ? Number(config.b) : undefined
      
      let result: number
      switch (operation) {
        case 'add':
          result = a + (b ?? 0)
          break
        case 'subtract':
          result = a - (b ?? 0)
          break
        case 'multiply':
          result = a * (b ?? 1)
          break
        case 'divide':
          result = b && b !== 0 ? a / b : 0
          break
        case 'round':
          result = Math.round(a)
          break
        case 'floor':
          result = Math.floor(a)
          break
        case 'ceil':
          result = Math.ceil(a)
          break
        case 'abs':
          result = Math.abs(a)
          break
        default:
          result = a
      }
      
      return { status: 'completed', output: { result } }
    }
    
    default:
      return { status: 'failed', error: `Unknown transform action: ${action}` }
  }
}

// ============================================================================
// FLOW CONTROL ACTIONS
// ============================================================================

async function executeFlowAction(
  action: string,
  config: Record<string, unknown>
): Promise<ActionResult> {
  switch (action) {
    case 'delay': {
      const duration = parseDuration(config.duration as string)
      const resumeAt = new Date(Date.now() + duration).toISOString()
      
      return {
        status: 'paused',
        output: { resumed_at: resumeAt },
        resumeAt,
      }
    }
    
    case 'stop': {
      return {
        status: 'completed',
        output: { stopped: true, reason: config.reason || 'Workflow stopped' },
      }
    }
    
    default:
      return { status: 'failed', error: `Unknown flow action: ${action}` }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getValueByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  
  return current
}

function evaluateCondition(left: unknown, operator: string, right: unknown): boolean {
  switch (operator) {
    case 'equals':
    case 'eq':
      return left === right
    case 'not_equals':
    case 'ne':
      return left !== right
    case 'contains':
      return typeof left === 'string' && left.includes(String(right))
    case 'greater_than':
    case 'gt':
      return Number(left) > Number(right)
    case 'less_than':
    case 'lt':
      return Number(left) < Number(right)
    case 'gte':
      return Number(left) >= Number(right)
    case 'lte':
      return Number(left) <= Number(right)
    default:
      return false
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhdw])$/)
  if (!match) return 5 * 60 * 1000 // Default 5 minutes
  
  const value = parseInt(match[1], 10)
  const unit = match[2]
  
  switch (unit) {
    case 's': return value * 1000
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    case 'w': return value * 7 * 24 * 60 * 60 * 1000
    default: return 5 * 60 * 1000
  }
}
