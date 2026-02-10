import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Settings, Maximize2, ExternalLink } from "lucide-react";
import { icons } from "lucide-react";
import { resolveIconName } from "@/lib/utils/icon-map";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppLauncher } from "@/components/portal/apps/app-launcher";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ClientInstallation {
  id: string;
  settings: Record<string, unknown>;
  is_enabled: boolean;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: module } = await supabase
    .from("modules_v2")
    .select("name, description")
    .eq("slug", slug)
    .single();

  return {
    title: `${module?.name || "App"} | Client Portal`,
    description: module?.description || "Use your app",
  };
}

export default async function PortalAppPage({ params }: PageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;

  if (!impersonatingClientId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get the module - use only columns that actually exist
  const { data: moduleData, error: moduleError } = await supabase
    .from("modules_v2")
    .select("id, slug, name, description, icon, category, manifest, settings_schema")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (moduleError || !moduleData) {
    notFound();
  }

  // Extract runtime info from manifest JSONB
  const manifest = (moduleData.manifest || {}) as Record<string, unknown>;
  const externalUrl = manifest.external_url as string | undefined;
  const appUrl = manifest.app_url as string | undefined;
  const runtimeType = manifest.runtime_type as string | undefined;
  const entryComponent = manifest.entry_component as string | undefined;

  // Verify client has access through module_subscriptions (via agency)
  const { data: clientData } = await supabase
    .from("clients")
    .select("id, name, agency_id")
    .eq("id", impersonatingClientId)
    .single();

  if (!clientData) {
    redirect("/portal/apps");
  }

  // Check if there's a client installation using type assertion
  // Note: use is_enabled not is_active (column name in actual schema)
  const { data: clientInstallation } = await supabase
    .from("client_module_installations")
    .select("id, settings, is_enabled")
    .eq("client_id", clientData.id)
    .eq("module_id", moduleData.id)
    .eq("is_enabled", true)
    .single() as unknown as { data: ClientInstallation | null };

  // If no client installation, check agency subscription as fallback
  if (!clientInstallation) {
    const { data: subscription } = await supabase
      .from("agency_module_subscriptions")
      .select("id")
      .eq("agency_id", clientData.agency_id)
      .eq("module_id", moduleData.id)
      .eq("status", "active")
      .single();

    if (!subscription) {
      redirect("/portal/apps");
    }
  }

  // Create installation object for the launcher
  const installation = clientInstallation || {
    id: moduleData.id,
    settings: {},
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* App Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/portal/apps">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex items-center gap-2">
            {(() => { const I = icons[resolveIconName(moduleData.icon) as keyof typeof icons] || icons.Package; return <I className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />; })()}
            <div>
              <h1 className="font-semibold">{moduleData.name}</h1>
              <p className="text-xs text-muted-foreground">{moduleData.category}</p>
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
            icon: moduleData.icon || "📦",
            slug: moduleData.slug,
            runtime_type: runtimeType as "iframe" | "embedded" | "external" | "native" | undefined,
            app_url: appUrl,
            external_url: externalUrl,
            entry_component: entryComponent,
          }}
          installation={{
            id: installation.id,
            settings: (installation.settings || {}) as Record<string, unknown>,
          }}
          clientId={clientData.id}
          agencyId={clientData.agency_id || undefined}
        />
      </div>
    </div>
  );
}
