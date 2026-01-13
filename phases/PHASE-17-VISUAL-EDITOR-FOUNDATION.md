# Phase 17: Visual Editor Foundation

> **AI Model**: Claude Opus 4.5 (3x) ⚡
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting
>
> **CRITICAL PHASE**: This is the core of the visual editor. Take extra care.

---

## 🎯 Objective

Set up Craft.js visual editor with canvas, component resolver, toolbox, and basic editing capabilities.

---

## 📋 Prerequisites

- [ ] Phase 1-16 completed

---

## 📦 Install Dependencies

```bash
npm install @craftjs/core @craftjs/layers
```

---

## ✅ Tasks

### Task 17.1: Editor Types

**File: `src/types/editor.ts`**

```typescript
import type { Node, SerializedNodes } from "@craftjs/core";

export interface EditorComponent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: ComponentCategory;
  icon: string;
  defaultProps: Record<string, unknown>;
}

export type ComponentCategory =
  | "layout"
  | "typography"
  | "media"
  | "buttons"
  | "forms"
  | "sections"
  | "navigation";

export interface EditorState {
  nodes: SerializedNodes;
  selectedNodeId: string | null;
  isDragging: boolean;
  isEditing: boolean;
}

export interface CanvasSettings {
  width: "mobile" | "tablet" | "desktop" | "full";
  showGrid: boolean;
  showOutlines: boolean;
}

export const CANVAS_WIDTHS = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
  full: "100%",
} as const;
```

### Task 17.2: User Components - Container

**File: `src/components/editor/user-components/container.tsx`**

```typescript
"use client";

import { useNode, Element } from "@craftjs/core";
import { cn } from "@/lib/utils";

export interface ContainerProps {
  children?: React.ReactNode;
  className?: string;
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  minHeight?: string;
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
}

export function Container({
  children,
  className = "",
  backgroundColor = "",
  padding = "p-4",
  margin = "",
  minHeight = "",
  flexDirection = "column",
  justifyContent = "flex-start",
  alignItems = "stretch",
  gap = "gap-4",
}: ContainerProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => connect(drag(ref!))}
      className={cn(
        "flex",
        padding,
        margin,
        gap,
        minHeight,
        className
      )}
      style={{
        backgroundColor,
        flexDirection,
        justifyContent,
        alignItems,
      }}
    >
      {children}
    </div>
  );
}

Container.craft = {
  displayName: "Container",
  props: {
    className: "",
    backgroundColor: "",
    padding: "p-4",
    margin: "",
    minHeight: "",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
    gap: "gap-4",
  },
  related: {
    toolbar: () => import("../settings/container-settings").then((m) => m.ContainerSettings),
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};
```

### Task 17.3: User Components - Text

**File: `src/components/editor/user-components/text.tsx`**

```typescript
"use client";

import { useNode, useEditor } from "@craftjs/core";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TextProps {
  text?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  className?: string;
  tag?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span";
}

export function Text({
  text = "Click to edit text",
  fontSize = "text-base",
  fontWeight = "font-normal",
  color = "",
  textAlign = "left",
  className = "",
  tag = "p",
}: TextProps) {
  const {
    connectors: { connect, drag },
    actions: { setProp },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) {
      setIsEditing(false);
    }
  }, [selected]);

  const handleDoubleClick = () => {
    if (enabled) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (textRef.current) {
      setProp((props: TextProps) => {
        props.text = textRef.current?.innerText || "";
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      textRef.current?.blur();
    }
  };

  const Tag = tag;

  return (
    <Tag
      ref={(ref) => connect(drag(ref!))}
      className={cn(fontSize, fontWeight, className, {
        "outline-2 outline-primary outline-dashed": isEditing,
        "cursor-text": enabled,
      })}
      style={{ color, textAlign }}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <span ref={textRef}>{text}</span>
    </Tag>
  );
}

Text.craft = {
  displayName: "Text",
  props: {
    text: "Click to edit text",
    fontSize: "text-base",
    fontWeight: "font-normal",
    color: "",
    textAlign: "left",
    className: "",
    tag: "p",
  },
  related: {
    toolbar: () => import("../settings/text-settings").then((m) => m.TextSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
```

### Task 17.4: User Components - Button

**File: `src/components/editor/user-components/button-component.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";

export interface ButtonComponentProps {
  text?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

const variantClasses = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

export function ButtonComponent({
  text = "Click Me",
  variant = "default",
  size = "md",
  href = "",
  className = "",
  backgroundColor = "",
  textColor = "",
  borderRadius = "rounded-md",
}: ButtonComponentProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  const buttonClasses = cn(
    "inline-flex items-center justify-center font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    sizeClasses[size],
    !backgroundColor && variantClasses[variant],
    borderRadius,
    className
  );

  const style = {
    backgroundColor: backgroundColor || undefined,
    color: textColor || undefined,
  };

  // In editor mode, we don't navigate
  return (
    <button
      ref={(ref) => connect(drag(ref!))}
      className={buttonClasses}
      style={style}
      onClick={(e) => e.preventDefault()}
    >
      {text}
    </button>
  );
}

ButtonComponent.craft = {
  displayName: "Button",
  props: {
    text: "Click Me",
    variant: "default",
    size: "md",
    href: "",
    className: "",
    backgroundColor: "",
    textColor: "",
    borderRadius: "rounded-md",
  },
  related: {
    toolbar: () => import("../settings/button-settings").then((m) => m.ButtonSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
```

### Task 17.5: User Components - Image

**File: `src/components/editor/user-components/image-component.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

export interface ImageComponentProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  objectFit?: "cover" | "contain" | "fill" | "none";
  borderRadius?: string;
  className?: string;
}

export function ImageComponent({
  src = "",
  alt = "Image",
  width = "100%",
  height = "auto",
  objectFit = "cover",
  borderRadius = "rounded-none",
  className = "",
}: ImageComponentProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  if (!src) {
    return (
      <div
        ref={(ref) => connect(drag(ref!))}
        className={cn(
          "flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/30",
          borderRadius,
          className
        )}
        style={{ width, height: height === "auto" ? "200px" : height }}
      >
        <div className="text-center p-4">
          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Add an image URL</p>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={(ref) => connect(drag(ref!))}
      src={src}
      alt={alt}
      className={cn(borderRadius, className)}
      style={{
        width,
        height,
        objectFit,
      }}
    />
  );
}

ImageComponent.craft = {
  displayName: "Image",
  props: {
    src: "",
    alt: "Image",
    width: "100%",
    height: "auto",
    objectFit: "cover",
    borderRadius: "rounded-none",
    className: "",
  },
  related: {
    toolbar: () => import("../settings/image-settings").then((m) => m.ImageSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
```

### Task 17.6: Component Resolver

**File: `src/components/editor/resolver.ts`**

```typescript
import { Container } from "./user-components/container";
import { Text } from "./user-components/text";
import { ButtonComponent } from "./user-components/button-component";
import { ImageComponent } from "./user-components/image-component";

// Map of all user components for Craft.js resolver
export const componentResolver = {
  Container,
  Text,
  Button: ButtonComponent,
  Image: ImageComponent,
};

// Component metadata for toolbox
export const componentRegistry = [
  {
    name: "Container",
    displayName: "Container",
    description: "A flexible container for other elements",
    category: "layout" as const,
    icon: "LayoutGrid",
    component: Container,
  },
  {
    name: "Text",
    displayName: "Text",
    description: "Text content with various styles",
    category: "typography" as const,
    icon: "Type",
    component: Text,
  },
  {
    name: "Button",
    displayName: "Button",
    description: "Interactive button element",
    category: "buttons" as const,
    icon: "MousePointer",
    component: ButtonComponent,
  },
  {
    name: "Image",
    displayName: "Image",
    description: "Display images",
    category: "media" as const,
    icon: "Image",
    component: ImageComponent,
  },
];
```

### Task 17.7: Editor Canvas

**File: `src/components/editor/canvas.tsx`**

```typescript
"use client";

import { Frame, Element } from "@craftjs/core";
import { Container } from "./user-components/container";
import { cn } from "@/lib/utils";
import type { CanvasSettings, CANVAS_WIDTHS } from "@/types/editor";

interface EditorCanvasProps {
  settings: CanvasSettings;
}

const widthClasses = {
  mobile: "max-w-[375px]",
  tablet: "max-w-[768px]",
  desktop: "max-w-[1280px]",
  full: "max-w-full",
};

export function EditorCanvas({ settings }: EditorCanvasProps) {
  return (
    <div className="flex-1 overflow-auto bg-muted/30 p-4 md:p-8">
      <div
        className={cn(
          "mx-auto min-h-[600px] bg-background shadow-lg transition-all duration-300",
          widthClasses[settings.width],
          settings.showOutlines && "[&_*]:outline [&_*]:outline-1 [&_*]:outline-border/50"
        )}
      >
        <Frame>
          <Element
            is={Container}
            canvas
            className="min-h-[600px] w-full"
            padding="p-0"
          >
            {/* Initial empty canvas */}
          </Element>
        </Frame>
      </div>
    </div>
  );
}
```

### Task 17.8: Editor Toolbox

**File: `src/components/editor/toolbox.tsx`**

```typescript
"use client";

import { useEditor, Element } from "@craftjs/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { componentRegistry } from "./resolver";
import { Container } from "./user-components/container";
import { Text } from "./user-components/text";
import { ButtonComponent } from "./user-components/button-component";
import { ImageComponent } from "./user-components/image-component";
import {
  LayoutGrid,
  Type,
  MousePointer,
  Image as ImageIcon,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  LayoutGrid,
  Type,
  MousePointer,
  Image: ImageIcon,
};

const componentMap: Record<string, React.ComponentType<any>> = {
  Container,
  Text,
  Button: ButtonComponent,
  Image: ImageComponent,
};

// Group components by category
const categories = Array.from(
  new Set(componentRegistry.map((c) => c.category))
);

const categoryLabels: Record<string, string> = {
  layout: "Layout",
  typography: "Typography",
  buttons: "Buttons",
  media: "Media",
};

export function EditorToolbox() {
  const { connectors } = useEditor();

  return (
    <div className="w-64 border-r bg-background">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Components</h2>
        <p className="text-sm text-muted-foreground">Drag to add</p>
      </div>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 space-y-6">
          {categories.map((category) => {
            const items = componentRegistry.filter((c) => c.category === category);

            return (
              <div key={category}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {categoryLabels[category] || category}
                </h3>
                <div className="space-y-2">
                  {items.map((item) => {
                    const Icon = iconMap[item.icon] || LayoutGrid;
                    const Component = componentMap[item.name];

                    return (
                      <div
                        key={item.name}
                        ref={(ref) =>
                          ref &&
                          connectors.create(
                            ref,
                            item.name === "Container" ? (
                              <Element is={Container} canvas />
                            ) : (
                              <Component />
                            )
                          )
                        }
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          "cursor-move hover:bg-muted transition-colors",
                          "select-none"
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
```

### Task 17.9: Editor Settings Panel

**File: `src/components/editor/settings-panel.tsx`**

```typescript
"use client";

import { useEditor } from "@craftjs/core";
import { Suspense, lazy, useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SettingsPanel() {
  const { selected, actions, query } = useEditor((state) => {
    const currentNodeId = state.events.selected.values().next().value;
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId]?.data.displayName || state.nodes[currentNodeId]?.data.name,
        settings: state.nodes[currentNodeId]?.related?.toolbar,
        isDeletable: query.node(currentNodeId).isDeletable(),
      };
    }

    return { selected };
  });

  const [ToolbarComponent, setToolbarComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (selected?.settings) {
      selected.settings().then((component: { default?: React.ComponentType } | React.ComponentType) => {
        if ('default' in component) {
          setToolbarComponent(() => component.default);
        } else {
          setToolbarComponent(() => component);
        }
      }).catch(() => {
        setToolbarComponent(null);
      });
    } else {
      setToolbarComponent(null);
    }
  }, [selected?.settings, selected?.id]);

  if (!selected) {
    return (
      <div className="w-80 border-l bg-background">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </h2>
        </div>
        <div className="p-4">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Settings className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Select an element to edit its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{selected.name}</h2>
          {selected.isDeletable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => actions.delete(selected.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4">
          <Suspense fallback={<SettingsLoading />}>
            {ToolbarComponent ? (
              <ToolbarComponent />
            ) : (
              <p className="text-sm text-muted-foreground">
                No settings available for this component.
              </p>
            )}
          </Suspense>
        </div>
      </ScrollArea>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
```

### Task 17.10: Editor Provider Setup

**File: `src/components/editor/editor-provider.tsx`**

```typescript
"use client";

import { Editor } from "@craftjs/core";
import { componentResolver } from "./resolver";
import type { ReactNode } from "react";

interface EditorProviderProps {
  children: ReactNode;
  enabled?: boolean;
  onNodesChange?: (query: any) => void;
}

export function EditorProvider({
  children,
  enabled = true,
  onNodesChange,
}: EditorProviderProps) {
  return (
    <Editor
      resolver={componentResolver}
      enabled={enabled}
      onNodesChange={(query) => {
        onNodesChange?.(query);
      }}
    >
      {children}
    </Editor>
  );
}
```

### Task 17.11: Editor Exports

**File: `src/components/editor/index.ts`**

```typescript
// Provider
export * from "./editor-provider";

// Main components
export * from "./canvas";
export * from "./toolbox";
export * from "./settings-panel";

// Resolver
export * from "./resolver";

// User components
export * from "./user-components/container";
export * from "./user-components/text";
export * from "./user-components/button-component";
export * from "./user-components/image-component";
```

---

## 📐 Acceptance Criteria

- [ ] Craft.js installed and configured
- [ ] Container component is droppable and accepts children
- [ ] Text component supports inline editing on double-click
- [ ] Button component renders with variants
- [ ] Image component shows placeholder when empty
- [ ] Toolbox displays all components grouped by category
- [ ] Drag and drop from toolbox works
- [ ] Settings panel loads when element selected
- [ ] Delete button removes selected element
- [ ] Canvas respects width settings

---

## 📁 Files Created This Phase

```
src/types/
└── editor.ts

src/components/editor/
├── index.ts
├── editor-provider.tsx
├── canvas.tsx
├── toolbox.tsx
├── settings-panel.tsx
├── resolver.ts
└── user-components/
    ├── container.tsx
    ├── text.tsx
    ├── button-component.tsx
    └── image-component.tsx
```

---

## ➡️ Next Phase

**Phase 18: Component Settings** - Settings panels for each component with live preview.
