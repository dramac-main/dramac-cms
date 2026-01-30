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
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
            <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: "calc(85vh - 100px)" }}>
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
