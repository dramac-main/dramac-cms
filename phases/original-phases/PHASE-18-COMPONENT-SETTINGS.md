# Phase 18: Component Settings

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build settings panels for each visual editor component with live preview updates.

---

## 📋 Prerequisites

- [ ] Phase 1-17 completed

---

## ✅ Tasks

### Task 18.1: Settings Input Components

**File: `src/components/editor/settings/settings-input.tsx`**

```typescript
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SettingsInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "url" | "color";
  className?: string;
}

export function SettingsInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: SettingsInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9"
      />
    </div>
  );
}
```

**File: `src/components/editor/settings/settings-select.tsx`**

```typescript
"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SettingsSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}

export function SettingsSelect({
  label,
  value,
  onChange,
  options,
  className,
}: SettingsSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

**File: `src/components/editor/settings/settings-color.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const presetColors = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

interface SettingsColorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SettingsColor({
  label,
  value,
  onChange,
  className,
}: SettingsColorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start h-9"
          >
            <div
              className="h-4 w-4 rounded border mr-2"
              style={{ backgroundColor: value || "#ffffff" }}
            />
            {value || "Select color"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "h-8 w-8 rounded border-2 transition-all",
                    value === color
                      ? "border-primary scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="h-9"
              />
              <Input
                type="color"
                value={value || "#000000"}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-12 p-1 cursor-pointer"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

### Task 18.2: Container Settings

**File: `src/components/editor/settings/container-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import type { ContainerProps } from "../user-components/container";

const paddingOptions = [
  { value: "p-0", label: "None" },
  { value: "p-2", label: "Small (8px)" },
  { value: "p-4", label: "Medium (16px)" },
  { value: "p-6", label: "Large (24px)" },
  { value: "p-8", label: "X-Large (32px)" },
  { value: "p-12", label: "2X-Large (48px)" },
];

const gapOptions = [
  { value: "gap-0", label: "None" },
  { value: "gap-2", label: "Small (8px)" },
  { value: "gap-4", label: "Medium (16px)" },
  { value: "gap-6", label: "Large (24px)" },
  { value: "gap-8", label: "X-Large (32px)" },
];

const flexDirectionOptions = [
  { value: "column", label: "Vertical" },
  { value: "row", label: "Horizontal" },
];

const justifyOptions = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Space Between" },
  { value: "space-around", label: "Space Around" },
];

const alignOptions = [
  { value: "stretch", label: "Stretch" },
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
];

export function ContainerSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as ContainerProps,
  }));

  return (
    <div className="space-y-6">
      {/* Layout */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Layout</h4>

        <SettingsSelect
          label="Direction"
          value={props.flexDirection || "column"}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.flexDirection = value as "row" | "column"))
          }
          options={flexDirectionOptions}
        />

        <SettingsSelect
          label="Justify Content"
          value={props.justifyContent || "flex-start"}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.justifyContent = value))
          }
          options={justifyOptions}
        />

        <SettingsSelect
          label="Align Items"
          value={props.alignItems || "stretch"}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.alignItems = value))
          }
          options={alignOptions}
        />

        <SettingsSelect
          label="Gap"
          value={props.gap || "gap-4"}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.gap = value))
          }
          options={gapOptions}
        />
      </div>

      <Separator />

      {/* Spacing */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Spacing</h4>

        <SettingsSelect
          label="Padding"
          value={props.padding || "p-4"}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.padding = value))
          }
          options={paddingOptions}
        />

        <SettingsInput
          label="Min Height"
          value={props.minHeight || ""}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.minHeight = value))
          }
          placeholder="e.g., min-h-[400px]"
        />
      </div>

      <Separator />

      {/* Appearance */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Appearance</h4>

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || ""}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.backgroundColor = value))
          }
        />

        <SettingsInput
          label="Custom Classes"
          value={props.className || ""}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.className = value))
          }
          placeholder="e.g., rounded-lg shadow-md"
        />
      </div>
    </div>
  );
}
```

### Task 18.3: Text Settings

**File: `src/components/editor/settings/text-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import { SettingsInput } from "./settings-input";
import type { TextProps } from "../user-components/text";

const tagOptions = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
  { value: "h5", label: "Heading 5" },
  { value: "h6", label: "Heading 6" },
  { value: "span", label: "Span" },
];

const fontSizeOptions = [
  { value: "text-xs", label: "Extra Small" },
  { value: "text-sm", label: "Small" },
  { value: "text-base", label: "Base" },
  { value: "text-lg", label: "Large" },
  { value: "text-xl", label: "X-Large" },
  { value: "text-2xl", label: "2X-Large" },
  { value: "text-3xl", label: "3X-Large" },
  { value: "text-4xl", label: "4X-Large" },
  { value: "text-5xl", label: "5X-Large" },
];

const fontWeightOptions = [
  { value: "font-thin", label: "Thin" },
  { value: "font-light", label: "Light" },
  { value: "font-normal", label: "Normal" },
  { value: "font-medium", label: "Medium" },
  { value: "font-semibold", label: "Semibold" },
  { value: "font-bold", label: "Bold" },
  { value: "font-extrabold", label: "Extra Bold" },
];

const textAlignOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export function TextSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as TextProps,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Content</h4>

        <div className="space-y-2">
          <Label className="text-xs">Text</Label>
          <Textarea
            value={props.text || ""}
            onChange={(e) =>
              setProp((props: TextProps) => (props.text = e.target.value))
            }
            placeholder="Enter text..."
            className="min-h-[80px]"
          />
        </div>

        <SettingsSelect
          label="HTML Tag"
          value={props.tag || "p"}
          onChange={(value) =>
            setProp((props: TextProps) => (props.tag = value as TextProps["tag"]))
          }
          options={tagOptions}
        />
      </div>

      <Separator />

      {/* Typography */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Typography</h4>

        <SettingsSelect
          label="Font Size"
          value={props.fontSize || "text-base"}
          onChange={(value) =>
            setProp((props: TextProps) => (props.fontSize = value))
          }
          options={fontSizeOptions}
        />

        <SettingsSelect
          label="Font Weight"
          value={props.fontWeight || "font-normal"}
          onChange={(value) =>
            setProp((props: TextProps) => (props.fontWeight = value))
          }
          options={fontWeightOptions}
        />

        <SettingsSelect
          label="Text Align"
          value={props.textAlign || "left"}
          onChange={(value) =>
            setProp((props: TextProps) => (props.textAlign = value as "left" | "center" | "right"))
          }
          options={textAlignOptions}
        />

        <SettingsColor
          label="Text Color"
          value={props.color || ""}
          onChange={(value) =>
            setProp((props: TextProps) => (props.color = value))
          }
        />
      </div>

      <Separator />

      {/* Custom */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Custom</h4>

        <SettingsInput
          label="Custom Classes"
          value={props.className || ""}
          onChange={(value) =>
            setProp((props: TextProps) => (props.className = value))
          }
          placeholder="e.g., italic underline"
        />
      </div>
    </div>
  );
}
```

### Task 18.4: Button Settings

**File: `src/components/editor/settings/button-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import type { ButtonComponentProps } from "../user-components/button-component";

const variantOptions = [
  { value: "default", label: "Default" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "destructive", label: "Destructive" },
];

const sizeOptions = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const borderRadiusOptions = [
  { value: "rounded-none", label: "None" },
  { value: "rounded-sm", label: "Small" },
  { value: "rounded-md", label: "Medium" },
  { value: "rounded-lg", label: "Large" },
  { value: "rounded-full", label: "Full" },
];

export function ButtonSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as ButtonComponentProps,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Content</h4>

        <SettingsInput
          label="Button Text"
          value={props.text || ""}
          onChange={(value) =>
            setProp((props: ButtonComponentProps) => (props.text = value))
          }
          placeholder="Click Me"
        />

        <SettingsInput
          label="Link URL"
          value={props.href || ""}
          onChange={(value) =>
            setProp((props: ButtonComponentProps) => (props.href = value))
          }
          placeholder="https://example.com"
          type="url"
        />
      </div>

      <Separator />

      {/* Style */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Style</h4>

        <SettingsSelect
          label="Variant"
          value={props.variant || "default"}
          onChange={(value) =>
            setProp(
              (props: ButtonComponentProps) =>
                (props.variant = value as ButtonComponentProps["variant"])
            )
          }
          options={variantOptions}
        />

        <SettingsSelect
          label="Size"
          value={props.size || "md"}
          onChange={(value) =>
            setProp(
              (props: ButtonComponentProps) =>
                (props.size = value as ButtonComponentProps["size"])
            )
          }
          options={sizeOptions}
        />

        <SettingsSelect
          label="Border Radius"
          value={props.borderRadius || "rounded-md"}
          onChange={(value) =>
            setProp((props: ButtonComponentProps) => (props.borderRadius = value))
          }
          options={borderRadiusOptions}
        />
      </div>

      <Separator />

      {/* Custom Colors */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Custom Colors</h4>
        <p className="text-xs text-muted-foreground">
          Override variant colors
        </p>

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || ""}
          onChange={(value) =>
            setProp((props: ButtonComponentProps) => (props.backgroundColor = value))
          }
        />

        <SettingsColor
          label="Text Color"
          value={props.textColor || ""}
          onChange={(value) =>
            setProp((props: ButtonComponentProps) => (props.textColor = value))
          }
        />
      </div>

      <Separator />

      {/* Custom */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Custom</h4>

        <SettingsInput
          label="Custom Classes"
          value={props.className || ""}
          onChange={(value) =>
            setProp((props: ButtonComponentProps) => (props.className = value))
          }
          placeholder="e.g., shadow-lg"
        />
      </div>
    </div>
  );
}
```

### Task 18.5: Image Settings

**File: `src/components/editor/settings/image-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import type { ImageComponentProps } from "../user-components/image-component";

const objectFitOptions = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
  { value: "fill", label: "Fill" },
  { value: "none", label: "None" },
];

const borderRadiusOptions = [
  { value: "rounded-none", label: "None" },
  { value: "rounded-sm", label: "Small" },
  { value: "rounded-md", label: "Medium" },
  { value: "rounded-lg", label: "Large" },
  { value: "rounded-xl", label: "X-Large" },
  { value: "rounded-2xl", label: "2X-Large" },
  { value: "rounded-full", label: "Full" },
];

export function ImageSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as ImageComponentProps,
  }));

  return (
    <div className="space-y-6">
      {/* Source */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Image Source</h4>

        <SettingsInput
          label="Image URL"
          value={props.src || ""}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.src = value))
          }
          placeholder="https://example.com/image.jpg"
          type="url"
        />

        <SettingsInput
          label="Alt Text"
          value={props.alt || ""}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.alt = value))
          }
          placeholder="Describe the image"
        />
      </div>

      <Separator />

      {/* Dimensions */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Dimensions</h4>

        <SettingsInput
          label="Width"
          value={props.width || "100%"}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.width = value))
          }
          placeholder="100% or 300px"
        />

        <SettingsInput
          label="Height"
          value={props.height || "auto"}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.height = value))
          }
          placeholder="auto or 200px"
        />

        <SettingsSelect
          label="Object Fit"
          value={props.objectFit || "cover"}
          onChange={(value) =>
            setProp(
              (props: ImageComponentProps) =>
                (props.objectFit = value as ImageComponentProps["objectFit"])
            )
          }
          options={objectFitOptions}
        />
      </div>

      <Separator />

      {/* Style */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Style</h4>

        <SettingsSelect
          label="Border Radius"
          value={props.borderRadius || "rounded-none"}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.borderRadius = value))
          }
          options={borderRadiusOptions}
        />

        <SettingsInput
          label="Custom Classes"
          value={props.className || ""}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.className = value))
          }
          placeholder="e.g., shadow-lg"
        />
      </div>
    </div>
  );
}
```

### Task 18.6: Export Settings

**File: `src/components/editor/settings/index.ts`**

```typescript
export * from "./settings-input";
export * from "./settings-select";
export * from "./settings-color";
export * from "./container-settings";
export * from "./text-settings";
export * from "./button-settings";
export * from "./image-settings";
```

---

## 📐 Acceptance Criteria

- [ ] All settings inputs update component props in real-time
- [ ] Container settings control layout and spacing
- [ ] Text settings control typography and content
- [ ] Button settings control variant, size, and colors
- [ ] Image settings control source and dimensions
- [ ] Color picker shows presets and custom input
- [ ] Settings are grouped logically with separators
- [ ] Changes reflect immediately on canvas

---

## 📁 Files Created This Phase

```
src/components/editor/settings/
├── index.ts
├── settings-input.tsx
├── settings-select.tsx
├── settings-color.tsx
├── container-settings.tsx
├── text-settings.tsx
├── button-settings.tsx
└── image-settings.tsx
```

---

## ➡️ Next Phase

**Phase 19: Editor Toolbar** - Top toolbar with undo/redo, viewport controls, save/preview.
