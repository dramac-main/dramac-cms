# Phase 49: Visual Editor - Complete Overhaul

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **⚠️ FIRST**: Read `PHASE-46-REMEDIATION-MASTER-PLAN.md`

---

## 🎯 Objective

Fix all visual editor issues including component settings panels, drag-drop functionality, save/load operations, and add missing essential components.

---

## 📋 Prerequisites

- [ ] Phase 48 completed
- [ ] Client management working
- [ ] Sites can be created

---

## 🔍 Current Issues Analysis

1. **Component Settings Panels**: Many components have incomplete or missing settings
2. **Drag-Drop**: Not working reliably between toolbox and canvas
3. **Save/Load**: Content not persisting correctly
4. **Component Resolver**: Missing many registered components
5. **User Components**: Incomplete implementations

---

## ✅ Tasks

### Task 49.1: Fix Component Resolver

**File: `src/components/editor/resolver.ts`** (REPLACE)

```typescript
import { Text } from "./user-components/text";
import { Container } from "./user-components/container";
import { Button as EditorButton } from "./user-components/button";
import { Image } from "./user-components/image";
import { Heading } from "./user-components/heading";
import { Section } from "./user-components/section";
import { Columns } from "./user-components/columns";
import { Column } from "./user-components/column";
import { Spacer } from "./user-components/spacer";
import { Divider } from "./user-components/divider";
import { Card } from "./user-components/card";
import { Hero } from "./user-components/hero";
import { Features } from "./user-components/features";
import { Testimonials } from "./user-components/testimonials";
import { CTA } from "./user-components/cta";
import { Footer } from "./user-components/footer";
import { Navbar } from "./user-components/navbar";
import { Form } from "./user-components/form";
import { FormField } from "./user-components/form-field";
import { Video } from "./user-components/video";
import { Map } from "./user-components/map";
import { SocialLinks } from "./user-components/social-links";
import { Root } from "./user-components/root";

export const componentResolver = {
  Root,
  Text,
  Container,
  Button: EditorButton,
  Image,
  Heading,
  Section,
  Columns,
  Column,
  Spacer,
  Divider,
  Card,
  Hero,
  Features,
  Testimonials,
  CTA,
  Footer,
  Navbar,
  Form,
  FormField,
  Video,
  Map,
  SocialLinks,
};

export type ComponentTypes = keyof typeof componentResolver;
```

### Task 49.2: Root Component (Canvas Container)

**File: `src/components/editor/user-components/root.tsx`**

```tsx
import { useNode, Element } from "@craftjs/core";
import { ReactNode } from "react";

interface RootProps {
  children?: ReactNode;
  backgroundColor?: string;
  padding?: number;
}

export function Root({ children, backgroundColor = "#ffffff", padding = 0 }: RootProps) {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        backgroundColor,
        padding: `${padding}px`,
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

Root.craft = {
  displayName: "Page",
  props: {
    backgroundColor: "#ffffff",
    padding: 0,
  },
  rules: {
    canDrag: () => false,
  },
};
```

### Task 49.3: Section Component with Settings

**File: `src/components/editor/user-components/section.tsx`**

```tsx
import { useNode, Element } from "@craftjs/core";
import { ReactNode } from "react";
import { SectionSettings } from "../settings/section-settings";

interface SectionProps {
  children?: ReactNode;
  backgroundColor?: string;
  backgroundImage?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  maxWidth?: "full" | "7xl" | "6xl" | "5xl" | "4xl" | "3xl" | "2xl" | "xl";
  minHeight?: number;
  className?: string;
}

const maxWidthMap = {
  full: "100%",
  "7xl": "80rem",
  "6xl": "72rem",
  "5xl": "64rem",
  "4xl": "56rem",
  "3xl": "48rem",
  "2xl": "42rem",
  xl: "36rem",
};

export function Section({
  children,
  backgroundColor = "transparent",
  backgroundImage,
  paddingTop = 48,
  paddingBottom = 48,
  paddingLeft = 24,
  paddingRight = 24,
  maxWidth = "7xl",
  minHeight = 0,
  className = "",
}: SectionProps) {
  const { connectors: { connect, drag } } = useNode();

  return (
    <section
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        minHeight: minHeight ? `${minHeight}px` : undefined,
      }}
      className={className}
    >
      <div
        style={{
          maxWidth: maxWidthMap[maxWidth],
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: `${paddingLeft}px`,
          paddingRight: `${paddingRight}px`,
        }}
      >
        {children || (
          <Element id="section-content" is={Container} canvas>
            <Text text="Add content here..." />
          </Element>
        )}
      </div>
    </section>
  );
}

// Import Container and Text for default content
import { Container } from "./container";
import { Text } from "./text";

Section.craft = {
  displayName: "Section",
  props: {
    backgroundColor: "transparent",
    backgroundImage: "",
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 24,
    paddingRight: 24,
    maxWidth: "7xl",
    minHeight: 0,
  },
  related: {
    settings: SectionSettings,
  },
  rules: {
    canMoveIn: () => true,
  },
};
```

### Task 49.4: Section Settings Panel

**File: `src/components/editor/settings/section-settings.tsx`**

```tsx
import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function SectionSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["layout", "background", "spacing"]}>
        {/* Layout */}
        <AccordionItem value="layout">
          <AccordionTrigger>Layout</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-2">
              <Label>Max Width</Label>
              <Select
                value={props.maxWidth}
                onValueChange={(value) => setProp((props: any) => (props.maxWidth = value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="7xl">7XL (80rem)</SelectItem>
                  <SelectItem value="6xl">6XL (72rem)</SelectItem>
                  <SelectItem value="5xl">5XL (64rem)</SelectItem>
                  <SelectItem value="4xl">4XL (56rem)</SelectItem>
                  <SelectItem value="3xl">3XL (48rem)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Min Height: {props.minHeight}px</Label>
              <Slider
                value={[props.minHeight]}
                onValueChange={([value]) => setProp((props: any) => (props.minHeight = value))}
                min={0}
                max={800}
                step={10}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Background */}
        <AccordionItem value="background">
          <AccordionTrigger>Background</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={props.backgroundColor === "transparent" ? "#ffffff" : props.backgroundColor}
                  onChange={(e) => setProp((props: any) => (props.backgroundColor = e.target.value))}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={props.backgroundColor}
                  onChange={(e) => setProp((props: any) => (props.backgroundColor = e.target.value))}
                  placeholder="transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Background Image URL</Label>
              <Input
                value={props.backgroundImage || ""}
                onChange={(e) => setProp((props: any) => (props.backgroundImage = e.target.value))}
                placeholder="https://..."
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Spacing */}
        <AccordionItem value="spacing">
          <AccordionTrigger>Spacing</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-2">
              <Label>Padding Top: {props.paddingTop}px</Label>
              <Slider
                value={[props.paddingTop]}
                onValueChange={([value]) => setProp((props: any) => (props.paddingTop = value))}
                min={0}
                max={200}
                step={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Padding Bottom: {props.paddingBottom}px</Label>
              <Slider
                value={[props.paddingBottom]}
                onValueChange={([value]) => setProp((props: any) => (props.paddingBottom = value))}
                min={0}
                max={200}
                step={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Padding Left: {props.paddingLeft}px</Label>
              <Slider
                value={[props.paddingLeft]}
                onValueChange={([value]) => setProp((props: any) => (props.paddingLeft = value))}
                min={0}
                max={100}
                step={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Padding Right: {props.paddingRight}px</Label>
              <Slider
                value={[props.paddingRight]}
                onValueChange={([value]) => setProp((props: any) => (props.paddingRight = value))}
                min={0}
                max={100}
                step={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
```

### Task 49.5: Text Component with Inline Editing

**File: `src/components/editor/user-components/text.tsx`**

```tsx
import { useNode, useEditor } from "@craftjs/core";
import { useState, useEffect, useRef } from "react";
import { TextSettings } from "../settings/text-settings";
import ContentEditable from "react-contenteditable";

interface TextProps {
  text?: string;
  fontSize?: number;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  color?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  marginTop?: number;
  marginBottom?: number;
}

export function Text({
  text = "Edit this text...",
  fontSize = 16,
  fontWeight = "normal",
  color = "#1f2937",
  textAlign = "left",
  lineHeight = 1.5,
  marginTop = 0,
  marginBottom = 0,
}: TextProps) {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const [editable, setEditable] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  const fontWeightMap = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  };

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      onClick={() => enabled && setEditable(true)}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight: fontWeightMap[fontWeight],
        color,
        textAlign,
        lineHeight,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        cursor: enabled ? "text" : "default",
        minHeight: "1em",
      }}
    >
      <ContentEditable
        innerRef={contentRef}
        html={text}
        disabled={!editable}
        onChange={(e) => {
          setProp((props: any) => (props.text = e.target.value));
        }}
        onBlur={() => setEditable(false)}
        tagName="p"
        style={{ outline: "none" }}
      />
    </div>
  );
}

Text.craft = {
  displayName: "Text",
  props: {
    text: "Edit this text...",
    fontSize: 16,
    fontWeight: "normal",
    color: "#1f2937",
    textAlign: "left",
    lineHeight: 1.5,
    marginTop: 0,
    marginBottom: 0,
  },
  related: {
    settings: TextSettings,
  },
};
```

### Task 49.6: Text Settings Panel

**File: `src/components/editor/settings/text-settings.tsx`**

```tsx
import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export function TextSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* Text Content */}
      <div className="space-y-2">
        <Label>Text Content</Label>
        <Textarea
          value={props.text}
          onChange={(e) => setProp((props: any) => (props.text = e.target.value))}
          rows={3}
        />
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <Label>Font Size: {props.fontSize}px</Label>
        <Slider
          value={[props.fontSize]}
          onValueChange={([value]) => setProp((props: any) => (props.fontSize = value))}
          min={10}
          max={72}
          step={1}
        />
      </div>

      {/* Font Weight */}
      <div className="space-y-2">
        <Label>Font Weight</Label>
        <Select
          value={props.fontWeight}
          onValueChange={(value) => setProp((props: any) => (props.fontWeight = value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="semibold">Semibold</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Color */}
      <div className="space-y-2">
        <Label>Text Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={props.color}
            onChange={(e) => setProp((props: any) => (props.color = e.target.value))}
            className="w-12 h-10 p-1"
          />
          <Input
            value={props.color}
            onChange={(e) => setProp((props: any) => (props.color = e.target.value))}
          />
        </div>
      </div>

      {/* Text Alignment */}
      <div className="space-y-2">
        <Label>Alignment</Label>
        <ToggleGroup
          type="single"
          value={props.textAlign}
          onValueChange={(value) => value && setProp((props: any) => (props.textAlign = value))}
          className="justify-start"
        >
          <ToggleGroupItem value="left" aria-label="Left">
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Center">
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Right">
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Line Height */}
      <div className="space-y-2">
        <Label>Line Height: {props.lineHeight}</Label>
        <Slider
          value={[props.lineHeight * 10]}
          onValueChange={([value]) => setProp((props: any) => (props.lineHeight = value / 10))}
          min={10}
          max={30}
          step={1}
        />
      </div>

      {/* Margins */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Margin Top</Label>
          <Input
            type="number"
            value={props.marginTop}
            onChange={(e) => setProp((props: any) => (props.marginTop = parseInt(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-2">
          <Label>Margin Bottom</Label>
          <Input
            type="number"
            value={props.marginBottom}
            onChange={(e) => setProp((props: any) => (props.marginBottom = parseInt(e.target.value) || 0))}
          />
        </div>
      </div>
    </div>
  );
}
```

### Task 49.7: Fixed Toolbox with Proper Drag

**File: `src/components/editor/toolbox.tsx`** (REPLACE)

```tsx
"use client";

import { useEditor, Element } from "@craftjs/core";
import { cn } from "@/lib/utils";
import {
  Type,
  Square,
  Image as ImageIcon,
  Heading1,
  Layout,
  Columns as ColumnsIcon,
  Minus,
  MoreHorizontal,
  CreditCard,
  Star,
  MessageSquare,
  Megaphone,
  Menu,
  FileText,
  Video,
  MapPin,
  Share2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Import all components
import { Text } from "./user-components/text";
import { Container } from "./user-components/container";
import { Button as EditorButton } from "./user-components/button";
import { Image } from "./user-components/image";
import { Heading } from "./user-components/heading";
import { Section } from "./user-components/section";
import { Columns } from "./user-components/columns";
import { Spacer } from "./user-components/spacer";
import { Divider } from "./user-components/divider";
import { Card } from "./user-components/card";
import { Hero } from "./user-components/hero";
import { Features } from "./user-components/features";
import { Testimonials } from "./user-components/testimonials";
import { CTA } from "./user-components/cta";
import { Footer } from "./user-components/footer";
import { Navbar } from "./user-components/navbar";
import { Form } from "./user-components/form";
import { Video as VideoComponent } from "./user-components/video";
import { Map } from "./user-components/map";
import { SocialLinks } from "./user-components/social-links";

interface ToolboxItemProps {
  icon: React.ReactNode;
  label: string;
  component: React.ElementType;
  props?: Record<string, unknown>;
}

function ToolboxItem({ icon, label, component: Component, props = {} }: ToolboxItemProps) {
  const { connectors } = useEditor();

  return (
    <div
      ref={(ref) => ref && connectors.create(ref, <Component {...props} />)}
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-lg border bg-card",
        "hover:bg-accent hover:border-primary/50 cursor-grab transition-colors",
        "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span className="text-xs mt-1.5 font-medium">{label}</span>
    </div>
  );
}

const basicComponents: ToolboxItemProps[] = [
  { icon: <Type className="h-5 w-5" />, label: "Text", component: Text },
  { icon: <Heading1 className="h-5 w-5" />, label: "Heading", component: Heading },
  { icon: <ImageIcon className="h-5 w-5" />, label: "Image", component: Image },
  { icon: <Square className="h-5 w-5" />, label: "Button", component: EditorButton },
  { icon: <Minus className="h-5 w-5" />, label: "Divider", component: Divider },
  { icon: <MoreHorizontal className="h-5 w-5" />, label: "Spacer", component: Spacer },
];

const layoutComponents: ToolboxItemProps[] = [
  { icon: <Layout className="h-5 w-5" />, label: "Section", component: Section },
  { icon: <Square className="h-5 w-5" />, label: "Container", component: Container },
  { icon: <ColumnsIcon className="h-5 w-5" />, label: "Columns", component: Columns },
  { icon: <CreditCard className="h-5 w-5" />, label: "Card", component: Card },
];

const blockComponents: ToolboxItemProps[] = [
  { icon: <Star className="h-5 w-5" />, label: "Hero", component: Hero },
  { icon: <Layout className="h-5 w-5" />, label: "Features", component: Features },
  { icon: <MessageSquare className="h-5 w-5" />, label: "Testimonials", component: Testimonials },
  { icon: <Megaphone className="h-5 w-5" />, label: "CTA", component: CTA },
  { icon: <Menu className="h-5 w-5" />, label: "Navbar", component: Navbar },
  { icon: <FileText className="h-5 w-5" />, label: "Footer", component: Footer },
];

const mediaComponents: ToolboxItemProps[] = [
  { icon: <Video className="h-5 w-5" />, label: "Video", component: VideoComponent },
  { icon: <MapPin className="h-5 w-5" />, label: "Map", component: Map },
  { icon: <Share2 className="h-5 w-5" />, label: "Social", component: SocialLinks },
];

const formComponents: ToolboxItemProps[] = [
  { icon: <FileText className="h-5 w-5" />, label: "Form", component: Form },
];

export function EditorToolbox() {
  return (
    <div className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Components</h3>
        <p className="text-xs text-muted-foreground">Drag to add to canvas</p>
      </div>
      <ScrollArea className="flex-1">
        <Accordion
          type="multiple"
          defaultValue={["basic", "layout", "blocks"]}
          className="p-2"
        >
          <AccordionItem value="basic">
            <AccordionTrigger className="text-sm">Basic</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                {basicComponents.map((item) => (
                  <ToolboxItem key={item.label} {...item} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="layout">
            <AccordionTrigger className="text-sm">Layout</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                {layoutComponents.map((item) => (
                  <ToolboxItem key={item.label} {...item} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="blocks">
            <AccordionTrigger className="text-sm">Blocks</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                {blockComponents.map((item) => (
                  <ToolboxItem key={item.label} {...item} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="media">
            <AccordionTrigger className="text-sm">Media</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                {mediaComponents.map((item) => (
                  <ToolboxItem key={item.label} {...item} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="forms">
            <AccordionTrigger className="text-sm">Forms</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                {formComponents.map((item) => (
                  <ToolboxItem key={item.label} {...item} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  );
}
```

### Task 49.8: Fixed Canvas Component

**File: `src/components/editor/canvas.tsx`** (REPLACE)

```tsx
"use client";

import { Frame, Element, useEditor } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { Root } from "./user-components/root";
import type { CanvasSettings } from "@/types/editor";

interface EditorCanvasProps {
  settings: CanvasSettings;
}

const widthMap = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
};

export function EditorCanvas({ settings }: EditorCanvasProps) {
  const { connectors, enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const canvasWidth = settings.width === "desktop" ? "100%" : `${widthMap[settings.width]}px`;

  return (
    <div
      className={cn(
        "flex-1 overflow-auto bg-muted/30 p-4",
        settings.showGrid && "bg-grid-pattern"
      )}
    >
      <div
        ref={(ref) => ref && connectors.select(connectors.hover(ref, null), null)}
        style={{
          width: canvasWidth,
          maxWidth: "100%",
          margin: "0 auto",
          minHeight: "calc(100vh - 200px)",
          transition: "width 0.3s ease",
        }}
        className={cn(
          "bg-white shadow-lg",
          settings.showOutlines && "[&_*]:outline [&_*]:outline-1 [&_*]:outline-dashed [&_*]:outline-blue-300/50"
        )}
      >
        <Frame>
          <Element
            is={Root}
            canvas
            custom={{ displayName: "Page" }}
          />
        </Frame>
      </div>
    </div>
  );
}
```

### Task 49.9: Fixed Settings Panel

**File: `src/components/editor/settings-panel.tsx`** (REPLACE)

```tsx
"use client";

import { useEditor } from "@craftjs/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Layers, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function SettingsPanel() {
  const { selected, actions, query } = useEditor((state) => {
    const currentNodeId = state.events.selected.size === 1 
      ? Array.from(state.events.selected)[0] 
      : null;
    
    let selectedNode = null;
    let selectedNodeName = null;
    let isDeletable = false;

    if (currentNodeId) {
      selectedNode = state.nodes[currentNodeId];
      selectedNodeName = selectedNode?.data.custom?.displayName || 
                        selectedNode?.data.displayName || 
                        selectedNode?.data.name || 
                        "Component";
      isDeletable = query.node(currentNodeId).isDeletable();
    }

    return {
      selected: currentNodeId,
      selectedNode,
      selectedNodeName,
      isDeletable,
    };
  });

  const handleDelete = () => {
    if (selected) {
      actions.delete(selected);
    }
  };

  if (!selected) {
    return (
      <div className="w-72 border-l bg-card flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a component to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  // Get the settings component from the selected node
  const { related } = useEditor((state) => {
    const nodeId = Array.from(state.events.selected)[0];
    if (!nodeId) return { related: null };
    
    const node = state.nodes[nodeId];
    return {
      related: node?.related,
    };
  });

  const SettingsComponent = related?.settings;

  return (
    <div className="w-72 border-l bg-card flex flex-col">
      <Tabs defaultValue="settings" className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold truncate">{selected}</h3>
            {selected && query.node(selected).isDeletable() && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-danger hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <TabsList className="w-full">
            <TabsTrigger value="settings" className="flex-1">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="layers" className="flex-1">
              <Layers className="h-4 w-4 mr-1" />
              Layers
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="settings" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4">
              {SettingsComponent ? (
                <SettingsComponent />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No settings available for this component.
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="layers" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4">
              <LayersPanel />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LayersPanel() {
  const { nodes, actions } = useEditor((state) => ({
    nodes: state.nodes,
  }));

  const renderNode = (nodeId: string, depth: number = 0) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const displayName = node.data.custom?.displayName || 
                       node.data.displayName || 
                       node.data.name || 
                       "Component";

    const childNodes = node.data.nodes || [];

    return (
      <div key={nodeId}>
        <button
          onClick={() => actions.selectNode(nodeId)}
          className={cn(
            "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent",
            "flex items-center gap-2"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <Layers className="h-3 w-3 text-muted-foreground" />
          <span className="truncate">{displayName}</span>
        </button>
        {childNodes.map((childId: string) => renderNode(childId, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {renderNode("ROOT")}
    </div>
  );
}

// Add cn import
import { cn } from "@/lib/utils";
```

### Task 49.10: Install Required Dependencies

Add to package.json and install:

```bash
pnpm add react-contenteditable
```

---

## 🧪 Testing Checklist

After implementing this phase, verify:

- [ ] Components can be dragged from toolbox
- [ ] Components drop correctly on canvas
- [ ] Selected components show in settings panel
- [ ] Text editing works inline
- [ ] Settings changes apply in real-time
- [ ] Save button saves content
- [ ] Reloading page restores content
- [ ] Undo/redo works (Ctrl+Z/Ctrl+Y)
- [ ] Delete component works
- [ ] Layers panel shows component tree
- [ ] Canvas width modes work (mobile/tablet/desktop)
- [ ] Outline mode shows component boundaries

---

## 📝 Notes

- ContentEditable enables inline text editing without a modal
- Settings panels use Accordion for organized grouped settings
- Layers panel provides component tree navigation
- All components must have `.craft` static property for Craft.js
- Components with `canvas` prop can contain other components
