# Phase EM-23: AI Module Builder

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 15-20 hours
> **Prerequisites**: EM-01, EM-10, EM-22
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Implement **AI-powered module generation** from natural language descriptions:
1. Natural language to module specification
2. Automatic code generation
3. Database schema inference
4. Component generation
5. API endpoint creation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AI MODULE BUILDER                               │
├────────────────┬─────────────────┬──────────────────────────────────┤
│   NL PARSER    │   GENERATOR     │      ASSEMBLER                   │
├────────────────┼─────────────────┼──────────────────────────────────┤
│ Intent Extract │ Schema Gen      │ File Structure                   │
│ Entity Detect  │ Component Gen   │ Dependency Resolution            │
│ Feature Parse  │ API Gen         │ Validation                       │
│ Constraint ID  │ Style Gen       │ Preview Build                    │
└────────────────┴─────────────────┴──────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   OpenAI /   │
                    │   Claude     │
                    └──────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (30 mins)

```sql
-- migrations/em-23-ai-builder-schema.sql

-- AI Generation Sessions
CREATE TABLE ai_module_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'drafting' CHECK (status IN (
    'drafting', 'generating', 'reviewing', 'complete', 'failed', 'cancelled'
  )),
  
  -- Final module
  module_id UUID REFERENCES modules(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Messages
CREATE TABLE ai_module_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_module_sessions(id) ON DELETE CASCADE,
  
  -- Message
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Metadata
  tokens_used INTEGER,
  model TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Specifications
CREATE TABLE ai_module_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_module_sessions(id) ON DELETE CASCADE,
  
  -- Version
  version INTEGER DEFAULT 1,
  
  -- Spec content
  spec JSONB NOT NULL,
  /*
  {
    name: "Inventory Tracker",
    description: "...",
    type: "app",
    features: ["product list", "stock alerts", "categories"],
    entities: [
      { name: "product", fields: [...] }
    ],
    pages: [...],
    api_endpoints: [...],
    components: [...]
  }
  */
  
  -- Status
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Code
CREATE TABLE ai_module_generated_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_module_sessions(id) ON DELETE CASCADE,
  spec_id UUID NOT NULL REFERENCES ai_module_specs(id) ON DELETE CASCADE,
  
  -- Code content
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'sql', 'tsx', 'ts', 'json'
  content TEXT NOT NULL,
  
  -- Status
  is_modified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_sessions_agency ON ai_module_sessions(agency_id);
CREATE INDEX idx_ai_sessions_user ON ai_module_sessions(user_id);
CREATE INDEX idx_ai_messages_session ON ai_module_messages(session_id);
CREATE INDEX idx_ai_specs_session ON ai_module_specs(session_id);
CREATE INDEX idx_ai_code_session ON ai_module_generated_code(session_id);
```

---

### Task 2: AI Prompt Templates (1 hour)

```typescript
// src/lib/modules/ai-builder/prompts.ts

export const SYSTEM_PROMPT = `You are an expert module architect for the DRAMAC platform.
Your job is to help users design and build modules (business applications) that run on the platform.

DRAMAC modules can be:
- Widgets: Simple embeddable components (chat buttons, analytics badges)
- Apps: Full applications with databases and multiple pages (CRM, booking systems)
- Integrations: Connectors to external services (Stripe, QuickBooks)
- Systems: Complete enterprise solutions (hotel management, POS systems)

When designing a module, consider:
1. What data entities are needed (with fields and relationships)
2. What pages/views the user will interact with
3. What API endpoints are needed
4. What components should be generated
5. What permissions and roles are needed

Always structure your response as valid JSON when generating specifications.`;

export const SPEC_GENERATION_PROMPT = `Based on the conversation, generate a complete module specification.

The specification should include:
{
  "name": "Module Name",
  "slug": "module-name",
  "description": "What the module does",
  "type": "widget" | "app" | "integration" | "system",
  "tier": "free" | "starter" | "pro" | "enterprise",
  
  "features": [
    "Feature 1 description",
    "Feature 2 description"
  ],
  
  "entities": [
    {
      "name": "entity_name",
      "displayName": "Entity Name",
      "description": "What this entity represents",
      "fields": [
        {
          "name": "field_name",
          "type": "text" | "integer" | "decimal" | "boolean" | "timestamp" | "uuid" | "jsonb",
          "required": true | false,
          "unique": true | false,
          "indexed": true | false,
          "default": "default value or null",
          "references": { "entity": "other_entity", "field": "id" } | null
        }
      ]
    }
  ],
  
  "pages": [
    {
      "name": "page-slug",
      "title": "Page Title",
      "path": "/path",
      "description": "What this page shows",
      "components": ["component1", "component2"]
    }
  ],
  
  "api_endpoints": [
    {
      "path": "/api/module/[moduleId]/resource",
      "method": "GET" | "POST" | "PUT" | "DELETE",
      "description": "What this endpoint does",
      "auth": "public" | "user" | "admin"
    }
  ],
  
  "components": [
    {
      "name": "ComponentName",
      "type": "list" | "form" | "detail" | "dashboard" | "widget",
      "entity": "entity_name or null",
      "description": "What this component renders"
    }
  ],
  
  "permissions": {
    "roles": ["admin", "user", "viewer"],
    "default_role": "user"
  },
  
  "settings": [
    {
      "key": "setting_key",
      "type": "string" | "boolean" | "number",
      "label": "Setting Label",
      "default": "default value"
    }
  ]
}

Return ONLY the JSON specification, no additional text.`;

export const CODE_GENERATION_PROMPTS = {
  schema: `Generate PostgreSQL migration SQL for the following entities:
{{entities}}

Requirements:
- Use snake_case for table and column names
- Add UUID primary key 'id' to each table
- Add site_id foreign key for multi-tenancy
- Add created_at and updated_at timestamps
- Add proper indexes on foreign keys and commonly queried fields
- Enable RLS with policies for site_id isolation
- Use the naming pattern: mod_{{prefix}}_tablename

Return ONLY the SQL, no explanations.`,

  service: `Generate a TypeScript service for the following entity:
{{entity}}

The service should include:
- Type definitions for the entity
- CRUD operations (create, getById, getAll, update, delete)
- Use Supabase client for database operations
- Add pagination for list operations
- Add filtering and search capabilities
- Proper error handling and TypeScript types

Return ONLY the TypeScript code, no explanations.`,

  component: `Generate a React component for:
{{component}}

Requirements:
- Use TypeScript with proper types
- Use components from @/components/ui (Button, Card, Table, etc.)
- Handle loading and error states
- Use React Query for data fetching
- Support the entity: {{entity}}
- Make it responsive and accessible

Return ONLY the TypeScript React code, no explanations.`,

  api: `Generate a Next.js API route for:
{{endpoint}}

Requirements:
- Use Next.js 15 App Router format
- Proper request validation
- Error handling with appropriate HTTP status codes
- Use Supabase for database operations
- Verify authentication and authorization

Return ONLY the TypeScript code, no explanations.`
};
```

---

### Task 3: AI Service (3 hours)

```typescript
// src/lib/modules/ai-builder/ai-service.ts

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { 
  SYSTEM_PROMPT, 
  SPEC_GENERATION_PROMPT, 
  CODE_GENERATION_PROMPTS 
} from './prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  default: any;
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
  default: any;
}

export interface GeneratedFile {
  path: string;
  type: string;
  content: string;
}

export class AIModuleBuilderService {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Create new AI builder session
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

    if (error) throw error;
    return data.id;
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
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    // Add user message
    conversationHistory.push({ role: 'user', content: userMessage });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const assistantMessage = completion.choices[0].message.content || '';

    // Save messages
    await supabase.from('ai_module_messages').insert([
      { 
        session_id: this.sessionId, 
        role: 'user', 
        content: userMessage,
        tokens_used: completion.usage?.prompt_tokens || 0,
        model: 'gpt-4-turbo-preview'
      },
      { 
        session_id: this.sessionId, 
        role: 'assistant', 
        content: assistantMessage,
        tokens_used: completion.usage?.completion_tokens || 0,
        model: 'gpt-4-turbo-preview'
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

    // Generate specification
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: SPEC_GENERATION_PROMPT }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const specContent = completion.choices[0].message.content || '{}';
    const spec = JSON.parse(specContent) as ModuleSpec;

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
      files.push(await this.generateManifest(spec));

      // Generate database schema
      if (spec.entities.length > 0) {
        files.push(await this.generateSchema(spec));
      }

      // Generate services for each entity
      for (const entity of spec.entities) {
        files.push(await this.generateService(spec, entity));
      }

      // Generate components
      for (const component of spec.components) {
        const entity = spec.entities.find(e => e.name === component.entity);
        files.push(await this.generateComponent(spec, component, entity));
      }

      // Generate pages
      for (const page of spec.pages) {
        files.push(await this.generatePage(spec, page));
      }

      // Generate API routes
      for (const endpoint of spec.api_endpoints) {
        files.push(await this.generateAPIRoute(spec, endpoint));
      }

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
  private async generateManifest(spec: ModuleSpec): Promise<GeneratedFile> {
    const manifest = {
      name: spec.name,
      slug: spec.slug,
      version: '1.0.0',
      description: spec.description,
      type: spec.type,
      tier: spec.tier,
      entry: 'index.tsx',
      icon: 'Puzzle',
      category: this.inferCategory(spec),
      permissions: spec.permissions,
      settings: spec.settings,
      pages: spec.pages.map(p => ({
        name: p.name,
        title: p.title,
        path: p.path
      })),
      database: spec.entities.length > 0,
      api: spec.api_endpoints.length > 0
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
    const prompt = CODE_GENERATION_PROMPTS.schema
      .replace('{{entities}}', JSON.stringify(spec.entities, null, 2))
      .replace('{{prefix}}', spec.slug.replace(/-/g, '_').substring(0, 8));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an expert PostgreSQL database architect.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    return {
      path: 'migrations/001_initial.sql',
      type: 'sql',
      content: completion.choices[0].message.content || ''
    };
  }

  /**
   * Generate service for entity
   */
  private async generateService(spec: ModuleSpec, entity: EntitySpec): Promise<GeneratedFile> {
    const prompt = CODE_GENERATION_PROMPTS.service
      .replace('{{entity}}', JSON.stringify(entity, null, 2));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an expert TypeScript developer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    const content = this.cleanCodeBlock(completion.choices[0].message.content || '');

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
    const prompt = CODE_GENERATION_PROMPTS.component
      .replace('{{component}}', JSON.stringify(component, null, 2))
      .replace('{{entity}}', entity ? JSON.stringify(entity, null, 2) : 'null');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an expert React/TypeScript developer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    const content = this.cleanCodeBlock(completion.choices[0].message.content || '');

    return {
      path: `src/components/${component.name}.tsx`,
      type: 'tsx',
      content
    };
  }

  /**
   * Generate page component
   */
  private async generatePage(spec: ModuleSpec, page: PageSpec): Promise<GeneratedFile> {
    const pageComponents = spec.components.filter(c => 
      page.components.includes(c.name)
    );

    const content = `// ${page.title} Page
'use client';

import { Suspense } from 'react';
${pageComponents.map(c => `import { ${c.name} } from '@/components/${c.name}';`).join('\n')}

export default function ${this.toPascalCase(page.name)}Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">${page.title}</h1>
      ${pageComponents.map(c => `
      <Suspense fallback={<div>Loading...</div>}>
        <${c.name} />
      </Suspense>`).join('\n')}
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
    const prompt = CODE_GENERATION_PROMPTS.api
      .replace('{{endpoint}}', JSON.stringify(endpoint, null, 2));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an expert Next.js API developer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    const content = this.cleanCodeBlock(completion.choices[0].message.content || '');
    
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

    if (error) throw error;

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

  // Helper methods
  private cleanCodeBlock(content: string): string {
    return content
      .replace(/^```\w*\n?/, '')
      .replace(/\n?```$/, '')
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
}
```

---

### Task 4: AI Builder UI (3 hours)

```tsx
// src/components/modules/AIModuleBuilder.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription
} from '@/components/ui';
import { 
  Send, 
  Sparkles, 
  FileCode, 
  Database, 
  Layout,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Copy,
  Download
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeneratedFile {
  path: string;
  type: string;
  content: string;
}

export function AIModuleBuilder() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'chat' | 'spec' | 'code' | 'review'>('chat');
  const [spec, setSpec] = useState<any>(null);
  const [specId, setSpecId] = useState<string | null>(null);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start new session
  async function startSession() {
    const response = await fetch('/api/modules/ai-builder/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Module',
        description: 'AI-generated module'
      })
    });
    
    const { sessionId } = await response.json();
    setSessionId(sessionId);
    
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: `Hi! I'm the AI Module Builder. Tell me what kind of module you want to create.

For example:
- "I need a simple inventory tracking system"
- "Create a customer feedback widget"
- "Build a booking system for a salon"

What would you like to build?`,
      timestamp: new Date()
    }]);
  }

  useEffect(() => {
    startSession();
  }, []);

  // Send chat message
  async function sendMessage() {
    if (!input.trim() || !sessionId) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/modules/ai-builder/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: input
        })
      });

      const { response: aiResponse } = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  // Generate specification
  async function generateSpec() {
    if (!sessionId) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/modules/ai-builder/generate-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const { spec: generatedSpec, specId: newSpecId } = await response.json();
      
      setSpec(generatedSpec);
      setSpecId(newSpecId);
      setStep('spec');
    } catch (error) {
      console.error('Failed to generate spec:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Generate code from spec
  async function generateCode() {
    if (!sessionId || !specId) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/modules/ai-builder/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, specId })
      });

      const { files: generatedFiles } = await response.json();
      
      setFiles(generatedFiles);
      setSelectedFile(generatedFiles[0]?.path || null);
      setStep('code');
    } catch (error) {
      console.error('Failed to generate code:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Finalize module
  async function finalizeModule() {
    if (!sessionId || !specId) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/modules/ai-builder/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, specId })
      });

      const { moduleId } = await response.json();
      
      // Redirect to module editor
      window.location.href = `/studio/modules/${moduleId}`;
    } catch (error) {
      console.error('Failed to finalize module:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Copy file content
  function copyFile(content: string) {
    navigator.clipboard.writeText(content);
  }

  // Download all files
  function downloadAll() {
    const zip = files.map(f => `// ${f.path}\n${f.content}`).join('\n\n---\n\n');
    const blob = new Blob([zip], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spec?.slug || 'module'}-generated.txt`;
    a.click();
  }

  const selectedFileContent = files.find(f => f.path === selectedFile);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Left Panel - Chat or Spec */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Module Builder
              </CardTitle>
              
              {/* Step Indicator */}
              <div className="flex gap-2">
                {['chat', 'spec', 'code', 'review'].map((s, i) => (
                  <Badge
                    key={s}
                    variant={step === s ? 'default' : 'outline'}
                    className={step === s ? 'bg-purple-500' : ''}
                  >
                    {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {step === 'chat' && (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Thinking...
                        </div>
                      </div>
                    )}
                    
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Describe your module idea..."
                      disabled={isLoading}
                    />
                    <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button 
                      onClick={generateSpec} 
                      disabled={isLoading || messages.length < 3}
                      variant="outline"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Specification
                    </Button>
                  </div>
                </div>
              </>
            )}

            {step === 'spec' && spec && (
              <div className="p-4 overflow-auto">
                <h3 className="text-lg font-semibold mb-4">{spec.name}</h3>
                <p className="text-muted-foreground mb-6">{spec.description}</p>

                <Tabs defaultValue="entities">
                  <TabsList>
                    <TabsTrigger value="entities">
                      <Database className="h-4 w-4 mr-1" />
                      Entities ({spec.entities?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="pages">
                      <Layout className="h-4 w-4 mr-1" />
                      Pages ({spec.pages?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="components">
                      <FileCode className="h-4 w-4 mr-1" />
                      Components ({spec.components?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="entities" className="mt-4 space-y-4">
                    {spec.entities?.map((entity: any, i: number) => (
                      <Card key={i}>
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">{entity.displayName}</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-1">Field</th>
                                <th className="text-left py-1">Type</th>
                                <th className="text-left py-1">Required</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entity.fields?.map((field: any, j: number) => (
                                <tr key={j} className="border-b last:border-0">
                                  <td className="py-1">{field.name}</td>
                                  <td className="py-1">
                                    <Badge variant="outline">{field.type}</Badge>
                                  </td>
                                  <td className="py-1">
                                    {field.required && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="pages" className="mt-4 space-y-2">
                    {spec.pages?.map((page: any, i: number) => (
                      <Card key={i} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{page.title}</h4>
                            <p className="text-sm text-muted-foreground">{page.path}</p>
                          </div>
                          <Badge>{page.components?.length || 0} components</Badge>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="components" className="mt-4 space-y-2">
                    {spec.components?.map((comp: any, i: number) => (
                      <Card key={i} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{comp.name}</h4>
                            <p className="text-sm text-muted-foreground">{comp.description}</p>
                          </div>
                          <Badge variant="outline">{comp.type}</Badge>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>

                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setStep('chat')}>
                    Back to Chat
                  </Button>
                  <Button onClick={generateCode} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileCode className="h-4 w-4 mr-2" />
                    )}
                    Generate Code
                  </Button>
                </div>
              </div>
            )}

            {step === 'code' && (
              <div className="flex-1 flex">
                {/* File Tree */}
                <div className="w-64 border-r p-2 overflow-auto">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-sm font-medium">Files</span>
                    <Button size="sm" variant="ghost" onClick={downloadAll}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {files.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file.path)}
                      className={`w-full text-left px-2 py-1 rounded text-sm ${
                        selectedFile === file.path 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      {file.path}
                    </button>
                  ))}
                </div>

                {/* Code View */}
                <div className="flex-1 overflow-auto">
                  {selectedFileContent && (
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-2 z-10"
                        onClick={() => copyFile(selectedFileContent.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      <SyntaxHighlighter
                        language={selectedFileContent.type}
                        style={oneDark}
                        customStyle={{ margin: 0, minHeight: '100%' }}
                      >
                        {selectedFileContent.content}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          {step === 'code' && (
            <div className="p-4 border-t flex justify-between">
              <Button variant="outline" onClick={() => setStep('spec')}>
                Back to Specification
              </Button>
              <Button onClick={finalizeModule} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Create Module
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
```

---

### Task 5: API Routes (1 hour)

```typescript
// src/app/api/modules/ai-builder/session/route.ts

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { AIModuleBuilderService } from '@/lib/modules/ai-builder/ai-service';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, description } = await request.json();

  // Get user's agency
  const { data: membership } = await supabase
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'No agency found' }, { status: 400 });
  }

  const sessionId = await AIModuleBuilderService.createSession(
    membership.agency_id,
    user.id,
    name,
    description
  );

  return NextResponse.json({ sessionId });
}
```

```typescript
// src/app/api/modules/ai-builder/chat/route.ts

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { AIModuleBuilderService } from '@/lib/modules/ai-builder/ai-service';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId, message } = await request.json();

  const service = new AIModuleBuilderService(sessionId);
  const response = await service.chat(message);

  return NextResponse.json({ response });
}
```

```typescript
// src/app/api/modules/ai-builder/generate-spec/route.ts

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { AIModuleBuilderService } from '@/lib/modules/ai-builder/ai-service';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = await request.json();

  const service = new AIModuleBuilderService(sessionId);
  const spec = await service.generateSpec();

  // Get spec ID from database
  const { data: specRecord } = await supabase
    .from('ai_module_specs')
    .select('id')
    .eq('session_id', sessionId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ 
    spec, 
    specId: specRecord?.id 
  });
}
```

```typescript
// src/app/api/modules/ai-builder/generate-code/route.ts

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { AIModuleBuilderService } from '@/lib/modules/ai-builder/ai-service';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId, specId } = await request.json();

  const service = new AIModuleBuilderService(sessionId);
  const files = await service.generateCode(specId);

  return NextResponse.json({ files });
}
```

```typescript
// src/app/api/modules/ai-builder/finalize/route.ts

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { AIModuleBuilderService } from '@/lib/modules/ai-builder/ai-service';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId, specId } = await request.json();

  const service = new AIModuleBuilderService(sessionId);
  const moduleId = await service.finalizeModule(specId, user.id);

  return NextResponse.json({ moduleId });
}
```

---

## ✅ Verification Checklist

- [ ] Session creates correctly
- [ ] Chat history persists
- [ ] Spec generates from conversation
- [ ] Entities are well-defined
- [ ] SQL migrations are valid
- [ ] TypeScript code compiles
- [ ] React components render
- [ ] API routes are correct
- [ ] Module finalizes successfully
- [ ] Can edit generated code

---

## 📍 Dependencies

- **Requires**: EM-01, EM-10, EM-22 (templates)
- **Required by**: Rapid module development
- **External**: OpenAI API key
