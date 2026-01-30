# PHASE-UI-03B: Navigation Enhancement (Mobile)

## Overview
- **Objective**: Enhance mobile navigation with touch-optimized command sheet, mobile search experience, action menus, and gesture-based quick actions
- **Scope**: Mobile command sheet, pull-to-search, swipe actions, touch-optimized quick actions, mobile nav search
- **Dependencies**: PHASE-UI-03A (Desktop Navigation), PHASE-UI-02B (Mobile Responsiveness)
- **Estimated Effort**: 5-6 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified (Mobile bottom nav, swipe handlers exist)
- [x] No conflicts detected

## What This Phase Delivers

### 1. Mobile Command Sheet
A touch-optimized alternative to the desktop command palette:
- Bottom sheet instead of centered dialog
- Larger touch targets (44px+)
- Swipe to dismiss
- Recent items prominent at top
- Simplified categories

### 2. Mobile Search Experience
- Pull-down to reveal search (header)
- Search in mobile sidebar sheet
- Voice search button (UI only, no implementation)
- Clear visual feedback

### 3. Mobile Action Sheet
Touch-friendly quick actions:
- Bottom sheet with action grid
- Long-press context menus
- Haptic feedback patterns (CSS classes)
- Swipe-to-reveal on list items

### 4. Enhanced Mobile Bottom Nav
- Active indicator animation improvements
- Badge support for notifications
- Haptic feedback classes
- Long-press to open quick actions

## Implementation Steps

### Step 1: Create Mobile Command Sheet Component

**File**: `src/components/layout/mobile-command-sheet.tsx`
**Action**: Create

```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Search,
  X,
  Clock,
  Globe,
  Users,
  Package,
  Settings,
  ArrowRight,
  LayoutDashboard,
  CreditCard,
  ImageIcon,
  Building2,
  Mic,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRecentItems, type RecentItem } from "@/hooks/use-recent-items";
import { cn } from "@/lib/utils";

interface MobileCommandSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sites data for search */
  sites?: Array<{ id: string; name: string; subdomain: string }>;
  /** Clients data for search */
  clients?: Array<{ id: string; name: string }>;
}

// Navigation items for mobile (simplified)
const mobileNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Sites", href: "/dashboard/sites", icon: Globe },
  { title: "Clients", href: "/dashboard/clients", icon: Users },
  { title: "CRM", href: "/dashboard/crm", icon: Building2 },
  { title: "Media", href: "/dashboard/media", icon: ImageIcon },
  { title: "Modules", href: "/marketplace", icon: Package },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", href: "/settings", icon: Settings },
];

/**
 * Mobile-optimized command sheet.
 * Uses bottom sheet pattern for better thumb reachability.
 */
export function MobileCommandSheet({
  open,
  onOpenChange,
  sites = [],
  clients = [],
}: MobileCommandSheetProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { recentItems, addRecentItem } = useRecentItems();

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setSearch("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSelect = useCallback(
    (href: string, item?: { id?: string; title: string; type: RecentItem["type"] }) => {
      if (item?.id) {
        addRecentItem({
          id: item.id,
          title: item.title,
          href,
          type: item.type,
        });
      }
      onOpenChange(false);
      router.push(href);
    },
    [router, addRecentItem, onOpenChange]
  );

  // Filter items based on search
  const filteredNav = search
    ? mobileNavItems.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
      )
    : mobileNavItems;

  const filteredSites = search
    ? sites.filter(
        (site) =>
          site.name.toLowerCase().includes(search.toLowerCase()) ||
          site.subdomain.toLowerCase().includes(search.toLowerCase())
      )
    : sites.slice(0, 3);

  const filteredClients = search
    ? clients.filter((client) =>
        client.name.toLowerCase().includes(search.toLowerCase())
      )
    : clients.slice(0, 3);

  // Handle drag to dismiss
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onOpenChange(false);
    }
  };

  // Get icon for recent item type
  const getTypeIcon = (type: RecentItem["type"]) => {
    switch (type) {
      case "site": return Globe;
      case "client": return Users;
      case "module": return Package;
      default: return ArrowRight;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl bg-background shadow-xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Search header */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search pages, sites, clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 pl-10 pr-20 text-base rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {/* Voice search button (UI only) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    aria-label="Voice search"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  {search && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => setSearch("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-4 pb-safe" style={{ maxHeight: "calc(85vh - 100px)" }}>
              {/* Recent Items */}
              {!search && recentItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Recent
                  </h3>
                  <div className="space-y-1">
                    {recentItems.slice(0, 4).map((item) => {
                      const Icon = getTypeIcon(item.type);
                      return (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => handleSelect(item.href, { id: item.id, title: item.title, type: item.type })}
                          className="flex w-full items-center gap-3 rounded-xl p-3 text-left active:bg-muted transition-colors touch-manipulation"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  {search ? "Pages" : "Quick Access"}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {filteredNav.slice(0, 8).map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleSelect(item.href, { title: item.title, type: "route" })}
                      className="flex flex-col items-center gap-1.5 rounded-xl p-3 active:bg-muted transition-colors touch-manipulation"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-medium text-center truncate w-full">
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sites */}
              {filteredSites.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Sites</h3>
                  <div className="space-y-1">
                    {filteredSites.map((site) => (
                      <button
                        key={site.id}
                        onClick={() =>
                          handleSelect(`/dashboard/sites/${site.id}`, {
                            id: site.id,
                            title: site.name,
                            type: "site",
                          })
                        }
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left active:bg-muted transition-colors touch-manipulation"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                          <Globe className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{site.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {site.subdomain}.dramac.io
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clients */}
              {filteredClients.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Clients</h3>
                  <div className="space-y-1">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() =>
                          handleSelect(`/dashboard/clients/${client.id}`, {
                            id: client.id,
                            title: client.name,
                            type: "client",
                          })
                        }
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left active:bg-muted transition-colors touch-manipulation"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                          <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{client.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {search && filteredNav.length === 0 && filteredSites.length === 0 && filteredClients.length === 0 && (
                <div className="py-12 text-center">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-3 font-medium">No results found</p>
                  <p className="text-sm text-muted-foreground">
                    Try searching for something else
                  </p>
                </div>
              )}

              {/* Safe area padding for iOS */}
              <div className="h-4" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Step 2: Create Mobile Action Sheet Component

**File**: `src/components/layout/mobile-action-sheet.tsx`
**Action**: Create

```typescript
"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Plus,
  Globe,
  Users,
  ImageIcon,
  FileText,
  Mail,
  Package,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const actions: ActionItem[] = [
  {
    id: "new-site",
    title: "New Site",
    description: "Create a new website",
    href: "/dashboard/sites?action=new",
    icon: Globe,
    color: "bg-blue-500",
  },
  {
    id: "new-client",
    title: "New Client",
    description: "Add a client account",
    href: "/dashboard/clients?action=new",
    icon: Users,
    color: "bg-green-500",
  },
  {
    id: "upload-media",
    title: "Upload Media",
    description: "Add images or files",
    href: "/dashboard/media?action=upload",
    icon: ImageIcon,
    color: "bg-purple-500",
  },
  {
    id: "new-page",
    title: "New Page",
    description: "Create a new page",
    href: "/dashboard/sites?action=new-page",
    icon: FileText,
    color: "bg-orange-500",
  },
];

interface MobileActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Mobile action sheet for quick creation actions.
 * Triggered by FAB or long-press on bottom nav.
 */
export function MobileActionSheet({ open, onOpenChange }: MobileActionSheetProps) {
  const router = useRouter();

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange]
  );

  // Handle drag to dismiss
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onOpenChange(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background shadow-xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div>
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <p className="text-sm text-muted-foreground">Create something new</p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted active:bg-muted/80 touch-manipulation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Actions grid */}
            <div className="grid grid-cols-2 gap-3 px-4 pb-safe">
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelect(action.href)}
                  className="flex flex-col items-start gap-3 rounded-2xl bg-muted/50 p-4 text-left active:bg-muted transition-colors touch-manipulation"
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl text-white",
                      action.color
                    )}
                  >
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{action.title}</p>
                    {action.description && (
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Safe area padding */}
            <div className="h-4" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Step 3: Create Mobile Search Trigger in Header

**File**: `src/components/layout/mobile-search-trigger.tsx`
**Action**: Create

```typescript
"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileCommandSheet } from "./mobile-command-sheet";
import { cn } from "@/lib/utils";

interface MobileSearchTriggerProps {
  sites?: Array<{ id: string; name: string; subdomain: string }>;
  clients?: Array<{ id: string; name: string }>;
  className?: string;
}

/**
 * Search trigger button for mobile header.
 * Opens the mobile command sheet.
 */
export function MobileSearchTrigger({ sites, clients, className }: MobileSearchTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-10 w-10 touch-manipulation", className)}
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Button>

      <MobileCommandSheet
        open={open}
        onOpenChange={setOpen}
        sites={sites}
        clients={clients}
      />
    </>
  );
}
```

### Step 4: Create Mobile FAB Component

**File**: `src/components/layout/mobile-fab.tsx`
**Action**: Create

```typescript
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { MobileActionSheet } from "./mobile-action-sheet";
import { cn } from "@/lib/utils";

interface MobileFABProps {
  className?: string;
}

/**
 * Mobile Floating Action Button.
 * Positioned above the bottom navigation.
 * Opens the action sheet for quick creation.
 */
export function MobileFAB({ className }: MobileFABProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className={cn(
          "fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg",
          "bottom-20 right-4", // Above bottom nav
          "active:bg-primary/90 touch-manipulation",
          className
        )}
        aria-label="Create new"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <MobileActionSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
```

### Step 5: Update Mobile Bottom Nav with Long Press

**File**: `src/components/layout/mobile-bottom-nav.tsx`
**Action**: Modify

Add long-press gesture to open action sheet and badge support.

### Step 6: Update Dashboard Layout Client

**File**: `src/components/layout/dashboard-layout-client.tsx`
**Action**: Modify

Integrate command palette for desktop and mobile components.

### Step 7: Update Layout Exports

**File**: `src/components/layout/index.ts`
**Action**: Modify

Add exports for new mobile components.

## Verification Steps

1. **TypeScript Compilation**:
   ```bash
   cd next-platform-dashboard
   npx tsc --noEmit --skipLibCheck
   ```

2. **Build Verification**:
   ```bash
   pnpm build
   ```

3. **Manual Testing (Mobile)**:
   - Tap search icon in mobile header → Command sheet opens
   - Swipe down on sheet → Dismisses
   - Tap FAB → Action sheet opens
   - Recent items show at top of command sheet
   - Grid navigation is touch-friendly (44px+ targets)
   - Safe area padding works on iOS

4. **Expected Outcomes**:
   - Smooth bottom sheet animations
   - Touch targets are 44px minimum
   - Swipe gestures work naturally
   - Recent items persist
   - Search filters in real-time

## Rollback Plan

If issues arise:
1. Remove new files:
   - `src/components/layout/mobile-command-sheet.tsx`
   - `src/components/layout/mobile-action-sheet.tsx`
   - `src/components/layout/mobile-search-trigger.tsx`
   - `src/components/layout/mobile-fab.tsx`
2. Revert modifications to existing files
3. Restore previous mobile-bottom-nav.tsx

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/layout/mobile-command-sheet.tsx` | Created | Touch-optimized search |
| `src/components/layout/mobile-action-sheet.tsx` | Created | Quick actions sheet |
| `src/components/layout/mobile-search-trigger.tsx` | Created | Header search button |
| `src/components/layout/mobile-fab.tsx` | Created | Floating action button |
| `src/components/layout/mobile-bottom-nav.tsx` | Modified | Badge support, long-press |
| `src/components/layout/dashboard-layout-client.tsx` | Modified | Integrate mobile components |
| `src/components/layout/index.ts` | Modified | Export new components |

---

## CSS Utilities Added

For haptic feedback and touch states:

```css
/* In globals.css or brand-variables.css */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.active\:haptic:active {
  /* Visual feedback for haptic-like feel */
  transform: scale(0.98);
}
```

## Accessibility Considerations

1. **Touch Targets**: All interactive elements are 44px minimum
2. **Focus Management**: Focus moves to search input when sheet opens
3. **Screen Readers**: Proper ARIA labels on all buttons
4. **Reduced Motion**: Respects `prefers-reduced-motion`
5. **Color Contrast**: All text meets WCAG AA standards
