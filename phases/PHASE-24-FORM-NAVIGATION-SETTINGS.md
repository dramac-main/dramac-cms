# Phase 24: Form & Navigation Settings

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Create settings panels for Contact Form, Newsletter, Navigation, and Footer components.

---

## 📋 Prerequisites

- [ ] Phase 23 completed (Form & Navigation Components)

---

## ✅ Tasks

### Task 24.1: Contact Form Settings

**File: `src/components/editor/settings/contact-form-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ContactFormProps } from "../user-components/contact-form";

export function ContactFormSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as ContactFormProps,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Content
        </h4>
        
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={props.title || ""}
            onChange={(e) => setProp((p: ContactFormProps) => (p.title = e.target.value))}
            placeholder="Form title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={props.subtitle || ""}
            onChange={(e) => setProp((p: ContactFormProps) => (p.subtitle = e.target.value))}
            placeholder="Form subtitle"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="buttonText">Button Text</Label>
          <Input
            id="buttonText"
            value={props.buttonText || ""}
            onChange={(e) => setProp((p: ContactFormProps) => (p.buttonText = e.target.value))}
            placeholder="Submit button text"
          />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Form Fields
        </h4>

        <div className="flex items-center justify-between">
          <Label htmlFor="showName">Show Name Fields</Label>
          <Switch
            id="showName"
            checked={props.showName ?? true}
            onCheckedChange={(checked) =>
              setProp((p: ContactFormProps) => (p.showName = checked))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showPhone">Show Phone Field</Label>
          <Switch
            id="showPhone"
            checked={props.showPhone ?? false}
            onCheckedChange={(checked) =>
              setProp((p: ContactFormProps) => (p.showPhone = checked))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showSubject">Show Subject Field</Label>
          <Switch
            id="showSubject"
            checked={props.showSubject ?? true}
            onCheckedChange={(checked) =>
              setProp((p: ContactFormProps) => (p.showSubject = checked))
            }
          />
        </div>
      </div>

      {/* Style */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Style
        </h4>

        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Background Color</Label>
          <div className="flex gap-2">
            <Input
              id="backgroundColor"
              value={props.backgroundColor || ""}
              onChange={(e) =>
                setProp((p: ContactFormProps) => (p.backgroundColor = e.target.value))
              }
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={props.backgroundColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: ContactFormProps) => (p.backgroundColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="formBackgroundColor">Form Background</Label>
          <div className="flex gap-2">
            <Input
              id="formBackgroundColor"
              value={props.formBackgroundColor || ""}
              onChange={(e) =>
                setProp((p: ContactFormProps) => (p.formBackgroundColor = e.target.value))
              }
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={props.formBackgroundColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: ContactFormProps) => (p.formBackgroundColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Task 24.2: Newsletter Settings

**File: `src/components/editor/settings/newsletter-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NewsletterProps } from "../user-components/newsletter";

export function NewsletterSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as NewsletterProps,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Content
        </h4>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={props.title || ""}
            onChange={(e) => setProp((p: NewsletterProps) => (p.title = e.target.value))}
            placeholder="Newsletter title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={props.subtitle || ""}
            onChange={(e) => setProp((p: NewsletterProps) => (p.subtitle = e.target.value))}
            placeholder="Newsletter subtitle"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="placeholder">Input Placeholder</Label>
          <Input
            id="placeholder"
            value={props.placeholder || ""}
            onChange={(e) => setProp((p: NewsletterProps) => (p.placeholder = e.target.value))}
            placeholder="Email placeholder text"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="buttonText">Button Text</Label>
          <Input
            id="buttonText"
            value={props.buttonText || ""}
            onChange={(e) => setProp((p: NewsletterProps) => (p.buttonText = e.target.value))}
            placeholder="Subscribe"
          />
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Layout
        </h4>

        <div className="space-y-2">
          <Label>Form Layout</Label>
          <Select
            value={props.layout || "inline"}
            onValueChange={(value: "inline" | "stacked") =>
              setProp((p: NewsletterProps) => (p.layout = value))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inline">Inline</SelectItem>
              <SelectItem value="stacked">Stacked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Style */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Style
        </h4>

        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Background Color</Label>
          <div className="flex gap-2">
            <Input
              id="backgroundColor"
              value={props.backgroundColor || ""}
              onChange={(e) =>
                setProp((p: NewsletterProps) => (p.backgroundColor = e.target.value))
              }
              placeholder="#1a1a2e"
            />
            <input
              type="color"
              value={props.backgroundColor || "#1a1a2e"}
              onChange={(e) =>
                setProp((p: NewsletterProps) => (p.backgroundColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="textColor">Text Color</Label>
          <div className="flex gap-2">
            <Input
              id="textColor"
              value={props.textColor || ""}
              onChange={(e) =>
                setProp((p: NewsletterProps) => (p.textColor = e.target.value))
              }
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={props.textColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: NewsletterProps) => (p.textColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Task 24.3: Navigation Settings

**File: `src/components/editor/settings/navigation-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import type { NavigationProps, NavLink } from "../user-components/navigation";

export function NavigationSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as NavigationProps,
  }));

  const links = props.links || [];

  const updateLink = (index: number, field: keyof NavLink, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setProp((p: NavigationProps) => (p.links = newLinks));
  };

  const addLink = () => {
    setProp((p: NavigationProps) => {
      p.links = [...(p.links || []), { label: "New Link", href: "#" }];
    });
  };

  const removeLink = (index: number) => {
    setProp((p: NavigationProps) => {
      p.links = (p.links || []).filter((_, i) => i !== index);
    });
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Logo
        </h4>

        <div className="space-y-2">
          <Label htmlFor="logoText">Logo Text</Label>
          <Input
            id="logoText"
            value={props.logoText || ""}
            onChange={(e) => setProp((p: NavigationProps) => (p.logoText = e.target.value))}
            placeholder="Company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Logo URL (optional)</Label>
          <Input
            id="logo"
            value={props.logo || ""}
            onChange={(e) => setProp((p: NavigationProps) => (p.logo = e.target.value))}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Navigation Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Links
          </h4>
          <Button size="sm" variant="outline" onClick={addLink}>
            <Plus className="w-4 h-4 mr-1" />
            Add Link
          </Button>
        </div>

        <div className="space-y-4">
          {links.map((link, index) => (
            <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Link {index + 1}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => removeLink(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <Input
                value={link.label}
                onChange={(e) => updateLink(index, "label", e.target.value)}
                placeholder="Label"
              />
              <Input
                value={link.href}
                onChange={(e) => updateLink(index, "href", e.target.value)}
                placeholder="URL"
              />
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          CTA Button
        </h4>

        <div className="space-y-2">
          <Label htmlFor="ctaText">Button Text</Label>
          <Input
            id="ctaText"
            value={props.ctaText || ""}
            onChange={(e) => setProp((p: NavigationProps) => (p.ctaText = e.target.value))}
            placeholder="Get Started"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ctaHref">Button Link</Label>
          <Input
            id="ctaHref"
            value={props.ctaHref || ""}
            onChange={(e) => setProp((p: NavigationProps) => (p.ctaHref = e.target.value))}
            placeholder="#"
          />
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Options
        </h4>

        <div className="flex items-center justify-between">
          <Label htmlFor="sticky">Sticky Header</Label>
          <Switch
            id="sticky"
            checked={props.sticky ?? false}
            onCheckedChange={(checked) =>
              setProp((p: NavigationProps) => (p.sticky = checked))
            }
          />
        </div>
      </div>

      {/* Style */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Style
        </h4>

        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Background Color</Label>
          <div className="flex gap-2">
            <Input
              id="backgroundColor"
              value={props.backgroundColor || ""}
              onChange={(e) =>
                setProp((p: NavigationProps) => (p.backgroundColor = e.target.value))
              }
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={props.backgroundColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: NavigationProps) => (p.backgroundColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="textColor">Text Color</Label>
          <div className="flex gap-2">
            <Input
              id="textColor"
              value={props.textColor || ""}
              onChange={(e) =>
                setProp((p: NavigationProps) => (p.textColor = e.target.value))
              }
              placeholder="Inherit"
            />
            <input
              type="color"
              value={props.textColor || "#000000"}
              onChange={(e) =>
                setProp((p: NavigationProps) => (p.textColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Task 24.4: Footer Settings

**File: `src/components/editor/settings/footer-settings.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { FooterProps, FooterColumn, SocialLink } from "../user-components/footer";

export function FooterSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as FooterProps,
  }));

  const columns = props.columns || [];
  const socialLinks = props.socialLinks || [];

  // Column management
  const updateColumnTitle = (index: number, title: string) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], title };
    setProp((p: FooterProps) => (p.columns = newColumns));
  };

  const addLinkToColumn = (columnIndex: number) => {
    const newColumns = [...columns];
    newColumns[columnIndex] = {
      ...newColumns[columnIndex],
      links: [...newColumns[columnIndex].links, { label: "New Link", href: "#" }],
    };
    setProp((p: FooterProps) => (p.columns = newColumns));
  };

  const updateColumnLink = (
    columnIndex: number,
    linkIndex: number,
    field: "label" | "href",
    value: string
  ) => {
    const newColumns = [...columns];
    newColumns[columnIndex].links[linkIndex] = {
      ...newColumns[columnIndex].links[linkIndex],
      [field]: value,
    };
    setProp((p: FooterProps) => (p.columns = newColumns));
  };

  const removeColumnLink = (columnIndex: number, linkIndex: number) => {
    const newColumns = [...columns];
    newColumns[columnIndex] = {
      ...newColumns[columnIndex],
      links: newColumns[columnIndex].links.filter((_, i) => i !== linkIndex),
    };
    setProp((p: FooterProps) => (p.columns = newColumns));
  };

  const addColumn = () => {
    setProp((p: FooterProps) => {
      p.columns = [...(p.columns || []), { title: "New Column", links: [] }];
    });
  };

  const removeColumn = (index: number) => {
    setProp((p: FooterProps) => {
      p.columns = (p.columns || []).filter((_, i) => i !== index);
    });
  };

  // Social links management
  const addSocialLink = () => {
    setProp((p: FooterProps) => {
      p.socialLinks = [...(p.socialLinks || []), { platform: "twitter", href: "#" }];
    });
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const newSocials = [...socialLinks];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setProp((p: FooterProps) => (p.socialLinks = newSocials));
  };

  const removeSocialLink = (index: number) => {
    setProp((p: FooterProps) => {
      p.socialLinks = (p.socialLinks || []).filter((_, i) => i !== index);
    });
  };

  return (
    <div className="space-y-6">
      {/* Brand */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Brand
        </h4>

        <div className="space-y-2">
          <Label htmlFor="logoText">Logo Text</Label>
          <Input
            id="logoText"
            value={props.logoText || ""}
            onChange={(e) => setProp((p: FooterProps) => (p.logoText = e.target.value))}
            placeholder="Company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={props.tagline || ""}
            onChange={(e) => setProp((p: FooterProps) => (p.tagline = e.target.value))}
            placeholder="Company tagline"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="copyright">Copyright Text</Label>
          <Input
            id="copyright"
            value={props.copyright || ""}
            onChange={(e) => setProp((p: FooterProps) => (p.copyright = e.target.value))}
            placeholder="© 2025 Company..."
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Social Links
          </h4>
          <Button size="sm" variant="outline" onClick={addSocialLink}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {socialLinks.map((social, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={social.platform}
                onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                placeholder="Platform"
                className="flex-1"
              />
              <Input
                value={social.href}
                onChange={(e) => updateSocialLink(index, "href", e.target.value)}
                placeholder="URL"
                className="flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeSocialLink(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Link Columns */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Link Columns
          </h4>
          <Button size="sm" variant="outline" onClick={addColumn}>
            <Plus className="w-4 h-4 mr-1" />
            Add Column
          </Button>
        </div>

        <div className="space-y-4">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="p-3 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Input
                  value={column.title}
                  onChange={(e) => updateColumnTitle(columnIndex, e.target.value)}
                  placeholder="Column title"
                  className="flex-1 mr-2"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeColumn(columnIndex)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Column Links */}
              <div className="space-y-2 ml-2">
                {column.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="flex gap-2 items-center">
                    <Input
                      value={link.label}
                      onChange={(e) =>
                        updateColumnLink(columnIndex, linkIndex, "label", e.target.value)
                      }
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      value={link.href}
                      onChange={(e) =>
                        updateColumnLink(columnIndex, linkIndex, "href", e.target.value)
                      }
                      placeholder="URL"
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => removeColumnLink(columnIndex, linkIndex)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => addLinkToColumn(columnIndex)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Link
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Style
        </h4>

        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Background Color</Label>
          <div className="flex gap-2">
            <Input
              id="backgroundColor"
              value={props.backgroundColor || ""}
              onChange={(e) =>
                setProp((p: FooterProps) => (p.backgroundColor = e.target.value))
              }
              placeholder="#1a1a2e"
            />
            <input
              type="color"
              value={props.backgroundColor || "#1a1a2e"}
              onChange={(e) =>
                setProp((p: FooterProps) => (p.backgroundColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="textColor">Text Color</Label>
          <div className="flex gap-2">
            <Input
              id="textColor"
              value={props.textColor || ""}
              onChange={(e) =>
                setProp((p: FooterProps) => (p.textColor = e.target.value))
              }
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={props.textColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: FooterProps) => (p.textColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 📐 Acceptance Criteria

- [ ] Contact form settings toggle name/phone/subject fields
- [ ] Newsletter settings switch between inline/stacked layouts
- [ ] Navigation settings allow adding/removing links
- [ ] Footer settings manage columns and their links
- [ ] All color pickers work with text input
- [ ] Social links can be added/removed dynamically
- [ ] Changes reflect immediately in canvas

---

## 📁 Files Created This Phase

```
src/components/editor/settings/
├── contact-form-settings.tsx
├── newsletter-settings.tsx
├── navigation-settings.tsx
└── footer-settings.tsx
```

---

## ➡️ Next Phase

**Phase 25: AI Builder - Foundation** - Prompt input interface, industry templates, generation settings.
