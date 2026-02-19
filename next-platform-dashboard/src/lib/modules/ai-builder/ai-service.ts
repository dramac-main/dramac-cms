// AI Module Builder Service
// Phase EM-23: AI-powered module generation from natural language
// Using Anthropic Claude API

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { 
  SYSTEM_PROMPT, 
  SPEC_GENERATION_PROMPT, 
  CODE_GENERATION_PROMPTS,
  REFINEMENT_PROMPTS,
  buildPrompt,
  validateSpec
} from './prompts';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

// Claude model to use
const CLAUDE_MODEL = 'claude-sonnet-4-6';

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Type definitions
export interface ModuleSpec {
  name: string;
  slug: string;
  description: string;
  type: 'widget' | 'app' | 'integration' | 'system';
  tier: string;
  features: string[];
  entities: EntitySpec[];
  pages: PageSpec[];
  api_endpoints: EndpointSpec[];
  components: ComponentSpec[];
  permissions: {
    roles: string[];
    default_role: string;
  };
  settings: SettingSpec[];
}

export interface EntitySpec {
  name: string;
  displayName: string;
  description: string;
  fields: FieldSpec[];
}

export interface FieldSpec {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  indexed: boolean;
  default: unknown;
  references: { entity: string; field: string } | null;
}

export interface PageSpec {
  name: string;
  title: string;
  path: string;
  description: string;
  components: string[];
}

export interface EndpointSpec {
  path: string;
  method: string;
  description: string;
  auth: string;
}

export interface ComponentSpec {
  name: string;
  type: string;
  entity: string | null;
  description: string;
}

export interface SettingSpec {
  key: string;
  type: string;
  label: string;
  default: unknown;
}

export interface GeneratedFile {
  path: string;
  type: string;
  content: string;
}

export interface AISession {
  id: string;
  agency_id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  module_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number | null;
  model: string | null;
  created_at: string;
}

// Helper to convert messages to Claude format
function toClaudeMessages(messages: Array<{ role: string; content: string }>): Anthropic.MessageParam[] {
  return messages
    .filter(m => m.role !== 'system') // System prompt is passed separately
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));
}

/**
 * AI Module Builder Service
 * Handles AI-powered module generation from natural language using Claude
 */
export class AIModuleBuilderService {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Create a new AI builder session
   */
  static async createSession(
    agencyId: string,
    userId: string,
    name: string,
    description?: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('ai_module_sessions')
      .insert({
        agency_id: agencyId,
        user_id: userId,
        name,
        description,
        status: 'drafting'
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return data.id;
  }

  /**
   * Get session details
   */
  async getSession(): Promise<AISession | null> {
    const { data, error } = await supabase
      .from('ai_module_sessions')
      .select('*')
      .eq('id', this.sessionId)
      .single();

    if (error) return null;
    return data as AISession;
  }

  /**
   * Get all messages in the session
   */
  async getMessages(): Promise<AIMessage[]> {
    const { data, error } = await supabase
      .from('ai_module_messages')
      .select('*')
      .eq('session_id', this.sessionId)
      .order('created_at');

    if (error) throw new Error(`Failed to get messages: ${error.message}`);
    return data as AIMessage[];
  }

  /**
   * Chat with AI to refine module idea
   */
  async chat(userMessage: string): Promise<string> {
    // Get conversation history
    const { data: messages } = await supabase
      .from('ai_module_messages')
      .select('role, content')
      .eq('session_id', this.sessionId)
      .order('created_at');

    const conversationHistory = (messages || []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    // Add user message to history
    conversationHistory.push({ role: 'user', content: userMessage });

    // Call Claude
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: toClaudeMessages(conversationHistory)
    });

    const assistantMessage = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // Save both messages
    await supabase.from('ai_module_messages').insert([
      { 
        session_id: this.sessionId, 
        role: 'user', 
        content: userMessage,
        tokens_used: response.usage?.input_tokens || 0,
        model: CLAUDE_MODEL
      },
      { 
        session_id: this.sessionId, 
        role: 'assistant', 
        content: assistantMessage,
        tokens_used: response.usage?.output_tokens || 0,
        model: CLAUDE_MODEL
      }
    ]);

    return assistantMessage;
  }

  /**
   * Generate module specification from conversation
   */
  async generateSpec(): Promise<ModuleSpec> {
    // Get conversation history
    const { data: messages } = await supabase
      .from('ai_module_messages')
      .select('role, content')
      .eq('session_id', this.sessionId)
      .order('created_at');

    const conversationHistory = (messages || []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    // Add the spec generation prompt
    conversationHistory.push({ role: 'user', content: SPEC_GENERATION_PROMPT });

    // Generate specification with Claude
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT + '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanatory text.',
      messages: toClaudeMessages(conversationHistory)
    });

    const specContent = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '{}';
    
    // Clean any markdown formatting
    const cleanedSpec = specContent
      .replace(/^```json\n?/g, '')
      .replace(/^```\n?/g, '')
      .replace(/\n?```$/g, '')
      .trim();
    
    const spec = JSON.parse(cleanedSpec) as ModuleSpec;

    // Validate spec
    const validation = validateSpec(spec);
    if (!validation.valid) {
      throw new Error(`Invalid specification: ${validation.errors.join(', ')}`);
    }

    // Get current version
    const { data: existingSpecs } = await supabase
      .from('ai_module_specs')
      .select('version')
      .eq('session_id', this.sessionId)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = (existingSpecs?.[0]?.version || 0) + 1;

    // Save specification
    await supabase.from('ai_module_specs').insert({
      session_id: this.sessionId,
      version: nextVersion,
      spec
    });

    return spec;
  }

  /**
   * Refine an existing specification
   */
  async refineSpec(
    specId: string, 
    refinementType: keyof typeof REFINEMENT_PROMPTS, 
    params: Record<string, string>
  ): Promise<ModuleSpec> {
    // Get current spec
    const { data: specData } = await supabase
      .from('ai_module_specs')
      .select('spec, version')
      .eq('id', specId)
      .single();

    if (!specData) throw new Error('Spec not found');

    const currentSpec = specData.spec as ModuleSpec;
    const promptTemplate = REFINEMENT_PROMPTS[refinementType];
    
    const prompt = buildPrompt(promptTemplate, {
      spec: JSON.stringify(currentSpec, null, 2),
      ...params
    });

    // Generate refined specification with Claude
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT + '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanatory text.',
      messages: [{ role: 'user', content: prompt }]
    });

    const specContent = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '{}';
    
    // Clean any markdown formatting
    const cleanedSpec = specContent
      .replace(/^```json\n?/g, '')
      .replace(/^```\n?/g, '')
      .replace(/\n?```$/g, '')
      .trim();
    
    const refinedSpec = JSON.parse(cleanedSpec) as ModuleSpec;

    // Validate
    const validation = validateSpec(refinedSpec);
    if (!validation.valid) {
      throw new Error(`Invalid refined specification: ${validation.errors.join(', ')}`);
    }

    // Save new version
    await supabase.from('ai_module_specs').insert({
      session_id: this.sessionId,
      version: specData.version + 1,
      spec: refinedSpec
    });

    return refinedSpec;
  }

  /**
   * Generate all code files from specification
   */
  async generateCode(specId: string): Promise<GeneratedFile[]> {
    const { data: specData } = await supabase
      .from('ai_module_specs')
      .select('spec')
      .eq('id', specId)
      .single();

    if (!specData) throw new Error('Spec not found');

    const spec = specData.spec as ModuleSpec;
    const files: GeneratedFile[] = [];

    // Update session status
    await supabase
      .from('ai_module_sessions')
      .update({ status: 'generating' })
      .eq('id', this.sessionId);

    try {
      // Generate module.json manifest
      files.push(this.generateManifest(spec));

      // Generate database schema
      if (spec.entities && spec.entities.length > 0) {
        files.push(await this.generateSchema(spec));
      }

      // Generate services for each entity
      for (const entity of spec.entities || []) {
        files.push(await this.generateService(spec, entity));
      }

      // Generate components
      for (const component of spec.components || []) {
        const entity = spec.entities?.find(e => e.name === component.entity);
        files.push(await this.generateComponent(spec, component, entity));
      }

      // Generate pages
      for (const page of spec.pages || []) {
        files.push(this.generatePage(spec, page));
      }

      // Generate API routes
      for (const endpoint of spec.api_endpoints || []) {
        files.push(await this.generateAPIRoute(spec, endpoint));
      }

      // Generate index.tsx entry point
      files.push(this.generateEntryPoint(spec));

      // Save generated files
      for (const file of files) {
        await supabase.from('ai_module_generated_code').insert({
          session_id: this.sessionId,
          spec_id: specId,
          file_path: file.path,
          file_type: file.type,
          content: file.content
        });
      }

      // Update session status
      await supabase
        .from('ai_module_sessions')
        .update({ status: 'reviewing' })
        .eq('id', this.sessionId);

      return files;

    } catch (error) {
      await supabase
        .from('ai_module_sessions')
        .update({ status: 'failed' })
        .eq('id', this.sessionId);
      throw error;
    }
  }

  /**
   * Generate module manifest
   */
  private generateManifest(spec: ModuleSpec): GeneratedFile {
    const manifest = {
      name: spec.name,
      slug: spec.slug,
      version: '1.0.0',
      description: spec.description,
      type: spec.type,
      tier: spec.tier || 'starter',
      entry: 'index.tsx',
      icon: this.inferIcon(spec),
      category: this.inferCategory(spec),
      permissions: spec.permissions || { roles: ['admin', 'user'], default_role: 'user' },
      settings: spec.settings || [],
      pages: (spec.pages || []).map(p => ({
        name: p.name,
        title: p.title,
        path: p.path
      })),
      database: (spec.entities?.length || 0) > 0,
      api: (spec.api_endpoints?.length || 0) > 0
    };

    return {
      path: 'module.json',
      type: 'json',
      content: JSON.stringify(manifest, null, 2)
    };
  }

  /**
   * Generate database schema
   */
  private async generateSchema(spec: ModuleSpec): Promise<GeneratedFile> {
    const prompt = buildPrompt(CODE_GENERATION_PROMPTS.schema, {
      entities: JSON.stringify(spec.entities, null, 2),
      prefix: spec.slug.replace(/-/g, '_').substring(0, 8)
    });

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: 'You are an expert PostgreSQL database architect. Generate clean, well-structured SQL migrations with proper RLS policies. Return ONLY the SQL code, no markdown code blocks.',
      messages: [{ role: 'user', content: prompt }]
    });

    const content = this.cleanCodeBlock(
      response.content[0].type === 'text' ? response.content[0].text : ''
    );

    return {
      path: 'migrations/001_initial.sql',
      type: 'sql',
      content
    };
  }

  /**
   * Generate service for entity
   */
  private async generateService(spec: ModuleSpec, entity: EntitySpec): Promise<GeneratedFile> {
    const prompt = buildPrompt(CODE_GENERATION_PROMPTS.service, {
      entity: JSON.stringify(entity, null, 2)
    });

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: 'You are an expert TypeScript developer. Generate clean, type-safe service code that uses Supabase for database operations. Return ONLY the TypeScript code, no markdown code blocks.',
      messages: [{ role: 'user', content: prompt }]
    });

    const content = this.cleanCodeBlock(
      response.content[0].type === 'text' ? response.content[0].text : ''
    );

    return {
      path: `src/services/${entity.name}-service.ts`,
      type: 'ts',
      content
    };
  }

  /**
   * Generate React component
   */
  private async generateComponent(
    spec: ModuleSpec, 
    component: ComponentSpec,
    entity?: EntitySpec
  ): Promise<GeneratedFile> {
    const prompt = buildPrompt(CODE_GENERATION_PROMPTS.component, {
      component: JSON.stringify(component, null, 2),
      entity: entity ? JSON.stringify(entity, null, 2) : 'null'
    });

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: 'You are an expert React/TypeScript developer. Generate clean, accessible, and responsive components using Tailwind CSS and shadcn/ui patterns. Return ONLY the TypeScript/React code, no markdown code blocks.',
      messages: [{ role: 'user', content: prompt }]
    });

    const content = this.cleanCodeBlock(
      response.content[0].type === 'text' ? response.content[0].text : ''
    );

    return {
      path: `src/components/${component.name}.tsx`,
      type: 'tsx',
      content
    };
  }

  /**
   * Generate page component
   */
  private generatePage(spec: ModuleSpec, page: PageSpec): GeneratedFile {
    const pageComponents = spec.components?.filter(c => 
      page.components?.includes(c.name)
    ) || [];

    const imports = pageComponents.map(c => 
      `import { ${c.name} } from '../components/${c.name}';`
    ).join('\n');

    const componentRenders = pageComponents.map(c => 
      `        <Suspense fallback={<div className="animate-pulse bg-muted rounded-lg h-48" />}>
          <${c.name} />
        </Suspense>`
    ).join('\n');

    const content = `// ${page.title} Page
'use client';

import { Suspense } from 'react';
${imports}

export default function ${this.toPascalCase(page.name)}Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">${page.title}</h1>
      </div>
      
      <div className="space-y-4">
${componentRenders || '        <p>No components configured for this page.</p>'}
      </div>
    </div>
  );
}`;

    return {
      path: `src/pages/${page.name}/page.tsx`,
      type: 'tsx',
      content
    };
  }

  /**
   * Generate API route
   */
  private async generateAPIRoute(spec: ModuleSpec, endpoint: EndpointSpec): Promise<GeneratedFile> {
    const prompt = buildPrompt(CODE_GENERATION_PROMPTS.api, {
      endpoint: JSON.stringify(endpoint, null, 2)
    });

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: 'You are an expert Next.js API developer. Generate clean, secure API routes with proper validation and error handling. Return ONLY the TypeScript code, no markdown code blocks.',
      messages: [{ role: 'user', content: prompt }]
    });

    const content = this.cleanCodeBlock(
      response.content[0].type === 'text' ? response.content[0].text : ''
    );
    
    // Convert path to file path
    const filePath = endpoint.path
      .replace('/api/', 'src/api/')
      .replace(/\[(\w+)\]/g, '[$1]') + '/route.ts';

    return {
      path: filePath,
      type: 'ts',
      content
    };
  }

  /**
   * Generate module entry point
   */
  private generateEntryPoint(spec: ModuleSpec): GeneratedFile {
    const content = `// ${spec.name} Module Entry Point
'use client';

import { ModuleProvider } from '@/lib/modules/runtime/ModuleProvider';
import type { ModuleConfig } from '@/lib/modules/types';

// Import pages
${(spec.pages || []).map(p => 
  `import ${this.toPascalCase(p.name)}Page from './pages/${p.name}/page';`
).join('\n')}

// Module configuration
const config: ModuleConfig = {
  name: '${spec.name}',
  slug: '${spec.slug}',
  version: '1.0.0',
  type: '${spec.type}',
};

// Page routes
const routes = {
${(spec.pages || []).map(p => 
  `  '${p.path}': ${this.toPascalCase(p.name)}Page,`
).join('\n')}
};

export default function ${this.toPascalCase(spec.slug)}Module() {
  return (
    <ModuleProvider config={config}>
      {/* Module routes are handled by the runtime */}
    </ModuleProvider>
  );
}

export { routes, config };
`;

    return {
      path: 'index.tsx',
      type: 'tsx',
      content
    };
  }

  /**
   * Finalize and create actual module
   */
  async finalizeModule(specId: string, userId: string): Promise<string> {
    const { data: specData } = await supabase
      .from('ai_module_specs')
      .select('spec')
      .eq('id', specId)
      .single();

    const { data: codeFiles } = await supabase
      .from('ai_module_generated_code')
      .select('file_path, content')
      .eq('spec_id', specId);

    if (!specData || !codeFiles) {
      throw new Error('Spec or code not found');
    }

    const spec = specData.spec as ModuleSpec;

    // Bundle all files
    const bundle = codeFiles.reduce((acc, file) => {
      acc[file.file_path] = file.content;
      return acc;
    }, {} as Record<string, string>);

    // Create module in database
    const { data: module, error } = await supabase
      .from('modules')
      .insert({
        name: spec.name,
        slug: spec.slug,
        description: spec.description,
        type: spec.type,
        category: this.inferCategory(spec),
        status: 'draft',
        version: '1.0.0',
        code: JSON.stringify(bundle),
        manifest: codeFiles.find(f => f.file_path === 'module.json')?.content,
        created_by: userId
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create module: ${error.message}`);

    // Update session
    await supabase
      .from('ai_module_sessions')
      .update({ 
        status: 'complete',
        module_id: module.id
      })
      .eq('id', this.sessionId);

    // Mark spec as approved
    await supabase
      .from('ai_module_specs')
      .update({ 
        is_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: userId
      })
      .eq('id', specId);

    return module.id;
  }

  /**
   * Cancel the session
   */
  async cancelSession(): Promise<void> {
    await supabase
      .from('ai_module_sessions')
      .update({ status: 'cancelled' })
      .eq('id', this.sessionId);
  }

  /**
   * Get generated files for a spec
   */
  async getGeneratedFiles(specId: string): Promise<GeneratedFile[]> {
    const { data, error } = await supabase
      .from('ai_module_generated_code')
      .select('file_path, file_type, content')
      .eq('spec_id', specId);

    if (error) throw new Error(`Failed to get files: ${error.message}`);

    return (data || []).map(f => ({
      path: f.file_path,
      type: f.file_type,
      content: f.content
    }));
  }

  /**
   * Update a generated file
   */
  async updateFile(specId: string, filePath: string, content: string): Promise<void> {
    await supabase
      .from('ai_module_generated_code')
      .update({ 
        content,
        is_modified: true
      })
      .eq('spec_id', specId)
      .eq('file_path', filePath);
  }

  // Helper methods
  private cleanCodeBlock(content: string): string {
    return content
      .replace(/^```\w*\n?/gm, '')
      .replace(/\n?```$/gm, '')
      .trim();
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private inferCategory(spec: ModuleSpec): string {
    const typeCategories: Record<string, string> = {
      widget: 'widgets',
      app: 'business',
      integration: 'integrations',
      system: 'enterprise'
    };
    return typeCategories[spec.type] || 'other';
  }

  private inferIcon(spec: ModuleSpec): string {
    const typeIcons: Record<string, string> = {
      widget: 'Puzzle',
      app: 'LayoutDashboard',
      integration: 'Link2',
      system: 'Server'
    };
    return typeIcons[spec.type] || 'Package';
  }
}
