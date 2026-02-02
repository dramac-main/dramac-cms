// src/components/studio/fields/field-renderer.tsx
'use client';

import * as React from 'react';
import type { FieldDefinition, FieldType } from '@/types/studio';

// Import existing field editors from properties folder
import { TextField } from '@/components/studio/properties/fields/text-field';
import { TextareaField } from '@/components/studio/properties/fields/textarea-field';
import { NumberField } from '@/components/studio/properties/fields/number-field';
import { SelectField } from '@/components/studio/properties/fields/select-field';
import { ToggleField } from '@/components/studio/properties/fields/toggle-field';
import { ColorField } from '@/components/studio/properties/fields/color-field';
import { SpacingField } from '@/components/studio/properties/fields/spacing-field';
import { UrlField } from '@/components/studio/properties/fields/url-field';

// Import advanced field editors from lib/studio/fields
import { ColorFieldEditor } from '@/lib/studio/fields/color-field-editor';
import { ImageFieldEditor } from '@/lib/studio/fields/image-field-editor';
import { LinkFieldEditor } from '@/lib/studio/fields/link-field-editor';
import { SpacingFieldEditor } from '@/lib/studio/fields/spacing-field-editor';
import { TypographyFieldEditor } from '@/lib/studio/fields/typography-field-editor';
import { 
  ArrayFieldEditor, 
  ArrayFieldEditorProvider 
} from '@/lib/studio/fields/array-field-editor';
import { 
  ObjectFieldEditor,
  ObjectFieldEditorProvider 
} from '@/lib/studio/fields/object-field-editor';

export interface FieldRendererProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

// Map field types to their editors
// We support both the existing Wave 2 editors and the new Wave 3 advanced editors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FIELD_EDITORS: Partial<Record<FieldType, React.ComponentType<any>>> = {
  // Basic fields (from Wave 2 - STUDIO-08)
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  select: SelectField,
  toggle: ToggleField,
  checkbox: ToggleField,
  
  // Advanced fields (from Wave 3 - STUDIO-09)
  // Note: We provide both old and new versions - new ones are more feature-rich
  color: ColorField, // Use existing for now, can switch to ColorFieldEditor
  spacing: SpacingField, // Use existing for now
  
  // New advanced editors
  image: ImageFieldEditor,
  link: LinkFieldEditor,
  typography: TypographyFieldEditor,
  array: ArrayFieldEditor,
  object: ObjectFieldEditor,
};

// Inner field renderer (used by array/object for recursion)
function InnerFieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  const Editor = FIELD_EDITORS[field.type];
  
  if (!Editor) {
    return (
      <div className="p-2 border rounded bg-muted text-xs text-muted-foreground">
        Unknown field type: {field.type}
      </div>
    );
  }
  
  // Pass appropriate props based on field type
  const commonProps = {
    field,
    value,
    onChange,
    label: field.label,
    description: field.description,
    disabled: disabled || false,
    required: field.required,
  };
  
  switch (field.type) {
    case 'textarea':
      return <Editor {...commonProps} />;
      
    case 'number':
      return (
        <Editor 
          {...commonProps} 
          min={field.min} 
          max={field.max} 
          step={field.step} 
        />
      );
      
    case 'select':
    case 'radio':
      return <Editor {...commonProps} options={field.options || []} />;
      
    case 'image':
      return <Editor {...commonProps} accepts={field.accepts} />;
      
    case 'link':
      return <Editor {...commonProps} />;
      
    case 'spacing':
      // Check if we should use the advanced CSS spacing editor
      // If field has CSS units expected, use advanced; otherwise use basic
      return <Editor {...commonProps} />;
      
    case 'typography':
      return <Editor {...commonProps} showPreview={true} />;
      
    case 'array':
      return (
        <Editor 
          {...commonProps} 
          itemFields={field.itemFields || {}} 
          itemLabel={field.label?.replace(/s$/, '') || 'Item'}
          minItems={field.min}
          maxItems={field.max}
        />
      );
      
    case 'object':
      return <Editor {...commonProps} fields={field.fields || {}} />;
      
    default:
      return <Editor {...commonProps} />;
  }
}

// Main field renderer with provider for nested fields
export function FieldRenderer(props: FieldRendererProps) {
  // Wrap with providers for array/object fields
  return (
    <ArrayFieldEditorProvider fieldRenderer={InnerFieldRenderer}>
      <ObjectFieldEditorProvider fieldRenderer={InnerFieldRenderer}>
        <InnerFieldRenderer {...props} />
      </ObjectFieldEditorProvider>
    </ArrayFieldEditorProvider>
  );
}

// Advanced field editors available separately
export const AdvancedFieldEditors = {
  ColorFieldEditor,
  ImageFieldEditor,
  LinkFieldEditor,
  SpacingFieldEditor: SpacingFieldEditor,
  TypographyFieldEditor,
  ArrayFieldEditor,
  ObjectFieldEditor,
};

// Export for external use
export { FIELD_EDITORS };
export default FieldRenderer;
