import { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Settings, Maximize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppLauncher } from "@/components/portal/apps/app-launcher";

interface PageProps {
  params: Promise<{ siteId: string; moduleId: string }>;
}

interface SiteInstallation {
  id: string;
  settings: Record<string, unknown>;
  custom_name: string | null;
  is_active: boolean;
  module: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string;
    category: string;
    runtime_type?: string;
    app_url?: string;
    external_url?: string;
    entry_component?: string;
    settings_schema?: Record<string, unknown>;
  };
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
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;

  if (!impersonatingClientId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get client info
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, agency_id")
    .eq("id", impersonatingClientId)
    .single();

  if (!client) {
    redirect("/dashboard");
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
  const { data: rawInstallation } = await supabase
    .from("site_module_installations")
    .select("id, module_id, settings, custom_name, is_active")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .eq("is_enabled", true)
    .single();

  if (!rawInstallation) {
    notFound();
  }

  // Fetch the module separately
  const { data: moduleData } = await supabase
    .from("modules_v2")
    .select("id, name, slug, description, icon, category, runtime_type, app_url, external_url, entry_component, settings_schema")
    .eq("id", moduleId)
    .eq("is_active", true)
    .single();

  if (!moduleData) {
    notFound();
  }

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
            <span className="text-2xl">{moduleData.icon || "📦"}</span>
            <div>
              <h1 className="font-semibold">
                {installation.custom_name || moduleData.name}
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
          {moduleData.external_url && (
            <Button variant="ghost" size="icon" asChild title="Open in New Window">
              <a href={moduleData.external_url} target="_blank" rel="noopener noreferrer">
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
            icon: moduleData.icon || "📦",
            slug: moduleData.slug || "",
            runtime_type: moduleData.runtime_type as "iframe" | "embedded" | "external" | "native" | undefined,
            app_url: moduleData.app_url || null,
            external_url: moduleData.external_url || null,
            entry_component: moduleData.entry_component || null,
          }}
          installation={{
            id: installation.id,
            settings: installation.settings || {},
            custom_name: installation.custom_name,
          }}
          clientId={client.id}
          agencyId={client.agency_id || undefined}
        />
      </div>
    </div>
  );
}
