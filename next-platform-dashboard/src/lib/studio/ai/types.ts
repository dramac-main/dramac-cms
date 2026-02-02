/**
 * AI Types for DRAMAC Studio
 * 
 * Type definitions for AI-powered component editing.
 * Phase STUDIO-11: AI Component Chat
 */

import type { ComponentDefinition, FieldDefinition } from "@/types/studio";

/**
 * Context provided to AI for component editing
 */
export interface AIComponentContext {
  /** Component type name */
  componentType: string;
  
  /** Current component props */
  currentProps: Record<string, unknown>;
  
  /** Component label for display */
  componentLabel: string;
  
  /** Component description */
  componentDescription?: string;
  
  /** Field definitions with types */
  fields: Record<string, FieldDefinition>;
  
  /** AI-specific context from component definition */
  aiContext?: ComponentDefinition["ai"];
  
  /** Page context for broader awareness */
  pageContext?: {
    title?: string;
    description?: string;
    otherComponentTypes?: string[];
  };
}

/**
 * AI response for component prop changes
 */
export interface AIComponentResponse {
  /** Proposed prop changes (only changed props) */
  changes: Record<string, unknown>;
  
  /** Explanation of what was changed and why */
  explanation: string;
}

/**
 * Request body for component AI API
 */
export interface AIComponentRequest {
  /** Component context */
  context: AIComponentContext;
  
  /** User's request message */
  userMessage: string;
  
  /** Previous conversation for context */
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

/**
 * Field type formatting info for AI
 */
export interface FieldTypeInfo {
  type: string;
  description: string;
  example: string;
}

/**
 * AI API error response
 */
export interface AIErrorResponse {
  error: string;
  details?: string;
  rawResponse?: string;
}
