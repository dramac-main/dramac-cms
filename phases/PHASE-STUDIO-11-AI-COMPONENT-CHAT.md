# PHASE-STUDIO-11: AI Component Chat

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-11 |
| Title | AI Component Chat |
| Priority | High |
| Estimated Time | 8-10 hours |
| Dependencies | STUDIO-09, STUDIO-10 (Wave 3 complete) |
| Risk Level | Medium |

## Problem Statement

Users need an intuitive way to edit component properties using natural language. Instead of manually adjusting colors, text, and styling through form fields, users should be able to describe what they want ("make this heading more exciting", "change to blue theme") and have AI suggest appropriate prop changes.

Currently, there's no AI integration in the Studio editor properties panel. This phase adds a per-component AI chat that understands the component's current state, field definitions, and can propose valid changes that respect data types and responsive values.

## Goals

- [ ] Add "Ask AI" button to properties panel for selected component
- [ ] Create AI chat panel UI (slide-in from right)
- [ ] Build AI context from component type, current props, and field definitions
- [ ] Create API route for component-level AI requests
- [ ] Show preview of proposed changes before applying
- [ ] Allow user to apply or reject AI suggestions
- [ ] Store chat history for the current editing session
- [ ] Handle all field types correctly (colors, spacing, responsive values)
- [ ] Integrate with existing Anthropic AI SDK infrastructure

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Properties Panel                                 │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  [Component: Heading]                       [✨ Ask AI]            │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  Text: [Hello World_____]                                          │ │
│  │  Font Size: { mobile: 24px, desktop: 48px }                        │ │
│  │  Color: #333333                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─────────────────── AI Chat Panel (slides in) ─────────────────────┐ │
│  │  ✨ AI Assistant                                           [×]    │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │ [User]: Make this heading more exciting and blue            │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │ [AI]: Here's what I suggest:                                │  │ │
│  │  │                                                             │  │ │
│  │  │ ┌─ Proposed Changes ────────────────────────────────────┐   │  │ │
│  │  │ │ text: "Hello World" → "🚀 Welcome to the Future!"    │   │  │ │
│  │  │ │ color: "#333333" → "#3B82F6"                         │   │  │ │
│  │  │ └───────────────────────────────────────────────────────┘   │  │ │
│  │  │                                                             │  │ │
│  │  │ [Apply Changes]  [Reject]  [Modify Request]                 │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │ [Type your request...]                            [Send →] │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User clicks "Ask AI" button in properties panel
2. AI store opens chat with current component context
3. User types request, chat sends to API
4. API builds prompt with component context and calls Claude
5. Claude returns JSON with proposed prop changes
6. UI shows preview of changes (before/after diff)
7. User applies (updates store) or rejects (discards)
8. Chat history preserved for follow-up requests

## Implementation Tasks

### Task 1: Create AI Store

**Description:** Zustand store to manage AI chat state, history, and pending changes.

**Files:**
- CREATE: `src/lib/studio/store/ai-store.ts`
- MODIFY: `src/lib/studio/store/index.ts`

**Code:**

```typescript
// src/lib/studio/store/ai-store.ts
/**
 * DRAMAC Studio AI Store
 * 
 * Manages AI chat state, conversation history, and pending changes.
 */

import { create } from "zustand";
import { nanoid } from "nanoid";

// =============================================================================
// TYPES
// =============================================================================

export interface ChatMessage {
  /** Unique message ID */
  id: string;
  
  /** Message role */
  role: "user" | "assistant" | "system";
  
  /** Message content */
  content: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Proposed prop changes (assistant messages only) */
  proposedChanges?: Record<string, unknown>;
  
  /** Explanation of changes (assistant messages only) */
  explanation?: string;
  
  /** Error message if AI request failed */
  error?: string;
  
  /** Is this message still loading? */
  isLoading?: boolean;
}

export interface AIState {
  /** Is chat panel open */
  isOpen: boolean;
  
  /** Currently active component ID */
  activeComponentId: string | null;
  
  /** Chat history for current component */
  chatHistory: ChatMessage[];
  
  /** Pending changes awaiting user approval */
  pendingChanges: Record<string, unknown> | null;
  
  /** Pending changes explanation */
  pendingExplanation: string | null;
  
  /** Is AI request in progress */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
}

export interface AIActions {
  /** Open chat for a specific component */
  openChat: (componentId: string) => void;
  
  /** Close chat panel */
  closeChat: () => void;
  
  /** Send a message to AI */
  sendMessage: (message: string) => Promise<void>;
  
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  
  /** Add message to history */
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  
  /** Update last message (for streaming or corrections) */
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  
  /** Set pending changes from AI response */
  setPendingChanges: (changes: Record<string, unknown> | null, explanation?: string) => void;
  
  /** Apply pending changes to component */
  applyChanges: () => void;
  
  /** Reject pending changes */
  rejectChanges: () => void;
  
  /** Clear chat history */
  clearHistory: () => void;
  
  /** Set error */
  setError: (error: string | null) => void;
}

export type AIStore = AIState & AIActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: AIState = {
  isOpen: false,
  activeComponentId: null,
  chatHistory: [],
  pendingChanges: null,
  pendingExplanation: null,
  isLoading: false,
  error: null,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useAIStore = create<AIStore>()((set, get) => ({
  ...initialState,

  openChat: (componentId: string) => {
    const { activeComponentId } = get();
    
    // If switching components, clear history
    if (activeComponentId !== componentId) {
      set({
        isOpen: true,
        activeComponentId: componentId,
        chatHistory: [],
        pendingChanges: null,
        pendingExplanation: null,
        error: null,
      });
    } else {
      set({ isOpen: true });
    }
  },

  closeChat: () => {
    set({ 
      isOpen: false,
      pendingChanges: null,
      pendingExplanation: null,
    });
  },

  sendMessage: async (message: string) => {
    // Implementation delegated to component - store just tracks state
    // The component will call addMessage, setLoading, etc.
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: nanoid(),
      timestamp: new Date(),
    };
    
    set((state) => ({
      chatHistory: [...state.chatHistory, newMessage],
    }));
  },

  updateLastMessage: (updates) => {
    set((state) => {
      const history = [...state.chatHistory];
      if (history.length > 0) {
        history[history.length - 1] = {
          ...history[history.length - 1],
          ...updates,
        };
      }
      return { chatHistory: history };
    });
  },

  setPendingChanges: (changes, explanation) => {
    set({
      pendingChanges: changes,
      pendingExplanation: explanation || null,
    });
  },

  applyChanges: () => {
    // Store just clears pending - actual application done by component
    // with access to editor store
    set({
      pendingChanges: null,
      pendingExplanation: null,
    });
  },

  rejectChanges: () => {
    const { addMessage, pendingChanges } = get();
    
    if (pendingChanges) {
      addMessage({
        role: "system",
        content: "Changes rejected by user.",
      });
    }
    
    set({
      pendingChanges: null,
      pendingExplanation: null,
    });
  },

  clearHistory: () => {
    set({
      chatHistory: [],
      pendingChanges: null,
      pendingExplanation: null,
      error: null,
    });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },
}));

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/** Check if chat is open for a specific component */
export const useIsAIChatOpen = (componentId: string) => 
  useAIStore((s) => s.isOpen && s.activeComponentId === componentId);

/** Get chat history */
export const useChatHistory = () => useAIStore((s) => s.chatHistory);

/** Get pending changes */
export const usePendingChanges = () => useAIStore((s) => ({
  changes: s.pendingChanges,
  explanation: s.pendingExplanation,
}));

/** Check if AI is loading */
export const useAILoading = () => useAIStore((s) => s.isLoading);
```

**Update index.ts:**

```typescript
// src/lib/studio/store/index.ts
export * from "./editor-store";
export * from "./ui-store";
export * from "./selection-store";
export * from "./ai-store"; // ADD THIS LINE
```

**Acceptance Criteria:**
- [ ] AI store created with all state and actions
- [ ] Exports added to index.ts
- [ ] No TypeScript errors

---

### Task 2: Create AI Prompt Builder

**Description:** Utilities to build context-aware system prompts for component editing.

**Files:**
- CREATE: `src/lib/studio/ai/prompts.ts`
- CREATE: `src/lib/studio/ai/types.ts`
- CREATE: `src/lib/studio/ai/index.ts`

**Code:**

```typescript
// src/lib/studio/ai/types.ts
/**
 * AI Types for DRAMAC Studio
 */

import type { ComponentDefinition, FieldDefinition } from "@/types/studio";

/**
 * Context provided to AI for component editing
 */
export interface AIComponentContext {
  /** Component type name */
  componentType: string;
  
  /** Current component props */
  currentProps: Record<string, unknown>;
  
  /** Component label for display */
  componentLabel: string;
  
  /** Component description */
  componentDescription?: string;
  
  /** Field definitions with types */
  fields: Record<string, FieldDefinition>;
  
  /** AI-specific context from component definition */
  aiContext?: ComponentDefinition["ai"];
  
  /** Page context for broader awareness */
  pageContext?: {
    title?: string;
    description?: string;
    otherComponentTypes?: string[];
  };
}

/**
 * AI response for component prop changes
 */
export interface AIComponentResponse {
  /** Proposed prop changes (only changed props) */
  changes: Record<string, unknown>;
  
  /** Explanation of what was changed and why */
  explanation: string;
}

/**
 * Request body for component AI API
 */
export interface AIComponentRequest {
  /** Component context */
  context: AIComponentContext;
  
  /** User's request message */
  userMessage: string;
  
  /** Previous conversation for context */
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

/**
 * Field type formatting info for AI
 */
export interface FieldTypeInfo {
  type: string;
  description: string;
  example: string;
}
```

```typescript
// src/lib/studio/ai/prompts.ts
/**
 * AI Prompt Builders for DRAMAC Studio
 * 
 * Builds context-aware prompts for component editing.
 */

import type { FieldDefinition, FieldType } from "@/types/studio";
import type { AIComponentContext, FieldTypeInfo } from "./types";

// =============================================================================
// FIELD TYPE DESCRIPTIONS
// =============================================================================

const FIELD_TYPE_INFO: Record<FieldType, FieldTypeInfo> = {
  text: {
    type: "text",
    description: "Single line text string",
    example: '"Hello World"',
  },
  textarea: {
    type: "textarea",
    description: "Multi-line text string",
    example: '"Line 1\\nLine 2\\nLine 3"',
  },
  number: {
    type: "number",
    description: "Numeric value",
    example: "42",
  },
  select: {
    type: "select",
    description: "One of predefined options",
    example: '"option1"',
  },
  radio: {
    type: "radio",
    description: "One of predefined options",
    example: '"option1"',
  },
  checkbox: {
    type: "checkbox",
    description: "Boolean true/false",
    example: "true",
  },
  toggle: {
    type: "toggle",
    description: "Boolean on/off",
    example: "true",
  },
  color: {
    type: "color",
    description: "CSS color value (hex preferred)",
    example: '"#3B82F6" or "rgb(59, 130, 246)" or "blue"',
  },
  image: {
    type: "image",
    description: "Image object with URL and optional alt text",
    example: '{ "url": "https://example.com/image.jpg", "alt": "Description" }',
  },
  link: {
    type: "link",
    description: "Link object with URL/href and optional target",
    example: '{ "href": "/page", "target": "_blank", "label": "Click here" }',
  },
  spacing: {
    type: "spacing",
    description: "Spacing object with top/right/bottom/left values",
    example: '{ "top": "16px", "right": "24px", "bottom": "16px", "left": "24px" }',
  },
  typography: {
    type: "typography",
    description: "Typography settings object",
    example: '{ "fontFamily": "Inter", "fontSize": "18px", "fontWeight": "600", "lineHeight": "1.5" }',
  },
  array: {
    type: "array",
    description: "Array of items with defined structure",
    example: '[{ "title": "Item 1" }, { "title": "Item 2" }]',
  },
  object: {
    type: "object",
    description: "Nested object with defined fields",
    example: '{ "title": "Hello", "description": "World" }',
  },
  richtext: {
    type: "richtext",
    description: "HTML content string",
    example: '"<p>Hello <strong>World</strong></p>"',
  },
  code: {
    type: "code",
    description: "Code string",
    example: '"const x = 1;"',
  },
  slider: {
    type: "slider",
    description: "Numeric value from range",
    example: "50",
  },
  custom: {
    type: "custom",
    description: "Custom field (check current value for format)",
    example: "(varies)",
  },
};

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

/**
 * Format field definitions for AI prompt
 */
function formatFieldsForPrompt(fields: Record<string, FieldDefinition>): string {
  const lines: string[] = [];
  
  for (const [name, field] of Object.entries(fields)) {
    const typeInfo = FIELD_TYPE_INFO[field.type] || FIELD_TYPE_INFO.custom;
    let line = `- ${name} (${field.type}): ${field.label}`;
    
    if (field.description) {
      line += ` - ${field.description}`;
    }
    
    // Add constraints
    const constraints: string[] = [];
    if (field.options?.length) {
      constraints.push(`options: ${field.options.map(o => o.value).join(", ")}`);
    }
    if (field.min !== undefined) constraints.push(`min: ${field.min}`);
    if (field.max !== undefined) constraints.push(`max: ${field.max}`);
    if (field.responsive) constraints.push("RESPONSIVE (use { mobile, tablet?, desktop? })");
    
    if (constraints.length > 0) {
      line += ` [${constraints.join("; ")}]`;
    }
    
    lines.push(line);
  }
  
  return lines.join("\n");
}

/**
 * Build the system prompt for component editing
 */
export function buildComponentSystemPrompt(context: AIComponentContext): string {
  const {
    componentType,
    componentLabel,
    componentDescription,
    currentProps,
    fields,
    aiContext,
    pageContext,
  } = context;
  
  return `You are an AI assistant for DRAMAC Studio, a professional website builder similar to Webflow or Wix Studio. You help users edit component properties using natural language.

## COMPONENT CONTEXT

You are editing a **${componentLabel}** (type: ${componentType})${componentDescription ? `\n${componentDescription}` : ""}
${aiContext?.description ? `\nAI Context: ${aiContext.description}` : ""}

## CURRENT PROPERTIES

\`\`\`json
${JSON.stringify(currentProps, null, 2)}
\`\`\`

## AVAILABLE FIELDS

${formatFieldsForPrompt(fields)}

${aiContext?.canModify ? `\n## MODIFIABLE FIELDS (AI can change these)\n${aiContext.canModify.join(", ")}` : ""}

${pageContext ? `
## PAGE CONTEXT

- Page Title: ${pageContext.title || "(untitled)"}
- Page Description: ${pageContext.description || "(none)"}
- Other components on page: ${pageContext.otherComponentTypes?.join(", ") || "(none)"}
` : ""}

## FIELD TYPE REFERENCE

For RESPONSIVE fields, always provide an object with at least "mobile" key:
\`\`\`json
{
  "mobile": "value",      // REQUIRED - base/default value
  "tablet": "value",      // Optional - 768px+ override
  "desktop": "value"      // Optional - 1024px+ override
}
\`\`\`

For SPACING fields, provide all four sides:
\`\`\`json
{
  "top": "16px",
  "right": "24px",
  "bottom": "16px",
  "left": "24px"
}
\`\`\`

For COLOR fields, use hex codes: "#3B82F6"

For IMAGE fields:
\`\`\`json
{
  "url": "https://...",
  "alt": "Description"
}
\`\`\`

## RESPONSE FORMAT

Respond with a JSON object containing exactly two fields:
1. "changes" - An object with ONLY the props you want to change
2. "explanation" - A brief explanation of what you changed and why

Example response:
\`\`\`json
{
  "changes": {
    "text": "New exciting heading! 🚀",
    "color": "#3B82F6"
  },
  "explanation": "Made the heading more exciting by adding an emoji and changed the color to a vibrant blue to stand out more."
}
\`\`\`

## GUIDELINES

1. Only include props you want to change in "changes"
2. Respect field types exactly (colors as hex, spacing as objects, etc.)
3. For responsive fields, include the full responsive object
4. Keep text changes similar in length unless asked otherwise
5. Be creative but professional
6. Don't change props the user didn't ask about
7. If you can't fulfill a request, explain why in the explanation

## IMPORTANT

Return ONLY valid JSON. No markdown code blocks, no extra text, just the JSON object.`;
}

/**
 * Build a concise context summary for follow-up messages
 */
export function buildFollowUpContext(context: AIComponentContext): string {
  return `Editing ${context.componentLabel} component. Current text: "${
    context.currentProps.text || context.currentProps.content || "(no text)"
  }". Respond with the same JSON format: { "changes": {...}, "explanation": "..." }`;
}
```

```typescript
// src/lib/studio/ai/index.ts
/**
 * Studio AI Module
 * 
 * AI-powered editing features for DRAMAC Studio.
 */

export * from "./types";
export * from "./prompts";
```

**Acceptance Criteria:**
- [ ] Type definitions created
- [ ] System prompt builder handles all field types
- [ ] Responsive field instructions included
- [ ] Examples provided for complex types
- [ ] Barrel export created

---

### Task 3: Create AI API Route

**Description:** Server-side API route that calls Claude and returns structured prop changes.

**Files:**
- CREATE: `src/app/api/studio/ai/component/route.ts`

**Code:**

```typescript
// src/app/api/studio/ai/component/route.ts
/**
 * AI Component Edit API Route
 * 
 * Handles AI requests for component property modifications.
 * Uses Claude via the AI SDK to generate prop changes.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { buildComponentSystemPrompt, buildFollowUpContext } from "@/lib/studio/ai/prompts";
import type { AIComponentRequest, AIComponentResponse } from "@/lib/studio/ai/types";

// Initialize Anthropic client
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Rate limiting (simple in-memory for now)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(userId);
  
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting by IP (in production, use user ID)
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json() as AIComponentRequest;
    const { context, userMessage, conversationHistory } = body;

    // Validate required fields
    if (!context || !userMessage) {
      return NextResponse.json(
        { error: "Missing required fields: context and userMessage" },
        { status: 400 }
      );
    }

    // Build the system prompt
    const systemPrompt = buildComponentSystemPrompt(context);

    // Build messages array for conversation context
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    
    // Add conversation history (last 6 messages to keep context manageable)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }
    
    // Add current user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    // Call Claude
    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      messages,
      maxTokens: 2048,
      temperature: 0.7,
    });

    // Parse the response
    let response: AIComponentResponse;
    try {
      // Clean up response text (remove any markdown if present)
      let responseText = result.text.trim();
      
      // Remove markdown code blocks if present
      if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      
      response = JSON.parse(responseText);
      
      // Validate response structure
      if (!response.changes || typeof response.changes !== "object") {
        throw new Error("Invalid response: missing 'changes' object");
      }
      if (!response.explanation || typeof response.explanation !== "string") {
        response.explanation = "Changes applied.";
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", result.text);
      return NextResponse.json(
        { 
          error: "AI returned invalid response format",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
          rawResponse: result.text.substring(0, 500), // Truncate for debugging
        },
        { status: 500 }
      );
    }

    // Return the response
    return NextResponse.json(response);

  } catch (error) {
    console.error("AI Component API Error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "AI service configuration error" },
          { status: 500 }
        );
      }
      if (error.message.includes("rate") || error.message.includes("limit")) {
        return NextResponse.json(
          { error: "AI service rate limited. Please try again shortly." },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
  }
}

// Optional: GET for health check
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    service: "studio-ai-component",
    timestamp: new Date().toISOString(),
  });
}
```

**Acceptance Criteria:**
- [ ] API route created at /api/studio/ai/component
- [ ] Calls Claude with proper prompt
- [ ] Parses JSON response correctly
- [ ] Handles invalid responses gracefully
- [ ] Basic rate limiting implemented
- [ ] Proper error handling

---

### Task 4: Create AI Chat UI Component

**Description:** The main chat interface component with message history, input, and change preview.

**Files:**
- CREATE: `src/components/studio/ai/ai-component-chat.tsx`
- CREATE: `src/components/studio/ai/change-preview.tsx`
- CREATE: `src/components/studio/ai/chat-message.tsx`
- MODIFY: `src/components/studio/ai/index.ts`

**Code:**

```typescript
// src/components/studio/ai/chat-message.tsx
/**
 * Chat Message Component
 * 
 * Displays a single message in the AI chat.
 */

"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/studio/store/ai-store";
import { Sparkles, User, AlertCircle, Loader2 } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  
  if (isSystem) {
    return (
      <div className="text-center text-xs text-muted-foreground py-2">
        {message.content}
      </div>
    );
  }
  
  return (
    <div className={cn(
      "flex gap-3 p-3 rounded-lg",
      isUser 
        ? "bg-primary/10 ml-8" 
        : "bg-muted mr-8"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {isUser ? "You" : "AI Assistant"}
        </div>
        
        {message.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        ) : message.error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {message.error}
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
        )}
        
        {/* Timestamp */}
        <div className="text-[10px] text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString([], { 
            hour: "2-digit", 
            minute: "2-digit" 
          })}
        </div>
      </div>
    </div>
  );
}
```

```typescript
// src/components/studio/ai/change-preview.tsx
/**
 * Change Preview Component
 * 
 * Shows a diff of proposed AI changes before applying.
 */

"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, Minus, Plus } from "lucide-react";

interface ChangePreviewProps {
  currentProps: Record<string, unknown>;
  proposedChanges: Record<string, unknown>;
  explanation?: string;
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") {
    // Truncate long strings
    return value.length > 50 ? `"${value.slice(0, 50)}..."` : `"${value}"`;
  }
  if (typeof value === "object") {
    try {
      const json = JSON.stringify(value);
      return json.length > 50 ? json.slice(0, 50) + "..." : json;
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

/**
 * Check if two values are different
 */
function isDifferent(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export function ChangePreview({ 
  currentProps, 
  proposedChanges,
  explanation,
}: ChangePreviewProps) {
  const changedKeys = Object.keys(proposedChanges).filter(key => 
    isDifferent(currentProps[key], proposedChanges[key])
  );
  
  if (changedKeys.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground text-center">
          No changes proposed
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-muted/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted px-4 py-2 border-b">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Proposed Changes ({changedKeys.length})
        </h4>
      </div>
      
      {/* Changes list */}
      <div className="divide-y">
        {changedKeys.map((key) => {
          const oldValue = currentProps[key];
          const newValue = proposedChanges[key];
          
          return (
            <div key={key} className="px-4 py-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {key}
              </div>
              <div className="space-y-1">
                {/* Old value */}
                <div className="flex items-start gap-2">
                  <Minus className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <code className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded break-all">
                    {formatValue(oldValue)}
                  </code>
                </div>
                
                {/* New value */}
                <div className="flex items-start gap-2">
                  <Plus className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <code className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded break-all">
                    {formatValue(newValue)}
                  </code>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Explanation */}
      {explanation && (
        <div className="px-4 py-3 border-t bg-background/50">
          <p className="text-xs text-muted-foreground italic">
            💡 {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
```

```typescript
// src/components/studio/ai/ai-component-chat.tsx
/**
 * AI Component Chat Panel
 * 
 * Slide-in chat panel for AI-assisted component editing.
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Send, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { useAIStore } from "@/lib/studio/store/ai-store";
import { useEditorStore } from "@/lib/studio/store/editor-store";
import { useSelectionStore } from "@/lib/studio/store/selection-store";
import { useComponent } from "@/lib/studio/registry/component-registry";
import { ChatMessage } from "./chat-message";
import { ChangePreview } from "./change-preview";
import type { AIComponentContext, AIComponentRequest } from "@/lib/studio/ai/types";

export function AIComponentChat() {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Store hooks
  const { 
    isOpen, 
    activeComponentId,
    chatHistory,
    pendingChanges,
    pendingExplanation,
    isLoading,
    error,
    closeChat,
    addMessage,
    updateLastMessage,
    setPendingChanges,
    setLoading,
    setError,
    clearHistory,
  } = useAIStore();
  
  const { data, updateComponentProps } = useEditorStore();
  const { select } = useSelectionStore();
  
  // Get component data
  const component = activeComponentId 
    ? data.components[activeComponentId] 
    : null;
  
  const { definition } = useComponent(component?.type || "");
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // Build AI context
  const buildContext = useCallback((): AIComponentContext | null => {
    if (!component || !definition) return null;
    
    // Gather other component types for context
    const otherComponentTypes = Object.values(data.components)
      .filter(c => c.id !== component.id)
      .map(c => c.type)
      .filter((v, i, a) => a.indexOf(v) === i); // unique
    
    return {
      componentType: component.type,
      componentLabel: definition.label,
      componentDescription: definition.description,
      currentProps: component.props,
      fields: definition.fields,
      aiContext: definition.ai,
      pageContext: {
        title: data.root.props.title,
        description: data.root.props.description,
        otherComponentTypes,
      },
    };
  }, [component, definition, data]);
  
  // Send message to AI
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !component) return;
    
    const userMessage = inputValue.trim();
    setInputValue("");
    
    // Add user message
    addMessage({
      role: "user",
      content: userMessage,
    });
    
    // Add loading placeholder for AI
    addMessage({
      role: "assistant",
      content: "",
      isLoading: true,
    });
    
    setLoading(true);
    setError(null);
    
    try {
      const context = buildContext();
      if (!context) {
        throw new Error("Could not build component context");
      }
      
      // Build conversation history for API
      const conversationHistory = chatHistory
        .filter(m => m.role !== "system" && !m.isLoading)
        .map(m => ({
          role: m.role as "user" | "assistant",
          content: m.proposedChanges 
            ? JSON.stringify({ changes: m.proposedChanges, explanation: m.explanation || "" })
            : m.content,
        }));
      
      const request: AIComponentRequest = {
        context,
        userMessage,
        conversationHistory,
      };
      
      const response = await fetch("/api/studio/ai/component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "AI request failed");
      }
      
      // Update the loading message with response
      updateLastMessage({
        content: result.explanation || "Here are my suggested changes:",
        proposedChanges: result.changes,
        explanation: result.explanation,
        isLoading: false,
      });
      
      // Set pending changes for preview
      if (result.changes && Object.keys(result.changes).length > 0) {
        setPendingChanges(result.changes, result.explanation);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      updateLastMessage({
        content: "",
        error: errorMessage,
        isLoading: false,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply pending changes
  const handleApplyChanges = () => {
    if (!pendingChanges || !activeComponentId) return;
    
    updateComponentProps(activeComponentId, pendingChanges);
    
    addMessage({
      role: "system",
      content: "✅ Changes applied successfully!",
    });
    
    setPendingChanges(null);
  };
  
  // Reject changes
  const handleRejectChanges = () => {
    addMessage({
      role: "system",
      content: "❌ Changes rejected",
    });
    
    setPendingChanges(null);
  };
  
  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={cn(
      "fixed right-0 top-0 bottom-0 w-[400px] bg-background border-l shadow-lg z-50",
      "flex flex-col animate-in slide-in-from-right duration-200"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              Editing: {definition?.label || component?.type || "Component"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearHistory}
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={closeChat}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {chatHistory.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h4 className="font-medium mb-2">How can I help?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Ask me to modify this component. Try:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Make it blue", "Add an emoji", "Make it shorter"].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputValue(suggestion);
                    inputRef.current?.focus();
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Pending Changes Preview */}
      {pendingChanges && component && (
        <div className="border-t p-4 space-y-3 bg-muted/20">
          <ChangePreview
            currentProps={component.props}
            proposedChanges={pendingChanges}
            explanation={pendingExplanation || undefined}
          />
          
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleApplyChanges}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply Changes
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRejectChanges}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      )}
      
      {/* Input */}
      <div className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to change..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
```

**Update index.ts:**

```typescript
// src/components/studio/ai/index.ts
/**
 * Studio AI Components
 * 
 * AI-powered editing features.
 */

export { AIComponentChat } from "./ai-component-chat";
export { ChangePreview } from "./change-preview";
export { ChatMessage } from "./chat-message";
```

**Acceptance Criteria:**
- [ ] Chat panel slides in from right
- [ ] Messages display correctly with avatars
- [ ] Loading state shows spinner
- [ ] Error messages display
- [ ] Change preview shows diff
- [ ] Apply/Reject buttons work
- [ ] Input auto-focuses when opened
- [ ] Keyboard enter sends message
- [ ] Clear history button works

---

### Task 5: Integrate into Properties Panel

**Description:** Add "Ask AI" button to properties panel and render the chat.

**Files:**
- MODIFY: `src/components/studio/properties/properties-panel.tsx`

**Changes to add:**

```typescript
// At the top of properties-panel.tsx, add imports:
import { Sparkles } from "lucide-react";
import { useAIStore } from "@/lib/studio/store/ai-store";
import { AIComponentChat } from "@/components/studio/ai";

// Inside the PropertiesPanel component, add:
const { openChat } = useAIStore();

// In the header section, add the Ask AI button:
// Find the component name/header section and add:
{selectedId && (
  <Button
    variant="outline"
    size="sm"
    className="gap-2"
    onClick={() => openChat(selectedId)}
  >
    <Sparkles className="h-4 w-4" />
    Ask AI
  </Button>
)}

// At the end of the component return (before the final closing tag), add:
<AIComponentChat />
```

**Full integration example:**

```typescript
// Modified header section in properties-panel.tsx
<div className="flex items-center justify-between p-4 border-b">
  <div className="flex items-center gap-2">
    {/* Component icon and name */}
    <span className="text-sm font-medium">
      {definition?.label || component?.type || "Properties"}
    </span>
  </div>
  
  {/* Actions */}
  <div className="flex items-center gap-2">
    {selectedId && (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => openChat(selectedId)}
      >
        <Sparkles className="h-4 w-4" />
        Ask AI
      </Button>
    )}
  </div>
</div>

{/* At component end */}
<AIComponentChat />
```

**Acceptance Criteria:**
- [ ] "Ask AI" button visible when component selected
- [ ] Clicking opens AI chat panel
- [ ] Chat panel overlays correctly
- [ ] Changes apply to component

---

### Task 6: Add Keyboard Shortcut

**Description:** Add Cmd/Ctrl+/ shortcut to open AI chat.

**Files:**
- MODIFY: Wherever keyboard shortcuts are registered (likely `studio-editor.tsx` or a shortcuts hook)

**Code snippet to add:**

```typescript
// Using react-hotkeys-hook
import { useHotkeys } from "react-hotkeys-hook";
import { useAIStore } from "@/lib/studio/store/ai-store";
import { useSelectionStore } from "@/lib/studio/store/selection-store";

// In component:
const { openChat, isOpen, closeChat } = useAIStore();
const { selectedId } = useSelectionStore();

useHotkeys("mod+/", (e) => {
  e.preventDefault();
  if (isOpen) {
    closeChat();
  } else if (selectedId) {
    openChat(selectedId);
  }
}, {
  enableOnFormTags: false,
});
```

**Acceptance Criteria:**
- [ ] Cmd+/ (Mac) / Ctrl+/ (Windows) toggles AI chat
- [ ] Only works when component is selected
- [ ] Shortcut documented in shortcuts panel

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | src/lib/studio/store/ai-store.ts | AI state management |
| CREATE | src/lib/studio/ai/types.ts | AI type definitions |
| CREATE | src/lib/studio/ai/prompts.ts | Prompt builder utilities |
| CREATE | src/lib/studio/ai/index.ts | AI module exports |
| CREATE | src/app/api/studio/ai/component/route.ts | AI API endpoint |
| CREATE | src/components/studio/ai/chat-message.tsx | Chat message component |
| CREATE | src/components/studio/ai/change-preview.tsx | Change diff preview |
| CREATE | src/components/studio/ai/ai-component-chat.tsx | Main chat panel |
| MODIFY | src/components/studio/ai/index.ts | Export new components |
| MODIFY | src/lib/studio/store/index.ts | Export AI store |
| MODIFY | src/components/studio/properties/properties-panel.tsx | Add Ask AI button |

## Testing Requirements

### Unit Tests
- [ ] AI store state transitions work correctly
- [ ] Prompt builder creates valid prompts for all field types
- [ ] Message formatting handles edge cases

### Integration Tests
- [ ] API route returns valid JSON
- [ ] Rate limiting works
- [ ] Error handling returns appropriate status codes

### Manual Testing
- [ ] Open chat for different component types
- [ ] Send "make it blue" to Heading component
- [ ] Send "add an emoji" to Button component
- [ ] Verify preview shows correct diff
- [ ] Apply changes and verify component updates
- [ ] Reject changes and verify no change
- [ ] Test with responsive fields
- [ ] Test keyboard shortcut
- [ ] Test error handling (disconnect network)
- [ ] Test with long text content
- [ ] Verify undo/redo works after AI changes

## Dependencies to Install

No new dependencies required - uses existing:
- `@ai-sdk/anthropic` (already installed)
- `ai` (already installed)
- `nanoid` (already installed)

## Environment Variables

Already configured:
```env
ANTHROPIC_API_KEY=sk-ant-...  # Already exists
```

## Database Changes

None required.

## Rollback Plan

1. Remove AI store from index exports
2. Remove API route folder
3. Remove AI components
4. Remove "Ask AI" button from properties panel
5. Revert any shortcut changes

## Success Criteria

- [ ] "Ask AI" button appears for all selected components
- [ ] Chat opens and displays properly
- [ ] User can type natural language requests
- [ ] AI returns valid prop changes as JSON
- [ ] Change preview shows before/after clearly
- [ ] Apply button updates component immediately
- [ ] Reject button discards changes
- [ ] Chat history persists during session
- [ ] Works with all field types (color, spacing, responsive)
- [ ] Keyboard shortcut works (Cmd/Ctrl+/)
- [ ] Errors are handled gracefully
- [ ] Loading states are clear
- [ ] Panel closes cleanly
- [ ] Changes are undoable via editor undo

---

## Example Interactions

### Example 1: Change heading text and color

**User:** "Make this heading more exciting with an emoji"

**AI Response:**
```json
{
  "changes": {
    "text": "🚀 Welcome to the Future!"
  },
  "explanation": "Added a rocket emoji at the start to make the heading more exciting and dynamic."
}
```

### Example 2: Update spacing

**User:** "Add more padding around this section"

**AI Response:**
```json
{
  "changes": {
    "padding": {
      "mobile": { "top": "32px", "right": "16px", "bottom": "32px", "left": "16px" },
      "desktop": { "top": "64px", "right": "48px", "bottom": "64px", "left": "48px" }
    }
  },
  "explanation": "Increased padding significantly on both mobile and desktop for better visual breathing room."
}
```

### Example 3: Responsive font size

**User:** "Make the text bigger on desktop"

**AI Response:**
```json
{
  "changes": {
    "fontSize": {
      "mobile": "18px",
      "tablet": "20px",
      "desktop": "24px"
    }
  },
  "explanation": "Kept mobile and tablet sizes similar but increased desktop to 24px for better readability on larger screens."
}
```
