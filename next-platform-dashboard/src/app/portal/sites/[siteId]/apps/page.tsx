import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Globe, ArrowLeft, Sparkles, Layers, PackagePlus } from "lucide-react";
import Link from "next/link";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import {
  AppsInstalledGrid,
  type InstalledAppItem,
} from "@/components/portal/apps/apps-installed-grid";
import { MarketplaceInstallButton } from "@/components/portal/apps/marketplace-install-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { siteId } = await params;
  const supabase = createAdminClient();
  const { data: site } = await supabase
    .from("sites")
    .select("name")
    .eq("id", siteId)
    .single();
  return {
    title: `${site?.name || "Site"} Apps | Client Portal`,
    description: "Manage apps for this website",
  };
}

interface MarketplaceModule {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  category: string;
  is_featured?: boolean | null;
}

export default async function SiteAppsPage({ params }: PageProps) {
  const { siteId } = await params;
  const portalUser = await requirePortalAuth();
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", portalUser.clientId)
    .single();

  if (!client) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Unable to load apps. Please try again later.</p>
      </div>
    );
  }

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, client_id")
    .eq("id", siteId)
    .eq("client_id", client.id)
    .single();

  if (siteError || !site) {
    notFound();
  }

  const { data: rawInstallations } = await supabase
    .from("site_module_installations")
    .select("id, module_id, installed_at, is_enabled")
    .eq("site_id", siteId)
    .order("installed_at", { ascending: false });

  const installations = rawInstallations ?? [];
  const enabledInstalls = installations.filter((i) => i.is_enabled);
  const disabledCount = installations.length - enabledInstalls.length;

  let installedModules: InstalledAppItem[] = [];
  const installedIds = new Set<string>();
  if (enabledInstalls.length) {
    const moduleIds = enabledInstalls.map((i) => i.module_id);
    const { data: modules } = await supabase
      .from("modules_v2")
      .select("id, name, description, icon, slug, category")
      .in("id", moduleIds)
      .eq("status", "active");
    const moduleMap = new Map((modules || []).map((m) => [m.id, m]));
    installedModules = enabledInstalls
      .filter((i) => moduleMap.has(i.module_id))
      .map((i) => {
        const mod = moduleMap.get(i.module_id)!;
        installedIds.add(mod.id);
        return {
          id: mod.id,
          name: mod.name,
          slug: mod.slug,
          description: mod.description,
          icon: mod.icon || "Package",
          category: mod.category,
          installation_id: i.id,
          installed_at: i.installed_at || new Date().toISOString(),
        };
      });
  }

  // Available marketplace modules (active, not already installed)
  const { data: allActive } = await supabase
    .from("modules_v2")
    .select("id, name, slug, description, icon, category, is_featured")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  const available: MarketplaceModule[] = (allActive ?? []).filter(
    (m) => !installedIds.has(m.id),
  );

  const categoryCount = new Set(installedModules.map((m) => m.category)).size;

  const canManage = portalUser.canEditContent;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Link
              href={`/portal/sites/${siteId}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {site.name}
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Globe className="h-8 w-8" />
                  Site Apps
                </h1>
                <p className="text-muted-foreground">
                  Apps installed on {site.name}
                </p>
              </div>
              {available.length > 0 ? (
                <Button asChild variant="outline" size="sm">
                  <a href="#marketplace">
                    <PackagePlus className="mr-1.5 h-3.5 w-3.5" />
                    Browse marketplace ({available.length})
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Active apps
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {installedModules.length}
                </div>
                {disabledCount > 0 ? (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {disabledCount} disabled
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Categories
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {categoryCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Available to add
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {available.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Installed apps */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Installed
              </h2>
            </div>
            {installedModules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Globe className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="font-medium">No apps installed yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {available.length > 0
                      ? "Browse the marketplace below to add functionality to this site."
                      : "Contact your agency to add site-level apps."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <AppsInstalledGrid
                siteId={siteId}
                modules={installedModules}
                canManage={canManage}
              />
            )}
          </section>

          {/* Marketplace */}
          {available.length > 0 ? (
            <section id="marketplace" className="scroll-mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Marketplace
                </h2>
                <span className="text-xs text-muted-foreground">
                  {available.length} {available.length === 1 ? "app" : "apps"}{" "}
                  available
                </span>
              </div>
              <MarketplaceGrid
                siteId={siteId}
                modules={available}
                canManage={canManage}
              />
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function MarketplaceGrid({
  siteId,
  modules,
  canManage,
}: {
  siteId: string;
  modules: MarketplaceModule[];
  canManage: boolean;
}) {
  const grouped = modules.reduce(
    (acc, m) => {
      const cat = m.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    },
    {} as Record<string, MarketplaceModule[]>,
  );
  const cats = Object.keys(grouped).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {cats.map((cat) => (
        <div key={cat}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {cat}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grouped[cat].map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{m.name}</span>
                        {m.is_featured ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase"
                          >
                            Featured
                          </Badge>
                        ) : null}
                      </div>
                      {m.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {m.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3">
                    <MarketplaceInstallButton
                      siteId={siteId}
                      moduleId={m.id}
                      moduleName={m.name}
                      canManage={canManage}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
