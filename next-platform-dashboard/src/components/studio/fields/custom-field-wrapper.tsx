/**
 * Custom Field Wrapper
 * 
 * Wraps custom field components with necessary context and error handling.
 * Used by module-specific field types like product selector, category picker, etc.
 */

"use client";

import { useState, Suspense } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { FieldDefinition } from "@/types/studio";
import type { CustomFieldEditorProps } from "@/types/studio-module";
import { fieldRegistry } from "@/lib/studio/registry/field-registry";
import { useEditorStore } from "@/lib/studio/store/editor-store";

// =============================================================================
// TYPES
// =============================================================================

interface CustomFieldWrapperProps {
  /** Field definition */
  field: FieldDefinition;
  
  /** Current value */
  value: unknown;
  
  /** Change handler */
  onChange: (value: unknown) => void;
  
  /** Component type for context */
  componentType?: string;
  
  /** Disabled state */
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CustomFieldWrapper({
  field,
  value,
  onChange,
  componentType,
  disabled = false,
}: CustomFieldWrapperProps) {
  const [error, setError] = useState<string | null>(null);
  const siteId = useEditorStore(state => state.siteId);
  
  // Get custom field type
  const customType = field.customType;
  
  if (!customType) {
    return (
      <FieldError 
        label={field.label}
        error="Custom field type not specified"
      />
    );
  }
  
  // Get custom renderer
  const CustomRenderer = fieldRegistry.getCustomRenderer(customType);
  
  if (!CustomRenderer) {
    return (
      <FieldError 
        label={field.label}
        error={`Custom field type "${customType}" not found. Is the module installed?`}
      />
    );
  }
  
  // Extract module ID from custom type (format: "moduleSlug:fieldType")
  const moduleId = customType.split(":")[0] || "unknown";
  
  // Handle value changes with validation
  const handleChange = (newValue: unknown) => {
    setError(null);
    
    // Validate if validator exists
    const definition = fieldRegistry.getCustomFieldDefinition(customType);
    if (definition?.validate) {
      const validationError = definition.validate(newValue, field.customOptions);
      if (validationError) {
        setError(validationError);
        // Still update value but show error
      }
    }
    
    onChange(newValue);
  };
  
  if (!siteId) {
    return (
      <FieldError 
        label={field.label}
        error="Site context not available"
      />
    );
  }

  // Build props for custom field editor
  const customFieldProps: CustomFieldEditorProps = {
    value,
    onChange: handleChange,
    field,
    componentType: componentType || "unknown",
    siteId,
    moduleId,
  };
  
  // Cast CustomRenderer to accept CustomFieldEditorProps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RendererComponent = CustomRenderer as React.ComponentType<any>;
  
  return (
    <div className="custom-field-wrapper">
      <Suspense fallback={<FieldLoading label={field.label} />}>
        <RendererComponent {...customFieldProps} />
      </Suspense>
      
      {error && (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function FieldLoading({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading field...</span>
      </div>
    </div>
  );
}

function FieldError({ label, error }: { label: string; error: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2 p-3 border border-destructive/50 rounded-md bg-destructive/10">
        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        <span className="text-sm text-destructive">{error}</span>
      </div>
    </div>
  );
}

export default CustomFieldWrapper;
