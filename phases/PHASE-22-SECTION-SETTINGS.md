# Phase 22: Section Settings

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build settings panels for advanced section components: Hero, Feature Grid, Testimonials, and CTA.

---

## 📋 Prerequisites

- [ ] Phase 1-21 completed

---

## ✅ Tasks

### Task 22.1: Hero Section Settings

**File: `src/components/editor/settings/hero-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import type { HeroSectionProps } from "../user-components/hero-section";

const alignmentOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const heightOptions = [
  { value: "min-h-[400px]", label: "Small (400px)" },
  { value: "min-h-[500px]", label: "Medium (500px)" },
  { value: "min-h-[600px]", label: "Large (600px)" },
  { value: "min-h-screen", label: "Full Screen" },
];

export function HeroSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as HeroSectionProps,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Content</h4>

        <SettingsInput
          label="Title"
          value={props.title || ""}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.title = value))
          }
          placeholder="Main headline"
        />

        <SettingsInput
          label="Subtitle"
          value={props.subtitle || ""}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.subtitle = value))
          }
          placeholder="Supporting text"
        />

        <SettingsInput
          label="Button Text"
          value={props.buttonText || ""}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.buttonText = value))
          }
          placeholder="Call to action"
        />

        <SettingsInput
          label="Button Link"
          value={props.buttonHref || ""}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.buttonHref = value))
          }
          placeholder="https://..."
          type="url"
        />
      </div>

      <Separator />

      {/* Layout */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Layout</h4>

        <SettingsSelect
          label="Alignment"
          value={props.alignment || "center"}
          onChange={(value) =>
            setProp(
              (props: HeroSectionProps) =>
                (props.alignment = value as HeroSectionProps["alignment"])
            )
          }
          options={alignmentOptions}
        />

        <SettingsSelect
          label="Height"
          value={props.height || "min-h-[500px]"}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.height = value))
          }
          options={heightOptions}
        />
      </div>

      <Separator />

      {/* Background */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Background</h4>

        <SettingsInput
          label="Background Image URL"
          value={props.backgroundImage || ""}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.backgroundImage = value))
          }
          placeholder="https://..."
          type="url"
        />

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || "#1a1a2e"}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.backgroundColor = value))
          }
        />

        <SettingsColor
          label="Text Color"
          value={props.textColor || "#ffffff"}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.textColor = value))
          }
        />
      </div>

      <Separator />

      {/* Overlay */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Overlay</h4>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Enable Overlay</Label>
          <Switch
            checked={props.overlay ?? true}
            onCheckedChange={(checked) =>
              setProp((props: HeroSectionProps) => (props.overlay = checked))
            }
          />
        </div>

        {props.overlay && (
          <div className="space-y-2">
            <Label className="text-xs">
              Overlay Opacity: {props.overlayOpacity || 50}%
            </Label>
            <Slider
              value={[props.overlayOpacity || 50]}
              onValueChange={([value]) =>
                setProp((props: HeroSectionProps) => (props.overlayOpacity = value))
              }
              min={0}
              max={100}
              step={5}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

### Task 22.2: Feature Grid Settings

**File: `src/components/editor/settings/feature-grid-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { FeatureGridProps, FeatureItem } from "../user-components/feature-grid";

const columnOptions = [
  { value: "2", label: "2 Columns" },
  { value: "3", label: "3 Columns" },
  { value: "4", label: "4 Columns" },
];

const iconOptions = [
  { value: "Zap", label: "Zap" },
  { value: "Shield", label: "Shield" },
  { value: "Sparkles", label: "Sparkles" },
  { value: "Layers", label: "Layers" },
  { value: "Globe", label: "Globe" },
  { value: "Code", label: "Code" },
];

export function FeatureGridSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as FeatureGridProps,
  }));

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFeature, setEditFeature] = useState<FeatureItem | null>(null);

  const handleAddFeature = () => {
    const newFeature: FeatureItem = {
      icon: "Zap",
      title: "New Feature",
      description: "Feature description",
    };
    setProp((props: FeatureGridProps) => {
      props.features = [...(props.features || []), newFeature];
    });
  };

  const handleUpdateFeature = () => {
    if (editingIndex === null || !editFeature) return;

    setProp((props: FeatureGridProps) => {
      const features = [...(props.features || [])];
      features[editingIndex] = editFeature;
      props.features = features;
    });
    setEditingIndex(null);
    setEditFeature(null);
  };

  const handleDeleteFeature = (index: number) => {
    setProp((props: FeatureGridProps) => {
      props.features = (props.features || []).filter((_, i) => i !== index);
    });
  };

  const features = props.features || [];

  return (
    <div className="space-y-6">
      {/* Header Content */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Header</h4>

        <SettingsInput
          label="Title"
          value={props.title || ""}
          onChange={(value) =>
            setProp((props: FeatureGridProps) => (props.title = value))
          }
          placeholder="Section title"
        />

        <SettingsInput
          label="Subtitle"
          value={props.subtitle || ""}
          onChange={(value) =>
            setProp((props: FeatureGridProps) => (props.subtitle = value))
          }
          placeholder="Section subtitle"
        />
      </div>

      <Separator />

      {/* Layout */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Layout</h4>

        <SettingsSelect
          label="Columns"
          value={String(props.columns || 3)}
          onChange={(value) =>
            setProp(
              (props: FeatureGridProps) => (props.columns = Number(value) as 2 | 3 | 4)
            )
          }
          options={columnOptions}
        />
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Colors</h4>

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || ""}
          onChange={(value) =>
            setProp((props: FeatureGridProps) => (props.backgroundColor = value))
          }
        />

        <SettingsColor
          label="Text Color"
          value={props.textColor || ""}
          onChange={(value) =>
            setProp((props: FeatureGridProps) => (props.textColor = value))
          }
        />
      </div>

      <Separator />

      {/* Features List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Features ({features.length})</h4>
          <Button size="sm" variant="outline" onClick={handleAddFeature}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{feature.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {feature.description}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingIndex(index);
                        setEditFeature({ ...feature });
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Feature</DialogTitle>
                    </DialogHeader>
                    {editFeature && (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <select
                            className="w-full h-9 rounded-md border px-3"
                            value={editFeature.icon}
                            onChange={(e) =>
                              setEditFeature({ ...editFeature, icon: e.target.value })
                            }
                          >
                            {iconOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={editFeature.title}
                            onChange={(e) =>
                              setEditFeature({ ...editFeature, title: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={editFeature.description}
                            onChange={(e) =>
                              setEditFeature({
                                ...editFeature,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                        <Button onClick={handleUpdateFeature} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDeleteFeature(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Task 22.3: Testimonials Settings

**File: `src/components/editor/settings/testimonials-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SettingsInput } from "./settings-input";
import { SettingsColor } from "./settings-color";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { TestimonialsProps, Testimonial } from "../user-components/testimonials";

export function TestimonialsSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as TestimonialsProps,
  }));

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTestimonial, setEditTestimonial] = useState<Testimonial | null>(null);

  const handleAddTestimonial = () => {
    const newTestimonial: Testimonial = {
      quote: "This is an amazing product!",
      author: "John Doe",
      role: "CEO",
      company: "Company Inc",
    };
    setProp((props: TestimonialsProps) => {
      props.testimonials = [...(props.testimonials || []), newTestimonial];
    });
  };

  const handleUpdateTestimonial = () => {
    if (editingIndex === null || !editTestimonial) return;

    setProp((props: TestimonialsProps) => {
      const testimonials = [...(props.testimonials || [])];
      testimonials[editingIndex] = editTestimonial;
      props.testimonials = testimonials;
    });
    setEditingIndex(null);
    setEditTestimonial(null);
  };

  const handleDeleteTestimonial = (index: number) => {
    setProp((props: TestimonialsProps) => {
      props.testimonials = (props.testimonials || []).filter((_, i) => i !== index);
    });
  };

  const testimonials = props.testimonials || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Header</h4>

        <SettingsInput
          label="Title"
          value={props.title || ""}
          onChange={(value) =>
            setProp((props: TestimonialsProps) => (props.title = value))
          }
          placeholder="Section title"
        />
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Colors</h4>

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || "#f8fafc"}
          onChange={(value) =>
            setProp((props: TestimonialsProps) => (props.backgroundColor = value))
          }
        />

        <SettingsColor
          label="Text Color"
          value={props.textColor || ""}
          onChange={(value) =>
            setProp((props: TestimonialsProps) => (props.textColor = value))
          }
        />
      </div>

      <Separator />

      {/* Testimonials List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Testimonials ({testimonials.length})</h4>
          <Button size="sm" variant="outline" onClick={handleAddTestimonial}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{testimonial.author}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {testimonial.quote.substring(0, 50)}...
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingIndex(index);
                        setEditTestimonial({ ...testimonial });
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Testimonial</DialogTitle>
                    </DialogHeader>
                    {editTestimonial && (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Quote</Label>
                          <Textarea
                            value={editTestimonial.quote}
                            onChange={(e) =>
                              setEditTestimonial({
                                ...editTestimonial,
                                quote: e.target.value,
                              })
                            }
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Author Name</Label>
                          <Input
                            value={editTestimonial.author}
                            onChange={(e) =>
                              setEditTestimonial({
                                ...editTestimonial,
                                author: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Input
                              value={editTestimonial.role}
                              onChange={(e) =>
                                setEditTestimonial({
                                  ...editTestimonial,
                                  role: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Company</Label>
                            <Input
                              value={editTestimonial.company}
                              onChange={(e) =>
                                setEditTestimonial({
                                  ...editTestimonial,
                                  company: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <Button onClick={handleUpdateTestimonial} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDeleteTestimonial(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Task 22.4: CTA Section Settings

**File: `src/components/editor/settings/cta-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import type { CTASectionProps } from "../user-components/cta-section";

const layoutOptions = [
  { value: "centered", label: "Centered" },
  { value: "split", label: "Split (Side by Side)" },
];

export function CTASettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as CTASectionProps,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Content</h4>

        <SettingsInput
          label="Title"
          value={props.title || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.title = value))
          }
          placeholder="Headline"
        />

        <SettingsInput
          label="Subtitle"
          value={props.subtitle || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.subtitle = value))
          }
          placeholder="Supporting text"
        />
      </div>

      <Separator />

      {/* Primary Button */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Primary Button</h4>

        <SettingsInput
          label="Button Text"
          value={props.primaryButtonText || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.primaryButtonText = value))
          }
          placeholder="Call to action"
        />

        <SettingsInput
          label="Button Link"
          value={props.primaryButtonHref || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.primaryButtonHref = value))
          }
          placeholder="https://..."
          type="url"
        />
      </div>

      <Separator />

      {/* Secondary Button */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Secondary Button</h4>

        <SettingsInput
          label="Button Text"
          value={props.secondaryButtonText || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.secondaryButtonText = value))
          }
          placeholder="Leave empty to hide"
        />

        <SettingsInput
          label="Button Link"
          value={props.secondaryButtonHref || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.secondaryButtonHref = value))
          }
          placeholder="https://..."
          type="url"
        />
      </div>

      <Separator />

      {/* Layout */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Layout</h4>

        <SettingsSelect
          label="Layout Style"
          value={props.layout || "centered"}
          onChange={(value) =>
            setProp(
              (props: CTASectionProps) =>
                (props.layout = value as CTASectionProps["layout"])
            )
          }
          options={layoutOptions}
        />
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Colors</h4>

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || "#4f46e5"}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.backgroundColor = value))
          }
        />

        <SettingsColor
          label="Text Color"
          value={props.textColor || "#ffffff"}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.textColor = value))
          }
        />
      </div>
    </div>
  );
}
```

### Task 22.5: Slider Component for Settings

**File: `src/components/ui/slider.tsx`**

```typescript
"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
```

### Task 22.6: Update Settings Index

**File: `src/components/editor/settings/index.ts`** (Updated)

```typescript
export * from "./settings-input";
export * from "./settings-select";
export * from "./settings-color";
export * from "./container-settings";
export * from "./text-settings";
export * from "./button-settings";
export * from "./image-settings";
export * from "./hero-settings";
export * from "./feature-grid-settings";
export * from "./testimonials-settings";
export * from "./cta-settings";
```

---

## 📐 Acceptance Criteria

- [ ] Hero settings control all props with live preview
- [ ] Overlay opacity uses slider control
- [ ] Feature grid allows adding/editing/deleting features
- [ ] Testimonials allows managing multiple testimonials
- [ ] CTA settings control both buttons and layout
- [ ] All color pickers work correctly
- [ ] Dialog popups for editing list items
- [ ] Changes reflect immediately on canvas

---

## 📁 Files Created This Phase

```
src/components/ui/
└── slider.tsx

src/components/editor/settings/
├── hero-settings.tsx
├── feature-grid-settings.tsx
├── testimonials-settings.tsx
├── cta-settings.tsx
└── index.ts (updated)
```

---

## ➡️ Next Phase

**Phase 23: Form & Navigation Components** - Contact forms, navigation menu, footer.
