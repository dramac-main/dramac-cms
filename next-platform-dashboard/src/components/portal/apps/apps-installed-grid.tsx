"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { icons } from "lucide-react";
import {
  ChevronRight,
  ExternalLink,
  MoreVertical,
  Settings,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { resolveIconName } from "@/lib/utils/icon-map";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  hasNativePortalSurface,
  resolvePortalAppRoute,
} from "@/lib/portal/app-routes";
import { uninstallAppAction } from "@/app/portal/sites/[siteId]/apps/_actions";

export interface InstalledAppItem {
  id: string; // module id
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  category: string;
  installation_id: string;
  installed_at: string;
}

interface AppsInstalledGridProps {
  siteId: string;
  modules: InstalledAppItem[];
  canManage: boolean;
}

export function AppsInstalledGrid({
  siteId,
  modules,
  canManage,
}: AppsInstalledGridProps) {
  const categories = modules.reduce(
    (acc, m) => {
      const cat = m.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    },
    {} as Record<string, InstalledAppItem[]>,
  );

  const sortedCategories = Object.keys(categories).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8">
      {sortedCategories.map((category) => (
        <section key={category}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {category}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories[category].map((m) => (
              <InstalledAppCard
                key={m.installation_id}
                siteId={siteId}
                app={m}
                canManage={canManage}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function InstalledAppCard({
  siteId,
  app,
  canManage,
}: {
  siteId: string;
  app: InstalledAppItem;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const iconName = resolveIconName(app.icon || "Package");
  const Icon = icons[iconName as keyof typeof icons] || icons.Package;
  const route = resolvePortalAppRoute(siteId, app.slug || app.id, app.id);
  const isNative = hasNativePortalSurface(app.slug);

  const installedAtLabel = (() => {
    try {
      const d = new Date(app.installed_at);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  })();

  const onUninstall = () => {
    start(async () => {
      const r = await uninstallAppAction(siteId, app.id);
      if (r.ok) {
        toast.success(`${app.name} uninstalled`);
        router.refresh();
      } else {
        toast.error(r.error || "Uninstall failed");
      }
      setConfirmOpen(false);
    });
  };

  return (
    <>
      <Card className="group relative overflow-hidden p-4 transition-all hover:border-primary/40 hover:shadow-md">
        <Link
          href={route}
          className="absolute inset-0 z-0"
          aria-label={`Open ${app.name}`}
        />
        <div className="relative z-10 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="truncate font-semibold leading-tight">
                    {app.name}
                  </h4>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0"
                  >
                    <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                    Active
                  </Badge>
                  {!isNative && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Launcher
                    </Badge>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="relative z-20" onClick={(e) => e.preventDefault()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem asChild>
                        <Link href={route} className="cursor-pointer">
                          <ChevronRight className="mr-2 h-4 w-4" />
                          Open
                        </Link>
                      </DropdownMenuItem>
                      {!isNative && (
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/portal/sites/${siteId}/apps/${app.slug || app.id}`}
                            className="cursor-pointer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open launcher
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        asChild
                      >
                        <Link
                          href={`/portal/sites/${siteId}/apps/${app.slug || app.id}?settings=1`}
                          className="cursor-pointer"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => {
                          e.preventDefault();
                          setConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Uninstall
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            {app.description && (
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                {app.description}
              </p>
            )}
            {installedAtLabel && (
              <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                Installed {installedAtLabel}
              </p>
            )}
          </div>
        </div>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uninstall {app.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The app will be removed from this site. Any settings and access
              tied to this installation are cleared. Data already produced by
              the app (orders, bookings, content) is not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                onUninstall();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? "Uninstalling…" : "Uninstall"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
