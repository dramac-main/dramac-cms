/**
 * Built-in Tools - System
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 */

import { createClient } from '@/lib/supabase/server'
import type { ToolDefinitionConfig } from '../types'

import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/locale-config'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentDB = any

export const systemTools: ToolDefinitionConfig[] = [
  {
    name: 'wait',
    displayName: 'Wait',
    description: 'Pause execution for a specified duration',
    category: 'system',
    
    parametersSchema: {
      type: 'object',
      properties: {
        seconds: { 
          type: 'integer', 
          minimum: 1, 
          maximum: 3600,
          description: 'Number of seconds to wait (max 1 hour)'
        }
      },
      required: ['seconds']
    },
    
    handler: async (input) => {
      const seconds = input.seconds as number
      await new Promise(resolve => setTimeout(resolve, seconds * 1000))
      return { 
        success: true, 
        data: { waited: seconds }
      }
    }
  },
  
  {
    name: 'notify_user',
    displayName: 'Notify User',
    description: 'Send a notification to a user',
    category: 'system',
    
    parametersSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'User UUID (optional, defaults to site owner)' },
        message: { type: 'string', description: 'Notification message' },
        channel: { 
          type: 'string', 
          enum: ['in_app', 'email', 'sms'],
          default: 'in_app'
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high'],
          default: 'normal'
        }
      },
      required: ['message']
    },
    
    handler: async (input, context) => {
      const supabase = await createClient() as AgentDB
      const channel = (input.channel as string) || 'in_app'
      
      // For now, just log the notification
      // In production, integrate with notification service
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          site_id: context.siteId,
          user_id: input.user_id || null,
          title: 'AI Agent Notification',
          message: input.message,
          type: 'ai_agent',
          channel,
          priority: input.priority || 'normal',
          metadata: {
            agent_id: context.agentId,
            execution_id: context.executionId
          }
        })
        .select()
        .single()
      
      if (error) {
        // Table might not exist, log instead
        console.log(`[AI Agent] Notification: ${input.message}`)
        return { 
          success: true, 
          data: { logged: true, message: input.message }
        }
      }
      
      return { success: true, data }
    }
  },
  
  {
    name: 'trigger_workflow',
    displayName: 'Trigger Workflow',
    description: 'Start an automation workflow',
    category: 'system',
    
    parametersSchema: {
      type: 'object',
      properties: {
        workflow_id: { type: 'string', description: 'Workflow UUID' },
        input_data: { type: 'object', description: 'Data to pass to workflow' }
      },
      required: ['workflow_id']
    },
    
    handler: async (input, context) => {
      const supabase = await createClient() as AgentDB
      
      // Queue workflow execution
      const { data, error } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: input.workflow_id,
          site_id: context.siteId,
          status: 'pending',
          trigger_type: 'ai_agent',
          trigger_data: {
            agent_id: context.agentId,
            execution_id: context.executionId,
            input: input.input_data || {}
          },
          context: { 
            trigger: input.input_data || {},
            steps: {},
            variables: {}
          }
        })
        .select('id')
        .single()
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      return { 
        success: true, 
        data: { 
          executionId: data.id,
          workflowId: input.workflow_id,
          status: 'pending'
        }
      }
    }
  },
  
  {
    name: 'get_current_time',
    displayName: 'Get Current Time',
    description: 'Get the current date and time',
    category: 'system',
    
    parametersSchema: {
      type: 'object',
      properties: {
        timezone: { 
          type: 'string', 
          description: 'Timezone (e.g., "Africa/Lusaka")',
          default: 'Africa/Lusaka'
        }
      }
    },
    
    handler: async (input) => {
      const timezone = (input.timezone as string) || DEFAULT_TIMEZONE
      const now = new Date()
      
      try {
        const formatted = now.toLocaleString(DEFAULT_LOCALE, { 
          timeZone: timezone,
          dateStyle: 'full',
          timeStyle: 'long'
        })
        
        return { 
          success: true, 
          data: {
            iso: now.toISOString(),
            formatted,
            timezone,
            timestamp: now.getTime()
          }
        }
      } catch {
        return { 
          success: true, 
          data: {
            iso: now.toISOString(),
            formatted: now.toString(),
            timezone: DEFAULT_TIMEZONE,
            timestamp: now.getTime()
          }
        }
      }
    }
  }
]
