/**
 * Built-in Tools - Index
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 */

import type { ToolDefinitionConfig } from '../types'
import { crmTools } from './crm-tools'
import { systemTools } from './system-tools'
import { dataTools } from './data-tools'

/**
 * All built-in tools
 */
export const builtInTools: ToolDefinitionConfig[] = [
  ...crmTools,
  ...systemTools,
  ...dataTools
]

export { crmTools, systemTools, dataTools }
