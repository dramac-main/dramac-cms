/**
 * AI Actions Panel
 * 
 * Combined panel with Quick Actions and Suggestions.
 * Phase STUDIO-13: AI Suggestions & Quick Actions
 */

"use client";

import { cn } from "@/lib/utils";
import { QuickActions } from "./quick-actions";
import { AISuggestions } from "./ai-suggestions";
import { useEditorStore } from "@/lib/studio/store/editor-store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { COMPONENT_SUGGESTIONS } from "@/lib/studio/ai/types";

// =============================================================================
// TYPES
// =============================================================================

interface AIActionsPanelProps {
  componentId: string;
  className?: string;
}

// =============================================================================
// AI ACTIONS PANEL COMPONENT
// =============================================================================

export function AIActionsPanel({ componentId, className }: AIActionsPanelProps) {
  const { data } = useEditorStore();
  const component = data.components[componentId];
  const definition = component ? componentRegistry.get(component.type) : null;
  
  if (!component || !definition) return null;
  
  // Check if component has text fields (should show quick actions)
  const hasTextFields = Object.values(definition.fields).some(
    field => field.type === "text" || field.type === "textarea" || field.type === "richtext"
  );
  
  // Check if component has AI suggestions
  const hasDefinitionSuggestions = definition.ai?.suggestions && definition.ai.suggestions.length > 0;
  const hasComponentSuggestions = !!COMPONENT_SUGGESTIONS[component.type]?.length;
  const hasSuggestions = hasDefinitionSuggestions || hasComponentSuggestions;
  
  // Don't render if no AI features apply
  if (!hasTextFields && !hasSuggestions) return null;
  
  return (
    <div className={cn(
      "space-y-4 pt-4 mt-4 border-t border-border",
      className
    )}>
      {/* Quick Actions */}
      {hasTextFields && (
        <QuickActions componentId={componentId} />
      )}
      
      {/* Suggestions */}
      <AISuggestions componentId={componentId} />
    </div>
  );
}
