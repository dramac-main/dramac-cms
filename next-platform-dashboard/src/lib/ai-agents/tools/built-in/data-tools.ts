/**
 * Built-in Tools - Data
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 */

import { createClient } from '@/lib/supabase/server'
import type { ToolDefinitionConfig } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentDB = any

// Entity to table mapping
const ENTITY_TABLES: Record<string, string> = {
  contacts: 'mod_crmmod01_contacts',
  companies: 'mod_crmmod01_companies',
  deals: 'mod_crmmod01_deals',
  appointments: 'mod_bookmod01_appointments',
  products: 'mod_ecommod01_products',
  orders: 'mod_ecommod01_orders',
  pages: 'pages',
  sites: 'sites',
  users: 'users'
}

export const dataTools: ToolDefinitionConfig[] = [
  {
    name: 'data_query',
    displayName: 'Query Data',
    description: 'Run a structured query against platform data',
    category: 'data',
    
    parametersSchema: {
      type: 'object',
      properties: {
        entity_type: { 
          type: 'string',
          description: 'Type of entity to query (contacts, deals, appointments, etc.)'
        },
        filters: { 
          type: 'object',
          description: 'Filters to apply (field: value pairs)'
        },
        select: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fields to return'
        },
        limit: { 
          type: 'integer', 
          default: 100,
          maximum: 1000
        },
        order_by: { 
          type: 'string',
          description: 'Field to order by'
        },
        order_direction: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc'
        }
      },
      required: ['entity_type']
    },
    
    handler: async (input, context) => {
      const supabase = await createClient() as AgentDB
      const entityType = input.entity_type as string
      const tableName = ENTITY_TABLES[entityType]
      
      if (!tableName) {
        return { 
          success: false, 
          error: `Unknown entity type: ${entityType}. Valid types: ${Object.keys(ENTITY_TABLES).join(', ')}`
        }
      }
      
      const selectFields = input.select 
        ? (input.select as string[]).join(', ')
        : '*'
      
      let query = supabase
        .from(tableName)
        .select(selectFields)
        .eq('site_id', context.siteId)
        .limit((input.limit as number) || 100)
      
      // Apply filters
      if (input.filters && typeof input.filters === 'object') {
        for (const [key, value] of Object.entries(input.filters as Record<string, unknown>)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        }
      }
      
      // Apply ordering
      if (input.order_by) {
        query = query.order(input.order_by as string, {
          ascending: input.order_direction === 'asc'
        })
      }
      
      const { data, error, count } = await query
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      return { 
        success: true, 
        data: {
          records: data,
          count: data?.length || 0,
          totalCount: count
        }
      }
    }
  },
  
  {
    name: 'data_aggregate',
    displayName: 'Aggregate Data',
    description: 'Get aggregated statistics (count, sum, avg, etc.)',
    category: 'data',
    
    parametersSchema: {
      type: 'object',
      properties: {
        entity_type: { 
          type: 'string',
          description: 'Type of entity to aggregate'
        },
        metric: { 
          type: 'string',
          enum: ['count', 'sum', 'avg', 'min', 'max'],
          description: 'Aggregation type'
        },
        field: {
          type: 'string',
          description: 'Field to aggregate (for sum/avg/min/max)'
        },
        group_by: { 
          type: 'string',
          description: 'Field to group by'
        },
        filters: {
          type: 'object',
          description: 'Filters to apply'
        },
        date_range: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' }
          }
        }
      },
      required: ['entity_type', 'metric']
    },
    
    handler: async (input, context) => {
      const supabase = await createClient() as AgentDB
      const entityType = input.entity_type as string
      const tableName = ENTITY_TABLES[entityType]
      const metric = input.metric as string
      
      if (!tableName) {
        return { 
          success: false, 
          error: `Unknown entity type: ${entityType}`
        }
      }
      
      // For simple count
      if (metric === 'count') {
        let query = supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('site_id', context.siteId)
        
        // Apply filters
        if (input.filters && typeof input.filters === 'object') {
          for (const [key, value] of Object.entries(input.filters as Record<string, unknown>)) {
            if (value !== undefined) {
              query = query.eq(key, value)
            }
          }
        }
        
        // Apply date range
        if (input.date_range) {
          const range = input.date_range as { start?: string; end?: string }
          if (range.start) {
            query = query.gte('created_at', range.start)
          }
          if (range.end) {
            query = query.lte('created_at', range.end)
          }
        }
        
        const { count, error } = await query
        
        if (error) {
          return { success: false, error: error.message }
        }
        
        return { 
          success: true, 
          data: { count }
        }
      }
      
      // For other metrics, fetch data and calculate
      const field = input.field as string
      if (!field && ['sum', 'avg', 'min', 'max'].includes(metric)) {
        return { 
          success: false, 
          error: `Field is required for ${metric} aggregation`
        }
      }
      
      const query = supabase
        .from(tableName)
        .select(field || '*')
        .eq('site_id', context.siteId)
      
      const { data, error } = await query
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      if (!data?.length) {
        return { success: true, data: { result: null, count: 0 } }
      }
      
      const values = data
        .map((row: Record<string, unknown>) => Number(row[field]))
        .filter((v: number) => !isNaN(v))
      
      let result: number | null = null
      switch (metric) {
        case 'sum':
          result = values.reduce((a: number, b: number) => a + b, 0)
          break
        case 'avg':
          result = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : null
          break
        case 'min':
          result = values.length > 0 ? Math.min(...values) : null
          break
        case 'max':
          result = values.length > 0 ? Math.max(...values) : null
          break
      }
      
      return { 
        success: true, 
        data: {
          metric,
          field,
          result,
          count: values.length
        }
      }
    }
  }
]
