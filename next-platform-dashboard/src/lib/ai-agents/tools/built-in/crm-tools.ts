/**
 * Built-in Tools - CRM
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 */

import { createClient } from '@/lib/supabase/server'
import type { ToolDefinitionConfig } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentDB = any

// CRM module schema prefix
const CRM_SCHEMA = 'mod_crmmod01'

export const crmTools: ToolDefinitionConfig[] = [
  {
    name: 'crm_get_contact',
    displayName: 'Get Contact',
    description: 'Retrieve a contact by ID or email address',
    category: 'crm',
    
    parametersSchema: {
      type: 'object',
      properties: {
        contact_id: { type: 'string', description: 'Contact UUID' },
        email: { type: 'string', format: 'email', description: 'Contact email' }
      }
    },
    
    requiresModules: ['crm'],
    
    handler: async (input, context) => {
      const supabase = await createClient() as AgentDB
      
      let query = supabase
        .from(`${CRM_SCHEMA}_contacts`)
        .select('*')
        .eq('site_id', context.siteId)
      
      if (input.contact_id) {
        query = query.eq('id', input.contact_id)
      } else if (input.email) {
        query = query.eq('email', input.email)
      } else {
        return { success: false, error: 'Either contact_id or email is required' }
      }
      
      const { data, error } = await query.single()
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      return { success: true, data }
    }
  },
  
  {
    name: 'crm_search_contacts',
    displayName: 'Search Contacts',
    description: 'Search contacts by name, email, company, or tags',
    category: 'crm',
    
    parametersSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        tags: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Filter by tags' 
        },
        status: { 
          type: 'string',
          enum: ['active', 'inactive', 'lead', 'customer'],
          description: 'Filter by status'
        },
        limit: { type: 'integer', default: 10, maximum: 100 }
      },
      required: ['query']
    },
    
    requiresModules: ['crm'],
    
    handler: async (input, context) => {
      const supabase = await createClient() as AgentDB
      const searchQuery = input.query as string
      const limit = (input.limit as number) || 10
      
      let query = supabase
        .from(`${CRM_SCHEMA}_contacts`)
        .select('id, email, first_name, last_name, company, tags, status, created_at')
        .eq('site_id', context.siteId)
        .or(`email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`)
        .limit(limit)
      
      if (input.tags && Array.isArray(input.tags) && input.tags.length > 0) {
        query = query.contains('tags', input.tags)
      }
      
      if (input.status) {
        query = query.eq('status', input.status)
      }
      
      const { data, error } = await query
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      return { 
        success: true, 
        data: {
          contacts: data,
          count: data?.length || 0
        }
      }
    }
  },
  
  {
    name: 'crm_create_contact',
    displayName: 'Create Contact',
    description: 'Create a new contact in the CRM',
    category: 'crm',
    
    parametersSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        company: { type: 'string' },
        phone: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        custom_fields: { type: 'object' }
      },
      required: ['email']
    },
    
    requiresModules: ['crm'],
    
    handler: async (input, context) => {
      const supabase = await createClient() as AgentDB
      
      // Check for duplicate
      const { data: existing } = await supabase
        .from(`${CRM_SCHEMA}_contacts`)
        .select('id')
        .eq('site_id', context.siteId)
        .eq('email', input.email)
        .single()
      
      if (existing) {
        return { 
          success: false, 
          error: 'Contact with this email already exists',
          data: { existingId: existing.id }
        }
      }
      
      const { data, error } = await supabase
        .from(`${CRM_SCHEMA}_contacts`)
        .insert({
          site_id: context.siteId,
          email: input.email,
          first_name: input.first_name,
          last_name: input.last_name,
          company: input.company,
          phone: input.phone,
          tags: input.tags || [],
          custom_fields: input.custom_fields || {},
          source: 'ai_agent',
          source_details: { agentId: context.agentId }
        })
        .select()
        .single()
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      return { success: true, data }
    }
  },
  
  {
    name: 'crm_update_contact',
    displayName: 'Update Contact',
    description: 'Update an existing contact',
    category: 'crm',
    
    parametersSchema: {
      type: 'object',
      properties: {
        contact_id: { type: 'string', description: 'Contact UUID' },
        updates: { 
          type: 'object',
          description: 'Fields to update',
          properties: {
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string' },
            phone: { type: 'string' },
            status: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['contact_id', 'updates']
    },
    
    requiresModules: ['crm'],
    
    handler: async (input, context) => {
      const supabase = await createClient() as AgentDB
      
      const { data, error } = await supabase
        .from(`${CRM_SCHEMA}_contacts`)
        .update({
          ...(input.updates as object),
          updated_at: new Date().toISOString()
        })
        .eq('id', input.contact_id)
        .eq('site_id', context.siteId)
        .select()
        .single()
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      return { success: true, data }
    }
  },
  
  {
    name: 'crm_add_note',
    displayName: 'Add Contact Note',
    description: 'Add a note to a contact',
    category: 'crm',
    
    parametersSchema: {
      type: 'object',
      properties: {
        contact_id: { type: 'string', description: 'Contact UUID' },
        content: { type: 'string', description: 'Note content' },
        type: { 
          type: 'string', 
          enum: ['note', 'call', 'meeting', 'email'],
          default: 'note'
        }
      },
      required: ['contact_id', 'content']
    },
    
    requiresModules: ['crm'],
    
    handler: async (input, context) => {
      const supabase = await createClient() as AgentDB
      
      const { data, error } = await supabase
        .from(`${CRM_SCHEMA}_notes`)
        .insert({
          site_id: context.siteId,
          contact_id: input.contact_id,
          content: input.content,
          type: input.type || 'note',
          created_by_type: 'ai_agent',
          created_by_id: context.agentId
        })
        .select()
        .single()
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      return { success: true, data }
    }
  }
]
