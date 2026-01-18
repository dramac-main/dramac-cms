# Phase 66: Mobile Editor Responsiveness - REVIEW & ENHANCE

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 MEDIUM
>
> **Estimated Time**: 2-3 hours (reduced from 3-4)

---

## ⚠️ PARTIAL IMPLEMENTATION EXISTS!

**What Already Exists:**
- ✅ `src/lib/preview/preview-utils.ts` - Device types, configs, preview URLs
- ✅ `DeviceType = "mobile" | "tablet" | "desktop" | "full"`
- ✅ `DEVICES` configuration array with widths/heights
- ✅ Device switcher in editor toolbar
- ✅ Basic responsive components in editor

**What's Missing (This Phase):**
- ❌ Touch gesture handling for mobile editing
- ❌ Mobile-optimized toolbar (bottom sheet)
- ❌ Touch-friendly component selection
- ❌ Mobile settings panel

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAMES!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `site_modules` | `site_module_installations` |
| `modules` | `modules_v2` |

---

## 🎯 Objective

ENHANCE the existing device preview system with touch-friendly editing capabilities for tablets/mobile devices.

---

## 📋 Prerequisites

- [ ] Phase 65 Export/Import completed
- [ ] `src/lib/preview/preview-utils.ts` exists (it does!)
- [ ] Editor toolbar has device switcher (it does!)

---

## ✅ Tasks

### Task 66.1: Review Existing Device Utils

**Verify `src/lib/preview/preview-utils.ts` exists:**

```typescript
// Already exists!
export type DeviceType = "mobile" | "tablet" | "desktop" | "full";

export const DEVICES: DeviceConfig[] = [
  { id: "mobile", label: "Mobile", icon: "📱", width: 375, height: 667 },
  { id: "tablet", label: "Tablet", icon: "📱", width: 768, height: 1024 },
  { id: "desktop", label: "Desktop", icon: "🖥️", width: 1280, height: 800 },
  { id: "full", label: "Full Width", icon: "🖥️", width: 0, height: 0 },
];
```

---

### Task 66.2: Add Touch Detection Hook

**File: `src/hooks/use-touch-device.ts`**

```typescript
"use client";

import { useState, useEffect } from "react";

export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const mobile = window.innerWidth < 768;
      setIsTouchDevice(touch);
      setIsMobile(mobile);
    };

    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  return { isTouchDevice, isMobile };
}
```

---

### Task 66.3: Mobile Toolbar Component

**File: `src/components/editor/responsive/mobile-toolbar.tsx`**

```typescript
"use client";

import { cn } from "@/lib/utils";
import { useTouchDevice } from "@/hooks/use-touch-device";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Undo2,
  Redo2,
  Eye,
  Save,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileToolbarProps {
  onAddComponent?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPreview?: () => void;
  onSave?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isSaving?: boolean;
  className?: string;
}

export function MobileToolbar({
  onAddComponent,
  onUndo,
  onRedo,
  onPreview,
  onSave,
  canUndo = false,
  canRedo = false,
  isSaving = false,
  className,
}: MobileToolbarProps) {
  const { isMobile } = useTouchDevice();

  if (!isMobile) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t",
        "flex items-center justify-around p-2 safe-area-inset-bottom",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onAddComponent}
        className="touch-manipulation"
      >
        <Plus className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onUndo}
        disabled={!canUndo}
        className="touch-manipulation"
      >
        <Undo2 className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRedo}
        disabled={!canRedo}
        className="touch-manipulation"
      >
        <Redo2 className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onPreview}
        className="touch-manipulation"
      >
        <Eye className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onSave}
        disabled={isSaving}
        className="touch-manipulation"
      >
        <Save className="h-5 w-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="touch-manipulation">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Help</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

---

### Task 66.4: Touch-Friendly Component Selector

**File: `src/components/editor/responsive/mobile-component-sheet.tsx`**

```typescript
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ComponentOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
}

interface MobileComponentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: ComponentOption[];
  onSelect: (componentId: string) => void;
}

export function MobileComponentSheet({
  open,
  onOpenChange,
  components,
  onSelect,
}: MobileComponentSheetProps) {
  const [search, setSearch] = useState("");

  const filtered = components.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce(
    (acc, c) => {
      if (!acc[c.category]) acc[c.category] = [];
      acc[c.category].push(c);
      return acc;
    },
    {} as Record<string, ComponentOption[]>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Add Component</SheetTitle>
        </SheetHeader>

        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[calc(80vh-140px)]">
          <div className="space-y-4 pb-8">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {items.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => {
                        onSelect(component.id);
                        onOpenChange(false);
                      }}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:bg-accent touch-manipulation"
                    >
                      {component.icon}
                      <span className="text-xs truncate max-w-full">
                        {component.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
```

---

### Task 66.5: Mobile Settings Sheet

**File: `src/components/editor/responsive/mobile-settings-sheet.tsx`**

```typescript
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}

export function MobileSettingsSheet({
  open,
  onOpenChange,
  title = "Settings",
  children,
}: MobileSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(70vh-60px)] mt-4">
          <div className="pb-8">{children}</div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
```

---

### Task 66.6: Add Safe Area CSS

**Add to `src/app/globals.css`:**

```css
/* Safe area for mobile devices with notch */
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.safe-area-inset-top {
  padding-top: env(safe-area-inset-top, 0);
}

/* Touch optimization */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

---

## ✅ Completion Checklist

- [ ] Verified `preview-utils.ts` exists
- [ ] Touch detection hook created
- [ ] Mobile toolbar component created
- [ ] Mobile component sheet created
- [ ] Mobile settings sheet created
- [ ] Safe area CSS added
- [ ] Tested on actual mobile device

---

## 📝 Notes for AI Agent

1. **DON'T DUPLICATE** - Device types exist in `src/lib/preview/preview-utils.ts`
2. **ENHANCE, DON'T REPLACE** - Add mobile components, don't rebuild editor
3. **USE SHEETS** - Bottom sheets work best for mobile
4. **TOUCH FRIENDLY** - Min 44px touch targets
5. **TEST ON MOBILE** - Use Chrome DevTools mobile emulation
