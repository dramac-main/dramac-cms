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
  Shield,
  X,
} from "lucide-react";
import { useKeyboardShortcuts, isMac } from "@/hooks/use-keyboard-shortcuts";
import { useRecentItems, type RecentItem } from "@/hooks/use-recent-items";

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

  // Clear search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

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
