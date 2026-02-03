/**
 * DRAMAC Studio Properties Panel
 * 
 * Right panel for editing selected component properties.
 */

"use client";

import React, { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Settings, Trash2, Copy, ChevronDown, ChevronRight, MousePointer, MousePointer2, Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PanelHeader } from "@/components/studio/layout/panel-header";
import { FieldRenderer } from "@/components/studio/fields/field-renderer";
import { BreakpointIndicator, BreakpointSelectorCompact } from "@/components/studio/layout/breakpoint-selector";
import { AIComponentChat, AIActionsPanel } from "@/components/studio/ai";
import { StateEditor } from "@/components/studio/properties/state-editor";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { useEditorStore, useSelectionStore, useUIStore, useAIStore } from "@/lib/studio/store";
import type { FieldGroup, ComponentDefinition, FieldDefinition } from "@/types/studio";

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <MousePointer className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">No Component Selected</h3>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        Select a component on the canvas to edit its properties
      </p>
    </div>
  );
}

// =============================================================================
// COMPONENT INFO HEADER
// =============================================================================

interface ComponentInfoProps {
  definition: ComponentDefinition;
  componentId: string;
}

function ComponentInfo({ definition, componentId }: ComponentInfoProps) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[definition.icon] || LucideIcons.Box;
  const { openChat } = useAIStore();
  
  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-3 p-3 bg-muted/30">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">{definition.label}</h3>
          <p className="text-xs text-muted-foreground truncate">{componentId}</p>
        </div>
        {/* Ask AI Button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => openChat(componentId)}
        >
          <Sparkles className="h-4 w-4" />
          Ask AI
        </Button>
      </div>
      
      {/* Breakpoint Indicator */}
      <div className="flex items-center justify-between bg-muted/50 px-3 py-2">
        <BreakpointIndicator />
        <BreakpointSelectorCompact />
      </div>
    </div>
  );
}

// =============================================================================
// FIELD GROUP ACCORDION
// =============================================================================

interface FieldGroupAccordionProps {
  group: FieldGroup;
  fields: Array<FieldDefinition & { key: string }>;
  props: Record<string, unknown>;
  onFieldChange: (key: string, value: unknown) => void;
  disabled?: boolean;
}

function FieldGroupAccordion({
  group,
  fields,
  props,
  onFieldChange,
  disabled,
}: FieldGroupAccordionProps) {
  const [isOpen, setIsOpen] = React.useState(group.defaultExpanded !== false);
  
  if (fields.length === 0) return null;
  
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2.5 text-left",
          "hover:bg-muted/50 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        )}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 text-sm font-medium">{group.label}</span>
      </button>
      
      {isOpen && (
        <div className="space-y-4 px-3 pb-4">
          {fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={props[field.key]}
              onChange={(value) => onFieldChange(field.key, value)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN PROPERTIES PANEL
// =============================================================================

export function PropertiesPanel() {
  // Stores
  const componentId = useSelectionStore((s) => s.componentId);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const togglePanel = useUIStore((s) => s.togglePanel);
  
  const data = useEditorStore((s) => s.data);
  const updateComponentProps = useEditorStore((s) => s.updateComponentProps);
  const deleteComponent = useEditorStore((s) => s.deleteComponent);
  const duplicateComponent = useEditorStore((s) => s.duplicateComponent);
  
  // Get selected component
  const component = useMemo(() => {
    if (!componentId || !data) return null;
    return data.components[componentId];
  }, [componentId, data]);
  
  // Get component definition
  const definition = useMemo(() => {
    if (!component) return null;
    return componentRegistry.get(component.type);
  }, [component]);
  
  // Convert fields Record to array with keys
  const fieldsWithKeys = useMemo((): Array<FieldDefinition & { key: string }> => {
    if (!definition) return [];
    return Object.entries(definition.fields).map(([key, field]) => ({
      ...field,
      key,
    }));
  }, [definition]);
  
  // Handle field change
  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      if (!componentId) return;
      updateComponentProps(componentId, { [key]: value });
    },
    [componentId, updateComponentProps]
  );
  
  // Handle delete
  const handleDelete = useCallback(() => {
    if (!componentId) return;
    deleteComponent(componentId);
    clearSelection();
  }, [componentId, deleteComponent, clearSelection]);
  
  // Handle duplicate
  const handleDuplicate = useCallback(() => {
    if (!componentId) return;
    duplicateComponent(componentId);
  }, [componentId, duplicateComponent]);
  
  // Group fields
  const fieldGroups = useMemo((): FieldGroup[] => {
    if (!definition) return [];
    
    // Check if definition has explicit groups
    if (definition.fieldGroups && definition.fieldGroups.length > 0) {
      return definition.fieldGroups;
    }
    
    // Auto-group by field categories or create default groups
    const contentFields: string[] = [];
    const styleFields: string[] = [];
    const layoutFields: string[] = [];
    const advancedFields: string[] = [];
    
    for (const field of fieldsWithKeys) {
      // Group by field key naming or type
      if (field.key.includes("content") || field.key === "text" || field.key === "children" || field.type === "textarea" || field.key === "title" || field.key === "subtitle" || field.key === "description") {
        contentFields.push(field.key);
      } else if (field.key.includes("color") || field.key.includes("font") || field.type === "color" || field.key.includes("background")) {
        styleFields.push(field.key);
      } else if (field.key.includes("padding") || field.key.includes("margin") || field.key.includes("gap") || field.type === "spacing" || field.key.includes("width") || field.key.includes("height")) {
        layoutFields.push(field.key);
      } else if (field.key.includes("animation") || field.key.includes("hover") || field.key.includes("advanced") || field.key.includes("custom")) {
        advancedFields.push(field.key);
      } else {
        // Default to content
        contentFields.push(field.key);
      }
    }
    
    const groups: FieldGroup[] = [];
    
    if (contentFields.length > 0) {
      groups.push({ id: "content", label: "Content", fields: contentFields, defaultExpanded: true });
    }
    if (styleFields.length > 0) {
      groups.push({ id: "style", label: "Style", fields: styleFields, defaultExpanded: true });
    }
    if (layoutFields.length > 0) {
      groups.push({ id: "layout", label: "Layout", fields: layoutFields, defaultExpanded: false });
    }
    if (advancedFields.length > 0) {
      groups.push({ id: "advanced", label: "Advanced", fields: advancedFields, defaultExpanded: false });
    }
    
    return groups;
  }, [definition, fieldsWithKeys]);
  
  // Get fields for a group
  const getFieldsForGroup = useCallback((group: FieldGroup): Array<FieldDefinition & { key: string }> => {
    return group.fields
      .map((key) => fieldsWithKeys.find((f) => f.key === key))
      .filter((f): f is NonNullable<typeof f> => f !== undefined);
  }, [fieldsWithKeys]);
  
  // No selection
  if (!component || !definition) {
    return (
      <div className="flex h-full flex-col">
        <PanelHeader
          title="Properties"
          icon={Settings}
          position="right"
          onCollapse={() => togglePanel("right")}
        />
        <EmptyState />
      </div>
    );
  }
  
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <PanelHeader
        title="Properties"
        icon={Settings}
        position="right"
        onCollapse={() => togglePanel("right")}
      />
      
      {/* Component Info */}
      <ComponentInfo definition={definition} componentId={componentId!} />
      
      {/* Fields */}
      <ScrollArea className="flex-1">
        {fieldGroups.length > 0 ? (
          fieldGroups.map((group) => (
            <FieldGroupAccordion
              key={group.id}
              group={group}
              fields={getFieldsForGroup(group)}
              props={component.props as Record<string, unknown>}
              onFieldChange={handleFieldChange}
            />
          ))
        ) : (
          // No groups - show all fields
          <div className="space-y-4 p-3">
            {fieldsWithKeys.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={(component.props as Record<string, unknown>)[field.key]}
                onChange={(value) => handleFieldChange(field.key, value)}
              />
            ))}
          </div>
        )}
        
        {/* AI Quick Actions & Suggestions Panel */}
        {componentId && (
          <div className="px-3 pb-4">
            <AIActionsPanel componentId={componentId} />
          </div>
        )}
        
        {/* States Editor (PHASE-STUDIO-22) */}
        {componentId && component && (
          <div className="border-t border-border">
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-muted/50">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <MousePointer2 className="h-4 w-4" />
                  States (Hover/Active/Focus)
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <StateEditor component={component} />
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </ScrollArea>
      
      {/* Actions Footer */}
      <div className="border-t border-border p-3 space-y-2">
        {/* Duplicate */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleDuplicate}
        >
          <Copy className="h-4 w-4" />
          Duplicate Component
        </Button>
        
        {/* Delete with Confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete Component
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Component</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this {definition.label} component?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      {/* AI Component Chat Panel */}
      <AIComponentChat />
    </div>
  );
}
