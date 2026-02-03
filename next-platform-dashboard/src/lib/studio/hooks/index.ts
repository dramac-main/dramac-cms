/**
 * DRAMAC Studio Hooks
 * 
 * Central exports for Studio hooks.
 */

export {
  useModuleSync,
  useModuleInitialization,
  useModuleRefresh,
  useModules,
} from "./use-module-sync";

export {
  useStudioShortcuts,
  SHORTCUT_DEFINITIONS,
  type ShortcutDefinition,
  type ShortcutGroup,
} from "./use-studio-shortcuts";
