"use client";

/**
 * PortalSiteSwitcher
 *
 * Persistent site selector shown in the portal header. Built mobile-first:
 *   - On viewports < md, opens a bottom Sheet with a full-screen site list.
 *   - On md+ viewports, renders an inline Popover + Command (search).
 *
 * Behavior:
 *   - Optimistic UI: updates selection immediately, then calls the server
 *     action to persist the cookie + audit row.
 *   - If the current URL is a site-scoped route (`/portal/sites/{id}/...`),
 *     swapping the site rewrites the path so the user lands on the same
 *     sub-route under the new site. Otherwise it just persists the choice.
 */

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useBreakpointDown } from "@/hooks/use-media-query";
import { toast } from "sonner";
import { setPortalActiveSite } from "@/lib/portal/active-site";

export interface PortalSiteSwitcherOption {
  id: string;
  name: string;
  subdomain: string | null;
  customDomain: string | null;
  isPublished: boolean;
}

interface PortalSiteSwitcherProps {
  sites: PortalSiteSwitcherOption[];
  activeSiteId: string | null;
  clientId: string;
  agencyId: string;
  authUserId: string;
  isImpersonation?: boolean;
}

const SITE_PATH_REGEX = /^\/portal\/sites\/([0-9a-f-]{36})(\/.*)?$/i;

export function PortalSiteSwitcher({
  sites,
  activeSiteId,
  clientId,
  agencyId,
  authUserId,
  isImpersonation,
}: PortalSiteSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useBreakpointDown("md");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [optimisticId, setOptimisticId] = useState<string | null>(activeSiteId);

  const selectedId = optimisticId ?? activeSiteId;
  const selected = useMemo(
    () => sites.find((s) => s.id === selectedId) ?? null,
    [sites, selectedId],
  );

  // Hide the switcher entirely if the client owns 0 or 1 sites — switching
  // nothing adds noise, and the brief calls for mobile-first minimalism.
  if (sites.length <= 1) return null;

  const handleSelect = (siteId: string) => {
    if (siteId === selectedId) {
      setOpen(false);
      return;
    }
    const fromSiteId = selectedId;
    setOptimisticId(siteId);
    setOpen(false);

    startTransition(async () => {
      const result = await setPortalActiveSite({
        siteId,
        clientId,
        agencyId,
        authUserId,
        fromSiteId,
        isImpersonation,
      });

      if (!result.ok) {
        setOptimisticId(fromSiteId);
        toast.error("Couldn't switch site. Please try again.");
        return;
      }

      // Rewrite site-scoped paths so deep links stay coherent.
      const match = pathname ? SITE_PATH_REGEX.exec(pathname) : null;
      if (match) {
        const tail = match[2] ?? "";
        router.push(`/portal/sites/${siteId}${tail}`);
      } else {
        router.refresh();
      }
    });
  };

  const trigger = (
    <Button
      variant="outline"
      size="sm"
      role="combobox"
      aria-label="Switch site"
      className={cn(
        "h-9 gap-2 min-w-0 max-w-48 md:max-w-64",
        "justify-between",
      )}
      disabled={pending}
    >
      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate">{selected?.name ?? "Select site"}</span>
      {pending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <ChevronsUpDown
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      )}
    </Button>
  );

  const list = (
    <Command>
      <CommandInput placeholder="Search sites…" />
      <CommandList>
        <CommandEmpty>No sites found.</CommandEmpty>
        <CommandGroup>
          {sites.map((site) => {
            const isActive = site.id === selectedId;
            return (
              <CommandItem
                key={site.id}
                value={`${site.name} ${site.subdomain ?? ""} ${site.customDomain ?? ""}`}
                onSelect={() => handleSelect(site.id)}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{site.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {site.customDomain || site.subdomain || "—"}
                  </span>
                </div>
                {!site.isPublished && (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Draft
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="h-[75vh] p-0">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle>Switch site</SheetTitle>
          </SheetHeader>
          <div className="px-2 pb-4 pt-2">{list}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-88 p-0" align="start">
        {list}
      </PopoverContent>
    </Popover>
  );
}

export default PortalSiteSwitcher;
