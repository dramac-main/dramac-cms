/**
 * Puck AI Hook
 * 
 * Custom hook for AI operations in the Puck editor.
 * Part of PHASE-ED-05A: AI Editor - Puck AI Plugin Integration
 */

"use client";

import { useState, useCallback } from "react";
import {
  AIActionType,
  AIExecutionResult,
  AI_ACTIONS,
  DEFAULT_AI_CONFIG,
  SUPPORTED_LANGUAGES,
} from "./puck-ai-config";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

export interface UsePuckAIOptions {
  onSuccess?: (result: AIExecutionResult) => void;
  onError?: (error: string) => void;
  showToasts?: boolean;
}

export interface UsePuckAIReturn {
  isLoading: boolean;
  lastResult: AIExecutionResult | null;
  executeAction: (
    action: AIActionType,
    content: string,
    context?: string,
    params?: Record<string, string>
  ) => Promise<AIExecutionResult>;
  improveText: (content: string, context?: string) => Promise<AIExecutionResult>;
  simplifyText: (content: string, context?: string) => Promise<AIExecutionResult>;
  expandText: (content: string, context?: string) => Promise<AIExecutionResult>;
  shortenText: (content: string, context?: string) => Promise<AIExecutionResult>;
  translateText: (
    content: string,
    language: string,
    context?: string
  ) => Promise<AIExecutionResult>;
  rephraseText: (content: string, context?: string) => Promise<AIExecutionResult>;
  fixGrammar: (content: string, context?: string) => Promise<AIExecutionResult>;
  generateHeadlines: (context: string) => Promise<AIExecutionResult>;
  generateCTAs: (context: string) => Promise<AIExecutionResult>;
  generateDescription: (context: string) => Promise<AIExecutionResult>;
  clearResult: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function usePuckAI(options: UsePuckAIOptions = {}): UsePuckAIReturn {
  const { onSuccess, onError, showToasts = true } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AIExecutionResult | null>(null);

  /**
   * Execute an AI action via the API
   */
  const executeAction = useCallback(
    async (
      action: AIActionType,
      content: string,
      context?: string,
      params?: Record<string, string>
    ): Promise<AIExecutionResult> => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/editor/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, content, context, params }),
        });

        const result: AIExecutionResult = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "AI request failed");
        }

        setLastResult(result);

        if (result.success) {
          if (showToasts) {
            toast.success(`${AI_ACTIONS[action].label} complete`);
          }
          onSuccess?.(result);
        } else {
          if (showToasts) {
            toast.error(result.error || "AI action failed");
          }
          onError?.(result.error || "AI action failed");
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "AI request failed";
        
        const errorResult: AIExecutionResult = {
          success: false,
          error: errorMessage,
        };

        setLastResult(errorResult);

        if (showToasts) {
          toast.error(errorMessage);
        }
        onError?.(errorMessage);

        return errorResult;
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError, showToasts]
  );

  // Convenience methods
  const improveText = useCallback(
    (content: string, context?: string) =>
      executeAction("improve", content, context),
    [executeAction]
  );

  const simplifyText = useCallback(
    (content: string, context?: string) =>
      executeAction("simplify", content, context),
    [executeAction]
  );

  const expandText = useCallback(
    (content: string, context?: string) =>
      executeAction("expand", content, context),
    [executeAction]
  );

  const shortenText = useCallback(
    (content: string, context?: string) =>
      executeAction("shorten", content, context),
    [executeAction]
  );

  const translateText = useCallback(
    (content: string, language: string, context?: string) =>
      executeAction("translate", content, context, { language }),
    [executeAction]
  );

  const rephraseText = useCallback(
    (content: string, context?: string) =>
      executeAction("rephrase", content, context),
    [executeAction]
  );

  const fixGrammar = useCallback(
    (content: string, context?: string) =>
      executeAction("fix_grammar", content, context),
    [executeAction]
  );

  const generateHeadlines = useCallback(
    (context: string) => executeAction("generate_headline", "", context),
    [executeAction]
  );

  const generateCTAs = useCallback(
    (context: string) => executeAction("generate_cta", "", context),
    [executeAction]
  );

  const generateDescription = useCallback(
    (context: string) => executeAction("generate_description", "", context),
    [executeAction]
  );

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    isLoading,
    lastResult,
    executeAction,
    improveText,
    simplifyText,
    expandText,
    shortenText,
    translateText,
    rephraseText,
    fixGrammar,
    generateHeadlines,
    generateCTAs,
    generateDescription,
    clearResult,
  };
}

// ============================================
// Context Hook for Page-level AI
// ============================================

export interface PageAIContext {
  title?: string;
  description?: string;
  industry?: string;
  targetAudience?: string;
  existingContent?: string[];
}

export function usePageAIContext(pageData: {
  root?: { props?: { title?: string; description?: string } };
  content?: Array<{ type?: string; props?: Record<string, unknown> }>;
}): PageAIContext {
  // Extract title and description from root props
  const title = pageData.root?.props?.title;
  const description = pageData.root?.props?.description;

  // Extract text content from all components
  const existingContent: string[] = [];
  
  if (pageData.content) {
    for (const component of pageData.content) {
      if (component.props) {
        // Extract common text fields
        const textFields = ["title", "subtitle", "text", "content", "description", "heading"];
        for (const field of textFields) {
          const value = component.props[field];
          if (typeof value === "string" && value.length > 0) {
            existingContent.push(value);
          }
        }
      }
    }
  }

  return {
    title,
    description,
    existingContent: existingContent.length > 0 ? existingContent : undefined,
  };
}

// ============================================
// AI Suggestions Hook
// ============================================

export interface AISuggestion {
  id: string;
  type: "improvement" | "addition" | "optimization" | "warning";
  title: string;
  description: string;
  componentId?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useAISuggestions(
  pageContext: PageAIContext,
  enabled: boolean = true
): {
  suggestions: AISuggestion[];
  isLoading: boolean;
  refresh: () => void;
} {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !pageContext.existingContent?.length) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/editor/ai/suggest-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: pageContext }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Failed to fetch AI suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, pageContext]);

  return { suggestions, isLoading, refresh };
}
