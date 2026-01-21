// AI Module Builder - Module Index
// Phase EM-23: AI-powered module generation

export { AIModuleBuilderService } from './ai-service';
export type {
  ModuleSpec,
  EntitySpec,
  FieldSpec,
  PageSpec,
  EndpointSpec,
  ComponentSpec,
  SettingSpec,
  GeneratedFile,
  AISession,
  AIMessage
} from './ai-service';

export {
  SYSTEM_PROMPT,
  SPEC_GENERATION_PROMPT,
  CODE_GENERATION_PROMPTS,
  REFINEMENT_PROMPTS,
  EXAMPLE_MODULES,
  buildPrompt,
  validateSpec
} from './prompts';
