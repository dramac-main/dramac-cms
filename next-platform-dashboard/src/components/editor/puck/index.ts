/**
 * Puck Editor Module Index
 * 
 * Main exports for the Puck editor integration.
 */

// Main Components
export { PuckEditorWrapper, PuckRenderer } from "./puck-editor-wrapper";
export { default as PuckEditorWrapperDefault } from "./puck-editor-wrapper";
export { PuckEditorPage } from "./puck-editor-page";
export { default as PuckEditorPageDefault } from "./puck-editor-page";

// Configuration
export { puckConfig } from "./puck-config";

// Hook
export { usePuckEditor } from "./use-puck-editor";
export type { UsePuckEditorOptions, UsePuckEditorReturn } from "./use-puck-editor";

// Component Renders
export * from "./components";

// Template System (PHASE-ED-07A)
export * from "./templates";

// UI Polish Components (PHASE-ED-08)
export {
  EditorLoadingSkeleton,
  EditorLoadingIndicator,
  EditorSavingOverlay,
} from "./editor-loading-skeleton";

export {
  KeyboardShortcutsPanel,
  KeyCombination,
  ShortcutHint,
  useEditorShortcuts,
  defaultEditorShortcuts,
  type KeyboardShortcut,
} from "./keyboard-shortcuts";

export {
  EditorToolbar,
  type DeviceType,
  type EditorMode,
} from "./editor-toolbar";

export {
  EditorEmptyState,
  EditorEmptyStateCompact,
} from "./editor-empty-state";

// Types (re-export from types folder)
export type {
  PuckData,
  ComponentData,
  RootProps,
  // Props types
  SectionProps,
  ContainerProps,
  ColumnsProps,
  CardProps,
  SpacerProps,
  DividerProps,
  HeadingProps,
  TextProps,
  ButtonProps,
  ImageProps,
  VideoProps,
  MapProps,
  HeroProps,
  FeaturesProps,
  CTAProps,
  TestimonialsProps,
  FAQProps,
  StatsProps,
  TeamProps,
  GalleryProps,
  NavbarProps,
  FooterProps,
  SocialLinksProps,
  FormProps,
  FormFieldProps,
  ContactFormProps,
  NewsletterProps,
  ProductGridProps,
  ProductCardProps,
} from "@/types/puck";
