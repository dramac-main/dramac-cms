/**
 * DRAMAC Studio - Quick Actions Panel
 * 
 * AI-powered quick actions for the selected component.
 * Displays available AI actions and suggestions based on component type and current props.
 * 
 * @phase STUDIO-30 - Component Superpowers
 */

"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Lightbulb, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  getAvailableActions, 
  getActionableSuggestions, 
  buildAIPrompt,
  type AIActionConfig 
} from "@/lib/studio/registry/ai-configs";
import { useEditorStore } from "@/lib/studio/store/editor-store";

// =============================================================================
// TYPES
// =============================================================================

interface QuickActionsPanelProps {
  componentId: string;
  componentType: string;
  componentProps: Record<string, unknown>;
}

// =============================================================================
// QUICK ACTIONS PANEL COMPONENT
// =============================================================================

export function QuickActionsPanel({
  componentId,
  componentType,
  componentProps,
}: QuickActionsPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const updateComponentProps = useEditorStore((s) => s.updateComponentProps);
  
  const actions = getAvailableActions(componentType);
  const suggestions = getActionableSuggestions(componentType, componentProps);
  
  const handleAction = useCallback(async (action: AIActionConfig) => {
    setLoading(action.id);
    
    try {
      const prompt = buildAIPrompt(componentType, action.prompt, componentProps);
      
      const response = await fetch("/api/studio/ai/quick-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId,
          componentType,
          action: action.id,
          prompt,
          currentProps: componentProps,
          affectedProps: action.affectedProps,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || "Action failed");
      }
      
      const result = await response.json();
      
      if (result.updates && Object.keys(result.updates).length > 0) {
        updateComponentProps(componentId, result.updates);
        toast.success(action.label, {
          description: "Changes applied successfully",
          icon: <Sparkles className="h-4 w-4" />,
        });
      } else {
        toast.info("No changes needed", {
          description: "The component is already optimized",
        });
      }
    } catch (error) {
      console.error("[QuickActions] Error:", error);
      toast.error("Action failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(null);
    }
  }, [componentId, componentType, componentProps, updateComponentProps]);
  
  // Find the action for a suggestion
  const getActionForSuggestion = useCallback((actionId?: string) => {
    if (!actionId) return null;
    return actions.find((a) => a.id === actionId) || null;
  }, [actions]);
  
  // Don't render if no actions or suggestions
  if (actions.length === 0 && suggestions.length === 0) {
    return null;
  }
  
  return (
    <div className="border-t border-border bg-muted/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">AI Quick Actions</span>
      </div>
      
      <div className="p-3 space-y-3">
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((suggestion, i) => {
              const action = getActionForSuggestion(suggestion.action);
              
              return (
                <div 
                  key={i}
                  className={cn(
                    "flex items-start gap-2 text-xs rounded-md p-2",
                    "bg-amber-500/10 border border-amber-500/20",
                    action && "cursor-pointer hover:bg-amber-500/20 transition-colors"
                  )}
                  onClick={action ? () => handleAction(action) : undefined}
                  role={action ? "button" : undefined}
                  tabIndex={action ? 0 : undefined}
                >
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-muted-foreground">{suggestion.message}</span>
                    {action && (
                      <span className="text-amber-600 ml-1 font-medium">
                        → {action.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant="outline"
                className={cn(
                  "h-7 text-xs gap-1.5 bg-background hover:bg-primary/5",
                  loading === action.id && "pointer-events-none opacity-70"
                )}
                onClick={() => handleAction(action)}
                disabled={loading !== null}
                title={action.description}
              >
                {loading === action.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="text-sm">{action.icon}</span>
                )}
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        )}
        
        {/* Loading overlay */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>AI is working on your request...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// COMPACT VERSION FOR TOOLBAR
// =============================================================================

interface QuickActionsButtonProps {
  componentId: string;
  componentType: string;
  componentProps: Record<string, unknown>;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export function QuickActionsButton({
  componentId,
  componentType,
  componentProps,
  variant = "ghost",
  size = "sm",
}: QuickActionsButtonProps) {
  const [loading, setLoading] = useState(false);
  const updateComponentProps = useEditorStore((s) => s.updateComponentProps);
  
  const actions = getAvailableActions(componentType);
  const suggestions = getActionableSuggestions(componentType, componentProps);
  
  const totalCount = actions.length + suggestions.length;
  
  // Quick action - run the first available action
  const handleQuickAction = useCallback(async () => {
    const action = actions[0];
    if (!action) return;
    
    setLoading(true);
    
    try {
      const prompt = buildAIPrompt(componentType, action.prompt, componentProps);
      
      const response = await fetch("/api/studio/ai/quick-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId,
          componentType,
          action: action.id,
          prompt,
          currentProps: componentProps,
          affectedProps: action.affectedProps,
        }),
      });
      
      if (!response.ok) throw new Error("Action failed");
      
      const result = await response.json();
      
      if (result.updates) {
        updateComponentProps(componentId, result.updates);
        toast.success(action.label, {
          description: "Changes applied",
        });
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  }, [actions, componentId, componentType, componentProps, updateComponentProps]);
  
  if (totalCount === 0) {
    return null;
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleQuickAction}
      disabled={loading || actions.length === 0}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      <span className="sr-only sm:not-sr-only">AI</span>
      {suggestions.length > 0 && (
        <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-medium text-amber-600">
          {suggestions.length}
        </span>
      )}
    </Button>
  );
}
