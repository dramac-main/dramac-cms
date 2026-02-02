// src/lib/studio/fields/object-field-editor.tsx
'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ObjectFieldEditorProps, FieldDefinition } from '@/types/studio';
import { ChevronDown, Settings2 } from 'lucide-react';

// Context to receive field renderer from parent (shared with ArrayFieldEditor)
interface FieldRendererProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

type FieldRendererComponent = React.ComponentType<FieldRendererProps>;

const FieldRendererContext = React.createContext<FieldRendererComponent | null>(null);

export function ObjectFieldEditorProvider({ 
  children, 
  fieldRenderer 
}: { 
  children: React.ReactNode; 
  fieldRenderer: FieldRendererComponent;
}) {
  return (
    <FieldRendererContext.Provider value={fieldRenderer}>
      {children}
    </FieldRendererContext.Provider>
  );
}

export function ObjectFieldEditor({
  value = {},
  onChange,
  fields,
  label,
  description,
  disabled = false,
  collapsible = true,
}: ObjectFieldEditorProps) {
  const FieldRenderer = React.useContext(FieldRendererContext);
  const [isOpen, setIsOpen] = React.useState(true);
  
  // Handle nested field change
  const handleFieldChange = React.useCallback((fieldName: string, fieldValue: unknown) => {
    onChange({
      ...value,
      [fieldName]: fieldValue,
    });
  }, [value, onChange]);
  
  if (!FieldRenderer) {
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          ObjectFieldEditor requires a FieldRenderer context. Wrap with ObjectFieldEditorProvider.
        </p>
      </div>
    );
  }
  
  // Non-collapsible rendering
  if (!collapsible) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <div className="pl-4 border-l-2 border-muted space-y-3">
          {Object.entries(fields).map(([fieldName, fieldDef]) => (
            <FieldRenderer
              key={fieldName}
              field={{ ...fieldDef, label: fieldDef.label || fieldName }}
              value={value[fieldName]}
              onChange={(val) => handleFieldChange(fieldName, val)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger 
        className={cn(
          "flex items-center justify-between w-full py-2 px-2 -mx-2 rounded",
          "hover:bg-muted/50 transition-colors"
        )}
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      <CollapsibleContent className="space-y-3">
        <div className="pl-4 border-l-2 border-muted space-y-3">
          {Object.entries(fields).map(([fieldName, fieldDef]) => (
            <FieldRenderer
              key={fieldName}
              field={{ ...fieldDef, label: fieldDef.label || fieldName }}
              value={value[fieldName]}
              onChange={(val) => handleFieldChange(fieldName, val)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default ObjectFieldEditor;
