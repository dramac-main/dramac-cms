import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Settings, Maximize2, ExternalLink, icons } from "lucide-react";
import { resolveIconName } from "@/lib/utils/icon-map";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppLauncher } from "@/components/portal/apps/app-launcher";
import { requirePortalAuth } from "@/lib/portal/portal-auth";

interface PageProps {
  params: Promise<{ siteId: string; moduleId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleId } = await params;
  const supabase = await createClient();

  const { data: module } = await supabase
    .from("modules_v2")
    .select("name, description")
    .eq("id", moduleId)
    .single();

  return {
    title: `${module?.name || "App"} | Client Portal`,
    description: module?.description || "Use your site app",
  };
}

export default async function SiteModuleLauncherPage({ params }: PageProps) {
  const { siteId, moduleId } = await params;
  const portalUser = await requirePortalAuth();

  const supabase = await createClient();

  // Get client info
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, agency_id")
    .eq("id", portalUser.clientId)
    .single();

  if (!client) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Unable to load app. Please try again later.</p>
      </div>
    );
  }

  // Verify site belongs to client
  const { data: site } = await supabase
    .from("sites")
    .select("id, name, client_id")
    .eq("id", siteId)
    .eq("client_id", client.id)
    .single();

  if (!site) {
    notFound();
  }

  // Get the site module installation (separate queries - FK was dropped)
  // Note: custom_name/is_active don't exist - use is_enabled instead
  const { data: rawInstallation } = await supabase
    .from("site_module_installations")
    .select("id, module_id, settings")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .eq("is_enabled", true)
    .single();

  if (!rawInstallation) {
    notFound();
  }

  // Fetch the module separately
  // Note: runtime_type, app_url, external_url, entry_component don't exist as columns
  // They should be in the manifest JSONB field
  const { data: moduleData } = await supabase
    .from("modules_v2")
    .select("id, name, slug, description, icon, category, manifest, settings_schema")
    .eq("id", moduleId)
    .eq("status", "active")
    .single();

  if (!moduleData) {
    notFound();
  }

  // Extract runtime info from manifest JSONB
  const manifest = (moduleData.manifest || {}) as Record<string, unknown>;
  const externalUrl = manifest.external_url as string | null;
  const appUrl = manifest.app_url as string | null;
  const runtimeType = manifest.runtime_type as string | undefined;
  const entryComponent = manifest.entry_component as string | null;

  const installation = {
    ...rawInstallation,
    module: moduleData,
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* App Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/portal/sites/${siteId}/apps`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl">{(() => {
              const iconName = moduleData.icon ? resolveIconName(moduleData.icon) : null;
              if (iconName) {
                const LucideIcon = icons[iconName as keyof typeof icons];
                return LucideIcon ? <LucideIcon className="h-6 w-6" /> : <span>{moduleData.icon || 'Package'}</span>;
              }
              return <span>{moduleData.icon || 'Package'}</span>;
            })()}</span>
            <div>
              <h1 className="font-semibold">
                {moduleData.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                {site.name} • {moduleData.category || "App"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {moduleData.settings_schema && (
            <Button variant="ghost" size="icon" title="App Settings">
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {externalUrl && (
            <Button variant="ghost" size="icon" asChild title="Open in New Window">
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" title="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* App Content */}
      <div className="flex-1 overflow-hidden">
        <AppLauncher 
          module={{
            id: moduleData.id,
            name: moduleData.name,
            description: moduleData.description,
            icon: moduleData.icon || "Package",
            slug: moduleData.slug || "",
            runtime_type: runtimeType as "iframe" | "embedded" | "external" | "native" | undefined,
            app_url: appUrl,
            external_url: externalUrl,
            entry_component: entryComponent,
          }}
          installation={{
            id: installation.id,
            settings: (installation.settings || {}) as Record<string, unknown>,
          }}
          clientId={client.id}
          agencyId={client.agency_id || undefined}
        />
      </div>
    </div>
  );
}
