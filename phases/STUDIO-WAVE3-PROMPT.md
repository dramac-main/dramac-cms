# TASK: Generate Implementation Phases - WAVE 3 (Field System)

You are a senior software architect. Wave 2 (Core Editor) has been successfully implemented. Now generate the **next 2 field system phases** for DRAMAC Studio.

## ✅ Wave 2 Completion Status

The following has been implemented:

### Files Created (Wave 2):
```
src/components/studio/
  ├── dnd/
  │   ├── droppable-canvas.tsx       ✅ Canvas drop zone
  │   ├── draggable-component.tsx    ✅ Library draggable items
  │   ├── sortable-component.tsx     ✅ Canvas sortable components
  │   └── drag-overlay.tsx           ✅ Drag preview
  │
  ├── canvas/
  │   ├── editor-canvas.tsx          ✅ Main canvas
  │   └── component-wrapper.tsx      ✅ Wrapper with selection/hover
  │
  ├── panels/
  │   ├── left-panel.tsx             ✅ Component library (search, categories)
  │   └── right-panel.tsx            ✅ Properties panel (basic fields)
  │
  └── blocks/                        ✅ 10 PREMIUM COMPONENTS
      ├── layout/
      │   ├── section.tsx            ✅ Background, parallax, responsive padding
      │   ├── container.tsx          ✅ Max width, flexbox, responsive
      │   ├── columns.tsx            ✅ 1-6 cols responsive, gap, alignment
      │   ├── spacer.tsx             ✅ Responsive heights
      │   └── divider.tsx            ✅ Style, color, width
      ├── typography/
      │   ├── heading.tsx            ✅ Gradient, animation, responsive
      │   └── text.tsx               ✅ Typography, columns, dropcap
      ├── interactive/
      │   └── button.tsx             ✅ Variants, icons, loading, hover
      └── media/
          ├── image.tsx              ✅ Aspect ratio, lazy loading
          └── icon.tsx               ✅ Lucide picker, size, animation

src/lib/studio/
  └── fields/
      ├── text-field-editor.tsx      ✅ Text input
      ├── number-field-editor.tsx    ✅ Number with +/- buttons
      ├── select-field-editor.tsx    ✅ Dropdown
      └── toggle-field-editor.tsx    ✅ Switch
```

### Current State:
- ✅ Drag components from library to canvas
- ✅ Drop zones working with visual feedback
- ✅ Components render with all props applied
- ✅ Click to select, hover highlights
- ✅ 10 premium mobile-first components working
- ✅ Basic field editing (text, number, select, toggle)
- ✅ Properties panel shows selected component
- ✅ Delete components
- ✅ Undo/redo works

### What's Missing (Wave 3 Will Add):
- ❌ Advanced field types (color, image, spacing, typography)
- ❌ Responsive field editing (per-breakpoint values)
- ❌ Breakpoint selector in properties panel
- ❌ Visual spacing editor (box model)
- ❌ Typography control panel
- ❌ Color picker
- ❌ Image upload/URL field
- ❌ Link picker with page navigation

---

## 🎯 Generate These Phases (Wave 3):

1. **PHASE-STUDIO-09: Advanced Field Types**
2. **PHASE-STUDIO-10: Responsive Field System**

## Expected Outcome After Wave 3

After implementing these 2 phases, we should have:
- ✅ Color field with visual color picker (react-colorful)
- ✅ Image field with upload + URL input + preview
- ✅ Link field with internal page picker + external URL
- ✅ Spacing field with visual box model (margin/padding per side)
- ✅ Typography field (font family, size, weight, line height, letter spacing)
- ✅ Array field (add/remove/reorder items)
- ✅ Object field (nested fields in accordion)
- ✅ Breakpoint selector (📱 💻 🖥️) in properties panel header
- ✅ Responsive toggle per field (click icon to enable per-breakpoint editing)
- ✅ Canvas preview switches breakpoint when toolbar selector changes
- ✅ All visual props support ResponsiveValue<T> editing

---

## Key Implementation Context

### Existing Field System (Wave 2)

Currently we have a basic field renderer:

```typescript
// src/components/studio/panels/right-panel.tsx (simplified)
const RightPanel = () => {
  const { selectedId } = useSelectionStore();
  const { data, updateComponent } = useEditorStore();
  const component = data.components[selectedId];
  const { definition } = useComponent(component.type);

  const handleFieldChange = (fieldName: string, value: unknown) => {
    updateComponent(selectedId, { [fieldName]: value });
  };

  return (
    <div>
      {Object.entries(definition.fields).map(([name, field]) => (
        <FieldRenderer
          key={name}
          field={field}
          value={component.props[name]}
          onChange={(val) => handleFieldChange(name, val)}
        />
      ))}
    </div>
  );
};
```

### What Wave 3 Needs to Add

1. **Advanced field types** - New field editor components
2. **Responsive value handling** - Fields that support ResponsiveValue<T>
3. **Breakpoint context** - Track current editing breakpoint
4. **Smart field rendering** - Detect if field is responsive and show appropriate UI

---

## Requirements for Each Phase

### PHASE-STUDIO-09: Advanced Field Types

Must implement these field editors:

#### 1. ColorFieldEditor
```typescript
interface ColorFieldEditorProps {
  value: string; // CSS color or hex
  onChange: (value: string) => void;
  label: string;
}
```
- Show color swatch + hex input
- Click swatch opens popover with react-colorful picker
- Support CSS variables (hsl(var(--primary))) with visual preview
- Preset colors from design system
- Recent colors memory

#### 2. ImageFieldEditor
```typescript
interface ImageFieldEditorProps {
  value: { url: string; alt?: string };
  onChange: (value: { url: string; alt?: string }) => void;
  label: string;
}
```
- Show image preview if URL exists
- URL input field
- "Upload" button → triggers media library picker (use existing system)
- Alt text input below
- Clear button

#### 3. LinkFieldEditor
```typescript
interface LinkFieldEditorProps {
  value: { href: string; target?: '_blank' | '_self'; pageId?: string };
  onChange: (value: any) => void;
  label: string;
}
```
- Tabs: "Page" | "URL" | "Email"
- Page tab: Dropdown of site pages (fetch from DB)
- URL tab: Text input for external link
- Email tab: Email input (generates mailto:)
- Target toggle (open in new tab)

#### 4. SpacingFieldEditor (VISUAL!)
```typescript
interface SpacingFieldEditorProps {
  value: { top: string; right: string; bottom: string; left: string };
  onChange: (value: any) => void;
  label: string; // "Margin" or "Padding"
}
```
- Visual box model diagram showing component in center
- 4 input fields (top, right, bottom, left)
- Link icon to lock all sides to same value
- Support "auto", pixels, rem, %

#### 5. TypographyFieldEditor
```typescript
interface TypographyFieldEditorProps {
  value: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: number;
    lineHeight?: string;
    letterSpacing?: string;
  };
  onChange: (value: any) => void;
  label: string;
}
```
- Font family dropdown (system fonts + custom)
- Font size slider + input (8px - 96px)
- Font weight slider (100-900)
- Line height input
- Letter spacing input
- Preview text showing changes

#### 6. ArrayFieldEditor
```typescript
interface ArrayFieldEditorProps {
  value: any[];
  onChange: (value: any[]) => void;
  itemFields: Record<string, FieldDefinition>; // Fields for each item
  label: string;
}
```
- List of items in accordion
- Each item shows its fields inside
- Add item button at bottom
- Delete button per item
- Drag handle to reorder (simple up/down buttons ok)

#### 7. ObjectFieldEditor
```typescript
interface ObjectFieldEditorProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  fields: Record<string, FieldDefinition>; // Nested fields
  label: string;
}
```
- Render nested fields in collapsible section
- Each nested field uses appropriate field editor
- Indent to show nesting

---

### PHASE-STUDIO-10: Responsive Field System

Must implement:

#### 1. Breakpoint Context & Store

```typescript
// src/lib/studio/store/ui-store.ts (add to existing)
interface UIStore {
  // Existing...
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop';
  setBreakpoint: (bp: 'mobile' | 'tablet' | 'desktop') => void;
}
```

#### 2. Breakpoint Selector Component

```typescript
// src/components/studio/layout/breakpoint-selector.tsx
const BreakpointSelector = () => {
  const { currentBreakpoint, setBreakpoint } = useUIStore();
  
  return (
    <div className="flex gap-1">
      <Button
        variant={currentBreakpoint === 'mobile' ? 'default' : 'ghost'}
        onClick={() => setBreakpoint('mobile')}
      >
        📱 Mobile
      </Button>
      {/* Tablet, Desktop */}
    </div>
  );
};
```

Add this to the top toolbar (studio-toolbar.tsx).

#### 3. ResponsiveFieldWrapper Component

```typescript
// src/components/studio/fields/responsive-field-wrapper.tsx
interface ResponsiveFieldWrapperProps {
  field: FieldDefinition;
  value: any; // Could be ResponsiveValue<T> or plain T
  onChange: (value: any) => void;
  children: (props: {
    value: any; // Current breakpoint's value
    onChange: (val: any) => void;
  }) => React.ReactNode;
}

const ResponsiveFieldWrapper = ({ field, value, onChange, children }) => {
  const { currentBreakpoint } = useUIStore();
  const [isResponsive, setIsResponsive] = useState(isResponsiveValue(value));
  
  // Helper to check if value is ResponsiveValue<T>
  const isResponsiveValue = (val: any) => {
    return val && typeof val === 'object' && 'mobile' in val;
  };
  
  // Get value for current breakpoint
  const getCurrentValue = () => {
    if (isResponsive) {
      return value[currentBreakpoint] ?? value.mobile;
    }
    return value;
  };
  
  // Update value for current breakpoint
  const handleChange = (newVal: any) => {
    if (isResponsive) {
      onChange({ ...value, [currentBreakpoint]: newVal });
    } else {
      onChange(newVal);
    }
  };
  
  // Toggle responsive mode
  const toggleResponsive = () => {
    if (isResponsive) {
      // Convert to single value (use mobile)
      onChange(value.mobile);
    } else {
      // Convert to responsive (all breakpoints same initially)
      onChange({ mobile: value, tablet: value, desktop: value });
    }
    setIsResponsive(!isResponsive);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label>{field.label}</label>
        {field.responsive && (
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleResponsive}
            title="Toggle responsive editing"
          >
            {isResponsive ? '📱💻🖥️' : '📱'}
          </Button>
        )}
      </div>
      
      {isResponsive && (
        <div className="flex gap-1 mb-2 text-xs">
          <span className={currentBreakpoint === 'mobile' ? 'font-bold' : ''}>
            📱 {currentBreakpoint === 'mobile' && '←'}
          </span>
          <span className={currentBreakpoint === 'tablet' ? 'font-bold' : ''}>
            💻 {currentBreakpoint === 'tablet' && '←'}
          </span>
          <span className={currentBreakpoint === 'desktop' ? 'font-bold' : ''}>
            🖥️ {currentBreakpoint === 'desktop' && '←'}
          </span>
        </div>
      )}
      
      {children({
        value: getCurrentValue(),
        onChange: handleChange,
      })}
    </div>
  );
};
```

#### 4. Update Field Renderer to Use Wrapper

```typescript
// Update src/components/studio/panels/right-panel.tsx
const FieldRenderer = ({ fieldName, field, value, onChange }) => {
  // If field.responsive = true, wrap in ResponsiveFieldWrapper
  if (field.responsive) {
    return (
      <ResponsiveFieldWrapper field={field} value={value} onChange={onChange}>
        {({ value: currentValue, onChange: handleChange }) => (
          <ActualFieldEditor value={currentValue} onChange={handleChange} />
        )}
      </ResponsiveFieldWrapper>
    );
  }
  
  // Regular non-responsive field
  return <ActualFieldEditor value={value} onChange={onChange} />;
};
```

#### 5. Canvas Breakpoint Preview

Update canvas to respect current breakpoint:

```typescript
// src/components/studio/canvas/editor-canvas.tsx
const EditorCanvas = () => {
  const { currentBreakpoint } = useUIStore();
  
  const canvasWidth = {
    mobile: '375px',
    tablet: '768px',
    desktop: '100%',
  }[currentBreakpoint];
  
  return (
    <div className="flex justify-center">
      <div style={{ width: canvasWidth, transition: 'width 0.3s' }}>
        {/* Render components */}
      </div>
    </div>
  );
};
```

#### 6. Component Render Responsive Props

Components must apply the correct value based on current breakpoint:

```typescript
// Example: src/components/studio/blocks/typography/heading.tsx
const HeadingBlock = (props: HeadingProps) => {
  const { currentBreakpoint } = useUIStore();
  
  // Helper to get responsive value
  const getResponsiveValue = <T,>(value: ResponsiveValue<T> | T): T => {
    if (value && typeof value === 'object' && 'mobile' in value) {
      return value[currentBreakpoint] ?? value.mobile;
    }
    return value as T;
  };
  
  const fontSize = getResponsiveValue(props.fontSize);
  const textAlign = getResponsiveValue(props.textAlign);
  const padding = getResponsiveValue(props.padding);
  
  return (
    <h1 style={{ fontSize, textAlign, padding }}>
      {props.text}
    </h1>
  );
};
```

---

## Important Constraints

1. **Reuse existing UI** - Use Shadcn/ui components (Button, Popover, Tabs, etc.)
2. **Mobile-first values** - ResponsiveValue.mobile is ALWAYS required
3. **Smooth transitions** - Canvas width changes should animate
4. **Preserve data** - Converting to/from responsive mode must not lose data
5. **Visual feedback** - Always show which breakpoint is active
6. **TypeScript strict** - Must compile with zero errors
7. **Accessibility** - All controls keyboard accessible

---

## Component Field Updates

After Wave 3, update the 10 existing components to use advanced fields:

### Example: Update Section Component

```typescript
// Before (Wave 2):
const SectionFields = {
  backgroundColor: { type: 'text', label: 'Background Color' },
  padding: { type: 'text', label: 'Padding' },
};

// After (Wave 3):
const SectionFields = {
  backgroundColor: { 
    type: 'color', 
    label: 'Background Color',
    defaultValue: 'transparent',
  },
  backgroundImage: {
    type: 'image',
    label: 'Background Image',
  },
  padding: { 
    type: 'spacing', 
    label: 'Padding',
    responsive: true,
    defaultValue: { mobile: '16px', desktop: '64px' },
  },
  minHeight: {
    type: 'text',
    label: 'Min Height',
    responsive: true,
    defaultValue: { mobile: '300px', desktop: '600px' },
  },
};
```

### Update All 10 Components

Each component should use appropriate field types:
- Section: color, image, spacing (responsive)
- Container: spacing (responsive), number (max width)
- Columns: number (responsive for column count), spacing (responsive for gap)
- Heading: typography (responsive), color
- Text: typography (responsive), color
- Button: color, spacing, link
- Image: image, spacing (responsive)
- Spacer: spacing (responsive for height)
- Divider: color, spacing (responsive)
- Icon: color, number (size, responsive)

---

## Output Format

Generate each phase as a complete markdown document with:

```markdown
# PHASE-STUDIO-0X: [Title]

## Overview
| Property | Value |
|----------|-------|
| Phase | STUDIO-0X |
| Priority | Critical |
| Estimated Time | X hours |
| Dependencies | STUDIO-05, STUDIO-06, STUDIO-07, STUDIO-08 |

## Problem Statement
[What this phase solves]

## Implementation Tasks

### Task 1: [Specific task name]

**Files to create:**
- `src/path/to/file.tsx`

**Complete code:**
```typescript
// Full implementation with imports
// NO placeholders
```

**Acceptance Criteria:**
- [ ] Specific testable criterion

### Task 2: [Next task]
...

## Testing Instructions
- How to test each feature

## Success Criteria
- [ ] Overall criterion 1
```

---

## Dependencies Already Installed

From Wave 1:
- ✅ react-colorful
- ✅ @floating-ui/react
- ✅ immer
- ✅ zundo

From Wave 2:
- ✅ @dnd-kit/core
- ✅ @dnd-kit/sortable
- ✅ @dnd-kit/utilities

No new packages needed for Wave 3!

---

## Start Now

Generate **PHASE-STUDIO-09** first (Advanced Field Types), then **PHASE-STUDIO-10** (Responsive Field System).

Each phase should be detailed enough that an AI agent can implement it without additional context beyond this prompt and the master prompt.

---

# MASTER PROMPT FOLLOWS BELOW

[Paste the contents of PHASE-STUDIO-00-MASTER-PROMPT.md here]
