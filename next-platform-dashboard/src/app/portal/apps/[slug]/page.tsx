import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Settings, Maximize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppLauncher } from "@/components/portal/apps/app-launcher";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ClientInstallation {
  id: string;
  settings: Record<string, unknown>;
  custom_name: string | null;
  is_active: boolean;
}

interface ModuleData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  runtime_type?: string;
  app_url?: string;
  external_url?: string;
  entry_component?: string;
  settings_schema?: Record<string, unknown>;
  is_active: boolean;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: module } = await supabase
    .from("modules")
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

  // Get the module
  const { data: moduleData, error: moduleError } = await supabase
    .from("modules")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (moduleError || !moduleData) {
    notFound();
  }

  const module = moduleData as unknown as ModuleData;

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
  const { data: clientInstallation } = await supabase
    .from("client_module_installations" as "modules")
    .select("*")
    .eq("client_id", clientData.id)
    .eq("module_id", module.id)
    .eq("is_active", true)
    .single() as unknown as { data: ClientInstallation | null };

  // If no client installation, check agency subscription as fallback
  if (!clientInstallation) {
    const { data: subscription } = await supabase
      .from("agency_module_subscriptions" as "module_subscriptions")
      .select("*")
      .eq("agency_id", clientData.agency_id)
      .eq("module_id", module.id)
      .eq("status", "active")
      .single();

    // Also check legacy table
    let legacySub = null;
    if (!subscription) {
      const { data: legacy } = await supabase
        .from("module_subscriptions")
        .select("*")
        .eq("agency_id", clientData.agency_id)
        .eq("module_id", module.id)
        .eq("status", "active")
        .single();
      legacySub = legacy;
    }

    if (!subscription && !legacySub) {
      redirect("/portal/apps");
    }
  }

  // Create installation object for the launcher
  const installation = clientInstallation || {
    id: module.id,
    settings: {},
    custom_name: null,
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
            <span className="text-2xl">{module.icon || "📦"}</span>
            <div>
              <h1 className="font-semibold">{installation.custom_name || module.name}</h1>
              <p className="text-xs text-muted-foreground">{module.category}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {module.settings_schema && (
            <Button variant="ghost" size="icon" title="App Settings">
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {module.external_url && (
            <Button variant="ghost" size="icon" asChild title="Open in New Window">
              <a href={module.external_url} target="_blank" rel="noopener noreferrer">
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
            id: module.id,
            name: module.name,
            description: module.description,
            icon: module.icon,
            slug: module.slug,
            runtime_type: module.runtime_type as "iframe" | "embedded" | "external" | "native" | undefined,
            app_url: module.app_url,
            external_url: module.external_url,
            entry_component: module.entry_component,
          }}
          installation={{
            id: installation.id,
            settings: installation.settings || {},
            custom_name: installation.custom_name,
          }}
          clientId={clientData.id}
          agencyId={clientData.agency_id || undefined}
        />
      </div>
    </div>
  );
}
