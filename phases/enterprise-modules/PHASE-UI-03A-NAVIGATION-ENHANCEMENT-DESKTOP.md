# PHASE-UI-03A: Navigation Enhancement (Desktop)

## Overview
- **Objective**: Enhance desktop navigation with global command palette, keyboard shortcuts, quick actions, and improved nav search for enterprise-grade productivity
- **Scope**: Command palette (⌘K), keyboard shortcuts system, sidebar search, quick action buttons, recently visited tracking
- **Dependencies**: PHASE-UI-02A (Layout System), PHASE-UI-02B (Mobile Responsiveness)
- **Estimated Effort**: 6-8 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified (Server→Client wrapper, existing navigation config)
- [x] No conflicts detected (cmdk package already installed)

## What This Phase Delivers

### 1. Global Command Palette (⌘K / Ctrl+K)
A power-user feature for quick navigation and actions:
- Quick navigation to any route
- Recent items with history
- Site/client/page search
- Quick actions (new site, new client, etc.)
- Command groups with visual separators
- Keyboard navigation throughout

### 2. Keyboard Shortcuts System
Centralized keyboard shortcuts hook:
- ⌘K - Open command palette
- ⌘/ - Focus search
- ⌘N - New site
- ⌘B - Toggle sidebar
- Escape - Close modals/dialogs
- Arrow keys - Navigate lists

### 3. Sidebar Navigation Enhancements
- Inline quick search filter
- Recently visited section (persisted)
- Quick action buttons at bottom
- Improved visual feedback

### 4. Navigation Quick Actions
Floating action button or quick access panel for:
- Create new site
- Create new client
- Upload media
- Access recent items

## Implementation Steps

### Step 1: Create Keyboard Shortcuts Hook

**File**: `src/hooks/use-keyboard-shortcuts.ts`
**Action**: Create

```typescript
"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  /** The key combination (e.g., "k", "n", "b") */
  key: string;
  /** Whether Ctrl (Windows) or Cmd (Mac) is required */
  ctrlOrCmd?: boolean;
  /** Whether Shift is required */
  shift?: boolean;
  /** Whether Alt is required */
  alt?: boolean;
  /** Description of the shortcut */
  description: string;
  /** Callback when shortcut is triggered */
  handler: () => void;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * Check if the user is on macOS
 */
export function isMac(): boolean {
  if (typeof window === "undefined") return false;
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

/**
 * Format a shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const mac = isMac();
  
  if (shortcut.ctrlOrCmd) {
    parts.push(mac ? "⌘" : "Ctrl");
  }
  if (shortcut.alt) {
    parts.push(mac ? "⌥" : "Alt");
  }
  if (shortcut.shift) {
    parts.push(mac ? "⇧" : "Shift");
  }
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(mac ? "" : "+");
}

/**
 * Hook to register global keyboard shortcuts
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: "k", ctrlOrCmd: true, handler: openCommandPalette, description: "Open command palette" },
 *   { key: "n", ctrlOrCmd: true, handler: createNewSite, description: "Create new site" },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const ctrlOrCmdPressed = isMac() ? event.metaKey : event.ctrlKey;
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlOrCmdMatches = shortcut.ctrlOrCmd ? ctrlOrCmdPressed : !ctrlOrCmdPressed;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatches && ctrlOrCmdMatches && shiftMatches && altMatches) {
          // Allow closing shortcuts even in inputs
          if (isInput && shortcut.key !== "Escape" && shortcut.key !== "k") {
            continue;
          }

          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook to get all registered shortcuts for display
 */
export function useShortcutsList(shortcuts: KeyboardShortcut[]) {
  return shortcuts.map((shortcut) => ({
    ...shortcut,
    formatted: formatShortcut(shortcut),
  }));
}
```

### Step 2: Create Recently Visited Hook

**File**: `src/hooks/use-recent-items.ts`
**Action**: Create

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";

export interface RecentItem {
  id: string;
  title: string;
  href: string;
  type: "site" | "client" | "page" | "module" | "route";
  icon?: string;
  visitedAt: number;
}

const STORAGE_KEY = "dramac-recent-items";
const MAX_ITEMS = 10;

function getStoredItems(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredItems(items: RecentItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Hook to track and retrieve recently visited items
 * 
 * @example
 * ```tsx
 * const { recentItems, addRecentItem, clearRecentItems } = useRecentItems();
 * 
 * // When visiting a page
 * addRecentItem({
 *   id: site.id,
 *   title: site.name,
 *   href: `/dashboard/sites/${site.id}`,
 *   type: "site",
 * });
 * ```
 */
export function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  // Load from storage on mount
  useEffect(() => {
    setRecentItems(getStoredItems());
  }, []);

  const addRecentItem = useCallback((item: Omit<RecentItem, "visitedAt">) => {
    setRecentItems((prev) => {
      // Remove existing item if present
      const filtered = prev.filter((i) => i.id !== item.id || i.type !== item.type);
      
      // Add new item at start
      const newItems = [
        { ...item, visitedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);

      setStoredItems(newItems);
      return newItems;
    });
  }, []);

  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
    setStoredItems([]);
  }, []);

  const removeRecentItem = useCallback((id: string, type: string) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((i) => !(i.id === id && i.type === type));
      setStoredItems(filtered);
      return filtered;
    });
  }, []);

  return {
    recentItems,
    addRecentItem,
    clearRecentItems,
    removeRecentItem,
  };
}
```

### Step 3: Create Command Palette Component

**File**: `src/components/layout/command-palette.tsx`
**Action**: Create

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Globe,
  Users,
  Package,
  Settings,
  CreditCard,
  HelpCircle,
  Plus,
  ImageIcon,
  Building2,
  Search,
  Clock,
  ArrowRight,
  FileText,
  Bot,
  Calendar,
  Mail,
  Zap,
  Shield,
  X,
} from "lucide-react";
import { useKeyboardShortcuts, formatShortcut, isMac } from "@/hooks/use-keyboard-shortcuts";
import { useRecentItems, type RecentItem } from "@/hooks/use-recent-items";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  /** Sites data for search */
  sites?: Array<{ id: string; name: string; subdomain: string }>;
  /** Clients data for search */
  clients?: Array<{ id: string; name: string; email?: string }>;
  /** Whether user is super admin */
  isSuperAdmin?: boolean;
}

// Navigation items with their shortcuts
const navigationItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["home", "overview"] },
  { title: "Sites", href: "/dashboard/sites", icon: Globe, keywords: ["websites", "pages"] },
  { title: "Clients", href: "/dashboard/clients", icon: Users, keywords: ["customers", "accounts"] },
  { title: "CRM", href: "/dashboard/crm", icon: Building2, keywords: ["contacts", "leads", "deals"] },
  { title: "Media Library", href: "/dashboard/media", icon: ImageIcon, keywords: ["images", "files", "uploads"] },
  { title: "Marketplace", href: "/marketplace", icon: Package, keywords: ["modules", "apps", "plugins"] },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard, keywords: ["payments", "invoices", "subscription"] },
  { title: "Settings", href: "/settings", icon: Settings, keywords: ["preferences", "configuration"] },
  { title: "Help & Support", href: "/dashboard/support", icon: HelpCircle, keywords: ["help", "documentation", "contact"] },
];

// Quick actions
const quickActions = [
  { title: "Create new site", href: "/dashboard/sites?action=new", icon: Plus, keywords: ["add", "website"] },
  { title: "Add new client", href: "/dashboard/clients?action=new", icon: Plus, keywords: ["add", "customer"] },
  { title: "Upload media", href: "/dashboard/media?action=upload", icon: ImageIcon, keywords: ["add", "image", "file"] },
];

// Admin items
const adminItems = [
  { title: "Admin Panel", href: "/admin", icon: Shield, keywords: ["admin", "management"] },
  { title: "All Agencies", href: "/admin/agencies", icon: Building2, keywords: ["agencies", "organizations"] },
  { title: "All Users", href: "/admin/users", icon: Users, keywords: ["users", "accounts"] },
];

/**
 * Global command palette for quick navigation and actions.
 * Triggered by ⌘K (Mac) or Ctrl+K (Windows).
 */
export function CommandPalette({ sites = [], clients = [], isSuperAdmin = false }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { recentItems, addRecentItem, clearRecentItems } = useRecentItems();

  // Register keyboard shortcut
  useKeyboardShortcuts([
    {
      key: "k",
      ctrlOrCmd: true,
      description: "Open command palette",
      handler: () => setOpen(true),
    },
  ]);

  // Handle item selection
  const handleSelect = useCallback(
    (href: string, item?: { id?: string; title: string; type: RecentItem["type"] }) => {
      // Add to recent items if it's a meaningful item
      if (item?.id) {
        addRecentItem({
          id: item.id,
          title: item.title,
          href,
          type: item.type,
        });
      } else if (item) {
        addRecentItem({
          id: href,
          title: item.title,
          href,
          type: "route",
        });
      }

      setOpen(false);
      setSearch("");
      router.push(href);
    },
    [router, addRecentItem]
  );

  // Get icon for recent item type
  const getTypeIcon = (type: RecentItem["type"]) => {
    switch (type) {
      case "site":
        return Globe;
      case "client":
        return Users;
      case "page":
        return FileText;
      case "module":
        return Package;
      default:
        return ArrowRight;
    }
  };

  const cmdKey = isMac() ? "⌘" : "Ctrl+";

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search or type a command..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No results found for &quot;{search}&quot;
            </p>
            <p className="text-xs text-muted-foreground/70">
              Try searching for pages, sites, or clients
            </p>
          </div>
        </CommandEmpty>

        {/* Recent Items */}
        {!search && recentItems.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentItems.slice(0, 5).map((item) => {
                const Icon = getTypeIcon(item.type);
                return (
                  <CommandItem
                    key={`${item.type}-${item.id}`}
                    value={`recent-${item.title}`}
                    onSelect={() => handleSelect(item.href, { id: item.id, title: item.title, type: item.type })}
                  >
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground capitalize">
                      {item.type}
                    </span>
                  </CommandItem>
                );
              })}
              <CommandItem
                value="clear-recent"
                onSelect={() => clearRecentItems()}
                className="text-muted-foreground"
              >
                <X className="mr-2 h-4 w-4" />
                Clear recent items
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.href}
              value={`action-${action.title} ${action.keywords.join(" ")}`}
              onSelect={() => handleSelect(action.href, { title: action.title, type: "route" })}
            >
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              value={`nav-${item.title} ${item.keywords.join(" ")}`}
              onSelect={() => handleSelect(item.href, { title: item.title, type: "route" })}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
              <CommandShortcut className="opacity-50">
                <ArrowRight className="h-3 w-3" />
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Sites Search */}
        {sites.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Sites">
              {sites.slice(0, 5).map((site) => (
                <CommandItem
                  key={site.id}
                  value={`site-${site.name} ${site.subdomain}`}
                  onSelect={() =>
                    handleSelect(`/dashboard/sites/${site.id}`, {
                      id: site.id,
                      title: site.name,
                      type: "site",
                    })
                  }
                >
                  <Globe className="mr-2 h-4 w-4" />
                  <span>{site.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {site.subdomain}.dramac.io
                  </span>
                </CommandItem>
              ))}
              {sites.length > 5 && (
                <CommandItem
                  value="view-all-sites"
                  onSelect={() => handleSelect("/dashboard/sites")}
                  className="text-muted-foreground"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  View all {sites.length} sites
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}

        {/* Clients Search */}
        {clients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clients">
              {clients.slice(0, 5).map((client) => (
                <CommandItem
                  key={client.id}
                  value={`client-${client.name} ${client.email || ""}`}
                  onSelect={() =>
                    handleSelect(`/dashboard/clients/${client.id}`, {
                      id: client.id,
                      title: client.name,
                      type: "client",
                    })
                  }
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>{client.name}</span>
                  {client.email && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {client.email}
                    </span>
                  )}
                </CommandItem>
              ))}
              {clients.length > 5 && (
                <CommandItem
                  value="view-all-clients"
                  onSelect={() => handleSelect("/dashboard/clients")}
                  className="text-muted-foreground"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  View all {clients.length} clients
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}

        {/* Admin (Super Admin only) */}
        {isSuperAdmin && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin">
              {adminItems.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`admin-${item.title} ${item.keywords.join(" ")}`}
                  onSelect={() => handleSelect(item.href, { title: item.title, type: "route" })}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer with keyboard hint */}
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ↑↓
          </kbd>
          <span>Navigate</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ↵
          </kbd>
          <span>Select</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            Esc
          </kbd>
          <span>Close</span>
        </div>
      </div>
    </CommandDialog>
  );
}
```

### Step 4: Create Sidebar Search Component

**File**: `src/components/layout/sidebar-search.tsx`
**Action**: Create

```typescript
"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mainNavigation, type NavItem } from "@/config/navigation";

interface SidebarSearchProps {
  onFilterChange: (filteredItems: NavItem[]) => void;
  collapsed?: boolean;
  className?: string;
}

/**
 * Inline search filter for sidebar navigation.
 * Filters navigation items as user types.
 */
export function SidebarSearch({ onFilterChange, collapsed, className }: SidebarSearchProps) {
  const [search, setSearch] = useState("");

  // Flatten all nav items for searching
  const allItems = useMemo(() => {
    return mainNavigation.flatMap((group) => group.items);
  }, []);

  // Filter items based on search
  const handleSearch = (value: string) => {
    setSearch(value);
    
    if (!value.trim()) {
      onFilterChange([]);
      return;
    }

    const query = value.toLowerCase();
    const filtered = allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.href.toLowerCase().includes(query)
    );
    
    onFilterChange(filtered);
  };

  const clearSearch = () => {
    setSearch("");
    onFilterChange([]);
  };

  // Don't show search when sidebar is collapsed
  if (collapsed) {
    return null;
  }

  return (
    <div className={cn("relative px-3 pt-2", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search menu..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-8 pl-8 pr-8 text-sm bg-sidebar-accent/50 border-sidebar-border focus:bg-sidebar-accent"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={clearSearch}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

### Step 5: Create Quick Actions Panel

**File**: `src/components/layout/quick-actions.tsx`
**Action**: Create

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Globe,
  Users,
  ImageIcon,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

const actions: QuickAction[] = [
  {
    id: "new-site",
    title: "New Site",
    href: "/dashboard/sites?action=new",
    icon: Globe,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    id: "new-client",
    title: "New Client",
    href: "/dashboard/clients?action=new",
    icon: Users,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    id: "upload-media",
    title: "Upload Media",
    href: "/dashboard/media?action=upload",
    icon: ImageIcon,
    color: "bg-purple-500 hover:bg-purple-600",
  },
];

interface QuickActionsProps {
  /** Position on screen */
  position?: "bottom-right" | "bottom-left";
  /** Additional class name */
  className?: string;
}

/**
 * Floating quick actions button (FAB) with expandable menu.
 * Provides quick access to common creation actions.
 */
export function QuickActions({ position = "bottom-right", className }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleAction = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "fixed z-50",
          position === "bottom-right" && "bottom-6 right-6",
          position === "bottom-left" && "bottom-6 left-6",
          className
        )}
      >
        {/* Action buttons (expanded) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-16 right-0 flex flex-col gap-2"
            >
              {actions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        className={cn(
                          "h-12 w-12 rounded-full shadow-lg text-white",
                          action.color
                        )}
                        onClick={() => handleAction(action.href)}
                      >
                        <action.icon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={10}>
                      {action.title}
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
                isOpen
                  ? "bg-muted hover:bg-muted text-foreground rotate-45"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Plus className="h-6 w-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={10}>
            {isOpen ? "Close" : "Quick Actions"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

/**
 * Inline quick actions bar for sidebar bottom.
 * Alternative to floating FAB.
 */
export function SidebarQuickActions({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 px-2 py-2">
        {actions.slice(0, 2).map((action) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => router.push(action.href)}
              >
                <action.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {action.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {actions.map((action) => (
        <Tooltip key={action.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 gap-1.5 text-xs"
              onClick={() => router.push(action.href)}
            >
              <action.icon className="h-3.5 w-3.5" />
              <span className="truncate">{action.title.replace("New ", "")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {action.title}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
```

### Step 6: Update Sidebar with Search and Quick Actions

**File**: `src/components/layout/sidebar-modern.tsx`
**Action**: Modify

Add imports and integrate new components. The sidebar search and quick actions will be added to enhance navigation capabilities.

### Step 7: Update Header with Command Palette Trigger

**File**: `src/components/layout/header-modern.tsx`
**Action**: Modify

Update the search button to show keyboard shortcut hint and trigger command palette.

### Step 8: Update Layout Exports

**File**: `src/components/layout/index.ts`
**Action**: Modify

Add exports for new components.

### Step 9: Update Hooks Barrel Export

**File**: `src/hooks/index.ts`
**Action**: Modify

Add exports for new hooks.

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

3. **Manual Testing**:
   - Press ⌘K (Mac) or Ctrl+K (Windows) to open command palette
   - Type to search navigation items
   - Navigate with arrow keys and Enter
   - Check recent items appear after visiting pages
   - Verify sidebar search filters nav items
   - Test quick actions FAB on desktop

4. **Expected Outcomes**:
   - Command palette opens with smooth animation
   - Search filters items in real-time
   - Recent items persist across sessions
   - Keyboard navigation works throughout
   - Quick actions expand from FAB

## Rollback Plan

If issues arise:
1. Remove new files:
   - `src/hooks/use-keyboard-shortcuts.ts`
   - `src/hooks/use-recent-items.ts`
   - `src/components/layout/command-palette.tsx`
   - `src/components/layout/sidebar-search.tsx`
   - `src/components/layout/quick-actions.tsx`
2. Revert modifications to existing files
3. Clear localStorage key: `dramac-recent-items`

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/use-keyboard-shortcuts.ts` | Created | Keyboard shortcuts system |
| `src/hooks/use-recent-items.ts` | Created | Track recently visited items |
| `src/components/layout/command-palette.tsx` | Created | Global command palette |
| `src/components/layout/sidebar-search.tsx` | Created | Inline sidebar search |
| `src/components/layout/quick-actions.tsx` | Created | Floating quick actions |
| `src/components/layout/sidebar-modern.tsx` | Modified | Integrate search & quick actions |
| `src/components/layout/header-modern.tsx` | Modified | Cmd+K trigger hint |
| `src/components/layout/index.ts` | Modified | Export new components |
| `src/hooks/index.ts` | Modified | Export new hooks |

---

## Handoff Notes for PHASE-UI-03B

PHASE-UI-03B will focus on mobile navigation enhancements including:
- Mobile command sheet (bottom sheet instead of dialog)
- Touch-optimized quick actions
- Swipe-to-reveal actions
- Mobile search experience
- Bottom sheet action menu

The hooks created in this phase (`use-keyboard-shortcuts`, `use-recent-items`) will be reused in the mobile implementation.
