/**
 * Studio Field Components
 * 
 * Custom field editors for component properties.
 * Phase STUDIO-08: Basic fields
 * Phase STUDIO-09: Advanced fields with FieldRenderer
 */

// Master field renderer
export { FieldRenderer, FIELD_EDITORS, AdvancedFieldEditors } from './field-renderer';
export type { FieldRendererProps } from './field-renderer';

// Re-export advanced field editors from lib/studio/fields
export {
  ColorFieldEditor,
  ImageFieldEditor,
  LinkFieldEditor,
  SpacingFieldEditor,
  TypographyFieldEditor,
  ArrayFieldEditor,
  ArrayFieldEditorProvider,
  ObjectFieldEditor,
  ObjectFieldEditorProvider,
} from '@/lib/studio/fields';

// Re-export field utilities
export * from '@/lib/studio/fields/field-utils';

