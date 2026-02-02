# TASK: Generate Implementation Phases - WAVE 4 (AI Integration)

You are a senior software architect. Wave 3 (Field System) has been successfully implemented. Now generate the **next 3 AI integration phases** for DRAMAC Studio.

## ✅ Wave 3 Completion Status

The following has been implemented:

### Files Created (Wave 3):
```
src/lib/studio/fields/
  ├── color-field-editor.tsx         ✅ Visual color picker with presets
  ├── image-field-editor.tsx         ✅ Upload/URL + preview
  ├── link-field-editor.tsx          ✅ Page picker + external URLs
  ├── spacing-field-editor.tsx       ✅ Visual box model (margin/padding)
  ├── typography-field-editor.tsx    ✅ Font controls with live preview
  ├── array-field-editor.tsx         ✅ Add/remove/reorder items
  └── object-field-editor.tsx        ✅ Nested fields in accordion

src/components/studio/
  ├── layout/
  │   └── breakpoint-selector.tsx    ✅ 📱 💻 🖥️ toolbar buttons
  └── fields/
      └── responsive-field-wrapper.tsx ✅ Per-breakpoint editing toggle

src/lib/studio/store/
  └── ui-store.ts                    ✅ Added currentBreakpoint tracking

All 10 components updated:
  ✅ Section - color, image, spacing (responsive) fields
  ✅ Container - spacing (responsive), max width fields
  ✅ Columns - number (responsive cols), spacing fields
  ✅ Heading - typography (responsive), color, gradient
  ✅ Text - typography (responsive), color
  ✅ Button - color, spacing, link fields
  ✅ Image - image, spacing (responsive) fields
  ✅ Spacer - spacing (responsive height) field
  ✅ Divider - color, spacing (responsive) fields
  ✅ Icon - color, number (responsive size) field
```

### Current State:
- ✅ 7 advanced field types working (color, image, link, spacing, typography, array, object)
- ✅ Breakpoint selector in toolbar
- ✅ Responsive field editing (toggle per field to enable per-breakpoint values)
- ✅ Canvas width changes based on selected breakpoint
- ✅ All components render correctly at all breakpoints
- ✅ Properties panel shows/edits current breakpoint's value
- ✅ Converting between responsive/non-responsive preserves data

### What's Missing (Wave 4 Will Add):
- ❌ AI chat per component
- ❌ AI can suggest/modify component props
- ❌ AI page generator (full page from prompt)
- ❌ AI quick actions (translate, shorten, improve)
- ❌ AI context aware of component type and current props
- ❌ Preview AI changes before applying

---

## 🎯 Generate These Phases (Wave 4):

1. **PHASE-STUDIO-11: AI Component Chat**
2. **PHASE-STUDIO-12: AI Page Generator**
3. **PHASE-STUDIO-13: AI Suggestions & Quick Actions**

## Expected Outcome After Wave 4

After implementing these 3 phases, we should have:
- ✅ "Ask AI" button in properties panel for selected component
- ✅ AI chat panel opens with component context pre-loaded
- ✅ User can type natural language requests ("make it blue", "add urgency")
- ✅ AI returns prop changes as JSON
- ✅ Preview changes before applying
- ✅ Apply or reject AI suggestions
- ✅ Full page generator wizard (prompt → complete page layout)
- ✅ AI quick action chips (Translate, Shorten, Improve, etc.)
- ✅ Chat history stored per editing session
- ✅ AI respects component field types and constraints

---

## Key Implementation Context

### Existing AI Infrastructure (Already in DRAMAC)

The platform already has AI integration:

```typescript
// Existing in src/lib/ai/ (DO NOT RECREATE)
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';

// These are already set up and working
// Reference them in your implementation
```

Environment variables already configured:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

### Component Context Available

From Wave 1-3, we have full access to:

```typescript
// From selection store
const { selectedId } = useSelectionStore();

// From editor store  
const { data, updateComponent } = useEditorStore();
const component = data.components[selectedId];

// From registry
const { definition } = useComponent(component.type);

// So AI has access to:
{
  componentType: component.type,           // "Heading"
  currentProps: component.props,           // { text: "Hello", fontSize: {...} }
  fields: definition.fields,               // Field definitions with types
  aiContext: definition.ai,                // AI description & suggestions
  pageTitle: data.root.props.title,        // Page context
  allComponents: Object.values(data.components) // Other content
}
```

---

## Requirements for Each Phase

### PHASE-STUDIO-11: AI Component Chat

Must implement:

#### 1. AI Chat UI Component

```typescript
// src/components/studio/ai/ai-component-chat.tsx
interface AIComponentChatProps {
  componentId: string;
  onClose: () => void;
}

const AIComponentChat: React.FC<AIComponentChatProps> = ({ componentId, onClose }) => {
  // Features:
  // - Chat input at bottom
  // - Message history (user messages + AI responses)
  // - Preview AI changes before applying
  // - Apply/Reject buttons
  // - Loading state while AI responds
  // - Error handling
  // - Close button
};
```

Should appear as a popover or slide-in panel from the properties panel.

#### 2. AI Chat Store

```typescript
// src/lib/studio/store/ai-store.ts
interface AIStore {
  isOpen: boolean;
  chatHistory: ChatMessage[];
  pendingChanges: Partial<Record<string, unknown>> | null;
  isLoading: boolean;
  
  openChat: (componentId: string) => void;
  closeChat: () => void;
  sendMessage: (message: string) => Promise<void>;
  applyChanges: () => void;
  rejectChanges: () => void;
  clearHistory: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  proposedChanges?: Record<string, unknown>;
}
```

#### 3. AI API Route

```typescript
// src/app/api/studio/ai/component/route.ts
export async function POST(request: Request) {
  const { componentType, currentProps, fields, userMessage } = await request.json();
  
  // Build system prompt with component context
  const systemPrompt = buildComponentSystemPrompt(componentType, currentProps, fields);
  
  // Call Claude via AI SDK
  const result = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: systemPrompt,
    prompt: userMessage,
  });
  
  // Parse JSON response
  const proposedChanges = JSON.parse(result.text);
  
  return Response.json({
    changes: proposedChanges,
    explanation: "Brief explanation of changes",
  });
}
```

#### 4. System Prompt Builder

```typescript
// src/lib/studio/ai/prompts.ts
export function buildComponentSystemPrompt(
  componentType: string,
  currentProps: Record<string, unknown>,
  fields: Record<string, FieldDefinition>,
  aiContext?: ComponentDefinition['ai']
): string {
  return `You are an AI assistant helping edit a ${componentType} component in DRAMAC Studio.

COMPONENT CONTEXT:
${aiContext?.description || `A ${componentType} component`}

CURRENT PROPERTIES:
${JSON.stringify(currentProps, null, 2)}

AVAILABLE FIELDS:
${Object.entries(fields).map(([name, field]) => 
  `- ${name}: ${field.type} (${field.label})`
).join('\n')}

${aiContext?.canModify ? `You can modify: ${aiContext.canModify.join(', ')}` : ''}

USER REQUEST:
{userMessage}

RESPONSE INSTRUCTIONS:
1. Return ONLY a JSON object with proposed prop changes
2. Include ONLY props you want to change
3. Respect field types (color = hex/css, spacing = {top, right, bottom, left}, etc.)
4. For ResponsiveValue fields, provide { mobile, tablet?, desktop? }
5. Be creative but professional
6. Keep text length similar unless asked to shorten/expand
7. NO explanations in JSON - separate "explanation" field will be added

IMPORTANT: Respond with ONLY valid JSON. No markdown, no code blocks, just JSON.`;
}
```

#### 5. Integration in Properties Panel

Add "Ask AI" button to properties panel header:

```typescript
// Modify src/components/studio/panels/right-panel.tsx
const RightPanel = () => {
  const { selectedId } = useSelectionStore();
  const { openChat } = useAIStore();
  
  return (
    <div>
      <div className="flex items-center justify-between p-4 border-b">
        <h3>Properties</h3>
        {selectedId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openChat(selectedId)}
          >
            ✨ Ask AI
          </Button>
        )}
      </div>
      {/* ... fields ... */}
      
      <AIComponentChat /> {/* Render if open */}
    </div>
  );
};
```

#### 6. Change Preview UI

Show a diff of what will change:

```typescript
// src/components/studio/ai/change-preview.tsx
const ChangePreview: React.FC<{ 
  currentProps: any; 
  proposedChanges: any;
}> = ({ currentProps, proposedChanges }) => {
  return (
    <div className="bg-muted p-4 rounded-lg">
      <h4 className="font-semibold mb-2">Proposed Changes:</h4>
      {Object.entries(proposedChanges).map(([key, newValue]) => (
        <div key={key} className="flex gap-2 text-sm">
          <span className="text-muted-foreground">{key}:</span>
          <span className="line-through text-red-500">
            {JSON.stringify(currentProps[key])}
          </span>
          <span className="text-green-500">→</span>
          <span className="text-green-500">
            {JSON.stringify(newValue)}
          </span>
        </div>
      ))}
    </div>
  );
};
```

---

### PHASE-STUDIO-12: AI Page Generator

Must implement:

#### 1. Page Generator Wizard

```typescript
// src/components/studio/ai/ai-page-generator.tsx
const AIPageGenerator: React.FC = () => {
  // Multi-step wizard:
  // Step 1: Prompt input (large textarea)
  // Step 2: Options (business type, color scheme, modules)
  // Step 3: Generating... (loading with progress)
  // Step 4: Preview (show generated page)
  // Step 5: Apply or regenerate
};
```

Accessible from:
- Empty canvas (no components yet)
- Toolbar "Generate Page" button
- File menu

#### 2. AI API Route for Page Generation

```typescript
// src/app/api/studio/ai/generate-page/route.ts
export async function POST(request: Request) {
  const { prompt, businessType, colorScheme, siteId } = await request.json();
  
  // Get available components (core + installed modules)
  const availableComponents = await getAvailableComponents(siteId);
  
  // Build system prompt for page generation
  const systemPrompt = buildPageGenerationPrompt(availableComponents);
  
  // Call Claude
  const result = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: systemPrompt,
    prompt: `Generate a page for: ${prompt}. Business type: ${businessType}. Color: ${colorScheme}`,
  });
  
  // Parse the StudioPageData JSON
  const pageData: StudioPageData = JSON.parse(result.text);
  
  return Response.json({
    data: pageData,
    explanation: "Generated landing page with hero, features, and CTA sections",
  });
}
```

#### 3. Page Generation System Prompt

```typescript
// src/lib/studio/ai/page-generation-prompts.ts
export function buildPageGenerationPrompt(
  availableComponents: ComponentDefinition[]
): string {
  return `You are DRAMAC Studio AI - an expert website page generator.

AVAILABLE COMPONENTS:
${availableComponents.map(c => 
  `- ${c.type} (${c.category}): ${c.ai?.description || c.label}`
).join('\n')}

TASK:
Generate a complete page layout based on the user's request.

OUTPUT FORMAT:
Return a valid StudioPageData JSON object with this structure:
{
  "version": "1.0",
  "root": {
    "id": "root",
    "type": "Root",
    "props": { "title": "Page Title" },
    "children": ["comp-1", "comp-2"]
  },
  "components": {
    "comp-1": {
      "id": "comp-1",
      "type": "Section",
      "props": { /* all required props with good default values */ },
      "children": ["comp-2"]
    }
    // ... more components
  }
}

GUIDELINES:
1. Create a logical page structure (sections → containers → content)
2. Use mobile-first responsive values: { mobile: "16px", desktop: "64px" }
3. Choose appropriate components for the content
4. Set sensible default values for all props
5. Use the provided color scheme
6. Make it professional and modern
7. Include 5-10 components total
8. Nest components logically (Sections contain Containers, etc.)

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations outside JSON.`;
}
```

#### 4. Integration in Toolbar

```typescript
// Modify src/components/studio/layout/studio-toolbar.tsx
const StudioToolbar = () => {
  const [showGenerator, setShowGenerator] = useState(false);
  
  return (
    <div className="flex items-center gap-2">
      {/* ... existing toolbar items ... */}
      
      <Button
        variant="outline"
        onClick={() => setShowGenerator(true)}
      >
        ✨ Generate Page
      </Button>
      
      {showGenerator && (
        <Dialog open onOpenChange={setShowGenerator}>
          <DialogContent className="max-w-2xl">
            <AIPageGenerator onClose={() => setShowGenerator(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
```

---

### PHASE-STUDIO-13: AI Suggestions & Quick Actions

Must implement:

#### 1. Quick Action Buttons

```typescript
// src/components/studio/ai/quick-actions.tsx
const QuickActions: React.FC<{ componentId: string }> = ({ componentId }) => {
  const actions = [
    { label: 'Translate', prompt: 'Translate to Spanish' },
    { label: 'Shorten', prompt: 'Make this text shorter and more concise' },
    { label: 'Improve', prompt: 'Improve the copy to be more engaging' },
    { label: 'Add Emoji', prompt: 'Add relevant emoji to the text' },
    { label: 'Professional', prompt: 'Make the tone more professional' },
    { label: 'Casual', prompt: 'Make the tone more casual and friendly' },
  ];
  
  const handleQuickAction = async (prompt: string) => {
    // Same as sending AI chat message, but auto-applies
    await sendAIMessage(componentId, prompt, { autoApply: true });
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(action => (
        <Button
          key={action.label}
          size="sm"
          variant="ghost"
          onClick={() => handleQuickAction(action.prompt)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};
```

Add to properties panel below field editors for text-heavy components.

#### 2. Contextual Suggestions (Optional Enhancement)

```typescript
// src/components/studio/ai/ai-suggestions.tsx
const AISuggestions: React.FC<{ componentId: string }> = ({ componentId }) => {
  const component = useEditorStore(s => s.data.components[componentId]);
  const { definition } = useComponent(component.type);
  
  // Show suggestions from definition.ai.suggestions if available
  const suggestions = definition.ai?.suggestions || [];
  
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Suggestions:</p>
      {suggestions.map(suggestion => (
        <Button
          key={suggestion}
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => sendAIMessage(componentId, suggestion)}
        >
          💡 {suggestion}
        </Button>
      ))}
    </div>
  );
};
```

#### 3. Inline AI in Rich Text Fields (Future Enhancement)

For components with rich text:
- Add AI assistant button in text editor toolbar
- "Rewrite", "Expand", "Summarize" options
- Works inline without opening separate chat

---

## Important Constraints

1. **Use existing AI SDK** - Don't recreate AI infrastructure, use @ai-sdk/anthropic
2. **Respect field types** - AI must return valid values for color, spacing, responsive, etc.
3. **Error handling** - Handle invalid JSON, API errors, rate limits gracefully
4. **Loading states** - Show spinner/skeleton while AI processes
5. **Cost awareness** - Consider caching, rate limiting (don't send every keystroke)
6. **Privacy** - Don't send sensitive data (user info, API keys)
7. **Undo/redo** - AI changes should be undoable just like manual edits
8. **TypeScript strict** - Must compile with zero errors

---

## AI Response Format Examples

### Component Chat Response

```json
{
  "changes": {
    "text": "Unlock Your Potential Today! 🚀",
    "fontSize": { "mobile": "32px", "desktop": "56px" },
    "color": "#FF6B6B"
  },
  "explanation": "Made the heading more exciting with an emoji and larger desktop font size"
}
```

### Page Generation Response

```json
{
  "version": "1.0",
  "root": {
    "id": "root",
    "type": "Root",
    "props": {
      "title": "Fitness App Landing Page"
    },
    "children": ["hero-section", "features-section", "cta-section"]
  },
  "components": {
    "hero-section": {
      "id": "hero-section",
      "type": "Section",
      "props": {
        "backgroundColor": "#1A1A2E",
        "padding": { "mobile": "48px 16px", "desktop": "96px 24px" },
        "minHeight": { "mobile": "400px", "desktop": "600px" }
      },
      "children": ["hero-container"]
    },
    "hero-container": {
      "id": "hero-container",
      "type": "Container",
      "props": {
        "maxWidth": "1200px"
      },
      "children": ["hero-heading", "hero-text", "hero-button"]
    }
    // ... more components
  }
}
```

---

## Testing Requirements

After Wave 4:

### AI Component Chat Testing
- [ ] Click "Ask AI" opens chat
- [ ] Type "make it blue" → AI returns color change
- [ ] Preview shows before/after
- [ ] Apply updates component props
- [ ] Reject keeps original props
- [ ] Chat history persists during session
- [ ] Works with all component types
- [ ] Handles responsive field updates
- [ ] Shows loading state
- [ ] Handles API errors gracefully

### AI Page Generator Testing
- [ ] Click "Generate Page" opens wizard
- [ ] Enter prompt "landing page for gym"
- [ ] Generated page has logical structure
- [ ] Components are valid and render
- [ ] Props have sensible defaults
- [ ] Responsive values are mobile-first
- [ ] Can regenerate with different prompt
- [ ] Can apply to empty canvas
- [ ] Replaces existing page (with confirmation)

### Quick Actions Testing
- [ ] Quick action buttons appear for text components
- [ ] Click "Shorten" → text gets shorter
- [ ] Click "Translate" → text translates
- [ ] Changes are undoable
- [ ] Loading indicator shows during processing

---

## Output Format

Generate each phase as a complete markdown document with:

```markdown
# PHASE-STUDIO-XX: [Title]

## Overview
| Property | Value |
|----------|-------|
| Phase | STUDIO-XX |
| Priority | High |
| Estimated Time | X hours |
| Dependencies | STUDIO-09, STUDIO-10 |

## Problem Statement
[What this phase solves]

## Implementation Tasks

### Task 1: [Specific task name]

**Files to create:**
- `src/path/to/file.tsx`

**Complete code:**
```typescript
// Full implementation
```

**Acceptance Criteria:**
- [ ] Specific testable criterion

## Testing Instructions

## Success Criteria
```

---

## Dependencies Already Installed

From Wave 1:
- ✅ @ai-sdk/anthropic
- ✅ ai (Vercel AI SDK)

No new packages needed for Wave 4!

---

## Start Now

Generate **PHASE-STUDIO-11** first (AI Component Chat), then **PHASE-STUDIO-12** (AI Page Generator), then **PHASE-STUDIO-13** (AI Suggestions & Quick Actions).

Each phase should be detailed enough that an AI agent can implement it without additional context beyond this prompt and the master prompt.

---

# MASTER PROMPT FOLLOWS BELOW

[Paste the contents of PHASE-STUDIO-00-MASTER-PROMPT.md here]
