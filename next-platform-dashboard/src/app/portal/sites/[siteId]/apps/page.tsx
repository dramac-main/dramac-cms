import { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PortalHeader } from "@/components/portal/portal-header";
import { AppsGrid } from "@/components/portal/apps/apps-grid";
import { EmptyAppsState } from "@/components/portal/apps/empty-apps-state";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

interface SiteInstallation {
  id: string;
  installed_at: string;
  settings: Record<string, unknown>;
  custom_name: string | null;
  custom_icon: string | null;
  module: Record<string, unknown>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { siteId } = await params;
  const supabase = await createClient();
  
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

export default async function SiteAppsPage({ params }: PageProps) {
  const { siteId } = await params;
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;

  if (!impersonatingClientId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get impersonating user info
  const { data: { user } } = await supabase.auth.getUser();

  // Get client info
  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", impersonatingClientId)
    .single();

  if (!client) {
    redirect("/dashboard");
  }

  // Verify site belongs to client
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("client_id", client.id)
    .single();

  if (siteError || !site) {
    notFound();
  }

  // Get site-level module installations (separate queries - no FK relationship)
  const { data: rawInstallations } = await supabase
    .from("site_module_installations")
    .select("id, module_id, installed_at, settings, custom_name, custom_icon")
    .eq("site_id", siteId)
    .eq("is_enabled", true)
    .order("installed_at", { ascending: false });

  // Fetch modules separately if there are installations
  let installedModules: Array<Record<string, unknown>> = [];
  if (rawInstallations?.length) {
    const moduleIds = rawInstallations.map((i) => i.module_id);
    const { data: modules } = await supabase
      .from("modules_v2")
      .select("*")
      .in("id", moduleIds)
      .eq("is_active", true);

    const moduleMap = new Map((modules || []).map((m) => [m.id, m]));
    
    installedModules = rawInstallations
      .filter((i) => moduleMap.has(i.module_id))
      .map((i) => ({
        ...(moduleMap.get(i.module_id) as Record<string, unknown>),
        installation_id: i.id,
        installed_at: i.installed_at,
        settings: i.settings || {},
        custom_name: i.custom_name,
        custom_icon: i.custom_icon,
      }));
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader 
        clientName={client.name} 
        isImpersonating={true}
        impersonatorEmail={user?.email}
      />
      
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Globe className="h-8 w-8" />
                  Site Apps
                </h1>
                <p className="text-muted-foreground">
                  Apps installed on {site.name}
                </p>
              </div>
            </div>
          </div>

          {/* Apps Grid */}
          {installedModules.length === 0 ? (
            <EmptyAppsState 
              title="No Site Apps"
              description="There are no apps installed specifically for this site. Contact your agency to add site-level functionality."
              showBrowseButton={false}
            />
          ) : (
            <AppsGrid 
              modules={installedModules as Parameters<typeof AppsGrid>[0]["modules"]} 
              basePath={`/portal/sites/${siteId}/apps`}
            />
          )}
        </div>
      </main>
    </div>
  );
}
