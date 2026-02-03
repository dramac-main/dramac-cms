/**
 * AI Suggestions Component
 * 
 * Shows contextual improvement suggestions based on component type.
 * Phase STUDIO-13: AI Suggestions & Quick Actions
 */

"use client";

import { cn } from "@/lib/utils";
import { Lightbulb, Sparkles } from "lucide-react";
import { useEditorStore } from "@/lib/studio/store/editor-store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { useAIStore } from "@/lib/studio/store/ai-store";
import { COMPONENT_SUGGESTIONS, type AISuggestion } from "@/lib/studio/ai/types";

// =============================================================================
// TYPES
// =============================================================================

interface AISuggestionsProps {
  componentId: string;
  className?: string;
}

// =============================================================================
// AI SUGGESTIONS COMPONENT
// =============================================================================

export function AISuggestions({ componentId, className }: AISuggestionsProps) {
  const { data } = useEditorStore();
  const component = data.components[componentId];
  const definition = component ? componentRegistry.get(component.type) : null;
  const { openChat } = useAIStore();
  
  if (!component || !definition) return null;
  
  // Get suggestions for this component type
  const suggestions: AISuggestion[] = [
    // Component-specific suggestions from our constants
    ...(COMPONENT_SUGGESTIONS[component.type] || []),
    // Definition AI suggestions from component definition
    ...(definition.ai?.suggestions?.map(s => ({
      text: s,
      prompt: s,
      icon: "💡",
    })) || []),
  ];
  
  if (suggestions.length === 0) return null;
  
  // Handle suggestion click - opens chat with pre-filled prompt
  const handleSuggestionClick = (suggestion: AISuggestion) => {
    // Open the AI chat for this component with the suggestion prompt
    openChat(componentId, suggestion.prompt);
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-xs font-medium text-muted-foreground">
          Suggestions
        </span>
      </div>
      <div className="space-y-1">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm",
              "bg-muted/50 hover:bg-muted transition-colors",
              "flex items-start gap-2 group"
            )}
          >
            <span className="shrink-0">{suggestion.icon || "💡"}</span>
            <span className="flex-1 text-muted-foreground group-hover:text-foreground transition-colors">
              {suggestion.text}
            </span>
            <Sparkles className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
