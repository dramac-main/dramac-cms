"use client";

/**
 * Portal Command Palette (Cmd+K / Ctrl+K)
 *
 * Lightweight cross-portal navigator. Indexes the canonical portal routes the
 * user has access to and supports keyword search. Opens on ⌘K / ⌃K and on the
 * `/` key when not already typing into a form.
 *
 * Mounted from the portal layout. Hidden by default. No external dependencies.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CreditCard,
  Globe,
  Home,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Package,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  group: "Navigate" | "Actions" | "Settings";
}

const ITEMS: CommandItem[] = [
  {
    id: "home",
    label: "Dashboard",
    href: "/portal",
    icon: LayoutDashboard,
    group: "Navigate",
    keywords: ["home", "overview"],
  },
  {
    id: "chat",
    label: "Live Chat",
    href: "/portal?goto=chat",
    icon: MessageSquare,
    group: "Navigate",
    keywords: ["messages", "support"],
  },
  {
    id: "orders",
    label: "Orders",
    href: "/portal/orders",
    icon: ShoppingBag,
    group: "Navigate",
    keywords: ["sales", "checkout"],
  },
  {
    id: "bookings",
    label: "Bookings",
    href: "/portal/bookings",
    icon: CalendarDays,
    group: "Navigate",
    keywords: ["appointments", "calendar"],
  },
  {
    id: "invoices",
    label: "Invoices",
    href: "/portal/invoices",
    icon: Receipt,
    group: "Navigate",
    keywords: ["billing", "payments"],
  },
  {
    id: "products",
    label: "Products",
    href: "/portal/products",
    icon: Package,
    group: "Navigate",
    keywords: ["catalog", "inventory"],
  },
  {
    id: "customers",
    label: "Customers",
    href: "/portal/customers",
    icon: Users,
    group: "Navigate",
    keywords: ["clients", "contacts"],
  },
  {
    id: "domains",
    label: "Domains",
    href: "/portal/domains",
    icon: Globe,
    group: "Navigate",
    keywords: ["dns"],
  },
  {
    id: "billing",
    label: "Billing",
    href: "/portal/billing",
    icon: CreditCard,
    group: "Navigate",
    keywords: ["plan", "subscription"],
  },
  {
    id: "support",
    label: "Support Tickets",
    href: "/portal/support",
    icon: LifeBuoy,
    group: "Navigate",
    keywords: ["help"],
  },
  // Actions
  {
    id: "ask-chiko",
    label: "Ask Chiko",
    hint: "Your business assistant",
    href: "/portal?openChiko=1",
    icon: Sparkles,
    group: "Actions",
    keywords: ["chiko", "assistant", "help"],
  },
  {
    id: "notifications",
    label: "View notifications",
    href: "/portal/notifications",
    icon: Bell,
    group: "Actions",
    keywords: ["alerts"],
  },
  // Settings
  {
    id: "settings",
    label: "Account settings",
    href: "/portal/settings",
    icon: Settings,
    group: "Settings",
  },
  {
    id: "settings-notifications",
    label: "Notification preferences",
    href: "/portal/settings/notifications",
    icon: Bell,
    group: "Settings",
    keywords: ["email", "push"],
  },
  {
    id: "settings-team",
    label: "Team & permissions",
    href: "/portal/settings/team",
    icon: Users,
    group: "Settings",
    keywords: ["users", "roles"],
  },
];

function matchesQuery(q: string, item: CommandItem): boolean {
  if (!q) return true;
  const text = [item.label, item.hint, ...(item.keywords || [])]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => text.includes(token));
}

export function PortalCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keybindings
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (open && e.key === "Escape") {
        setOpen(false);
        return;
      }
      // "/" as a quick-open when not typing
      if (!open && e.key === "/" && !isMod) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const editable =
          target?.isContentEditable ||
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT";
        if (!editable) {
          e.preventDefault();
          setOpen(true);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus next tick so dialog has mounted
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const filtered = useMemo(
    () => ITEMS.filter((i) => matchesQuery(query, i)),
    [query],
  );

  const grouped = useMemo(() => {
    const out: Record<string, CommandItem[]> = {};
    filtered.forEach((i) => {
      out[i.group] = out[i.group] || [];
      out[i.group].push(i);
    });
    return out;
  }, [filtered]);

  function go(item: CommandItem) {
    setOpen(false);
    router.push(item.href);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) go(item);
    }
  }

  if (!open) return null;

  // Build flat index list to map activeIndex -> item position across groups
  let flatIdx = -1;

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[12vh] px-4"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Type to search the portal…"
            className="flex-1 bg-transparent outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
          <kbd className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              No matches for &ldquo;{query}&rdquo;
            </div>
          )}
          {(["Navigate", "Actions", "Settings"] as const).map((group) => {
            const items = grouped[group];
            if (!items?.length) return null;
            return (
              <div key={group} className="mb-1 last:mb-0">
                <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {group}
                </div>
                {items.map((item) => {
                  flatIdx += 1;
                  const isActive = flatIdx === activeIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item)}
                      onMouseEnter={() => setActiveIndex(flatIdx)}
                      className={
                        "w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors " +
                        (isActive
                          ? "bg-primary/10 text-primary"
                          : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800")
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && (
                        <span className="text-[11px] text-zinc-400">
                          {item.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-4 py-2 text-[11px] text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
          <span>
            <kbd className="font-medium">↑↓</kbd> navigate
            <span className="mx-2">·</span>
            <kbd className="font-medium">↵</kbd> open
          </span>
          <span>
            <kbd className="font-medium">⌘K</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}
