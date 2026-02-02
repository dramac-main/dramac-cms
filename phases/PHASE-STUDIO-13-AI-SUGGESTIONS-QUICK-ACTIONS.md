# PHASE-STUDIO-13: AI Suggestions & Quick Actions

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-13 |
| Title | AI Suggestions & Quick Actions |
| Priority | High |
| Estimated Time | 6-8 hours |
| Dependencies | STUDIO-11 (AI Component Chat) |
| Risk Level | Low |

## Problem Statement

While the full AI chat (Phase 11) provides powerful editing capabilities, users often want quick, one-click improvements without typing detailed prompts. Common actions like "make it shorter," "translate to Spanish," or "add an emoji" should be instantly available.

Additionally, components with AI context can offer intelligent suggestions based on the component type and current content, helping users discover improvements they might not have thought of.

This phase adds quick action buttons and contextual suggestions that leverage the existing AI infrastructure for instant edits.

## Goals

- [ ] Add quick action buttons for common text edits
- [ ] Implement one-click actions (translate, shorten, improve, etc.)
- [ ] Show contextual suggestions based on component type
- [ ] Auto-apply changes (with undo available)
- [ ] Support language selection for translation
- [ ] Add inline AI indicator during processing
- [ ] Integrate seamlessly with existing properties panel

## Technical Approach

### Quick Actions UI

```
┌─────────────────────────────────────────────────────────────────┐
│  Properties Panel - Heading Component                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Text                                                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Welcome to Our Platform                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ✨ Quick Actions                                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Shorten ✂️] [Improve ✨] [Add Emoji 😀] [Professional 👔] │││
│  │ [Casual 😊] [Translate 🌐▼] [Expand 📝] [More exciting 🔥] │││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  💡 Suggestions                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • Add a subheading for context                             ││
│  │ • Make it more action-oriented                             ││
│  │ • Include numbers for impact                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Action Processing Flow

```
User clicks "Shorten"
        │
        ▼
Show loading indicator on button
        │
        ▼
Send to AI API with preset prompt
        │
        ▼
Receive changes (e.g., shorter text)
        │
        ▼
Auto-apply to component
        │
        ▼
Show success toast with undo option
```

## Implementation Tasks

### Task 1: Create Quick Actions Types

**Description:** Define types for quick actions and suggestions.

**Files:**
- MODIFY: `src/lib/studio/ai/types.ts`

**Code to add:**

```typescript
// Add to src/lib/studio/ai/types.ts

/**
 * Quick action definition
 */
export interface QuickAction {
  /** Unique identifier */
  id: string;
  
  /** Display label */
  label: string;
  
  /** Icon emoji or lucide icon name */
  icon: string;
  
  /** AI prompt to send */
  prompt: string;
  
  /** Which field to target (default: text, content, or first string field) */
  targetField?: string;
  
  /** Should auto-apply without preview? */
  autoApply?: boolean;
  
  /** Component types this action applies to */
  componentTypes?: string[];
  
  /** Requires additional input (e.g., language selection) */
  requiresInput?: "language" | "tone" | "custom";
}

/**
 * Suggestion for component improvement
 */
export interface AISuggestion {
  /** Suggestion text */
  text: string;
  
  /** AI prompt if clicked */
  prompt: string;
  
  /** Icon */
  icon?: string;
}

/**
 * Supported languages for translation
 */
export const SUPPORTED_LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" },
  { code: "nl", name: "Dutch" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

/**
 * Default quick actions available for text-based components
 */
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "shorten",
    label: "Shorten",
    icon: "✂️",
    prompt: "Make this text shorter and more concise while keeping the main message. Reduce by about 30-50%.",
    autoApply: true,
  },
  {
    id: "improve",
    label: "Improve",
    icon: "✨",
    prompt: "Improve this text to be more engaging, clear, and impactful. Keep the same general length.",
    autoApply: true,
  },
  {
    id: "add-emoji",
    label: "Add Emoji",
    icon: "😀",
    prompt: "Add 1-2 relevant emojis to make this text more engaging. Place them naturally.",
    autoApply: true,
  },
  {
    id: "professional",
    label: "Professional",
    icon: "👔",
    prompt: "Rewrite in a professional, business-appropriate tone. Remove any casual language.",
    autoApply: true,
  },
  {
    id: "casual",
    label: "Casual",
    icon: "😊",
    prompt: "Rewrite in a casual, friendly tone. Make it more conversational and approachable.",
    autoApply: true,
  },
  {
    id: "expand",
    label: "Expand",
    icon: "📝",
    prompt: "Expand this text with more detail. Add about 50% more content while staying on topic.",
    autoApply: true,
  },
  {
    id: "exciting",
    label: "More Exciting",
    icon: "🔥",
    prompt: "Make this text more exciting and energetic. Add urgency and enthusiasm.",
    autoApply: true,
  },
  {
    id: "translate",
    label: "Translate",
    icon: "🌐",
    prompt: "Translate this text to {language}. Keep the same tone and meaning.",
    requiresInput: "language",
    autoApply: true,
  },
  {
    id: "numbers",
    label: "Add Numbers",
    icon: "🔢",
    prompt: "Add specific numbers or statistics to make this more impactful. Use realistic numbers.",
    autoApply: true,
  },
  {
    id: "cta",
    label: "Make it a CTA",
    icon: "🎯",
    prompt: "Rewrite as a compelling call-to-action that encourages the user to take action.",
    autoApply: true,
    componentTypes: ["Button", "Text", "Heading"],
  },
];

/**
 * Component-specific suggestions based on type and AI context
 */
export const COMPONENT_SUGGESTIONS: Record<string, AISuggestion[]> = {
  Heading: [
    { text: "Make it more action-oriented", prompt: "Rewrite to be more action-oriented and compelling", icon: "🎯" },
    { text: "Add power words", prompt: "Add powerful, persuasive words to increase impact", icon: "💪" },
    { text: "Question format", prompt: "Rewrite as an engaging question to hook readers", icon: "❓" },
  ],
  Text: [
    { text: "Add bullet points", prompt: "Convert to bullet points for easier scanning", icon: "📋" },
    { text: "Add a statistic", prompt: "Add a relevant statistic to support the message", icon: "📊" },
    { text: "Make it scannable", prompt: "Rewrite to be more scannable with short sentences", icon: "👁️" },
  ],
  Button: [
    { text: "Add urgency", prompt: "Make the button text more urgent and action-oriented", icon: "⚡" },
    { text: "Be more specific", prompt: "Make the button text more specific about what happens when clicked", icon: "🎯" },
    { text: "Add value proposition", prompt: "Include a value proposition in the button text", icon: "💎" },
  ],
  Section: [
    { text: "Suggest content", prompt: "Suggest what content should go in this section based on its position", icon: "💡" },
  ],
};
```

**Acceptance Criteria:**
- [ ] Quick action types defined
- [ ] Default actions list complete
- [ ] Language list for translation
- [ ] Component suggestions defined

---

### Task 2: Create Quick Actions Component

**Description:** UI component for displaying and triggering quick actions.

**Files:**
- CREATE: `src/components/studio/ai/quick-actions.tsx`

**Code:**

```typescript
// src/components/studio/ai/quick-actions.tsx
/**
 * Quick Actions Component
 * 
 * One-click AI actions for common text modifications.
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, ChevronDown, Undo2 } from "lucide-react";
import { useEditorStore } from "@/lib/studio/store/editor-store";
import { useComponent } from "@/lib/studio/registry/component-registry";
import { toast } from "sonner";
import {
  DEFAULT_QUICK_ACTIONS,
  SUPPORTED_LANGUAGES,
  type QuickAction,
  type LanguageCode,
} from "@/lib/studio/ai/types";
import type { AIComponentContext, AIComponentRequest } from "@/lib/studio/ai/types";

interface QuickActionsProps {
  componentId: string;
  className?: string;
}

export function QuickActions({ componentId, className }: QuickActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastChange, setLastChange] = useState<{
    componentId: string;
    originalProps: Record<string, unknown>;
  } | null>(null);
  
  const { data, updateComponentProps } = useEditorStore();
  const component = data.components[componentId];
  const { definition } = useComponent(component?.type || "");
  
  if (!component || !definition) return null;
  
  // Filter actions based on component type
  const availableActions = DEFAULT_QUICK_ACTIONS.filter(action => {
    // If action specifies component types, check if current type is included
    if (action.componentTypes && !action.componentTypes.includes(component.type)) {
      return false;
    }
    // Only show text-related actions for components with text-like fields
    const hasTextField = Object.entries(definition.fields).some(
      ([_, field]) => field.type === "text" || field.type === "textarea" || field.type === "richtext"
    );
    return hasTextField || action.id === "translate";
  });
  
  // Find the primary text field
  const findTextFieldName = (): string | null => {
    const textFields = ["text", "content", "title", "label", "heading", "description"];
    for (const fieldName of textFields) {
      if (definition.fields[fieldName]) {
        return fieldName;
      }
    }
    // Fall back to first text field
    const firstTextField = Object.entries(definition.fields).find(
      ([_, field]) => field.type === "text" || field.type === "textarea"
    );
    return firstTextField ? firstTextField[0] : null;
  };
  
  // Execute quick action
  const executeAction = async (action: QuickAction, language?: LanguageCode) => {
    const textField = action.targetField || findTextFieldName();
    if (!textField) {
      toast.error("No text field found");
      return;
    }
    
    const currentText = component.props[textField];
    if (!currentText || typeof currentText !== "string") {
      toast.error("No text to modify");
      return;
    }
    
    setLoadingAction(action.id);
    
    // Store original for undo
    setLastChange({
      componentId,
      originalProps: { [textField]: currentText },
    });
    
    try {
      // Build prompt
      let prompt = action.prompt;
      if (action.requiresInput === "language" && language) {
        const langName = SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || language;
        prompt = prompt.replace("{language}", langName);
      }
      
      // Build context
      const context: AIComponentContext = {
        componentType: component.type,
        componentLabel: definition.label,
        currentProps: { [textField]: currentText },
        fields: { [textField]: definition.fields[textField] },
      };
      
      const request: AIComponentRequest = {
        context,
        userMessage: prompt,
      };
      
      // Call API
      const response = await fetch("/api/studio/ai/component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to process");
      }
      
      // Apply changes
      if (result.changes && Object.keys(result.changes).length > 0) {
        updateComponentProps(componentId, result.changes);
        
        toast.success(`${action.label} applied`, {
          description: result.explanation || "Changes applied successfully",
          action: {
            label: "Undo",
            onClick: () => handleUndo(),
          },
        });
      } else {
        toast.info("No changes needed");
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Action failed", { description: message });
    } finally {
      setLoadingAction(null);
    }
  };
  
  // Undo last change
  const handleUndo = () => {
    if (!lastChange) return;
    
    updateComponentProps(lastChange.componentId, lastChange.originalProps);
    toast.success("Change undone");
    setLastChange(null);
  };
  
  // Render action button
  const renderActionButton = (action: QuickAction) => {
    const isLoading = loadingAction === action.id;
    
    // Translation needs language dropdown
    if (action.requiresInput === "language") {
      return (
        <DropdownMenu key={action.id}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={loadingAction !== null}
              className="gap-1"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span>{action.icon}</span>
              )}
              {action.label}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => executeAction(action, lang.code)}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    
    return (
      <Button
        key={action.id}
        variant="outline"
        size="sm"
        onClick={() => executeAction(action)}
        disabled={loadingAction !== null}
        className="gap-1"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span>{action.icon}</span>
        )}
        {action.label}
      </Button>
    );
  };
  
  if (availableActions.length === 0) return null;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          ✨ Quick Actions
        </span>
        {lastChange && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            className="h-6 text-xs gap-1"
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {availableActions.slice(0, 8).map(renderActionButton)}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Buttons render for all actions
- [ ] Loading state shows on clicked button
- [ ] Translation dropdown works
- [ ] Auto-applies changes
- [ ] Toast shows with undo
- [ ] Undo reverts changes
- [ ] Filters actions by component type

---

### Task 3: Create AI Suggestions Component

**Description:** Contextual suggestions based on component type.

**Files:**
- CREATE: `src/components/studio/ai/ai-suggestions.tsx`

**Code:**

```typescript
// src/components/studio/ai/ai-suggestions.tsx
/**
 * AI Suggestions Component
 * 
 * Shows contextual improvement suggestions based on component type.
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, Sparkles } from "lucide-react";
import { useEditorStore } from "@/lib/studio/store/editor-store";
import { useComponent } from "@/lib/studio/registry/component-registry";
import { useAIStore } from "@/lib/studio/store/ai-store";
import { COMPONENT_SUGGESTIONS, type AISuggestion } from "@/lib/studio/ai/types";

interface AISuggestionsProps {
  componentId: string;
  className?: string;
}

export function AISuggestions({ componentId, className }: AISuggestionsProps) {
  const { data } = useEditorStore();
  const component = data.components[componentId];
  const { definition } = useComponent(component?.type || "");
  const { openChat } = useAIStore();
  
  if (!component || !definition) return null;
  
  // Get suggestions for this component type
  const suggestions: AISuggestion[] = [
    // Component-specific suggestions
    ...(COMPONENT_SUGGESTIONS[component.type] || []),
    // Definition AI suggestions
    ...(definition.ai?.suggestions?.map(s => ({
      text: s,
      prompt: s,
      icon: "💡",
    })) || []),
  ];
  
  if (suggestions.length === 0) return null;
  
  // Handle suggestion click - opens chat with pre-filled prompt
  const handleSuggestionClick = (suggestion: AISuggestion) => {
    openChat(componentId);
    // The chat component will handle the message
    // For now, just open with the suggestion context
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-xs font-medium text-muted-foreground">
          Suggestions
        </span>
      </div>
      <div className="space-y-1">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm",
              "bg-muted/50 hover:bg-muted transition-colors",
              "flex items-start gap-2 group"
            )}
          >
            <span className="shrink-0">{suggestion.icon || "💡"}</span>
            <span className="flex-1 text-muted-foreground group-hover:text-foreground">
              {suggestion.text}
            </span>
            <Sparkles className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows component-specific suggestions
- [ ] Shows definition AI suggestions
- [ ] Clicking opens AI chat
- [ ] Max 3 suggestions displayed
- [ ] Hover state works

---

### Task 4: Create Combined AI Actions Panel

**Description:** Wrapper component that combines quick actions and suggestions.

**Files:**
- CREATE: `src/components/studio/ai/ai-actions-panel.tsx`

**Code:**

```typescript
// src/components/studio/ai/ai-actions-panel.tsx
/**
 * AI Actions Panel
 * 
 * Combined panel with Quick Actions and Suggestions.
 */

"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { QuickActions } from "./quick-actions";
import { AISuggestions } from "./ai-suggestions";
import { useEditorStore } from "@/lib/studio/store/editor-store";
import { useComponent } from "@/lib/studio/registry/component-registry";

interface AIActionsPanelProps {
  componentId: string;
  className?: string;
}

export function AIActionsPanel({ componentId, className }: AIActionsPanelProps) {
  const { data } = useEditorStore();
  const component = data.components[componentId];
  const { definition } = useComponent(component?.type || "");
  
  if (!component || !definition) return null;
  
  // Check if component has text fields (should show quick actions)
  const hasTextFields = Object.values(definition.fields).some(
    field => field.type === "text" || field.type === "textarea" || field.type === "richtext"
  );
  
  // Check if component has AI suggestions
  const hasSuggestions = definition.ai?.suggestions && definition.ai.suggestions.length > 0;
  
  // Don't render if no AI features apply
  if (!hasTextFields && !hasSuggestions) return null;
  
  return (
    <div className={cn(
      "space-y-4 pt-4 mt-4 border-t",
      className
    )}>
      {/* Quick Actions */}
      {hasTextFields && (
        <QuickActions componentId={componentId} />
      )}
      
      {/* Suggestions */}
      <AISuggestions componentId={componentId} />
    </div>
  );
}
```

**Update exports:**

```typescript
// Add to src/components/studio/ai/index.ts
export { QuickActions } from "./quick-actions";
export { AISuggestions } from "./ai-suggestions";
export { AIActionsPanel } from "./ai-actions-panel";
```

**Acceptance Criteria:**
- [ ] Combines quick actions and suggestions
- [ ] Only shows when relevant
- [ ] Visual separation from properties

---

### Task 5: Integrate into Properties Panel

**Description:** Add AI Actions Panel to the properties panel.

**Files:**
- MODIFY: `src/components/studio/properties/properties-panel.tsx`

**Code to add:**

```typescript
// Import at top
import { AIActionsPanel } from "@/components/studio/ai";

// After field renderer, before closing the panel content
// Find where the fields are rendered and add after:

{selectedId && (
  <AIActionsPanel componentId={selectedId} />
)}
```

**Acceptance Criteria:**
- [ ] AI panel appears below properties
- [ ] Only shows for selected component
- [ ] Visually separated from fields

---

### Task 6: Add Quick Action Keyboard Shortcuts

**Description:** Optional keyboard shortcuts for common actions.

**Files:**
- MODIFY: Shortcuts registration (where other shortcuts are defined)

**Code to add:**

```typescript
// Optional: Add keyboard shortcuts for most common actions

import { useHotkeys } from "react-hotkeys-hook";

// In component with access to selection:
const { selectedId } = useSelectionStore();

// Alt+S for Shorten
useHotkeys("alt+s", (e) => {
  e.preventDefault();
  if (selectedId) {
    // Trigger shorten action
  }
}, { enableOnFormTags: false });

// Alt+I for Improve
useHotkeys("alt+i", (e) => {
  e.preventDefault();
  if (selectedId) {
    // Trigger improve action
  }
}, { enableOnFormTags: false });
```

**Note:** This is optional and can be implemented based on user feedback.

**Acceptance Criteria:**
- [ ] Shortcuts documented if implemented
- [ ] Don't conflict with OS shortcuts

---

### Task 7: Add Inline Loading States

**Description:** Show loading indicator inline when quick action is processing.

**Files:**
- Already included in quick-actions.tsx

The loading state is implemented with:
- Spinner on the clicked button
- All other buttons disabled
- Toast on completion

**Additional enhancement - field-level indicator:**

```typescript
// Optional: Add to field components to show processing state
interface FieldProps {
  isProcessing?: boolean;
}

// In field render:
{isProcessing && (
  <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded">
    <Loader2 className="h-4 w-4 animate-spin text-primary" />
  </div>
)}
```

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| MODIFY | src/lib/studio/ai/types.ts | Add quick action types |
| CREATE | src/components/studio/ai/quick-actions.tsx | Quick action buttons |
| CREATE | src/components/studio/ai/ai-suggestions.tsx | Contextual suggestions |
| CREATE | src/components/studio/ai/ai-actions-panel.tsx | Combined panel |
| MODIFY | src/components/studio/ai/index.ts | Export new components |
| MODIFY | src/components/studio/properties/properties-panel.tsx | Integrate panel |

## Testing Requirements

### Unit Tests
- [ ] Quick action list filters by component type
- [ ] Text field detection works correctly
- [ ] Language code substitution works

### Integration Tests
- [ ] Shorten action reduces text length
- [ ] Translate action returns translated text
- [ ] Add emoji action adds emoji

### Manual Testing
- [ ] Click "Shorten" on heading → text gets shorter
- [ ] Click "Translate" → select Spanish → text translates
- [ ] Click "Add Emoji" → emoji appears
- [ ] Click "Professional" → tone changes
- [ ] Undo in toast reverts change
- [ ] Loading spinner shows during processing
- [ ] Suggestions appear for heading
- [ ] Clicking suggestion opens chat

## Dependencies to Install

No new dependencies required.

## Environment Variables

Already configured from previous phases.

## Database Changes

None required.

## Rollback Plan

1. Remove AI actions panel from properties
2. Remove new components
3. Remove type additions

## Success Criteria

- [ ] Quick action buttons appear for text components
- [ ] "Shorten" makes text 30-50% shorter
- [ ] "Improve" enhances text quality
- [ ] "Add Emoji" adds relevant emoji
- [ ] "Professional" changes tone appropriately
- [ ] "Translate" with language selection works
- [ ] Loading state visible during processing
- [ ] Toast shows with undo option
- [ ] Undo reverts to original
- [ ] Suggestions show for relevant components
- [ ] Actions disabled while one is processing
- [ ] Works with all text-based components
- [ ] No UI flicker during updates

---

## Example Quick Action Results

### Shorten

**Input:** "Welcome to our amazing platform where you can discover incredible features and tools that will help you achieve your goals faster than ever before!"

**Output:** "Welcome to our platform. Discover tools that help you achieve your goals faster!"

### Improve

**Input:** "Sign up now"

**Output:** "Start Your Free Trial Today →"

### Add Emoji

**Input:** "Premium Features"

**Output:** "⭐ Premium Features"

### Translate (Spanish)

**Input:** "Get Started Today"

**Output:** "Comienza Hoy"

### Professional

**Input:** "Hey there! Check out our cool stuff!"

**Output:** "Explore Our Professional Solutions"

### Casual

**Input:** "Request a Consultation"

**Output:** "Let's Chat! Book a Quick Call"

---

## Integration with Existing AI Chat

Quick actions use the same API endpoint as the full AI chat (Phase 11):
- `/api/studio/ai/component`

The only difference is:
1. Quick actions use preset prompts
2. Quick actions auto-apply changes
3. Quick actions show inline loading
4. Full chat shows preview before apply

This ensures consistency and reuses the existing infrastructure.
