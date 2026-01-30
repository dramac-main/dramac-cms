/**
 * Puck AI Editor Exports
 * 
 * Barrel file for AI editor components and utilities.
 * Part of PHASE-ED-05A: AI Editor - Puck AI Plugin Integration
 */

// Configuration
export {
  AI_ACTIONS,
  QUICK_ACTIONS,
  DEFAULT_AI_CONFIG,
  SUPPORTED_LANGUAGES,
  executeAIAction,
  buildComponentContext,
  type AIActionType,
  type AIAction,
  type AIPluginConfig,
  type AIExecutionRequest,
  type AIExecutionResult,
  type ComponentContext,
} from "./puck-ai-config";

// Hooks
export {
  usePuckAI,
  usePageAIContext,
  useAISuggestions,
  type UsePuckAIOptions,
  type UsePuckAIReturn,
  type PageAIContext,
  type AISuggestion,
} from "./use-puck-ai";

// Components
export {
  AIAssistantPanel,
  AIToolbarButton,
} from "./ai-assistant-panel";

// Generation Wizard (PHASE-ED-05B)
export { AIGenerationWizard } from "./ai-generation-wizard";

// Optimization Panel (PHASE-ED-05C)
export { AIOptimizationPanel } from "./ai-optimization-panel";
