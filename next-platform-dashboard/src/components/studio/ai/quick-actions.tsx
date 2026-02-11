/**
 * Quick Actions Component
 * 
 * One-click AI actions for common text modifications.
 * Phase STUDIO-13: AI Suggestions & Quick Actions
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, ChevronDown, Undo2 } from "lucide-react";
import { useEditorStore } from "@/lib/studio/store/editor-store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { toast } from "sonner";
import {
  DEFAULT_QUICK_ACTIONS,
  SUPPORTED_LANGUAGES,
  type QuickAction,
  type LanguageCode,
  type AIComponentContext,
  type AIComponentRequest,
} from "@/lib/studio/ai/types";

// =============================================================================
// TYPES
// =============================================================================

interface QuickActionsProps {
  componentId: string;
  className?: string;
}

// =============================================================================
// QUICK ACTIONS COMPONENT
// =============================================================================

export function QuickActions({ componentId, className }: QuickActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastChange, setLastChange] = useState<{
    componentId: string;
    originalProps: Record<string, unknown>;
  } | null>(null);
  
  const { data, updateComponentProps } = useEditorStore();
  const component = data.components[componentId];
  const definition = component ? componentRegistry.get(component.type) : null;
  
  if (!component || !definition) return null;
  
  // Filter actions based on component type
  const availableActions = DEFAULT_QUICK_ACTIONS.filter(action => {
    // If action specifies component types, check if current type is included
    if (action.componentTypes && !action.componentTypes.includes(component.type)) {
      return false;
    }
    // Only show text-related actions for components with text-like fields
    const hasTextField = Object.entries(definition.fields).some(
      ([, field]) => field.type === "text" || field.type === "textarea" || field.type === "richtext"
    );
    return hasTextField || action.id === "translate";
  });
  
  // Find the primary text field
  const findTextFieldName = (): string | null => {
    const textFields = ["text", "content", "title", "label", "heading", "description", "subtitle"];
    for (const fieldName of textFields) {
      if (definition.fields[fieldName]) {
        return fieldName;
      }
    }
    // Fall back to first text field
    const firstTextField = Object.entries(definition.fields).find(
      ([, field]) => field.type === "text" || field.type === "textarea"
    );
    return firstTextField ? firstTextField[0] : null;
  };
  
  // Execute quick action
  const executeAction = async (action: QuickAction, language?: LanguageCode) => {
    const textField = action.targetField || findTextFieldName();
    if (!textField) {
      toast.error("No text field found");
      return;
    }
    
    const currentText = component.props[textField];
    if (!currentText || typeof currentText !== "string") {
      toast.error("No text to modify");
      return;
    }
    
    setLoadingAction(action.id);
    
    // Store original for undo
    setLastChange({
      componentId,
      originalProps: { [textField]: currentText },
    });
    
    try {
      // Build prompt
      let prompt = action.prompt;
      if (action.requiresInput === "language" && language) {
        const langName = SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || language;
        prompt = prompt.replace("{language}", langName);
      }
      
      // Build context
      const context: AIComponentContext = {
        componentType: component.type,
        componentLabel: definition.label,
        currentProps: { [textField]: currentText },
        fields: { [textField]: definition.fields[textField] },
      };
      
      const request: AIComponentRequest = {
        context,
        userMessage: prompt,
      };
      
      // Call API
      const response = await fetch("/api/studio/ai/component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to process");
      }
      
      // Apply changes
      if (result.changes && Object.keys(result.changes).length > 0) {
        updateComponentProps(componentId, result.changes);
        
        toast.success(`${action.label} applied`, {
          description: result.explanation || "Changes applied successfully",
          action: {
            label: "Undo",
            onClick: () => handleUndo(),
          },
        });
      } else {
        toast.info("No changes needed");
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Action failed", { description: message });
    } finally {
      setLoadingAction(null);
    }
  };
  
  // Undo last change
  const handleUndo = () => {
    if (!lastChange) return;
    
    updateComponentProps(lastChange.componentId, lastChange.originalProps);
    toast.success("Change undone");
    setLastChange(null);
  };
  
  // Render action button
  const renderActionButton = (action: QuickAction) => {
    const isLoading = loadingAction === action.id;
    
    // Translation needs language dropdown
    if (action.requiresInput === "language") {
      return (
        <DropdownMenu key={action.id}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={loadingAction !== null}
              className="gap-1 h-7 px-2 text-xs"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span>{action.icon}</span>
              )}
              {action.label}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => executeAction(action, lang.code)}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    
    return (
      <Button
        key={action.id}
        variant="outline"
        size="sm"
        onClick={() => executeAction(action)}
        disabled={loadingAction !== null}
        className="gap-1 h-7 px-2 text-xs"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span>{action.icon}</span>
        )}
        {action.label}
      </Button>
    );
  };
  
  if (availableActions.length === 0) return null;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Quick Actions
        </span>
        {lastChange && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            className="h-6 text-xs gap-1 px-2"
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {availableActions.slice(0, 8).map(renderActionButton)}
      </div>
    </div>
  );
}
