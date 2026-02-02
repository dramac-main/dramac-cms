// src/lib/studio/fields/index.ts
'use client';

/**
 * DRAMAC Studio Advanced Field Editors
 * Phase STUDIO-09: Advanced Field Types
 */

// Field utilities
export * from './field-utils';

// Advanced field editors
export { ColorFieldEditor, default as ColorFieldEditorDefault } from './color-field-editor';
export { ImageFieldEditor, default as ImageFieldEditorDefault } from './image-field-editor';
export { LinkFieldEditor, default as LinkFieldEditorDefault } from './link-field-editor';
export { SpacingFieldEditor, default as SpacingFieldEditorDefault } from './spacing-field-editor';
export { TypographyFieldEditor, default as TypographyFieldEditorDefault } from './typography-field-editor';
export { 
  ArrayFieldEditor, 
  ArrayFieldEditorProvider,
  default as ArrayFieldEditorDefault 
} from './array-field-editor';
export { 
  ObjectFieldEditor, 
  ObjectFieldEditorProvider,
  default as ObjectFieldEditorDefault 
} from './object-field-editor';
